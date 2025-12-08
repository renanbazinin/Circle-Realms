// ============================================
// Main Menu Component
// ============================================

import { useGameStore } from '../../store/gameStore';
import { initAudio, backgroundMusic } from '../../utils/sounds';

export const MainMenu: React.FC = () => {
    const startGame = useGameStore((state) => state.startGame);
    const setGameScreen = useGameStore((state) => state.setGameScreen);
    const player = useGameStore((state) => state.player);

    const hasSaveData = player.xp > 0 || player.level > 1;

    const handleStartGame = () => {
        initAudio(); // Initialize audio on user click
        backgroundMusic.start(); // Start background music
        startGame();
    };

    const handleNewGame = () => {
        initAudio();
        backgroundMusic.start();
        useGameStore.getState().resetGame();
        startGame();
    };

    return (
        <div className="fixed inset-0 menu-backdrop flex items-center justify-center z-50">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-purple-500/30 rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 text-center">
                {/* Game Title */}
                <div className="mb-12">
                    <h1 className="text-6xl font-black mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 
                         text-transparent bg-clip-text drop-shadow-2xl">
                        The Circle Realms
                    </h1>
                    <p className="text-gray-400 text-lg tracking-widest uppercase">
                        An Abstract RPG Adventure
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    <div className="w-80 h-80 border border-purple-500/20 rounded-full animate-spin"
                        style={{ animationDuration: '20s' }} />
                    <div className="absolute inset-4 border border-blue-500/20 rounded-full animate-spin"
                        style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-12 border border-pink-500/20 rounded-full animate-spin"
                        style={{ animationDuration: '10s' }} />
                </div>

                {/* Menu buttons */}
                <div className="flex flex-col gap-4 items-center">
                    <button
                        onClick={handleStartGame}
                        className="game-btn glow-purple min-w-[250px]"
                    >
                        {hasSaveData ? 'Continue' : 'Start Game'}
                    </button>

                    {hasSaveData && (
                        <button
                            onClick={handleNewGame}
                            className="game-btn-secondary min-w-[250px]"
                        >
                            New Game
                        </button>
                    )}

                    <button
                        onClick={() => setGameScreen('settings')}
                        className="game-btn-secondary min-w-[250px]"
                    >
                        Settings
                    </button>
                </div>

                {/* Save data indicator */}
                {hasSaveData && (
                    <div className="mt-8 text-sm text-gray-500">
                        <span className="text-green-400">●</span> Save data found - Level {player.level}
                    </div>
                )}

                {/* Version / Credits */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600">
                    v0.1.0 • Built with React Three Fiber
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
