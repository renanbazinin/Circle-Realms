// ============================================
// Level Manager - Unified Concentric Ring World
// With Distance-Based Rendering for Performance
// ============================================

import { Suspense, useMemo } from 'react';
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

// Get lighting and fog based on zone - smooth transitions
const getZoneLighting = (zone: number) => {
    switch (zone) {
        case 0:
            return { ambient: 0.6, ambientColor: '#ffffee', fog: '#87ceeb' };
        case 1:
            // Warm amber/brown tones instead of harsh red
            return { ambient: 0.4, ambientColor: '#ffcc88', fog: '#1a1510' };
        case 2:
            return { ambient: 0.5, ambientColor: '#aaddff', fog: '#0a0a2a' };
        default:
            return { ambient: 0.5, ambientColor: '#ffffff', fog: '#000000' };
    }
};

export const LevelManager: React.FC = () => {
    const currentZone = useGameStore((state) => state.currentZone);
    const lighting = getZoneLighting(currentZone);

    // Memoize static structures for performance
    const zone0Trees = useMemo(() => [
        [-8, 6], [-6, -10], [10, 8], [6, -12], [-12, -4],
        [12, 4], [-10, 12], [4, 12], [-12, 0], [0, -12]
    ], []);

    const zone1Pillars = useMemo(() => [
        [-22, 10], [-18, -18], [18, -15], [15, 20],
        [-25, 0], [25, 0], [0, 25], [0, -25],
        [20, 20], [-20, -20]
    ], []);

    return (
        <Suspense fallback={<ZoneLoadingFallback />}>
            {/* World lighting - blended based on zone */}
            <ambientLight intensity={lighting.ambient} color={lighting.ambientColor} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={currentZone === 0 ? 1.2 : currentZone === 2 ? 1 : 0.8}
                color={currentZone === 0 ? '#ffffff' : currentZone === 2 ? '#aaccff' : '#ffcc99'}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-near={0.5}
                shadow-camera-far={80}
                shadow-camera-left={-55}
                shadow-camera-right={55}
                shadow-camera-top={55}
                shadow-camera-bottom={-55}
            />

            {/* Sky/fog based on current zone */}
            <fog attach="fog" args={[lighting.fog, 40, 100]} />

            {/* Zone atmospheric lights - only render when in that zone */}
            {currentZone === 1 && (
                <>
                    <pointLight position={[-20, 5, -20]} color="#ff9944" intensity={1.5} distance={25} />
                    <pointLight position={[20, 5, 20]} color="#ffaa55" intensity={1.5} distance={25} />
                </>
            )}

            {currentZone === 2 && (
                <>
                    <pointLight position={[-40, 8, 0]} color="#00ffff" intensity={2} distance={30} />
                    <pointLight position={[40, 8, 0]} color="#ff00ff" intensity={2} distance={30} />
                    <pointLight position={[0, 8, -40]} color="#00ff88" intensity={2} distance={30} />
                    <pointLight position={[0, 8, 40]} color="#8800ff" intensity={2} distance={30} />
                </>
            )}

            {/* GROUND COLLISION - Extended for Zone 2 */}
            <RigidBody type="fixed" colliders={false}>
                <CuboidCollider args={[60, 2, 60]} position={[0, -2, 0]} />
            </RigidBody>

            {/* Zone 0 - Inner ring (The Hub) */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[15, 32]} />
                <meshStandardMaterial color="#4ade80" roughness={0.9} metalness={0.1} />
            </mesh>

            {/* Decorative ring between Zone 0 and 1 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[14, 15, 32]} />
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
            </mesh>

            {/* Zone 1 - Outer ring (The Wilds) */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[15, 30, 32]} />
                <meshStandardMaterial color="#4b5563" roughness={0.95} metalness={0.1} />
            </mesh>

            {/* Boundary ring between Zone 1 and 2 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[29, 30, 32]} />
                <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
            </mesh>

            {/* Zone 2 - Outermost ring (The Sky Gardens) */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[30, 55, 32]} />
                <meshStandardMaterial
                    color="#1e1b4b"
                    roughness={0.8}
                    metalness={0.3}
                    emissive="#312e81"
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Outer edge glow for Zone 2 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[53, 55, 32]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
            </mesh>

            {/* Center platform in Zone 0 */}
            <RigidBody type="fixed" colliders="hull">
                <mesh position={[0, 0.2, 0]} receiveShadow>
                    <cylinderGeometry args={[3, 3.5, 0.4, 16]} />
                    <meshStandardMaterial color="#a3e635" />
                </mesh>
            </RigidBody>

            {/* Decorative trees in Zone 0 - only render when nearby */}
            {currentZone <= 1 && zone0Trees.map(([x, z], i) => (
                <group key={`tree-${i}`} position={[x, 0, z]}>
                    <mesh position={[0, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
                        <meshStandardMaterial color="#8b4513" />
                    </mesh>
                    <mesh position={[0, 2.5, 0]} castShadow>
                        <coneGeometry args={[1, 2, 6]} />
                        <meshStandardMaterial color="#228b22" />
                    </mesh>
                    <mesh position={[0, 3.5, 0]} castShadow>
                        <coneGeometry args={[0.7, 1.5, 6]} />
                        <meshStandardMaterial color="#228b22" />
                    </mesh>
                </group>
            ))}

            {/* Stone pillars in Zone 1 - only render when in Zone 1 */}
            {currentZone >= 1 && zone1Pillars.map(([x, z], i) => (
                <group key={`pillar-${i}`} position={[x, 0, z]}>
                    <RigidBody type="fixed" colliders="hull">
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <cylinderGeometry args={[0.8, 1, 3, 6]} />
                            <meshStandardMaterial color="#4d4d4d" roughness={0.9} />
                        </mesh>
                    </RigidBody>
                    {currentZone === 1 && (
                        <pointLight position={[0, 0.5, 0]} color="#ff0000" intensity={0.5} distance={5} />
                    )}
                </group>
            ))}

            {/* ZONE 2 - THE SKY GARDENS (Parkour Zone) */}
            {/* Only render when in Zone 2 for performance */}
            {/* ============================================ */}
            {currentZone === 2 && (
                <>
                    {/* Floating Platform Ring - Inner (radius ~34) - REDUCED */}
                    {Array.from({ length: 5 }).map((_, i) => {
                        const angle = (i / 5) * Math.PI * 2;
                        const x = Math.cos(angle) * 34;
                        const z = Math.sin(angle) * 34;
                        const height = 0.3 + (i % 3) * 0.3;
                        return (
                            <RigidBody key={`platform-inner-${i}`} type="fixed" colliders="cuboid">
                                <mesh position={[x, height, z]} castShadow receiveShadow>
                                    <boxGeometry args={[4, 0.4, 4]} />
                                    <meshStandardMaterial
                                        color="#4f46e5"
                                        emissive="#4f46e5"
                                        emissiveIntensity={0.3}
                                    />
                                </mesh>
                            </RigidBody>
                        );
                    })}

                    {/* Floating Platform Ring - Middle (radius ~42) - REDUCED */}
                    {Array.from({ length: 6 }).map((_, i) => {
                        const angle = (i / 6) * Math.PI * 2 + 0.15;
                        const x = Math.cos(angle) * 42;
                        const z = Math.sin(angle) * 42;
                        const height = 0.5 + (i % 4) * 0.4;
                        return (
                            <RigidBody key={`platform-mid-${i}`} type="fixed" colliders="cuboid">
                                <mesh position={[x, height, z]} castShadow receiveShadow>
                                    <boxGeometry args={[3.5, 0.4, 3.5]} />
                                    <meshStandardMaterial
                                        color="#7c3aed"
                                        emissive="#7c3aed"
                                        emissiveIntensity={0.4}
                                    />
                                </mesh>
                            </RigidBody>
                        );
                    })}

                    {/* Floating Platform Ring - Outer (radius ~50) - REDUCED */}
                    {Array.from({ length: 7 }).map((_, i) => {
                        const angle = (i / 7) * Math.PI * 2 + 0.3;
                        const x = Math.cos(angle) * 50;
                        const z = Math.sin(angle) * 50;
                        const height = 0.8 + (i % 3) * 0.5;
                        return (
                            <RigidBody key={`platform-outer-${i}`} type="fixed" colliders="cuboid">
                                <mesh position={[x, height, z]} castShadow receiveShadow>
                                    <boxGeometry args={[3, 0.4, 3]} />
                                    <meshStandardMaterial
                                        color="#a855f7"
                                        emissive="#a855f7"
                                        emissiveIntensity={0.3}
                                    />
                                </mesh>
                            </RigidBody>
                        );
                    })}

                    {/* Stepping stones REMOVED - turrets now occupy this space */}


                    {/* Crystal Pillar Towers - shorter and easier to climb */}
                    {Array.from({ length: 4 }).map((_, i) => {
                        const angle = (i / 4) * Math.PI * 2 + 0.4;
                        const x = Math.cos(angle) * 44;
                        const z = Math.sin(angle) * 44;
                        return (
                            <group key={`crystal-pillar-${i}`} position={[x, 0, z]}>
                                <RigidBody type="fixed" colliders="hull">
                                    {/* Base platform */}
                                    <mesh position={[0, 0.2, 0]} castShadow>
                                        <cylinderGeometry args={[2, 2.2, 0.4, 8]} />
                                        <meshStandardMaterial color="#06b6d4" />
                                    </mesh>
                                    {/* Middle step */}
                                    <mesh position={[0, 1.2, 0]} castShadow>
                                        <cylinderGeometry args={[1.5, 1.8, 0.4, 8]} />
                                        <meshStandardMaterial color="#0891b2" />
                                    </mesh>
                                    {/* Top platform */}
                                    <mesh position={[0, 2.2, 0]} castShadow>
                                        <cylinderGeometry args={[1.2, 1.5, 0.4, 8]} />
                                        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
                                    </mesh>
                                </RigidBody>
                            </group>
                        );
                    })}

                    {/* Short bridges connecting nearby platforms */}
                    {[
                        { pos: [38, 0.4, 0], rot: 0, len: 6 },
                        { pos: [-38, 0.4, 0], rot: 0, len: 6 },
                        { pos: [0, 0.4, 38], rot: Math.PI / 2, len: 6 },
                        { pos: [0, 0.4, -38], rot: Math.PI / 2, len: 6 },
                    ].map((bridge, i) => (
                        <RigidBody key={`bridge-${i}`} type="fixed" colliders="cuboid">
                            <mesh
                                position={bridge.pos as [number, number, number]}
                                rotation={[0, bridge.rot, 0]}
                                castShadow
                            >
                                <boxGeometry args={[bridge.len, 0.3, 2.5]} />
                                <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.2} />
                            </mesh>
                        </RigidBody>
                    ))}

                    {/* Giant floating crystals (decoration) */}
                    {[
                        { pos: [40, 6, 40], size: 1.5, color: '#00ffff' },
                        { pos: [-40, 7, 40], size: 1.8, color: '#ff00ff' },
                        { pos: [40, 5, -40], size: 1.4, color: '#00ff88' },
                        { pos: [-40, 8, -40], size: 2, color: '#8844ff' },
                    ].map((crystal, i) => (
                        <group key={`giant-crystal-${i}`} position={crystal.pos as [number, number, number]}>
                            <mesh rotation={[0.3, 0, 0.2]}>
                                <octahedronGeometry args={[crystal.size]} />
                                <meshStandardMaterial
                                    color={crystal.color}
                                    emissive={crystal.color}
                                    emissiveIntensity={0.6}
                                    transparent
                                    opacity={0.7}
                                />
                            </mesh>
                        </group>
                    ))}
                </>
            )}

            {/* Player */}
            <Player color="#3b82f6" />

            {/* Weapon system */}
            <WeaponController />

            {/* NPCs (in Zone 0) */}
            <WorldNPCs />

            {/* Enemies (Zones 0 and 1 only - no enemies in Zone 2) */}
            <WorldEnemies />
        </Suspense>
    );
};

export default LevelManager;
