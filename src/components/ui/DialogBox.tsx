// ============================================
// Dialog Box Component
// ============================================

import { useEffect } from 'react';
import { useGameStore, useDialog } from '../../store/gameStore';

export const DialogBox: React.FC = () => {
    const dialog = useDialog();
    const advanceDialog = useGameStore((state) => state.advanceDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);

    // Handle clicking or pressing space to advance dialog
    useEffect(() => {
        if (!dialog.isOpen) return;

        const handleAdvance = (e: KeyboardEvent | MouseEvent) => {
            if (e instanceof KeyboardEvent && e.code !== 'Space' && e.code !== 'Enter') {
                if (e.code === 'Escape') {
                    closeDialog();
                }
                return;
            }
            advanceDialog();
        };

        window.addEventListener('keydown', handleAdvance);
        window.addEventListener('click', handleAdvance);

        return () => {
            window.removeEventListener('keydown', handleAdvance);
            window.removeEventListener('click', handleAdvance);
        };
    }, [dialog.isOpen, advanceDialog, closeDialog]);

    if (!dialog.isOpen) return null;

    const currentLine = dialog.lines[dialog.currentLineIndex] || '';
    const isLastLine = dialog.currentLineIndex >= dialog.lines.length - 1;

    return (
        <div className="fixed inset-x-0 bottom-28 flex justify-center z-50 pointer-events-none px-4">
            <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full
                      border border-white/20 shadow-2xl pointer-events-auto">
                {/* NPC Name - positioned above the box */}
                <div className="absolute -top-5 left-6 px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 
                              rounded-lg shadow-lg border border-purple-400/30">
                    <span className="text-base font-bold text-white drop-shadow">{dialog.npcName}</span>
                </div>

                {/* Dialog content with proper spacing */}
                <div className="pt-10 pb-6 px-6">
                    {/* Dialog text */}
                    <p className="text-xl text-white leading-relaxed min-h-[60px]">
                        {currentLine}
                    </p>

                    {/* Progress indicator and continue prompt */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                        <div className="text-sm text-gray-500">
                            {dialog.currentLineIndex + 1} / {dialog.lines.length}
                        </div>
                        <div className="text-sm text-purple-400 animate-pulse">
                            {isLastLine ? 'Click or press Space to close' : 'Click or press Space to continue →'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogBox;
