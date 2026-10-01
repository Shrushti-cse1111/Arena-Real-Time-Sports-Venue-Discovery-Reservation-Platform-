import 'package:flutter/material.dart';
import '../models/venue_detail_model.dart';
import '../theme/arena_theme.dart';

class VenueHeader extends StatelessWidget {
  final String venueName;
  final List<String> sports;
  final double rating;
  final int reviewCount;
  final VenueLocation location;
  final VoidCallback onRatingTap;

  const VenueHeader({
    super.key,
    required this.venueName,
    required this.sports,
    required this.rating,
    required this.reviewCount,
    required this.location,
    required this.onRatingTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Sport Type Chips (Horizontally Scrollable)
          if (sports.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              child: Row(
                children: sports.map((sport) {
                  return Container(
                    margin: const EdgeInsets.only(right: 8, bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: ArenaColors.primaryContainer.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: ArenaColors.primary.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getSportIcon(sport),
                          size: 13,
                          color: ArenaColors.primary,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          sport,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: ArenaColors.primaryDark,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),

          // 2. Venue Name & Rating Badge Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  venueName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: ArenaColors.textPrimary,
                    height: 1.25,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Interactive Tappable Rating Badge
              InkWell(
                onTap: onRatingTap,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: ArenaColors.ratingGold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: ArenaColors.ratingGold.withValues(alpha: 0.35),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        color: ArenaColors.ratingGold,
                        size: 17,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        rating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFB45309), // Warm amber dark
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '($reviewCount)',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // 3. Address & Distance Indicator
          Row(
            children: [
              const Icon(
                Icons.location_on_rounded,
                size: 16,
                color: ArenaColors.primary,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${location.area}, ${location.city}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: ArenaColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: ArenaColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.near_me_rounded,
                      size: 12,
                      color: ArenaColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${location.distanceKm} km away',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: ArenaColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(color: ArenaColors.divider, thickness: 1),
        ],
      ),
    );
  }

  IconData _getSportIcon(String sportName) {
    final lower = sportName.toLowerCase();
    if (lower.contains('cricket')) return Icons.sports_cricket_rounded;
    if (lower.contains('badminton') || lower.contains('tennis') || lower.contains('pickle')) {
      return Icons.sports_tennis_rounded;
    }
    if (lower.contains('football') || lower.contains('turf') || lower.contains('soccer')) {
      return Icons.sports_soccer_rounded;
    }
    if (lower.contains('basketball')) return Icons.sports_basketball_rounded;
    if (lower.contains('swimming')) return Icons.pool_rounded;
    return Icons.emoji_events_outlined;
  }
}
