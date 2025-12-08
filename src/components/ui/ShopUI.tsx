// ============================================
// Shop UI Component - Merchant Weapon Store
// ============================================

import { useState } from 'react';
import { useGameStore, usePlayer, useInventory } from '../../store/gameStore';
import type { IWeapon } from '../../types';

// Weapons available for purchase
const SHOP_WEAPONS: { weapon: IWeapon; price: number }[] = [
    {
        weapon: {
            id: 'blue-blaster',
            name: 'Blue Blaster',
            damage: 18,
            fireRate: 3,
            range: 16,
            color: '#3b82f6',
            projectileSpeed: 22,
            projectileSize: 0.2,
        },
        price: 15,
    },
    {
        weapon: {
            id: 'purple-plasma',
            name: 'Purple Plasma',
            damage: 25,
            fireRate: 2,
            range: 20,
            color: '#a855f7',
            projectileSpeed: 25,
            projectileSize: 0.3,
        },
        price: 30,
    },
    {
        weapon: {
            id: 'golden-cannon',
            name: 'Golden Cannon',
            damage: 40,
            fireRate: 1.5,
            range: 25,
            color: '#fbbf24',
            projectileSpeed: 30,
            projectileSize: 0.4,
        },
        price: 50,
    },
    {
        weapon: {
            id: 'crimson-devastator',
            name: 'Crimson Devastator',
            damage: 60,
            fireRate: 1,
            range: 30,
            color: '#dc2626',
            projectileSpeed: 35,
            projectileSize: 0.5,
        },
        price: 100,
    },
];

interface ShopUIProps {
    onClose: () => void;
}

export const ShopUI: React.FC<ShopUIProps> = ({ onClose }) => {
    const player = usePlayer();
    const inventory = useInventory();
    const addWeapon = useGameStore((state) => state.addWeapon);
    const spendCoins = useGameStore((state) => state.spendCoins);
    const equipWeapon = useGameStore((state) => state.equipWeapon);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const handleBuy = (item: typeof SHOP_WEAPONS[0]) => {
        // Check if already owned
        const alreadyOwned = inventory.weapons.some((w) => w.id === item.weapon.id);
        if (alreadyOwned) {
            setMessage(`You already own ${item.weapon.name}!`);
            setMessageType('error');
            return;
        }

        // Check if can afford
        if (player.coins < item.price) {
            setMessage(`Not enough coins! Need ${item.price - player.coins} more.`);
            setMessageType('error');
            return;
        }

        // Purchase
        if (spendCoins(item.price)) {
            addWeapon(item.weapon);
            equipWeapon(item.weapon.id);
            setMessage(`Purchased ${item.weapon.name}!`);
            setMessageType('success');
            console.log(`[Shop] Bought ${item.weapon.name} for ${item.price} coins`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900/95 border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">🏪 The Merchant's Shop</h2>
                    <div className="text-lg font-bold text-amber-400">
                        {player.coins} 🪙
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-center ${messageType === 'success'
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : 'bg-red-900/50 text-red-300 border border-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Weapons list */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {SHOP_WEAPONS.map((item) => {
                        const owned = inventory.weapons.some((w) => w.id === item.weapon.id);
                        const canAfford = player.coins >= item.price;

                        return (
                            <div
                                key={item.weapon.id}
                                className={`p-4 rounded-xl border transition-all ${owned
                                        ? 'bg-gray-800/50 border-gray-600 opacity-60'
                                        : canAfford
                                            ? 'bg-gray-800 border-amber-500/50 hover:border-amber-400'
                                            : 'bg-gray-800/30 border-gray-700 opacity-70'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full shadow-lg"
                                            style={{
                                                backgroundColor: item.weapon.color,
                                                boxShadow: `0 0 10px ${item.weapon.color}50`
                                            }}
                                        />
                                        <div>
                                            <div className="font-bold text-white">{item.weapon.name}</div>
                                            <div className="text-xs text-gray-400">
                                                DMG: {item.weapon.damage} | Rate: {item.weapon.fireRate}/s | Range: {item.weapon.range}
                                            </div>
                                        </div>
                                    </div>

                                    {owned ? (
                                        <span className="px-3 py-1 bg-green-900/50 text-green-400 text-sm rounded-lg">
                                            Owned ✓
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={!canAfford}
                                            className={`px-4 py-2 rounded-lg font-bold transition-all ${canAfford
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {item.price} 🪙
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                >
                    Close Shop
                </button>
            </div>
        </div>
    );
};

export default ShopUI;
