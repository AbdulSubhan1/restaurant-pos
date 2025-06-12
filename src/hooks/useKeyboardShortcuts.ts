import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Type Definitions (Copy these from your main types file or define them here) ---
interface Shortcut {
    keys: string[];
    display: string;
    action?: string;
    targetId?: string;
    targetAction?: string;
}

interface ShortcutsConfig {
    global: Shortcut[];
    orderEntry: Shortcut[];
    payment: Shortcut[];
    [key: string]: Shortcut[];
}

// Props for the useKeyboardShortcuts hook (no longer needs currentScreen as a prop)
// interface UseKeyboardShortcutsProps {
//   // currentScreen is now derived internally from window.location
// }

// Return type for the useKeyboardShortcuts hook
interface UseKeyboardShortcutsReturn {
    shortcutsConfig: ShortcutsConfig | null;
    isLoading: boolean;
    error: Error | null;
    message: string;
    matchedAction: string | null;
    setMatchedAction: React.Dispatch<React.SetStateAction<string | null>>;
}

interface GlobalScreenProps {
    shortcuts: ShortcutsConfig;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    // setCurrentScreen now changes window.location
    setCurrentScreen: (screenPath: string) => void;
}

interface OrderEntryScreenProps {
    shortcuts: ShortcutsConfig;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    // setCurrentScreen now changes window.location
    setCurrentScreen: (screenPath: string) => void;
    handleAction: React.MutableRefObject<Record<string, () => void> | null>;
}

interface PaymentScreenProps {
    // setCurrentScreen now changes window.location
    setCurrentScreen: (screenPath: string) => void;
    setGlobalMessage: React.Dispatch<React.SetStateAction<string | null>>;
}


// --- useKeyboardShortcuts Hook (Place this in a separate file like 'hooks/useKeyboardShortcuts.ts') ---
const useKeyboardShortcuts = (): UseKeyboardShortcutsReturn => {
    const [shortcutsConfig, setShortcutsConfig] = useState<ShortcutsConfig | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [message, setMessage] = useState<string>('');
    const [matchedAction, setMatchedAction] = useState<string | null>(null);


    // Load the shortcuts configuration from the public directory
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/shortcuts.json'); // Path to your shortcuts.json
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const config: ShortcutsConfig = await response.json();

                // IMPORTANT: Ensure the keys in shortcuts.json match the paths (e.g., "/orders", "/payment")
                // or have a consistent mapping. The provided JSON uses "/orders" and "payments" (note plural).
                // Let's adjust the config on load if necessary, or ensure JSON keys are consistent with paths.
                // For now, assuming JSON keys match path names or simple screen names like "global".
                // If you use "/orders" as a key for OrderEntryScreen, that's fine.
                // If you use "payment" as a key for /payment, then a mapping is needed.
                // Based on user's JSON, "payments" is a key, and "/orders" is a key.

                setShortcutsConfig(config);
            } catch (e: any) {
                setError(e);
                console.error("Failed to load shortcuts config:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    // Effect for handling keyboard events, now dependent on shortcutsConfig and URL path
    useEffect(() => {
        if (!shortcutsConfig) return; // Don't attach listener until config is loaded

        const handleKeyDown = (event: KeyboardEvent) => {
            // Determine currentScreen from the URL path
            const currentScreenFromUrl = window.location.pathname;

            console.log("i am triggered by keydown", currentScreenFromUrl, window.location.pathname);
            if (
                (event.ctrlKey && event.key === 'p') ||
                (event.ctrlKey && event.key === 'n') ||
                (event.ctrlKey && event.key === 'f') ||
                event.key === 'F2' ||
                event.key === 'F3' ||
                event.key === 'F10'
            ) {
                event.preventDefault();
            }

            // --- CRITICAL CHANGE: Prioritize page-specific shortcuts ---
            const applicableShortcuts: Shortcut[] = [
                // Page-specific shortcuts first
                ...(shortcutsConfig[currentScreenFromUrl] || []),
                // Global shortcuts second
                ...(shortcutsConfig.global || [])
            ];
            // --- End CRITICAL CHANGE ---

            console.log(applicableShortcuts , shortcutsConfig )
            for (const shortcut of applicableShortcuts) {
                const isMatch = shortcut.keys.every(key => {
                    if (key === 'Control') return event.ctrlKey;
                    if (key === 'Shift') return event.shiftKey;
                    if (key === 'Alt') return event.altKey;
                    if (key === 'Meta') return event.metaKey;
                    if (['Enter', 'Escape'].includes(key)) return event.key === key;
                    if (key.startsWith('F') && key.length <= 3) return event.key === key;
                    return event.key.toLowerCase() === key.toLowerCase();
                });

                const hasExtraModifiers =
                    (shortcut.keys.includes('Control') !== event.ctrlKey) ||
                    (shortcut.keys.includes('Shift') !== event.shiftKey) ||
                    (shortcut.keys.includes('Alt') !== event.altKey) ||
                    (shortcut.keys.includes('Meta') !== event.metaKey);

                if (isMatch && !hasExtraModifiers) {
                    if (shortcut.targetId && shortcut.targetAction) {
                        const targetElement = document.getElementById(shortcut.targetId);
                        console.log(document.querySelector(`#${shortcut.targetId}`));
                        console.log(document);
                        if (targetElement) {
                            console.log(`Attempting to perform ${shortcut.targetAction} on element #${shortcut.targetId}`);
                            if (typeof (targetElement as any)[shortcut.targetAction] === 'function') {
                                (targetElement as any)[shortcut.targetAction]();
                                setMessage(`${shortcut.display} (via ${shortcut.targetAction} on #${shortcut.targetId})`);
                            } else {
                                console.warn(`Target action '${shortcut.targetAction}' is not a function on element #${shortcut.targetId}`);
                                setMessage(`Error: Invalid action '${shortcut.targetAction}' for #${shortcut.targetId}`);
                            }
                        } else {
                            console.warn(`Element with ID '${shortcut.targetId}' not found for shortcut '${shortcut.display}'`);
                            setMessage(`Error: Target element #${shortcut.targetId} not found`);
                        }
                        setMatchedAction(null);
                    } else if (shortcut.action) {
                        setMatchedAction(shortcut.action);
                        setMessage(`${shortcut.action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
                    }
                    event.preventDefault();
                    return;
                }
            }
        };

        // Add event listener for keydown and popstate (for browser back/forward)
        window.addEventListener('keydown', handleKeyDown);
        // We'll keep popstate commented out for now as it can sometimes cause double triggers
        // when combined with programmatic navigation that also updates history.
        // window.addEventListener('popstate', handleKeyDown); // Re-evaluate shortcuts on URL change

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            //   window.removeEventListener('popstate', handleKeyDown);
        };
    }, [shortcutsConfig]); // Dependencies: shortcutsConfig

    return { shortcutsConfig, isLoading, error, message, matchedAction, setMatchedAction };
};

export default useKeyboardShortcuts