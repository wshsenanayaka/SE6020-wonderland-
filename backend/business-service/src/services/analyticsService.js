import { query } from '../db.js';

export async function recordActivityImpressions(activityIds) {
  const ids = [...new Set(activityIds)]
    .map((id) => Number(id))
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 50);

  if (ids.length === 0) {
    return 0;
  }

  const requestedActivities = ids.map(() => 'SELECT ? AS activity_id').join(' UNION ALL ');
  await query(
    `INSERT INTO activity_daily_metrics (metric_date, activity_id, impressions)
     SELECT CURDATE(), requested.activity_id, 1
     FROM (${requestedActivities}) AS requested
     INNER JOIN activities_tb activities ON activities.id = requested.activity_id
     ON DUPLICATE KEY UPDATE impressions = impressions + 1`,
    ids,
  );

  return ids.length;
}
