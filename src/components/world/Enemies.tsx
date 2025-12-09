// ============================================
// World Enemies - All zones with Labels
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, BallCollider, CuboidCollider } from '@react-three/rapier';
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

// Turret projectile interface
interface TurretProjectile {
    id: string;
    position: Vector3;
    direction: Vector3;
    damage: number;
    speed: number;
}

// Spawn enemies HIGH above ground - let gravity bring them down
const getEnemyY = (presetId: string): number => {
    // Spawn at Y=3 for all enemies - they will drop onto ground
    // Turrets spawn slightly lower since they're stationary
    if (presetId === 'turret') return 1;
    console.log(`[Enemy] getEnemyY for ${presetId}: spawning at Y=3`);
    return 3;
};

// Initial enemy placements - Zone 0 has practice enemies, Zone 1 has hostile enemies, Zone 2 has turrets
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

    // Zone 2 - Turret area (sky gardens)
    { id: 'turret-1', presetId: 'turret', position: [38, getEnemyY('turret'), 0], zone: 2, isAlive: true },
    { id: 'turret-2', presetId: 'turret', position: [-38, getEnemyY('turret'), 0], zone: 2, isAlive: true },
    { id: 'turret-3', presetId: 'turret', position: [0, getEnemyY('turret'), 38], zone: 2, isAlive: true },
    { id: 'turret-4', presetId: 'turret', position: [0, getEnemyY('turret'), -38], zone: 2, isAlive: true },
    { id: 'turret-5', presetId: 'turret', position: [35, getEnemyY('turret'), 35], zone: 2, isAlive: true },
    { id: 'turret-6', presetId: 'turret', position: [-35, getEnemyY('turret'), -35], zone: 2, isAlive: true },
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
    onTurretShoot?: (projectile: TurretProjectile) => void;
}

