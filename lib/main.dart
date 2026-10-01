import 'package:flutter/material.dart';
import 'screens/venue_detail_screen.dart';
import 'theme/arena_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ArenaApp());
}

class ArenaApp extends StatelessWidget {
  const ArenaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Arena Sports',
      debugShowCheckedModeBanner: false,
      theme: ArenaTheme.lightTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const VenueDetailScreen(
              venueId: 'venue_smash_point_pune',
            ),
        '/slot-selection': (context) {
          final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
          return Scaffold(
            appBar: AppBar(title: Text(args?['venueName'] ?? 'Select Slot')),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.calendar_month_rounded, size: 64, color: ArenaColors.primary),
                  const SizedBox(height: 16),
                  Text(
                    'Slot Selection Screen',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text('Navigated with venueId: ${args?['venueId']}'),
                ],
              ),
            ),
          );
        },
      },
    );
  }
}
