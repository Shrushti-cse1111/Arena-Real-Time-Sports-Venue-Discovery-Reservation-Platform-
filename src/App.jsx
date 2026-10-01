import React, { useState, useEffect } from 'react';
import MobileFrame from './components/MobileFrame';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import LoginScreen from './components/LoginScreen';
import PlayerRegistrationScreen from './components/PlayerRegistrationScreen';
import OwnerRegistrationScreen from './components/OwnerRegistrationScreen';
import OtpVerificationScreen from './components/OtpVerificationScreen';
import PlayerHomeScreen from './components/PlayerHomeScreen';
import VenueFilterScreen from './components/VenueFilterScreen';
import VenueListScreen from './components/VenueListScreen';
import VenueDetailsScreen from './components/VenueDetailsScreen';
import SlotCalendarScreen from './components/SlotCalendarScreen';
import SlotLockScreen from './components/SlotLockScreen';
import BookingSummaryScreen from './components/BookingSummaryScreen';
import PaymentProcessingScreen from './components/PaymentProcessingScreen';
import MyBookingsScreen from './components/MyBookingsScreen';
import BookingDetailScreen from './components/BookingDetailScreen';
import UserProfileScreen from './components/UserProfileScreen';
import NotificationsScreen from './components/NotificationsScreen';
import WalletScreen from './components/WalletScreen';
import FavoritesScreen from './components/FavoritesScreen';
import ReferralScreen from './components/ReferralScreen';
import SupportCenterScreen from './components/SupportCenterScreen';
import { groupBookingService } from './data/groupBookingService';
import {
  BookingConfirmedScreen,
  BookingFailedScreen,
  SlotConflictScreen,
} from './components/BookingStatusScreens';
import OwnerDashboardScreen from './components/OwnerDashboardScreen';
import OwnerBusinessVerificationScreen from './components/OwnerBusinessVerificationScreen';
import OwnerVenueCreationScreen from './components/OwnerVenueCreationScreen';
import OwnerPricingConfigScreen from './components/OwnerPricingConfigScreen';
import OwnerBookingsScreen from './components/OwnerBookingsScreen';
import OwnerAvailabilityScreen from './components/OwnerAvailabilityScreen';
import OwnerEarningsScreen from './components/OwnerEarningsScreen';
import OwnerReviewsScreen from './components/OwnerReviewsScreen';
import OwnerCouponsScreen from './components/OwnerCouponsScreen';
import OwnerAnalyticsScreen from './components/OwnerAnalyticsScreen';
import OwnerVenuesScreen from './components/OwnerVenuesScreen';
import OwnerStaffScreen from './components/OwnerStaffScreen';
import OwnerNotificationsScreen from './components/OwnerNotificationsScreen';
import AdminLoginScreen from './components/AdminLoginScreen';
import Admin2faScreen from './components/Admin2faScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import { ownerAuthService } from './services/ownerAuthService';
import { ownerVenueService } from './services/ownerVenueService';
import { adminAuthService } from './services/adminAuthService';
import {
} from './data/mockVenues';

// Generate 7 upcoming dates dynamically from today
function generateUpcomingDates() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      id: `day-${i + 1}`,
      day: days[d.getDay()],
      date: `${d.getDate()} ${months[d.getMonth()]}`,
      fullDate: `${fullDays[d.getDay()]}, ${d.getDate()} ${fullMonths[d.getMonth()]}`,
    });
  }
  return result;
}

// Generate hourly time slots for a court (6 AM – 11 PM)
function generateDynamicSlots(bookedSlotIds = new Set()) {
  const hours = [];
  for (let h = 6; h < 23; h++) {
    const startH = h % 12 === 0 ? 12 : h % 12;
    const endH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
    const startSuffix = h < 12 ? 'AM' : 'PM';
    const endSuffix = h + 1 < 12 ? 'AM' : (h + 1 === 12 ? 'PM' : 'PM');
    const id = `slot-${h}`;
    const shortTime = `${startH}:00 ${startSuffix}`;
    const time = `${startH}:00 ${startSuffix} – ${endH}:00 ${endSuffix}`;
    const status = bookedSlotIds.has(id) ? 'booked' : 'available';
    hours.push({ id, time, shortTime, status });
  }
  // Split into morning (6-12), afternoon (12-17), evening (17-23)
  return {
    morning: hours.filter((s) => parseInt(s.id.split('-')[1]) < 12),
    afternoon: hours.filter((s) => { const h = parseInt(s.id.split('-')[1]); return h >= 12 && h < 17; }),
    evening: hours.filter((s) => parseInt(s.id.split('-')[1]) >= 17),
  };
}

