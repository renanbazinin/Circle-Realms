// ============================================
// Zone 1 Enemies - Hostile Spawns
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { Enemy } from '../../components/canvas/Enemy';
import { Loot } from '../../components/canvas/Loot';
import { ENEMY_PRESETS } from '../../data/enemies';
import { useGameStore } from '../../store/gameStore';
import type { ILootDrop, ILootItem, IWeapon } from '../../types';
import { getWeaponById } from '../../data/weapons';

interface EnemySpawn {
    id: string;
    presetId: string;
    position: [number, number, number];
    isAlive: boolean;
}

// Initial enemy placements
const initialEnemies: EnemySpawn[] = [
    // Small slimes around the arena
    { id: 'slime-1', presetId: 'small-slime', position: [8, 0.5, 8], isAlive: true },
    { id: 'slime-2', presetId: 'small-slime', position: [-8, 0.5, 8], isAlive: true },
    { id: 'slime-3', presetId: 'small-slime', position: [8, 0.5, -8], isAlive: true },
    { id: 'slime-4', presetId: 'small-slime', position: [-8, 0.5, -8], isAlive: true },

    // Big golem in the center area
    { id: 'golem-1', presetId: 'big-golem', position: [0, 1.2, 12], isAlive: true },
];

// Spawn points for respawning enemies
const spawnPoints: [number, number, number][] = [
    [15, 0.5, 15],
    [-15, 0.5, 15],
    [15, 0.5, -15],
    [-15, 0.5, -15],
    [0, 0.5, 20],
    [0, 0.5, -20],
    [20, 0.5, 0],
    [-20, 0.5, 0],
];

export const Enemies: React.FC = () => {
    const [enemies, setEnemies] = useState<EnemySpawn[]>(initialEnemies);
    const [lootDrops, setLootDrops] = useState<ILootItem[]>([]);
    const spawnCounter = useRef(0);

    const addXp = useGameStore((state) => state.addXp);
    const isPaused = useGameStore((state) => state.isPaused);

    // Enemy respawn timer
    useEffect(() => {
        if (isPaused) return;

        const spawnInterval = setInterval(() => {
            const aliveCount = enemies.filter((e) => e.isAlive).length;

            // Keep between 3-6 enemies alive
            if (aliveCount < 3) {
                const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                const isGolem = Math.random() < 0.2; // 20% chance for golem

                const newEnemy: EnemySpawn = {
                    id: `spawn-${Date.now()}-${spawnCounter.current++}`,
                    presetId: isGolem ? 'big-golem' : 'small-slime',
                    position: spawnPoint,
                    isAlive: true,
                };

                setEnemies((prev) => [...prev, newEnemy]);
            }
        }, 5000); // Try to spawn every 5 seconds

        return () => clearInterval(spawnInterval);
    }, [enemies, isPaused]);

    const handleEnemyDeath = useCallback((
        enemyId: string,
        position: [number, number, number],
        lootTable: ILootDrop[],
        xpReward: number
    ) => {
        // Mark enemy as dead
        setEnemies((prev) =>
            prev.map((e) => e.id === enemyId ? { ...e, isAlive: false } : e)
        );

        // Add XP
        addXp(xpReward);

        // Roll for loot drops
        lootTable.forEach((drop) => {
            if (Math.random() < drop.chance) {
                let value: number | IWeapon = drop.value as number;

                if (drop.type === 'weapon') {
                    const weapon = getWeaponById(drop.value as string);
                    if (weapon) {
                        value = weapon;
                    }
                }

                const lootItem: ILootItem = {
                    id: `loot-${Date.now()}-${Math.random()}`,
                    type: drop.type,
                    value: value,
                    position: [position[0], 0.5, position[2]],
                };
                setLootDrops((prev) => [...prev, lootItem]);
            }
        });
    }, [addXp]);

    const handleLootCollected = useCallback((lootId: string) => {
        setLootDrops((prev) => prev.filter((l) => l.id !== lootId));
    }, []);

    return (
        <>
            {/* Render alive enemies */}
            {enemies
                .filter((e) => e.isAlive)
                .map((enemy) => {
                    const preset = ENEMY_PRESETS[enemy.presetId];
                    if (!preset) return null;

                    return (
                        <Enemy
                            key={enemy.id}
                            id={enemy.id}
                            preset={preset}
                            position={enemy.position}
                            onDeath={(pos, loot, xp) => handleEnemyDeath(enemy.id, pos, loot, xp)}
                        />
                    );
                })}

            {/* Render loot drops */}
            {lootDrops.map((loot) => (
                <Loot key={loot.id} loot={loot} />
            ))}
        </>
    );
};

export default Enemies;
