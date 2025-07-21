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

  useEffect(() => {
    // Only run once per mount cycle
    if (hasRun.current) {
      return;
    }

    console.log('useStrictModeSafeEffect: executing effect');
    hasRun.current = true;
    
    // Clean up previous effect
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    
    cleanupRef.current = effect();

    return () => {
      console.log('useStrictModeSafeEffect: cleanup');
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      // Reset for next mount cycle
      hasRun.current = false;
    };
  }, deps);
}; 