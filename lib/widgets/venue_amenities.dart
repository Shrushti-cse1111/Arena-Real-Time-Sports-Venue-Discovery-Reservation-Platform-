import 'package:flutter/material.dart';
import '../models/venue_detail_model.dart';
import '../theme/arena_theme.dart';

class VenueAmenities extends StatelessWidget {
  final List<AmenityItem> amenities;

  const VenueAmenities({
    super.key,
    required this.amenities,
  });

  @override
  Widget build(BuildContext context) {
    if (amenities.isEmpty) {
      return const SizedBox.shrink(); // Empty state: hide section gracefully
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Amenities',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: ArenaColors.textPrimary,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 12),
          // Responsive Wrap with 2-3 amenity chips per row
          LayoutBuilder(
            builder: (context, constraints) {
              final isSmall = constraints.maxWidth < 360;
              final crossAxisCount = isSmall ? 2 : 3;
              final itemWidth = (constraints.maxWidth - ((crossAxisCount - 1) * 10)) / crossAxisCount;

              return Wrap(
                spacing: 10,
                runSpacing: 10,
                children: amenities.map((amenity) {
                  return SizedBox(
                    width: itemWidth,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      decoration: BoxDecoration(
                        color: ArenaColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: ArenaColors.border,
                          width: 1,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getAmenityIcon(amenity.iconKey),
                            size: 22,
                            color: ArenaColors.primary,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            amenity.name,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: ArenaColors.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 14),
          const Divider(color: ArenaColors.divider, thickness: 1),
        ],
      ),
    );
  }

  IconData _getAmenityIcon(String iconKey) {
    switch (iconKey.toLowerCase()) {
      case 'parking':
        return Icons.local_parking_outlined;
      case 'washroom':
      case 'toilet':
        return Icons.wc_outlined;
      case 'lights':
      case 'floodlights':
        return Icons.highlight_outlined;
      case 'water':
      case 'drinking_water':
        return Icons.water_drop_outlined;
      case 'equipment':
      case 'rental':
        return Icons.sports_tennis_outlined;
      case 'changing':
      case 'changing_room':
      case 'locker':
        return Icons.checkroom_outlined;
      case 'firstaid':
      case 'medical':
        return Icons.medical_services_outlined;
      case 'cafe':
      case 'canteen':
        return Icons.local_cafe_outlined;
      case 'wifi':
        return Icons.wifi_rounded;
      case 'shower':
        return Icons.shower_outlined;
      default:
        return Icons.verified_outlined;
    }
  }
}
