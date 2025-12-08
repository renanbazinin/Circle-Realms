// ============================================
// Portal Component - Zone Transition Trigger
// ============================================

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Mesh } from 'three';
import { useGameStore } from '../../store/gameStore';
import type { ZoneId } from '../../types';

interface PortalProps {
    position: [number, number, number];
    targetZone: ZoneId;
    color?: string;
    label?: string;
}

export const Portal: React.FC<PortalProps> = ({
    position,
    targetZone,
    color = '#8b5cf6',
    label = 'Portal',
}) => {
    const ringRef = useRef<Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);

    const setCurrentZone = useGameStore((state) => state.setCurrentZone);

    // Animate the portal ring
    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
            ringRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
        }
    });

    const handleCollision = () => {
        setCurrentZone(targetZone);
    };

    return (
        <group position={position}>
            {/* Portal base glow */}
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Rotating ring */}
            <mesh ref={ringRef} position={[0, 1.5, 0]}>
                <torusGeometry args={[1.5, 0.1, 16, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Inner portal effect */}
            <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
                <circleGeometry args={[1.3, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.5}
                />
            </mesh>

            {/* Portal light */}
            <pointLight
                color={color}
                intensity={2}
                distance={8}
                position={[0, 2, 0]}
            />

            {/* Collision trigger - invisible sensor */}
            <RigidBody
                type="fixed"
                sensor
                onIntersectionEnter={handleCollision}
            >
                <CuboidCollider args={[1.5, 2, 1.5]} position={[0, 1.5, 0]} />
            </RigidBody>

            {/* Label */}
            <mesh position={[0, 3.5, 0]}>
                {/* We'd use Text from drei here, but keeping it simple */}
            </mesh>
        </group>
    );
};

export default Portal;
