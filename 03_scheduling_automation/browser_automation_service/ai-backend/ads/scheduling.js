/**
 * Schedules an ad by inserting its details into the 'scheduled_ads' table.
 * 
 * @param {object} adDetails - The details of the ad to schedule.
 * @param {string} adDetails.caption - The ad caption text.
 * @param {string} [adDetails.image_url] - Optional URL of the ad image.
 * @param {string[]} adDetails.platforms - Array of platform names (e.g., ['OnlyFans', 'Twitter']).
 * @param {string|Date} adDetails.scheduled_at - The ISO 8601 string or Date object for when to post.
 * @param {string} [adDetails.ad_campaign_id] - Optional campaign ID.
 * @returns {Promise<object|null>} The inserted ad record from Supabase or null if an error occurred.
 */
async function scheduleAd(supabase, adDetails) {
  const { caption, image_url, platforms, scheduled_at, ad_campaign_id } = adDetails;

  if (!caption || !platforms || !scheduled_at) {
    console.error('[SchedulingService] Missing required ad details for scheduling: caption, platforms, or scheduled_at.');
    return null;
  }

  if (!Array.isArray(platforms) || platforms.length === 0) {
    console.error('[SchedulingService] Platforms must be a non-empty array.');
    return null;
  }

  // Ensure scheduled_at is a valid ISO string or Date object
  let isoScheduledAt;
  try {
    isoScheduledAt = new Date(scheduled_at).toISOString();
  } catch (e) {
    console.error('[SchedulingService] Invalid scheduled_at date format:', scheduled_at);
    return null;
  }

  const adToInsert = {
    caption,
    image_url: image_url || null, // Ensure null if undefined
    platforms,
    scheduled_at: isoScheduledAt,
    ad_campaign_id: ad_campaign_id || null, // Ensure null if undefined
    status: 'pending', // Default status
  };

  try {
    const { data, error } = await supabase
      .from('scheduled_ads')
      .insert([adToInsert])
      .select(); // .select() returns the inserted row(s)

    if (error) {
      console.error('[SchedulingService] Error scheduling ad in Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      console.log('[SchedulingService] Ad scheduled successfully:', data[0]);
      return data[0];
    }
    console.warn('[SchedulingService] Ad possibly inserted but no data returned from Supabase.');
    return null; // Should ideally not happen if insert was successful and select() was used

  } catch (e) {
    console.error('[SchedulingService] Unexpected error during ad scheduling:', e.message);
    return null;
  }
}

module.exports = { scheduleAd };
