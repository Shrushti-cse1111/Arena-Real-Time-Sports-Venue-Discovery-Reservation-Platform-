class VenueLocation {
  final double latitude;
  final double longitude;
  final String address;
  final String area;
  final String city;
  final double distanceKm;

  const VenueLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.area,
    required this.city,
    required this.distanceKm,
  });

  factory VenueLocation.fromJson(Map<String, dynamic> json) {
    return VenueLocation(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'] as String? ?? '',
      area: json['area'] as String? ?? '',
      city: json['city'] as String? ?? '',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'address': address,
    'area': area,
    'city': city,
    'distanceKm': distanceKm,
  };
}

class AmenityItem {
  final String id;
  final String name;
  final String iconKey; // e.g. 'parking', 'washroom', 'lights', 'water', 'equipment', 'changing'

  const AmenityItem({
    required this.id,
    required this.name,
    required this.iconKey,
  });

  factory AmenityItem.fromJson(Map<String, dynamic> json) {
    return AmenityItem(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      iconKey: json['iconKey'] as String? ?? 'generic',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'iconKey': iconKey,
  };
}

class PricingTier {
  final String courtName;
  final String sport;
  final int regularPricePerHour;
  final int? peakPricePerHour;
  final String? peakHoursNote;

  const PricingTier({
    required this.courtName,
    required this.sport,
    required this.regularPricePerHour,
    this.peakPricePerHour,
    this.peakHoursNote,
  });

  factory PricingTier.fromJson(Map<String, dynamic> json) {
    return PricingTier(
      courtName: json['courtName'] as String? ?? '',
      sport: json['sport'] as String? ?? '',
      regularPricePerHour: (json['regularPricePerHour'] as num?)?.toInt() ?? 0,
      peakPricePerHour: (json['peakPricePerHour'] as num?)?.toInt(),
      peakHoursNote: json['peakHoursNote'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'courtName': courtName,
    'sport': sport,
    'regularPricePerHour': regularPricePerHour,
    'peakPricePerHour': peakPricePerHour,
    'peakHoursNote': peakHoursNote,
  };
}

class VenueReviewItem {
  final String id;
  final String authorName;
  final String? authorAvatarUrl;
  final double rating;
  final String comment;
  final String formattedDate;

  const VenueReviewItem({
    required this.id,
    required this.authorName,
    this.authorAvatarUrl,
    required this.rating,
    required this.comment,
    required this.formattedDate,
  });

  factory VenueReviewItem.fromJson(Map<String, dynamic> json) {
    return VenueReviewItem(
      id: json['id'] as String? ?? '',
      authorName: json['authorName'] as String? ?? 'Player',
      authorAvatarUrl: json['authorAvatarUrl'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      comment: json['comment'] as String? ?? '',
      formattedDate: json['formattedDate'] as String? ?? 'Recently',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'authorName': authorName,
    'authorAvatarUrl': authorAvatarUrl,
    'rating': rating,
    'comment': comment,
    'formattedDate': formattedDate,
  };
}

class VenueDetail {
  final String id;
  final String name;
  final List<String> sports;
  final List<String> photos;
  final double rating;
  final int reviewCount;
  final VenueLocation location;
  final List<AmenityItem> amenities;
  final List<PricingTier> pricing;
  final List<VenueReviewItem> reviews;
  final int startingPricePerHour;
  final bool isFavorite;

  const VenueDetail({
    required this.id,
    required this.name,
    required this.sports,
    required this.photos,
    required this.rating,
    required this.reviewCount,
    required this.location,
    required this.amenities,
    required this.pricing,
    required this.reviews,
    required this.startingPricePerHour,
    this.isFavorite = false,
  });

  VenueDetail copyWith({
    String? id,
    String? name,
    List<String>? sports,
    List<String>? photos,
    double? rating,
    int? reviewCount,
    VenueLocation? location,
    List<AmenityItem>? amenities,
    List<PricingTier>? pricing,
    List<VenueReviewItem>? reviews,
    int? startingPricePerHour,
    bool? isFavorite,
  }) {
    return VenueDetail(
      id: id ?? this.id,
      name: name ?? this.name,
      sports: sports ?? this.sports,
      photos: photos ?? this.photos,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      location: location ?? this.location,
      amenities: amenities ?? this.amenities,
      pricing: pricing ?? this.pricing,
      reviews: reviews ?? this.reviews,
      startingPricePerHour: startingPricePerHour ?? this.startingPricePerHour,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  factory VenueDetail.fromJson(Map<String, dynamic> json) {
    return VenueDetail(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      sports: (json['sports'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      photos: (json['photos'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      location: VenueLocation.fromJson(json['location'] as Map<String, dynamic>? ?? {}),
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => AmenityItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      pricing: (json['pricing'] as List<dynamic>?)
              ?.map((e) => PricingTier.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      reviews: (json['reviews'] as List<dynamic>?)
              ?.map((e) => VenueReviewItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      startingPricePerHour: (json['startingPricePerHour'] as num?)?.toInt() ?? 0,
      isFavorite: json['isFavorite'] as bool? ?? false,
    );
  }
}
