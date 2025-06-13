'use client'; // Required for Next.js Client Components

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import { ArrowLeft, BadgePlus, CopyPlus, Edit, HardDriveUpload, Plus, PlusIcon, PlusSquare, Save, Trash, Trash2, Trash2Icon, TrashIcon } from 'lucide-react';

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

    // State for modals
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddShortcutModal, setShowAddShortcutModal] = useState(false);
    const [addShortcutCategory, setAddShortcutCategory] = useState<string | null>(null);
    const [newShortcutDetails, setNewShortcutDetails] = useState<Partial<Shortcut>>({
        description: '',
        action: '',
        targetId: '',
        targetAction: '',
        keys: [],
        display: ''
    });
    const [newShortcutType, setNewShortcutType] = useState<'action' | 'target'>('action');

    const [showEditShortcutModal, setShowEditShortcutModal] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<{ category: string; index: number; data: Shortcut } | null>(null);
    const [editedShortcutType, setEditedShortcutType] = useState<'action' | 'target'>('action');

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ category: string; index?: number } | null>(null);

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
    const finalizeShortcut = useCallback((list?: any) => {
        if (!listeningFor) return; // Should only run if actively listening

        console.log(list, " lisstt")
        console.log("pressed keys", pressedKeysRef.current)
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
        if (showAddShortcutModal) {
            setNewShortcutDetails(prevDetails => ({ ...prevDetails, keys: newKeys, display: newDisplay }));
        }
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

        console.log(`Pressed key: 11v ${0}`, pressedKeysRef.current);
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

    const handleSaveChanges = async () => {
        if (!shortcutsConfig) {
            console.warn("No shortcuts configuration to save.");
            return;
        }

        try {
            console.log("Attempting to save changes to /api/shortcuts:", shortcutsConfig);
            const response = await fetch('/api/shortcuts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(shortcutsConfig),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to save shortcuts: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            console.log("Save successful:", result.message);
            // Force a reload to pick up changes in useKeyboardShortcuts hook in page.tsx
            window.location.reload();
        } catch (error: any) {
            console.error("Error saving shortcuts:", error.message);
            // setError(error);
        }
    };

    const handleAddShortcut = () => {
        if (!addShortcutCategory || !shortcutsConfig) return;


        console.log("Des ", newShortcutDetails, pressedKeysRef.current)
        if (newShortcutDetails.description && !newShortcutDetails.description.trim() || !newShortcutDetails.keys || newShortcutDetails.keys.length === 0) {
            console.warn('Description and Shortcut keys are required for new shortcut.');
            return;
        }

        const newShortcut: Shortcut = { ...newShortcutDetails } as Shortcut;

        setShortcutsConfig(prevConfig => {
            if (!prevConfig) return null;
            const updatedConfig = { ...prevConfig };
            const categoryShortcuts = updatedConfig[addShortcutCategory] ? [...updatedConfig[addShortcutCategory]] : [];
            categoryShortcuts.push(newShortcut);
            updatedConfig[addShortcutCategory] = categoryShortcuts;
            return updatedConfig;
        });

        setShowAddShortcutModal(false);
        setAddShortcutCategory(null);
    };
    const openAddShortcutModal = (category: string) => {
        setAddShortcutCategory(category);
        setNewShortcutDetails({
            description: '',
            action: '',
            targetId: '',
            targetAction: '',
            keys: [],
            display: ''
        });
        setNewShortcutType('action'); // Default to action type
        setShowAddShortcutModal(true);
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
            <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Manage Keyboard Shortcuts</h2>
            <p className="text-lg text-gray-700 text-center mb-8">
                Click on the current shortcut display to change it, then press the desired key combination.
            </p>


            <div className="flex justify-between my-8">
                <button
                    onClick={handleGoBack}
                    className=" font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                </button>
                <button
                    onClick={handleSaveChanges}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    disabled={!!listeningFor} // Disable if listening for shortcut
                >
                    <HardDriveUpload  className="h-6 w-6 " />
                </button>
            </div>

            {shortcutsConfig && Object.entries(shortcutsConfig).map(([category, shortcuts]) => (
                <div key={category} className="mb-8 last:mb-0">
                    <div className="flex justify-between mb-4 border-b pb-2  text-gray-700  border-gray-300">
                        <h3 className="text-2xl font-semibold capitalize">
                            {category.replace('/', '')} Shortcuts
                        </h3>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => openAddShortcutModal(category)}
                                className="bg-blue-400 hover:bg-blue-500 p-3 text-white text-sm  rounded-md transition duration-150"
                            >
                                <CopyPlus className=" h-4 w-4" />
                            </button>
                            {/* {category !== 'global' && ( // Cannot delete global category
                                <button
                                    // onClick={() => handleDeleteConfirmation(category)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-3 rounded-md transition duration-150"
                                >
                                    Delete Category
                                </button>
                            )} */}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {shortcuts.length > 0 ? (
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Action</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Current Shortcut</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Edit/Delete</th>
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
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        // onClick={() => openEditShortcutModal(category, index, s)}
                                                        className="bg-gray-200 hover:bg-gray-300  cursor-pointer text-sm py-1 px-2 rounded-sm transition duration-150"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        // onClick={() => handleDeleteConfirmation(category, index)}
                                                        className="bg-red-200 hover:bg-red-300 cursor-pointer text-sm py-1 px-2 rounded-sm transition duration-150"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-700 text-center">No shortcuts found for this category.</p>
                        )
                        }
                    </div>
                    <div className="border-t border-gray-400 my-10 border-dashed" />
                </div>
            ))}

            <Dialog open={showAddShortcutModal} onOpenChange={(open) => {
                setShowAddShortcutModal(open);
                if (!open) { // If closing the modal
                    // setIsListeningForShortcut(false);
                    setListeningFor(null);
                    pressedKeysRef.current.clear();
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <DialogTitle>Add New Shortcut to "{addShortcutCategory}"</DialogTitle>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                value={newShortcutDetails.description}
                                onChange={(e) => setNewShortcutDetails(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Quick Add Item"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Shortcut Keys</label>
                            <div
                                ref={listeningKeyRef}
                                className={`mt-1 p-2 border rounded-md cursor-pointer text-center font-bold ${listeningFor && listeningFor.category === addShortcutCategory && listeningFor.index === -1 ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => {
                                    if (!listeningFor) {
                                        setListeningFor({ category: addShortcutCategory!, index: -1 });
                                        pressedKeysRef.current.clear();
                                        if (listeningKeyRef.current) {
                                            listeningKeyRef.current.innerText = 'Press new shortcut...';
                                        }
                                        // setIsListeningForShortcut(true);
                                    }
                                }}
                                title={!listeningFor ? "Click to set shortcut" : "Press keys now"}
                            >
                                {listeningFor && listeningFor.category === addShortcutCategory && listeningFor.index === -1 || listeningKeyRef.current?.innerText ? (
                                    listeningKeyRef.current?.innerText || 'listening...'
                                ) : (
                                    newShortcutDetails.display || 'Click to set shortcut (e.g., Ctrl + Enter)'
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Action Name</label>
                            <input
                                type="text"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                value={newShortcutDetails.action || ''}
                                onChange={(e) => setNewShortcutDetails(prev => ({ ...prev, action: e.target.value }))}
                                placeholder="e.g., addItem"
                            />
                            <label className="block text-sm font-medium text-gray-700">Target ID</label>
                            <input
                                type="text"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                value={newShortcutDetails.targetId || ''}
                                onChange={(e) => setNewShortcutDetails(prev => ({ ...prev, targetId: e.target.value }))}
                                placeholder="e.g., myButtonId"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Action</label>
                            <input
                                type="text"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                value={newShortcutDetails.targetAction || ''}
                                onChange={(e) => setNewShortcutDetails(prev => ({ ...prev, targetAction: e.target.value }))}
                                placeholder="e.g., click or focus"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                            onClick={() => {
                                setShowAddShortcutModal(false);
                                //  setIsListeningForShortcut(false);
                                setListeningFor(null); pressedKeysRef.current.clear();
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            onClick={handleAddShortcut}
                            disabled={!!listeningFor}
                        >
                            Add Shortcut
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShortcutManagerScreen;