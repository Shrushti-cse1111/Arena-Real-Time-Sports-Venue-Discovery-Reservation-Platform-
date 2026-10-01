import 'package:flutter/material.dart';
import '../models/venue_detail_model.dart';
import '../services/venue_service.dart';
import '../theme/arena_theme.dart';
import '../widgets/venue_photo_gallery.dart';
import '../widgets/venue_header.dart';
import '../widgets/venue_amenities.dart';
import '../widgets/venue_map.dart';
import '../widgets/venue_pricing_table.dart';
import '../widgets/venue_reviews_preview.dart';
import '../widgets/book_now_bar.dart';
import '../widgets/venue_detail_skeleton.dart';

class VenueDetailScreen extends StatefulWidget {
  final String venueId;
  final VenueRepository? repository;
  final void Function(String venueId)? onNavigateToSlotSelection;

  const VenueDetailScreen({
    super.key,
    required this.venueId,
    this.repository,
    this.onNavigateToSlotSelection,
  });

  @override
  State<VenueDetailScreen> createState() => _VenueDetailScreenState();
}

class _VenueDetailScreenState extends State<VenueDetailScreen> {
  late final VenueRepository _venueRepository;
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _reviewsSectionKey = GlobalKey();

  VenueDetail? _venueDetail;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isCollapsed = false;

  @override
  void initState() {
    super.initState();
    _venueRepository = widget.repository ?? MockVenueService();
    _scrollController.addListener(_handleScrollListener);
    _fetchVenueDetails();
  }

  void _handleScrollListener() {
    // SliverAppBar collapse threshold (270 - kToolbarHeight - safeArea)
    final collapsed = _scrollController.hasClients && _scrollController.offset > (270 - kToolbarHeight - 20);
    if (collapsed != _isCollapsed) {
      setState(() {
        _isCollapsed = collapsed;
      });
    }
  }

  Future<void> _fetchVenueDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final detail = await _venueRepository.getVenueDetails(widget.venueId);
      if (mounted) {
        setState(() {
          _venueDetail = detail;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception:', '').trim();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleFavorite() async {
    if (_venueDetail == null) return;
    final newStatus = !_venueDetail!.isFavorite;

    // Optimistic UI update
    setState(() {
      _venueDetail = _venueDetail!.copyWith(isFavorite: newStatus);
    });

    try {
      await _venueRepository.toggleFavorite(widget.venueId, !newStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(newStatus ? 'Saved to your favorites' : 'Removed from favorites'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      // Revert if request failed
      if (mounted) {
        setState(() {
          _venueDetail = _venueDetail!.copyWith(isFavorite: !newStatus);
        });
      }
    }
  }

  void _scrollToReviews() {
    final context = _reviewsSectionKey.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _handleBookNow() {
    if (widget.onNavigateToSlotSelection != null) {
      widget.onNavigateToSlotSelection!(widget.venueId);
    } else {
      // Default navigation hook to Slot Selection Screen
      Navigator.of(context).pushNamed(
        '/slot-selection',
        arguments: {'venueId': widget.venueId, 'venueName': _venueDetail?.name},
      );
    }
  }

  void _openAllReviewsSheet() {
    if (_venueDetail == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'All Reviews (${_venueDetail!.reviewCount})',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: ArenaColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: ArenaColors.divider),
                Expanded(
                  child: ListView.separated(
                    controller: scrollController,
                    padding: const EdgeInsets.all(20),
                    itemCount: _venueDetail!.reviews.length,
                    separatorBuilder: (_, __) => const Divider(
                      height: 24,
                      color: ArenaColors.divider,
                    ),
                    itemBuilder: (context, idx) {
                      final review = _venueDetail!.reviews[idx];
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: ArenaColors.primaryContainer,
                                child: Text(
                                  review.authorName[0].toUpperCase(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: ArenaColors.primaryDark,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      review.authorName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      review.formattedDate,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: ArenaColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, size: 16, color: ArenaColors.ratingGold),
                                  const SizedBox(width: 2),
                                  Text(
                                    review.rating.toStringAsFixed(1),
                                    style: const TextStyle(fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            review.comment,
                            style: const TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: ArenaColors.textSecondary,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const VenueDetailSkeleton();
    }

    if (_errorMessage != null || _venueDetail == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade600),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Failed to load venue',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage ?? 'An unexpected error occurred.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: ArenaColors.textSecondary),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _fetchVenueDetails,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Try Again'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final venue = _venueDetail!;

    return Scaffold(
      backgroundColor: ArenaColors.background,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600), // Responsive tablet constraint
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // 1. Collapsing Photo Gallery SliverAppBar
              SliverAppBar(
                expandedHeight: 270.0,
                pinned: true,
                elevation: _isCollapsed ? 2 : 0,
                backgroundColor: ArenaColors.surface,
                leading: _isCollapsed
                    ? IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: ArenaColors.textPrimary),
                        onPressed: () => Navigator.of(context).maybePop(),
                      )
                    : const SizedBox.shrink(), // Floating button handled inside VenuePhotoGallery
                title: _isCollapsed
                    ? Text(
                        venue.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: ArenaColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      )
                    : null,
                actions: _isCollapsed
                    ? [
                        IconButton(
                          icon: Icon(
                            venue.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            color: venue.isFavorite ? const Color(0xFFEF4444) : ArenaColors.textPrimary,
                          ),
                          onPressed: _toggleFavorite,
                        ),
                        const SizedBox(width: 8),
                      ]
                    : null,
                flexibleSpace: FlexibleSpaceBar(
                  background: VenuePhotoGallery(
                    photos: venue.photos,
                    isFavorite: venue.isFavorite,
                    onToggleFavorite: _toggleFavorite,
                    onBack: () => Navigator.of(context).maybePop(),
                  ),
                ),
              ),

              // 2. Scrollable Body Sections
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section 2: Header (Name, Sport chips, rating badge, address)
                    VenueHeader(
                      venueName: venue.name,
                      sports: venue.sports,
                      rating: venue.rating,
                      reviewCount: venue.reviewCount,
                      location: venue.location,
                      onRatingTap: _scrollToReviews,
                    ),

                    // Section 3: Amenities Section
                    VenueAmenities(
                      amenities: venue.amenities,
                    ),

                    // Section 4: Location & Map Section
                    VenueMap(
                      location: venue.location,
                      venueName: venue.name,
                    ),

                    // Section 5: Pricing Table
                    VenuePricingTable(
                      pricing: venue.pricing,
                    ),

                    // Section 6: Reviews Section
                    Container(
                      key: _reviewsSectionKey,
                      child: VenueReviewsPreview(
                        reviews: venue.reviews,
                        averageRating: venue.rating,
                        totalReviewCount: venue.reviewCount,
                        onSeeAllReviews: _openAllReviewsSheet,
                      ),
                    ),

                    // Spacing so content doesn't get covered by Sticky Bottom Bar
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),

      // 7. Sticky Bottom Bar
      bottomNavigationBar: BookNowBar(
        startingPricePerHour: venue.startingPricePerHour,
        onBookNow: _handleBookNow,
      ),
    );
  }
}
