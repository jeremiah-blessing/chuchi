import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OrbitControls,
  Environment,
  Grid,
  Sphere,
  Sparkles,
  Text,
  RoundedBox,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight as PointLightType,
  Vector3,
} from 'three';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ICommand } from '../types';
import { useTheme } from '../theme';

gsap.registerPlugin(MotionPathPlugin);

// ─── Theme color palettes for 3D scene ──────────────────────────────

const sceneThemes = {
  dark: {
    background: '#1a1d2e',
    ground: '#151826',
    gridCell: '#2a2e3d',
    gridSection: '#3a3f52',
    labelColor: '#4a5568',
    sparkleColor: '#4a5568',
    sparkleOpacity: 0.15,
    ambientIntensity: 0.3,
    directionalIntensity: 1,
    envIntensity: 0.4,
    dustColor: '#c8b8a8',
    overlayBg: 'bg-gray-900/75 border-white/10',
    overlayCounter: 'text-gray-400',
    overlayCode: 'text-white',
  },
  light: {
    background: '#f0f4f8',
    ground: '#e8ecf1',
    gridCell: '#8b95a3',
    gridSection: '#5a6577',
    labelColor: '#6b7a8d',
    sparkleColor: '#94a3b8',
    sparkleOpacity: 0.1,
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    envIntensity: 0.5,
    dustColor: '#c8b8a8',
    overlayBg: 'bg-white/85 border-gray-200',
    overlayCounter: 'text-gray-500',
    overlayCode: 'text-gray-800',
  },
} as const;

const formatCommand = (command: ICommand): string => {
  switch (command.type) {
    case 'start':
      return `begin(${command.x}, ${command.y})`;
    case 'walk':
      return `move(${command.x}, ${command.y}, walk)`;
    case 'jump':
      return `move(${command.x}, ${command.y}, jump)`;
    case 'turn':
      return `turn(${command.direction})`;
    case 'wait':
      return `wait(${command.duration})`;
    case 'color':
      return `color(${command.value})`;
  }
};

// ─── Dust puff particle system ───────────────────────────────────────

interface Puff {
  position: Vector3;
  time: number;
  particles: { offset: Vector3; speed: number }[];
}

const PUFF_LIFETIME = 0.6;
const PUFF_COUNT = 10;

