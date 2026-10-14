import React from 'react';
import AdsterraBanner from './AdsterraBanner';
import { ADSTERRA_SLOTS } from './adConfig';

/**
 * Responsive Leaderboard:
 * - Desktop (>= 1024px): 728x90
 * - Tablet (640px - 1023px): 468x60
 * - Mobile (< 640px): 320x50
 */
const AdsterraLeaderboard = ({ className = '' }) => {
  return (
    <div className={`w-full flex justify-center items-center ${className}`}>
      {/* Desktop 728x90 */}
      <div className="hidden lg:block">
        <AdsterraBanner slot={ADSTERRA_SLOTS.leaderboard_desktop} />
      </div>

      {/* Tablet 468x60 */}
      <div className="hidden sm:block lg:hidden">
        <AdsterraBanner slot={ADSTERRA_SLOTS.banner_tablet} />
      </div>

      {/* Mobile 320x50 */}
      <div className="block sm:hidden">
        <AdsterraBanner slot={ADSTERRA_SLOTS.banner_mobile} />
      </div>
    </div>
  );
};

export default AdsterraLeaderboard;
