"use client";

import { useState, useRef, useEffect } from "react";

interface SwipeableCardProps {
  leftIcon: string;
  rightIcon: string;
  leftColor: string;
  leftActiveColor: string;
  rightColor: string;
  rightActiveColor: string;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onTap?: () => void;
  children: React.ReactNode;
}

export default function SwipeableCard({
  leftIcon,
  rightIcon,
  leftColor,
  leftActiveColor,
  rightColor,
  rightActiveColor,
  onSwipeRight,
  onSwipeLeft,
  onTap,
  children,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offsetX, setOffsetX] = useState(0);

  const onSwipeRightRef = useRef(onSwipeRight);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  onSwipeRightRef.current = onSwipeRight;
  onSwipeLeftRef.current = onSwipeLeft;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      currentX.current = 0;
      swiping.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientX - startX.current;
      currentX.current = delta;
      if (Math.abs(delta) > 10) {
        swiping.current = true;
        e.preventDefault();
      }
      setOffsetX(delta);
    };

    const onTouchEnd = () => {
      const delta = currentX.current;
      if (delta > 100) {
        onSwipeRightRef.current();
      } else if (delta < -100) {
        onSwipeLeftRef.current();
      }
      setOffsetX(0);
      currentX.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleClick = () => {
    if (swiping.current) return;
    onTap?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex" dir="ltr">
        <div className={`flex-1 flex items-center justify-start pl-5 rounded-2xl transition-colors ${offsetX > 50 ? leftActiveColor : leftColor}`}>
          <span className="text-2xl">{leftIcon}</span>
        </div>
        <div className={`flex-1 flex items-center justify-end pr-5 rounded-2xl transition-colors ${offsetX < -50 ? rightActiveColor : rightColor}`}>
          <span className="text-2xl">{rightIcon}</span>
        </div>
      </div>
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? "transform 0.3s ease-out" : "none",
          touchAction: "pan-y",
        }}
        onClick={handleClick}
        className="relative cursor-pointer"
      >
        {children}
      </div>
    </div>
  );
}