const DustPuffs = ({
  puffsRef,
}: {
  puffsRef: React.MutableRefObject<Puff[]>;
}) => {
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const maxPuffs = 8;
  const maxParticles = maxPuffs * PUFF_COUNT;

  useFrame((_, delta) => {
    let idx = 0;
    for (let i = puffsRef.current.length - 1; i >= 0; i--) {
      const puff = puffsRef.current[i];
      puff.time += delta;
      if (puff.time > PUFF_LIFETIME) {
        puffsRef.current.splice(i, 1);
        continue;
      }
      const progress = puff.time / PUFF_LIFETIME;
      const opacity = 1 - progress;
      const scale = 0.03 + progress * 0.06;

      for (const particle of puff.particles) {
        if (idx >= maxParticles) break;
        const mesh = meshRefs.current[idx];
        if (mesh) {
          mesh.position.set(
            puff.position.x + particle.offset.x * progress * particle.speed,
            puff.position.y +
              progress * 0.3 +
              particle.offset.y * progress * 0.5,
            puff.position.z + particle.offset.z * progress * particle.speed
          );
          mesh.scale.setScalar(scale);
          (mesh.material as MeshStandardMaterial).opacity = opacity * 0.6;
          mesh.visible = true;
        }
        idx++;
      }
    }
    for (let i = idx; i < maxParticles; i++) {
      const mesh = meshRefs.current[i];
      if (mesh) mesh.visible = false;
    }
  });

  return (
    <>
      {Array.from({ length: maxParticles }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color="#c8b8a8"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
};

const spawnPuff = (
  puffsRef: React.MutableRefObject<Puff[]>,
  position: Vector3
) => {
  const particles = Array.from({ length: PUFF_COUNT }, () => ({
    offset: new Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 2
    ),
    speed: 0.5 + Math.random() * 1,
  }));
  puffsRef.current.push({
    position: position.clone(),
    time: 0,
    particles,
  });
  if (puffsRef.current.length > 8) puffsRef.current.shift();
};

// ─── Grid coordinate labels ─────────────────────────────────────────

const GRID_SIZE = 23;

const GridLabels = ({ labelColor }: { labelColor: string }) => {
  const labels: React.ReactNode[] = [];

  // Corner origin label (0)
  labels.push(
    <Text
      key="origin"
      position={[-0.35, -0.49, -0.35]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.25}
      color={labelColor}
      anchorX="right"
      anchorY="top"
    >
      0
    </Text>
  );

  for (let i = 1; i < GRID_SIZE; i++) {
    // Labels along the X axis (bottom edge)
    labels.push(
      <Text
        key={`x-${i}`}
        position={[i, -0.49, -0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color={labelColor}
        anchorX="center"
        anchorY="top"
      >
        {String(i)}
      </Text>
    );

    // Labels along the Z axis (left edge)
    labels.push(
      <Text
        key={`z-${i}`}
        position={[-0.35, -0.49, i]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color={labelColor}
        anchorX="right"
        anchorY="middle"
      >
        {String(i)}
      </Text>
    );
  }

  return <>{labels}</>;
};

// ─── Camera tracker ──────────────────────────────────────────────────

const CameraTracker = ({
  characterRef,
  controlsRef,
}: {
  characterRef: React.RefObject<Group>;
  controlsRef: React.RefObject<any>;
}) => {
  const targetPos = useRef(new Vector3());

  useFrame(() => {
    if (!characterRef.current || !controlsRef.current) return;

    const charPos = characterRef.current.position;
    targetPos.current.lerp(new Vector3(charPos.x, 0, charPos.z), 0.04);

    controlsRef.current.target.copy(targetPos.current);
    controlsRef.current.update();
  });

  return null;
};

// ─── Player ──────────────────────────────────────────────────────────

export const Player = ({
  commands,
  timelineRef,
  onComplete,
}: {
  commands: ICommand[];
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
}) => {
  const theme = useTheme();
  const t = sceneThemes[theme];
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  const handleCommandIndex = useCallback((index: number) => {
    setActiveCommandIndex(index);
  }, []);

  const activeCommand = commands[activeCommandIndex];

  return (
    <div className="w-full h-full relative">
      {/* Command overlay */}
      {activeCommand && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`px-3 py-1.5 rounded-lg backdrop-blur-sm border shadow-lg ${t.overlayBg}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-medium uppercase tracking-wider font-mono ${t.overlayCounter}`}
              >
                {activeCommandIndex + 1}/{commands.length}
              </span>
              <code className={`text-sm font-mono ${t.overlayCode}`}>
                {formatCommand(activeCommand)}
              </code>
            </div>
          </div>
        </div>
      )}

      <Canvas
        shadows
        orthographic
        camera={{ position: [20, 20, 20], zoom: 45 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={[t.background]} />

        {/* Lighting */}
        <ambientLight intensity={t.ambientIntensity} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={t.directionalIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={60}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.001}
        />

        {/* Ground plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.51, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color={t.ground} />
        </mesh>

        {/* Grid */}
        <Grid
          position={[0, -0.5, 0]}
          args={[50, 50]}
          cellSize={1}
          cellThickness={1}
          cellColor={t.gridCell}
          sectionSize={5}
          sectionThickness={1.8}
          sectionColor={t.gridSection}
          fadeDistance={35}
          fadeStrength={1.2}
          infiniteGrid={false}
        />

        {/* Grid coordinate numbers */}
        <GridLabels labelColor={t.labelColor} />

        {/* Ambient floating particles */}
        <Sparkles
          count={40}
          scale={30}
          size={1.2}
          speed={0.2}
          opacity={t.sparkleOpacity}
          color={t.sparkleColor}
        />

        <Scene
          commands={commands}
          timelineRef={timelineRef}
          onComplete={onComplete}
          onCommandIndex={handleCommandIndex}
        />

        <Environment
          background={false}
          environmentIntensity={t.envIntensity}
          environmentRotation={[0, Math.PI / 2, 0]}
          preset="city"
        />
      </Canvas>
    </div>
  );
};

// ─── Scene (groups character + camera + dust inside Canvas) ──────────

const Scene = ({
  commands,
  timelineRef,
  onComplete,
  onCommandIndex,
}: {
  commands: ICommand[];
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  onCommandIndex: (index: number) => void;
}) => {
  const characterRef = useRef<Group>(null!);
  const controlsRef = useRef<any>(null!);
  const puffsRef = useRef<Puff[]>([]);

  return (
    <>
      <Character
        commands={commands}
        key={JSON.stringify(commands)}
        timelineRef={timelineRef}
        onComplete={onComplete}
        onCommandIndex={onCommandIndex}
        groupRef={characterRef}
        puffsRef={puffsRef}
      />
      <DustPuffs puffsRef={puffsRef} />
      <OrbitControls
        ref={controlsRef}
        zoomSpeed={0.25}
        minZoom={30}
        maxZoom={160}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
      />
      <CameraTracker characterRef={characterRef} controlsRef={controlsRef} />
    </>
  );
};

// ─── Character ───────────────────────────────────────────────────────

const Character = ({
  commands,
  timelineRef,
  onComplete,
  onCommandIndex,
  groupRef,
  puffsRef,
}: {
  commands: ICommand[];
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  onCommandIndex: (index: number) => void;
  groupRef: React.RefObject<Group>;
  puffsRef: React.MutableRefObject<Puff[]>;
}) => {
  const bodyRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLightType>(null!);
  const isAnimating = useRef(true);

  // Idle breathing animation
  useFrame(({ clock }) => {
    if (!groupRef.current || isAnimating.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.04;
    const s = 1 + Math.sin(t * 2.2) * 0.015;
    groupRef.current.scale.set(s, s, s);
  });

  useEffect(() => {
    isAnimating.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false;
        onComplete();
      },
    });
    timelineRef.current = tl;

    const directionToRotation: Record<string, number> = {
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: -Math.PI / 2,
    };

    commands.forEach((command: ICommand, index: number) => {
      tl.addLabel(`cmd-${index}`);
      tl.call(() => onCommandIndex(index));

      if (command.type === 'start') {
        tl.from(groupRef.current!.position, {
          x: command.x,
          y: 0,
          z: command.y,
          duration: 0,
        });
      }

      if (command.type === 'jump') {
        const jumpDuration = 1.2;
        // Anticipation squash
        tl.to(groupRef.current!.scale, {
          x: 1.15,
          y: 0.75,
          z: 1.15,
          duration: 0.15,
          ease: 'power2.in',
        });
        // Launch stretch + XZ + arc
        tl.to(groupRef.current!.scale, {
          x: 0.85,
          y: 1.2,
          z: 0.85,
          duration: 0.15,
          ease: 'power2.out',
        });
        // Dust on takeoff
        tl.call(() => spawnPuff(puffsRef, groupRef.current!.position));
        tl.to(
          groupRef.current!.position,
          {
            x: command.x,
            z: command.y,
            duration: jumpDuration,
            ease: 'power2.inOut',
          },
          '<'
        );
        tl.to(
          groupRef.current!.position,
          {
            y: 2,
            duration: jumpDuration / 2,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          },
          '<'
        );
        // Midair normalize
        tl.to(
          groupRef.current!.scale,
          {
            x: 1,
            y: 1,
            z: 1,
            duration: jumpDuration * 0.4,
            ease: 'power1.out',
          },
          '<'
        );
        // Landing squash + dust
        tl.call(() => spawnPuff(puffsRef, groupRef.current!.position));
        tl.to(groupRef.current!.scale, {
          x: 1.2,
          y: 0.7,
          z: 1.2,
          duration: 0.1,
          ease: 'power2.in',
        });
        // Recover
        tl.to(groupRef.current!.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.25,
          ease: 'elastic.out(1, 0.4)',
        });
      }

      if (command.type === 'walk') {
        const walkDuration = 1.5;
        const steps = 8;
        const stepDur = walkDuration / steps;

        // Smooth XZ movement
        tl.to(groupRef.current!.position, {
          x: command.x,
          z: command.y,
          duration: walkDuration,
          ease: 'power1.inOut',
        });
        // Bob up and down
        tl.to(
          groupRef.current!.position,
          {
            y: 0.12,
            duration: stepDur / 2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: steps * 2 - 1,
          },
          '<'
        );
        // Side-to-side waddle
        tl.to(
          groupRef.current!.rotation,
          {
            z: 0.06,
            duration: stepDur,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: steps - 1,
          },
          '<'
        );
        // Dust puffs during walk (every few steps)
        for (let s = 0; s < steps; s += 2) {
          tl.call(
            () => spawnPuff(puffsRef, groupRef.current!.position),
            [],
            `<+=${s * stepDur}`
          );
        }
        // Settle tilt
        tl.to(groupRef.current!.rotation, {
          z: 0,
          duration: 0.15,
          ease: 'power2.out',
        });
      }

      if (command.type === 'turn') {
        tl.to(groupRef.current!.rotation, {
          y: directionToRotation[command.direction] ?? 0,
          duration: 0.5,
          ease: 'power2.inOut',
        });
      }

      if (command.type === 'wait') {
        tl.to({}, { duration: command.duration });
      }

      if (command.type === 'color') {
        const targetColor = new Color(command.value);
        // Animate body color
        tl.to((bodyRef.current.material as MeshStandardMaterial).color, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration: 0.5,
          ease: 'power2.inOut',
        });
        // Animate point light color
        tl.to(
          lightRef.current.color,
          {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration: 0.5,
            ease: 'power2.inOut',
          },
          '<'
        );
      }
    });

    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [commands, timelineRef, onComplete, onCommandIndex, groupRef, puffsRef]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Glow light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 0]}
        color="#ff8c00"
        intensity={1.5}
        distance={5}
        decay={2}
      />

      {/* Main chassis — flat rounded slab */}
      <RoundedBox
        ref={bodyRef}
        args={[0.85, 0.3, 0.85]}
        position={[0, 0.15, 0]}
        radius={0.06}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#ff8c00" />
      </RoundedBox>

      {/* Top panel — slightly inset darker plate */}
      <RoundedBox
        args={[0.7, 0.04, 0.7]}
        position={[0, 0.32, 0]}
        radius={0.02}
        smoothness={4}
      >
        <meshStandardMaterial color="#e07000" />
      </RoundedBox>

      {/* Center dome / sensor housing */}
      <Sphere args={[0.15, 16, 16]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </Sphere>

      {/* Indicator light on dome */}
      <Sphere args={[0.05, 8, 8]} position={[0, 0.54, 0]}>
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.5}
        />
      </Sphere>

      {/* Front face panel */}
      <RoundedBox
        args={[0.4, 0.12, 0.02]}
        position={[0, 0.15, 0.44]}
        radius={0.02}
        smoothness={4}
      >
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.3} />
      </RoundedBox>

      {/* Front left eye/sensor */}
      <Sphere args={[0.04, 8, 8]} position={[-0.1, 0.15, 0.45]}>
        <meshStandardMaterial
          color="#66ccff"
          emissive="#66ccff"
          emissiveIntensity={1}
        />
      </Sphere>

      {/* Front right eye/sensor */}
      <Sphere args={[0.04, 8, 8]} position={[0.1, 0.15, 0.45]}>
        <meshStandardMaterial
          color="#66ccff"
          emissive="#66ccff"
          emissiveIntensity={1}
        />
      </Sphere>

      {/* Bottom undercarriage */}
      <RoundedBox
        args={[0.75, 0.06, 0.75]}
        position={[0, -0.02, 0]}
        radius={0.02}
        smoothness={4}
      >
        <meshStandardMaterial color="#222222" />
      </RoundedBox>

      {/* Wheels — 4 small cylinders */}
      {[
        [-0.32, -0.03, 0.32],
        [0.32, -0.03, 0.32],
        [-0.32, -0.03, -0.32],
        [0.32, -0.03, -0.32],
      ].map(([wx, wy, wz], i) => (
        <mesh key={i} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};
