import 'package:flutter/material.dart';
import '../theme/arena_theme.dart';

class VenueDetailSkeleton extends StatefulWidget {
  const VenueDetailSkeleton({super.key});

  @override
  State<VenueDetailSkeleton> createState() => _VenueDetailSkeletonState();
}

class _VenueDetailSkeletonState extends State<VenueDetailSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.35, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _buildPlaceholder({
    required double width,
    required double height,
    double borderRadius = 8,
  }) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: ArenaColors.border.withValues(alpha: _animation.value),
            borderRadius: BorderRadius.circular(borderRadius),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ArenaColors.background,
      body: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Gallery Skeleton (270px)
            _buildPlaceholder(
              width: double.infinity,
              height: 270,
              borderRadius: 0,
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sport chips row skeleton
                  Row(
                    children: [
                      _buildPlaceholder(width: 80, height: 26, borderRadius: 13),
                      const SizedBox(width: 8),
                      _buildPlaceholder(width: 100, height: 26, borderRadius: 13),
                      const SizedBox(width: 8),
                      _buildPlaceholder(width: 70, height: 26, borderRadius: 13),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Title & Rating
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildPlaceholder(width: 200, height: 24, borderRadius: 6),
                      _buildPlaceholder(width: 60, height: 28, borderRadius: 10),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Address
                  _buildPlaceholder(width: 240, height: 16, borderRadius: 4),
                  const SizedBox(height: 20),

                  // Amenities Title & Grid
                  _buildPlaceholder(width: 100, height: 20, borderRadius: 4),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildPlaceholder(width: double.infinity, height: 60, borderRadius: 10)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildPlaceholder(width: double.infinity, height: 60, borderRadius: 10)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildPlaceholder(width: double.infinity, height: 60, borderRadius: 10)),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Location Map Skeleton
                  _buildPlaceholder(width: 90, height: 20, borderRadius: 4),
                  const SizedBox(height: 12),
                  _buildPlaceholder(width: double.infinity, height: 160, borderRadius: 16),
                  const SizedBox(height: 24),

                  // Pricing Skeleton
                  _buildPlaceholder(width: 80, height: 20, borderRadius: 4),
                  const SizedBox(height: 12),
                  _buildPlaceholder(width: double.infinity, height: 80, borderRadius: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
