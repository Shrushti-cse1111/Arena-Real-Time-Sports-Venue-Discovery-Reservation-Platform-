/**
 * ARENA — OWNER VENUE & PRICING SERVICE
 * Handles Venue Listing Creation, Photo Uploads, and Pricing & Slot Configuration.
 * 
 * Endpoints:
 * - POST /owner/venues
 * - POST /owner/venues/:id/photos
 * - GET /owner/venues/:venueId/pricing-rules
 * - POST /owner/venues/:venueId/pricing-rules
 * - PUT /owner/pricing-rules/:id
 * - DELETE /owner/pricing-rules/:id
 */

const STORAGE_KEY_VENUES = 'arena_owner_venues';
const STORAGE_KEY_PRICING_RULES = 'arena_owner_pricing_rules';
const SESSION_KEY_SELECTED_VENUE = 'arena_selected_venue_id';

// Default multi-venue catalog for owner
const DEFAULT_OWNER_VENUES = [
  {
    id: 'venue-101',
    name: 'Arena Sports Club - FC Road',
    sports: ['Badminton', 'Tennis', 'Cricket'],
    primarySport: 'Badminton',
    address: 'FC Road, Shivaji Nagar, Pune, Maharashtra 411005',
    location: 'FC Road, Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    photos: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511067007772-9d821360098f?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Parking', 'Locker Room', 'Floodlights', 'Drinking Water', 'Equipment Rental'],
    ownerId: 'owner-session-id',
    status: 'active',
    rating: 4.8,
    reviewsCount: 42,
    courtsCount: 4,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'venue-102',
    name: 'Smash Zone Turf - Viman Nagar',
    sports: ['Badminton', 'Pickleball', 'Football'],
    primarySport: 'Badminton',
    address: 'Viman Nagar, Near Symbiosis, Pune, Maharashtra 411014',
    location: 'Viman Nagar, Pune',
    latitude: 18.5679,
    longitude: 73.9143,
    photos: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Parking', 'Cafeteria', 'Showers', 'Equipment Rental'],
    ownerId: 'owner-session-id',
    status: 'active',
    rating: 4.6,
    reviewsCount: 28,
    courtsCount: 3,
    createdAt: '2026-03-20T12:00:00.000Z',
  },
  {
    id: 'venue-103',
    name: 'Champions Futsal & Turf - Baner',
    sports: ['Football', 'Cricket'],
    primarySport: 'Football',
    address: 'Baner High Street, Pune, Maharashtra 411045',
    location: 'Baner, Pune',
    latitude: 18.5590,
    longitude: 73.7868,
    photos: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529900240051-06c3960f7038?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Floodlights', 'Parking', 'First Aid'],
    ownerId: 'owner-session-id',
    status: 'pending',
    rating: 0,
    reviewsCount: 0,
    courtsCount: 2,
    createdAt: '2026-09-28T09:30:00.000Z',
  },
];

function getStoredVenues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENUES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VENUES, JSON.stringify(DEFAULT_OWNER_VENUES));
      return DEFAULT_OWNER_VENUES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OWNER_VENUES;
  } catch (e) {
    return DEFAULT_OWNER_VENUES;
  }
}

const DEFAULT_PRICING_RULES = [
  {
    id: 'rule-101',
    venueId: 'venue-101',
    court: 'Court 1 (Badminton)',
    duration: 60, // 30, 60, 90, 120 minutes
    offPeakRate: 400,
    peakRate: 600,
    currency: 'INR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-102',
    venueId: 'venue-101',
    court: 'Court 2 (Badminton)',
    duration: 60,
    offPeakRate: 450,
    peakRate: 650,
    currency: 'INR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getStoredPricingRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICING_RULES);
    return raw ? JSON.parse(raw) : DEFAULT_PRICING_RULES;
  } catch (e) {
    return DEFAULT_PRICING_RULES;
  }
}

function saveStoredPricingRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEY_PRICING_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save pricing rules:', e);
  }
}

