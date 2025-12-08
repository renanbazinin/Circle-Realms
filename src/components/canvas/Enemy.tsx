// ============================================
// Generic Enemy Component
// ============================================

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import type { IEnemy, EnemyBehavior, ILootDrop } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { getWeaponById } from '../../data/weapons';

interface EnemyProps {
    id: string;
    preset: Omit<IEnemy, 'id'>;
    position: [number, number, number];
    onDeath?: (position: [number, number, number], lootTable: ILootDrop[], xpReward: number) => void;
}

export const Enemy: React.FC<EnemyProps> = ({
    id,
    preset,
    position,
    onDeath,
}) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const [health, setHealth] = useState(preset.maxHealth);
    const [isAlive, setIsAlive] = useState(true);

    const player = useGameStore((state) => state.player);
    const isPaused = useGameStore((state) => state.isPaused);
    const damagePlayer = useGameStore((state) => state.damagePlayer);

    const lastAttackTime = useRef(0);
    const attackCooldown = 1000; // ms between attacks

    // AI behavior
    useFrame((state) => {
        if (!rigidBodyRef.current || !isAlive || isPaused) return;
        if (preset.behavior === 'training') return; // Training dummies don't move

        const enemyPos = rigidBodyRef.current.translation();
        const playerPos = new Vector3(...player.position);
        const enemyVec = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z);

        const distance = enemyVec.distanceTo(playerPos);

        if (preset.behavior === 'hostile' && distance < 15 && distance > 1.5) {
            // Chase player
            const direction = playerPos.clone().sub(enemyVec).normalize();

            rigidBodyRef.current.setLinvel({
                x: direction.x * preset.speed,
                y: rigidBodyRef.current.linvel().y,
                z: direction.z * preset.speed,
            }, true);
        } else if (distance <= 1.5 && preset.behavior === 'hostile') {
            // Attack player
            const now = Date.now();
            if (now - lastAttackTime.current > attackCooldown) {
                damagePlayer(preset.damage);
                lastAttackTime.current = now;
            }

            // Stop moving when in attack range
            rigidBodyRef.current.setLinvel({
                x: 0,
                y: rigidBodyRef.current.linvel().y,
                z: 0,
            }, true);
        }
    });

    // Handle taking damage
    const takeDamage = (amount: number) => {
        if (!isAlive) return;

        const newHealth = Math.max(0, health - amount);
        setHealth(newHealth);

        if (newHealth <= 0) {
            die();
        }
    };

    // Handle death
    const die = () => {
        setIsAlive(false);

        if (rigidBodyRef.current) {
            const pos = rigidBodyRef.current.translation();
            onDeath?.([pos.x, pos.y, pos.z], preset.lootTable, preset.xpReward);
        }
    };

    // Expose takeDamage function via userData
    useEffect(() => {
        if (rigidBodyRef.current) {
            (rigidBodyRef.current.userData as any) = {
                type: 'enemy',
                id,
                takeDamage,
            };
        }
    }, [health, isAlive]);

    if (!isAlive) return null;

    // Calculate health bar percentage
    const healthPercent = (health / preset.maxHealth) * 100;
    const healthColor = healthPercent > 50 ? '#22c55e' : healthPercent > 25 ? '#eab308' : '#ef4444';

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="dynamic"
            position={position}
            colliders="ball"
            mass={preset.type === 'big' ? 5 : 1}
            linearDamping={2}
            lockRotations
            userData={{ type: 'enemy', id, takeDamage }}
        >
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

            {/* Health bar background */}
            <mesh position={[0, preset.size + 0.5, 0]}>
                <planeGeometry args={[1.2, 0.15]} />
                <meshBasicMaterial color="#333333" transparent opacity={0.8} />
            </mesh>

            {/* Health bar fill */}
            <mesh position={[(healthPercent - 100) / 200, preset.size + 0.5, 0.01]}>
                <planeGeometry args={[1.2 * (healthPercent / 100), 0.12]} />
                <meshBasicMaterial color={healthColor} />
            </mesh>
        </RigidBody>
    );
};

export default Enemy;
