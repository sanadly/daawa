import { useEffect, useRef } from 'react';

/**
 * A useEffect hook that's safe for React StrictMode
 * Prevents double execution in development mode
 */
export const useStrictModeSafeEffect = (
  effect: () => void | (() => void),
  deps?: React.DependencyList
) => {
  const hasRun = useRef(false);
  const cleanupRef = useRef<(() => void) | void>();
  const effectRef = useRef(effect);

  // Update the effect ref when the effect function changes
  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  useEffect(() => {
    console.log('useStrictModeSafeEffect called, hasRun.current:', hasRun.current);
    
    if (hasRun.current) {
      console.log('useStrictModeSafeEffect: skipping execution (already run)');
      return;
    }

    console.log('useStrictModeSafeEffect: executing effect');
    hasRun.current = true;
    cleanupRef.current = effectRef.current();

    return () => {
      console.log('useStrictModeSafeEffect: cleanup');
      // Don't reset hasRun.current here to prevent infinite loops
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);
}; 