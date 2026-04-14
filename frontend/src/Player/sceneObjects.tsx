import { RoundedBox, Text } from '@react-three/drei';
import { WarehouseObject, ObstacleCell, Waypoint } from '../types';

export const Shelf = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    {[
      [-0.35, 0.25, -0.35],
      [0.35, 0.25, -0.35],
      [-0.35, 0.25, 0.35],
      [0.35, 0.25, 0.35],
    ].map(([x, y, z], i) => (
      <mesh key={i} position={[x, y, z]} castShadow>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#8b6f47" />
      </mesh>
    ))}
    <RoundedBox
      args={[0.9, 0.08, 0.9]}
      position={[0, 0.6, 0]}
      radius={0.02}
      smoothness={4}
      castShadow
    >
      <meshStandardMaterial color="#a67c52" />
    </RoundedBox>
    <NameTag name={obj.name} yOffset={0.75} />
  </group>
);

export const Package = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    <RoundedBox
      args={[0.4, 0.4, 0.4]}
      position={[0, 0.2, 0]}
      radius={0.03}
      smoothness={4}
      castShadow
    >
      <meshStandardMaterial color="#c49a6c" />
    </RoundedBox>
    <NameTag name={obj.name} yOffset={0.55} />
  </group>
);

export const Charger = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    <mesh position={[0, 0.05, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.4, 0.1, 24]} />
      <meshStandardMaterial
        color="#2dd4bf"
        emissive="#0d9488"
        emissiveIntensity={0.3}
      />
    </mesh>
    <mesh position={[0, 0.2, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    <NameTag name={obj.name} yOffset={0.5} />
  </group>
);

export const Obstacle = ({ cell }: { cell: ObstacleCell }) => (
  <mesh position={[cell.x, 0.25, cell.y]} castShadow>
    <boxGeometry args={[0.95, 0.5, 0.95]} />
    <meshStandardMaterial color="#ef4444" roughness={0.8} />
  </mesh>
);

export const WaypointMarker = ({ waypoint }: { waypoint: Waypoint }) => (
  <group position={[waypoint.x, 0, waypoint.y]}>
    <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.42, 24]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
    </mesh>
    <NameTag name={waypoint.name} yOffset={0.1} color="#60a5fa" />
  </group>
);

const NameTag = ({
  name,
  yOffset,
  color = '#e5e7eb',
}: {
  name: string;
  yOffset: number;
  color?: string;
}) => (
  <Text
    position={[0, yOffset, 0]}
    fontSize={0.18}
    color={color}
    anchorX="center"
    anchorY="middle"
  >
    {name}
  </Text>
);
