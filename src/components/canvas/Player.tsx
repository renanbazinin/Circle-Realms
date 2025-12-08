// ============================================
// Player Component with Physics and Controls
// ============================================

import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';
import { playSFX } from '../../utils/sounds';
import { touchInput } from '../ui/MobileControls';

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

    // Aim angle for gun indicator (in world space)
    const [aimAngle, setAimAngle] = useState(0);
    const [isAiming, setIsAiming] = useState(false);

    const isPaused = useGameStore((state) => state.isPaused);
    const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
    const setCurrentZone = useGameStore((state) => state.setCurrentZone);
    const getEquippedWeapon = useGameStore((state) => state.getEquippedWeapon);

    const moveSpeed = 8;
    const jumpForce = 6;
    const canJump = useRef(true);

    // Camera-relative directions
    const forwardDir = new Vector3(-1, 0, -1).normalize();
    const rightDir = new Vector3(1, 0, -1).normalize();

    // Zone boundaries
    const ZONE_BOUNDARIES = [
        { zone: 0, innerRadius: 0, outerRadius: 15 },
        { zone: 1, innerRadius: 15, outerRadius: 30 },
        { zone: 2, innerRadius: 30, outerRadius: 55 },
    ];

    // Get weapon color for glow effect
    const equippedWeapon = getEquippedWeapon();
    const weaponColor = equippedWeapon?.color || '#66ff66';

    useFrame(() => {
        if (!rigidBodyRef.current || isPaused) return;

        const position = rigidBodyRef.current.translation();

        setPlayerPosition([position.x, position.y, position.z]);

        // Camera follow
        camera.position.set(position.x + 10, position.y + 12, position.z + 10);
        camera.lookAt(position.x, position.y, position.z);

        // Zone check
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        for (const boundary of ZONE_BOUNDARIES) {
            if (distanceFromCenter >= boundary.innerRadius && distanceFromCenter < boundary.outerRadius) {
                const currentZone = useGameStore.getState().currentZone;
                if (currentZone !== boundary.zone) {
                    playSFX('zonechange');
                    setCurrentZone(boundary.zone as 0 | 1 | 2);
                }
                break;
            }
        }

        // Movement - combine keyboard and touch input
        const moveDir = new Vector3(0, 0, 0);

        // Keyboard input
        if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forwardDir);
        if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forwardDir);
        if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(rightDir);
        if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(rightDir);

        // Touch joystick input (adds to movement direction)
        if (Math.abs(touchInput.moveX) > 0.1 || Math.abs(touchInput.moveY) > 0.1) {
            // Forward/backward from joystick Y
            moveDir.add(forwardDir.clone().multiplyScalar(touchInput.moveY));
            // Left/right from joystick X
            moveDir.add(rightDir.clone().multiplyScalar(touchInput.moveX));
        }

        if (moveDir.length() > 0) {
            moveDir.normalize();
            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: moveDir.x * moveSpeed,
                y: currentVel.y,
                z: moveDir.z * moveSpeed,
            }, true);
        } else {
            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: currentVel.x * 0.9,
                y: currentVel.y,
                z: currentVel.z * 0.9,
            }, true);
        }

        // Jump - keyboard or touch
        if ((keys['Space'] || touchInput.jump) && canJump.current) {
            playSFX('jump');
            const currentVel = rigidBodyRef.current.linvel();
            rigidBodyRef.current.setLinvel({
                x: currentVel.x,
                y: jumpForce,
                z: currentVel.z,
            }, true);
            canJump.current = false;
        }

        // Reset jump when grounded
        if (position.y < 1.1 && rigidBodyRef.current.linvel().y <= 0) {
            canJump.current = true;
        }

        // Update aim angle from touch input or mouse
        if (touchInput.shoot && (Math.abs(touchInput.aimX) > 0.1 || Math.abs(touchInput.aimY) > 0.1)) {
            // Convert 2D aim to world angle
            const aimDir = new Vector3()
                .addScaledVector(rightDir, touchInput.aimX)
                .addScaledVector(forwardDir, touchInput.aimY);
            const angle = Math.atan2(aimDir.x, aimDir.z);
            setAimAngle(angle);
            setIsAiming(true);
        } else {
            setIsAiming(false);
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
            {/* Player body */}
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

            {/* Inner glow */}
            <mesh>
                <sphereGeometry args={[size * 0.9, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            {/* Weapon glow ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[size * 1.1, size * 1.3, 16]} />
                <meshBasicMaterial color={weaponColor} transparent opacity={0.6} />
            </mesh>

            {/* Gun/Weapon indicator stick */}
            <group rotation={[0, aimAngle, 0]}>
                {/* Gun barrel */}
                <mesh position={[0, 0.1, -size * 1.5]} castShadow>
                    <boxGeometry args={[0.12, 0.12, size * 1.8]} />
                    <meshStandardMaterial
                        color={isAiming ? weaponColor : '#666666'}
                        emissive={isAiming ? weaponColor : '#333333'}
                        emissiveIntensity={isAiming ? 0.5 : 0.1}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
                {/* Muzzle glow when aiming */}
                {isAiming && (
                    <mesh position={[0, 0.1, -size * 2.3]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshBasicMaterial color={weaponColor} transparent opacity={0.8} />
                    </mesh>
                )}
                {/* Gun handle */}
                <mesh position={[0, -0.1, -size * 0.8]}>
                    <boxGeometry args={[0.1, 0.25, 0.15]} />
                    <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>

            {/* Weapon light */}
            <pointLight color={weaponColor} intensity={1.5} distance={3} position={[0, 0.3, 0]} />
        </RigidBody>
    );
};

export default Player;
