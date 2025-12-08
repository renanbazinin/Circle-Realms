// ============================================
// Main App Component - Game Root
// ============================================

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useEffect } from 'react';

import { useGameStore, useGameScreen, useDialog } from './store/gameStore';
import { LevelManager } from './components/LevelManager';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { Settings } from './components/ui/Settings';
import { PauseMenu } from './components/ui/PauseMenu';
import { GameOver } from './components/ui/GameOver';
import { DialogBox } from './components/ui/DialogBox';
import { ShopUI } from './components/ui/ShopUI';

import './index.css';

// Loading component for canvas
const CanvasLoader = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#6366f1" wireframe />
  </mesh>
);

function App() {
  const gameScreen = useGameScreen();
  const dialog = useDialog();
  const isShopOpen = useGameStore((state) => state.isShopOpen);
  const closeShop = useGameStore((state) => state.closeShop);

  // Global keyboard handler for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close shop on escape
      if (e.code === 'Escape' && isShopOpen) {
        closeShop();
        return;
      }
      // Regular pause toggle
      if (e.code === 'Escape' && gameScreen === 'playing' && !dialog.isOpen && !isShopOpen) {
        useGameStore.getState().togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameScreen, dialog.isOpen, isShopOpen, closeShop]);

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <div className="game-canvas">
        <Canvas
          shadows
          camera={{
            position: [10, 12, 10],
            fov: 50,
            near: 0.1,
            far: 200,
          }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <Physics gravity={[0, -20, 0]}>
              {(gameScreen === 'playing' || gameScreen === 'paused') && (
                <LevelManager />
              )}
            </Physics>
          </Suspense>

          {/* Default lighting for menu screens */}
          {gameScreen !== 'playing' && gameScreen !== 'paused' && (
            <>
              <ambientLight intensity={0.3} />
              <directionalLight position={[5, 10, 5]} intensity={0.5} />
              <mesh>
                <sphereGeometry args={[50, 32, 32]} />
                <meshStandardMaterial
                  color="#1a1a2e"
                  side={1}
                  metalness={0.5}
                  roughness={0.8}
                />
              </mesh>
            </>
          )}
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      {gameScreen === 'menu' && <MainMenu />}
      {gameScreen === 'settings' && <Settings />}
      {gameScreen === 'playing' && <HUD />}
      {gameScreen === 'playing' && dialog.isOpen && <DialogBox />}
      {gameScreen === 'playing' && isShopOpen && <ShopUI onClose={closeShop} />}
      {gameScreen === 'paused' && <PauseMenu />}
      {gameScreen === 'gameOver' && <GameOver />}
    </div>
  );
}

export default App;
