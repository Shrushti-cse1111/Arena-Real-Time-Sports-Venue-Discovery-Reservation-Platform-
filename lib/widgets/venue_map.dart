import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/venue_detail_model.dart';
import '../theme/arena_theme.dart';

class VenueMap extends StatefulWidget {
  final VenueLocation location;
  final String venueName;

  const VenueMap({
    super.key,
    required this.location,
    required this.venueName,
  });

  @override
  State<VenueMap> createState() => _VenueMapState();
}

class _VenueMapState extends State<VenueMap> {
  GoogleMapController? _mapController;
  bool _mapLoadError = false;

  Future<void> _openGoogleMapsDirections() async {
    final lat = widget.location.latitude;
    final lng = widget.location.longitude;
    final query = Uri.encodeComponent('${widget.venueName}, ${widget.location.address}');

    // Try Google Maps URL intent first
    final googleMapsUrl = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&query=$query');
    final geoUrl = Uri.parse('geo:$lat,$lng?q=$lat,$lng($query)');

    try {
      if (await canLaunchUrl(geoUrl)) {
        await launchUrl(geoUrl);
      } else if (await canLaunchUrl(googleMapsUrl)) {
        await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(googleMapsUrl, mode: LaunchMode.platformDefault);
      }
    } catch (_) {
      // Fallback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open map navigation app')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final targetLatLng = LatLng(widget.location.latitude, widget.location.longitude);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Location',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: ArenaColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
              TextButton.icon(
                onPressed: _openGoogleMapsDirections,
                style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  foregroundColor: ArenaColors.primary,
                  padding: EdgeInsets.zero,
                ),
                icon: const Icon(Icons.directions_rounded, size: 17),
                label: const Text(
                  'Directions',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Map Preview Container with Rounded Corners & Subtle Border
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 175,
              width: double.infinity,
              decoration: BoxDecoration(
                color: ArenaColors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: ArenaColors.border, width: 1),
              ),
              child: Stack(
                children: [
                  // GoogleMap or Styled Fallback
                  if (!_mapLoadError)
                    GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: targetLatLng,
                        zoom: 15.0,
                      ),
                      markers: {
                        Marker(
                          markerId: const MarkerId('venue_pin'),
                          position: targetLatLng,
                          infoWindow: InfoWindow(
                            title: widget.venueName,
                            snippet: widget.location.area,
                          ),
                        ),
                      },
                      zoomControlsEnabled: false,
                      myLocationButtonEnabled: false,
                      compassEnabled: false,
                      mapToolbarEnabled: false,
                      liteModeEnabled: false, // Set to true for Android Lite Mode if desired
                      onMapCreated: (controller) {
                        _mapController = controller;
                      },
                      onTap: (_) => _openGoogleMapsDirections(),
                    )
                  else
                    _buildMapFallback(targetLatLng),

                  // Overlay gradient for contrast & clickability
                  Positioned.fill(
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _openGoogleMapsDirections,
                        splashColor: ArenaColors.primary.withValues(alpha: 0.1),
                      ),
                    ),
                  ),

                  // Floating "Open in Maps" pill badge at bottom right
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: _openGoogleMapsDirections,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.open_in_new_rounded, size: 14, color: ArenaColors.primary),
                            SizedBox(width: 4),
                            Text(
                              'Interactive Map',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: ArenaColors.primaryDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 10),

          // Detailed text address below preview
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(
                  Icons.place_outlined,
                  size: 16,
                  color: ArenaColors.textSecondary,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${widget.location.address}, ${widget.location.area}, ${widget.location.city}',
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.35,
                    color: ArenaColors.textSecondary,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),
          const Divider(color: ArenaColors.divider, thickness: 1),
        ],
      ),
    );
  }

  Widget _buildMapFallback(LatLng coords) {
    return Container(
      color: const Color(0xFFE8F1EC),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: ArenaColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.location_on_rounded, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 8),
            Text(
              widget.venueName,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            Text(
              '${coords.latitude.toStringAsFixed(4)}, ${coords.longitude.toStringAsFixed(4)}',
              style: const TextStyle(fontSize: 11, color: ArenaColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }
}
