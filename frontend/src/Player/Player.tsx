import {
  OrbitControls,
  Instances,
  Instance,
  Environment,
  RoundedBox,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Mesh } from 'three';

export const Player = ({ commands }: { commands: any[] }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        orthographic
        camera={{ position: [20, 20, 20], zoom: 40 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#ffffff']} />
        <BoxPerson commands={commands} key={JSON.stringify(commands)} />
        <Grid />
        <OrbitControls
          zoomSpeed={0.25}
          minZoom={40}
          maxZoom={140}
          enablePan={false}
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 3}
        />
        <Environment
          background={false}
          backgroundBlurriness={0}
          backgroundIntensity={1}
          backgroundRotation={[0, Math.PI / 2, 0]}
          environmentIntensity={1}
          environmentRotation={[0, Math.PI / 2, 0]}
          preset="city"
        />
      </Canvas>
    </div>
  );
};

const Grid = ({ number = 23, lineWidth = 0.026, height = 0.5 }) => (
  <Instances position={[0.5, -0.5, 0.5]}>
    <planeGeometry args={[lineWidth, height]} />
    <meshBasicMaterial color="#999" />
    {Array.from({ length: number }, (_, y) =>
      Array.from({ length: number }, (_, x) => (
        <group
          key={x + ':' + y}
          position={[
            x * 2 - Math.floor(number / 2) * 2 - 0.5,
            -0.01,
            y * 2 - Math.floor(number / 2) * 2 - 0.5,
          ]}
        >
          <Instance rotation={[-Math.PI / 2, 0, 0]} />
          <Instance rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
        </group>
      ))
    )}
    <gridHelper args={[100, 100, '#bbb', '#bbb']} position={[0, -0.01, 0]} />
  </Instances>
);

const BoxPerson = ({ commands }: { commands: any[] }) => {
  const meshRef = useRef<Mesh>(null!);

  useEffect(() => {
    const sleep = () => new Promise((resolve) => setTimeout(resolve, 1000));

    const doAnimation = async () => {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        await sleep();
        meshRef.current.position.x = command.x;
        meshRef.current.position.z = command.y;
      }
    };

    doAnimation();
  }, [commands]);

  return (
    <RoundedBox
      args={[1, 1, 1]}
      position={[0, 0, 0]}
      radius={0.15}
      smoothness={10}
      bevelSegments={10}
      creaseAngle={0.5}
      receiveShadow
      ref={meshRef}
    >
      <meshStandardMaterial color="#ce2e6c" />
    </RoundedBox>
  );
};
