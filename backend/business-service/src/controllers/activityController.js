import { createActivity, setActivityVisibility } from '../services/activityService.js';

export async function manageActivity(request, response) {
  const profileType = request.cookies.wonderland_profile_type || '';
  if (profileType !== 'admin') {
    return response.status(403).json({ success: false, message: 'Administrator login required.' });
  }

  const action = request.body.action || 'create';

  if (action === 'toggle') {
    await setActivityVisibility(request.body.activity_id, Number(request.body.is_visible) === 1);
    return response.json({ success: true, message: 'Activity visibility updated.' });
  }

  const created = await createActivity(request.body, request.file);
  if (!created) {
    return response.status(422).json({ success: false, message: 'Please fill all required activity fields.' });
  }

  return response.json({ success: true, message: 'Activity inserted successfully.' });
}
