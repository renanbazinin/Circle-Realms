// ============================================
// Zustand Game Store with Persistence
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    IWeapon,
    IPlayerState,
    IInventory,
    ZoneId,
    GameScreen,
    IDialog,
    ILootItem,
    IProjectile
} from '../types';
import { getStarterWeapon, getWeaponById } from '../data/weapons';

// ============================================
// State Interface
// ============================================

interface GameState {
    // Player State
    player: IPlayerState;
    inventory: IInventory;

    // Game State
    currentZone: ZoneId;
    gameScreen: GameScreen;
    isPaused: boolean;

    // Dialog State
    dialog: IDialog;

    // Runtime State (not persisted)
    lootItems: ILootItem[];
    projectiles: IProjectile[];

    // Player Actions
    damagePlayer: (amount: number) => void;
    healPlayer: (amount: number) => void;
    addXp: (amount: number) => void;
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => boolean;
    setPlayerPosition: (position: [number, number, number]) => void;
    resetPlayer: () => void;

    // Inventory Actions
    addWeapon: (weapon: IWeapon) => void;
    equipWeapon: (weaponId: string) => void;
    getEquippedWeapon: () => IWeapon | null;

    // Zone Actions
    setCurrentZone: (zone: ZoneId) => void;

    // Game State Actions
    setGameScreen: (screen: GameScreen) => void;
    togglePause: () => void;
    startGame: () => void;
    resetGame: () => void;

    // Dialog Actions
    openDialog: (npcName: string, lines: string[]) => void;
    advanceDialog: () => void;
    closeDialog: () => void;

    // Shop Actions
    isShopOpen: boolean;
    openShop: () => void;
    closeShop: () => void;

    // Loot Actions
    addLoot: (loot: ILootItem) => void;
    removeLoot: (lootId: string) => void;
    clearLoot: () => void;

    // Projectile Actions
    addProjectile: (projectile: IProjectile) => void;
    removeProjectile: (projectileId: string) => void;
    clearProjectiles: () => void;
}

// ============================================
// Initial State
// ============================================

const initialPlayerState: IPlayerState = {
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    coins: 0,
    position: [0, 1, 0],
};

const starterWeapon = getStarterWeapon();

const initialInventory: IInventory = {
    weapons: [starterWeapon],
    equippedWeaponId: starterWeapon.id,
};

const initialDialog: IDialog = {
    isOpen: false,
    npcName: '',
    lines: [],
    currentLineIndex: 0,
};

// ============================================
// XP Level Calculation
// ============================================

