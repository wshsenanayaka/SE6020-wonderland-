import { updateLiveParkInfo } from '../services/liveParkInfoService.js';

export async function updateLiveParkInfoController(request, response) {
  if ((request.cookies.wonderland_profile_type || '') !== 'admin') {
    return response.status(403).json({ success: false, message: 'Administrator login required.' });
  }

  const liveInfo = await updateLiveParkInfo(request.body);
  return response.json({
    success: true,
    message: 'Live park information updated successfully.',
    ...liveInfo,
  });
}
