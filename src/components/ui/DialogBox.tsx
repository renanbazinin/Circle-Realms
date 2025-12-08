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
        <div className="fixed inset-x-0 bottom-24 flex justify-center z-50 pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 mx-4 max-w-2xl w-full
                      border border-white/20 shadow-2xl pointer-events-auto">
                {/* NPC Name */}
                <div className="absolute -top-3 left-6 px-4 py-1 bg-purple-600 rounded-full">
                    <span className="text-sm font-bold text-white">{dialog.npcName}</span>
                </div>

                {/* Dialog text */}
                <p className="text-lg text-white leading-relaxed mt-2">
                    {currentLine}
                </p>

                {/* Progress indicator and continue prompt */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                    <div className="text-sm text-gray-500">
                        {dialog.currentLineIndex + 1} / {dialog.lines.length}
                    </div>
                    <div className="text-sm text-purple-400 animate-pulse">
                        {isLastLine ? 'Click or press Space to close' : 'Click or press Space to continue →'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogBox;