export default function App() {
  const [currentStep, setCurrentStep] = useState('role');
  // Steps: 'role' | 'login' | 'player-reg' | 'owner-reg' | 'otp' | 'admin-login' | 'admin-2fa' | 'admin-dashboard' | 'player-home' | 'notifications' | 'venue-filter' | 'venue-list' | 'venue-details' | 'slot-calendar' | 'slot-lock' | 'booking-summary' | 'payment-processing' | 'booking-confirmed' | 'booking-failed' | 'slot-conflict' | 'my-bookings' | 'booking-details' | 'player-profile' | 'owner-dashboard'

  const [selectedRole, setSelectedRole] = useState(null); // 'player' | 'owner' | 'admin'
  const [previousStep, setPreviousStep] = useState('role');
  const [dismissedReviewBookingIds, setDismissedReviewBookingIds] = useState(new Set());

  // Admin 2FA Authentication state
  const [adminSession, setAdminSession] = useState(() => adminAuthService.getAdminSession());
  const [adminChallengeData, setAdminChallengeData] = useState(null);

  // Support & Referral navigation state
  const [supportBookingContext, setSupportBookingContext] = useState(null);
  const [supportInitialTab, setSupportInitialTab] = useState('faqs');
  const [supportPreviousStep, setSupportPreviousStep] = useState('player-profile');

  // Player & Owner profile data
  const [playerData, setPlayerData] = useState({
    fullName: '',
    phoneNumber: '',
    countryCode: '+91',
    email: '',
    city: 'Pune, Maharashtra',
    skillLevel: 'Intermediate',
    preferredSports: ['Badminton'],
    notifications: {
      whatsappAlerts: true,
      bookingConfirmations: true,
      promotions: false,
      matchReminders: true,
    },
    savedPaymentMethods: [],
  });

  const [ownerData, setOwnerData] = useState({
    ownerFullName: '',
    ownerPhoneNumber: '',
    ownerCountryCode: '+91',
    ownerEmail: '',
    venueName: '',
    venueLocation: '',
    primarySport: '',
  });

  const [createdVenue, setCreatedVenue] = useState(null);
  const [ownerVenuesList, setOwnerVenuesList] = useState([]);
  const [activeOwnerVenueId, setActiveOwnerVenueId] = useState(() => ownerVenueService.getActiveVenueId());

  // Initialize and keep owner venues in sync
  useEffect(() => {
    ownerVenueService.getVenues().then((list) => {
      setOwnerVenuesList(list);
      if (list.length > 0 && !list.some((v) => v.id === activeOwnerVenueId)) {
        setActiveOwnerVenueId(list[0].id);
        ownerVenueService.setActiveVenueId(list[0].id);
      }
    });
  }, []);

  const currentActiveOwnerVenue =
    ownerVenuesList.find((v) => v.id === activeOwnerVenueId) ||
    ownerVenuesList[0] ||
    createdVenue || { id: 'venue-101', name: ownerData.venueName || 'Arena Sports Club - FC Road' };

  // Venues and booking states
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [venueFilters, setVenueFilters] = useState({
    sports: ['All'],
    neighborhood: 'All Areas',
    distanceOption: 'any',
    locationDisplay: 'Pune, Maharashtra',
  });
  const [lastVenueSource, setLastVenueSource] = useState('player-home');

  // Slot states — dynamically generated from court operating hours
  const [slotsData, setSlotsData] = useState(generateDynamicSlots());
  const [upcomingDates] = useState(generateUpcomingDates);
  const [activeBooking, setActiveBooking] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes (600s)

  // Real-time reservation hold countdown timer
  useEffect(() => {
    let interval = null;
    const activeHoldSteps = ['slot-lock', 'booking-summary', 'payment-processing'];

    if (activeHoldSteps.includes(currentStep)) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Automatic hold release on timeout
            handleReleaseSlot();
            setCurrentStep('booking-failed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, activeBooking]);

  // Helper: mutate slot status in state
  const updateSlotStatus = (slotId, newStatus) => {
    setSlotsData((prev) => {
      const updateList = (list) =>
        list.map((s) => (s.id === slotId ? { ...s, status: newStatus } : s));

      return {
        morning: updateList(prev.morning),
        afternoon: updateList(prev.afternoon),
        evening: updateList(prev.evening),
      };
    });
  };

  const handleReleaseSlot = () => {
    if (activeBooking && activeBooking.slot) {
      updateSlotStatus(activeBooking.slot.id, 'available');
    }
  };

  // Auth & Flow Handlers
  const handleRoleContinue = () => {
    setPreviousStep('role');
    if (selectedRole === 'player') {
      setCurrentStep('player-reg');
    } else if (selectedRole === 'owner') {
      setCurrentStep('owner-reg');
    } else if (selectedRole === 'admin') {
      if (adminAuthService.isAuthenticatedAdmin()) {
        setAdminSession(adminAuthService.getAdminSession());
        setCurrentStep('admin-dashboard');
      } else {
        setCurrentStep('admin-login');
      }
    }
  };

  const handleNavigateAdmin = () => {
    setPreviousStep(currentStep);
    setSelectedRole('admin');
    if (adminAuthService.isAuthenticatedAdmin()) {
      setAdminSession(adminAuthService.getAdminSession());
      setCurrentStep('admin-dashboard');
    } else {
      setCurrentStep('admin-login');
    }
  };

  const handleRequireAdmin2FA = (challengeData) => {
    setPreviousStep('admin-login');
    setAdminChallengeData(challengeData);
    setCurrentStep('admin-2fa');
  };

  const handleAdmin2FASuccess = (session) => {
    setAdminSession(session);
    setAdminChallengeData(null);
    setCurrentStep('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminChallengeData(null);
    setSelectedRole('player');
    setCurrentStep('role');
  };

  const handleNavigateLogin = (role) => {
    setPreviousStep(currentStep);
    setSelectedRole(role || selectedRole || 'player');
    setCurrentStep('login');
  };

  const handleNavigateRegister = (role) => {
    setPreviousStep('login');
    setSelectedRole(role || 'player');
    if (role === 'player') {
      setCurrentStep('player-reg');
    } else {
      setCurrentStep('owner-reg');
    }
  };

  const handleFormSubmit = () => {
    setPreviousStep(currentStep);
    setCurrentStep('otp');
  };

  const handleRequireOtpFromLogin = ({ role, phoneNumber, countryCode }) => {
    setPreviousStep('login');
    setSelectedRole(role);
    if (role === 'player') {
      setPlayerData((prev) => ({
        ...prev,
        fullName: prev.fullName || 'Player',
        phoneNumber,
        countryCode,
      }));
    } else {
      setOwnerData((prev) => ({
        ...prev,
        ownerFullName: prev.ownerFullName || 'Venue Partner',
        ownerPhoneNumber: phoneNumber,
        ownerCountryCode: countryCode,
      }));
    }
    setCurrentStep('otp');
  };

  const handleDirectLoginSuccess = (payload) => {
    if (payload.role === 'player') {
      setPlayerData((prev) => ({
        ...prev,
        fullName: payload.fullName || prev.fullName || 'Player',
        phoneNumber: payload.phoneNumber || prev.phoneNumber,
        email: payload.email || prev.email,
        city: payload.city || prev.city || 'Pune, Maharashtra',
      }));
      setSelectedRole('player');
      setCurrentStep('player-home');
    } else {
      setOwnerData((prev) => ({
        ...prev,
        ownerFullName: payload.ownerFullName || prev.ownerFullName || 'Venue Partner',
        ownerPhoneNumber: payload.ownerPhoneNumber || prev.ownerPhoneNumber,
        ownerEmail: payload.ownerEmail || prev.ownerEmail,
        venueName: payload.venueName || prev.venueName || 'Registered Sports Venue',
        venueLocation: payload.venueLocation || prev.venueLocation || 'Pune, Maharashtra',
        primarySport: payload.primarySport || prev.primarySport || 'Badminton',
      }));
      setSelectedRole('owner');
      setCurrentStep('owner-dashboard');
    }
  };

  const handleOtpVerified = () => {
    if (selectedRole === 'player') {
      setCurrentStep('player-home');
    } else {
      setCurrentStep('owner-dashboard');
    }
  };

  // Venue Navigation Handlers
  const handleSelectVenueFromHome = (venue) => {
    setSelectedVenue(venue);
    setSelectedCourt(venue.courts ? venue.courts[0] : null);
    setLastVenueSource('player-home');
    setCurrentStep('venue-details');
  };

  const handleSelectVenueFromList = (venue) => {
    setSelectedVenue(venue);
    setSelectedCourt(venue.courts ? venue.courts[0] : null);
    setLastVenueSource('venue-list');
    setCurrentStep('venue-details');
  };

  const handleOpenFilter = () => {
    setCurrentStep('venue-filter');
  };

  const handleViewAllVenues = (sport) => {
    setVenueFilters({
      sports: sport === 'All' ? ['All'] : [sport],
      neighborhood: 'All Areas',
      distanceOption: 'any',
      locationDisplay: 'Pune, Maharashtra',
    });
    setCurrentStep('venue-list');
  };

  const handleApplyFilters = (filters) => {
    setVenueFilters(filters);
    setCurrentStep('venue-list');
  };

  const handleViewSlots = (court) => {
    if (court) setSelectedCourt(court);
    setCurrentStep('slot-calendar');
  };

  // Temporary Slot Locking & Booking Handlers
  const handleContinueBookingFromCalendar = (bookingPayload) => {
    setActiveBooking(bookingPayload);
    setTimeRemaining(598); // ~09:58 as per prompt example
    // Temporarily lock slot as reserved
    updateSlotStatus(bookingPayload.slot.id, 'reserved');
    setCurrentStep('booking-summary');
  };

  const handleSimulateConflictFromCalendar = (bookingPayload) => {
    setActiveBooking(bookingPayload);
    // Mark as booked by another user
    updateSlotStatus(bookingPayload.slot.id, 'booked');
    setCurrentStep('slot-conflict');
  };

  const handleProceedToSummary = () => {
    setCurrentStep('booking-summary');
  };

  const handleCancelReservation = () => {
    handleReleaseSlot();
    setCurrentStep('slot-calendar');
  };

  const handleCancelFromSummary = () => {
    handleReleaseSlot();
    setCurrentStep('booking-failed');
  };

  const handleChangeSlotFromSummary = () => {
    setCurrentStep('slot-calendar');
  };

  // User Bookings History & Selection State
  const [userBookings, setUserBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Notifications State (FCM & Real-Time Alerts)
  const [notifications, setNotifications] = useState([]);

  // Wallet & Refunds State
  const [walletData, setWalletData] = useState({
    balance: 0,
    mainBalance: 0,
    promoCashback: 0,
    currency: '₹',
    accountNumber: 'ARENA-WLT-' + Math.floor(100000 + Math.random() * 900000),
    isKycVerified: false,
    transactions: [],
  });
  const [refundsData, setRefundsData] = useState([]);

  // Favorites State — single source of truth across all venue surfaces
  const [favoriteVenueIds, setFavoriteVenueIds] = useState(new Set());

  const handleToggleFavorite = (venueId) => {
    setFavoriteVenueIds((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) {
        next.delete(venueId);
      } else {
        next.add(venueId);
      }
      return next;
    });
  };

  const handleProceedToPayment = (updatedPayload) => {
    if (updatedPayload) {
      setActiveBooking(updatedPayload);
    }
    setCurrentStep('payment-processing');
  };

  // Payment Outcome Handlers
  const handlePaymentSuccess = (paymentPayload) => {
    const bookingSource = paymentPayload || activeBooking;
    if (bookingSource && bookingSource.slot) {
      updateSlotStatus(bookingSource.slot.id, 'booked');
    }

    const isGroup = Boolean(bookingSource?.isGroupBooking);
    let createdGroup = null;
    if (isGroup) {
      createdGroup = groupBookingService.createGroupBooking(
        bookingSource,
        playerData,
        bookingSource.groupParticipantsCount || 4
      );
    }

    // Synchronize newly created booking into user bookings state
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newBookingRecord = {
      id: createdGroup ? createdGroup.bookingId.replace('#', '') : `ARN-2026-${randomSuffix}`,
      bookingId: createdGroup ? createdGroup.bookingId : `#ARN-2026-${randomSuffix}`,
      isGroupBooking: isGroup,
      groupBookingId: createdGroup ? createdGroup.groupBookingId : null,
      groupParticipantsCount: isGroup ? (bookingSource.groupParticipantsCount || 4) : 1,
      originalTotalAmount: isGroup ? (bookingSource.originalTotalAmount || bookingSource.finalPayable) : bookingSource?.finalPayable,
      venueId: bookingSource?.venue?.id || selectedVenue?.id || null,
      venueName: bookingSource?.venue?.name || selectedVenue?.name || 'Sports Venue',
      venueLocation: bookingSource?.venue?.location || selectedVenue?.location || '',
      venueImage: bookingSource?.venue?.photos?.[0] || selectedVenue?.photos?.[0] || null,
      venuePhone: bookingSource?.venue?.phone || null,
      courtId: bookingSource?.court?.id || selectedCourt?.id || null,
      courtName: bookingSource?.court?.name || selectedCourt?.name || '',
      courtType: bookingSource?.court?.type || selectedCourt?.type || '',
      sport: bookingSource?.sport || selectedVenue?.primarySport || '',
      date: bookingSource?.date?.dateStr || null,
      dateFormatted: bookingSource?.date?.fullDate || '',
      time: bookingSource?.slot?.time || '',
      shortTime: bookingSource?.slot?.shortTime || '',
      duration: bookingSource?.duration || '1 hour',
      durationHours: 1,
      playersCount: bookingSource?.playersCount || (isGroup ? (bookingSource.groupParticipantsCount || 4) : 2),
      status: isGroup ? 'partially_paid' : 'confirmed',
      category: 'upcoming',
      basePrice: bookingSource?.courtPrice || 0,
      addOns: bookingSource?.addOns || [],
      addOnsTotal: bookingSource?.addOnsTotal || 0,
      couponCode: bookingSource?.couponCode || null,
      couponDiscount: bookingSource?.couponDiscount || 0,
      platformFee: bookingSource?.platformFee || 0,
      gst: bookingSource?.gst || 0,
      finalPayable: bookingSource?.finalPayable || 0,
      paymentMethod: bookingSource?.paymentMethod || 'UPI',
      paymentTxnId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      paymentStatus: 'Paid',
      bookedAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      qrCodeSeed: `${createdGroup ? createdGroup.bookingId.replace('#', '') : `ARN-2026-${randomSuffix}`}-QR-PASS`,
    };

    setUserBookings((prev) => [newBookingRecord, ...prev]);
    setActiveBooking(newBookingRecord);

    // Push real-time booking confirmation notification (FCM Integration)
    const newBookingNotif = {
      id: `notif-${Date.now()}`,
      type: isGroup ? 'group_booking_created' : 'booking_confirmed',
      title: isGroup ? 'Group Slot Locked! 👥' : 'Court Booking Confirmed! 🎉',
      message: isGroup
        ? `Organizer share (₹${newBookingRecord.finalPayable}) paid for ${newBookingRecord.sport} at ${newBookingRecord.venueName}. Slot held & locked for group!`
        : `Your booking for ${newBookingRecord.sport} at ${newBookingRecord.venueName} (${newBookingRecord.courtName}) is confirmed for ${newBookingRecord.dateFormatted} at ${newBookingRecord.shortTime}.`,
      timestamp: 'Just now',
      dateIso: new Date().toISOString(),
      isRead: false,
      entityType: 'booking',
      entityId: newBookingRecord.id,
      bookingId: newBookingRecord.id,
      venueId: newBookingRecord.venueId,
      actionText: isGroup ? 'Track Split' : 'View Match Pass',
      badgeCategory: 'Bookings',
    };
    setNotifications((prev) => [newBookingNotif, ...prev]);

    setCurrentStep('booking-confirmed');
  };

  const handleUpdateBooking = (updatedBooking) => {
    setUserBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    if (selectedBooking && selectedBooking.id === updatedBooking.id) {
      setSelectedBooking(updatedBooking);
    }
  };

  const handlePaymentFailure = () => {
    handleReleaseSlot();
    setCurrentStep('booking-failed');
  };

  const handlePaymentConflict = () => {
    if (activeBooking && activeBooking.slot) {
      updateSlotStatus(activeBooking.slot.id, 'booked');
    }
    setCurrentStep('slot-conflict');
  };

  // My Bookings & Booking Details Handlers
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setCurrentStep('booking-details');
  };

  const handleCancelBooking = (bookingId, reason, destination = 'original') => {
    const isWallet = destination === 'wallet';
    const refundTxn = `ARN-RFND-${Math.floor(10000 + Math.random() * 90000)}`;

    setUserBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = {
            ...b,
            status: 'cancelled',
            category: 'cancelled',
            cancellationDetails: {
              cancelledAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reason: reason || 'Change of schedule',
              refundAmount: b.finalPayable,
              refundStatus: isWallet
                ? '⚡ Instantly Credited to Arena Wallet'
                : `Refund Initiated to ${b.paymentMethod || 'Original Payment Source'} (24-48 hrs)`,
              refundMethod: isWallet ? 'Arena Wallet' : (b.paymentMethod || 'UPI'),
              refundTxnId: refundTxn,
              refundDate: 'Today',
              destination,
            },
          };
          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(updated);
          }

          // Push refund notification
          const cancelNotif = {
            id: `notif-${Date.now()}`,
            type: 'refund_processed',
            title: isWallet
              ? `⚡ ₹${b.finalPayable} Instantly in Arena Wallet!`
              : `Refund Initiated: ₹${b.finalPayable} 💳`,
            message: isWallet
              ? `Booking ${b.bookingId} cancelled. ₹${b.finalPayable} has been instantly credited to your Arena Wallet (Ref: ${refundTxn}).`
              : `Booking ${b.bookingId} cancelled. Full refund of ₹${b.finalPayable} initiated to ${b.paymentMethod || 'Original Payment Source'} (Ref: ${refundTxn}). Expected: 24-48 hrs.`,
            timestamp: 'Just now',
            dateIso: new Date().toISOString(),
            isRead: false,
            entityType: 'booking',
            entityId: bookingId,
            bookingId: bookingId,
            venueId: b.venueId,
            actionText: isWallet ? 'View Wallet' : 'View Refund',
            badgeCategory: 'Bookings',
          };
          setNotifications((prevNotifs) => [cancelNotif, ...prevNotifs]);

          // If wallet destination: credit balance instantly
          if (isWallet) {
            const refundAmount = b.finalPayable || 0;
            setWalletData((prev) => ({
              ...prev,
              balance: prev.balance + refundAmount,
              mainBalance: prev.mainBalance + refundAmount,
              transactions: [
                {
                  id: `tx-${Date.now()}`,
                  txnId: refundTxn,
                  type: 'refund',
                  title: `Refund Credit (${b.bookingId})`,
                  description: `Instant refund for cancelled booking at ${b.venueName}`,
                  amount: refundAmount,
                  isCredit: true,
                  timestamp: 'Just now',
                  status: 'completed',
                  relatedBookingId: b.id,
                  sport: b.sport,
                  venueName: b.venueName,
                  source: 'Cancellation Refund',
                },
                ...prev.transactions,
              ],
            }));
            setRefundsData((prev) => [
              {
                id: `rfnd-${Date.now()}`,
                refundTxnId: refundTxn,
                bookingId: b.id,
                bookingRef: b.bookingId,
                venueName: b.venueName,
                venueLocation: b.venueLocation || '',
                sport: b.sport,
                courtName: b.courtName || '',
                originalAmount: b.finalPayable,
                refundAmount: b.finalPayable,
                cancellationFee: 0,
                status: 'completed',
                refundMethod: 'Arena Wallet',
                destinationMasked: '⚡ Arena Wallet (Instant)',
                reason: reason || 'Change of schedule',
                initiatedAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completedAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                settlementWindow: 'Instant — Already Credited',
              },
              ...prev,
            ]);
          } else {
            setRefundsData((prev) => [
              {
                id: `rfnd-${Date.now()}`,
                refundTxnId: refundTxn,
                bookingId: b.id,
                bookingRef: b.bookingId,
                venueName: b.venueName,
                venueLocation: b.venueLocation || '',
                sport: b.sport,
                courtName: b.courtName || '',
                originalAmount: b.finalPayable,
                refundAmount: b.finalPayable,
                cancellationFee: 0,
                status: 'processing',
                refundMethod: b.paymentMethod || 'UPI',
                destinationMasked: b.paymentMethod || 'Original Payment Source',
                reason: reason || 'Change of schedule',
                initiatedAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completedAt: null,
                settlementWindow: '24-48 business hours',
              },
              ...prev,
            ]);
          }

          return updated;
        }
        return b;
      })
    );
  };

  const handleTopUpWallet = (amount, method) => {
    const txnId = `TXN-WLT-${Math.floor(100000 + Math.random() * 900000)}`;
    setWalletData((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      mainBalance: prev.mainBalance + amount,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          txnId,
          type: 'topup',
          title: `Wallet Top-Up (${method || 'UPI'})`,
          description: `Added money via ${method || 'UPI'}`,
          amount,
          isCredit: true,
          timestamp: 'Just now',
          status: 'completed',
          source: method || 'UPI',
        },
        ...prev.transactions,
      ],
    }));
    // Push notification
    const topupNotif = {
      id: `notif-${Date.now()}`,
      type: 'wallet_topup',
      title: `₹${amount} Added to Arena Wallet ✅`,
      message: `Your Arena Wallet has been topped up with ₹${amount} via ${method || 'UPI'}. New balance ready for instant court bookings!`,
      timestamp: 'Just now',
      dateIso: new Date().toISOString(),
      isRead: false,
      entityType: 'wallet',
      actionText: 'View Wallet',
      badgeCategory: 'Payments',
    };
    setNotifications((prev) => [topupNotif, ...prev]);
  };

  const handleSyncRefunds = () => {
    // Simulate gateway sync — in production this would re-fetch from backend
    // No-op for demo, toast is shown inside WalletScreen
  };

  const handleRescheduleBooking = (bookingId, newDate, newSlot) => {
    setUserBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = {
            ...b,
            status: 'rescheduled',
            date: newDate,
            dateFormatted: newDate,
            time: newSlot,
          };
          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(updated);
          }

          // Push rescheduling notification
          const reschedNotif = {
            id: `notif-${Date.now()}`,
            type: 'booking_rescheduled',
            title: 'Slot Rescheduled Successfully 🔄',
            message: `Your match for ${b.venueName} has been moved to ${newDate} (${newSlot}).`,
            timestamp: 'Just now',
            dateIso: new Date().toISOString(),
            isRead: false,
            entityType: 'booking',
            entityId: bookingId,
            bookingId: bookingId,
            venueId: b.venueId,
            actionText: 'View Updated Slot',
            badgeCategory: 'Bookings',
          };
          setNotifications((prevNotifs) => [reschedNotif, ...prevNotifs]);

          return updated;
        }
        return b;
      })
    );
  };

  // Notifications Management Handlers
  const handleMarkNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkNotificationAsUnread = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification) => {
    handleMarkNotificationAsRead(notification.id);

    if (notification.bookingId || notification.entityType === 'booking') {
      const targetId = notification.bookingId || notification.entityId;
      const matchedBooking = userBookings.find(
        (b) => b.id === targetId || b.bookingId === targetId
      );
      if (matchedBooking) {
        setSelectedBooking(matchedBooking);
        setCurrentStep('booking-details');
      } else {
        setCurrentStep('my-bookings');
      }
    } else if (notification.venueId || notification.entityType === 'venue') {
      const matchedVenue = venues.find((v) => v.id === notification.venueId) || venues[0];
      setSelectedVenue(matchedVenue);
      setSelectedCourt(matchedVenue.courts ? matchedVenue.courts[0] : null);
      setLastVenueSource('player-home');
      setCurrentStep('venue-details');
    } else if (notification.couponCode || notification.entityType === 'offer') {
      setVenueFilters({
        sports: ['All'],
        neighborhood: 'All Areas',
        distanceOption: 'any',
        locationDisplay: 'Pune, Maharashtra',
      });
      setCurrentStep('venue-list');
    }
  };

  const handleSimulatePushNotification = () => {
    const pushTemplates = [
      {
        title: 'Flash Deal: 20% Off Courts ⚡',
        message: 'Limited time flash offer on evening court slots near you! Use code FLASH20.',
        type: 'promo_offer',
        badgeCategory: 'Offers',
        couponCode: 'FLASH20',
        actionText: 'Book with 20% OFF',
      },
      {
        title: 'Match Reminder: 1 Hour to Game ⏰',
        message: userBookings[0]
          ? `Your session for ${userBookings[0].sport} at ${userBookings[0].venueName} starts shortly.`
          : 'Your upcoming match session starts in 1 hour. Get ready!',
        type: 'booking_reminder',
        badgeCategory: 'Bookings',
        bookingId: userBookings[0]?.id || null,
        actionText: 'View Digital Pass',
      },
      {
        title: 'New Venue Alert! 🏟️',
        message: venues.length > 0
          ? `${venues[venues.length - 1]?.name} is now available for bookings on Arena. Check out their courts!`
          : 'New sports venues are being onboarded in your city. Stay tuned!',
        type: 'venue_alert',
        badgeCategory: 'Venues',
        venueId: venues.length > 0 ? venues[venues.length - 1]?.id : null,
        actionText: 'Explore Venue',
      },
    ];

    const randomTpl = pushTemplates[Math.floor(Math.random() * pushTemplates.length)];
    const uniqueId = `notif-${Date.now()}`;
    const newNotif = {
      id: uniqueId,
      ...randomTpl,
      timestamp: 'Just now',
      dateIso: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== uniqueId)]);
  };

  const handleRateBooking = async (bookingId, reviewData) => {
    const targetBooking = userBookings.find((b) => b.id === bookingId);

    // Eligibility check 1: Booking existence
    if (!targetBooking) {
      return { success: false, error: 'Booking could not be found.' };
    }

    // Eligibility check 2: Booking ownership verification
    if (targetBooking.userId && targetBooking.userId !== (playerData?.id || 'usr-player-1')) {
      return { success: false, error: 'Unauthorized: You can only submit ratings for your own bookings.' };
    }

    // Eligibility check 3: Completion status verification
    if (targetBooking.status !== 'completed' && targetBooking.category !== 'past') {
      return {
        success: false,
        error: 'Rating is not available yet. Only completed bookings can be reviewed.',
      };
    }

    // Eligibility check 4: Duplicate prevention unless explicitly editing
    const isEdit = Boolean(targetBooking.userReview || reviewData.isEdit);
    if (targetBooking.userReview && !reviewData.isEdit) {
      return {
        success: false,
        error: 'A review has already been submitted for this booking. Duplicate reviews are not allowed.',
      };
    }

    // Validation 5: Rating range check
    const numericRating = Number(reviewData.rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return { success: false, error: 'Invalid rating. Please provide a score between 1 and 5 stars.' };
    }

    // Simulate backend network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    const authorName = playerData?.fullName || 'Player';

    const normalizedReview = {
      rating: numericRating,
      tags: reviewData.tags || [],
      comment: reviewData.comment || 'Great sports facility and smooth game experience!',
      reviewedAt: 'Today',
      bookingId: targetBooking.bookingId || targetBooking.id,
      venueId: targetBooking.venueId,
      venueName: targetBooking.venueName,
      sport: targetBooking.sport,
      courtName: targetBooking.courtName,
      date: targetBooking.dateFormatted || targetBooking.date,
    };

    // 1. Update user bookings state
    setUserBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = {
            ...b,
            userReview: normalizedReview,
          };
          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(updated);
          }
          return updated;
        }
        return b;
      })
    );

    // 2. Synchronize venue rating, review count, and reviews list
    setVenues((prevVenues) => {
      return prevVenues.map((v) => {
        if (v.id === targetBooking.venueId) {
          const currentReviews = v.reviews ? [...v.reviews] : [];
          const existingIdx = currentReviews.findIndex(
            (r) => r.bookingId === bookingId || (isEdit && r.author === authorName)
          );

          const newReviewEntry = {
            id: existingIdx >= 0 ? currentReviews[existingIdx].id : `rev-${Date.now()}`,
            bookingId: bookingId,
            author: authorName,
            sport: targetBooking.sport,
            courtName: targetBooking.courtName,
            date: 'Today',
            rating: normalizedReview.rating,
            tags: normalizedReview.tags,
            comment: normalizedReview.comment,
          };

          let updatedReviews;
          if (existingIdx >= 0) {
            // Edit existing review
            updatedReviews = [...currentReviews];
            updatedReviews[existingIdx] = newReviewEntry;
          } else {
            // Prepend new review
            updatedReviews = [newReviewEntry, ...currentReviews];
          }

          // Compute new aggregate rating
          const totalRatingSum = updatedReviews.reduce(
            (sum, r) => sum + (Number(r.rating) || 5),
            0
          );
          const newAvgRating = Number((totalRatingSum / updatedReviews.length).toFixed(1));
          const newReviewsCount = (v.reviewsCount || 0) + (existingIdx >= 0 ? 0 : 1);

          const updatedVenue = {
            ...v,
            rating: newAvgRating,
            reviewsCount: newReviewsCount,
            reviews: updatedReviews,
          };

          if (selectedVenue && selectedVenue.id === v.id) {
            setSelectedVenue(updatedVenue);
          }

          return updatedVenue;
        }
        return v;
      });
    });

    // 3. Mark prompt as dismissed for this booking so user is never prompted repeatedly
    setDismissedReviewBookingIds((prev) => new Set([...prev, bookingId]));

    // 4. Send notification confirmation to player
    const reviewNotif = {
      id: `notif-rev-${Date.now()}`,
      type: 'review_published',
      title: isEdit ? 'Review Updated! ✏️' : 'Review Published! ⭐',
      message: `Your ${numericRating}-star review for ${targetBooking.venueName} is live. Thank you for your feedback!`,
      timestamp: 'Just now',
      dateIso: new Date().toISOString(),
      isRead: false,
      entityType: 'venue',
      entityId: targetBooking.venueId,
      actionText: 'View Venue',
      badgeCategory: 'Reviews',
    };
    setNotifications((prev) => [reviewNotif, ...prev]);

    return { success: true };
  };

  const handleBookAgain = (venueId) => {
    const matchedVenue = venues.find((v) => v.id === venueId) || venues[0];
    setSelectedVenue(matchedVenue);
    setSelectedCourt(matchedVenue.courts ? matchedVenue.courts[0] : null);
    setLastVenueSource('player-home');
    setCurrentStep('venue-details');
  };

  const handleNavigatePlayerTab = (tab) => {
    if (tab === 'home') {
      setCurrentStep('player-home');
    } else if (tab === 'bookings') {
      setCurrentStep('my-bookings');
    } else if (tab === 'favorites') {
      setCurrentStep('favorites');
    } else if (tab === 'profile') {
      setCurrentStep('player-profile');
    }
  };

  // Back Navigation Handlers
  const handleBack = () => {
    if (currentStep === 'login') {
      setCurrentStep('role');
    } else if (currentStep === 'player-reg' || currentStep === 'owner-reg') {
      setCurrentStep('role');
    } else if (currentStep === 'otp') {
      if (previousStep === 'login') setCurrentStep('login');
      else if (selectedRole === 'player') setCurrentStep('player-reg');
      else setCurrentStep('owner-reg');
    } else if (currentStep === 'venue-filter') {
      setCurrentStep('player-home');
    } else if (currentStep === 'venue-list') {
      setCurrentStep('player-home');
    } else if (currentStep === 'venue-details') {
      setCurrentStep(lastVenueSource === 'venue-list' ? 'venue-list' : 'player-home');
    } else if (currentStep === 'slot-calendar') {
      setCurrentStep('venue-details');
    } else if (currentStep === 'slot-lock') {
      handleReleaseSlot();
      setCurrentStep('slot-calendar');
    } else if (currentStep === 'booking-summary') {
      setCurrentStep('slot-calendar');
    } else if (currentStep === 'payment-processing') {
      setCurrentStep('booking-summary');
    } else if (
      currentStep === 'booking-confirmed' ||
      currentStep === 'booking-failed' ||
      currentStep === 'slot-conflict'
    ) {
      setCurrentStep('my-bookings');
    } else if (currentStep === 'my-bookings') {
      setCurrentStep('player-home');
    } else if (currentStep === 'booking-details') {
      setCurrentStep('my-bookings');
    } else if (currentStep === 'player-profile') {
      setCurrentStep('player-home');
    } else if (currentStep === 'notifications') {
      setCurrentStep('player-home');
    } else if (currentStep === 'wallet') {
      setCurrentStep('player-profile');
    } else if (currentStep === 'favorites') {
      setCurrentStep('player-home');
    } else if (currentStep === 'referral') {
      setCurrentStep('player-profile');
    } else if (currentStep === 'support-center') {
      setSupportBookingContext(null);
      setCurrentStep(supportPreviousStep || 'player-profile');
    } else if (currentStep === 'admin-login') {
      setCurrentStep(previousStep === 'admin-login' ? 'role' : previousStep || 'role');
    } else if (currentStep === 'admin-2fa') {
      setCurrentStep('admin-login');
    } else if (currentStep === 'admin-dashboard') {
      handleAdminLogout();
    } else if (currentStep === 'player-home' || currentStep === 'owner-dashboard') {
      handleResetFlow();
    }
  };

  const handleResetFlow = () => {
    setCurrentStep('role');
    setSelectedRole(null);
  };

  const showHeaderBack =
    currentStep !== 'role' &&
    currentStep !== 'player-home' &&
    currentStep !== 'notifications' &&
    currentStep !== 'my-bookings' &&
    currentStep !== 'booking-details' &&
    currentStep !== 'player-profile' &&
    currentStep !== 'wallet' &&
    currentStep !== 'favorites' &&
    currentStep !== 'referral' &&
    currentStep !== 'support-center' &&
    currentStep !== 'owner-dashboard' &&
    currentStep !== 'booking-confirmed' &&
    currentStep !== 'admin-login' &&
    currentStep !== 'admin-2fa' &&
    currentStep !== 'admin-dashboard';

  const activePhone =
    selectedRole === 'player' ? playerData.phoneNumber : ownerData.ownerPhoneNumber;
  const activeCountryCode =
    selectedRole === 'player' ? playerData.countryCode : ownerData.ownerCountryCode;

  return (
    <MobileFrame
      currentStep={currentStep}
      onBack={handleBack}
      showBack={showHeaderBack}
    >
      {/* SCREEN 0: ROLE SELECTION */}
      {currentStep === 'role' && (
        <RoleSelectionScreen
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onContinue={handleRoleContinue}
          onNavigateLogin={handleNavigateLogin}
          onNavigateAdmin={handleNavigateAdmin}
        />
      )}

      {/* SCREEN 0B: UNIFIED LOGIN */}
      {currentStep === 'login' && (
        <LoginScreen
          initialRole={selectedRole || 'player'}
          onLoginSuccess={handleDirectLoginSuccess}
          onRequireOtp={handleRequireOtpFromLogin}
          onNavigateRegister={handleNavigateRegister}
          onNavigateAdmin={handleNavigateAdmin}
        />
      )}

      {/* SCREEN 0C: ADMIN LOGIN & CREDENTIALS VERIFICATION */}
      {currentStep === 'admin-login' && (
        <AdminLoginScreen
          onRequire2FA={handleRequireAdmin2FA}
          onNavigateBack={() => setCurrentStep('role')}
          onSwitchToRole={(role) => {
            setSelectedRole(role);
            setCurrentStep('login');
          }}
        />
      )}

      {/* SCREEN 0D: ADMIN 2FA MULTI-FACTOR VERIFICATION */}
      {currentStep === 'admin-2fa' && (
        <Admin2faScreen
          challengeData={adminChallengeData}
          onVerifySuccess={handleAdmin2FASuccess}
          onBackToLogin={() => setCurrentStep('admin-login')}
        />
      )}

      {/* SCREEN 0E: PROTECTED ADMIN DASHBOARD */}
      {currentStep === 'admin-dashboard' && (
        <AdminDashboardScreen
          adminSession={adminSession || adminAuthService.getAdminSession()}
          onLogoutSuccess={handleAdminLogout}
          onNavigateToUserApp={() => {
            setSelectedRole('player');
            setCurrentStep('player-home');
          }}
        />
      )}

      {/* REGISTRATION SCREENS */}
      {currentStep === 'player-reg' && (
        <PlayerRegistrationScreen
          formData={playerData}
          setFormData={setPlayerData}
          onSubmit={handleFormSubmit}
          onNavigateLogin={handleNavigateLogin}
        />
      )}

      {currentStep === 'owner-reg' && (
        <OwnerRegistrationScreen
          formData={ownerData}
          setFormData={setOwnerData}
          onSubmit={(session) => {
            if (session?.verificationStatus === 'verified') {
              setCurrentStep('owner-dashboard');
            } else {
              setCurrentStep('owner-verification');
            }
          }}
          onNavigateVerification={() => setCurrentStep('owner-verification')}
          onNavigateDashboard={() => setCurrentStep('owner-dashboard')}
          onNavigateLogin={handleNavigateLogin}
        />
      )}

      {currentStep === 'owner-verification' && (
        <OwnerBusinessVerificationScreen
          ownerSession={ownerAuthService.getOwnerSession()}
          onVerificationSuccess={(newStatus) => {
            if (newStatus === 'verified') {
              setCurrentStep('owner-dashboard');
            }
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* OTP VERIFICATION */}
      {currentStep === 'otp' && (
        <OtpVerificationScreen
          phoneNumber={activePhone}
          countryCode={activeCountryCode}
          onVerifySuccess={handleOtpVerified}
          onEditPhone={() => {
            if (previousStep === 'login') setCurrentStep('login');
            else if (selectedRole === 'player') setCurrentStep('player-reg');
            else setCurrentStep('owner-reg');
          }}
        />
      )}

      {/* WORKFLOW SCREEN 1: PLAYER HOME */}
      {currentStep === 'player-home' && (
        <PlayerHomeScreen
          userName={playerData.fullName || 'Player'}
          location={playerData.city || 'Pune, Maharashtra'}
          venues={venues}
          favoriteVenueIds={favoriteVenueIds}
          onToggleFavorite={handleToggleFavorite}
          pendingReviewBooking={userBookings.find(
            (b) =>
              (b.category === 'past' || b.status === 'completed') &&
              !b.userReview &&
              !dismissedReviewBookingIds.has(b.id)
          )}
          onDismissRatingPrompt={(bookingId) => {
            setDismissedReviewBookingIds((prev) => new Set([...prev, bookingId]));
          }}
          unreadNotifCount={notifications.filter((n) => !n.isRead).length}
          onRateBooking={handleRateBooking}
          onSelectVenue={handleSelectVenueFromHome}
          onOpenFilter={handleOpenFilter}
          onViewAll={handleViewAllVenues}
          onNavigateTab={handleNavigatePlayerTab}
          onOpenNotifications={() => setCurrentStep('notifications')}
          onOpenFavorites={() => setCurrentStep('favorites')}
        />
      )}

      {/* WORKFLOW SCREEN 1B: NOTIFICATIONS HUB */}
      {currentStep === 'notifications' && (
        <NotificationsScreen
          notifications={notifications}
          onBack={() => setCurrentStep('player-home')}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAsUnread={handleMarkNotificationAsUnread}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearNotification={handleClearNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onNotificationClick={handleNotificationClick}
          onSimulatePush={handleSimulatePushNotification}
        />
      )}

      {/* WORKFLOW SCREEN 2: SPORT & LOCATION FILTER */}
      {currentStep === 'venue-filter' && (
        <VenueFilterScreen
          venues={venues}
          initialFilters={venueFilters}
          onApplyFilters={handleApplyFilters}
          onCancel={() => setCurrentStep('player-home')}
        />
      )}

      {/* WORKFLOW SCREEN 3: VENUE LIST */}
      {currentStep === 'venue-list' && (
        <VenueListScreen
          venues={venues}
          activeFilters={venueFilters}
          favoriteVenueIds={favoriteVenueIds}
          onToggleFavorite={handleToggleFavorite}
          onSelectVenue={handleSelectVenueFromList}
          onOpenFilter={handleOpenFilter}
        />
      )}

      {/* WORKFLOW SCREEN 4: VENUE DETAILS */}
      {currentStep === 'venue-details' && (
        <VenueDetailsScreen
          venue={selectedVenue}
          selectedCourt={selectedCourt}
          isFavorite={selectedVenue ? favoriteVenueIds.has(selectedVenue.id) : false}
          onToggleFavorite={handleToggleFavorite}
          onSelectCourt={setSelectedCourt}
          onViewSlots={handleViewSlots}
        />
      )}

      {/* WORKFLOW SCREEN 5: SLOT CALENDAR */}
      {currentStep === 'slot-calendar' && (
        <SlotCalendarScreen
          venue={selectedVenue}
          court={selectedCourt}
          slotsData={slotsData}
          upcomingDates={upcomingDates}
          onContinueBooking={handleContinueBookingFromCalendar}
          onSimulateConflict={handleSimulateConflictFromCalendar}
        />
      )}

      {/* FEATURE SCREEN: SLOT LOCKING & RESERVATION STATE */}
      {currentStep === 'slot-lock' && (
        <SlotLockScreen
          bookingData={activeBooking}
          timeRemaining={timeRemaining}
          onProceedToSummary={handleProceedToSummary}
          onCancelReservation={handleCancelReservation}
        />
      )}

      {/* FEATURE SCREEN: BOOKING SUMMARY */}
      {currentStep === 'booking-summary' && (
        <BookingSummaryScreen
          bookingData={activeBooking}
          timeRemaining={timeRemaining}
          onProceedToPayment={handleProceedToPayment}
          onCancelBooking={handleCancelFromSummary}
          onChangeSlot={handleChangeSlotFromSummary}
        />
      )}

      {/* FEATURE SCREEN: PAYMENT PROCESSING */}
      {currentStep === 'payment-processing' && (
        <PaymentProcessingScreen
          bookingData={activeBooking}
          playerData={playerData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onPaymentConflict={handlePaymentConflict}
        />
      )}

      {/* FEATURE SCREEN 5A: BOOKING CONFIRMED */}
      {currentStep === 'booking-confirmed' && (
        <BookingConfirmedScreen
          bookingData={activeBooking}
          userName={playerData.fullName}
          onViewBookings={() => {
            if (activeBooking?.isGroupBooking) {
              const matched = userBookings.find((b) => b.id === activeBooking.id || b.bookingId === activeBooking.bookingId);
              if (matched) setSelectedBooking(matched);
              setCurrentStep('booking-details');
            } else {
              setCurrentStep('my-bookings');
            }
          }}
          onBackToHome={() => setCurrentStep('player-home')}
        />
      )}

      {/* FEATURE SCREEN 5B: PAYMENT FAILED / CANCELLED */}
      {currentStep === 'booking-failed' && (
        <BookingFailedScreen
          bookingData={activeBooking}
          onTryAnotherSlot={() => setCurrentStep('slot-calendar')}
          onBackToVenue={() => setCurrentStep('venue-details')}
        />
      )}

      {/* FEATURE SCREEN: SIMULATED DOUBLE-BOOKING CONFLICT */}
      {currentStep === 'slot-conflict' && (
        <SlotConflictScreen
          bookingData={activeBooking}
          onChooseAnotherSlot={() => setCurrentStep('slot-calendar')}
        />
      )}

      {/* FEATURE SCREEN: MY BOOKINGS */}
      {currentStep === 'my-bookings' && (
        <MyBookingsScreen
          bookings={userBookings}
          onSelectBooking={handleSelectBooking}
          onCancelBooking={handleCancelBooking}
          onRescheduleBooking={handleRescheduleBooking}
          onRateBooking={handleRateBooking}
          onBookAgain={handleBookAgain}
          onNavigateTab={handleNavigatePlayerTab}
          onExploreVenues={() => setCurrentStep('player-home')}
        />
      )}

      {/* FEATURE SCREEN: BOOKING DETAILS (DIGITAL PASS) */}
      {currentStep === 'booking-details' && (
        <BookingDetailScreen
          booking={selectedBooking}
          onBack={() => setCurrentStep('my-bookings')}
          onCancelBooking={handleCancelBooking}
          onRescheduleBooking={handleRescheduleBooking}
          onRateBooking={handleRateBooking}
          onBookAgain={handleBookAgain}
          onUpdateBooking={handleUpdateBooking}
          onOpenSupport={(booking) => {
            setSupportBookingContext(booking || selectedBooking);
            setSupportInitialTab('tickets');
            setSupportPreviousStep('booking-details');
            setCurrentStep('support-center');
          }}
        />
      )}

      {/* FEATURE SCREEN: USER PROFILE */}
      {currentStep === 'player-profile' && (
        <UserProfileScreen
          playerData={playerData}
          walletBalance={walletData.balance}
          onUpdateProfile={(updated) => setPlayerData(updated)}
          onNavigateTab={handleNavigatePlayerTab}
          onOpenWallet={() => setCurrentStep('wallet')}
          onOpenReferrals={() => setCurrentStep('referral')}
          onOpenSupport={() => {
            setSupportBookingContext(null);
            setSupportInitialTab('faqs');
            setSupportPreviousStep('player-profile');
            setCurrentStep('support-center');
          }}
          onLogout={handleResetFlow}
        />
      )}

      {/* FEATURE SCREEN: REFERRAL & INVITE FRIENDS */}
      {currentStep === 'referral' && (
        <ReferralScreen
          playerData={playerData}
          onBack={() => setCurrentStep('player-profile')}
          onOpenWallet={() => setCurrentStep('wallet')}
        />
      )}

      {/* FEATURE SCREEN: HELP & SUPPORT CENTER */}
      {currentStep === 'support-center' && (
        <SupportCenterScreen
          playerData={playerData}
          onBack={() => {
            setSupportBookingContext(null);
            setCurrentStep(supportPreviousStep || 'player-profile');
          }}
          bookingContext={supportBookingContext}
          initialTab={supportInitialTab}
          onSelectBooking={(bookingId) => {
            const match = userBookings.find(
              (b) => b.id === bookingId || b.bookingId === bookingId
            );
            if (match) {
              setSelectedBooking(match);
              setCurrentStep('booking-details');
            } else {
              setCurrentStep('my-bookings');
            }
          }}
        />
      )}

      {/* FEATURE SCREEN: ARENA WALLET & REFUNDS */}
      {currentStep === 'wallet' && (
        <WalletScreen
          walletData={walletData}
          refundsData={refundsData}
          onBack={() => setCurrentStep('player-profile')}
          onTopUpWallet={handleTopUpWallet}
          onSyncRefunds={handleSyncRefunds}
          onSelectBooking={(bookingId) => {
            const match = userBookings.find((b) => b.id === bookingId || b.bookingId === bookingId);
            if (match) {
              setSelectedBooking(match);
              setCurrentStep('booking-details');
            } else {
              setCurrentStep('my-bookings');
            }
          }}
          onExploreVenues={() => setCurrentStep('player-home')}
        />
      )}

      {/* FEATURE SCREEN: FAVORITES / SAVED VENUES */}
      {currentStep === 'favorites' && (
        <FavoritesScreen
          venues={venues}
          favoriteVenueIds={favoriteVenueIds}
          onToggleFavorite={handleToggleFavorite}
          onSelectVenue={(venue) => {
            setSelectedVenue(venue);
            setSelectedCourt(venue.courts ? venue.courts[0] : null);
            setLastVenueSource('venue-list');
            setCurrentStep('venue-details');
          }}
          onNavigateTab={handleNavigatePlayerTab}
          onExploreVenues={() => setCurrentStep('player-home')}
        />
      )}

      {/* VENUE OWNER DASHBOARD */}
      {currentStep === 'owner-dashboard' && (
        <OwnerDashboardScreen
          ownerData={{
            ...ownerData,
            venueName: currentActiveOwnerVenue?.name || ownerData.venueName,
            venueLocation: currentActiveOwnerVenue?.address || currentActiveOwnerVenue?.location || ownerData.venueLocation,
            primarySport: currentActiveOwnerVenue?.primarySport || ownerData.primarySport,
          }}
          venues={ownerVenuesList.length > 0 ? ownerVenuesList : venues}
          createdVenue={currentActiveOwnerVenue}
          onResetFlow={handleResetFlow}
          onNavigateVerification={() => setCurrentStep('owner-verification')}
          onNavigateVenueCreation={() => setCurrentStep('owner-venue-creation')}
          onNavigatePricingConfig={() => setCurrentStep('owner-pricing-config')}
          onNavigateBookings={() => setCurrentStep('owner-bookings')}
          onNavigateAvailability={() => setCurrentStep('owner-availability')}
          onNavigateEarnings={() => setCurrentStep('owner-earnings')}
          onNavigateReviews={() => setCurrentStep('owner-reviews')}
          onNavigateCoupons={() => setCurrentStep('owner-promotions')}
          onNavigateAnalytics={() => setCurrentStep('owner-analytics')}
          onNavigateVenues={() => setCurrentStep('owner-venues')}
          onNavigateStaff={() => setCurrentStep('owner-staff')}
          onNavigateNotifications={() => setCurrentStep('owner-notifications')}
        />
      )}

      {/* FEATURE 14: OWNER NOTIFICATIONS / ALERTS */}
      {currentStep === 'owner-notifications' && (
        <OwnerNotificationsScreen
          venue={currentActiveOwnerVenue}
          onNavigate={(target) => setCurrentStep(target)}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 11: OWNER ANALYTICS DASHBOARD */}
      {currentStep === 'owner-analytics' && (
        <OwnerAnalyticsScreen
          activeVenue={currentActiveOwnerVenue}
          venues={ownerVenuesList.length > 0 ? ownerVenuesList : venues}
          onSelectVenue={(v) => {
            setActiveOwnerVenueId(v.id);
            ownerVenueService.setActiveVenueId(v.id);
          }}
          onNavigate={(target) => setCurrentStep(target)}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 12: MULTI-VENUE MANAGEMENT */}
      {currentStep === 'owner-venues' && (
        <OwnerVenuesScreen
          activeVenueId={activeOwnerVenueId}
          onSelectVenue={(v) => {
            setActiveOwnerVenueId(v.id);
            ownerVenueService.setActiveVenueId(v.id);
          }}
          onNavigateAddVenue={() => setCurrentStep('owner-venue-creation')}
          onNavigateDashboard={() => setCurrentStep('owner-dashboard')}
          onNavigate={(target) => setCurrentStep(target)}
        />
      )}

      {/* FEATURE 13: STAFF MANAGEMENT */}
      {currentStep === 'owner-staff' && (
        <OwnerStaffScreen
          venue={currentActiveOwnerVenue}
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
            else if (tab === 'notifications') setCurrentStep('owner-notifications');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 6: OWNER BOOKINGS MANAGEMENT */}
      {currentStep === 'owner-bookings' && (
        <OwnerBookingsScreen
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 7: OWNER AVAILABILITY CALENDAR */}
      {currentStep === 'owner-availability' && (
        <OwnerAvailabilityScreen
          venue={currentActiveOwnerVenue}
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 8: OWNER EARNINGS & PAYOUTS */}
      {currentStep === 'owner-earnings' && (
        <OwnerEarningsScreen
          venue={currentActiveOwnerVenue}
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 9: OWNER REVIEWS MANAGEMENT */}
      {currentStep === 'owner-reviews' && (
        <OwnerReviewsScreen
          venue={currentActiveOwnerVenue}
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* FEATURE 10: OWNER PROMOTIONS / COUPONS */}
      {currentStep === 'owner-promotions' && (
        <OwnerCouponsScreen
          venue={currentActiveOwnerVenue}
          onNavigateTab={(tab) => {
            if (tab === 'dashboard') setCurrentStep('owner-dashboard');
            else if (tab === 'bookings') setCurrentStep('owner-bookings');
            else if (tab === 'analytics') setCurrentStep('owner-analytics');
            else if (tab === 'availability') setCurrentStep('owner-availability');
            else if (tab === 'venues') setCurrentStep('owner-venues');
            else if (tab === 'reviews') setCurrentStep('owner-reviews');
            else if (tab === 'promotions') setCurrentStep('owner-promotions');
            else if (tab === 'earnings') setCurrentStep('owner-earnings');
            else if (tab === 'staff') setCurrentStep('owner-staff');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* VENUE LISTING CREATION */}
      {currentStep === 'owner-venue-creation' && (
        <OwnerVenueCreationScreen
          ownerData={ownerData}
          onVenueCreated={(newVenue) => {
            setCreatedVenue(newVenue);
            setVenues((prev) => [newVenue, ...prev.filter((v) => v.id !== newVenue.id)]);
            setOwnerData((prev) => ({
              ...prev,
              venueName: newVenue.name,
              venueLocation: newVenue.address,
              primarySport: newVenue.sports[0] || 'Multi-sport',
            }));
            setCurrentStep('owner-pricing-config');
          }}
          onBack={() => setCurrentStep('owner-dashboard')}
        />
      )}

      {/* PRICING & SLOT CONFIGURATION */}
      {currentStep === 'owner-pricing-config' && (
        <OwnerPricingConfigScreen
          venue={createdVenue || { id: 'v-owner-demo', name: ownerData.venueName || 'Sports Arena', sports: [ownerData.primarySport || 'Badminton'] }}
          onComplete={() => setCurrentStep('owner-dashboard')}
          onBack={() => setCurrentStep('owner-venue-creation')}
        />
      )}
    </MobileFrame>
  );
}
