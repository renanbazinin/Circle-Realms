// ============================================
// HUD Component - In-game Overlay
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useGameStore, usePlayer, useCurrentZone, useInventory } from '../../store/gameStore';
import { playSFX } from '../../utils/sounds';

const ZONE_NAMES: Record<number, string> = {
    0: 'The Hub',
    1: 'The Wilds',
    2: 'The Sky Gardens',
};

export const HUD: React.FC = () => {
    const player = usePlayer();
    const currentZone = useCurrentZone();
    const inventory = useInventory();
    const getEquippedWeapon = useGameStore((state) => state.getEquippedWeapon);
    const equipWeapon = useGameStore((state) => state.equipWeapon);
    const togglePause = useGameStore((state) => state.togglePause);

    const [showWeaponSelector, setShowWeaponSelector] = useState(false);
    const [showDamageFlash, setShowDamageFlash] = useState(false);
    const lastHp = useRef(player.hp);

    // Detect damage taken and show flash
    useEffect(() => {
        if (player.hp < lastHp.current) {
            // Player took damage
            playSFX('damage');
            setShowDamageFlash(true);
            setTimeout(() => setShowDamageFlash(false), 200);
        }
        lastHp.current = player.hp;
    }, [player.hp]);

    const equippedWeapon = getEquippedWeapon();
    const healthPercent = (player.hp / player.maxHp) * 100;
    const isLowHealth = healthPercent < 30;

    const handleWeaponClick = () => {
        if (inventory.weapons.length > 1) {
            setShowWeaponSelector(!showWeaponSelector);
        }
    };

    const handleSelectWeapon = (weaponId: string) => {
        equipWeapon(weaponId);
        setShowWeaponSelector(false);
    };

    return (
        <div className="ui-overlay">
            {/* Damage flash overlay */}
            {showDamageFlash && (
                <div className="fixed inset-0 pointer-events-none z-50 bg-red-600/40 animate-pulse" />
            )}

            {/* Top bar - Zone, Level, XP */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4">
                {/* Zone info */}
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    <div className="text-sm text-gray-400 uppercase tracking-wider">Current Zone</div>
                    <div className="text-xl font-bold text-white">
                        {ZONE_NAMES[currentZone] || `Zone ${currentZone}`}
                    </div>
                </div>

                {/* Level, XP & Coins */}
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 text-right">
                    <div className="flex gap-4">
                        <div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider">Level</div>
                            <div className="text-xl font-bold text-yellow-400">{player.level}</div>
                            <div className="text-xs text-gray-500">{player.xp} XP</div>
                        </div>
                        <div className="border-l border-white/10 pl-4">
                            <div className="text-sm text-gray-400 uppercase tracking-wider">Coins</div>
                            <div className="text-xl font-bold text-amber-400">{player.coins} 🪙</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom left - Health bar */}
            <div className="absolute bottom-4 left-4">
                <div className={`bg-black/60 backdrop-blur-sm rounded-lg p-3 border min-w-[200px] transition-all duration-200
                    ${showDamageFlash ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-white/10'}`}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className={isLowHealth ? 'text-red-400 animate-pulse' : showDamageFlash ? 'text-red-300' : 'text-gray-400'}>
                            HP
                        </span>
                        <span className={`font-bold ${showDamageFlash ? 'text-red-400' : 'text-white'}`}>
                            {player.hp}/{player.maxHp}
                        </span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 rounded-full ${isLowHealth
                                ? 'bg-gradient-to-r from-red-600 to-red-500 health-critical'
                                : showDamageFlash
                                    ? 'bg-gradient-to-r from-red-500 to-orange-400'
                                    : 'bg-gradient-to-r from-green-600 to-green-400'
                                }`}
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom right - Equipped weapon (CLICKABLE) */}
            <div className="absolute bottom-4 right-4">
                <div
                    className={`bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10 
                        ${inventory.weapons.length > 1 ? 'cursor-pointer hover:bg-black/80 hover:border-white/30 transition-all' : ''}`}
                    onClick={handleWeaponClick}
                >
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Weapon</div>
                        {inventory.weapons.length > 1 && (
                            <div className="text-xs text-gray-500">
                                ▼ {inventory.weapons.length} weapons
                            </div>
                        )}
                    </div>
                    {equippedWeapon ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full animate-pulse"
                                style={{ backgroundColor: equippedWeapon.color }}
                            />
                            <span className="text-white font-semibold">{equippedWeapon.name}</span>
                        </div>
                    ) : (
                        <span className="text-gray-500">None</span>
                    )}
                    {equippedWeapon && (
                        <div className="text-xs text-gray-500 mt-1">
                            DMG: {equippedWeapon.damage} | Rate: {equippedWeapon.fireRate}/s
                        </div>
                    )}
                </div>

                {/* Weapon selector dropdown */}
                {showWeaponSelector && inventory.weapons.length > 1 && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden min-w-[200px]">
                        <div className="text-xs text-gray-400 px-3 py-2 border-b border-white/10 uppercase">
                            Select Weapon
                        </div>
                        {inventory.weapons.map((weapon) => (
                            <div
                                key={weapon.id}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors
                                    ${weapon.id === equippedWeapon?.id ? 'bg-white/20' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectWeapon(weapon.id);
                                }}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: weapon.color }}
                                />
                                <span className="text-white text-sm">{weapon.name}</span>
                                {weapon.id === equippedWeapon?.id && (
                                    <span className="text-green-400 text-xs ml-auto">✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pause button */}
            <button
                onClick={togglePause}
                className="absolute top-4 right-1/2 translate-x-1/2 bg-black/40 hover:bg-black/60 
                   backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10
                   transition-all duration-200 text-white/70 hover:text-white"
            >
                ⏸ Pause
            </button>

            {/* Controls hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10
                    text-gray-400 text-sm">
                    <span className="opacity-70">WASD</span> Move |
                    <span className="opacity-70"> Space</span> Jump |
                    <span className="opacity-70"> Click</span> Shoot |
                    <span className="opacity-70"> ESC</span> Pause
                </div>
            </div>
        </div>
    );
};

export default HUD;
