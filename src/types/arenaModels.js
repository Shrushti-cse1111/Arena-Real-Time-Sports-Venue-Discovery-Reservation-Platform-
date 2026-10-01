/**
 * ARENA — TYPED DOMAIN MODELS & DATA SCHEMAS
 * Production-ready typed definitions for all 13 core domain entities.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} fullName
 * @property {string} phoneNumber
 * @property {string} countryCode
 * @property {string} email
 * @property {string} city
 * @property {'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'} skillLevel
 * @property {string[]} preferredSports
 * @property {Object} notifications
 * @property {boolean} notifications.whatsappAlerts
 * @property {boolean} notifications.bookingConfirmations
 * @property {boolean} notifications.promotions
 * @property {boolean} notifications.matchReminders
 * @property {Array} savedPaymentMethods
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Owner
 * @property {string} id
 * @property {string} ownerFullName
 * @property {string} ownerPhoneNumber
 * @property {string} ownerCountryCode
 * @property {string} ownerEmail
 * @property {string} businessId
 * @property {'superadmin' | 'owner' | 'manager' | 'staff'} role
 * @property {string[]} venueIds
 * @property {boolean} isVerified
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Business
 * @property {string} id
 * @property {string} businessName
 * @property {string} registrationNumber
 * @property {string} gstNumber
 * @property {string} ownerId
 * @property {string} bankAccountDetails
 * @property {'active' | 'pending' | 'suspended'} status
 */

/**
 * @typedef {Object} Venue
 * @property {string} id
 * @property {string} name
 * @property {string} location
 * @property {string} address
 * @property {number} rating
 * @property {number} reviewCount
 * @property {string} image
 * @property {string[]} gallery
 * @property {string[]} sports
 * @property {number} pricePerHour
 * @property {string} distance
 * @property {string[]} amenities
 * @property {Object[]} courts
 * @property {string} operatingHours
 * @property {boolean} isOpen
 */

/**
 * @typedef {Object} Sport
 * @property {string} id
 * @property {string} name
 * @property {string} iconName
 * @property {string} category
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} bookingId
 * @property {string} userId
 * @property {string} venueId
 * @property {string} venueName
 * @property {string} courtId
 * @property {string} courtName
 * @property {string} sport
 * @property {string} date
 * @property {string} timeSlot
 * @property {number} amountPaid
 * @property {number} originalPrice
 * @property {number} discountAmount
 * @property {'confirmed' | 'completed' | 'cancelled' | 'pending'} status
 * @property {'upcoming' | 'past' | 'cancelled'} category
 * @property {string} paymentId
 * @property {string} qrCode
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Slot
 * @property {string} id
 * @property {string} courtId
 * @property {string} date
 * @property {string} time
 * @property {string} shortTime
 * @property {number} price
 * @property {'available' | 'locked' | 'booked' | 'maintenance'} status
 * @property {string | null} lockedByUserId
 * @property {number | null} lockExpiresAt
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} bookingId
 * @property {string} razorpayPaymentId
 * @property {string} razorpayOrderId
 * @property {number} amount
 * @property {string} currency
 * @property {'upi' | 'card' | 'netbanking' | 'wallet'} method
 * @property {'captured' | 'failed' | 'refunded'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Payout
 * @property {string} id
 * @property {string} ownerId
 * @property {string} businessId
 * @property {number} amount
 * @property {'weekly' | 'instant'} frequency
 * @property {'completed' | 'processing' | 'failed'} status
 * @property {string} payoutDate
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} venueId
 * @property {string} userId
 * @property {string} userName
 * @property {number} rating
 * @property {string} comment
 * @property {string} date
 */

/**
 * @typedef {Object} Coupon
 * @property {string} id
 * @property {string} code
 * @property {'percentage' | 'fixed'} discountType
 * @property {number} discountValue
 * @property {number} maxDiscount
 * @property {number} minBookingAmount
 * @property {string} validUntil
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Staff
 * @property {string} id
 * @property {string} venueId
 * @property {string} name
 * @property {string} phone
 * @property {'manager' | 'receptionist' | 'groundkeeper'} role
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} message
 * @property {'booking' | 'payment' | 'match' | 'system'} type
 * @property {boolean} isRead
 * @property {string} timestamp
 */

export const DOMAIN_ENTITIES = [
  'User',
  'Owner',
  'Business',
  'Venue',
  'Sport',
  'Booking',
  'Slot',
  'Payment',
  'Payout',
  'Review',
  'Coupon',
  'Staff',
  'Notification',
];
