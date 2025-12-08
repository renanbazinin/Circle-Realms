// ============================================
// World Enemies - All zones with Labels
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, BallCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';
import { ENEMY_PRESETS } from '../../data/enemies';
import type { IEnemy, ILootDrop, ILootItem, IWeapon } from '../../types';
import { getWeaponById } from '../../data/weapons';
import { Loot } from '../canvas/Loot';

interface EnemySpawn {
    id: string;
    presetId: string;
    position: [number, number, number];
    zone: number;
    isAlive: boolean;
}

// Spawn enemies HIGH above ground - let gravity bring them down
const getEnemyY = (presetId: string): number => {
    // Spawn at Y=3 for all enemies - they will drop onto ground
    console.log(`[Enemy] getEnemyY for ${presetId}: spawning at Y=3`);
    return 3;
};

// Initial enemy placements - Zone 0 has practice enemies, Zone 1 has hostile enemies
const initialEnemies: EnemySpawn[] = [
    // Zone 0 - Practice area (inner ring)
    { id: 'training-1', presetId: 'training-dummy', position: [-8, getEnemyY('training-dummy'), -3], zone: 0, isAlive: true },
    { id: 'practice-1', presetId: 'practice-slime', position: [10, getEnemyY('practice-slime'), -8], zone: 0, isAlive: true },
    { id: 'practice-2', presetId: 'practice-slime', position: [-10, getEnemyY('practice-slime'), 8], zone: 0, isAlive: true },

    // Zone 1 - Hostile area (outer ring)
    { id: 'slime-1', presetId: 'small-slime', position: [20, getEnemyY('small-slime'), 10], zone: 1, isAlive: true },
    { id: 'slime-2', presetId: 'small-slime', position: [-18, getEnemyY('small-slime'), 15], zone: 1, isAlive: true },
    { id: 'slime-3', presetId: 'small-slime', position: [22, getEnemyY('small-slime'), -12], zone: 1, isAlive: true },
    { id: 'slime-4', presetId: 'small-slime', position: [-20, getEnemyY('small-slime'), -18], zone: 1, isAlive: true },
    { id: 'golem-1', presetId: 'big-golem', position: [0, getEnemyY('big-golem'), 22], zone: 1, isAlive: true },
];

// Spawn points for Zone 1 respawning - use dynamic Y based on preset
const zone1SpawnPoints: [number, number][] = [
    [20, 18], [-20, 18], [20, -18], [-20, -18],
    [0, 25], [0, -25], [25, 0], [-25, 0],
];

// Single Enemy Component with Label
interface EnemyWithLabelProps {
    id: string;
    preset: Omit<IEnemy, 'id'>;
    position: [number, number, number];
    onDeath: (id: string, pos: [number, number, number], loot: ILootDrop[], xp: number) => void;
}

const EnemyWithLabel: React.FC<EnemyWithLabelProps> = ({ id, preset, position, onDeath }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [health, setHealth] = useState(preset.maxHealth);
    const [isAlive, setIsAlive] = useState(true);

    const player = useGameStore((state) => state.player);
    const isPaused = useGameStore((state) => state.isPaused);
    const damagePlayer = useGameStore((state) => state.damagePlayer);

    const lastAttackTime = useRef(0);

    // Log spawn
    useEffect(() => {
        console.log(`[Enemy] Spawned: ${preset.name} (${id}) at position [${position.join(', ')}]`);
    }, []);

    // AI behavior
    useFrame(() => {
        if (!rigidBodyRef.current || !isAlive || isPaused) return;
        if (preset.behavior === 'training') return;

        const enemyPos = rigidBodyRef.current.translation();
        const playerPos = new Vector3(...player.position);
        const enemyVec = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z);

        // Check if enemy fell off the world
        if (enemyPos.y < -5) {
            console.log(`[Enemy] ${preset.name} (${id}) fell off world at Y=${enemyPos.y}, respawning...`);
            // Reset position instead of dying
            rigidBodyRef.current.setTranslation({ x: position[0], y: position[1] + 2, z: position[2] }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        const distance = enemyVec.distanceTo(playerPos);

        if (preset.behavior === 'hostile' && distance < 15 && distance > 1.5) {
            const direction = playerPos.clone().sub(enemyVec).normalize();
            rigidBodyRef.current.setLinvel({
                x: direction.x * preset.speed,
                y: rigidBodyRef.current.linvel().y,
                z: direction.z * preset.speed,
            }, true);
        } else if (distance <= 1.5 && preset.behavior === 'hostile') {
            const now = Date.now();
            if (now - lastAttackTime.current > 1000) {
                const pos = rigidBodyRef.current.translation();
                console.log(`[Enemy] ${preset.name} (${id}) attacked player for ${preset.damage} damage`);
                console.log(`[Enemy] ${preset.name} position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}] (Ground surface is at Y=0)`);
                damagePlayer(preset.damage);
                lastAttackTime.current = now;
            }
            rigidBodyRef.current.setLinvel({
                x: 0,
                y: rigidBodyRef.current.linvel().y,
                z: 0,
            }, true);
        }
    });

    const takeDamage = useCallback((amount: number) => {
        if (!isAlive) return;
        console.log(`[Enemy] ${preset.name} (${id}) took ${amount} damage`);
        setHealth((prev) => {
            const newHealth = Math.max(0, prev - amount);
            console.log(`[Enemy] ${preset.name} (${id}) health: ${newHealth}/${preset.maxHealth}`);
            if (newHealth <= 0) {
                console.log(`[Enemy] ${preset.name} (${id}) died!`);
                setIsAlive(false);
                if (rigidBodyRef.current) {
                    const pos = rigidBodyRef.current.translation();
                    onDeath(id, [pos.x, pos.y, pos.z], preset.lootTable, preset.xpReward);
                }
            }
            return newHealth;
        });
    }, [isAlive, id, onDeath, preset]);

    useEffect(() => {
        if (rigidBodyRef.current) {
            (rigidBodyRef.current as any).userData = { type: 'enemy', id, takeDamage };
        }
    }, [id, takeDamage]);

    if (!isAlive) return null;

    const healthPercent = (health / preset.maxHealth) * 100;
    const healthColor = healthPercent > 50 ? '#22c55e' : healthPercent > 25 ? '#eab308' : '#ef4444';

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="dynamic"
            position={position}
            colliders={false}
            mass={preset.type === 'big' ? 5 : 1}
            linearDamping={2}
            angularDamping={0.5}
            lockRotations
            userData={{ type: 'enemy', id, takeDamage }}
            ccd={true}
        >
            {/* Explicit ball collider with correct size */}
            <BallCollider args={[preset.size]} restitution={0.2} friction={1} />

            {/* Enemy body */}
            <mesh castShadow>
                <sphereGeometry args={[preset.size, 32, 32]} />
                <meshStandardMaterial
                    color={preset.color}
                    emissive={preset.color}
                    emissiveIntensity={0.3}
                    roughness={0.4}
                    metalness={0.3}
                />
            </mesh>

            {/* Floating name label */}
            <Text
                position={[0, preset.size + 0.8, 0]}
                fontSize={0.25}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {preset.name}
            </Text>

            {/* Health bar background */}
            <mesh position={[0, preset.size + 0.4, 0]}>
                <planeGeometry args={[1.2, 0.15]} />
                <meshBasicMaterial color="#333333" transparent opacity={0.8} />
            </mesh>

            {/* Health bar fill */}
            <mesh position={[(healthPercent - 100) / 200, preset.size + 0.4, 0.01]}>
                <planeGeometry args={[1.2 * (healthPercent / 100), 0.12]} />
                <meshBasicMaterial color={healthColor} />
            </mesh>
        </RigidBody>
    );
};

