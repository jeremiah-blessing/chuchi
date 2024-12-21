import { useEffect, useRef } from 'react';
import { configureMonacoWorkers } from './setupCommon';
import { executeClassic } from './setupClassic';

export const Editor = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doo = async () => {
      configureMonacoWorkers();
      // keep a reference to a promise for when the editor is finished starting, we'll use this to setup the canvas on load
      await executeClassic(containerRef.current!);
    };

    doo();
  }, []);

  return <div ref={containerRef}></div>;
};
