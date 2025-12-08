// ============================================
// Zone 1: The Wilds - Hostile Territory
// ============================================

import { RigidBody } from '@react-three/rapier';
import { Player } from '../../components/canvas/Player';
import { WeaponController } from '../../components/canvas/Weapon';
import { Portal } from '../../components/canvas/Portal';
import { Enemies } from './Enemies';

const Zone1: React.FC = () => {
    return (
        <>
            {/* Darker, more ominous lighting */}
            <ambientLight intensity={0.3} color="#ff6666" />
            <directionalLight
                position={[10, 15, 5]}
                intensity={0.8}
                color="#ff9999"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
            />

            {/* Red point lights for atmosphere */}
            <pointLight position={[-10, 5, -10]} color="#ff4444" intensity={2} distance={20} />
            <pointLight position={[10, 5, 10]} color="#ff6666" intensity={2} distance={20} />

            {/* Dark foggy atmosphere */}
            <fog attach="fog" args={['#1a0a0a', 20, 60]} />

            {/* Ground - Dark stone circular arena */}
            <RigidBody type="fixed" colliders="hull">
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <circleGeometry args={[30, 64]} />
                    <meshStandardMaterial
                        color="#3d3d3d"
                        roughness={0.95}
                        metalness={0.1}
                    />
                </mesh>
            </RigidBody>

            {/* Decorative stone patterns */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[20, 22, 64]} />
                <meshStandardMaterial color="#4a0000" emissive="#4a0000" emissiveIntensity={0.2} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[10, 11, 64]} />
                <meshStandardMaterial color="#4a0000" emissive="#4a0000" emissiveIntensity={0.2} />
            </mesh>

            {/* Center altar/platform */}
            <RigidBody type="fixed" colliders="hull">
                <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
                    <cylinderGeometry args={[4, 5, 0.6, 8]} />
                    <meshStandardMaterial
                        color="#2d2d2d"
                        roughness={0.8}
                        metalness={0.3}
                    />
                </mesh>
            </RigidBody>

            {/* Glowing runes on altar */}
            <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2, 2.5, 6]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.6} />
            </mesh>

            {/* Player */}
            <Player color="#3b82f6" />

            {/* Weapon system */}
            <WeaponController />

            {/* Hostile Enemies */}
            <Enemies />

            {/* Portal back to Hub */}
            <Portal
                position={[-25, 0, 0]}
                targetZone={0}
                color="#22c55e"
                label="Return to Hub"
            />

            {/* Decorative pillars/rocks */}
            {[
                [-15, 12], [-12, -15], [15, -12], [12, 15],
                [-20, 0], [20, 0], [0, 20], [0, -20]
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    {/* Stone pillar */}
                    <RigidBody type="fixed" colliders="hull">
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <cylinderGeometry args={[0.8, 1, 3, 6]} />
                            <meshStandardMaterial
                                color="#4d4d4d"
                                roughness={0.9}
                            />
                        </mesh>
                    </RigidBody>
                    {/* Red glow at base */}
                    <pointLight
                        position={[0, 0.5, 0]}
                        color="#ff0000"
                        intensity={0.5}
                        distance={5}
                    />
                </group>
            ))}

            {/* Floating embers/particles effect (static for now) */}
            {Array.from({ length: 30 }).map((_, i) => (
                <mesh
                    key={`ember-${i}`}
                    position={[
                        (Math.random() - 0.5) * 50,
                        Math.random() * 10 + 2,
                        (Math.random() - 0.5) * 50,
                    ]}
                >
                    <sphereGeometry args={[0.05, 4, 4]} />
                    <meshBasicMaterial color="#ff4400" transparent opacity={0.8} />
                </mesh>
            ))}
        </>
    );
};

export default Zone1;
