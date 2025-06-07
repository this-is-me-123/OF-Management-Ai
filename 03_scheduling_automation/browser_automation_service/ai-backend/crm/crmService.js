const NEW_USER_RECENCY_DAYS = 30;
const ACTIVE_CHATTER_MESSAGE_THRESHOLD = 20;
const NEW_USER_TRIGGER_HOURS = 24;
const MIN_USER_AGE_DAYS_FOR_INACTIVITY = 7; // User must be at least this old to be considered for inactivity
const INACTIVITY_PERIOD_DAYS = 30; // No messages in this period to be considered inactive
const REENGAGEMENT_COOLDOWN_DAYS = 30; // Min days before sending another re-engagement or major outreach

/**
 * Segments users based on predefined criteria.
 * @returns {Promise<object>} An object containing arrays of users for each segment.
 *                            Example: { newUsers: [...], activeChatters: [...] }
 */
async function segmentUsers(supabase) {
  console.log('Starting user segmentation...');
  const segments = {
    newUsers: [],
    activeChatters: [],
    inactiveUsers: [],
  };

  try {
    // Segment 1: New Users (joined in the last NEW_USER_RECENCY_DAYS days)
    const { data: newUsersData, error: newUsersError } = await supabase
      .from('users')
      .select('*')
      .gte('joined_at', new Date(Date.now() - NEW_USER_RECENCY_DAYS * 24 * 60 * 60 * 1000).toISOString());

    if (newUsersError) {
      console.error('Error fetching new users:', newUsersError.message);
    } else {
      segments.newUsers = newUsersData || [];
      console.log(`Found ${segments.newUsers.length} new users.`);
    }

    // Segment 2: Active Chatters (more than ACTIVE_CHATTER_MESSAGE_THRESHOLD messages)
    // Call the RPC function to get user_ids of active chatters.
    const { data: activeChatterIdsData, error: rpcError } = await supabase
      .rpc('get_active_chatter_ids', { message_threshold: ACTIVE_CHATTER_MESSAGE_THRESHOLD });

    if (rpcError) {
      console.error('Error calling get_active_chatter_ids RPC:', rpcError.message);
    } else if (activeChatterIdsData && activeChatterIdsData.length > 0) {
      // The RPC returns an array of objects like [{user_id: 'uuid'}, ...]
      const activeUserIds = activeChatterIdsData.map(item => item.user_id);
      
      const { data: activeChattersData, error: activeChattersError } = await supabase
        .from('users')
        .select('*')
        .in('id', activeUserIds);

      if (activeChattersError) {
        console.error('Error fetching active chatter user details:', activeChattersError.message);
      } else {
        segments.activeChatters = activeChattersData || [];
        console.log(`Found ${segments.activeChatters.length} active chatters.`);
      }
    } else {
      console.log('No users meet the active chatter threshold (via RPC).');
    }

  } catch (error) {
    console.error('An unexpected error occurred during user segmentation:', error.message);
  }
  
    // Segment 3: Inactive Users
    const { data: inactiveUserIdsData, error: inactiveRpcError } = await supabase
      .rpc('get_inactive_user_ids', {
        min_age_days: MIN_USER_AGE_DAYS_FOR_INACTIVITY,
        inactivity_period_days: INACTIVITY_PERIOD_DAYS
      });

    if (inactiveRpcError) {
      console.error('Error calling get_inactive_user_ids RPC:', inactiveRpcError.message);
    } else if (inactiveUserIdsData && inactiveUserIdsData.length > 0) {
      const inactiveUserIds = inactiveUserIdsData.map(item => item.user_id);
      
      const { data: inactiveUsersData, error: inactiveUsersError } = await supabase
        .from('users')
        .select('*')
        .in('id', inactiveUserIds);

      if (inactiveUsersError) {
        console.error('Error fetching inactive user details:', inactiveUsersError.message);
      } else {
        segments.inactiveUsers = inactiveUsersData || [];
        console.log(`Found ${segments.inactiveUsers.length} inactive users.`);
      }
    } else {
      console.log('No users meet the inactivity criteria.');
    }

  console.log('User segmentation completed.');
  return segments;
}

/**
 * Runs predefined CRM triggers.
 */
