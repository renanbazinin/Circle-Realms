// ============================================
// Weapon Controller Component
// ============================================

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Plane, Vector2 } from 'three';
import { RapierRigidBody, useRapier } from '@react-three/rapier';
import { useGameStore } from '../../store/gameStore';
import type { IWeapon } from '../../types';
import { touchInput } from '../ui/MobileControls';

interface ProjectileData {
    id: string;
    position: Vector3;
    direction: Vector3;
    weapon: IWeapon;
    distanceTraveled: number;
    rigidBody: RapierRigidBody | null;
}

export const WeaponController: React.FC = () => {
    const { camera, gl } = useThree();
    const { world } = useRapier();

    const player = useGameStore((state) => state.player);
    const getEquippedWeapon = useGameStore((state) => state.getEquippedWeapon);
    const isPaused = useGameStore((state) => state.isPaused);

    const projectiles = useRef<ProjectileData[]>([]);
    const lastFireTime = useRef(0);
    const mousePosition = useRef(new Vector3());
    const raycaster = useRef(new Raycaster());
    const groundPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));

    // Track mouse position
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const rect = gl.domElement.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(new Vector2(x, y), camera);
            const target = new Vector3();
            raycaster.current.ray.intersectPlane(groundPlane.current, target);
            mousePosition.current.copy(target);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [camera, gl]);

    // Handle shooting
    useEffect(() => {
        const handleClick = () => {
            if (isPaused) return;

            const weapon = getEquippedWeapon();
            if (!weapon) return;

            const now = Date.now();
            const fireInterval = 1000 / weapon.fireRate;

            if (now - lastFireTime.current < fireInterval) return;
            lastFireTime.current = now;

            // Calculate direction from player to mouse
            const playerPos = new Vector3(...player.position);
            const direction = mousePosition.current.clone().sub(playerPos).normalize();
            direction.y = 0; // Keep projectiles horizontal

            // Update touchInput.aimAngle for gun indicator (PC support)
            touchInput.aimAngle = Math.atan2(direction.x, direction.z);
            touchInput.aimX = direction.x;
            touchInput.aimY = direction.z;

            // Create projectile
            const projectile: ProjectileData = {
                id: `proj-${Date.now()}-${Math.random()}`,
                position: playerPos.clone().add(new Vector3(0, 0.5, 0)),
                direction: direction,
                weapon: weapon,
                distanceTraveled: 0,
                rigidBody: null,
            };

            projectiles.current.push(projectile);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isPaused, player.position, getEquippedWeapon]);

    // Update projectiles and handle touch fire
    useFrame((_, delta) => {
        if (isPaused) return;

        // Handle touch fire (mobile) - uses aim joystick direction
        if (touchInput.shoot) {
            const weapon = getEquippedWeapon();
            if (weapon) {
                const now = Date.now();
                const fireInterval = 1000 / weapon.fireRate;

                if (now - lastFireTime.current >= fireInterval) {
                    lastFireTime.current = now;

                    const playerPos = new Vector3(...player.position);

                    // Convert 2D joystick input to 3D world direction (isometric)
                    // aimX: positive = right on screen, aimY: positive = up on screen
                    // In isometric view: right = (+x, -z), up = (-x, -z)
                    const forwardDir = new Vector3(-1, 0, -1).normalize();
                    const rightDir = new Vector3(1, 0, -1).normalize();

                    const direction = new Vector3()
                        .addScaledVector(rightDir, touchInput.aimX)
                        .addScaledVector(forwardDir, touchInput.aimY)
                        .normalize();

                    const projectile: ProjectileData = {
                        id: `proj-${Date.now()}-${Math.random()}`,
                        position: playerPos.clone().add(new Vector3(0, 0.5, 0)),
                        direction: direction,
                        weapon: weapon,
                        distanceTraveled: 0,
                        rigidBody: null,
                    };

                    projectiles.current.push(projectile);
                }
            }
        }

        projectiles.current = projectiles.current.filter((proj) => {
            // Move projectile
            const moveDistance = proj.weapon.projectileSpeed * delta;
            proj.position.add(proj.direction.clone().multiplyScalar(moveDistance));
            proj.distanceTraveled += moveDistance;

            // Check range
            if (proj.distanceTraveled >= proj.weapon.range) {
                return false; // Remove projectile
            }

            // Manual collision check with enemies via Rapier
            world.bodies.forEach((body) => {
                const userData = body.userData as any;
                if (userData?.type === 'enemy' && userData?.takeDamage) {
                    const bodyPos = body.translation();
                    const distance = proj.position.distanceTo(
                        new Vector3(bodyPos.x, bodyPos.y, bodyPos.z)
                    );

                    if (distance < 1) {
                        // Hit enemy
                        userData.takeDamage(proj.weapon.damage);
                        proj.distanceTraveled = proj.weapon.range; // Mark for removal
                    }
                }
            });

            return proj.distanceTraveled < proj.weapon.range;
        });
    });

    return (
        <>
            {/* Render active projectiles */}
            {projectiles.current.map((proj) => (
                <mesh key={proj.id} position={proj.position.toArray()}>
                    <sphereGeometry args={[proj.weapon.projectileSize, 8, 8]} />
                    <meshBasicMaterial
                        color={proj.weapon.color}
                        transparent
                        opacity={0.9}
                    />
                    {/* Glow effect */}
                    <pointLight
                        color={proj.weapon.color}
                        intensity={0.5}
                        distance={3}
                    />
                </mesh>
            ))}
        </>
    );
};

export default WeaponController;
