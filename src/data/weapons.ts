// ============================================
// Weapon Data for The Circle Realms
// ============================================

import type { IWeapon } from '../types';

export const WEAPONS: Record<string, IWeapon> = {
    'basic-pea-shooter': {
        id: 'basic-pea-shooter',
        name: 'Basic Pea Shooter',
        damage: 10,
        fireRate: 2,
        range: 30,
        color: '#66ff66',
        projectileSpeed: 20,
        projectileSize: 0.15,
    },
    'blue-blaster': {
        id: 'blue-blaster',
        name: 'Blue Blaster',
        damage: 25,
        fireRate: 3,
        range: 40,
        color: '#3b82f6',
        projectileSpeed: 30,
        projectileSize: 0.2,
    },
    'purple-plasma': {
        id: 'purple-plasma',
        name: 'Purple Plasma',
        damage: 40,
        fireRate: 1.5,
        range: 50,
        color: '#a855f7',
        projectileSpeed: 25,
        projectileSize: 0.25,
    },
};

export const getWeaponById = (id: string): IWeapon | undefined => {
    return WEAPONS[id];
};

export const getStarterWeapon = (): IWeapon => {
    return WEAPONS['basic-pea-shooter'];
};
