// ============================================
// World NPCs - Friendly Characters with Labels
// ============================================

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

interface NPCData {
    id: string;
    name: string;
    color: string;
    position: [number, number, number];
    dialogLines: string[];
    isMerchant?: boolean;
}

const npcs: NPCData[] = [
    {
        id: 'guide-npc',
        name: 'The Guide',
        color: '#facc15',
        position: [-5, 0.8, 5],
        dialogLines: [
            "Welcome to The Circle Realms, traveler!",
            "Use WASD to move - W goes forward from your view.",
            "Click to shoot your weapon at enemies.",
            "The outer ring is The Wilds - it's dangerous there!",
            "Kill enemies to collect coins and buy better weapons!",
            "Good luck out there!"
        ],
    },
    {
        id: 'merchant-npc',
        name: 'The Merchant',
        color: '#f97316',
        position: [5, 0.8, -5],
        dialogLines: [],
        isMerchant: true,
    },
];

interface NPCProps {
    npc: NPCData;
}

const NPC: React.FC<NPCProps> = ({ npc }) => {
    const meshRef = useRef<Mesh>(null);
    const [isNear, setIsNear] = useState(false);

    const openDialog = useGameStore((state) => state.openDialog);
    const openShop = useGameStore((state) => state.openShop);
    const dialogIsOpen = useGameStore((state) => state.dialog.isOpen);
    const isShopOpen = useGameStore((state) => state.isShopOpen);

    // Gentle bobbing animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y =
                npc.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    // Check collision userData to verify it's the player
    const handleProximityEnter = (event: any) => {
        // Check if the colliding object is the player (not an enemy)
        const otherBody = event.rigidBody;
        if (otherBody?.userData?.type === 'player') {
            setIsNear(true);
        }
    };

    const handleProximityExit = (event: any) => {
        const otherBody = event.rigidBody;
        if (otherBody?.userData?.type === 'player') {
            setIsNear(false);
        }
    };

    const handleInteract = (event: any) => {
        // Only trigger for player, not enemies
        const otherBody = event.rigidBody;
        if (otherBody?.userData?.type === 'player' && !dialogIsOpen && !isShopOpen) {
            if (npc.isMerchant) {
                console.log('[NPC] Opening merchant shop');
                openShop();
            } else {
                openDialog(npc.name, npc.dialogLines);
            }
        }
    };

    return (
        <group position={[npc.position[0], 0, npc.position[2]]}>
            {/* NPC Body */}
            <mesh ref={meshRef} position={[0, npc.position[1], 0]} castShadow>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial
                    color={npc.color}
                    emissive={npc.color}
                    emissiveIntensity={0.3}
                    roughness={0.3}
                    metalness={0.5}
                />
            </mesh>

            {/* Floating name label */}
            <Text
                position={[0, npc.position[1] + 1.2, 0]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {npc.name}
            </Text>

            {/* Merchant indicator */}
            {npc.isMerchant && (
                <Text
                    position={[0, npc.position[1] + 1.5, 0]}
                    fontSize={0.2}
                    color="#fbbf24"
                    anchorX="center"
                    anchorY="middle"
                >
                    🏪 Shop
                </Text>
            )}

            {/* Friendly glow */}
            <pointLight
                color={npc.color}
                intensity={1}
                distance={5}
                position={[0, npc.position[1], 0]}
            />

            {/* Interaction indicator when near */}
            {isNear && (
                <Text
                    position={[0, npc.position[1] + 1.8, 0]}
                    fontSize={0.2}
                    color="#22c55e"
                    anchorX="center"
                    anchorY="middle"
                >
                    {npc.isMerchant ? '[Walk closer to shop]' : '[Walk closer to talk]'}
                </Text>
            )}

            {/* Collision sensor for proximity detection - checks for player only */}
            <RigidBody
                type="fixed"
                sensor
                onIntersectionEnter={handleProximityEnter}
                onIntersectionExit={handleProximityExit}
            >
                <CuboidCollider
                    args={[2, 2, 2]}
                    position={[0, 1, 0]}
                    sensor
                />
            </RigidBody>

            {/* Smaller collision for actual interaction trigger - checks for player only */}
            <RigidBody
                type="fixed"
                sensor
                onIntersectionEnter={handleInteract}
            >
                <CuboidCollider
                    args={[1, 1, 1]}
                    position={[0, 0.8, 0]}
                    sensor
                />
            </RigidBody>
        </group>
    );
};

export const WorldNPCs: React.FC = () => {
    return (
        <>
            {npcs.map((npc) => (
                <NPC key={npc.id} npc={npc} />
            ))}
        </>
    );
};

export default WorldNPCs;
