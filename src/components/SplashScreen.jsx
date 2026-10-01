import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const intervalTime = 50; // update every 50ms
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="splash-screen-container fade-in">
      <div className="splash-content">
        <div className="splash-logo-box">
          <Shield size={44} color="#FFFFFF" fill="#2563EB" strokeWidth={1.5} />
        </div>

        <h1 className="splash-brand-name">Arena</h1>
        <p className="splash-tagline">Sports Venue & Slot Booking</p>

        <div className="splash-progress-wrapper">
          <div
            className="splash-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