export const WorldEnemies: React.FC = () => {
    const [enemies, setEnemies] = useState<EnemySpawn[]>(initialEnemies);
    const [lootDrops, setLootDrops] = useState<ILootItem[]>([]);
    const spawnCounter = useRef(0);

    const addXp = useGameStore((state) => state.addXp);
    const isPaused = useGameStore((state) => state.isPaused);

    // Respawn enemies in Zone 1
    useEffect(() => {
        if (isPaused) return;

        const spawnInterval = setInterval(() => {
            const zone1Alive = enemies.filter((e) => e.isAlive && e.zone === 1).length;

            if (zone1Alive < 4) {
                const spawnXZ = zone1SpawnPoints[Math.floor(Math.random() * zone1SpawnPoints.length)];
                const isGolem = Math.random() < 0.15;
                const presetId = isGolem ? 'big-golem' : 'small-slime';
                const newId = `enemy-${Date.now()}-${spawnCounter.current++}`;

                console.log(`[Enemy] Spawning new ${presetId} with ID: ${newId}`);

                const newEnemy: EnemySpawn = {
                    id: newId,
                    presetId,
                    position: [spawnXZ[0], getEnemyY(presetId), spawnXZ[1]],
                    zone: 1,
                    isAlive: true,
                };

                setEnemies((prev) => [...prev, newEnemy]);
            }
        }, 6000);

        return () => clearInterval(spawnInterval);
    }, [enemies, isPaused]);

    const handleEnemyDeath = useCallback((
        enemyId: string,
        position: [number, number, number],
        lootTable: ILootDrop[],
        xpReward: number
    ) => {
        console.log(`[Enemy] Death handler for ${enemyId}, XP: ${xpReward}`);
        setEnemies((prev) =>
            prev.map((e) => e.id === enemyId ? { ...e, isAlive: false } : e)
        );
        addXp(xpReward);

        lootTable.forEach((drop) => {
            if (Math.random() < drop.chance) {
                console.log(`[Loot] Dropping ${drop.type} at [${position[0].toFixed(1)}, ${position[2].toFixed(1)}]`);
                let value: number | IWeapon = drop.value as number;
                if (drop.type === 'weapon') {
                    const weapon = getWeaponById(drop.value as string);
                    if (weapon) value = weapon;
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

        // Always drop 1-3 coins on enemy death
        const coinCount = Math.floor(Math.random() * 3) + 1;
        console.log(`[Loot] Dropping ${coinCount} coins`);
        for (let i = 0; i < coinCount; i++) {
            const coinLoot: ILootItem = {
                id: `coin-${Date.now()}-${Math.random()}-${i}`,
                type: 'coin',
                value: 1,
                position: [
                    position[0] + (Math.random() - 0.5) * 2,
                    0.5,
                    position[2] + (Math.random() - 0.5) * 2
                ],
            };
            setLootDrops((prev) => [...prev, coinLoot]);
        }
    }, [addXp]);

    return (
        <>
            {enemies
                .filter((e) => e.isAlive)
                .map((enemy) => {
                    const preset = ENEMY_PRESETS[enemy.presetId];
                    if (!preset) return null;

                    return (
                        <EnemyWithLabel
                            key={enemy.id}
                            id={enemy.id}
                            preset={preset}
                            position={enemy.position}
                            onDeath={handleEnemyDeath}
                        />
                    );
                })}

            {lootDrops.map((loot) => (
                <Loot key={loot.id} loot={loot} />
            ))}
        </>
    );
};

export default WorldEnemies;
