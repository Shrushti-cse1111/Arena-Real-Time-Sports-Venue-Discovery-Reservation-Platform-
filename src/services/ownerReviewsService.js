/**
 * ownerReviewsService.js
 * Backend simulation for Arena Owner Reviews Management:
 * - GET /owner/reviews?venueId=&page=&limit=&filter=&sort=
 * - POST /owner/reviews/:reviewId/reply
 * - PUT /owner/reviews/:reviewId/reply (optional edit)
 * - Server-side ownership verification
 * - Real-time review notification listener
 */

const INITIAL_REVIEWS = [
  {
    id: 'REV-301',
    venueId: 'v-owner-demo',
    customer: { name: 'Siddharth Rao', avatar: 'S' },
    date: 'Oct 01, 2026',
    timestamp: 1790850000000,
    rating: 5,
    sport: 'Badminton',
    courtName: 'Court A',
    comment: 'The wooden flooring grip and court lighting are top tier! Check-in was completely seamless via QR pass.',
    ownerReply: null,
    ownerRepliedAt: null,
  },
  {
    id: 'REV-302',
    venueId: 'v-owner-demo',
    customer: { name: 'Ananya Sharma', avatar: 'A' },
    date: 'Sep 29, 2026',
    timestamp: 1790677200000,
    rating: 4,
    sport: 'Tennis',
    courtName: 'Court B',
    comment: 'Well maintained synthetic court. Only downside was the parking lot was quite packed on Sunday evening.',
    ownerReply: 'Thank you Ananya! We are currently expanding our designated sports parking zone to accommodate peak weekend slots.',
    ownerRepliedAt: 'Sep 30, 2026',
  },
  {
    id: 'REV-303',
    venueId: 'v-owner-demo',
    customer: { name: 'Karthik Iyer', avatar: 'K' },
    date: 'Sep 26, 2026',
    timestamp: 1790418000000,
    rating: 5,
    sport: 'Squash',
    courtName: 'Court C',
    comment: 'Air conditioned glass squash court is tournament grade. Changing rooms and drinking water stations were spotless.',
    ownerReply: null,
    ownerRepliedAt: null,
  },
  {
    id: 'REV-304',
    venueId: 'v-owner-demo',
    customer: { name: 'Megha Deshmukh', avatar: 'M' },
    date: 'Sep 22, 2026',
    timestamp: 1790072400000,
    rating: 3,
    sport: 'Badminton',
    courtName: 'Court A',
    comment: 'Court was good, but the air circulation near Court 3 could be improved during hot afternoons.',
    ownerReply: 'Hi Megha, thanks for pointing this out. We installed high-velocity exhaust fans yesterday to ensure optimal ventilation.',
    ownerRepliedAt: 'Sep 23, 2026',
  },
  {
    id: 'REV-305',
    venueId: 'v-owner-demo',
    customer: { name: 'Rohan Sen', avatar: 'R' },
    date: 'Sep 18, 2026',
    timestamp: 1789726800000,
    rating: 5,
    sport: 'Box Cricket',
    courtName: 'Box Cricket',
    comment: 'Night floodlights are super bright and turf is perfectly cushioned. Had an incredible 8-a-side match!',
    ownerReply: 'Glad you loved the turf Rohan! See you and your team again soon.',
    ownerRepliedAt: 'Sep 19, 2026',
  }
];

let _reviewsDb = [...INITIAL_REVIEWS];
let _reviewListeners = [];

/**
 * Fetch reviews with server-side pagination, filter, and sort (latest first)
 */
