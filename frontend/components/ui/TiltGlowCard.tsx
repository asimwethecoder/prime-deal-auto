'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TILT_MAX = 8;
const SPRING = { stiffness: 300, damping: 30 };

const ELECTRIC_GLOW =
  '0 0 20px rgba(64, 95, 242, 0.6), 0 0 40px rgba(64, 95, 242, 0.4), 0 0 60px rgba(64, 95, 242, 0.25)';

export interface TiltGlowCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltGlowCard({ children, className = '' }: TiltGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const xSpring = useSpring(x, SPRING);
  const ySpring = useSpring(y, SPRING);
  const rotateX = useTransform(ySpring, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rotateY = useTransform(xSpring, [0, 1], [-TILT_MAX, TILT_MAX]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (isFocused) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    setIsHovered(false);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleFocusIn = () => {
    setIsFocused(true);
    x.set(0.5);
    y.set(0.5);
  };

  const handleFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!cardRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  const showGlow = isHovered || isFocused;

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      <motion.div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{ boxShadow: ELECTRIC_GLOW }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showGlow ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
