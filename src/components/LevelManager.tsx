// ============================================
// Level Manager - Unified Concentric Ring World
// ============================================

import { Suspense } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import { Player } from './canvas/Player';
import { WeaponController } from './canvas/Weapon';
import { WorldNPCs } from './world/NPCs';
import { WorldEnemies } from './world/Enemies';

// Loading fallback for zone transitions
const ZoneLoadingFallback = () => (
    <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
);

export const LevelManager: React.FC = () => {
    const currentZone = useGameStore((state) => state.currentZone);

    return (
        <Suspense fallback={<ZoneLoadingFallback />}>
            {/* World lighting - blended based on zone */}
            <ambientLight
                intensity={currentZone === 0 ? 0.6 : 0.3}
                color={currentZone === 0 ? '#ffffee' : '#ff6666'}
            />
            <directionalLight
                position={[10, 20, 10]}
                intensity={currentZone === 0 ? 1.2 : 0.8}
                color={currentZone === 0 ? '#ffffff' : '#ff9999'}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={60}
                shadow-camera-left={-35}
                shadow-camera-right={35}
                shadow-camera-top={35}
                shadow-camera-bottom={-35}
            />

            {/* Sky/fog based on current zone */}
            <fog
                attach="fog"
                args={[currentZone === 0 ? '#87ceeb' : '#1a0a0a', 30, 80]}
            />

            {/* Zone atmospheric lights for Zone 1 */}
            {currentZone === 1 && (
                <>
                    <pointLight position={[-20, 5, -20]} color="#ff4444" intensity={2} distance={25} />
                    <pointLight position={[20, 5, 20]} color="#ff6666" intensity={2} distance={25} />
                </>
            )}

            {/* GROUND COLLISION - Thick solid box, top surface at Y=0 */}
            <RigidBody type="fixed" colliders={false}>
                <CuboidCollider args={[40, 2, 40]} position={[0, -2, 0]} />
            </RigidBody>

            {/* Zone 0 - Inner ring (The Hub) - VISUAL ONLY */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[15, 64]} />
                <meshStandardMaterial
                    color="#4ade80"
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Decorative ring between zones */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[14, 15, 64]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Zone 1 - Outer ring (The Wilds) - VISUAL ONLY */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[15, 30, 64]} />
                <meshStandardMaterial
                    color="#4b5563"
                    roughness={0.95}
                    metalness={0.1}
                />
            </mesh>

            {/* Outer boundary ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[29, 30, 64]} />
                <meshStandardMaterial
                    color="#4a0000"
                    emissive="#4a0000"
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Center platform in Zone 0 */}
            <RigidBody type="fixed" colliders="hull">
                <mesh position={[0, 0.2, 0]} receiveShadow>
                    <cylinderGeometry args={[3, 3.5, 0.4, 32]} />
                    <meshStandardMaterial color="#a3e635" />
                </mesh>
            </RigidBody>

            {/* Decorative trees in Zone 0 */}
            {[
                [-8, 6], [-6, -10], [10, 8], [6, -12], [-12, -4],
                [12, 4], [-10, 12], [4, 12], [-12, 0], [0, -12]
            ].map(([x, z], i) => (
                <group key={`tree-${i}`} position={[x, 0, z]}>
                    <mesh position={[0, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
                        <meshStandardMaterial color="#8b4513" />
                    </mesh>
                    <mesh position={[0, 2.5, 0]} castShadow>
                        <coneGeometry args={[1, 2, 8]} />
                        <meshStandardMaterial color="#228b22" />
                    </mesh>
                    <mesh position={[0, 3.5, 0]} castShadow>
                        <coneGeometry args={[0.7, 1.5, 8]} />
                        <meshStandardMaterial color="#228b22" />
                    </mesh>
                </group>
            ))}

            {/* Stone pillars in Zone 1 */}
            {[
                [-22, 10], [-18, -18], [18, -15], [15, 20],
                [-25, 0], [25, 0], [0, 25], [0, -25],
                [20, 20], [-20, -20]
            ].map(([x, z], i) => (
                <group key={`pillar-${i}`} position={[x, 0, z]}>
                    <RigidBody type="fixed" colliders="hull">
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <cylinderGeometry args={[0.8, 1, 3, 6]} />
                            <meshStandardMaterial color="#4d4d4d" roughness={0.9} />
                        </mesh>
                    </RigidBody>
                    <pointLight position={[0, 0.5, 0]} color="#ff0000" intensity={0.5} distance={5} />
                </group>
            ))}

            {/* Player */}
            <Player color="#3b82f6" />

            {/* Weapon system */}
            <WeaponController />

            {/* NPCs (in Zone 0) */}
            <WorldNPCs />

            {/* Enemies (throughout both zones) */}
            <WorldEnemies />
        </Suspense>
    );
};

export default LevelManager;
