// ============================================
// Enemy Presets for The Circle Realms
// ============================================

import type { IEnemy } from '../types';

export const ENEMY_PRESETS: Record<string, Omit<IEnemy, 'id'>> = {
    'training-dummy': {
        name: 'Training Dummy',
        type: 'small',
        health: 50,
        maxHealth: 50,
        size: 0.6,
        color: '#888888',
        speed: 0,
        damage: 0,
        behavior: 'training',
        lootTable: [],
        xpReward: 5,
    },
    'small-slime': {
        name: 'Small Slime',
        type: 'small',
        health: 30,
        maxHealth: 30,
        size: 0.5,
        color: '#ef4444',
        speed: 3,
        damage: 5,
        behavior: 'hostile',
        lootTable: [
            { type: 'xp', chance: 1, value: 10 },
            { type: 'health', chance: 0.3, value: 20 },
        ],
        xpReward: 15,
    },
    'practice-slime': {
        name: 'Practice Slime',
        type: 'small',
        health: 20,
        maxHealth: 20,
        size: 0.4,
        color: '#f97316',
        speed: 1.5,
        damage: 3,
        behavior: 'hostile',
        lootTable: [
            { type: 'xp', chance: 1, value: 5 },
        ],
        xpReward: 8,
    },
    'big-golem': {
        name: 'Stone Golem',
        type: 'big',
        health: 150,
        maxHealth: 150,
        size: 1.2,
        color: '#dc2626',
        speed: 1.5,
        damage: 20,
        behavior: 'hostile',
        lootTable: [
            { type: 'xp', chance: 1, value: 50 },
            { type: 'weapon', chance: 0.2, value: 'blue-blaster' },
            { type: 'health', chance: 0.5, value: 50 },
        ],
        xpReward: 50,
    },
};

export const createEnemy = (presetId: string, id: string): IEnemy | null => {
    const preset = ENEMY_PRESETS[presetId];
    if (!preset) return null;

    return {
        id,
        ...preset,
        health: preset.maxHealth, // Reset health to max
    };
};