const calculateLevel = (xp: number): number => {
    // Simple level curve: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// ============================================
// Store Creation
// ============================================

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initial State
            player: initialPlayerState,
            inventory: initialInventory,
            currentZone: 0,
            gameScreen: 'menu',
            isPaused: false,
            dialog: initialDialog,
            isShopOpen: false,
            lootItems: [],
            projectiles: [],

            // Player Actions
            damagePlayer: (amount: number) => set((state) => {
                const newHp = Math.max(0, state.player.hp - amount);
                const newScreen = newHp <= 0 ? 'gameOver' : state.gameScreen;
                return {
                    player: { ...state.player, hp: newHp },
                    gameScreen: newScreen,
                };
            }),

            healPlayer: (amount: number) => set((state) => ({
                player: {
                    ...state.player,
                    hp: Math.min(state.player.maxHp, state.player.hp + amount),
                },
            })),

            addXp: (amount: number) => set((state) => {
                const newXp = state.player.xp + amount;
                const newLevel = calculateLevel(newXp);
                const leveledUp = newLevel > state.player.level;

                return {
                    player: {
                        ...state.player,
                        xp: newXp,
                        level: newLevel,
                        // Heal on level up
                        hp: leveledUp ? state.player.maxHp : state.player.hp,
                    },
                };
            }),

            addCoins: (amount: number) => set((state) => ({
                player: {
                    ...state.player,
                    coins: state.player.coins + amount,
                },
            })),

            spendCoins: (amount: number) => {
                const { player } = get();
                if (player.coins >= amount) {
                    set((state) => ({
                        player: {
                            ...state.player,
                            coins: state.player.coins - amount,
                        },
                    }));
                    return true;
                }
                return false;
            },

            setPlayerPosition: (position: [number, number, number]) => set((state) => ({
                player: { ...state.player, position },
            })),

            resetPlayer: () => set({
                player: { ...initialPlayerState },
            }),

            // Inventory Actions
            addWeapon: (weapon: IWeapon) => set((state) => {
                // Don't add duplicate weapons
                if (state.inventory.weapons.some(w => w.id === weapon.id)) {
                    return state;
                }
                return {
                    inventory: {
                        ...state.inventory,
                        weapons: [...state.inventory.weapons, weapon],
                    },
                };
            }),

            equipWeapon: (weaponId: string) => set((state) => {
                const weapon = state.inventory.weapons.find(w => w.id === weaponId);
                if (!weapon) return state;
                return {
                    inventory: {
                        ...state.inventory,
                        equippedWeaponId: weaponId,
                    },
                };
            }),

            getEquippedWeapon: () => {
                const state = get();
                if (!state.inventory.equippedWeaponId) return null;
                return state.inventory.weapons.find(
                    w => w.id === state.inventory.equippedWeaponId
                ) || null;
            },

            // Zone Actions
            setCurrentZone: (zone: ZoneId) => set({
                currentZone: zone,
                lootItems: [], // Clear loot when changing zones
                projectiles: [],
            }),

            // Game State Actions
            setGameScreen: (screen: GameScreen) => set({
                gameScreen: screen,
                isPaused: screen === 'paused',
            }),

            togglePause: () => set((state) => ({
                isPaused: !state.isPaused,
                gameScreen: state.isPaused ? 'playing' : 'paused',
            })),

            startGame: () => set({
                gameScreen: 'playing',
                isPaused: false,
            }),

            resetGame: () => set({
                player: { ...initialPlayerState },
                inventory: {
                    weapons: [getStarterWeapon()],
                    equippedWeaponId: getStarterWeapon().id,
                },
                currentZone: 0,
                gameScreen: 'menu',
                isPaused: false,
                dialog: initialDialog,
                lootItems: [],
                projectiles: [],
            }),

            // Dialog Actions
            openDialog: (npcName: string, lines: string[]) => set({
                dialog: {
                    isOpen: true,
                    npcName,
                    lines,
                    currentLineIndex: 0,
                },
                isPaused: true,
            }),

            advanceDialog: () => set((state) => {
                const nextIndex = state.dialog.currentLineIndex + 1;
                if (nextIndex >= state.dialog.lines.length) {
                    return {
                        dialog: { ...initialDialog },
                        isPaused: false,
                    };
                }
                return {
                    dialog: {
                        ...state.dialog,
                        currentLineIndex: nextIndex,
                    },
                };
            }),

            closeDialog: () => set({
                dialog: { ...initialDialog },
                isPaused: false,
            }),

            // Shop Actions
            openShop: () => set({ isShopOpen: true, isPaused: true }),
            closeShop: () => set({ isShopOpen: false, isPaused: false }),

            // Loot Actions
            addLoot: (loot: ILootItem) => set((state) => ({
                lootItems: [...state.lootItems, loot],
            })),

            removeLoot: (lootId: string) => set((state) => ({
                lootItems: state.lootItems.filter(l => l.id !== lootId),
            })),

            clearLoot: () => set({ lootItems: [] }),

            // Projectile Actions
            addProjectile: (projectile: IProjectile) => set((state) => ({
                projectiles: [...state.projectiles, projectile],
            })),

            removeProjectile: (projectileId: string) => set((state) => ({
                projectiles: state.projectiles.filter(p => p.id !== projectileId),
            })),

            clearProjectiles: () => set({ projectiles: [] }),
        }),
        {
            name: 'circle-realms-save',
            partialize: (state) => ({
                // Only persist these fields
                player: state.player,
                inventory: state.inventory,
                currentZone: state.currentZone,
            }),
        }
    )
);

// ============================================
// Selector Hooks
// ============================================

export const usePlayer = () => useGameStore((state) => state.player);
export const useInventory = () => useGameStore((state) => state.inventory);
export const useCurrentZone = () => useGameStore((state) => state.currentZone);
export const useGameScreen = () => useGameStore((state) => state.gameScreen);
export const useDialog = () => useGameStore((state) => state.dialog);
export const useIsPaused = () => useGameStore((state) => state.isPaused);