async function runTriggers(supabase) {
  console.log('Starting CRM trigger processing...');

  try {
    // First, get all user segments
    const segments = await segmentUsers(supabase);
    // Note: segmentUsers already logs its own start/completion and segment counts.

    // It's important that segmentUsers itself does not call runTriggers to avoid infinite loops.
    // Trigger 1: New User Added (joined in the last NEW_USER_TRIGGER_HOURS hours)
    const { data: recentUsersData, error: recentUsersError } = await supabase
      .from('users')
      .select('id, username, of_user_id, joined_at')
      .gte('joined_at', new Date(Date.now() - NEW_USER_TRIGGER_HOURS * 60 * 60 * 1000).toISOString());

    if (recentUsersError) {
      console.error('Error fetching recent users for new user trigger:', recentUsersError.message);
    } else if (recentUsersData && recentUsersData.length > 0) {
      console.log(`Processing new user trigger for ${recentUsersData.length} users...`);
      for (const user of recentUsersData) {
        console.log(`  [NEW USER TRIGGER] User: ${user.username} (ID: ${user.id}, OF_ID: ${user.of_user_id}) joined at ${user.joined_at}`);
        const action = {
          user_id: user.id,
          trigger_type: 'new_user_welcome',
          action_details: {
            message_template_id: 'welcome_dm_template_v1', // Example template ID
            of_user_id: user.of_user_id,
            username: user.username
          },
          // status defaults to 'pending'
        };

        const { data: newAction, error: insertError } = await supabase
          .from('crm_actions')
          .insert(action)
          .select();

        if (insertError) {
          console.error(`    Failed to create CRM action for new user ${user.username} (ID: ${user.id}):`, insertError.message);
        } else {
          console.log(`    Successfully created CRM action for new user ${user.username} (ID: ${newAction[0]?.id})`);
        }
      }
    } else {
      console.log('No new users found for the new user trigger in the last 24 hours.');
    }

    // Trigger 2: First Message Sent
    // TODO: Implementing a 'First Message Sent' trigger accurately in a batch job is complex.
    // It ideally requires real-time event handling (e.g., Supabase Realtime) or 
    // maintaining state (e.g., a 'first_message_sent_at' timestamp in the 'users' table 
    // or a separate 'user_triggered_events' table) to avoid re-processing.
    // 
    // A simplified batch approach could involve:
    // 1. Querying users who have messages.
    // 2. For each user, checking if their earliest message falls within the trigger window (e.g., last 24h).
    // 3. Checking if this trigger has already been processed for them (requires state).
    // 
    // For now, this is a placeholder for future, more robust implementation.
    // console.log('[FIRST MESSAGE TRIGGER] Placeholder: This trigger requires real-time processing or state management for accurate execution.');

    // Trigger 2: First Message Sent
    console.log('\nProcessing First Message Sent Trigger...');
    const { data: usersWithMessageData, error: usersWithMessageError } = await supabase
      .rpc('get_user_ids_with_messages');

    if (usersWithMessageError) {
      console.error('  Error fetching user IDs with messages (RPC):', usersWithMessageError.message);
    } else if (usersWithMessageData && usersWithMessageData.length > 0) {
      const userIdsWithMessages = usersWithMessageData.map(u => u.user_id);
      
      // Fetch users who have sent messages AND for whom the trigger hasn't been processed yet
      const { data: usersToProcess, error: usersToProcessError } = await supabase
        .from('users')
        .select('id, username, of_user_id') // Select only needed fields
        .in('id', userIdsWithMessages)
        .is('first_message_trigger_processed_at', null);

      if (usersToProcessError) {
        console.error('  Error fetching users for First Message Trigger:', usersToProcessError.message);
      } else if (usersToProcess && usersToProcess.length > 0) {
        console.log(`  Found ${usersToProcess.length} users who sent their first message and need processing.`);
        for (const user of usersToProcess) {
          console.log(`    Processing user: ${user.username} (ID: ${user.id})`);
          const action = {
            user_id: user.id,
            trigger_type: 'first_message_follow_up',
            action_details: {
              message_template_id: 'first_message_reply_template_v1', // Example
              of_user_id: user.of_user_id,
              username: user.username
            }
          };

          const { data: newAction, error: insertActionError } = await supabase
            .from('crm_actions')
            .insert(action)
            .select('id'); // Only select id for confirmation

          if (insertActionError) {
            console.error(`      Failed to create CRM action for first message (User ID: ${user.id}):`, insertActionError.message);
          } else {
            console.log(`      Successfully created CRM action (ID: ${newAction[0]?.id}) for first message (User ID: ${user.id}).`);
            // Now, mark the trigger as processed for this user
            const { error: updateUserError } = await supabase
              .from('users')
              .update({ first_message_trigger_processed_at: new Date().toISOString() })
              .eq('id', user.id);

            if (updateUserError) {
              console.error(`      Failed to update first_message_trigger_processed_at for user ${user.id}:`, updateUserError.message);
            } else {
              console.log(`      Successfully marked first message trigger as processed for user ${user.id}.`);
            }
          }
        }
      } else {
        console.log('  No users found who sent a first message and need processing (all already processed or no messages).');
      }
    } else {
      console.log('  No users found with any messages.');
    }

    // Trigger 3: Inactive User Re-engagement
    console.log('\nProcessing Inactive User Re-engagement Trigger...');
    if (segments.inactiveUsers && segments.inactiveUsers.length > 0) {
      console.log(`  Found ${segments.inactiveUsers.length} inactive users to consider for re-engagement.`);
      for (const user of segments.inactiveUsers) {
        console.log(`    Considering inactive user: ${user.username} (ID: ${user.id})`);

        // Cooldown check: Has a significant outreach action been created recently or is pending?
        const cooldownDate = new Date(Date.now() - REENGAGEMENT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const significantActionTypes = ['new_user_welcome', 'first_message_follow_up', 'inactive_user_reengagement'];

        const { data: recentActions, error: recentActionsError } = await supabase
          .from('crm_actions')
          .select('id, trigger_type, status, created_at')
          .eq('user_id', user.id)
          .in('trigger_type', significantActionTypes)
          .or(`status.eq.pending,created_at.gte.${cooldownDate}`)
          .limit(1);

        if (recentActionsError) {
          console.error(`      Error checking recent actions for user ${user.id}:`, recentActionsError.message);
          continue; // Skip to next user on error
        }

        if (recentActions && recentActions.length > 0) {
          console.log(`      Skipping user ${user.id} due to recent/pending action: Type: ${recentActions[0].trigger_type}, Status: ${recentActions[0].status}, Created: ${recentActions[0].created_at}`);
          continue;
        }

        // If no recent/pending significant action, create re-engagement action
        const action = {
          user_id: user.id,
          trigger_type: 'inactive_user_reengagement',
          action_details: {
            message_template_id: 'inactive_reengage_template_v1', // Example template ID
            of_user_id: user.of_user_id,
            username: user.username
          },
          // status defaults to 'pending'
        };

        const { data: newAction, error: insertError } = await supabase
          .from('crm_actions')
          .insert(action)
          .select('id');

        if (insertError) {
          console.error(`      Failed to create re-engagement CRM action for user ${user.username} (ID: ${user.id}):`, insertError.message);
        } else {
          console.log(`      Successfully created re-engagement CRM action (ID: ${newAction[0]?.id}) for user ${user.username} (ID: ${user.id})`);
        }
      }
    } else {
      console.log('  No inactive users found to process for re-engagement.');
    }

    // Trigger 4: 1-Month Subscription Anniversary
    console.log('\nProcessing 1-Month Subscription Anniversary Trigger...');
    const oneMonthAgoUpper = new Date();
    oneMonthAgoUpper.setDate(oneMonthAgoUpper.getDate() - 29); // Approx 1 month (29 days ago)
    const oneMonthAgoLower = new Date();
    oneMonthAgoLower.setDate(oneMonthAgoLower.getDate() - 31); // Approx 1 month (31 days ago)

    const { data: anniversaryUsers, error: anniversaryUsersError } = await supabase
      .from('users')
      .select('id, username, of_user_id, joined_at')
      .lte('joined_at', oneMonthAgoUpper.toISOString()) // Joined on or before 29 days ago
      .gte('joined_at', oneMonthAgoLower.toISOString()); // Joined on or after 31 days ago

    if (anniversaryUsersError) {
      console.error('  Error fetching users for 1-month anniversary trigger:', anniversaryUsersError.message);
    } else if (anniversaryUsers && anniversaryUsers.length > 0) {
      console.log(`  Found ${anniversaryUsers.length} users for 1-month anniversary consideration.`);
      for (const user of anniversaryUsers) {
        console.log(`    Considering user ${user.username} (ID: ${user.id}) for 1-month anniversary. Joined: ${user.joined_at}`);

        // Check if this anniversary action has already been created
        const { data: existingAnniversaryAction, error: checkError } = await supabase
          .from('crm_actions')
          .select('id')
          .eq('user_id', user.id)
          .eq('trigger_type', 'subscription_anniversary_1m')
          .limit(1);

        if (checkError) {
          console.error(`      Error checking existing anniversary actions for user ${user.id}:`, checkError.message);
          continue; // Skip to next user
        }

        if (existingAnniversaryAction && existingAnniversaryAction.length > 0) {
          console.log(`      1-month anniversary action already exists for user ${user.id}. Skipping.`);
          continue;
        }

        const action = {
          user_id: user.id,
          trigger_type: 'subscription_anniversary_1m',
          action_details: {
            message_template_id: 'anniversary_1month_dm_v1',
            of_user_id: user.of_user_id,
            username: user.username
          }
        };

        const { data: newAction, error: insertError } = await supabase
          .from('crm_actions')
          .insert(action)
          .select('id');

        if (insertError) {
          console.error(`      Failed to create 1-month anniversary CRM action for user ${user.username} (ID: ${user.id}):`, insertError.message);
        } else {
          console.log(`      Successfully created 1-month anniversary CRM action (ID: ${newAction[0]?.id}) for user ${user.username} (ID: ${user.id})`);
        }
      }
    } else {
      console.log('  No users found for 1-month anniversary trigger in the target window.');
    }

  } catch (error) {
    console.error('An unexpected error occurred during CRM trigger processing:', error.message);
  }
  
  console.log('CRM trigger processing completed.');
}

module.exports = { segmentUsers, runTriggers };
