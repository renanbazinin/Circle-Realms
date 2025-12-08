// ============================================
// Mobile Touch Controls - Virtual Joystick & Buttons
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';

// Global touch input state - matches keyboard keys format
export const touchInput = {
    moveX: 0,  // -1 to 1 (left/right)
    moveY: 0,  // -1 to 1 (forward/backward)
    jump: false,
    shoot: false,
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
}

export const MobileControls: React.FC = () => {
    const [showControls, setShowControls] = useState(false);
    const [joystick, setJoystick] = useState<JoystickState>({
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
    });

    const joystickRef = useRef<HTMLDivElement>(null);
    const maxDistance = 50; // Maximum joystick travel distance

    useEffect(() => {
        // Initial check
        setShowControls(shouldShowMobileControls());

        // Listen for settings changes
        const handleSettingsChange = () => {
            setShowControls(shouldShowMobileControls());
        };
        window.addEventListener('mobileControlsChanged', handleSettingsChange);
        return () => window.removeEventListener('mobileControlsChanged', handleSettingsChange);
    }, []);

    // Calculate joystick offset from center
    const getJoystickOffset = useCallback(() => {
        if (!joystick.active) return { x: 0, y: 0 };

        let dx = joystick.currentX - joystick.startX;
        let dy = joystick.currentY - joystick.startY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        return { x: dx, y: dy };
    }, [joystick, maxDistance]);

    // Update touch input based on joystick position
    useEffect(() => {
        const offset = getJoystickOffset();
        touchInput.moveX = offset.x / maxDistance;  // -1 to 1
        touchInput.moveY = -offset.y / maxDistance; // -1 to 1 (inverted for forward)
    }, [getJoystickOffset]);

    // Joystick touch handlers
    const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        const touch = 'touches' in e ? e.touches[0] : e;
        setJoystick({
            active: true,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
        });
    };

    const handleJoystickMove = useCallback((e: TouchEvent | MouseEvent) => {
        if (!joystick.active) return;
        e.preventDefault();
        const touch = 'touches' in e ? e.touches[0] : e;
        setJoystick(prev => ({
            ...prev,
            currentX: touch.clientX,
            currentY: touch.clientY,
        }));
    }, [joystick.active]);

    const handleJoystickEnd = useCallback(() => {
        setJoystick(prev => ({
            ...prev,
            active: false,
            currentX: prev.startX,
            currentY: prev.startY,
        }));
        touchInput.moveX = 0;
        touchInput.moveY = 0;
    }, []);

    // Global touch/mouse listeners
    useEffect(() => {
        window.addEventListener('touchmove', handleJoystickMove, { passive: false });
        window.addEventListener('touchend', handleJoystickEnd);
        window.addEventListener('mousemove', handleJoystickMove);
        window.addEventListener('mouseup', handleJoystickEnd);

        return () => {
            window.removeEventListener('touchmove', handleJoystickMove);
            window.removeEventListener('touchend', handleJoystickEnd);
            window.removeEventListener('mousemove', handleJoystickMove);
            window.removeEventListener('mouseup', handleJoystickEnd);
        };
    }, [handleJoystickMove, handleJoystickEnd]);

    // Button handlers
    const handleJumpStart = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        touchInput.jump = true;
    };

    const handleJumpEnd = () => {
        touchInput.jump = false;
    };

    const handleShootStart = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        touchInput.shoot = true;
    };

    const handleShootEnd = () => {
        touchInput.shoot = false;
    };

    if (!showControls) return null;

    const offset = getJoystickOffset();

    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            {/* Left side - Joystick */}
            <div
                ref={joystickRef}
                className="absolute bottom-24 left-8 pointer-events-auto touch-none"
                style={{ width: '140px', height: '140px' }}
                onTouchStart={handleJoystickStart}
                onMouseDown={handleJoystickStart}
            >
                {/* Joystick base */}
                <div
                    className="absolute inset-0 rounded-full border-4 border-white/30 bg-black/40 backdrop-blur-sm"
                    style={{
                        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)',
                    }}
                />

                {/* Joystick direction indicators */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-4 text-white/30 text-lg">▲</div>
                    <div className="absolute bottom-4 text-white/30 text-lg">▼</div>
                    <div className="absolute left-4 text-white/30 text-lg">◀</div>
                    <div className="absolute right-4 text-white/30 text-lg">▶</div>
                </div>

                {/* Joystick thumb */}
                <div
                    className="absolute rounded-full bg-gradient-to-br from-white/80 to-white/40 border-2 border-white/60"
                    style={{
                        width: '60px',
                        height: '60px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.3)',
                        transition: joystick.active ? 'none' : 'transform 0.2s ease-out',
                    }}
                />
            </div>

            {/* Right side - Action buttons */}
            <div className="absolute bottom-24 right-8 flex flex-col gap-4 pointer-events-auto">
                {/* Jump button (top) */}
                <button
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/80 to-green-700/80 
                               border-4 border-green-300/60 text-white font-bold text-lg
                               active:scale-95 active:from-green-400 active:to-green-600
                               shadow-lg shadow-green-900/50 touch-none select-none"
                    style={{
                        boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.2)',
                    }}
                    onTouchStart={handleJumpStart}
                    onTouchEnd={handleJumpEnd}
                    onMouseDown={handleJumpStart}
                    onMouseUp={handleJumpEnd}
                    onMouseLeave={handleJumpEnd}
                >
                    ⬆<br />
                    <span className="text-xs">JUMP</span>
                </button>

                {/* Shoot button (bottom) */}
                <button
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/80 to-red-700/80 
                               border-4 border-red-300/60 text-white font-bold text-lg
                               active:scale-95 active:from-red-400 active:to-red-600
                               shadow-lg shadow-red-900/50 touch-none select-none"
                    style={{
                        boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.2)',
                    }}
                    onTouchStart={handleShootStart}
                    onTouchEnd={handleShootEnd}
                    onMouseDown={handleShootStart}
                    onMouseUp={handleShootEnd}
                    onMouseLeave={handleShootEnd}
                >
                    🔥<br />
                    <span className="text-xs">FIRE</span>
                </button>
            </div>

            {/* Label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
                Touch Controls Active
            </div>
        </div>
    );
};

export default MobileControls;
