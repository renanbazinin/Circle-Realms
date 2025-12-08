// ============================================
// Game Over Screen Component
// ============================================

import { useGameStore } from '../../store/gameStore';

export const GameOver: React.FC = () => {
    const player = useGameStore((state) => state.player);
    const resetPlayer = useGameStore((state) => state.resetPlayer);
    const setGameScreen = useGameStore((state) => state.setGameScreen);
    const currentZone = useGameStore((state) => state.currentZone);
    const setCurrentZone = useGameStore((state) => state.setCurrentZone);

    const handleRespawn = () => {
        resetPlayer();
        setCurrentZone(0); // Return to hub
        setGameScreen('playing');
    };

    const handleMainMenu = () => {
        resetPlayer();
        setGameScreen('menu');
    };

    return (
        <div className="fixed inset-0 bg-red-950/90 backdrop-blur-sm flex items-center justify-center z-50">
            {/* Animated blood effect overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 to-transparent" />
            </div>

            <div className="relative text-center">
                {/* Game Over text */}
                <div className="mb-8">
                    <h1 className="text-6xl font-black text-red-500 mb-4 animate-pulse">
                        GAME OVER
                    </h1>
                    <p className="text-gray-400 text-lg">You have fallen in battle...</p>
                </div>

                {/* Stats */}
                <div className="bg-black/50 rounded-xl p-6 mb-8 border border-red-800/30">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-gray-500 text-sm uppercase">Level Reached</div>
                            <div className="text-3xl font-bold text-yellow-400">{player.level}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-sm uppercase">Total XP</div>
                            <div className="text-3xl font-bold text-purple-400">{player.xp}</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 min-w-[280px]">
                    <button
                        onClick={handleRespawn}
                        className="game-btn glow-green"
                    >
                        Respawn at Hub
                    </button>

                    <button
                        onClick={handleMainMenu}
                        className="game-btn-secondary"
                    >
                        Return to Menu
                    </button>
                </div>

                {/* Tip */}
                <div className="mt-8 text-sm text-gray-600">
                    Tip: Your XP and inventory are preserved. Only HP is restored.
                </div>
            </div>
        </div>
    );
};

export default GameOver;
