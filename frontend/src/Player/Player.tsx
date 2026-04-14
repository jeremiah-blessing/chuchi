import { useEffect, useRef, useState } from 'react';
import {
  Environment,
  OrbitControls,
  RoundedBox,
  Sphere,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Group } from 'three';
import { Scene, WarehouseCommand } from '../types';
import { Warehouse } from './Warehouse';
import { simulate } from './simulation';
import { buildRobotTimeline } from './robotAnimation';

const formatCommand = (cmd: WarehouseCommand): string => {
  switch (cmd.type) {
    case 'goTo':
      return cmd.target.kind === 'coord'
        ? `goTo(${cmd.target.x}, ${cmd.target.y})`
        : `goTo(${cmd.target.name})`;
    case 'turn':
      return `turn(${cmd.direction})`;
    case 'pickup':
      return `pickup(${cmd.name})`;
    case 'drop':
      return 'drop()';
    case 'load':
      return `load(${cmd.name})`;
    case 'unload':
      return `unload(${cmd.name})`;
    case 'scan':
      return `scan(${cmd.name})`;
    case 'charge':
      return 'charge()';
  }
};

export const Player = ({
  scene,
  timelineRef,
  onComplete,
}: {
  scene: Scene | null;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
}) => {
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  if (!scene) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Edit a program to see the warehouse.
      </div>
    );
  }

  const activeCommand = scene.commands[activeCommandIndex];

  return (
    <div className="w-full h-full relative">
      {activeCommand && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-gray-900/75 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider font-mono text-gray-400">
                {activeCommandIndex + 1}/{scene.commands.length}
              </span>
              <code className="text-sm font-mono text-white">
                {formatCommand(activeCommand)}
              </code>
            </div>
          </div>
        </div>
      )}

      {runtimeError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-red-900/80 border border-red-500/40">
            <code className="text-sm font-mono text-red-100">
              {runtimeError}
            </code>
          </div>
        </div>
      )}

      <Canvas
        shadows
        orthographic
        camera={{
          position: [
            scene.warehouse.width + 5,
            Math.max(scene.warehouse.width, scene.warehouse.height),
            scene.warehouse.height + 5,
          ],
          zoom: 40,
        }}
      >
        <color attach="background" args={['#1a1d2e']} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Warehouse scene={scene} />

        <RobotActor
          scene={scene}
          timelineRef={timelineRef}
          onComplete={onComplete}
          onCommandIndex={setActiveCommandIndex}
          onRuntimeError={setRuntimeError}
        />

        <OrbitControls
          enablePan={false}
          minZoom={20}
          maxZoom={120}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 3}
        />
        <Environment
          preset="city"
          background={false}
          environmentIntensity={0.4}
        />
      </Canvas>
    </div>
  );
};

const RobotActor = ({
  scene,
  timelineRef,
  onComplete,
  onCommandIndex,
  onRuntimeError,
}: {
  scene: Scene;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  onCommandIndex: (index: number) => void;
  onRuntimeError: (msg: string | null) => void;
}) => {
  const groupRef = useRef<Group>(null!);

  useEffect(() => {
    const simulation = simulate(scene);
    onRuntimeError(simulation.error ? simulation.error.message : null);

    const tl = buildRobotTimeline({
      scene,
      simulation,
      robotRef: groupRef,
      onCommandIndex,
      onComplete,
    });
    timelineRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [scene, timelineRef, onComplete, onCommandIndex, onRuntimeError]);

  return (
    <group ref={groupRef}>
      <RoundedBox
        args={[0.7, 0.25, 0.7]}
        position={[0, 0.2, 0]}
        radius={0.05}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial color="#ff8c00" />
      </RoundedBox>
      <Sphere args={[0.12, 16, 16]} position={[0, 0.42, 0]}>
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </Sphere>
      <Sphere args={[0.04, 12, 12]} position={[0, 0.2, 0.35]}>
        <meshStandardMaterial
          color="#66ccff"
          emissive="#66ccff"
          emissiveIntensity={1}
        />
      </Sphere>
    </group>
  );
};
