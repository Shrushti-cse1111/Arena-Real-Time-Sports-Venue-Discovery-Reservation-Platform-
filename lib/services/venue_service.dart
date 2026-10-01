import 'dart:async';
import '../models/venue_detail_model.dart';

abstract class VenueRepository {
  Future<VenueDetail> getVenueDetails(String venueId);
  Future<bool> toggleFavorite(String venueId, bool currentStatus);
}

class MockVenueService implements VenueRepository {
  @override
  Future<VenueDetail> getVenueDetails(String venueId) async {
    // Simulate real network latency
    await Future.delayed(const Duration(milliseconds: 700));

    // Simulated error case if needed
    if (venueId == 'error_test') {
      throw Exception('Failed to connect to Arena servers. Please check your network.');
    }

    return VenueDetail(
      id: venueId,
      name: 'Smash Point Sports Arena',
      sports: ['Badminton', 'Box Cricket', 'Football Turf', 'Pickleball'],
      photos: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80', // Badminton court
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', // Football turf
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80', // Cricket stadium / turf
        'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1200&q=80', // Evening floodlights
      ],
      rating: 4.8,
      reviewCount: 142,
      location: const VenueLocation(
        latitude: 18.5362,
        longitude: 73.8958,
        address: 'Plot 42, North Main Road, Koregaon Park',
        area: 'Koregaon Park',
        city: 'Pune, Maharashtra',
        distanceKm: 2.3,
      ),
      amenities: const [
        AmenityItem(id: '1', name: 'Free Parking', iconKey: 'parking'),
        AmenityItem(id: '2', name: 'Washrooms', iconKey: 'washroom'),
        AmenityItem(id: '3', name: 'Floodlights', iconKey: 'lights'),
        AmenityItem(id: '4', name: 'Drinking Water', iconKey: 'water'),
        AmenityItem(id: '5', name: 'Gear Rental', iconKey: 'equipment'),
        AmenityItem(id: '6', name: 'Changing Room', iconKey: 'changing'),
        AmenityItem(id: '7', name: 'First Aid', iconKey: 'firstaid'),
        AmenityItem(id: '8', name: 'Sports Cafe', iconKey: 'cafe'),
      ],
      pricing: const [
        PricingTier(
          courtName: 'Synthetic Badminton Court (Wooden Base)',
          sport: 'Badminton',
          regularPricePerHour: 550,
          peakPricePerHour: 750,
          peakHoursNote: 'Peak: 6 PM - 10 PM & Weekends',
        ),
        PricingTier(
          courtName: 'FIFA Grade 7-a-side Football Turf',
          sport: 'Football',
          regularPricePerHour: 1400,
          peakPricePerHour: 1800,
          peakHoursNote: 'Peak: 7 PM - 11 PM',
        ),
        PricingTier(
          courtName: 'Box Cricket Pitch with High Nets',
          sport: 'Cricket',
          regularPricePerHour: 900,
          peakPricePerHour: 1200,
          peakHoursNote: 'Peak: Weekday Evenings',
        ),
        PricingTier(
          courtName: 'Outdoor Pickleball Court',
          sport: 'Pickleball',
          regularPricePerHour: 450,
          peakPricePerHour: 600,
          peakHoursNote: 'All equipment included',
        ),
      ],
      reviews: const [
        VenueReviewItem(
          id: 'r1',
          authorName: 'Rohan Deshmukh',
          rating: 5.0,
          comment: 'Top quality Yonex synthetic mat. Lighting has zero glare during evening smashes. Ample car parking!',
          formattedDate: '2 days ago',
        ),
        VenueReviewItem(
          id: 'r2',
          authorName: 'Sneha Kulkarni',
          rating: 4.5,
          comment: 'Very clean changing rooms and cold drinking water dispensers available. Turf grass is well maintained.',
          formattedDate: '1 week ago',
        ),
        VenueReviewItem(
          id: 'r3',
          authorName: 'Aditya Mehta',
          rating: 5.0,
          comment: 'Booked box cricket with office colleagues. Nets are high enough and ball bounce is consistent.',
          formattedDate: '2 weeks ago',
        ),
      ],
      startingPricePerHour: 450,
      isFavorite: false,
    );
  }

  @override
  Future<bool> toggleFavorite(String venueId, bool currentStatus) async {
    // Simulate lightweight API write
    await Future.delayed(const Duration(milliseconds: 200));
    return !currentStatus;
  }
}
