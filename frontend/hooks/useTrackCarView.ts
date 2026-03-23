'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/api/analytics';

/** Fires a car_view event once per car per session */
export function useTrackCarView(carId: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Deduplicate: only track once per car per session
    const key = `car_view_${carId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    trackEvent({ eventType: 'car_view', carId });
  }, [carId]);
}
