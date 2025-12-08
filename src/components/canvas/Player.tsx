// ============================================
// Player Component with Physics and Controls
// ============================================

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';
import { playSFX } from '../../utils/sounds';

// Input state tracking
const keys: Record<string, boolean> = {};

// Setup keyboard listeners
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

interface PlayerProps {
    color?: string;
    size?: number;
}

export const Player: React.FC<PlayerProps> = ({
    color = '#4ade80',
    size = 0.5
}) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const { camera } = useThree();

    const isPaused = useGameStore((state) => state.isPaused);
    const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
    const setCurrentZone = useGameStore((state) => state.setCurrentZone);

    const moveSpeed = 8;
    const jumpForce = 6;
    const canJump = useRef(true);

    // Camera-relative directions (calculated once based on isometric view)
    // Camera is at +X, +Y, +Z looking at origin, so:
    // "Forward" (W) should move toward -X and -Z (away from camera)
    // "Right" (D) should move toward +X and -Z (perpendicular)
    const forwardDir = new Vector3(-1, 0, -1).normalize();
    const rightDir = new Vector3(1, 0, -1).normalize();

    // Zone boundaries (concentric rings)
    const ZONE_BOUNDARIES = [
        { zone: 0, innerRadius: 0, outerRadius: 15 },   // Zone 0: The Hub
        { zone: 1, innerRadius: 15, outerRadius: 30 },  // Zone 1: The Wilds
        { zone: 2, innerRadius: 30, outerRadius: 55 },  // Zone 2: The Sky Gardens
    ];

    // Update player position in store and camera follow
    useFrame(() => {
        if (!rigidBodyRef.current || isPaused) return;

        const position = rigidBodyRef.current.translation();

        // Update store position (for UI display)
        setPlayerPosition([position.x, position.y, position.z]);

        // Camera follow - fixed isometric-style view
        camera.position.set(
            position.x + 10,
            position.y + 12,
            position.z + 10
        );
        camera.lookAt(position.x, position.y, position.z);

        // Check which zone player is in based on distance from center
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        for (const boundary of ZONE_BOUNDARIES) {
            if (distanceFromCenter >= boundary.innerRadius && distanceFromCenter < boundary.outerRadius) {
                const currentZone = useGameStore.getState().currentZone;
                if (currentZone !== boundary.zone) {
                    setCurrentZone(boundary.zone as 0 | 1 | 2);
                }
                break;
            }
        }

        // Camera-relative movement input
        const moveDir = new Vector3(0, 0, 0);

        if (keys['KeyW'] || keys['ArrowUp']) {
            moveDir.add(forwardDir);
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            moveDir.sub(forwardDir);
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveDir.sub(rightDir);
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            moveDir.add(rightDir);
        }

        // Normalize and apply movement
        if (moveDir.length() > 0) {
            moveDir.normalize();

            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: moveDir.x * moveSpeed,
                y: currentVel.y,
                z: moveDir.z * moveSpeed,
            }, true);
        } else {
            // Apply friction when not moving
            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: currentVel.x * 0.9,
                y: currentVel.y,
                z: currentVel.z * 0.9,
            }, true);
        }

        // Jump
        if ((keys['Space']) && canJump.current) {
            playSFX('jump');
            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: currentVel.x,
                y: jumpForce,
                z: currentVel.z,
            }, true);
            canJump.current = false;
        }

        // Reset jump when grounded (simple check)
        if (position.y < 1.1 && rigidBodyRef.current.linvel().y <= 0) {
            canJump.current = true;
        }
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            type="dynamic"
            position={[0, 2, 0]}
            colliders="ball"
            mass={1}
            linearDamping={0.5}
            angularDamping={0.5}
            lockRotations
            userData={{ type: 'player' }}
        >
            {/* Player body - Sphere */}
            <mesh castShadow>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.2}
                    roughness={0.3}
                    metalness={0.5}
                />
            </mesh>

            {/* Inner glow effect */}
            <mesh>
                <sphereGeometry args={[size * 0.9, 16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </RigidBody>
    );
};

export default Player;
