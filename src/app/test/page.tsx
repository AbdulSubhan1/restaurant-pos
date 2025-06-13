'use client'; // Required for Next.js Client Components

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

// --- Type Definitions (Ensure these are imported or defined consistently across your project) ---
interface Shortcut {
    keys: string[];
    display: string;
    action?: string;
    targetId?: string;
    targetAction?: string;
    description: string;
}

interface ShortcutsConfig {
    global: Shortcut[];
    orderEntry: Shortcut[];
    payment: Shortcut[];
    [key: string]: Shortcut[]; // For dynamic keys like "/orders"
}

// Props for ShortcutManagerScreen - now an empty interface as no props will be passed
const ShortcutManagerScreen: React.FC = () => {
    const router = useRouter(); // Initialize Next.js router
    const [shortcutsConfig, setShortcutsConfig] = useState<ShortcutsConfig | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [listeningFor, setListeningFor] = useState<{ category: string; index: number } | null>(null);
    const listeningKeyRef = useRef<HTMLDivElement>(null); // Ref for the key capture overlay

    // Refs for capturing key combinations and debouncing
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Data Fetching for this component's shortcuts configuration ---
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/shortcuts.json'); // Path to your shortcuts.json
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const config: ShortcutsConfig = await response.json();
                setShortcutsConfig(config);
            } catch (e: any) {
                setError(e);
                console.error("Failed to load shortcuts config for manager:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []); // Run once on mount to fetch its own config

    // Focus the listening div when listeningFor state changes
    useEffect(() => {
        if (listeningFor && listeningKeyRef.current) {
            listeningKeyRef.current.focus();
        }
    }, [listeningFor]);

    // Function to finalize the captured shortcut
    const finalizeShortcut = useCallback((list?:any) => {
        if (!listeningFor) return; // Should only run if actively listening

        console.log(list , " lisstt")
        console.log("pressed keys",pressedKeysRef.current)
        // Get the captured keys, normalize, and sort for consistent representation
        const newKeys = Array.from(pressedKeysRef.current).sort((a, b) => {
            // Define an order for modifier keys to keep them consistent (Ctrl, Shift, Alt, Meta)
            const order: { [key: string]: number } = { 'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4 };
            const valA = order[a] || 99; // Non-modifiers get a higher value
            const valB = order[b] || 99;

            if (valA !== valB) return valA - valB; // Sort modifiers first
            return a.localeCompare(b); // Then sort alphabetically
        });

        // Validation for the captured shortcut
        // Disallow empty shortcut or only 'Meta' key alone (common OS shortcut conflict)
        if (newKeys.length === 0 || (newKeys.length === 1 && newKeys[0] === 'Meta')) {
            console.warn('Invalid shortcut: No keys pressed or only Meta key alone. Please press a valid combination.');
            setListeningFor(null); // Exit listening mode
            pressedKeysRef.current.clear(); // Clear all pressed keys
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            return;
        }

        // Format the captured keys for display
        const newDisplay = newKeys
            .map(key => {
                if (key === 'Control') return 'Ctrl';
                if (key === 'Shift') return 'Shift';
                if (key === 'Alt') return 'Alt';
                if (key === 'Meta') return 'Meta';
                // Capitalize single letters, keep other keys (e.g., "ArrowRight", "Escape") as is
                return key.length === 1 ? key.toUpperCase() : key;
            })
            .join(' + ');

        // Update the shortcutsConfig state local to this component
        setShortcutsConfig(prevConfig => {
            if (!prevConfig) return null;
            const updatedConfig = { ...prevConfig };
            const categoryShortcuts = [...updatedConfig[listeningFor.category]];
            categoryShortcuts[listeningFor.index] = {
                ...categoryShortcuts[listeningFor.index],
                keys: newKeys,
                display: newDisplay,
            };
            updatedConfig[listeningFor.category] = categoryShortcuts;
            return updatedConfig;
        });

        console.log(`Shortcut updated to: ${newDisplay}`);
        setListeningFor(null); // Exit listening mode
        pressedKeysRef.current.clear(); // Clear pressed keys for the next capture
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, [listeningFor, setShortcutsConfig]);

    // Handle click on shortcut display to start remapping
    const handleStartRemap = (category: string, index: number) => {
        if (!shortcutsConfig) {
            console.warn('Error: Shortcuts not loaded yet.');
            return;
        }
        if (!listeningFor) { // Only allow starting remap if not already listening
            setListeningFor({ category, index });
            pressedKeysRef.current.clear(); // Clear any previously pressed keys
            // Set initial text for the overlay
            if (listeningKeyRef.current) {
                listeningKeyRef.current.innerText = 'Press new shortcut...';
            }
            console.log(`Listening for new shortcut for '${shortcutsConfig[category][index].keys.join(' + ')}'`);
        }
    };

    // Helper to check if a key is a modifier
    const isModifierKey = (key: string) => ['Control', 'Shift', 'Alt', 'Meta'].includes(key);

    // Keydown event handler for capturing input
    const handleCaptureKeyDown = useCallback((event: KeyboardEvent) => {
        // Always prevent default and stop propagation when listening to avoid conflicts
        event.preventDefault();
        event.stopPropagation();

        if (!listeningFor) return;

        // Add current key to the set of pressed keys
        // Normalize key names for consistency (e.g., 'Control' instead of 'control')
        const keyToAdd = event.key === ' ' ? 'Space' : event.key; // Handle spacebar explicitly
        pressedKeysRef.current.add(keyToAdd);

        console.log(`Pressed key: 11v ${0}`,pressedKeysRef.current);
        // Add modifier keys if they are currently active
        // It's important to add 'Control', 'Shift', etc., as distinct keys, not just based on event.ctrlKey
        if (event.ctrlKey && !pressedKeysRef.current.has('Control')) pressedKeysRef.current.add('Control');
        if (event.shiftKey && !pressedKeysRef.current.has('Shift')) pressedKeysRef.current.add('Shift');
        if (event.altKey && !pressedKeysRef.current.has('Alt')) pressedKeysRef.current.add('Alt');
        if (event.metaKey && !pressedKeysRef.current.has('Meta')) pressedKeysRef.current.add('Meta');

        // Update the display in the overlay in real-time
        const currentPressedDisplay = Array.from(pressedKeysRef.current)
            .sort((a, b) => { // Sort modifiers first for consistent display
                const order: { [key: string]: number } = { 'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4 };
                const valA = order[a] || 99;
                const valB = order[b] || 99;
                if (valA !== valB) return valA - valB;
                return a.localeCompare(b);
            })
            .map(key => {
                if (key === 'Control') return 'Ctrl';
                if (key === 'Shift') return 'Shift';
                if (key === 'Alt') return 'Alt';
                if (key === 'Meta') return 'Meta';
                return key.length === 1 ? key.toUpperCase() : key;
            })
            .join(' + ');

        console.log("Current pressed keys:", currentPressedDisplay);
        if (listeningKeyRef.current) {
            listeningKeyRef.current.innerText = currentPressedDisplay || 'Press new shortcut...';
        }

        // Clear any previous debounce timer
        if (debounceTimerRef.current) {
            console.log("Clearing debounce timer", currentPressedDisplay);
            clearTimeout(debounceTimerRef.current);
        }

        // Set a new debounce timer. If this timer fires, it means the user has stopped pressing keys
        // (or only pressed modifiers and nothing else followed), so finalize the shortcut.
        debounceTimerRef.current = setTimeout(() => {
            console.log("Debounce timer fired, finalizing shortcut", currentPressedDisplay);
            finalizeShortcut(pressedKeysRef.current);
        }, 500); // 500ms debounce delay
    }, [listeningFor, finalizeShortcut]);


    // Attach/detach keydown and keyup listeners for capturing new shortcut
    useEffect(() => {
        if (listeningFor) {
            // Attach listeners in the capture phase to ensure they fire before other handlers
            window.addEventListener('keydown', handleCaptureKeyDown, true);
        } else {
            // Remove listeners when not listening
            window.removeEventListener('keydown', handleCaptureKeyDown, true);
            // Ensure debounce timer is cleared and pressed keys are reset if exiting listening mode
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            pressedKeysRef.current.clear();
        }
        return () => {
            // Cleanup on component unmount
            window.removeEventListener('keydown', handleCaptureKeyDown, true);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [listeningFor, handleCaptureKeyDown]);

    const handleSaveChanges = () => {
        // In a real application, you would send `shortcutsConfig` to your backend here
        // e.g., fetch('/api/save-shortcuts', { method: 'POST', body: JSON.stringify(shortcutsConfig) });
        console.log("Saving changes (in a real app, this would send to server):", shortcutsConfig);
        console.log('Changes saved (to console)! Note: For changes to apply globally, the main app/hook might need to re-fetch or be notified via global state.');
    };

    const handleGoBack = () => {
        router.back(); // Use Next.js router to go back
    };


    if (isLoading) {
        return <div className="text-center text-xl font-semibold text-gray-700">Loading shortcut manager...</div>;
    }

    if (error) {
        return <div className="text-center text-xl font-semibold text-red-700">Error loading shortcut config: {error.message}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h2 className="text-3xl font-bold text-center text-orange-600 mb-6">Manage Keyboard Shortcuts</h2>
            <p className="text-lg text-gray-700 text-center mb-8">
                Click on the current shortcut display to change it, then press the desired key combination.
            </p>

            {shortcutsConfig && Object.entries(shortcutsConfig).map(([category, shortcuts]) => (
                <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-300 capitalize">
                        {category.replace('/', '').replace('entry', ' Entry').replace('payment', ' Payment') || 'Global'} Shortcuts
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Action/Target</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Current Shortcut</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600"></th> {/* Empty header for actions column */}
                                </tr>
                            </thead>
                            <tbody>
                                {shortcuts.map((s, index) => (
                                    <tr key={`${category}-${index}`} className="border-b last:border-b-0 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-base text-gray-800">
                                            {s.action ? s.action.replace(/([A-Z])/g, ' $1') : `#${s.targetId} ${s.targetAction}`}
                                        </td>
                                        <td className="px-4 py-3 cursor-pointer"
                                            onClick={() => handleStartRemap(category, index)}
                                            title={!listeningFor ? "Click to change" : "Press keys now"}
                                        >
                                            {listeningFor && listeningFor.category === category && listeningFor.index === index ? (
                                                <div ref={listeningKeyRef} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-bold animate-pulse inline-block min-w-[90px] text-center">
                                                    listening...
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-bold inline-block min-w-[90px] text-center">
                                                    {s.display} {/* Use s.display as it's the formatted string */}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{s.description}</td>
                                        <td className="px-4 py-3 text-right">
                                            {/* Removed the Change button as requested */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            <div className="flex justify-between mt-8">
                <button
                    onClick={handleGoBack}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Go Back
                </button>
                <button
                    onClick={handleSaveChanges}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    disabled={!!listeningFor} // Disable if listening for shortcut
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ShortcutManagerScreen;