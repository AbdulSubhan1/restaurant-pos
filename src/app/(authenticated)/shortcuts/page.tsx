'use client'; // Required for Next.js Client Components

import React, { useCallback, useEffect, useRef, useState } from 'react';
// Removed: import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'; // Assuming these are relative paths to your shadcn/ui components
import { AlertDialogHeader } from '@/components/ui/alert-dialog'; // Assuming this is relative path
import { ArrowLeft, CopyPlus, Edit, HardDriveUpload, Trash } from 'lucide-react'; // Adjusted icons to only what's used


// --- Type Definitions ---
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

// ShortcutManagerScreen Component
const ShortcutManagerScreen: React.FC = () => {
    // Replaced: const router = useRouter(); // Initialize Next.js router
    const [shortcutsConfig, setShortcutsConfig] = useState<ShortcutsConfig | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // State for capturing key combinations
    const [listeningFor, setListeningFor] = useState<{ category: string; index: number } | null>(null);
    const listeningKeyRef = useRef<HTMLDivElement>(null); // Ref for the key capture overlay
    const pressedKeysRef = useRef<Set<string>>(new Set()); // Tracks currently pressed keys
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Debounce for key combinations

    // Unified state for Add/Edit Shortcut Modal
    const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add'); // 'add' or 'edit'
    const [modalCategory, setModalCategory] = useState<string | null>(null); // Category for the current modal operation
    const [modalShortcutIndex, setModalShortcutIndex] = useState<number | null>(null); // Index for edit mode
    const [modalShortcutDetails, setModalShortcutDetails] = useState<Partial<Shortcut>>({ // Holds data for both add/edit
        description: '',
        action: '',
        targetId: '',
        targetAction: '',
        keys: [],
        display: ''
    });

    // State for Delete Confirmation Modal
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ category: string; index?: number } | null>(null); // For category or specific shortcut


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

    // Function to finalize the captured shortcut, used by both add and edit
    const finalizeShortcut = useCallback(() => {
        // If not actively listening, or the modal is closed, do nothing
        if (!listeningFor || !isShortcutModalOpen) {
            // Also reset if the modal somehow closed while listening
            setListeningFor(null);
            pressedKeysRef.current.clear();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            return;
        }

        const newKeys = Array.from(pressedKeysRef.current).sort((a, b) => {
            const order: { [key: string]: number } = { 'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4 };
            const valA = order[a] || 99;
            const valB = order[b] || 99;

            if (valA !== valB) return valA - valB;
            return a.localeCompare(b);
        });

        // Validation: Disallow empty shortcut or only 'Meta' key alone
        if (newKeys.length === 0 || (newKeys.length === 1 && newKeys[0] === 'Meta')) {
            console.warn('Invalid shortcut: No keys pressed or only Meta key alone. Please press a valid combination.');
            setListeningFor(null);
            pressedKeysRef.current.clear();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            return;
        }

        const newDisplay = newKeys
            .map(key => {
                if (key === 'Control') return 'Ctrl';
                if (key === 'Shift') return 'Shift';
                if (key === 'Alt') return 'Alt';
                if (key === 'Meta') return 'Meta';
                return key.length === 1 ? key.toUpperCase() : key;
            })
            .join(' + ');

        // Update the temporary modal state, not the main shortcutsConfig directly
        setModalShortcutDetails(prevDetails => ({
            ...prevDetails,
            keys: newKeys,
            display: newDisplay
        }));

        console.log(`Shortcut captured for modal: ${newDisplay}`);
        setListeningFor(null); // Exit listening mode
        pressedKeysRef.current.clear(); // Clear pressed keys for the next capture
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, [listeningFor, isShortcutModalOpen]);


    // Keydown event handler for capturing input
    const handleCaptureKeyDown = useCallback((event: KeyboardEvent) => {
        // Only proceed if actively listening
        if (!listeningFor) return;

        // Prevent default and stop propagation to avoid conflicts with browser/app shortcuts
        event.preventDefault();
        event.stopPropagation();

        const keyToAdd = event.key === ' ' ? 'Space' : event.key;
        pressedKeysRef.current.add(keyToAdd);

        // Add modifier keys if they are currently active
        if (event.ctrlKey && !pressedKeysRef.current.has('Control')) pressedKeysRef.current.add('Control');
        if (event.shiftKey && !pressedKeysRef.current.has('Shift')) pressedKeysRef.current.add('Shift');
        if (event.altKey && !pressedKeysRef.current.has('Alt')) pressedKeysRef.current.add('Alt');
        if (event.metaKey && !pressedKeysRef.current.has('Meta')) pressedKeysRef.current.add('Meta');

        // Update the display in the overlay in real-time
        const currentPressedDisplay = Array.from(pressedKeysRef.current)
            .sort((a, b) => {
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

        if (listeningKeyRef.current) {
            listeningKeyRef.current.innerText = currentPressedDisplay || 'Press new shortcut...';
        }

        // Clear any previous debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set a new debounce timer to finalize the shortcut after a brief pause
        debounceTimerRef.current = setTimeout(() => {
            finalizeShortcut();
        }, 500); // 500ms debounce delay
    }, [listeningFor, finalizeShortcut]);


    // Attach/detach keydown listeners for capturing new shortcut
    useEffect(() => {
        if (listeningFor) {
            // Attach listeners in the capture phase
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

    // Handler to save changes to the backend
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
            // In a real app, you'd show a user-friendly error message here
        }
    };

    // Handler for adding a new shortcut
    const handleAddShortcut = () => {
        if (!modalCategory || !shortcutsConfig) return;

        // Basic validation
        if (!modalShortcutDetails.description || modalShortcutDetails.description.trim() === '' ||
            !modalShortcutDetails.keys || modalShortcutDetails.keys.length === 0 ||
            !modalShortcutDetails.display || modalShortcutDetails.display.trim() === '') {
            console.warn('Description, Shortcut keys, and Display are required for a new shortcut.');
            // In a real app, you'd show a user-friendly error message here
            return;
        }

        const newShortcut: Shortcut = { ...modalShortcutDetails } as Shortcut;

        setShortcutsConfig(prevConfig => {
            if (!prevConfig) return null;
            const updatedConfig = { ...prevConfig };
            const categoryShortcuts = updatedConfig[modalCategory] ? [...updatedConfig[modalCategory]] : [];
            categoryShortcuts.push(newShortcut);
            updatedConfig[modalCategory] = categoryShortcuts;
            return updatedConfig;
        });

        setIsShortcutModalOpen(false);
        setModalCategory(null);
        setModalShortcutIndex(null);
        setListeningFor(null);
        pressedKeysRef.current.clear();
    };

    // Handler for updating an existing shortcut
    const handleUpdateShortcut = () => {
        if (!modalCategory || modalShortcutIndex === null || !shortcutsConfig) return;

        // Basic validation
        if (!modalShortcutDetails.description || modalShortcutDetails.description.trim() === '' ||
            !modalShortcutDetails.keys || modalShortcutDetails.keys.length === 0 ||
            !modalShortcutDetails.display || modalShortcutDetails.display.trim() === '') {
            console.warn('Description, Shortcut keys, and Display are required for updating a shortcut.');
            // In a real app, you'd show a user-friendly error message here
            return;
        }

        setShortcutsConfig(prevConfig => {
            if (!prevConfig) return null;
            const updatedConfig = { ...prevConfig };
            const categoryShortcuts = [...updatedConfig[modalCategory]];
            categoryShortcuts[modalShortcutIndex] = { ...modalShortcutDetails } as Shortcut;
            updatedConfig[modalCategory] = categoryShortcuts;
            return updatedConfig;
        });

        setIsShortcutModalOpen(false);
        setModalCategory(null);
        setModalShortcutIndex(null);
        setListeningFor(null);
        pressedKeysRef.current.clear();
    };

    // Open add shortcut modal
    const openAddShortcutModal = (category: string) => {
        setModalMode('add');
        setModalCategory(category);
        setModalShortcutIndex(null); // No index for new shortcut
        setModalShortcutDetails({ // Reset details for a new shortcut
            description: '',
            action: '',
            targetId: '',
            targetAction: '',
            keys: [],
            display: ''
        });
        setIsShortcutModalOpen(true);
    };

    // Open edit shortcut modal, pre-filling data
    const openEditShortcutModal = (category: string, index: number, shortcut: Shortcut) => {
        setModalMode('edit');
        setModalCategory(category);
        setModalShortcutIndex(index);
        setModalShortcutDetails({ ...shortcut }); // Pre-fill with existing shortcut data
        setIsShortcutModalOpen(true);
    };

    // Handle delete confirmation initiation
    const handleDeleteConfirmation = (category: string, index?: number) => {
        setDeleteTarget({ category, index });
        setShowDeleteConfirmation(true);
    };

    // Execute delete action
    const handleDelete = () => {
        if (!deleteTarget || !shortcutsConfig) return;

        setShortcutsConfig(prevConfig => {
            if (!prevConfig) return null;
            const updatedConfig = { ...prevConfig };

            if (deleteTarget.index !== undefined) {
                // Delete a specific shortcut
                const categoryShortcuts = [...updatedConfig[deleteTarget.category]];
                categoryShortcuts.splice(deleteTarget.index, 1);
                updatedConfig[deleteTarget.category] = categoryShortcuts;
            } else {
                // Delete an entire category (if not global)
                if (deleteTarget.category !== 'global') {
                    delete updatedConfig[deleteTarget.category];
                } else {
                    console.warn("Cannot delete the 'global' category.");
                }
            }
            return updatedConfig;
        });
        setShowDeleteConfirmation(false);
        setDeleteTarget(null);
    };

    // Handle navigation back
    const handleGoBack = () => {
        window.history.back(); // Use window.history.back() for client-side navigation
    };

    if (isLoading) {
        return <div className="text-center text-xl font-semibold text-gray-700">Loading shortcut manager...</div>;
    }

    if (error) {
        return <div className="text-center text-xl font-semibold text-red-700">Error loading shortcut config: {error.message}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 font-sans">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">Manage Keyboard Shortcuts</h2>
            <p className="text-md text-gray-700 mb-8">
                Click on the current shortcut display to change it, then press the desired key combination.
            </p>

            {/* Action Buttons: Go Back and Save Changes */}
            <div className="flex justify-between my-8">
                <button
                    onClick={handleGoBack}
                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </button>
                <button
                    onClick={handleSaveChanges}
                    className="flex items-center bg-green-500 hover:bg-green-600 cursor-pointer text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    disabled={!!listeningFor} // Disable if listening for shortcut
                >
                    <HardDriveUpload className="h-5 w-5 mr-2" />
                    Save Changes
                </button>
            </div>

            {/* Shortcut Categories Section */}
            {shortcutsConfig && Object.entries(shortcutsConfig).map(([category, shortcuts]) => (
                <div key={category} className="mb-8 last:mb-0">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 text-gray-700 border-gray-300">
                        <h3 className="text-2xl font-semibold capitalize">
                            {category.replace('/', '')} Shortcuts
                        </h3>
                        <div className="flex gap-2 justify-end">
                            {/* Add New Shortcut Button */}
                            <button
                                onClick={() => openAddShortcutModal(category)}
                                className="bg-blue-400 hover:bg-blue-500 px-3 py-2  text-white rounded-md transition duration-150 flex items-center gap-1"
                            >
                                <CopyPlus className="h-4 w-4" /> 
                            </button>
                            {/* Delete Category Button (hidden for 'global' category) */}
                            {category !== 'global' && (
                                <button
                                    onClick={() => handleDeleteConfirmation(category)}
                                    className="bg-red-400 hover:bg-red-500  px-3 py-2 text-white rounded-md transition duration-150 flex items-center gap-1"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {shortcuts.length > 0 ? (
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Action/Target</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Current Shortcut</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shortcuts.map((s, index) => (
                                        <tr key={`${category}-${index}`} className="border-b last:border-b-0 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-base text-gray-800">
                                                {s.action ? s.action.replace(/([A-Z])/g, ' $1').trim() : `#${s.targetId} ${s.targetAction}`}
                                            </td>
                                            <td className="px-4 py-3 cursor-pointer"
                                                onClick={() => {
                                                    // Only allow changing shortcut if not currently listening
                                                    if (!listeningFor) {
                                                        // This starts the key capture process without opening a modal
                                                        // It will update the s.display in the table directly when finalized
                                                        setListeningFor({ category, index });
                                                        pressedKeysRef.current.clear();
                                                        if (listeningKeyRef.current) {
                                                            listeningKeyRef.current.innerText = 'Press new shortcut...';
                                                        }
                                                    }
                                                }}
                                                title={!listeningFor ? "Click to change shortcut combination" : "Press keys now"}
                                            >
                                                {listeningFor && listeningFor.category === category && listeningFor.index === index ? (
                                                    <div ref={listeningKeyRef} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-bold animate-pulse inline-block min-w-[120px] text-center">
                                                        listening...
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-bold inline-block min-w-[120px] text-center">
                                                        {s.display}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{s.description}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Edit Shortcut Button */}
                                                    <button
                                                        onClick={() => openEditShortcutModal(category, index, s)}
                                                        className="bg-gray-200 hover:bg-gray-300 p-2 text-gray-800 rounded-sm transition duration-150"
                                                        title="Edit shortcut details"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {/* Delete Specific Shortcut Button */}
                                                    <button
                                                        onClick={() => handleDeleteConfirmation(category, index)}
                                                        className="bg-red-200 hover:bg-red-300 p-2 text-red-800 rounded-sm transition duration-150"
                                                        title="Delete this shortcut"
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
                            <p className="text-gray-700 text-center py-4">No shortcuts found for this category. Click "Add Shortcut" to create one.</p>
                        )}
                    </div>
                    <div className="border-t border-gray-400 my-10 border-dashed" />
                </div>
            ))}

            {/* Add/Edit Shortcut Modal */}
            <Dialog open={isShortcutModalOpen} onOpenChange={(open: boolean) => {
                setIsShortcutModalOpen(open);
                if (!open) { // If closing the modal, reset listening state and pressed keys
                    setListeningFor(null);
                    pressedKeysRef.current.clear();
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                    }
                }
            }}>
                <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-lg shadow-lg">
                    <AlertDialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-semibold text-gray-800">
                            {modalMode === 'add' ? `Add New Shortcut to "${modalCategory}"` : `Edit Shortcut in "${modalCategory}"`}
                        </DialogTitle>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Description Input */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                id="description"
                                type="text"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={modalShortcutDetails.description || ''}
                                onChange={(e) => setModalShortcutDetails(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Quick Add Item"
                            />
                        </div>

                        {/* Shortcut Keys Input/Capture */}
                        <div>
                            <label htmlFor="shortcutKeys" className="block text-sm font-medium text-gray-700 mb-1">Shortcut Keys</label>
                            <div
                                id="shortcutKeys"
                                ref={listeningKeyRef}
                                className={`mt-1 p-2 border rounded-md cursor-pointer text-center font-bold min-h-[40px] flex items-center justify-center
                                    ${listeningFor && listeningFor.category === modalCategory && listeningFor.index === modalShortcutIndex ? 'bg-yellow-100 text-yellow-800 animate-pulse border-yellow-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                                onClick={() => {
                                    if (!listeningFor) { // Only start listening if not already
                                        setListeningFor({ category: modalCategory!, index: modalMode === 'add' ? -1 : modalShortcutIndex! });
                                        pressedKeysRef.current.clear();
                                        if (listeningKeyRef.current) {
                                            listeningKeyRef.current.innerText = 'Press new shortcut...';
                                        }
                                    }
                                }}
                                title={!listeningFor ? "Click to set shortcut (press combination of keys)" : "Press keys now"}
                            >
                                {listeningFor && listeningFor.category === modalCategory && listeningFor.index === modalShortcutIndex ? (
                                    listeningKeyRef.current?.innerText || 'listening...'
                                ) : (
                                    modalShortcutDetails.display || 'Click to set shortcut (e.g., Ctrl + Enter)'
                                )}
                            </div>
                        </div>
                        
                        {/* Conditional Inputs based on type */}
                        {modalShortcutDetails.action !== undefined && (
                            <div>
                                <label htmlFor="actionName" className="block text-sm font-medium text-gray-700 mb-1">Action Name</label>
                                <input
                                    id="actionName"
                                    type="text"
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={modalShortcutDetails.action || ''}
                                    onChange={(e) => setModalShortcutDetails(prev => ({ ...prev, action: e.target.value }))}
                                    placeholder="e.g., addItem, saveForm"
                                />
                            </div>
                        )}

                        {(modalShortcutDetails.targetId !== undefined || modalShortcutDetails.targetAction !== undefined) && (
                            <>
                                <div>
                                    <label htmlFor="targetId" className="block text-sm font-medium text-gray-700 mb-1">Target ID</label>
                                    <input
                                        id="targetId"
                                        type="text"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={modalShortcutDetails.targetId || ''}
                                        onChange={(e) => setModalShortcutDetails(prev => ({ ...prev, targetId: e.target.value }))}
                                        placeholder="e.g., myButtonId, inputField"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="targetAction" className="block text-sm font-medium text-gray-700 mb-1">Target Action</label>
                                    <input
                                        id="targetAction"
                                        type="text"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={modalShortcutDetails.targetAction || ''}
                                        onChange={(e) => setModalShortcutDetails(prev => ({ ...prev, targetAction: e.target.value }))}
                                        placeholder="e.g., click, focus, submit"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal Action Buttons */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors duration-200"
                            onClick={() => setIsShortcutModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors duration-200"
                            onClick={modalMode === 'add' ? handleAddShortcut : handleUpdateShortcut}
                            disabled={!!listeningFor} // Disable if listening for shortcut
                        >
                            {modalMode === 'add' ? 'Add Shortcut' : 'Update Shortcut'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-lg">
                    <AlertDialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-semibold text-red-600">Confirm Deletion</DialogTitle>
                    </AlertDialogHeader>
                    <p className="text-gray-700 mb-6">
                        Are you sure you want to delete {deleteTarget?.index !== undefined ? 'this shortcut' : 'this category'}?
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors duration-200"
                            onClick={() => setShowDeleteConfirmation(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors duration-200"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShortcutManagerScreen;