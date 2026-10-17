import { recordActivityImpressions } from '../services/analyticsService.js';

export async function recordActivityImpressionsController(request, response) {
  const activityIds = Array.isArray(request.body.activity_ids) ? request.body.activity_ids : [];
  const recorded = await recordActivityImpressions(activityIds);
  return response.status(202).json({ success: true, recorded });
}
