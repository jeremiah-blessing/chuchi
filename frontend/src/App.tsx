import { useCallback, useRef, useState } from 'react';
import { Editor } from './Editor';
import { Player } from './Player';
import { ICommand } from './types';
import { Theme, ThemeContext } from './theme';

export const App = () => {
  const [commands, setCommands] = useState<ICommand[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handlePlay = useCallback(() => {
    timelineRef.current?.resume();
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    timelineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleRestart = useCallback(() => {
    timelineRef.current?.restart();
    setIsPlaying(true);
  }, []);

  const handleComplete = useCallback(() => setIsPlaying(false), []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={`w-screen h-screen flex flex-col font-mono transition-colors duration-300 ${
          isDark ? 'bg-shell text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        {/* Header */}
        <header
          className={`h-12 flex items-center justify-between px-5 border-b shrink-0 transition-colors duration-300 ${
            isDark ? 'bg-panel border-subtle' : 'bg-white border-gray-200'
          }`}
        >
          {/* Left — Branding */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8l4 4 6-8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide">chuchi</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors duration-300 ${
                isDark ? 'text-gray-500 bg-subtle' : 'text-gray-400 bg-gray-100'
              }`}
            >
              v0.1
            </span>
          </div>

          {/* Center — Playback controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRestart}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                isDark ? 'hover:bg-subtle' : 'hover:bg-gray-100'
              }`}
              title="Restart"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2v5h5"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.05 10A6 6 0 1 0 4.18 4.18L2 7"
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isPlaying ? (
              <button
                onClick={handlePause}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                title="Pause"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="4"
                    y="3"
                    width="3"
                    height="10"
                    rx="0.5"
                    fill="#fb923c"
                  />
                  <rect
                    x="9"
                    y="3"
                    width="3"
                    height="10"
                    rx="0.5"
                    fill="#fb923c"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                title="Play"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3l8 5-8 5V3z" fill="#fb923c" />
                </svg>
              </button>
            )}
          </div>

          {/* Right — Theme toggle */}
          <div className="flex items-center justify-end w-32">
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                isDark ? 'hover:bg-subtle' : 'hover:bg-gray-100'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Panels */}
        <div className="flex flex-1 min-h-0">
          {/* Editor panel */}
          <div
            className={`w-[380px] flex flex-col border-r shrink-0 transition-colors duration-300 ${
              isDark ? 'border-subtle' : 'border-gray-200'
            }`}
          >
            <div
              className={`h-9 flex items-center gap-2 px-4 border-b shrink-0 transition-colors duration-300 ${
                isDark
                  ? 'bg-surface border-subtle'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M9.5 1.5L11.5 3.5 6 9 3 10l1-3 5.5-5.5z"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                editor
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <Editor onCommands={setCommands} theme={theme} />
            </div>
          </div>

          {/* 3D Viewer panel */}
          <div className="flex-1 min-h-0">
            <Player
              commands={commands}
              timelineRef={timelineRef}
              onComplete={handleComplete}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
