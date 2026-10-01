import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function MobileFrame({
  currentStep,
  onBack,
  showBack,
  children,
}) {
  const getStepText = () => {
    switch (currentStep) {
      case 'role':
        return 'Step 1 of 3';
      case 'login':
        return 'Sign In';
      case 'player-reg':
      case 'owner-reg':
        return 'Step 2 of 3';
      case 'otp':
        return 'Step 3 of 3';
      case 'venue-filter':
        return 'Find a Venue';
      case 'venue-list':
        return 'Available Venues';
      case 'venue-details':
        return 'Venue Details';
      case 'slot-calendar':
        return 'Select a Slot';
      case 'slot-lock':
        return 'Slot Held';
      case 'booking-summary':
        return 'Booking Summary';
      case 'payment-processing':
        return 'Payment';
      case 'booking-confirmed':
        return 'Confirmed';
      case 'booking-failed':
        return 'Booking Status';
      case 'slot-conflict':
        return 'Availability Notice';
      case 'player-home':
      case 'owner-dashboard':
        return 'Arena';
      case 'owner-bookings':
        return 'Bookings';
      case 'owner-availability':
        return 'Availability';
      case 'owner-earnings':
        return 'Earnings & Payouts';
      case 'owner-reviews':
        return 'Reviews';
      case 'owner-promotions':
        return 'Promotions';
      case 'owner-analytics':
        return 'Analytics';
      case 'owner-venues':
        return 'Multi-Venue Hub';
      case 'owner-staff':
        return 'Staff Management';
      case 'owner-notifications':
        return 'Notifications';
      case 'owner-profile':
        return 'Profile & Settings';
      default:
        return '';
    }
  };

  return (
    <div className="app-container">
      <div className="viewport-frame">
        {/* Screen Header Navigation (when in flow) */}
        {showBack && (
          <div className="screen-header">
            <button className="icon-btn" onClick={onBack} title="Go back">
              <ChevronLeft size={20} />
            </button>
            <span className="step-indicator">{getStepText()}</span>
          </div>
        )}

        {/* Inner Viewport Screen */}
        <div className="screen-viewport">{children}</div>
      </div>
    </div>
  );
}
