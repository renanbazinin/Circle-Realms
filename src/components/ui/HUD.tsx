// ============================================
// HUD Component - In-game Overlay
// ============================================

import { useGameStore, usePlayer, useCurrentZone } from '../../store/gameStore';

const ZONE_NAMES: Record<number, string> = {
    0: 'The Hub',
    1: 'The Wilds',
};

export const HUD: React.FC = () => {
    const player = usePlayer();
    const currentZone = useCurrentZone();
    const getEquippedWeapon = useGameStore((state) => state.getEquippedWeapon);
    const togglePause = useGameStore((state) => state.togglePause);

    const equippedWeapon = getEquippedWeapon();
    const healthPercent = (player.hp / player.maxHp) * 100;
    const isLowHealth = healthPercent < 30;

    return (
        <div className="ui-overlay">
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
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10 min-w-[200px]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">HP</span>
                        <span className="text-sm font-mono text-white">
                            {player.hp} / {player.maxHp}
                        </span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 rounded-full ${isLowHealth
                                ? 'bg-gradient-to-r from-red-600 to-red-500 health-critical'
                                : 'bg-gradient-to-r from-green-600 to-green-400'
                                }`}
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom right - Equipped weapon */}
            <div className="absolute bottom-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Weapon</div>
                    {equippedWeapon ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
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
            </div>

            {/* Pause button */}
            <button
                onClick={togglePause}
                className="absolute top-4 right-1/2 translate-x-1/2 bg-black/40 hover:bg-black/60 
                   backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10
                   transition-all duration-200 text-white/70 hover:text-white"
            >
                <span className="text-sm">⏸ ESC to Pause</span>
            </button>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-6 h-6 border-2 border-white/50 rounded-full" />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                    <span className="text-xs text-gray-500">
                        WASD - Move | Click - Shoot | Space - Jump
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HUD;
