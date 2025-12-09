// ============================================
// Type Definitions for The Circle Realms
// ============================================

// Weapon System Types
export interface IWeapon {
    id: string;
    name: string;
    damage: number;
    fireRate: number;      // shots per second
    range: number;         // max projectile distance
    color: string;         // projectile color
    projectileSpeed: number;
    projectileSize: number;
}

// Enemy Types
export type EnemyBehavior = 'passive' | 'hostile' | 'training' | 'turret';

export interface IEnemy {
    id: string;
    name: string;
    type: 'small' | 'big' | 'turret';
    health: number;
    maxHealth: number;
    size: number;          // radius for sphere or half-size for box
    color: string;
    speed: number;
    damage: number;
    behavior: EnemyBehavior;
    fireRate?: number;     // shots per second (for turrets)
    detectionRadius?: number; // detection range (for turrets)
    lootTable: ILootDrop[];
    xpReward: number;
}

// Loot System Types
export type LootType = 'weapon' | 'health' | 'xp' | 'coin';

export interface ILootDrop {
    type: LootType;
    chance: number;        // 0-1 probability
    value: number | string; // XP amount, health amount, or weapon ID
}

export interface ILootItem {
    id: string;
    type: LootType;
    value: number | IWeapon;
    position: [number, number, number];
}

// Player Types
export interface IPlayerState {
    hp: number;
    maxHp: number;
    xp: number;
    level: number;
    coins: number;
    position: [number, number, number];
}

// Inventory Types
export interface IInventory {
    weapons: IWeapon[];
    equippedWeaponId: string | null;
}

// Zone Types
export type ZoneId = 0 | 1 | 2;

export interface IZoneInfo {
    id: ZoneId;
    name: string;
    description: string;
    groundColor: string;
    ambientColor: string;
}

// NPC Types
export interface INPC {
    id: string;
    name: string;
    color: string;
    size: number;
    position: [number, number, number];
    dialogLines: string[];
}

// Dialog Types
export interface IDialog {
    isOpen: boolean;
    npcName: string;
    lines: string[];
    currentLineIndex: number;
}

// Game Screen Types
export type GameScreen = 'menu' | 'playing' | 'paused' | 'settings' | 'gameOver';

// Portal Types
export interface IPortal {
    id: string;
    position: [number, number, number];
    targetZone: ZoneId;
    color: string;
    label: string;
}

// Projectile Types
export interface IProjectile {
    id: string;
    position: [number, number, number];
    direction: [number, number, number];
    weapon: IWeapon;
    ownerId: string;
}
