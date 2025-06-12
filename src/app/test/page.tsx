'use client'
import { ShortcutsConfig } from "@/hooks/useKeyboardShortcuts";
import { useCallback, useEffect, useRef, useState } from "react";

interface ShortcutManagerScreenProps {
  shortcutsConfig: ShortcutsConfig;
  setShortcutsConfig: React.Dispatch<React.SetStateAction<ShortcutsConfig | null>>; // To update the config
  setMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentScreen: (screenPath: string) => void;
  setIsListeningForShortcut: React.Dispatch<React.SetStateAction<boolean>>; // To control listener
}

const ShortcutManagerScreen = () => {
  const [listeningFor, setListeningFor] = useState<{ category: string; index: number } | null>(null);
  const listeningKeyRef = useRef<HTMLDivElement>(null);

  // Focus the listening div when listeningFor state changes
  useEffect(() => {
    if (listeningFor && listeningKeyRef.current) {
      listeningKeyRef.current.focus();
    }
  }, [listeningFor]);

  const handleStartRemap = (category: string, index: number) => {
    setListeningFor({ category, index });
    setIsListeningForShortcut(true); // Tell the hook to pause
    setMessage(`Listening for new shortcut for '${shortcutsConfig[category][index].display}'`);
  };

  const handleCaptureKey = useCallback((event: KeyboardEvent) => {
    event.preventDefault(); // Prevent default browser actions during capture
    event.stopPropagation(); // Stop event bubbling

    if (!listeningFor) return;

    const newKeys: string[] = [];
    if (event.ctrlKey) newKeys.push('Control');
    if (event.shiftKey) newKeys.push('Shift');
    if (event.altKey) newKeys.push('Alt');
    if (event.metaKey) newKeys.push('Meta');

    // Add the non-modifier key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      newKeys.push(event.key);
    }

    // Basic validation: Don't allow only modifier keys
    if (newKeys.length === 0 || (newKeys.length === 1 && ['Control', 'Shift', 'Alt', 'Meta'].includes(newKeys[0]))) {
      setMessage('Invalid shortcut: Please press at least one non-modifier key or a combination.');
      return;
    }

    const newDisplay = newKeys
      .map(key => {
        if (key === 'Control') return 'Ctrl';
        if (key === 'Shift') return 'Shift';
        if (key === 'Alt') return 'Alt';
        if (key === 'Meta') return 'Meta'; // Command on Mac
        return key.length === 1 ? key.toUpperCase() : key; // Capitalize single letters, keep others as is
      })
      .join(' + ');

    // Update the shortcutsConfig state
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

    setMessage(`Shortcut updated to: ${newDisplay}`);
    setListeningFor(null); // Exit listening mode
    setIsListeningForShortcut(false); // Resume main hook
  }, [listeningFor, setShortcutsConfig, setMessage, setIsListeningForShortcut]);

  // Attach/detach keydown listener for capturing new shortcut
  useEffect(() => {
    if (listeningFor) {
      window.addEventListener('keydown', handleCaptureKey, { once: true }); // Listen once
    } else {
      window.removeEventListener('keydown', handleCaptureKey);
    }
    return () => {
      window.removeEventListener('keydown', handleCaptureKey);
    };
  }, [listeningFor, handleCaptureKey]);

  const handleSaveChanges = () => {
    // In a real app, you would send shortcutsConfig to your backend here
    console.log("Saving changes (in a real app, this would send to server):", shortcutsConfig);
    setMessage('Changes saved (to console)!');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-orange-600 mb-6">Manage Keyboard Shortcuts</h2>
      <p className="text-lg text-gray-700 text-center mb-8">
        Click 'Change' next to a shortcut, then press the desired key combination.
      </p>

      {listeningFor && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div
            ref={listeningKeyRef}
            tabIndex={-1} // Make it focusable programmatically
            className="bg-white p-8 rounded-lg shadow-xl text-center text-gray-800 text-2xl font-bold animate-pulse focus:outline-none focus:ring-4 focus:ring-blue-400"
            style={{ minWidth: '300px', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Press new shortcut...
          </div>
        </div>
      )}

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
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((s, index) => (
                  <tr key={`${category}-${index}`} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-base text-gray-800">
                      {s.action ? s.action.replace(/([A-Z])/g, ' $1') : `#${s.targetId} ${s.targetAction}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                        {s.display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.description}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStartRemap(category, index)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1.5 px-3 rounded-md transition duration-150 ease-in-out shadow-sm"
                        disabled={!!listeningFor} // Disable if already listening
                      >
                        Change
                      </button>
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
          onClick={() => {
            setCurrentScreen('/');
            setMessage('Returning to Global Screen...');
          }}
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

export default ShortcutManagerScreen