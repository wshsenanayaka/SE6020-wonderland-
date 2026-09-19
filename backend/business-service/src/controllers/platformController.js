import { behaviourMix, operations, parkStats } from '../data/defaultData.js';
import { allActivities, toPublicCard, visibleActivities } from '../services/activityService.js';
import { recentBookings } from '../services/bookingService.js';
import { allTicketPasses, toTicketTypesMap } from '../services/ticketPassService.js';

export async function platformData(request, response) {
  const activities = await allActivities();
  const visible = await visibleActivities();
  const ticketPasses = await allTicketPasses();
  const bookings = await recentBookings(10);
  const profileName = request.cookies.wonderland_profile_name || '';
  const profileEmail = request.cookies.wonderland_profile_email || '';
  const profileType = request.cookies.wonderland_profile_type || '';

  response.json({
    attractions: visible.map(toPublicCard),
    adminActivities: activities.map(toPublicCard),
    ticketPasses,
    ticketTypes: toTicketTypesMap(ticketPasses),
    operations,
    parkStats,
    behaviourMix,
    recentBookings: bookings,
    profile: {
      name: profileName,
      email: profileEmail,
      type: profileType,
      isLoggedIn: Boolean(profileName),
    },
    auth: {
      cognitoEnabled: false,
    },
  });
}
