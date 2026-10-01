// ============================================================
// mockVenues.js  —  Static catalog constants only
// All venue business data is dynamic (from owner registrations)
// ============================================================

// Venue catalog is populated dynamically from owner registrations and venue management
export const PUNE_VENUES = [];

export const AVAILABLE_SPORTS = [
  'All',
  'Badminton',
  'Cricket',
  'Football',
  'Tennis',
  'Basketball',
  'Pickleball',
];

export const PUNE_NEIGHBORHOODS = [
  'All Areas',
  'Koregaon Park',
  'Viman Nagar',
  'Kalyani Nagar',
  'Baner',
  'FC Road',
  'Aundh',
  'Kothrud',
];

export const DISTANCE_OPTIONS = [
  { id: 'any', label: 'Any distance', maxKm: 999 },
  { id: '2km', label: 'Under 2 km', maxKm: 2 },
  { id: '5km', label: 'Under 5 km', maxKm: 5 },
  { id: '10km', label: 'Under 10 km', maxKm: 10 },
];

// Dates are generated dynamically at runtime — see generateUpcomingDates() in App.jsx
export const UPCOMING_DATES = [];

// Slots are generated dynamically at runtime based on the selected court's operating hours
export const INITIAL_TIME_SLOTS = {
  morning: [],
  afternoon: [],
  evening: [],
};

export const TIME_SLOTS = INITIAL_TIME_SLOTS;

// Coupon catalog — these are legitimate promotional codes managed by the platform
export const AVAILABLE_COUPONS = [
  {
    code: 'ARENA50',
    title: '₹50 Flat Discount',
    description: 'Flat ₹50 off on court bookings over ₹300',
    discountType: 'flat',
    discountValue: 50,
    minAmount: 300,
  },
  {
    code: 'FIRSTMATCH',
    title: '₹100 New Player Discount',
    description: 'Flat ₹100 off on your game session',
    discountType: 'flat',
    discountValue: 100,
    minAmount: 350,
  },
  {
    code: 'SMASH15',
    title: '15% Off Racket & Turf',
    description: '15% discount up to ₹120',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 120,
    minAmount: 400,
  },
];

// Equipment add-ons catalog — sport-based rental/purchase options offered at venues
export const SPORT_EQUIPMENT_ADDONS = {
  Badminton: [
    { id: 'badminton-racket', name: 'Yonex Carbonex Pro Racket', price: 60, unit: 'racket', desc: 'Pre-strung, grip included' },
    { id: 'badminton-shuttle', name: 'Mavis 350 Shuttles (Pack of 3)', price: 90, unit: 'pack', desc: 'Tournament nylon shuttles' },
    { id: 'badminton-shoes', name: 'Non-Marking Court Shoes', price: 80, unit: 'pair', desc: 'Sizes UK 7-10 at front desk' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
  Tennis: [
    { id: 'tennis-racket', name: 'Head Tour Pro Tennis Racket', price: 90, unit: 'racket', desc: 'Pro weight & balance' },
    { id: 'tennis-balls', name: 'Wilson Championship Balls (Can of 3)', price: 120, unit: 'can', desc: 'Pressurized extra-duty felt' },
    { id: 'tennis-towel', name: 'Arena Microfiber Sports Towel', price: 40, unit: 'towel', desc: 'Clean sanitized towel' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
  Cricket: [
    { id: 'cricket-bat', name: 'Kashmir Willow Turf Bat', price: 80, unit: 'bat', desc: 'Lightweight tennis ball bat' },
    { id: 'cricket-ball', name: 'Heavy Tennis Cricket Ball (Pack of 2)', price: 70, unit: 'pack', desc: 'High seam visibility' },
    { id: 'cricket-gloves', name: 'Batting Inner Gloves', price: 40, unit: 'pair', desc: 'Sweat absorbent pair' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
  Football: [
    { id: 'football-ball', name: 'FIFA Quality Pro Size 5 Football', price: 70, unit: 'ball', desc: 'High turf grip & bounce' },
    { id: 'team-bibs', name: 'Team Bibs (Set of 10 Neon/Blue)', price: 90, unit: 'set', desc: '5 vs 5 match bibs' },
    { id: 'gk-gloves', name: 'Goalkeeper Padded Gloves', price: 60, unit: 'pair', desc: 'Finger protection foam' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
  Basketball: [
    { id: 'basketball-ball', name: 'Spalding Composite Leather Ball', price: 60, unit: 'ball', desc: 'Official size 7 basketball' },
    { id: 'team-bibs', name: 'Team Bibs (Set of 10)', price: 90, unit: 'set', desc: 'Match practice jerseys' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
  Pickleball: [
    { id: 'pickleball-paddle', name: 'Fiberglass Pickleball Paddle', price: 50, unit: 'paddle', desc: 'Lightweight honeycomb core' },
    { id: 'pickleball-balls', name: 'USAPA Indoor Pickleballs (Pack of 3)', price: 60, unit: 'pack', desc: '26 precision holes' },
    { id: 'energy-drink', name: 'Gatorade Sports Drink (500ml)', price: 50, unit: 'bottle', desc: 'Electrolyte hydration' },
  ],
};

export const INITIAL_USER_BOOKINGS = [];
export const INITIAL_NOTIFICATIONS = [];

export const INITIAL_WALLET_DATA = {
  balance: 0,
  mainBalance: 0,
  promoCashback: 0,
  currency: '₹',
  accountNumber: 'ARENA-WLT-' + Math.floor(100000 + Math.random() * 900000),
  isKycVerified: false,
  transactions: [],
};

export const INITIAL_REFUNDS_DATA = [];