const EnemyWithLabel: React.FC<EnemyWithLabelProps> = ({ id, preset, position, onDeath, onTurretShoot }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [health, setHealth] = useState(preset.maxHealth);
    const [isAlive, setIsAlive] = useState(true);
    const [isDying, setIsDying] = useState(false);
    const [deathScale, setDeathScale] = useState(1);
    const [turretRotation, setTurretRotation] = useState(0);

    const player = useGameStore((state) => state.player);
    const isPaused = useGameStore((state) => state.isPaused);
    const damagePlayer = useGameStore((state) => state.damagePlayer);

    const lastAttackTime = useRef(0);
    const lastTurretFireTime = useRef(0);

    // Log spawn
    useEffect(() => {
        console.log(`[Enemy] Spawned: ${preset.name} (${id}) at position [${position.join(', ')}]`);
    }, []);

    // AI behavior - with zone restriction
    useFrame((_, delta) => {
        if (!rigidBodyRef.current || !isAlive || isPaused) return;
        if (preset.behavior === 'training') return;

        const enemyPos = rigidBodyRef.current.translation();
        const playerPos = new Vector3(...player.position);
        const enemyVec = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z);

        // Check if enemy fell off the world
        if (enemyPos.y < -5) {
            console.log(`[Enemy] ${preset.name} (${id}) fell off world at Y=${enemyPos.y}, respawning...`);
            rigidBodyRef.current.setTranslation({ x: position[0], y: position[1] + 2, z: position[2] }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        const distance = enemyVec.distanceTo(playerPos);

        // Turret behavior - stationary, shoots when player in range
        if (preset.behavior === 'turret') {
            const detectionRadius = preset.detectionRadius || 12;
            const fireRate = preset.fireRate || 0.5;
            const fireInterval = 1000 / fireRate; // ms between shots

            // Calculate direction to player and rotation angle
            const direction = playerPos.clone().sub(enemyVec).normalize();
            const targetAngle = Math.atan2(direction.x, direction.z);
            setTurretRotation(targetAngle);

            if (distance < detectionRadius && onTurretShoot) {
                const now = Date.now();
                if (now - lastTurretFireTime.current > fireInterval) {
                    // Create projectile
                    const projectile: TurretProjectile = {
                        id: `turret-proj-${id}-${now}`,
                        position: new Vector3(enemyPos.x, enemyPos.y + 0.5, enemyPos.z),
                        direction: direction,
                        damage: preset.damage,
                        speed: 8, // Slow projectile speed
                    };

                    onTurretShoot(projectile);
                    lastTurretFireTime.current = now;
                }
            }
            // Turrets don't move
            return;
        }

        // Zone boundary check - keep enemies in their zones
        const getZoneBounds = (zone: number) => {
            if (zone === 0) return { min: 0, max: 14 };
            if (zone === 1) return { min: 16, max: 29 };
            if (zone === 2) return { min: 31, max: 53 };
            return { min: 0, max: 100 };
        };
        const zoneBounds = getZoneBounds(position[2] < 15 && position[0] < 15 ? 0 : 1);

        if (preset.behavior === 'hostile' && distance < 15 && distance > 1.5) {
            // Calculate direction to player
            const direction = playerPos.clone().sub(enemyVec).normalize();

            // Check if moving would take us outside our zone (use actual delta)
            const nextPos = new Vector3(
                enemyPos.x + direction.x * preset.speed * delta,
                0,
                enemyPos.z + direction.z * preset.speed * delta
            );
            const nextDistFromCenter = Math.sqrt(nextPos.x * nextPos.x + nextPos.z * nextPos.z);

            // Only move if staying in zone
            if (nextDistFromCenter >= zoneBounds.min && nextDistFromCenter <= zoneBounds.max) {
                // Apply velocity directly - let physics handle the rest
                rigidBodyRef.current.setLinvel({
                    x: direction.x * preset.speed,
                    y: rigidBodyRef.current.linvel().y,
                    z: direction.z * preset.speed,
                }, true);
            } else {
                // At zone boundary - try to move along the boundary instead of stopping completely
                const tangent = new Vector3(-enemyPos.z, 0, enemyPos.x).normalize();
                const dot = direction.dot(tangent);
                if (Math.abs(dot) > 0.1) {
                    // Slide along the boundary
                    rigidBodyRef.current.setLinvel({
                        x: tangent.x * dot * preset.speed * 0.5,
                        y: rigidBodyRef.current.linvel().y,
                        z: tangent.z * dot * preset.speed * 0.5,
                    }, true);
                } else {
                    // Smoothly decelerate instead of abrupt stop
                    const vel = rigidBodyRef.current.linvel();
                    rigidBodyRef.current.setLinvel({
                        x: vel.x * 0.9,
                        y: vel.y,
                        z: vel.z * 0.9,
                    }, true);
                }
            }
        } else if (distance <= 1.5 && preset.behavior === 'hostile') {
            const now = Date.now();
            if (now - lastAttackTime.current > 1000) {
                damagePlayer(preset.damage);
                lastAttackTime.current = now;
            }
            // Smooth stop when attacking
            const vel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: vel.x * 0.8,
                y: vel.y,
                z: vel.z * 0.8,
            }, true);
        }
    });

    const takeDamage = useCallback((amount: number) => {
        if (!isAlive || isDying) return;
        console.log(`[Enemy] ${preset.name} (${id}) took ${amount} damage`);
        setHealth((prev) => {
            const newHealth = Math.max(0, prev - amount);
            console.log(`[Enemy] ${preset.name} (${id}) health: ${newHealth}/${preset.maxHealth}`);
            if (newHealth <= 0) {
                console.log(`[Enemy] ${preset.name} (${id}) died!`);
                // Start death animation
                setIsDying(true);
                if (rigidBodyRef.current) {
                    const pos = rigidBodyRef.current.translation();
                    onDeath(id, [pos.x, pos.y, pos.z], preset.lootTable, preset.xpReward);
                }
                // Shrink animation over 500ms
                let scale = 1;
                const shrinkInterval = setInterval(() => {
                    scale -= 0.1;
                    setDeathScale(Math.max(0, scale));
                    if (scale <= 0) {
                        clearInterval(shrinkInterval);
                        setIsAlive(false);
                    }
                }, 50);
            }
            return newHealth;
        });
    }, [isAlive, isDying, id, onDeath, preset]);

    useEffect(() => {
        if (rigidBodyRef.current) {
            (rigidBodyRef.current as any).userData = { type: 'enemy', id, takeDamage };
        }
    }, [id, takeDamage]);

    if (!isAlive) return null;

    // Death animation uses deathScale directly in render
    const healthPercent = (health / preset.maxHealth) * 100;
    const healthColor = healthPercent > 50 ? '#22c55e' : healthPercent > 25 ? '#eab308' : '#ef4444';
    const isTurret = preset.type === 'turret';

    return (
        <RigidBody
            ref={rigidBodyRef}
            type={isTurret ? "fixed" : "dynamic"}
            position={position}
            colliders={false}
            mass={preset.type === 'big' ? 5 : isTurret ? 10 : 1}
            linearDamping={0.5}
            angularDamping={0.5}
            lockRotations
            userData={{ type: 'enemy', id, takeDamage }}
            ccd={true}
        >
            {/* Collider - box for turrets, ball for others */}
            {isTurret ? (
                <CuboidCollider args={[preset.size, preset.size, preset.size]} restitution={0.1} friction={1} />
            ) : (
                <BallCollider args={[preset.size]} restitution={0.2} friction={1} />
            )}

            {/* Enemy body - wrapped in group for turret rotation */}
            <group rotation={[0, isTurret ? turretRotation : 0, 0]}>
                <mesh castShadow scale={[deathScale, deathScale, deathScale]}>
                    {isTurret ? (
                        <boxGeometry args={[preset.size * 2, preset.size * 2, preset.size * 2]} />
                    ) : (
                        <sphereGeometry args={[preset.size, 32, 32]} />
                    )}
                    <meshStandardMaterial
                        color={isDying ? '#ff8888' : preset.color}
                        emissive={isDying ? '#ff0000' : preset.color}
                        emissiveIntensity={isDying ? 0.8 : isTurret ? 0.5 : 0.3}
                        roughness={0.4}
                        metalness={isTurret ? 0.6 : 0.3}
                        transparent={isDying}
                        opacity={deathScale}
                    />
                </mesh>

                {/* Turret "eye" indicator - rotates with turret */}
                {isTurret && (
                    <mesh position={[0, 0, preset.size + 0.1]} castShadow>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial
                            color="#ff0000"
                            emissive="#ff0000"
                            emissiveIntensity={1}
                        />
                    </mesh>
                )}
            </group>

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
    const [turretProjectiles, setTurretProjectiles] = useState<TurretProjectile[]>([]);
    const spawnCounter = useRef(0);

    const addXp = useGameStore((state) => state.addXp);
    const isPaused = useGameStore((state) => state.isPaused);
    const player = useGameStore((state) => state.player);
    const damagePlayer = useGameStore((state) => state.damagePlayer);

    // Update turret projectiles
    useFrame((_, delta) => {
        if (isPaused) return;

        setTurretProjectiles((prev) => {
            const playerPos = new Vector3(...player.position);

            return prev
                .map((proj) => {
                    // Move projectile
                    const newPos = proj.position.clone().add(
                        proj.direction.clone().multiplyScalar(proj.speed * delta)
                    );

                    // Check collision with player (radius ~0.5)
                    const distToPlayer = newPos.distanceTo(playerPos);
                    if (distToPlayer < 1) {
                        damagePlayer(proj.damage);
                        return null; // Remove projectile
                    }

                    // Check if projectile traveled too far (max 20 units)
                    const distFromOrigin = proj.position.distanceTo(newPos);
                    if (distFromOrigin > 20) {
                        return null; // Remove projectile
                    }

                    return { ...proj, position: newPos };
                })
                .filter((proj): proj is TurretProjectile => proj !== null);
        });
    });

    // Handler for turret shooting
    const handleTurretShoot = useCallback((projectile: TurretProjectile) => {
        setTurretProjectiles((prev) => [...prev, projectile]);
    }, []);

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
                            onTurretShoot={preset.behavior === 'turret' ? handleTurretShoot : undefined}
                        />
                    );
                })}

            {/* Turret projectiles */}
            {turretProjectiles.map((proj) => (
                <mesh key={proj.id} position={[proj.position.x, proj.position.y, proj.position.z]}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshStandardMaterial
                        color="#ff00ff"
                        emissive="#ff00ff"
                        emissiveIntensity={1}
                    />
                </mesh>
            ))}

            {lootDrops.map((loot) => (
                <Loot key={loot.id} loot={loot} />
            ))}
        </>
    );
};

export default WorldEnemies;

