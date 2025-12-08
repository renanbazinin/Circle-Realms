// ============================================
// Mobile Touch Controls - Dual Joystick System
// ============================================

import { useState, useEffect, useCallback } from 'react';

// Global touch input state
export const touchInput = {
    moveX: 0,  // -1 to 1 (left/right movement)
    moveY: 0,  // -1 to 1 (forward/backward movement)
    aimX: 0,   // -1 to 1 (aim direction X)
    aimY: 0,   // -1 to 1 (aim direction Y)
    jump: false,
    shoot: false,
    aimAngle: 0, // Radians for visual gun indicator
};

// Detect mobile device
export const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
};

// Check if mobile controls should be shown based on settings
const shouldShowMobileControls = (): boolean => {
    if (typeof window === 'undefined') return false;
    const mode = localStorage.getItem('mobileControlsMode') || 'auto';
    if (mode === 'on') return true;
    if (mode === 'off') return false;
    return isMobileDevice(); // auto mode
};

interface JoystickState {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    touchId: number | null;
}

const initialJoystickState: JoystickState = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    touchId: null,
};

export const MobileControls: React.FC = () => {
    const [showControls, setShowControls] = useState(false);
    const [moveJoystick, setMoveJoystick] = useState<JoystickState>(initialJoystickState);
    const [aimJoystick, setAimJoystick] = useState<JoystickState>(initialJoystickState);

    const maxDistance = 50; // Maximum joystick travel distance

    useEffect(() => {
        setShowControls(shouldShowMobileControls());
        const handleSettingsChange = () => setShowControls(shouldShowMobileControls());
        window.addEventListener('mobileControlsChanged', handleSettingsChange);
        return () => window.removeEventListener('mobileControlsChanged', handleSettingsChange);
    }, []);

    // Calculate joystick offset from center
    const getJoystickOffset = useCallback((joystick: JoystickState) => {
        if (!joystick.active) return { x: 0, y: 0 };

        let dx = joystick.currentX - joystick.startX;
        let dy = joystick.currentY - joystick.startY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        return { x: dx, y: dy };
    }, [maxDistance]);

    // Update touch input based on joystick positions
    useEffect(() => {
        const moveOffset = getJoystickOffset(moveJoystick);
        touchInput.moveX = moveOffset.x / maxDistance;
        touchInput.moveY = -moveOffset.y / maxDistance;

        const aimOffset = getJoystickOffset(aimJoystick);
        const aimMagnitude = Math.sqrt(aimOffset.x * aimOffset.x + aimOffset.y * aimOffset.y);

        if (aimMagnitude > 10) { // Deadzone
            touchInput.aimX = aimOffset.x / maxDistance;
            touchInput.aimY = -aimOffset.y / maxDistance;
            touchInput.shoot = true;
            touchInput.aimAngle = Math.atan2(-aimOffset.y, aimOffset.x);
        } else {
            touchInput.shoot = false;
        }
    }, [getJoystickOffset, moveJoystick, aimJoystick]);

    // Clear aim when joystick released
    useEffect(() => {
        if (!aimJoystick.active) {
            touchInput.shoot = false;
        }
    }, [aimJoystick.active]);

    // Move joystick handlers
    const handleMoveStart = (e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        setMoveJoystick({
            active: true,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            touchId: touch.identifier,
        });
    };

    // Aim joystick handlers
    const handleAimStart = (e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        setAimJoystick({
            active: true,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            touchId: touch.identifier,
        });
    };

    // Global touch move handler
    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            if (moveJoystick.touchId === touch.identifier) {
                setMoveJoystick(prev => ({
                    ...prev,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                }));
            }

            if (aimJoystick.touchId === touch.identifier) {
                setAimJoystick(prev => ({
                    ...prev,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                }));
            }
        }
    }, [moveJoystick.touchId, aimJoystick.touchId]);

    // Global touch end handler
    const handleTouchEnd = useCallback((e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            if (moveJoystick.touchId === touch.identifier) {
                setMoveJoystick(initialJoystickState);
                touchInput.moveX = 0;
                touchInput.moveY = 0;
            }

            if (aimJoystick.touchId === touch.identifier) {
                setAimJoystick(initialJoystickState);
                touchInput.shoot = false;
            }
        }
    }, [moveJoystick.touchId, aimJoystick.touchId]);

    // Jump button handlers
    const handleJumpStart = (e: React.TouchEvent) => {
        e.preventDefault();
        touchInput.jump = true;
    };

    const handleJumpEnd = () => {
        touchInput.jump = false;
    };

    // Global event listeners
    useEffect(() => {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleTouchMove, handleTouchEnd]);

    if (!showControls) return null;

    const moveOffset = getJoystickOffset(moveJoystick);
    const aimOffset = getJoystickOffset(aimJoystick);

    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            {/* Left side - Movement Joystick */}
            <div
                className="absolute bottom-24 left-8 pointer-events-auto touch-none"
                style={{ width: '140px', height: '140px' }}
                onTouchStart={handleMoveStart}
            >
                {/* Joystick base */}
                <div
                    className="absolute inset-0 rounded-full border-4 border-white/30 bg-black/40 backdrop-blur-sm"
                    style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)' }}
                />

                {/* Direction indicators */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-4 text-white/30 text-lg">▲</div>
                    <div className="absolute bottom-4 text-white/30 text-lg">▼</div>
                    <div className="absolute left-4 text-white/30 text-lg">◀</div>
                    <div className="absolute right-4 text-white/30 text-lg">▶</div>
                </div>

                {/* Joystick thumb */}
                <div
                    className="absolute rounded-full bg-gradient-to-br from-blue-400/80 to-blue-600/80 border-2 border-blue-300/60"
                    style={{
                        width: '60px',
                        height: '60px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${moveOffset.x}px), calc(-50% + ${moveOffset.y}px))`,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.3)',
                        transition: moveJoystick.active ? 'none' : 'transform 0.2s ease-out',
                    }}
                />

                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs whitespace-nowrap">
                    MOVE
                </div>
            </div>

            {/* Right side - Aim Joystick */}
            <div
                className="absolute bottom-24 right-8 pointer-events-auto touch-none"
                style={{ width: '140px', height: '140px' }}
                onTouchStart={handleAimStart}
            >
                {/* Joystick base */}
                <div
                    className="absolute inset-0 rounded-full border-4 border-red-500/40 bg-black/40 backdrop-blur-sm"
                    style={{ boxShadow: 'inset 0 0 20px rgba(255,100,100,0.1)' }}
                />

                {/* Crosshair indicators */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-full h-0.5 bg-red-500/20" />
                    <div className="absolute w-0.5 h-full bg-red-500/20" />
                    <div className="absolute w-3 h-3 border-2 border-red-500/40 rounded-full" />
                </div>

                {/* Aim direction indicator line */}
                {aimJoystick.active && (
                    <div
                        className="absolute bg-gradient-to-r from-red-500 to-orange-400"
                        style={{
                            width: Math.sqrt(aimOffset.x * aimOffset.x + aimOffset.y * aimOffset.y),
                            height: '3px',
                            left: '50%',
                            top: '50%',
                            transformOrigin: '0 50%',
                            transform: `rotate(${Math.atan2(aimOffset.y, aimOffset.x)}rad)`,
                            opacity: 0.8,
                        }}
                    />
                )}

                {/* Joystick thumb */}
                <div
                    className="absolute rounded-full bg-gradient-to-br from-red-400/80 to-red-600/80 border-2 border-red-300/60"
                    style={{
                        width: '60px',
                        height: '60px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${aimOffset.x}px), calc(-50% + ${aimOffset.y}px))`,
                        boxShadow: aimJoystick.active
                            ? '0 4px 20px rgba(255,100,100,0.6), inset 0 2px 10px rgba(255,255,255,0.3)'
                            : '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.3)',
                        transition: aimJoystick.active ? 'none' : 'transform 0.2s ease-out',
                    }}
                >
                    {/* Crosshair on thumb */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/60 text-2xl">
                        ⊕
                    </div>
                </div>

                {/* Label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs whitespace-nowrap">
                    AIM & FIRE
                </div>
            </div>

            {/* Jump button - top right corner */}
            <button
                className="absolute bottom-48 right-20 w-16 h-16 rounded-full 
                           bg-gradient-to-br from-green-500/80 to-green-700/80 
                           border-4 border-green-300/60 text-white font-bold
                           active:scale-95 shadow-lg touch-none select-none pointer-events-auto"
                style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.2)' }}
                onTouchStart={handleJumpStart}
                onTouchEnd={handleJumpEnd}
            >
                ⬆
            </button>

            {/* Controls label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
                Touch Controls Active
            </div>
        </div>
    );
};

export default MobileControls;
