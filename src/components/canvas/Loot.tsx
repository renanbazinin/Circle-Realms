// ============================================
// Loot Drop Component
// ============================================

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Mesh } from 'three';
import { useGameStore } from '../../store/gameStore';
import type { ILootItem, IWeapon } from '../../types';
import { playSFX } from '../../utils/sounds';

interface LootProps {
    loot: ILootItem;
}

export const Loot: React.FC<LootProps> = ({ loot }) => {
    const meshRef = useRef<Mesh>(null);
    const [collected, setCollected] = useState(false);

    const healPlayer = useGameStore((state) => state.healPlayer);
    const addXp = useGameStore((state) => state.addXp);
    const addCoins = useGameStore((state) => state.addCoins);
    const addWeapon = useGameStore((state) => state.addWeapon);
    const removeLoot = useGameStore((state) => state.removeLoot);

    // Get loot appearance based on type
    const getLootAppearance = () => {
        switch (loot.type) {
            case 'health':
                return { color: '#22c55e', shape: 'box' as const };
            case 'xp':
                return { color: '#eab308', shape: 'diamond' as const };
            case 'weapon':
                return { color: '#3b82f6', shape: 'star' as const };
            case 'coin':
                return { color: '#fcd34d', shape: 'coin' as const };
            default:
                return { color: '#ffffff', shape: 'box' as const };
        }
    };

    const appearance = getLootAppearance();

    // Floating animation
    useFrame((state) => {
        if (meshRef.current && !collected) {
            meshRef.current.position.y =
                loot.position[1] + 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            meshRef.current.rotation.y += 0.02;
        }
    });

    const handleCollect = () => {
        if (collected) return;
        setCollected(true);

        console.log(`[Loot] Collected ${loot.type}: ${loot.value}`);

        switch (loot.type) {
            case 'health':
                healPlayer(loot.value as number);
                playSFX('pickup');
                break;
            case 'xp':
                addXp(loot.value as number);
                playSFX('pickup');
                break;
            case 'weapon':
                addWeapon(loot.value as IWeapon);
                playSFX('pickup');
                break;
            case 'coin':
                addCoins(loot.value as number);
                playSFX('coin');
                break;
        }

        removeLoot(loot.id);
    };

    if (collected) return null;

    return (
        <group position={loot.position}>
            {/* Loot visual */}
            <mesh ref={meshRef}>
                {appearance.shape === 'box' && (
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                )}
                {appearance.shape === 'diamond' && (
                    <octahedronGeometry args={[0.3]} />
                )}
                {appearance.shape === 'star' && (
                    <dodecahedronGeometry args={[0.35]} />
                )}
                {appearance.shape === 'coin' && (
                    <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
                )}
                <meshStandardMaterial
                    color={appearance.color}
                    emissive={appearance.color}
                    emissiveIntensity={0.5}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Glow light */}
            <pointLight
                color={appearance.color}
                intensity={1}
                distance={4}
            />

            {/* Collection trigger */}
            <RigidBody type="fixed" sensor onIntersectionEnter={handleCollect}>
                <CuboidCollider args={[0.5, 1, 0.5]} />
            </RigidBody>
        </group>
    );
};

export default Loot;
