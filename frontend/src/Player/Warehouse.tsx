import { Grid } from '@react-three/drei';
import { Scene } from '../types';
import {
  Charger,
  Obstacle,
  Package,
  Shelf,
  WaypointMarker,
} from './sceneObjects';

export const Warehouse = ({
  scene,
  hiddenPackages,
  shelfContents,
  isDark,
}: {
  scene: Scene;
  hiddenPackages: Set<string>;
  shelfContents: Map<string, string[]>;
  isDark: boolean;
}) => {
  const { width, height } = scene.warehouse;

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(width - 1) / 2, -0.51, (height - 1) / 2]}
        receiveShadow
      >
        <planeGeometry args={[width + 2, height + 2]} />
        <meshStandardMaterial color={isDark ? '#1f2333' : '#e5e7eb'} />
      </mesh>

      <Grid
        position={[(width - 1) / 2, -0.5, (height - 1) / 2]}
        args={[width, height]}
        cellSize={1}
        cellThickness={1}
        cellColor={isDark ? '#2a2e3d' : '#cbd5e1'}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={isDark ? '#3a3f52' : '#94a3b8'}
        fadeDistance={Math.max(width, height) * 3}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {scene.obstacles.map((o, i) => (
        <Obstacle key={`obs-${i}`} cell={o} />
      ))}

      {scene.objects.map((o) => {
        if (o.kind === 'shelf')
          return (
            <Shelf key={o.name} obj={o} loaded={shelfContents.get(o.name)} />
          );
        if (o.kind === 'package') {
          if (hiddenPackages.has(o.name)) return null;
          return <Package key={o.name} obj={o} />;
        }
        return <Charger key={o.name} obj={o} />;
      })}

      {scene.waypoints.map((w) => (
        <WaypointMarker key={w.name} waypoint={w} />
      ))}
    </>
  );
};
