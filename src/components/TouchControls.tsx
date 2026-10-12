// Transparent Multi-touch Joystick & Button Controls for Mobile Screens

import React, { useEffect, useRef, useState } from 'react';
import { TouchSettings } from '../types';

interface TouchControlsProps {
  settings: TouchSettings;
  onInputState: (inputs: {
    left: boolean;
    right: boolean;
    jumpDown: boolean;
    jumpPressed: boolean;
    dashPressed: boolean;
    stompPressed: boolean;
  }) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ settings, onInputState }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);

  // Button active visual feedback
  const [jumpActive, setJumpActive] = useState(false);
  const [dashActive, setDashActive] = useState(false);
  const [stompActive, setStompActive] = useState(false);

  // Persistent inputs state
  const inputsRef = useRef({
    left: false,
    right: false,
    jumpDown: false,
    jumpPressed: false,
    dashPressed: false,
    stompPressed: false,
  });

  // Detect touch device on mount
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const triggerHaptic = () => {
    if (settings.haptics && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const syncInputs = () => {
    onInputState({ ...inputsRef.current });
    // Clear momentary pressed flags after passing
    inputsRef.current.jumpPressed = false;
    inputsRef.current.dashPressed = false;
    inputsRef.current.stompPressed = false;
  };

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    triggerHaptic();
    handleJoystickMove(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 40;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setStickOffset({ x: clampedX, y: clampedY });

    // Threshold for Left/Right/Stomp
    const xThreshold = 14;
    inputsRef.current.left = clampedX < -xThreshold;
    inputsRef.current.right = clampedX > xThreshold;

    // Down threshold for stomp
    if (clampedY > 24 && !inputsRef.current.stompPressed) {
      inputsRef.current.stompPressed = true;
    }

    syncInputs();
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        handleJoystickMove(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setStickOffset({ x: 0, y: 0 });
        inputsRef.current.left = false;
        inputsRef.current.right = false;
        syncInputs();
        break;
      }
    }
  };

  // Action Button handlers
  const handleJumpStart = (e: React.TouchEvent) => {
    e.preventDefault();
    triggerHaptic();
    setJumpActive(true);
    inputsRef.current.jumpDown = true;
    inputsRef.current.jumpPressed = true;
    syncInputs();
  };

  const handleJumpEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setJumpActive(false);
    inputsRef.current.jumpDown = false;
    syncInputs();
  };

  const handleDashStart = (e: React.TouchEvent) => {
    e.preventDefault();
    triggerHaptic();
    setDashActive(true);
    inputsRef.current.dashPressed = true;
    syncInputs();
  };

  const handleDashEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setDashActive(false);
  };

  const handleStompStart = (e: React.TouchEvent) => {
    e.preventDefault();
    triggerHaptic();
    setStompActive(true);
    inputsRef.current.stompPressed = true;
    syncInputs();
  };

  const handleStompEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setStompActive(false);
  };

  // Only render if touch device is detected AND user preference is enabled!
  if (!isTouchDevice || !settings.enabled) {
    return null;
  }

  const opacityStyle = { opacity: settings.opacity };
  const scaleClass = settings.buttonScale === 1.2 ? 'scale-110' : settings.buttonScale === 0.8 ? 'scale-90' : 'scale-100';

  return (
    <div
      id="touch-controls-container"
      className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-end pb-5 px-4 overflow-hidden"
    >
      <div className={`w-full flex justify-between items-end ${settings.swapSides ? 'flex-row-reverse' : ''} ${scaleClass}`}>
        
        {/* Left Side: Joystick or D-Pad */}
        {settings.controlType === 'joystick' ? (
          <div
            id="touch-joystick-zone"
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            onTouchCancel={handleJoystickTouchEnd}
            style={opacityStyle}
            className="pointer-events-auto relative w-32 h-32 rounded-full border-2 border-dashed border-cyan-400/60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center shadow-lg"
          >
            {/* Joystick Center Indicator */}
            <div className="w-4 h-4 rounded-full bg-cyan-400/40" />

            {/* Floating Joystick Thumb Knob */}
            <div
              className={`absolute w-14 h-14 rounded-full bg-cyan-500/60 border border-cyan-200/80 shadow-md flex items-center justify-center transition-transform duration-75 ${
                isJoystickActive ? 'scale-105 bg-cyan-400/80' : ''
              }`}
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`
              }}
            >
              <span className="text-[10px] text-white/90 font-bold">🕹️</span>
            </div>
          </div>
        ) : (
          /* D-Pad Buttons */
          <div style={opacityStyle} className="pointer-events-auto flex gap-3">
            <button
              id="touch-btn-left"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                inputsRef.current.left = true;
                syncInputs();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                inputsRef.current.left = false;
                syncInputs();
              }}
              className="w-16 h-16 rounded-xl bg-slate-800/60 border-2 border-cyan-400/70 text-cyan-300 font-pixel text-lg active:bg-cyan-500/50 flex items-center justify-center"
            >
              ◀
            </button>
            <button
              id="touch-btn-right"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                inputsRef.current.right = true;
                syncInputs();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                inputsRef.current.right = false;
                syncInputs();
              }}
              className="w-16 h-16 rounded-xl bg-slate-800/60 border-2 border-cyan-400/70 text-cyan-300 font-pixel text-lg active:bg-cyan-500/50 flex items-center justify-center"
            >
              ▶
            </button>
          </div>
        )}

        {/* Right Side: Action Buttons (Jump, Dash, Stomp) */}
        <div style={opacityStyle} className="pointer-events-auto flex items-end gap-3 relative pb-1">
          {/* Stomp Button (Ground Pound) */}
          <button
            id="touch-btn-stomp"
            onTouchStart={handleStompStart}
            onTouchEnd={handleStompEnd}
            className={`w-14 h-14 rounded-full border-2 border-amber-400/80 bg-amber-500/40 text-amber-200 font-pixel text-xs flex flex-col items-center justify-center shadow-md active:scale-95 ${
              stompActive ? 'bg-amber-400/80 scale-95' : ''
            }`}
          >
            <span>▼</span>
            <span className="text-[7px]">CAER</span>
          </button>

          {/* Dash Button */}
          <button
            id="touch-btn-dash"
            onTouchStart={handleDashStart}
            onTouchEnd={handleDashEnd}
            className={`w-14 h-14 rounded-full border-2 border-fuchsia-400/80 bg-fuchsia-600/40 text-fuchsia-200 font-pixel text-xs flex flex-col items-center justify-center shadow-md active:scale-95 mb-4 ${
              dashActive ? 'bg-fuchsia-400/80 scale-95' : ''
            }`}
          >
            <span>⚡</span>
            <span className="text-[7px]">DASH</span>
          </button>

          {/* Jump Button (Primary & Larger) */}
          <button
            id="touch-btn-jump"
            onTouchStart={handleJumpStart}
            onTouchEnd={handleJumpEnd}
            className={`w-18 h-18 rounded-full border-2 border-emerald-400/90 bg-emerald-500/50 text-emerald-100 font-pixel text-sm flex flex-col items-center justify-center shadow-lg active:scale-95 ${
              jumpActive ? 'bg-emerald-400/90 scale-95' : ''
            }`}
          >
            <span>▲</span>
            <span className="text-[8px] mt-0.5">SALTO</span>
          </button>
        </div>

      </div>
    </div>
  );
};
