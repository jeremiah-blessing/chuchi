import { useEffect, useMemo, useRef, useState } from 'react';
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
import { simulate, SimulationResult } from './simulation';
import { buildRobotTimeline } from './robotAnimation';
import { useTheme } from '../theme';

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
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const simulation = useMemo<SimulationResult | null>(
    () => (scene ? simulate(scene) : null),
    [scene]
  );

  useEffect(() => {
    setRuntimeError(simulation?.error ? simulation.error.message : null);
  }, [simulation]);

  const { carryingName, hiddenPackages, shelfContents } = useMemo(() => {
    const hidden = new Set<string>();
    const contents = new Map<string, string[]>();
    let carrying: string | null = null;
    if (!simulation)
      return {
        carryingName: null,
        hiddenPackages: hidden,
        shelfContents: contents,
      };

    for (const step of simulation.steps) {
      if (step.commandIndex > activeCommandIndex) break;
      const cmd = step.command;
      if (cmd.type === 'pickup') {
        hidden.add(cmd.name);
        carrying = cmd.name;
      } else if (cmd.type === 'drop') {
        carrying = null;
      } else if (cmd.type === 'load' && carrying) {
        const list = contents.get(cmd.name) ?? [];
        list.push(carrying);
        contents.set(cmd.name, list);
        carrying = null;
      } else if (cmd.type === 'unload') {
        const list = contents.get(cmd.name) ?? [];
        const pkg = list.pop();
        if (pkg) {
          contents.set(cmd.name, list);
          carrying = pkg;
        }
      }
    }
    return {
      carryingName: carrying,
      hiddenPackages: hidden,
      shelfContents: contents,
    };
  }, [simulation, activeCommandIndex]);

  if (!scene || !simulation) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        Edit a program to see the warehouse.
      </div>
    );
  }

  const activeCommand = scene.commands[activeCommandIndex];

  return (
    <div className="w-full h-full relative">
      {activeCommand && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
              isDark
                ? 'bg-gray-900/75 border-white/10'
                : 'bg-white/85 border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-medium uppercase tracking-wider font-mono ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {activeCommandIndex + 1}/{scene.commands.length}
              </span>
              <code
                className={`text-sm font-mono ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatCommand(activeCommand)}
              </code>
            </div>
          </div>
        </div>
      )}

      {runtimeError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`px-3 py-1.5 rounded-lg border ${
              isDark
                ? 'bg-red-900/80 border-red-500/40'
                : 'bg-red-100 border-red-400'
            }`}
          >
            <code
              className={`text-sm font-mono ${
                isDark ? 'text-red-100' : 'text-red-800'
              }`}
            >
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
        <color attach="background" args={[isDark ? '#1a1d2e' : '#eef2f7']} />
        <ambientLight intensity={isDark ? 0.35 : 0.7} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={isDark ? 1.1 : 1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Warehouse
          scene={scene}
          hiddenPackages={hiddenPackages}
          shelfContents={shelfContents}
          isDark={isDark}
        />

        <RobotActor
          scene={scene}
          simulation={simulation}
          timelineRef={timelineRef}
          onComplete={onComplete}
          onCommandIndex={setActiveCommandIndex}
          carryingName={carryingName}
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
  simulation,
  timelineRef,
  onComplete,
  onCommandIndex,
  carryingName,
}: {
  scene: Scene;
  simulation: SimulationResult;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  onCommandIndex: (index: number) => void;
  carryingName: string | null;
}) => {
  const groupRef = useRef<Group>(null!);

  useEffect(() => {
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
  }, [scene, simulation, timelineRef, onComplete, onCommandIndex]);

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
      {carryingName && (
        <RoundedBox
          args={[0.4, 0.4, 0.4]}
          position={[0, 0.6, 0]}
          radius={0.03}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#c49a6c" />
        </RoundedBox>
      )}
    </group>
  );
};
