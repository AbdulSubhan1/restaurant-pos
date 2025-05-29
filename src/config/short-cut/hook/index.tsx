'use client'
import { useEffect, useState, useCallback } from 'react';

/**
 * Interface for a single shortcut object as defined in shortcuts.json.
 */
interface Shortcut {
  action: string;
  keys: string[];
  display: string;
  description: string;
}

/**
 * Interface for the entire shortcuts configuration from shortcuts.json.
 */
interface ShortcutsConfig {
  global?: Shortcut[];
  orderEntryScreen?: Shortcut[];
  paymentScreen?: Shortcut[];
  [key: string]: Shortcut[] | undefined; // Allow for other dynamic scopes
}

/**
 * Custom hook for handling keyboard shortcuts based on a JSON configuration.
 *
 * @param {string} scope - The scope of shortcuts to activate (e.g., 'global', 'orderEntryScreen', 'paymentScreen').
 * @param {Record<string, () => void>} actionMap - An object mapping action names (from shortcuts.json) to handler functions.
 * Example: { newOrder: () => console.log('New Order!'), closeModal: () => console.log('Close Modal!') }
 */
export const useKeyboardShortcuts = (
  scope: string,
  actionMap: Record<string, () => void>
) => {
  const [shortcutsConfig, setShortcutsConfig] = useState<ShortcutsConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load the shortcuts configuration from the public directory
  useEffect(() => {

    const loadConfig = async () => {
      try {
        const response = await fetch('/shortcuts.json'); // Path to your shortcuts.json
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config: ShortcutsConfig = await response.json();
        setShortcutsConfig(config);
      } catch (e: any) { // Catch as 'any' then narrow down if needed
        setError(e);
        console.error("Failed to load shortcuts config:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []); // Run once on mount

  // Memoize the event handler to prevent unnecessary re-creations
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isLoading || error || !shortcutsConfig) return;

    if (event.ctrlKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
    }
    // Get the shortcuts for the current scope
    const currentScopeShortcuts: Shortcut[] | undefined = shortcutsConfig[scope];
    if (!currentScopeShortcuts) return;

    // Iterate through shortcuts in the current scope
    for (const shortcut of currentScopeShortcuts) {
      const { action, keys } = shortcut;
      let match: boolean = true;

      // Check for modifier keys (Control, Alt, Shift, Meta)
      const requiredModifiers: Set<string> = new Set(keys.filter((k: string) =>
        ['Control', 'Alt', 'Shift', 'Meta'].includes(k)
      ));

      if (requiredModifiers.has('Control') !== event.ctrlKey) match = false;
      if (requiredModifiers.has('Alt') !== event.altKey) match = false;
      if (requiredModifiers.has('Shift') !== event.shiftKey) match = false;
      if (requiredModifiers.has('Meta') !== event.metaKey) match = false; // For Command key on Mac

      // Check the primary key (the non-modifier key)
      const primaryKey: string | undefined = keys.find((k: string) =>
        !['Control', 'Alt', 'Shift', 'Meta'].includes(k)
      );

      // Handle special keys like 'Enter', 'Escape', 'F2', 'ArrowUp', etc.
      // For '+' and '-', event.key might be different depending on Shift state.
      // For F-keys, event.key is 'F1', 'F2', etc.
      // For arrow keys, event.key is 'ArrowUp', 'ArrowDown', etc.
      // For number keys with Control, event.key is '1', '2', etc.
      if (primaryKey && match) {
        // Special handling for '+' and '-' as event.key might be '=' or other chars
        if (primaryKey === '+' && event.key !== '+' && event.key !== '=') match = false; // Allow '=' for '+' on some layouts
        else if (primaryKey === '-' && event.key !== '-') match = false;
        // For other keys, a direct comparison is usually fine
        else if (event.key.toLowerCase() !== primaryKey.toLowerCase() && event.code !== primaryKey) {
          // event.code is useful for F-keys (e.g., "F2") and some other non-character keys
          match = false;
        }
      } else if (primaryKey && !match) {
        // If primaryKey exists but modifiers didn't match, no need to check primaryKey
      } else if (!primaryKey && keys.length > 0) {
        // If no primary key is defined but keys array is not empty, it implies only modifiers are expected.
        // This case is unlikely for typical shortcuts but good for robustness.
        // If only modifiers are required, ensure no other keys are pressed.
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
          match = false; // A character key was pressed without being specified
        }
      }


      // If all checks pass, execute the action
      if (match) {
        event.preventDefault(); // Prevent default browser behavior
        if (actionMap[action]) {
          actionMap[action]();
        } else {
          console.warn(`No handler defined for action: ${action}`);
        }
        return; // Stop after the first matching shortcut is found and executed
      }
    }
  }, [isLoading, error, shortcutsConfig, scope, actionMap]); // Dependencies for useCallback

  // Attach and clean up the event listener
  useEffect(() => {
    // Only attach listener if config is loaded and no error
    if (!isLoading && !error && shortcutsConfig) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, error, shortcutsConfig, handleKeyDown]); // Re-run if these dependencies change

  return { isLoading, error };
};

export default useKeyboardShortcuts;