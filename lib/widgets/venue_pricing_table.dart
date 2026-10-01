import 'package:flutter/material.dart';
import '../models/venue_detail_model.dart';
import '../theme/arena_theme.dart';

class VenuePricingTable extends StatelessWidget {
  final List<PricingTier> pricing;

  const VenuePricingTable({
    super.key,
    required this.pricing,
  });

  @override
  Widget build(BuildContext context) {
    if (pricing.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Pricing',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: ArenaColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: ArenaColors.primaryContainer.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Per Hour',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: ArenaColors.primaryDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Cards/Table for each court tier
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: ArenaColors.border, width: 1),
            ),
            clipBehavior: Clip.antiAlias,
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: pricing.length,
              separatorBuilder: (_, __) => const Divider(
                height: 1,
                thickness: 1,
                color: ArenaColors.divider,
              ),
              itemBuilder: (context, index) {
                final item = pricing[index];
                final hasPeak = item.peakPricePerHour != null && item.peakPricePerHour! > 0;

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Court info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.courtName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: ArenaColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: ArenaColors.surfaceVariant,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    item.sport,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: ArenaColors.textSecondary,
                                    ),
                                  ),
                                ),
                                if (hasPeak && item.peakHoursNote != null) ...[
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      item.peakHoursNote!,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: ArenaColors.textMuted,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Price Column
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          RichText(
                            text: TextSpan(
                              text: '₹${item.regularPricePerHour}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: ArenaColors.primaryDark,
                              ),
                              children: const [
                                TextSpan(
                                  text: ' /hr',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: ArenaColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (hasPeak) ...[
                            const SizedBox(height: 2),
                            Text(
                              'Peak: ₹${item.peakPricePerHour}/hr',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFD97706), // Amber peak badge
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 10),

          // Informational note
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: ArenaColors.surfaceVariant.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 15,
                  color: ArenaColors.textSecondary,
                ),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Note: Rates shown are base estimates. Exact slot pricing and duration discounts are confirmed during slot selection.',
                    style: TextStyle(
                      fontSize: 11,
                      height: 1.35,
                      color: ArenaColors.textSecondary,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),
          const Divider(color: ArenaColors.divider, thickness: 1),
        ],
      ),
    );
  }
}
