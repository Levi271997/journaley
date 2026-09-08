"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Navigations quicker than this never draw a bar, so the app stops flickering. */
const SHOW_DELAY = 120;
/** How often the bar creeps forward while it waits. */
const STEP = 200;
/** The bar never claims to be past here until the page actually arrives. */
const CEILING = 0.9;
/** Long enough for the run to the end and the fade that follows it. */
const FADE = 400;

type Progress = {
  /** Adds (1) or removes (-1) one in-flight navigation from the bar. */
  report: (delta: 1 | -1) => void;
};

const ProgressContext = createContext<Progress | null>(null);

/**
 * Draws the top bar for as long as `pending` is true. Several callers can be
 * pending at once; the bar clears when the last of them finishes.
 */
export function useProgressWhile(pending: boolean) {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgressWhile must be used inside <ProgressProvider>");
  }

  const { report } = context;

  useEffect(() => {
    if (!pending) return;

    report(1);
    return () => report(-1);
  }, [pending, report]);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [inFlight, setInFlight] = useState(0);

  const report = useCallback(
    (delta: 1 | -1) => setInFlight((count) => count + delta),
    [],
  );

  // A fresh object every render would re-render every consumer on each
  // navigation, which is exactly when they can least afford it.
  const value = useMemo(() => ({ report }), [report]);

  return (
    <ProgressContext.Provider value={value}>
      <ProgressBar active={inFlight > 0} />
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * A thin bar across the top of the viewport. It cannot know how far along a
 * navigation is, so it eases toward `CEILING` and only runs to the end once
 * the new page is really here.
 */
function ProgressBar({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  // Whether a bar is actually on screen, which decides if there is anything to
  // finish. A ref rather than state: re-running the effect on it would restart
  // the very animation it is describing.
  const shown = useRef(false);

  useEffect(() => {
    if (active) {
      let creep: ReturnType<typeof setInterval> | undefined;

      const show = setTimeout(() => {
        shown.current = true;
        setFading(false);
        setProgress(0.1);
        // Slowing as it goes: a long wait keeps moving without ever looking
        // like it is about to finish.
        creep = setInterval(
          () => setProgress((at) => at + (CEILING - at) * 0.18),
          STEP,
        );
      }, SHOW_DELAY);

      return () => {
        clearTimeout(show);
        clearInterval(creep);
      };
    }

    if (!shown.current) return;
    shown.current = false;

    setProgress(1);
    setFading(true);
    const reset = setTimeout(() => {
      setProgress(0);
      setFading(false);
    }, FADE);

    return () => clearTimeout(reset);
  }, [active]);

  if (progress === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
      style={{
        transform: `scaleX(${progress})`,
        opacity: fading ? 0 : 1,
        // The fade waits for the run to the end, so the bar is seen to
        // complete rather than vanishing part-way.
        transition: "transform 200ms ease-out, opacity 250ms ease-out 150ms",
      }}
    />
  );
}
