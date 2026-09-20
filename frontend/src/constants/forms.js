export const categories = ['All', 'Thrill', 'Kids', 'Water', 'Interactive'];

export const emptyLogin = {
  profile_type: 'visitor',
  email: '',
  password: '',
};

export const emptyRegister = {
  full_name: '',
  email: '',
  contact_number: '',
  password: '',
  confirm_password: '',
};

export const emptyBooking = {
  visitor_name: '',
  email: '',
  visit_date: '',
  preferred_time_slot: '',
  ticket_type: '',
  quantity: 1,
  contact_number: '',
};

export const emptyActivity = {
  category: 'Thrill',
  ride_type: 'Thrill Ride',
  name: 'Skybolt Hyper Coaster',
  tagline: 'High speed launches, skyline drops, and a full-loop finish.',
  duration_label: '3 min',
  requirement_label: 'Min 140cm',
  icon: 'mdi-rocket',
  color: '#ee3e50',
  zone: 'Summit Zone',
  wait: 3,
  capacity: 96,
  status: 'Operational',
  is_visible: true,
  background_image_path: 'assets/images/wonderland-hero.png',
};

export const emptyTicketPass = {
  ticket_tier: '',
  guests: '',
  currency_code: 'USD',
  ticket_price_indicative: '',
  effective_price_per_guest: '',
};
