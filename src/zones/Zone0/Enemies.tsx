// ============================================
// Zone 0 Enemies - Training/Practice Enemies
// ============================================

import { useState, useCallback } from 'react';
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

const initialEnemies: EnemySpawn[] = [
    // Training Dummy - doesn't move or attack
    { id: 'training-1', presetId: 'training-dummy', position: [-8, 0.8, -3], isAlive: true },

    // Easy practice slimes
    { id: 'practice-1', presetId: 'practice-slime', position: [10, 0.6, -8], isAlive: true },
    { id: 'practice-2', presetId: 'practice-slime', position: [-12, 0.6, 8], isAlive: true },
    { id: 'practice-3', presetId: 'practice-slime', position: [6, 0.6, 12], isAlive: true },
];

export const Enemies: React.FC = () => {
    const [enemies, setEnemies] = useState<EnemySpawn[]>(initialEnemies);
    const [lootDrops, setLootDrops] = useState<ILootItem[]>([]);

    const addXp = useGameStore((state) => state.addXp);

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
                const lootItem: ILootItem = {
                    id: `loot-${Date.now()}-${Math.random()}`,
                    type: drop.type,
                    value: drop.type === 'weapon'
                        ? getWeaponById(drop.value as string) || drop.value
                        : drop.value,
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
