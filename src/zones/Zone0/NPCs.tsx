// ============================================
// Zone 0 NPCs - Friendly Characters
// ============================================

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Mesh } from 'three';
import { useGameStore } from '../../store/gameStore';

interface NPCData {
    id: string;
    name: string;
    color: string;
    position: [number, number, number];
    dialogLines: string[];
}

const npcs: NPCData[] = [
    {
        id: 'guide-npc',
        name: 'The Guide',
        color: '#facc15',
        position: [-5, 0.8, 5],
        dialogLines: [
            "Welcome to The Circle Realms, traveler!",
            "Use WASD or Arrow Keys to move around.",
            "Click to shoot your weapon at enemies.",
            "There's a portal to the east... but beware, The Wilds are dangerous!",
            "Practice on the Training Dummy to get used to combat.",
            "Good luck out there!"
        ],
    },
    {
        id: 'merchant-npc',
        name: 'The Merchant',
        color: '#f97316',
        position: [5, 0.8, -5],
        dialogLines: [
            "Ah, a customer! ...Well, someday I'll have wares to sell.",
            "For now, you'll have to find weapons from defeated enemies.",
            "Rumor has it the monsters in The Wilds drop rare weapons!",
        ],
    },
];

interface NPCProps {
    npc: NPCData;
}

const NPC: React.FC<NPCProps> = ({ npc }) => {
    const meshRef = useRef<Mesh>(null);
    const [isNear, setIsNear] = useState(false);

    const openDialog = useGameStore((state) => state.openDialog);

    // Gentle bobbing animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y =
                npc.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    const handleInteract = () => {
        openDialog(npc.name, npc.dialogLines);
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

            {/* Friendly glow */}
            <pointLight
                color={npc.color}
                intensity={1}
                distance={5}
                position={[0, npc.position[1], 0]}
            />

            {/* Interaction indicator when near */}
            {isNear && (
                <mesh position={[0, 2.2, 0]}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            )}

            {/* Collision sensor for interaction */}
            <RigidBody
                type="fixed"
                sensor
                onIntersectionEnter={() => setIsNear(true)}
                onIntersectionExit={() => setIsNear(false)}
            >
                <CuboidCollider
                    args={[2, 2, 2]}
                    position={[0, 1, 0]}
                    sensor
                />
            </RigidBody>

            {/* Smaller collision for actual interaction */}
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

export const NPCs: React.FC = () => {
    return (
        <>
            {npcs.map((npc) => (
                <NPC key={npc.id} npc={npc} />
            ))}
        </>
    );
};

export default NPCs;
