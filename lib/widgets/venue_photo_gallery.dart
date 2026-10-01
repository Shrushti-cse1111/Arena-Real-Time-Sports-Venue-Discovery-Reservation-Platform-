import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'full_screen_image_viewer.dart';

class VenuePhotoGallery extends StatefulWidget {
  final List<String> photos;
  final bool isFavorite;
  final VoidCallback onToggleFavorite;
  final VoidCallback? onBack;

  const VenuePhotoGallery({
    super.key,
    required this.photos,
    required this.isFavorite,
    required this.onToggleFavorite,
    this.onBack,
  });

  @override
  State<VenuePhotoGallery> createState() => _VenuePhotoGalleryState();
}

class _VenuePhotoGalleryState extends State<VenuePhotoGallery> {
  late PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasPhotos = widget.photos.isNotEmpty;

    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Photos Carousel
        if (hasPhotos)
          PageView.builder(
            controller: _pageController,
            itemCount: widget.photos.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemBuilder: (context, index) {
              final photoUrl = widget.photos[index];
              return GestureDetector(
                onTap: () {
                  FullScreenImageViewer.open(
                    context,
                    imageUrls: widget.photos,
                    initialIndex: index,
                  );
                },
                child: CachedNetworkImage(
                  imageUrl: photoUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: const Color(0xFFE2E8E5),
                    child: const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Color(0xFF1F5C4A),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: const Color(0xFFDDE4E1),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.sports_tennis_rounded, size: 48, color: Color(0xFF1F5C4A)),
                        SizedBox(height: 8),
                        Text('Arena Sports Venue', style: TextStyle(color: Color(0xFF1F5C4A))),
                      ],
                    ),
                  ),
                ),
              );
            },
          )
        else
          Container(
            color: const Color(0xFF1F5C4A),
            child: const Center(
              child: Icon(Icons.sports_soccer_rounded, size: 64, color: Colors.white70),
            ),
          ),

        // 2. Subtle gradient overlay at top & bottom for high contrast
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.45),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.55),
                ],
                stops: const [0.0, 0.25, 0.7, 1.0],
              ),
            ),
          ),
        ),

        // 3. Floating Action Buttons (Back & Favorite)
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          right: 16,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildCircleButton(
                icon: Icons.arrow_back_ios_new_rounded,
                onTap: widget.onBack ?? () => Navigator.of(context).maybePop(),
                tooltip: 'Back',
              ),
              _buildCircleButton(
                icon: widget.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                iconColor: widget.isFavorite ? const Color(0xFFEF4444) : Colors.white,
                onTap: widget.onToggleFavorite,
                tooltip: widget.isFavorite ? 'Remove from favorites' : 'Save venue',
              ),
            ],
          ),
        ),

        // 4. Dot Indicator at bottom center
        if (hasPhotos && widget.photos.length > 1)
          Positioned(
            bottom: 14,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.photos.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _currentIndex == index ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentIndex == index ? Colors.white : Colors.white.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required VoidCallback onTap,
    Color iconColor = Colors.white,
    String? tooltip,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
      ),
      child: IconButton(
        icon: Icon(icon, color: iconColor, size: 20),
        tooltip: tooltip,
        constraints: const BoxConstraints(minWidth: 42, minHeight: 42),
        onPressed: onTap,
      ),
    );
  }
}
