import 'package:flutter/material.dart';

class ArenaColors {
  ArenaColors._();

  // Primary brand palette - Deep Green & Sports Turf accents
  static const Color primary = Color(0xFF1F5C4A);
  static const Color primaryDark = Color(0xFF143E32);
  static const Color primaryLight = Color(0xFF2A7C64);
  static const Color primaryContainer = Color(0xFFD4EADB);
  static const Color onPrimaryContainer = Color(0xFF092920);

  static const Color accent = Color(0xFF10B981); // Emerald accent
  static const Color accentLight = Color(0xFFE6F7F1);

  // Surface & Neutrals
  static const Color background = Color(0xFFF8FAF9);
  static const Color surface = Colors.white;
  static const Color surfaceVariant = Color(0xFFF1F5F3);
  static const Color border = Color(0xFFE2E8E5);
  static const Color divider = Color(0xFFECEFEF);

  // Typography
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF4B5563);
  static const Color textMuted = Color(0xFF9CA3AF);

  // Status & Badges
  static const Color ratingGold = Color(0xFFF59E0B);
  static const Color chipBackground = Color(0xFFF1F5F3);
  static const Color chipSelected = Color(0xFFE2EFE9);
}

class ArenaTheme {
  ArenaTheme._();

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ArenaColors.primary,
      primary: ArenaColors.primary,
      surface: ArenaColors.surface,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ArenaColors.background,
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: ArenaColors.textPrimary),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: ArenaColors.chipBackground,
        labelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: ArenaColors.primaryDark,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: ArenaColors.border, width: 1),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ArenaColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}