export async function fetchOwnerReviews({
  venueId = 'v-owner-demo',
  page = 1,
  limit = 4,
  filter = 'all', // 'all' | 'unreplied' | 'replied'
  ratingFilter = 'all', // 'all' | '5' | '4' | '3' | '2' | '1'
  simulateError = false
} = {}) {
  await new Promise((r) => setTimeout(r, 450));

  if (simulateError) {
    throw new Error('Unable to load reviews. Please check your network and retry.');
  }

  // Filter by venue
  let list = _reviewsDb.filter((r) => r.venueId === venueId);

  // Status filter
  if (filter === 'unreplied') {
    list = list.filter((r) => !r.ownerReply);
  } else if (filter === 'replied') {
    list = list.filter((r) => Boolean(r.ownerReply));
  }

  // Rating filter
  if (ratingFilter !== 'all') {
    list = list.filter((r) => r.rating === parseInt(ratingFilter, 10));
  }

  // Sort: Latest first
  list.sort((a, b) => b.timestamp - a.timestamp);

  const total = list.length;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(total / limit) || 1;

  // Average rating
  const allVenueReviews = _reviewsDb.filter((r) => r.venueId === venueId);
  const avgRating = allVenueReviews.length > 0
    ? (allVenueReviews.reduce((sum, r) => sum + r.rating, 0) / allVenueReviews.length).toFixed(1)
    : '0.0';

  return {
    success: true,
    data: items,
    stats: {
      totalReviews: allVenueReviews.length,
      averageRating: avgRating,
      unrepliedCount: allVenueReviews.filter((r) => !r.ownerReply).length,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    }
  };
}

/**
 * POST /owner/reviews/:reviewId/reply
 * Security: Owner can reply only to reviews belonging to their venue.
 */
export async function submitOwnerReply({ venueId = 'v-owner-demo', reviewId, replyText }) {
  await new Promise((r) => setTimeout(r, 400));

  const trimmed = (replyText || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Reply text cannot be empty.' };
  }

  if (trimmed.length > 500) {
    return { success: false, error: 'Reply exceeds maximum limit of 500 characters.' };
  }

  const review = _reviewsDb.find((r) => r.id === reviewId);
  if (!review) {
    return { success: false, error: 'Review not found.' };
  }

  // Backend ownership verification
  if (review.venueId !== venueId) {
    return { success: false, error: 'Unauthorized: You do not own this venue.' };
  }

  const updatedReview = {
    ...review,
    ownerReply: trimmed,
    ownerRepliedAt: 'Just now',
  };

  _reviewsDb = _reviewsDb.map((r) => (r.id === reviewId ? updatedReview : r));
  _emitReviewUpdate('REVIEW_REPLIED', updatedReview);

  return {
    success: true,
    data: updatedReview
  };
}

/**
 * PUT /owner/reviews/:reviewId/reply
 * Edit an existing reply
 */
export async function editOwnerReply({ venueId = 'v-owner-demo', reviewId, replyText }) {
  return submitOwnerReply({ venueId, reviewId, replyText });
}

function _emitReviewUpdate(event, payload) {
  _reviewListeners.forEach((cb) => {
    try {
      cb(event, payload);
    } catch (_) {}
  });
}

export function subscribeToReviewEvents(callback) {
  _reviewListeners.push(callback);
  return () => {
    _reviewListeners = _reviewListeners.filter((cb) => cb !== callback);
  };
}

/**
 * Simulate arrival of a real-time player review
 */
export function simulateIncomingReview(venueId = 'v-owner-demo') {
  const names = ['Kavya Patel', 'Deepak Varma', 'Manish Reddy', 'Snehal Jagtap'];
  const comments = [
    'Superb lighting and clean courts. Loved playing here this evening!',
    'Great venue overall, staff was courteous and courts are well maintained.',
    'Very easy booking flow and court condition was pristine.'
  ];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  const randomRating = Math.random() > 0.3 ? 5 : 4;
  const newId = `REV-${Date.now().toString().slice(-4)}`;

  const newReview = {
    id: newId,
    venueId,
    customer: { name: randomName, avatar: randomName.charAt(0) },
    date: 'Just now',
    timestamp: Date.now(),
    rating: randomRating,
    sport: 'Badminton',
    courtName: 'Court B',
    comment: randomComment,
    ownerReply: null,
    ownerRepliedAt: null,
  };

  _reviewsDb = [newReview, ..._reviewsDb];
  _emitReviewUpdate('NEW_REVIEW', newReview);
  return newReview;
}
