// ============================================
// Pause Menu Component
// ============================================

import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

export const PauseMenu: React.FC = () => {
    const setGameScreen = useGameStore((state) => state.setGameScreen);
    const togglePause = useGameStore((state) => state.togglePause);

    // Handle ESC key to resume
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Escape') {
                togglePause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePause]);

    const handleResume = () => {
        togglePause();
    };

    const handleSettings = () => {
        setGameScreen('settings');
    };

    const handleMainMenu = () => {
        setGameScreen('menu');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 
                      border border-white/10 shadow-2xl text-center">
                {/* Paused indicator */}
                <div className="mb-8">
                    <h2 className="text-4xl font-bold text-white mb-2">Paused</h2>
                    <p className="text-gray-400">Press ESC to resume</p>
                </div>

                {/* Menu options */}
                <div className="flex flex-col gap-3 min-w-[250px]">
                    <button
                        onClick={handleResume}
                        className="game-btn glow-green"
                    >
                        Resume
                    </button>

                    <button
                        onClick={handleSettings}
                        className="game-btn-secondary"
                    >
                        Settings
                    </button>

                    <button
                        onClick={handleMainMenu}
                        className="py-3 px-6 rounded-lg font-semibold
                       bg-red-900/50 hover:bg-red-900/70 text-red-300 
                       transition-colors border border-red-800/50"
                    >
                        Return to Menu
                    </button>
                </div>

                {/* Game state info */}
                <div className="mt-6 pt-4 border-t border-white/10 text-sm text-gray-500">
                    Your progress is automatically saved
                </div>
            </div>
        </div>
    );
};

export default PauseMenu;
