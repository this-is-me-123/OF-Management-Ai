const supabase = require('../supabase_integration'); // Assuming supabase_integration.js is one level up

/**
 * Calculates the churn rate for a given period (e.g., monthly).
 * Assumes a 'subscriptions' table with fields like:
 *  - user_id (UUID, FK to users.id)
 *  - status (TEXT: 'active', 'cancelled', 'expired')
 *  - started_at (TIMESTAMPTZ)
 *  - current_period_ends_at (TIMESTAMPTZ)
 *  - cancelled_at (TIMESTAMPTZ, nullable)
 *
 * Churn Rate = (Subscribers who churned in period / Active subscribers at start of period) * 100
 * A user is considered churned if their subscription status became 'cancelled' OR 'expired'
 * during the period, and they were active at the start of the period or became active during it.
 *
 * @param {Date} periodStart Date object for the start of the period.
 * @param {Date} periodEnd Date object for the end of the period.
 * @returns {Promise<number|null>} The churn rate as a percentage, or null if calculation is not possible.
 */
async function calculateChurnRate(periodStart, periodEnd) {
  console.log(`Calculating churn rate from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
  if (!(periodStart instanceof Date) || !(periodEnd instanceof Date) || periodStart >= periodEnd) {
    console.error('Invalid period dates provided for churn rate calculation.');
    return null;
  }

  try {
    // 1. Get active subscribers at the start of the period
    const { count: activeAtStartCount, error: activeAtStartError } = await supabase
      .from('subscriptions')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('started_at', periodStart.toISOString())
      .gt('current_period_ends_at', periodStart.toISOString()); // Ensure they were active *through* the start

    if (activeAtStartError) {
      console.error('Error fetching active subscribers at start of period:', activeAtStartError.message);
      return null;
    }
    if (activeAtStartCount === 0) {
      console.warn('No active subscribers at the start of the period. Churn rate is 0 or undefined.');
      return 0;
    }

    // 2. Get subscribers who churned during the period
    // Churned = status became 'cancelled' OR 'expired' within the period.
    // We need to ensure these users were active at some point before or during the period start.
    const { data: churnedUsersData, error: churnedUsersError } = await supabase
      .from('subscriptions')
      .select('user_id, status, cancelled_at, current_period_ends_at')
      // Condition for being active at period start or becoming active during the period
      .or(`and(status.neq.active,started_at.lt.${periodEnd.toISOString()}),and(status.eq.active,started_at.lt.${periodStart.toISOString()})`)
      // Condition for churn event happening within the period
      .or(`and(status.eq.cancelled,cancelled_at.gte.${periodStart.toISOString()},cancelled_at.lt.${periodEnd.toISOString()}),and(status.eq.expired,current_period_ends_at.gte.${periodStart.toISOString()},current_period_ends_at.lt.${periodEnd.toISOString()})`);

    if (churnedUsersError) {
      console.error('Error fetching churned subscribers:', churnedUsersError.message);
      return null;
    }
    
    // Filter to ensure we only count unique users who were genuinely active then churned
    // This part can be complex and might need refinement based on exact subscription lifecycle logic.
    // For simplicity, we'll count distinct user_ids from the churnedUsersData query.
    // A more robust approach might involve checking previous statuses if a user re-subscribes and cancels within the same period.
    const churnedUserIds = new Set(churnedUsersData.map(sub => sub.user_id));
    const numberOfChurnedSubscribers = churnedUserIds.size;

    if (activeAtStartCount === 0) {
        console.log('No active subscribers at the start of the period. Churn rate is effectively 0 or N/A.');
        return 0;
    }

    const churnRate = (numberOfChurnedSubscribers / activeAtStartCount) * 100;
    console.log(`Active at start: ${activeAtStartCount}, Churned in period: ${numberOfChurnedSubscribers}, Churn Rate: ${churnRate.toFixed(2)}%`);
    return parseFloat(churnRate.toFixed(2));

  } catch (error) {
    console.error('Unexpected error during churn rate calculation:', error.message);
    return null;
  }
}

/**
 * Gets the top tippers for a given period.
 * Assumes a 'tips' table with fields like:
 *  - tipper_user_id (UUID, FK to users.id - who GAVE the tip)
 *  - recipient_user_id (UUID, FK to users.id - who RECEIVED the tip)
 *  - amount (NUMERIC)
 *  - tipped_at (TIMESTAMPTZ)
 *
 * @param {number} limit The number of top tippers to return.
 * @param {Date} [periodStart] Optional start date for the period.
 * @param {Date} [periodEnd] Optional end date for the period.
 * @returns {Promise<Array<object>|null>} An array of top tipper objects { user_id, username, total_tipped }, or null on error.
 */
async function getTopTippers(limit = 10, periodStart, periodEnd) {
  console.log(`Fetching top ${limit} tippers...`);
  if (limit <= 0) {
    console.error('Limit must be a positive number.');
    return null;
  }

  try {
    let query = supabase
      .from('tips')
      .select('tipper_user_id, total_amount:amount.sum()')
      .group('tipper_user_id')
      .order('total_amount', { ascending: false })
      .limit(limit);

    if (periodStart instanceof Date && periodEnd instanceof Date && periodStart < periodEnd) {
      console.log(`Filtering tips from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
      query = query.gte('tipped_at', periodStart.toISOString()).lt('tipped_at', periodEnd.toISOString());
    } else if (periodStart || periodEnd) {
      console.warn('Both periodStart and periodEnd must be valid dates if one is provided. Ignoring period filter.');
    }

    const { data: topTippersData, error: topTippersError } = await query;

    if (topTippersError) {
      console.error('Error fetching top tippers:', topTippersError.message);
      return null;
    }

    if (!topTippersData || topTippersData.length === 0) {
      console.log('No tippers found for the given criteria.');
      return [];
    }

    // Fetch usernames for the top tippers
    const tipperUserIds = topTippersData.map(t => t.tipper_user_id);
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', tipperUserIds);

    if (usersError) {
      console.error('Error fetching usernames for top tippers:', usersError.message);
      // Return data without usernames if fetching users fails
      return topTippersData.map(t => ({ user_id: t.tipper_user_id, total_tipped: t.total_amount, username: 'N/A' }));
    }

    const usersMap = new Map(usersData.map(u => [u.id, u.username]));

    const result = topTippersData.map(tipper => ({
      user_id: tipper.tipper_user_id,
      username: usersMap.get(tipper.tipper_user_id) || 'Unknown User',
      total_tipped: tipper.total_amount,
    }));
    
    console.log('Top tippers fetched successfully:', result);
    return result;

  } catch (error) {
    console.error('Unexpected error while getting top tippers:', error.message);
    return null;
  }
}

module.exports = { calculateChurnRate, getTopTippers };
