"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Save, 
  RotateCcw, 
  Plus, 
  Square, 
  Circle, 
  MapPin, 
  Grid3X3,
  Move,
  Trash2,
  Settings,
  Upload,
  Download,
  Eye,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { Table } from "@/db/schema/tables";

interface TableElement {
  id: string;
  tableId: number; // Reference to actual table in database
  type: "table";
  shape: "circle" | "square";
  label: string;
  position: [number, number];
  size: number;
  capacity: number;
  status: string;
  name: string;
}

interface ZoneElement {
  id: string;
  type: "zone";
  label: string;
  position: [number, number];
  width: number;
  height: number;
  color: string;
}

type CanvasElement = TableElement | ZoneElement;

interface TableLayoutDesignerProps {
  initialTables: Table[];
}

export function TableLayoutDesigner({ initialTables }: TableLayoutDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<[number, number]>([0, 0]);
  const [layoutName, setLayoutName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("current");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);

  // Load saved layouts on mount
  useEffect(() => {
    const loadSavedLayouts = async () => {
      try {
        const response = await fetch("/api/tables/layout");
        const data = await response.json();
        
        if (data.success && data.layouts.length > 0) {
          setSavedLayouts(data.layouts);
        }
      } catch (error) {
        console.error("Error loading saved layouts:", error);
      }
    };

    loadSavedLayouts();
  }, []);

  // Convert database tables to canvas elements
  useEffect(() => {
    if (initialTables.length > 0) {
      const tableElements: TableElement[] = initialTables.map((table, index) => {
        // Calculate grid position
        const gridSize = 80; // Space between tables
        const tablesPerRow = Math.ceil(Math.sqrt(initialTables.length)); // Square grid
        const row = Math.floor(index / tablesPerRow);
        const col = index % tablesPerRow;
        
        return {
          id: `table-${table.id}`,
          tableId: table.id,
          type: "table",
          shape: table.capacity <= 2 ? "square" : "circle",
          label: table.name,
          position: [100 + (col * gridSize), 100 + (row * gridSize)],
          size: 60,
          capacity: table.capacity,
          status: table.status,
          name: table.name
        };
      });
      
      setElements(tableElements);
    }
  }, [initialTables]);

  const addTable = (shape: "circle" | "square") => {
    // Find the next available grid position
    const gridSize = 80;
    const tablesPerRow = Math.ceil(Math.sqrt(elements.length + 1));
    const index = elements.length;
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;
    
    const newTable: TableElement = {
      id: `table-new-${Date.now()}`,
      tableId: 0, // Will be assigned when saved
      type: "table",
      shape,
      label: `New ${shape === "circle" ? "Round" : "Square"}`,
      position: [100 + (col * gridSize), 100 + (row * gridSize)],
      size: 60,
      capacity: shape === "circle" ? 4 : 2,
      status: "available",
      name: `New ${shape === "circle" ? "Round" : "Square"}`
    };
    
    setElements(prev => [...prev, newTable]);
    toast.success(`Added ${shape} table`);
  };

  const addZone = () => {
    // Find the next available grid position for zones
    const gridSize = 80;
    const zoneElements = elements.filter(el => el.type === "zone");
    const tablesPerRow = Math.ceil(Math.sqrt(zoneElements.length + 1));
    const index = zoneElements.length;
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;
    
    const newZone: ZoneElement = {
      id: `zone-${Date.now()}`,
      type: "zone",
      label: `Zone ${elements.filter(e => e.type === "zone").length + 1}`,
      position: [200 + (col * gridSize), 200 + (row * gridSize)],
      width: 200,
      height: 150,
      color: "#e2e8f0"
    };
    
    setElements(prev => [...prev, newZone]);
    toast.success("Added new zone");
  };

  const autoArrangeTables = () => {
    const tableElements = elements.filter(el => el.type === "table");
    const gridSize = 80;
    const tablesPerRow = Math.ceil(Math.sqrt(tableElements.length));
    
    const rearrangedElements = elements.map((element, index) => {
      if (element.type === "table") {
        const tableIndex = tableElements.findIndex(t => t.id === element.id);
        const row = Math.floor(tableIndex / tablesPerRow);
        const col = tableIndex % tablesPerRow;
        
        return {
          ...element,
          position: [100 + (col * gridSize), 100 + (row * gridSize)] as [number, number]
        };
      }
      return element;
    });
    
    setElements(rearrangedElements);
    toast.success("Tables arranged in grid layout");
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    toast.success("Element deleted");
  };

  const updateElementProperty = (id: string, property: string, value: any) => {
    setElements(prev => 
      prev.map(el => 
        el.id === id 
          ? { ...el, [property]: value }
          : el
      )
    );
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle selection for multi-select (Ctrl/Cmd + click)
    if (e.ctrlKey || e.metaKey) {
      setSelectedTables(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElement(elementId);
      setSelectedTables([elementId]);
    }
    
    setIsDragging(true);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset([
          e.clientX - rect.left - element.position[0],
          e.clientY - rect.top - element.position[1]
        ]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let newX = e.clientX - rect.left - dragOffset[0];
    let newY = e.clientY - rect.top - dragOffset[1];

    // Snap to grid for perfect alignment
    if (snapToGrid) {
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
    }

    // Keep within canvas bounds
    newX = Math.max(0, Math.min(newX, rect.width - 60));
    newY = Math.max(0, Math.min(newY, rect.height - 60));

    setElements(prev => 
      prev.map(el => 
        el.id === selectedElement 
          ? { ...el, position: [newX, newY] as [number, number] }
          : el
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMergeTables = async () => {
    if (selectedTables.length < 2) {
      toast.error("Please select at least 2 tables to merge");
      return;
    }

    try {
      const tableIds = selectedTables.map(id => {
        const element = elements.find(el => el.id === id);
        return element?.tableId || 0;
      }).filter(id => id > 0);

      if (tableIds.length < 2) {
        toast.error("Selected tables must have valid IDs");
        return;
      }

      const mergedTableName = `Merged Table ${Date.now()}`;
      
      const response = await fetch("/api/tables/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableIds,
          mergedTableName,
          mergeNotes: "Merged from layout designer"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to merge tables");
      }

      toast.success("Tables merged successfully!");
      
      // Refresh the layout
      await loadLayout();
      
      // Clear selection
      setSelectedTables([]);
      setSelectedElement(null);
      setIsMergeDialogOpen(false);
      
    } catch (error) {
      console.error("Error merging tables:", error);
      toast.error("Failed to merge tables");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "occupied": return "bg-red-500";
      case "reserved": return "bg-blue-500";
      case "maintenance": return "bg-gray-500";
      case "disabled": return "bg-slate-500";
      case "cleaning": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const saveLayout = async () => {
    if (!layoutName.trim()) {
      toast.error("Please enter a layout name");
      return;
    }

    setIsSaving(true);
    try {
      const layoutData = {
        name: layoutName.trim(),
        elements: elements.map(el => ({
          ...el,
          // Convert position to database format
          xPosition: el.position[0],
          yPosition: el.position[1],
        })),
        metadata: {
          createdAt: new Date().toISOString(),
          snapToGrid,
          version: "1.0"
        }
      };

      // Save to database
      const response = await fetch("/api/tables/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(layoutData),
      });

      if (!response.ok) {
        throw new Error("Failed to save layout");
      }

      toast.success("Layout saved successfully!");
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  const loadLayout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tables/layout");
      const data = await response.json();
      
      if (data.success && data.layouts.length > 0) {
        setSavedLayouts(data.layouts);
        
        // Load the selected layout
        const layout = data.layouts.find((l: any) => l.id === selectedLayoutId) || data.layouts[0];
        
        if (layout.id !== "current") {
          setLayoutName(layout.name);
          
          const loadedElements = layout.elements.map((el: any) => ({
            ...el,
            position: [el.xPosition || el.position[0], el.yPosition || el.position[1]] as [number, number],
            width: el.width || el.size,
            height: el.height || el.size,
          }));
          
          setElements(loadedElements);
          toast.success(`Loaded layout: ${layout.name}`);
        } else {
          // Load current layout
          const loadedElements = layout.elements.map((el: any) => ({
            ...el,
            position: [el.xPosition || el.position[0], el.yPosition || el.position[1]] as [number, number],
            width: el.width || el.size,
            height: el.height || el.size,
          }));
          
          setElements(loadedElements);
          toast.success("Loaded current layout");
        }
      } else {
        toast.info("No saved layouts found");
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      toast.error("Failed to load layout");
    } finally {
      setIsLoading(false);
    }
  };

  const exportLayout = () => {
    const layoutData = {
      name: layoutName || "Untitled Layout",
      elements,
      metadata: {
        exportedAt: new Date().toISOString(),
        snapToGrid,
        version: "1.0"
      }
    };

    const dataStr = JSON.stringify(layoutData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${layoutName || "layout"}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success("Layout exported successfully!");
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layoutData = JSON.parse(e.target?.result as string);
        setLayoutName(layoutData.name || "Imported Layout");
        
        const importedElements = layoutData.elements.map((el: any) => ({
          ...el,
          position: el.position || [el.xPosition, el.yPosition] || [100, 100],
        }));
        
        setElements(importedElements);
        toast.success(`Imported layout: ${layoutData.name}`);
      } catch (error) {
        console.error("Error importing layout:", error);
        toast.error("Failed to import layout");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Layout Designer</h2>
            <p className="text-sm text-gray-600">Design your restaurant layout</p>
          </div>

          {/* Layout Name */}
          <div>
            <Label htmlFor="layout-name" className="text-sm font-medium mb-2 block">
              Layout Name
            </Label>
            <Input
              id="layout-name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Enter layout name..."
              className="mb-3"
            />
            
            {/* Layout Selector */}
            <div className="mb-3">
              <Label htmlFor="layout-selector" className="text-sm font-medium mb-2 block">
                Load Layout
              </Label>
              <select
                id="layout-selector"
                value={selectedLayoutId}
                onChange={(e) => setSelectedLayoutId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="current">Current Layout</option>
                {savedLayouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={loadLayout} variant="outline" size="sm" disabled={isLoading}>
                <Upload className="h-4 w-4 mr-1" />
                Load
              </Button>
              <Button onClick={exportLayout} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Eye className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importLayout}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Tables</Label>
              <div className="space-y-2">
                <Button 
                  onClick={() => addTable("circle")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Add Round Table
                </Button>
                <Button 
                  onClick={() => addTable("square")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Add Square Table
                </Button>
              </div>
            </div>

            {/* Merge Tables */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Merge Tables</Label>
              <div className="space-y-2">
                <Button 
                  onClick={handleMergeTables}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={selectedTables.length < 2}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Merge Selected ({selectedTables.length})
                </Button>
                {selectedTables.length > 0 && (
                  <Button 
                    onClick={() => {
                      setSelectedTables([]);
                      setSelectedElement(null);
                    }}
                    className="w-full justify-start"
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>

            {/* Auto Arrange */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Layout Tools</Label>
              <div className="space-y-2">
                <Button 
                  onClick={autoArrangeTables}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Auto Arrange Grid
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Zones</Label>
              <Button 
                onClick={addZone}
                className="w-full justify-start"
                variant="outline"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Label htmlFor="snap-grid" className="text-sm font-medium">
                  Snap to Grid
                </Label>
                <Switch
                  id="snap-grid"
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                />
              </div>
              
              {/* Instructions */}
              <div className="mt-4 text-xs text-gray-600 space-y-1">
                <p><strong>Grid Layout:</strong> Tables arranged in grid by default</p>
                <p><strong>Drag:</strong> Click and drag to move tables</p>
                <p><strong>Multi-select:</strong> Ctrl/Cmd + click to select multiple</p>
                <p><strong>Merge:</strong> Select 2+ tables and click merge</p>
                <p><strong>Auto Arrange:</strong> Reorganize tables in grid</p>
              </div>
            </div>
          </div>

          {/* Selected Element Info */}
          {selectedElement && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-3">Selected Element</h3>
              <div className="space-y-3">
                {(() => {
                  const element = elements.find(el => el.id === selectedElement);
                  if (!element) return null;
                  
                  return (
                    <div className="space-y-3">
                      {/* Element Name */}
                      <div>
                        <Label className="text-xs font-medium">Name</Label>
                        <Input
                          value={element.label}
                          onChange={(e) => updateElementProperty(element.id, "label", e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      {/* Table-specific properties */}
                      {element.type === "table" && (
                        <>
                          <div>
                            <Label className="text-xs font-medium">Capacity</Label>
                            <Input
                              type="number"
                              value={element.capacity}
                              onChange={(e) => updateElementProperty(element.id, "capacity", parseInt(e.target.value))}
                              className="text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium">Status</Label>
                            <select
                              value={element.status}
                              onChange={(e) => updateElementProperty(element.id, "status", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="available">Available</option>
                              <option value="occupied">Occupied</option>
                              <option value="reserved">Reserved</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="disabled">Disabled</option>
                              <option value="cleaning">Cleaning</option>
                            </select>
                          </div>
                        </>
                      )}

                      <Button
                        onClick={() => deleteElement(element.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Table Layout Designer</h1>
              <p className="text-sm text-gray-600">Drag and drop to arrange your restaurant layout</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={loadLayout} variant="outline" disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                Load Layout
              </Button>
              <Button onClick={saveLayout} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Layout"}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-gray-50 overflow-hidden"
          style={{ backgroundImage: snapToGrid ? 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)' : 'none', backgroundSize: '20px 20px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move transition-all duration-200 ${
                selectedTables.includes(element.id)
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'hover:shadow-lg'
              } ${isDragging && selectedTables.includes(element.id) ? 'z-50' : 'z-10'}`}
              style={{
                left: element.position[0],
                top: element.position[1],
                transform: selectedElement === element.id ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              {element.type === "table" ? (
                <div
                  className={`relative flex items-center justify-center text-white font-semibold ${
                    element.shape === "circle" ? "rounded-full" : "rounded-lg"
                  } ${getStatusColor(element.status)} shadow-sm hover:shadow-md transition-shadow`}
                  style={{
                    width: element.size,
                    height: element.size,
                  }}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold">{element.label}</div>
                    <div className="text-xs opacity-90">{element.capacity}</div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute -top-1 -right-1">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(element.status)} border-2 border-white`}></div>
                  </div>

                  {/* Selection indicator */}
                  {selectedTables.includes(element.id) && (
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="relative border-2 border-dashed border-gray-400 bg-gray-100/50 rounded-lg flex items-center justify-center"
                  style={{
                    width: element.width,
                    height: element.height,
                  }}
                >
                  <div className="text-gray-600 font-medium text-sm">
                    {element.label}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Grid overlay indicator */}
          {snapToGrid && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Grid3X3 className="h-4 w-4" />
                <span>Grid Snap: ON</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Move className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Start designing your layout</p>
                <p className="text-sm">Add tables and zones from the sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}