export const ownerVenueService = {
  /**
   * Get Active Venue ID from current authenticated session
   */
  getActiveVenueId() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY_SELECTED_VENUE);
      if (stored) return stored;
    } catch (e) {}
    const venues = getStoredVenues();
    const activeOne = venues.find((v) => v.status === 'active') || venues[0];
    const defaultId = activeOne ? activeOne.id : 'venue-101';
    try {
      sessionStorage.setItem(SESSION_KEY_SELECTED_VENUE, defaultId);
    } catch (e) {}
    return defaultId;
  },

  /**
   * Set Active Venue ID for the session
   */
  setActiveVenueId(venueId) {
    try {
      sessionStorage.setItem(SESSION_KEY_SELECTED_VENUE, venueId);
    } catch (e) {}
    return venueId;
  },

  /**
   * Fetch all owner/staff venues
   * GET /owner/venues
   */
  async getVenues(ownerId = 'owner-session-id', role = 'owner') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const all = getStoredVenues();
    if (role === 'staff') {
      // Staff can only access specifically assigned venues
      return all.filter((v) => v.status === 'active').slice(0, 1);
    }
    // Owner can access all their owned venues
    return all.filter((v) => !v.ownerId || v.ownerId === ownerId || v.ownerId === 'owner-session-id');
  },

  /**
   * Fetch a single venue by ID
   * GET /owner/venues/:id
   */
  async getVenueById(venueId) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const all = getStoredVenues();
    const found = all.find((v) => v.id === venueId);
    if (!found) {
      throw new Error(`Venue with ID "${venueId}" not found.`);
    }
    return found;
  },

  /**
   * Create a new venue listing
   * POST /owner/venues
   */
  async createVenue(payload) {
    const { name, sports, address, latitude, longitude, photos, amenities, ownerId, status } = payload;

    // Server-side validation check
    if (!name || !name.trim()) throw new Error('Venue name is required.');
    if (!sports || !Array.isArray(sports) || sports.length === 0) throw new Error('At least one sport must be selected.');
    if (!address || !address.trim()) throw new Error('Formatted address is required.');
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      throw new Error('Valid location coordinates (latitude and longitude) are required.');
    }
    if (!photos || !Array.isArray(photos) || photos.length < 3) {
      throw new Error('Minimum 3 venue photos are required.');
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const venueId = `venue-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVenue = {
      id: venueId,
      name: name.trim(),
      sports,
      primarySport: sports[0] || 'Multi-sport',
      address: address.trim(),
      location: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      photos,
      amenities: amenities || [],
      ownerId: ownerId || 'owner-session-id',
      status: status || 'active',
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      createdAt: new Date().toISOString(),
    };

    const existing = getStoredVenues();
    const updated = [newVenue, ...existing];
    saveStoredVenues(updated);

    return {
      success: true,
      message: 'Venue listing created successfully!',
      venue: newVenue,
    };
  },

  /**
   * Upload photos to S3/Cloudinary (Simulated with validation and progress tracking)
   * POST /owner/venues/:id/photos
   */
  async uploadPhoto(venueId, file, onProgress = () => {}) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type "${file.type || 'unknown'}". Only JPEG, PNG, and WebP images are allowed.`);
    }

    // Validate size (max 5MB)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds the maximum limit of ${MAX_SIZE_MB}MB.`);
    }

    // Simulate chunked S3/Cloudinary upload progress
    const steps = [15, 40, 75, 100];
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      onProgress(step);
    }

    // Read base64 / object URL for preview and persistent simulation
    const previewUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const s3SimulatedUrl = previewUrl || `https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80`;

    return {
      success: true,
      url: s3SimulatedUrl,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
    };
  },

  /**
   * Fetch all pricing rules for a venue
   * GET /owner/venues/:venueId/pricing-rules
   */
  async getPricingRules(venueId) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const allRules = getStoredPricingRules();
    return allRules.filter((r) => r.venueId === venueId || venueId === 'all');
  },

  /**
   * Create a new pricing rule
   * POST /owner/venues/:venueId/pricing-rules
   */
  async createPricingRule(venueId, ruleData) {
    const { court, duration, offPeakRate, peakRate } = ruleData;

    if (!court || !court.trim()) throw new Error('Court designation is required.');
    
    const parsedDuration = Number(duration);
    if (![30, 60, 90, 120].includes(parsedDuration)) {
      throw new Error('Duration must be 30, 60, 90, or 120 minutes.');
    }

    const parsedOffPeak = Number(offPeakRate);
    const parsedPeak = Number(peakRate);

    if (isNaN(parsedOffPeak) || parsedOffPeak <= 0) {
      throw new Error('Off-peak rate must be greater than ₹0.');
    }
    if (isNaN(parsedPeak) || parsedPeak <= 0) {
      throw new Error('Peak rate must be greater than ₹0.');
    }
    if (parsedPeak <= parsedOffPeak) {
      throw new Error('Peak rate must be strictly higher than off-peak rate.');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const newRule = {
      id: `rule-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      venueId: venueId || 'v-owner-demo',
      court: court.trim(),
      duration: parsedDuration,
      offPeakRate: parsedOffPeak,
      peakRate: parsedPeak,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allRules = getStoredPricingRules();
    const updated = [newRule, ...allRules];
    saveStoredPricingRules(updated);

    return {
      success: true,
      rule: newRule,
      message: 'Pricing rule created successfully!',
    };
  },

  /**
   * Update an existing pricing rule
   * PUT /owner/pricing-rules/:id
   */
  async updatePricingRule(ruleId, ruleData) {
    const { court, duration, offPeakRate, peakRate } = ruleData;

    if (!court || !court.trim()) throw new Error('Court designation is required.');
    
    const parsedDuration = Number(duration);
    if (![30, 60, 90, 120].includes(parsedDuration)) {
      throw new Error('Duration must be 30, 60, 90, or 120 minutes.');
    }

    const parsedOffPeak = Number(offPeakRate);
    const parsedPeak = Number(peakRate);

    if (isNaN(parsedOffPeak) || parsedOffPeak <= 0) {
      throw new Error('Off-peak rate must be greater than ₹0.');
    }
    if (isNaN(parsedPeak) || parsedPeak <= 0) {
      throw new Error('Peak rate must be greater than ₹0.');
    }
    if (parsedPeak <= parsedOffPeak) {
      throw new Error('Peak rate must be strictly higher than off-peak rate.');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const allRules = getStoredPricingRules();
    let updatedRule = null;

    const updatedList = allRules.map((r) => {
      if (r.id === ruleId) {
        updatedRule = {
          ...r,
          court: court.trim(),
          duration: parsedDuration,
          offPeakRate: parsedOffPeak,
          peakRate: parsedPeak,
          updatedAt: new Date().toISOString(),
        };
        return updatedRule;
      }
      return r;
    });

    if (!updatedRule) {
      throw new Error('Pricing rule not found.');
    }

    saveStoredPricingRules(updatedList);

    return {
      success: true,
      rule: updatedRule,
      message: 'Pricing rule updated successfully!',
    };
  },

  /**
   * Delete a pricing rule
   * DELETE /owner/pricing-rules/:id
   */
  async deletePricingRule(ruleId) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const allRules = getStoredPricingRules();
    const filtered = allRules.filter((r) => r.id !== ruleId);
    saveStoredPricingRules(filtered);

    return {
      success: true,
      ruleId,
      message: 'Pricing rule deleted successfully.',
    };
  },
};
