// ============================================
// Zone 0: The Hub - Peaceful Starting Area
// ============================================

import { RigidBody } from '@react-three/rapier';
import { Player } from '../../components/canvas/Player';
import { WeaponController } from '../../components/canvas/Weapon';
import { Portal } from '../../components/canvas/Portal';
import { NPCs } from './NPCs';
import { Enemies } from './Enemies';

const Zone0: React.FC = () => {
    return (
        <>
            {/* Ambient lighting for peaceful atmosphere */}
            <ambientLight intensity={0.6} color="#ffffee" />
            <directionalLight
                position={[10, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
            />

            {/* Sky/fog color */}
            <fog attach="fog" args={['#87ceeb', 30, 100]} />

            {/* Ground - Circular grassy island */}
            <RigidBody type="fixed" colliders="hull">
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <circleGeometry args={[25, 64]} />
                    <meshStandardMaterial
                        color="#4ade80"
                        roughness={0.9}
                        metalness={0.1}
                    />
                </mesh>
            </RigidBody>

            {/* Decorative inner circles */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[15, 16, 64]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[8, 9, 64]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>

            {/* Center platform */}
            <RigidBody type="fixed" colliders="hull">
                <mesh position={[0, 0.2, 0]} receiveShadow>
                    <cylinderGeometry args={[3, 3.5, 0.4, 32]} />
                    <meshStandardMaterial color="#a3e635" />
                </mesh>
            </RigidBody>

            {/* Player */}
            <Player color="#3b82f6" />

            {/* Weapon system */}
            <WeaponController />

            {/* NPCs */}
            <NPCs />

            {/* Practice enemies */}
            <Enemies />

            {/* Portal to Zone 1 */}
            <Portal
                position={[18, 0, 0]}
                targetZone={1}
                color="#8b5cf6"
                label="Enter The Wilds"
            />

            {/* Decorative trees (simple cylinders/cones) */}
            {[
                [-10, 8], [-8, -12], [12, 10], [8, -15], [-15, -5],
                [15, 5], [-12, 15], [5, 18], [-18, 0], [0, -18]
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    {/* Trunk */}
                    <mesh position={[0, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
                        <meshStandardMaterial color="#8b4513" />
                    </mesh>
                    {/* Foliage */}
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
        </>
    );
};

export default Zone0;
