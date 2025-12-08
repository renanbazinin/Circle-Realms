// ============================================
// Settings Menu Component
// ============================================

import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { updateSoundSettings, getSoundSettings, backgroundMusic, playSFX } from '../../utils/sounds';

export const Settings: React.FC = () => {
    const setGameScreen = useGameStore((state) => state.setGameScreen);
    const resetGame = useGameStore((state) => state.resetGame);
    const gameScreen = useGameStore((state) => state.gameScreen);

    const soundSettings = getSoundSettings();
    const [musicVolume, setMusicVolume] = useState(Math.round(soundSettings.musicVolume * 100));
    const [sfxVolume, setSfxVolume] = useState(Math.round(soundSettings.sfxVolume * 100));
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    // Update sound settings when sliders change
    useEffect(() => {
        updateSoundSettings({
            musicVolume: musicVolume / 100,
            sfxVolume: sfxVolume / 100,
        });
        backgroundMusic.updateVolume();
    }, [musicVolume, sfxVolume]);

    // Handle music toggle
    const handleMusicToggle = () => {
        if (musicEnabled) {
            backgroundMusic.stop();
        } else {
            backgroundMusic.start();
        }
        setMusicEnabled(!musicEnabled);
    };

    // Test SFX
    const handleTestSFX = () => {
        playSFX('pickup');
    };

    const handleBack = () => {
        if (gameScreen === 'settings') {
            setGameScreen('menu');
        }
    };

    const handleResetProgress = () => {
        resetGame();
        setShowConfirmReset(false);
        setGameScreen('menu');
    };

    return (
        <div className="fixed inset-0 menu-backdrop flex items-center justify-center z-50">
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 
                  border border-white/10 shadow-2xl max-w-md w-full mx-4">
                {/* Header */}
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 
                   text-transparent bg-clip-text">
                    Settings
                </h2>

                {/* Settings options */}
                <div className="space-y-6">
                    {/* Music Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-gray-300">Background Music</label>
                        <button
                            onClick={handleMusicToggle}
                            className={`px-4 py-2 rounded-lg transition-colors ${musicEnabled
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                        >
                            {musicEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Music Volume */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300">Music Volume</label>
                            <span className="text-gray-500">{musicVolume}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                    </div>

                    {/* SFX Volume */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300">Sound Effects</label>
                            <span className="text-gray-500">{sfxVolume}%</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sfxVolume}
                                onChange={(e) => setSfxVolume(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <button
                                onClick={handleTestSFX}
                                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                            >
                                Test
                            </button>
                        </div>
                    </div>

                    {/* Mobile Controls Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-300">Touch Controls</label>
                            <p className="text-xs text-gray-500">Virtual joystick for mobile</p>
                        </div>
                        <div className="flex gap-1">
                            {(['auto', 'on', 'off'] as const).map((option) => {
                                const current = localStorage.getItem('mobileControlsMode') || 'auto';
                                return (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            localStorage.setItem('mobileControlsMode', option);
                                            window.dispatchEvent(new Event('mobileControlsChanged'));
                                        }}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${current === option
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            }`}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls Info */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-lg font-semibold text-gray-300 mb-3">Controls</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Move</div>
                            <div className="text-gray-300">WASD / Arrow Keys</div>
                            <div className="text-gray-500">Jump</div>
                            <div className="text-gray-300">Space</div>
                            <div className="text-gray-500">Shoot</div>
                            <div className="text-gray-300">Left Click</div>
                            <div className="text-gray-500">Pause</div>
                            <div className="text-gray-300">ESC</div>
                        </div>
                    </div>

                    {/* Reset Progress */}
                    <div className="border-t border-white/10 pt-6">
                        {!showConfirmReset ? (
                            <button
                                onClick={() => setShowConfirmReset(true)}
                                className="w-full py-2 px-4 rounded-lg bg-red-900/50 hover:bg-red-900/70 
                       text-red-300 transition-colors border border-red-800/50"
                            >
                                Reset All Progress
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-red-400 text-sm text-center">
                                    This will delete all save data. Are you sure?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowConfirmReset(false)}
                                        className="flex-1 py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 
                           text-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetProgress}
                                        className="flex-1 py-2 px-4 rounded-lg bg-red-700 hover:bg-red-600 
                           text-white transition-colors"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back button */}
                <button
                    onClick={handleBack}
                    className="mt-8 w-full py-3 px-6 rounded-xl font-semibold
                 bg-white/10 hover:bg-white/20 text-white transition-all
                 border border-white/20"
                >
                    ← Back to Menu
                </button>
            </div>
        </div>
    );
};

export default Settings;
