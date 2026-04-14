import gsap from 'gsap';
import { Group } from 'three';
import { RefObject } from 'react';
import { Direction, Scene } from '../types';
import { SimulationResult } from './simulation';

const directionToRotation: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

interface BuildOptions {
  scene: Scene;
  simulation: SimulationResult;
  robotRef: RefObject<Group>;
  /** Called with the index of the currently-executing command for overlay state. */
  onCommandIndex: (index: number) => void;
  onComplete: () => void;
}

export const buildRobotTimeline = ({
  scene,
  simulation,
  robotRef,
  onCommandIndex,
  onComplete,
}: BuildOptions): gsap.core.Timeline => {
  const tl = gsap.timeline({ onComplete });

  tl.set(robotRef.current!.position, {
    x: scene.robot.x,
    y: 0,
    z: scene.robot.y,
  });
  tl.set(robotRef.current!.rotation, {
    y: directionToRotation[scene.robot.facing],
  });

  for (const step of simulation.steps) {
    tl.call(() => onCommandIndex(step.commandIndex));

    switch (step.command.type) {
      case 'goTo': {
        const path = step.robot.path;
        for (let i = 1; i < path.length; i++) {
          const cell = path[i];
          tl.to(robotRef.current!.position, {
            x: cell.x,
            z: cell.y,
            duration: 0.25,
            ease: 'none',
          });
        }
        break;
      }
      case 'turn': {
        tl.to(robotRef.current!.rotation, {
          y: directionToRotation[step.robot.facing],
          duration: 0.35,
          ease: 'power2.inOut',
        });
        break;
      }
      case 'pickup':
      case 'unload':
        tl.to(robotRef.current!.position, {
          y: 0.1,
          duration: 0.12,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
        break;
      case 'drop':
      case 'load':
        tl.to(robotRef.current!.position, {
          y: 0.05,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
        break;
      case 'scan':
        tl.to(robotRef.current!.rotation, {
          y: `+=${Math.PI * 2}`,
          duration: 0.6,
          ease: 'power1.inOut',
        });
        break;
      case 'charge':
        tl.to({}, { duration: 0.8 });
        break;
    }
  }

  return tl;
};

export const _directionToRotation = directionToRotation;
export type { BuildOptions };
