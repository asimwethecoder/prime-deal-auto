'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useSpring } from 'framer-motion';
import { Eye } from 'lucide-react';

const CURSOR_CLASS = 'custom-cursor-active';
const CORE_SIZE = 10;
const AURA_SIZE = 40;
const BRAND_COLOR = '#405FF2';
const DELETE_COLOR = '#DC2626';

type ActionType = 'delete' | 'edit' | null;

export function CustomCursor() {
  const pathname = usePathname();
  const [pointerFine, setPointerFine] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isBrand, setIsBrand] = useState(false);
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [isVehicleCard, setIsVehicleCard] = useState(false);
  const [magneticCenter, setMagneticCenter] = useState<{ x: number; y: number } | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isDashboard = pathname?.startsWith('/dashboard') ?? pathname?.startsWith('/admin') ?? false;

  const springConfig = { damping: 25, stiffness: 400 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const mqPointer = window.matchMedia('(pointer: fine)');
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const setPointer = () => setPointerFine(mqPointer.matches);
    const setReduced = () => setReducedMotion(mqReduced.matches);

    setPointer();
    setReduced();
    mqPointer.addEventListener('change', setPointer);
    mqReduced.addEventListener('change', setReduced);

    return () => {
      mqPointer.removeEventListener('change', setPointer);
      mqReduced.removeEventListener('change', setReduced);
    };
  }, []);

  useEffect(() => {
    if (!pointerFine) return;

    document.documentElement.classList.add(CURSOR_CLASS);
    return () => document.documentElement.classList.remove(CURSOR_CLASS);
  }, [pointerFine]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!pointerFine) return;

      const { clientX, clientY } = e;
      setPosition({ x: clientX, y: clientY });

      const el = document.elementFromPoint(clientX, clientY);
      const brand = el?.closest('[data-cursor-brand]');
      const magnetic = el?.closest('[data-cursor-magnetic]');
      const vehicleCard = el?.closest('[data-vehicle-card]');
      const action = el?.closest('[data-cursor-action="delete"]')
        ? 'delete'
        : el?.closest('[data-cursor-action="edit"]')
          ? 'edit'
          : null;

      setIsBrand(!!brand);
      setActionType(action);
      setIsVehicleCard(!!vehicleCard && !isDashboard);

      if (magnetic && !isDashboard) {
        setIsMagnetic(true);
        const rect = (magnetic as Element).getBoundingClientRect();
        setMagneticCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      } else {
        setIsMagnetic(false);
        setMagneticCenter(null);
      }
    },
    [pointerFine, isDashboard]
  );

  useEffect(() => {
    if (!pointerFine) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [pointerFine, handleMouseMove]);

  useEffect(() => {
    if (!pointerFine) return;

    const targetX = magneticCenter && !reducedMotion ? magneticCenter.x : position.x;
    const targetY = magneticCenter && !reducedMotion ? magneticCenter.y : position.y;

    x.set(targetX);
    y.set(targetY);
  }, [pointerFine, position.x, position.y, magneticCenter, x, y, reducedMotion]);

  if (!pointerFine) return null;

  const coreColor = actionType === 'delete' ? DELETE_COLOR : BRAND_COLOR;

  const auraScale = (() => {
    if (isDashboard) return 0.7;
    if (isBrand && !reducedMotion) return 2;
    if (isVehicleCard && !reducedMotion) return 1.8;
    if (isMagnetic && !reducedMotion) return 1.5;
    return 1;
  })();

  const auraOpacity = isDashboard ? 0.4 : 0.2;
  const auraBorderPx = !isDashboard && (isMagnetic || isVehicleCard) && !reducedMotion ? 2 : 1;
  const coreScale =
    !isDashboard && (isMagnetic || isVehicleCard) && !reducedMotion ? 0 : 1;
  const showViewIcon = isVehicleCard && !reducedMotion;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] w-0 h-0"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
      }}
      aria-hidden
    >
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: AURA_SIZE,
          height: AURA_SIZE,
          left: -AURA_SIZE / 2,
          top: -AURA_SIZE / 2,
          backgroundColor: `rgba(64, 95, 242, ${auraOpacity})`,
          border: `${auraBorderPx}px solid rgba(64, 95, 242, 0.4)`,
          scale: auraScale,
          mixBlendMode: (isBrand || showViewIcon) && !reducedMotion ? 'difference' : 'normal',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {showViewIcon && (
          <Eye
            className="shrink-0 opacity-100"
            style={{ color: '#FFFFFF', mixBlendMode: 'difference' }}
            width={16}
            height={16}
            aria-hidden
          />
        )}
      </motion.div>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: CORE_SIZE,
          height: CORE_SIZE,
          left: -CORE_SIZE / 2,
          top: -CORE_SIZE / 2,
          backgroundColor: coreColor,
        }}
        scale={coreScale}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />
    </motion.div>
  );
}
