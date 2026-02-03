
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorldMap } from './components/WorldMap';
import { GeminiPanel } from './components/GeminiPanel';
import { SystemView } from './components/SystemView';
import { generateMap, processTurn, getHousingCap, getMovementCost, isValidMove, initializeCivilizations } from './services/gameLogic';
import { GameState, Act, IMPROVEMENTS, Tile, UnitType, UNIT_DEFINITIONS, TECHS, Tech, DISTRICTS, DistrictType, ResourceType, RESOURCES, CIVILIZATIONS, CivilizationName } from './types';
import { Clock, Database, Hammer, Coins, Eye, EyeOff, Map as MapIcon, Users, Navigation, Castle, CloudRain, CloudSnow, Sun, CloudLightning, Sparkles, Sword, FlaskConical, Target, BookOpen, X, Check, Lock, Landmark, Settings, RefreshCw, Save, Download, Orbit, Rocket, Wheat, Globe2 } from 'lucide-react';

// MiniMap Component
const MiniMap = ({ tiles, selectedTileId, cameraPos }: { tiles: Tile[], selectedTileId: string | null, cameraPos: {x: number, z: number} }) => {
    const size = 150;
    // Calculate bounds to normalize coordinates
    const coords = useMemo(() => {
        if (!tiles.length) return [];
        return tiles.map(t => {
            // Simplified Hex to pixel conversion for 2D minimap
            const x = 3/2 * t.q;
            const y = Math.sqrt(3) * (t.r + t.q/2);
            return { id: t.id, x, y, type: t.terrain, owner: t.ownerId, isSelected: t.id === selectedTileId, hasCity: t.structure === 'city' };
        });
    }, [tiles, selectedTileId]);

    const getColor = (type: string) => {
        switch(type) {
            case 'ocean': return '#1e40af';
            case 'coast': return '#38bdf8';
            case 'forest': return '#166534';
            case 'mountains': return '#4b5563';
            case 'desert': return '#eab308';
            case 'swamp': return '#365314';
            case 'tundra': return '#cbd5e1';
            case 'shrubland': return '#847e4b';
            case 'savanna': return '#cbbd6d';
            default: return '#65a30d'; // Plains
        }
    };

    return (
        <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-2 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1">
                <MapIcon size={12} /> World Map
            </div>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`-${size/2} -${size/2} ${size} ${size}`}>
                    {coords.map((c) => (
                        <circle 
                            key={c.id} 
                            cx={c.x * 2} 
                            cy={c.y * 2}
                            r={c.isSelected ? 2.5 : (c.hasCity ? 2.5 : 1.5)}
                            fill={c.isSelected ? '#fbbf24' : (c.hasCity ? (c.owner ? '#ef4444' : '#ffffff') : getColor(c.type))}
                            className="transition-colors duration-300"
                        />
                    ))}
                    {/* Camera View Indicator */}
                    <rect 
                        x={(cameraPos.x * 2) - 15}
                        y={(cameraPos.z * 2) - 10}
                        width={30}
                        height={20}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeOpacity="0.7"
                    />
                    
                    {/* Center Crosshair */}
                    <line x1="-4" y1="0" x2="4" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                    <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                </svg>
            </div>
        </div>
    );
};

const CivSelectionModal = ({ onSelect }: { onSelect: (civ: CivilizationName) => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-8 animate-fade-in">
            <div className="max-w-6xl w-full flex flex-col gap-8">
                <div className="text-center space-y-2">
                    <h1 className="cinzel text-5xl font-bold text-white tracking-widest drop-shadow-lg">CHOOSE YOUR CIVILIZATION</h1>
                    <p className="text-slate-400 text-lg">The history of the world is waiting to be written.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(Object.keys(CIVILIZATIONS) as CivilizationName[]).map(civName => {
                        const civ = CIVILIZATIONS[civName];
                        return (
                            <button 
                                key={civName}
                                onClick={() => onSelect(civName)}
                                className="group relative bg-slate-900 border border-slate-700 hover:border-white/50 rounded-xl p-6 text-left transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: civ.color }} />
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <h3 className="cinzel text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">{civ.name}</h3>
                                    <p className="text-slate-400 text-sm mb-4 flex-grow">{civ.description}</p>
                                    
                                    <div className="space-y-3">
                                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                                            <div className="text-xs text-slate-500 font-bold uppercase mb-1">Civilization Bonus</div>
                                            <div className="text-sm text-green-400 font-bold">{civ.bonus}</div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {civ.startingTechs.map(tech => (
                                                <span key={tech} className="px-2 py-1 bg-purple-900/30 text-purple-300 text-[10px] rounded border border-purple-500/30 uppercase font-bold">
                                                    {TECHS[tech]?.name || tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 text-center py-2 bg-white/10 rounded text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        SELECT
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TechTreeModal = ({ 
    isOpen, 
    onClose, 
    researchedTechs, 
    currentScience,
    onResearch,
    currentAct
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    researchedTechs: string[];
    currentScience: number;
    onResearch: (tech: Tech) => void;
    currentAct: Act;
}) => {
    const [activeTree, setActiveTree] = useState<'standard' | 'advance'>('standard');
    
    // Check if Advance Tree is unlocked (Act IX is Atomic Age, which follows Machine Age Act VIII)
    const isAdvanceUnlocked = currentAct === Act.IX;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-full max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 shrink-0">
                    <div>
                        <h2 className="cinzel text-2xl text-white flex items-center gap-3">
                            <BookOpen className="text-purple-400" /> Technology Tree
                        </h2>
                        <div className="text-slate-400 text-sm mt-1">
                            Available Science: <span className="text-purple-400 font-bold">{currentScience}</span>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button 
                            onClick={() => setActiveTree('standard')}
                            className={`px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2 ${activeTree === 'standard' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Standard Era
                        </button>
                        <button 
                            onClick={() => isAdvanceUnlocked && setActiveTree('advance')}
                            disabled={!isAdvanceUnlocked}
                            className={`px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2 ${activeTree === 'advance' ? 'bg-purple-900 text-purple-100 shadow' : isAdvanceUnlocked ? 'text-slate-500 hover:text-purple-300' : 'text-slate-700 cursor-not-allowed'}`}
                        >
                            {isAdvanceUnlocked ? <Rocket size={14}/> : <Lock size={14}/>} 
                            Advanced Era
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <X className="text-slate-400" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-950/50 relative">
                     {!isAdvanceUnlocked && activeTree === 'advance' ? (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                             <Lock size={48} className="mb-4 opacity-50"/>
                             <h3 className="text-xl font-bold mb-2">Advanced Tech Locked</h3>
                             <p>Complete the Machine Age (Act VIII) to unlock the future.</p>
                         </div>
                     ) : (
                         /* Tech Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.values(TECHS)
                                .filter(t => t.tree === activeTree)
                                .map(tech => {
                                const isResearched = researchedTechs.includes(tech.id);
                                const canResearch = !isResearched && tech.prerequisites.every(req => researchedTechs.includes(req));
                                
                                return (
                                    <div 
                                        key={tech.id} 
                                        className={`relative p-5 rounded-lg border-2 transition group ${
                                            isResearched ? 'bg-purple-900/20 border-purple-500/50' : 
                                            canResearch ? 'bg-slate-800 border-slate-600 hover:border-purple-400 cursor-pointer' : 
                                            'bg-slate-900/50 border-slate-800 opacity-60'
                                        }`}
                                        onClick={() => canResearch && onResearch(tech)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-lg ${isResearched ? 'text-purple-300' : 'text-slate-200'}`}>{tech.name}</h3>
                                            {isResearched ? <Check size={18} className="text-purple-400"/> : canResearch ? null : <Lock size={16} className="text-slate-600"/>}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3 h-10">{tech.description}</p>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1 text-purple-400 font-mono">
                                                <FlaskConical size={12}/> {tech.cost} Science
                                            </div>
                                            {tech.unlocks.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {tech.unlocks.slice(0, 3).map((u, i) => (
                                                        <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 text-[10px]">{u}</span>
                                                    ))}
                                                    {tech.unlocks.length > 3 && <span>...</span>}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Action Overlay */}
                                        {canResearch && (
                                            <div className="absolute inset-0 bg-purple-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-md">
                                                <span className="font-bold text-white flex items-center gap-2">Research <FlaskConical size={16}/></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const SystemMenuModal = ({
    isOpen,
    onClose,
    onNewGame,
    onSaveGame,
    onLoadGame,
    showResources,
    setShowResources,
    showPopulation,
    setShowPopulation
}: {
    isOpen: boolean;
    onClose: () => void;
    onNewGame: () => void;
    onSaveGame: () => void;
    onLoadGame: () => void;
    showResources: boolean;
    setShowResources: (v: boolean) => void;
    showPopulation: boolean;
    setShowPopulation: (v: boolean) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 w-80 rounded-xl shadow-2xl p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h2 className="cinzel text-xl text-white flex items-center gap-2"><Settings size={20}/> System Menu</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-300 text-sm font-bold uppercase flex items-center gap-2"><Eye size={16}/> Resources</span>
                        <button 
                            onClick={() => setShowResources(!showResources)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${showResources ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${showResources ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-300 text-sm font-bold uppercase flex items-center gap-2"><Users size={16}/> Population</span>
                        <button 
                            onClick={() => setShowPopulation(!showPopulation)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${showPopulation ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${showPopulation ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => { onSaveGame(); onClose(); }}
                            className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                        >
                            <Save size={14} /> SAVE
                        </button>
                        <button 
                            onClick={() => { onLoadGame(); onClose(); }}
                            className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                        >
                            <Download size={14} /> LOAD
                        </button>
                    </div>

                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to start a new game? Current progress will be lost.")) {
                                onNewGame();
                                onClose();
                            }
                        }}
                        className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-900/50 rounded font-bold transition flex items-center justify-center gap-2 text-sm"
                    >
                        <RefreshCw size={16} /> NEW GAME
                    </button>
                </div>
             </div>
        </div>
    )
}

const WeatherIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'rain': return <CloudRain size={16} className="text-blue-400" />;
        case 'snow': return <CloudSnow size={16} className="text-white" />;
        case 'storm': return <CloudLightning size={16} className="text-purple-400" />;
        default: return <Sun size={16} className="text-yellow-400" />;
    }
}

function App() {
    // Initial State
    const [gameState, setGameState] = useState<GameState>({
        act: Act.I,
        turn: 1,
        treasury: 500,
        science: 0,
        researchedTechs: ['agriculture'], 
        inventory: { grain: 0, wood: 0, ore: 0, food: 0, lumber: 0, tools: 0, amenities: 0, fabric: 0, salted_fish: 0, metal_tool: 0 },
        tiles: [],
        units: [],
        selectedTileId: null,
        processingTurn: false,
        logs: ['Welcome to Chronos. Act I begins.'],
        cameraMode: 'orbit',
        weather: 'clear',
        playerCivilization: null // Initialize as null to trigger selection
    });

    const [gameId, setGameId] = useState(0); // Force re-render of map on new game
    const [showResources, setShowResources] = useState(false);
    const [showPopulation, setShowPopulation] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
    const [cameraPos, setCameraPos] = useState({ x: 0, z: 0 });
    const [focusTarget, setFocusTarget] = useState<{x: number, z: number} | null>(null);
    const [moveMode, setMoveMode] = useState<{unitId: string, originId: string} | null>(null);
    const [viewMode, setViewMode] = useState<'world' | 'system'>('world');

    // Generate Map on Mount
    useEffect(() => {
        handleNewGame(true);
    }, []);

    const handleNewGame = (skipConfirm = false) => {
        const initialMap = generateMap();
        setGameState({
            act: Act.I,
            turn: 1,
            treasury: 500,
            science: 0,
            researchedTechs: ['agriculture'], 
            inventory: { grain: 0, wood: 0, ore: 0, food: 0, lumber: 0, tools: 0, amenities: 0, fabric: 0, salted_fish: 0, metal_tool: 0 },
            tiles: initialMap.tiles,
            units: initialMap.units,
            selectedTileId: null,
            processingTurn: false,
            logs: ['New Game Started. Choose your Civilization.'],
            cameraMode: 'orbit',
            weather: 'clear',
            playerCivilization: null // Ensure this is null to show selection modal
        });
        setGameId(prev => prev + 1); // Force map recreation
        setFocusTarget({x: 0, z: 0}); // Reset camera focus roughly to center
        setTimeout(() => setFocusTarget(null), 100);
    };

    const handleCivSelect = (civName: CivilizationName) => {
        const civ = CIVILIZATIONS[civName];
        
        // Initialize Player and AI units on the existing map
        const { updatedTiles, units } = initializeCivilizations(gameState.tiles, civName);

        setGameState(prev => ({
            ...prev,
            tiles: updatedTiles,
            units: units,
            playerCivilization: civName,
            researchedTechs: Array.from(new Set([...prev.researchedTechs, ...civ.startingTechs])),
            logs: [`The ${civ.name} civilization rises! ${civ.description}`, ...prev.logs],
            // Auto select the first player unit
            selectedTileId: units.find(u => u.owner === 'player')?.tileId || null
        }));

        // Focus camera on start
        const startUnit = units.find(u => u.owner === 'player');
        if (startUnit) {
            const startTile = updatedTiles.find(t => t.id === startUnit.tileId);
            if (startTile) {
                const x = 3/2 * startTile.q;
                const z = Math.sqrt(3) * (startTile.r + startTile.q/2);
                setTimeout(() => {
                    setFocusTarget({ x, z });
                    setTimeout(() => setFocusTarget(null), 100);
                }, 100);
            }
        }
    };

    const handleSaveGame = () => {
        try {
            localStorage.setItem('chronos_save_v1', JSON.stringify(gameState));
            setGameState(prev => ({ ...prev, logs: ['Game saved successfully.', ...prev.logs] }));
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save game. Local storage might be full.");
        }
    };

    const handleLoadGame = () => {
        try {
            const savedData = localStorage.getItem('chronos_save_v1');
            if (savedData) {
                const loadedState = JSON.parse(savedData);
                setGameState({ ...loadedState, logs: ['Game loaded from save.', ...loadedState.logs] });
                setGameId(prev => prev + 1); // Force map recreation on load
                // Reset complex UI states
                setMoveMode(null);
                setFocusTarget({x: 0, z: 0}); // Recenter slightly
                setTimeout(() => setFocusTarget(null), 100);
            } else {
                alert("No saved game found.");
            }
        } catch (e) {
            console.error("Load failed", e);
            alert("Failed to load save file.");
        }
    };

    const handleTileSelect = (id: string) => {
        // If in move mode, attempt to move
        if (moveMode) {
            const unit = gameState.units.find(u => u.id === moveMode.unitId);
            if (unit && unit.tileId === moveMode.originId) {
                const origin = gameState.tiles.find(t => t.id === moveMode.originId);
                const target = gameState.tiles.find(t => t.id === id);
                
                if (origin && target && unit.moves > 0) {
                    const dist = (Math.abs(origin.q - target.q) + Math.abs(origin.q + origin.r - target.q - target.r) + Math.abs(origin.r - target.r)) / 2;
                    const moveCost = getMovementCost(gameState.weather, target.hasRoad || false);

                    if (dist === 1) {
                        if (isValidMove(unit, target)) {
                            if (unit.moves >= moveCost) {
                                 setGameState(prev => ({
                                    ...prev,
                                    units: prev.units.map(u => u.id === unit.id ? { ...u, tileId: id, moves: u.moves - moveCost } : u),
                                    logs: [`Unit moved to ${id} (Cost: ${moveCost})`, ...prev.logs],
                                    selectedTileId: id
                                 }));
                            } else {
                                 setGameState(prev => ({ ...prev, logs: [`Not enough movement points. Need ${moveCost}.`, ...prev.logs] }));
                            }
                        } else {
                             setGameState(prev => ({ ...prev, logs: ["Unit cannot enter this terrain.", ...prev.logs] }));
                        }
                    } else {
                         setGameState(prev => ({ ...prev, logs: ["Cannot move there. Too far.", ...prev.logs] }));
                    }
                }
            }
            setMoveMode(null);
            return;
        }

        setGameState(prev => ({ ...prev, selectedTileId: id }));
    };

    const handleCameraMove = useCallback((x: number, z: number) => {
        setCameraPos({ x, z });
    }, []);

    const handleFocusHome = () => {
        const target = gameState.units.find(u => u.owner === 'player') 
            || gameState.tiles.find(t => t.structure === 'city' && t.ownerId === 'player');

        if (target) {
            const tile = 'tileId' in target 
                ? gameState.tiles.find(t => t.id === target.tileId) 
                : target as Tile;
            
            if (tile) {
                const size = 1.2;
                const x = size * (3/2 * tile.q);
                const z = size * Math.sqrt(3) * (tile.r + tile.q/2);
                setFocusTarget({ x, z });
                setTimeout(() => setFocusTarget(null), 100);
            }
        }
    };

    const handleBuild = (improvementKey: string) => {
        if (!gameState.selectedTileId) return;
        const imp = IMPROVEMENTS[improvementKey];
        const tile = gameState.tiles.find(t => t.id === gameState.selectedTileId);
        
        // Validation
        if (!tile) return;
        if (imp.terrainRequired && !imp.terrainRequired.includes(tile.terrain)) {
            alert(`Must build on ${imp.terrainRequired.join(' or ')}`);
            return;
        }

        if (gameState.treasury < imp.cost) {
            alert("Insufficient funds!");
            return;
        }

        // Validate Resource Costs
        const missingResources: string[] = [];
        if (imp.buildCost) {
            for (const [res, amount] of Object.entries(imp.buildCost)) {
                if ((gameState.inventory[res as ResourceType] || 0) < (amount as number)) {
                    missingResources.push(`${amount} ${RESOURCES[res as ResourceType]?.name || res}`);
                }
            }
        }

        if (missingResources.length > 0) {
            alert(`Insufficient resources: ${missingResources.join(', ')}`);
            return;
        }
        
        // Special case for ROAD (does not replace existing improvements)
        if (improvementKey === 'road') {
             setGameState(prev => {
                const newTiles = prev.tiles.map(t => {
                    if (t.id === prev.selectedTileId) {
                        return { ...t, hasRoad: true };
                    }
                    return t;
                });
                
                // Deduct Resources
                const newInventory = { ...prev.inventory };
                if (imp.buildCost) {
                    for (const [res, amount] of Object.entries(imp.buildCost)) {
                        newInventory[res as ResourceType] = (newInventory[res as ResourceType] || 0) - (amount as number);
                    }
                }

                return {
                    ...prev,
                    tiles: newTiles,
                    inventory: newInventory,
                    treasury: prev.treasury - imp.cost,
                    logs: [`Constructed Road for $${imp.cost}`, ...prev.logs]
                };
            });
            return;
        }

        setGameState(prev => {
            const newTiles = prev.tiles.map(t => {
                if (t.id === prev.selectedTileId) {
                    return { ...t, improvement: imp };
                }
                return t;
            });

            // Deduct Resources
            const newInventory = { ...prev.inventory };
            if (imp.buildCost) {
                for (const [res, amount] of Object.entries(imp.buildCost)) {
                    newInventory[res as ResourceType] = (newInventory[res as ResourceType] || 0) - (amount as number);
                }
            }

            return {
                ...prev,
                tiles: newTiles,
                inventory: newInventory,
                treasury: prev.treasury - imp.cost,
                logs: [`Built ${imp.name} for $${imp.cost}`, ...prev.logs]
            };
        });
    };
    
    const handleBuildDistrict = (districtKey: DistrictType) => {
        if (!gameState.selectedTileId) return;
        const district = DISTRICTS[districtKey];
        const tile = gameState.tiles.find(t => t.id === gameState.selectedTileId);
        
        if (!tile || tile.structure !== 'city') return;
        if (tile.districts?.includes(districtKey)) return;
        
        if (gameState.treasury < district.cost) {
            alert("Insufficient funds!");
            return;
        }

        setGameState(prev => {
             const newTiles = prev.tiles.map(t => {
                if (t.id === prev.selectedTileId) {
                    return { ...t, districts: [...(t.districts || []), districtKey] };
                }
                return t;
            });
            return {
                ...prev,
                tiles: newTiles,
                treasury: prev.treasury - district.cost,
                logs: [`Constructed ${district.name} in city for $${district.cost}`, ...prev.logs]
            };
        });
    };

    const handleResearch = (tech: Tech) => {
        if (gameState.science < tech.cost) {
            alert("Insufficient Science!");
            return;
        }
        setGameState(prev => ({
            ...prev,
            science: prev.science - tech.cost,
            researchedTechs: [...prev.researchedTechs, tech.id],
            logs: [`Researched ${tech.name}!`, ...prev.logs]
        }));
    };

    const handleTrainUnit = (unitType: UnitType) => {
        if (!gameState.selectedTileId) return;
        const def = UNIT_DEFINITIONS[unitType];
        
        if (gameState.treasury < def.cost) {
            alert("Insufficient funds!");
            return;
        }

        const newUnitId = `u_${Date.now()}`;

        setGameState(prev => ({
            ...prev,
            treasury: prev.treasury - def.cost,
            units: [...prev.units, {
                id: newUnitId,
                type: unitType,
                tileId: prev.selectedTileId!,
                moves: def.moves,
                maxMoves: def.moves,
                owner: 'player'
            }],
            logs: [`Trained ${def.name} for $${def.cost}`, ...prev.logs]
        }));
    };

    const handleFoundCity = (unitId: string) => {
        const unit = gameState.units.find(u => u.id === unitId);
        if (!unit) return;

        setGameState(prev => {
            const newUnits = prev.units.filter(u => u.id !== unitId);
            const newTiles = prev.tiles.map(t => {
                if (t.id === unit.tileId) {
                    return { ...t, structure: 'city' as const, ownerId: 'player', population: Math.max(t.population, 5), districts: [] };
                }
                return t;
            });
            return {
                ...prev,
                units: newUnits,
                tiles: newTiles,
                logs: [`City founded at ${unit.tileId}!`, ...prev.logs]
            };
        });
    };

    const handleEndTurn = () => {
        setMoveMode(null);
        const nextState = processTurn(gameState);
        setGameState(nextState);
    };

    // Derived Selection Data
    const selectedTile = gameState.tiles.find(t => t.id === gameState.selectedTileId);
    const selectedUnit = selectedTile ? gameState.units.find(u => u.tileId === selectedTile.id) : null;
    const housingCap = selectedTile ? getHousingCap(selectedTile) : 0;
    const currentMoveCost = getMovementCost(gameState.weather, selectedTile?.hasRoad || false);

    // Derived Food Stats
    const validEdibles: ResourceType[] = ['food', 'bread', 'canned_food', 'fresh_produce', 'cured_meat', 'fish', 'grain', 'grape'];
    const totalFood = validEdibles.reduce((acc, res) => acc + (gameState.inventory[res] || 0), 0);
    const totalPop = gameState.tiles.reduce((acc, t) => t.ownerId === 'player' ? acc + t.population : acc, 0);

    // If viewing system, render that instead
    if (viewMode === 'system') {
        return <SystemView onBack={() => setViewMode('world')} researchedTechs={gameState.researchedTechs} />;
    }

    return (
        <div className="w-full h-screen flex relative overflow-hidden">
            {/* Civilization Selection Modal */}
            {!gameState.playerCivilization && (
                <CivSelectionModal onSelect={handleCivSelect} />
            )}

            {/* 3D World Layer */}
            <div className="absolute inset-0 z-0 bg-black">
                 <WorldMap 
                    key={gameId} // Force remount when game ID changes
                    tiles={gameState.tiles} 
                    units={gameState.units}
                    onTileSelect={handleTileSelect}
                    selectedTileId={gameState.selectedTileId}
                    showResources={showResources}
                    showPopulation={showPopulation}
                    onCameraMove={handleCameraMove}
                    weather={gameState.weather}
                    focusTarget={focusTarget}
                    act={gameState.act}
                    playerColor={gameState.playerCivilization ? CIVILIZATIONS[gameState.playerCivilization].color : '#3b82f6'}
                 />
            </div>

            {/* Tech Tree Modal */}
            <TechTreeModal 
                isOpen={isTechTreeOpen}
                onClose={() => setIsTechTreeOpen(false)}
                researchedTechs={gameState.researchedTechs}
                currentScience={gameState.science}
                onResearch={handleResearch}
                currentAct={gameState.act}
            />

            {/* System Menu Modal */}
            <SystemMenuModal 
                isOpen={isSystemMenuOpen}
                onClose={() => setIsSystemMenuOpen(false)}
                onNewGame={() => handleNewGame()}
                onSaveGame={handleSaveGame}
                onLoadGame={handleLoadGame}
                showResources={showResources}
                setShowResources={setShowResources}
                showPopulation={showPopulation}
                setShowPopulation={setShowPopulation}
            />

            {/* UI Overlay Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
                
                {/* Top Bar: Resources */}
                <div className="bg-slate-900/90 backdrop-blur text-white p-4 flex justify-between items-center border-b border-slate-700 pointer-events-auto">
                    <div className="flex gap-6 items-center">
                        <div className="flex flex-col">
                            <h1 className="cinzel text-xl font-bold text-yellow-500 tracking-wider">CHRONOS</h1>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-1">
                                {gameState.playerCivilization ? gameState.playerCivilization.toUpperCase() : 'UNKNOWN EMPIRE'}
                            </span>
                        </div>
                        <span className="text-sm px-3 py-1 bg-slate-800 rounded-full border border-slate-600">{gameState.act}</span>
                        <div className="flex gap-4 text-sm font-mono text-slate-300">
                             <div className="flex items-center gap-1"><Clock size={14}/> Turn {gameState.turn}</div>
                             <div className="flex items-center gap-1 text-yellow-400"><Coins size={14}/> {gameState.treasury}</div>
                             <div className="flex items-center gap-1 text-purple-400 font-bold" title="Science Points"><FlaskConical size={14}/> {gameState.science}</div>
                             <div className="flex items-center gap-1 text-green-400 font-bold" title="Food Supply / Demand"><Wheat size={14}/> {totalFood} / {totalPop}</div>
                             <div className="flex items-center gap-1 text-blue-200 border-l border-slate-700 pl-4 uppercase font-bold text-xs" title="Current Weather">
                                <WeatherIcon type={gameState.weather} /> {gameState.weather}
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm items-center">
                        
                        <button 
                            onClick={() => setViewMode('system')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded bg-indigo-900/50 border border-indigo-500/50 hover:bg-indigo-800 hover:border-indigo-400 transition text-xs font-bold text-indigo-200 group"
                            title="View Solar System"
                        >
                            <Orbit size={14} className="text-indigo-400 group-hover:animate-spin-slow"/> SYSTEM
                        </button>

                        <button 
                            onClick={() => setIsTechTreeOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 hover:border-purple-400 transition text-xs font-bold mr-4 group"
                        >
                            <BookOpen size={14} className="text-purple-400 group-hover:text-purple-300"/> TECH TREE
                        </button>
                        
                        <div className="flex gap-2 text-xs">
                             {Object.entries(gameState.inventory).slice(0, 5).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
                                    <span className="opacity-70 uppercase text-[10px]">{key.replace('_', ' ')}</span>
                                    <span className="font-bold">{val}</span>
                                </div>
                             ))}
                        </div>

                        <div className="w-px h-6 bg-slate-700 mx-2" />
                        
                        <button 
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold transition ${isPanelOpen ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <Sparkles size={14} />
                            <span>AI VISION</span>
                        </button>
                        
                        <button 
                            onClick={() => setIsSystemMenuOpen(true)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="System Menu"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Left Side: Game Info & Logs */}
                <div className="pointer-events-none flex-1 flex">
                    <div className="w-64 p-4 flex flex-col justify-end pointer-events-auto gap-4">
                        <div className="bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-700 max-h-60 overflow-y-auto">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Event Log</h3>
                            <ul className="text-xs space-y-1 text-slate-300 font-mono">
                                {gameState.logs.map((log, i) => (
                                    <li key={i} className="border-b border-slate-800 pb-1 last:border-0">{log}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Action Panel & Minimap */}
                <div className="bg-slate-900/90 backdrop-blur p-6 border-t border-slate-700 pointer-events-auto flex justify-between items-end gap-6 max-h-[400px]">
                    
                    {/* Selected Tile Info */}
                    <div className="flex-1 max-w-xl overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                        {selectedTile ? (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <h2 className="cinzel text-lg text-white">
                                            {selectedTile.structure === 'city' ? 'CITY' : (selectedTile.improvement?.name || selectedTile.terrain.toUpperCase())}
                                        </h2>
                                        {selectedUnit && (
                                             <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: gameState.playerCivilization ? CIVILIZATIONS[gameState.playerCivilization].color : '#60a5fa' }}>
                                                <Users size={12}/> {UNIT_DEFINITIONS[selectedUnit.type].name} ({selectedUnit.moves}/{selectedUnit.maxMoves} Moves)
                                             </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Toggles removed from here as they are now in System Menu */}
                                    </div>
                                </div>
                                
                                <div className="text-xs text-slate-400 mb-4 flex gap-4">
                                    <span className={selectedTile.population >= housingCap ? 'text-red-400 font-bold' : ''}>
                                        Population: {selectedTile.population} / {housingCap} {selectedTile.population >= housingCap && '(CAPPED)'}
                                    </span>
                                    <span>Res: {selectedTile.resource ? selectedTile.resource.replace('_', ' ').toUpperCase() : 'None'}</span>
                                    <span>Coords: {selectedTile.id}</span>
                                    {selectedTile.hasRoad && <span className="text-amber-500 font-bold">[ROAD]</span>}
                                    {selectedTile.structure === 'city' && selectedTile.districts && selectedTile.districts.length > 0 && (
                                        <div className="flex gap-1">
                                            {selectedTile.districts.map(d => (
                                                <span key={d} className="bg-blue-900/50 text-blue-200 px-1 rounded text-[10px] uppercase border border-blue-500/30" title={DISTRICTS[d].name}>
                                                    {DISTRICTS[d].name.split(' ')[0]}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* UNIT ACTIONS */}
                                {selectedUnit && selectedUnit.owner === 'player' && (
                                    <div className="mb-4 flex gap-2 border-b border-slate-700 pb-4">
                                        <button
                                            onClick={() => setMoveMode({ unitId: selectedUnit.id, originId: selectedTile.id })}
                                            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 border transition ${moveMode?.unitId === selectedUnit.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
                                            disabled={selectedUnit.moves < currentMoveCost}
                                            title={`Move Cost: ${currentMoveCost}`}
                                        >
                                            <Navigation size={14}/> 
                                            {moveMode ? 'Select Dest...' : `Move`}
                                        </button>
                                        
                                        {selectedUnit.type === 'settler' && !selectedTile.structure && (
                                            <button
                                                onClick={() => handleFoundCity(selectedUnit.id)}
                                                className="px-4 py-2 rounded text-xs font-bold flex items-center gap-2 border bg-amber-700 border-amber-500 hover:bg-amber-600 text-white transition"
                                            >
                                                <Castle size={14}/> Found City
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* CITY DISTRICTS */}
                                {selectedTile.structure === 'city' && (
                                    <div className="mb-4 border-b border-slate-700 pb-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Landmark size={12}/> City Districts</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.values(DISTRICTS).map(dist => {
                                                const isBuilt = selectedTile.districts?.includes(dist.type);
                                                const techUnlocked = gameState.researchedTechs.includes(dist.techRequired);
                                                const canAfford = gameState.treasury >= dist.cost;
                                                
                                                if (!techUnlocked) return null;

                                                return (
                                                    <button
                                                        key={dist.type}
                                                        onClick={() => !isBuilt && handleBuildDistrict(dist.type)}
                                                        disabled={isBuilt || !canAfford}
                                                        className={`px-3 py-2 border rounded text-xs flex flex-col items-start min-w-[120px] transition relative overflow-hidden ${isBuilt ? 'bg-blue-900/40 border-blue-500 cursor-default' : canAfford ? 'bg-slate-800 hover:bg-slate-700 border-slate-600' : 'bg-slate-800 opacity-50 border-slate-700 cursor-not-allowed'}`}
                                                    >
                                                        <div className="flex justify-between w-full items-center mb-1">
                                                            <span className={`font-bold ${isBuilt ? 'text-blue-300' : 'text-white'}`}>{dist.name}</span>
                                                            {isBuilt && <Check size={12} className="text-blue-400"/>}
                                                        </div>
                                                        {!isBuilt && <div className="text-yellow-500 text-[10px] mb-1">${dist.cost}</div>}
                                                        <div className="text-[9px] text-slate-400">{dist.bonuses[0]}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* CITY TRAINING */}
                                {selectedTile.structure === 'city' && (
                                    <div className="mb-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Sword size={12}/> Recruit Units</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(UNIT_DEFINITIONS).map(([type, def]) => {
                                                const techUnlocked = !def.techRequired || gameState.researchedTechs.includes(def.techRequired);
                                                const districtMet = !def.districtRequired || selectedTile.districts?.includes(def.districtRequired);
                                                
                                                if (!techUnlocked) return null;
                                                
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => handleTrainUnit(type as UnitType)}
                                                        disabled={gameState.treasury < def.cost || !districtMet}
                                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 rounded text-xs flex flex-col items-start min-w-[100px] transition relative group"
                                                    >
                                                        <span className="font-bold text-white">{def.name}</span>
                                                        <div className="flex justify-between w-full text-[10px] text-slate-400 mt-1">
                                                            <span className="text-yellow-500">${def.cost}</span>
                                                            <span>Str: {def.strength}</span>
                                                        </div>
                                                        
                                                        {/* Requirement Tooltip */}
                                                        {!districtMet && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-300 font-bold backdrop-blur-[1px]">
                                                                Need {DISTRICTS[def.districtRequired!].name}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* CONSTRUCTION */}
                                {!selectedTile.structure && (
                                    <div className="space-y-4 max-h-[200px] overflow-y-auto">
                                        
                                        {/* Infrastructure */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1 sticky top-0 bg-slate-900/90 py-1">Infrastructure</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(IMPROVEMENTS)
                                                    .filter(([, imp]) => 
                                                        (imp.type === 'civic' || imp.type === 'manufacturing' || imp.type === 'infrastructure' || imp.type === 'wonder') && 
                                                        (!imp.techRequired || gameState.researchedTechs.includes(imp.techRequired))
                                                    ).map(([key, imp]) => {
                                                        const reqMet = !imp.terrainRequired || (selectedTile && imp.terrainRequired.includes(selectedTile.terrain));
                                                        const canAffordRes = !imp.buildCost || Object.entries(imp.buildCost).every(([res, amount]) => (gameState.inventory[res as ResourceType] || 0) >= (amount as number));
                                                        
                                                        const isRoad = key === 'road';
                                                        const alreadyHasImprovement = !!selectedTile.improvement;
                                                        const alreadyHasRoad = !!selectedTile.hasRoad;
                                                        
                                                        const isDisabled = 
                                                            gameState.treasury < imp.cost || 
                                                            !reqMet || 
                                                            !canAffordRes || 
                                                            (!isRoad && alreadyHasImprovement) ||
                                                            (isRoad && alreadyHasRoad);

                                                        return (
                                                            <button 
                                                                key={key}
                                                                onClick={() => handleBuild(key)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border ${reqMet ? 'border-slate-600' : 'border-red-900'} rounded text-xs flex flex-col items-center min-w-[80px] transition group relative`}
                                                            >
                                                                <span className="font-bold text-slate-200">{imp.name}</span>
                                                                <span className="text-yellow-500/80 text-[10px]">${imp.cost}</span>
                                                                
                                                                {/* Resource Cost Tooltip */}
                                                                {imp.buildCost && (
                                                                    <div className="absolute bottom-full mb-2 bg-black/90 p-2 rounded border border-slate-700 hidden group-hover:block z-50 whitespace-nowrap">
                                                                        <div className="font-bold text-slate-400 mb-1">Requires:</div>
                                                                        {Object.entries(imp.buildCost).map(([res, amount]) => {
                                                                            const has = gameState.inventory[res as ResourceType] || 0;
                                                                            return (
                                                                                <div key={res} className={`flex items-center gap-1 ${has < (amount as number) ? 'text-red-400' : 'text-slate-300'}`}>
                                                                                    <span>{RESOURCES[res as ResourceType]?.icon || ''}</span>
                                                                                    <span>{amount} {RESOURCES[res as ResourceType]?.name || res}</span>
                                                                                    <span className="text-slate-500">({has})</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                })}
                                            </div>
                                        </div>
                                        
                                        {/* Gathering */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-amber-500 uppercase mb-1 sticky top-0 bg-slate-900/90 py-1">Industry & Extraction</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(IMPROVEMENTS)
                                                    .filter(([, imp]) => 
                                                        imp.type === 'gathering' && 
                                                        (!imp.techRequired || gameState.researchedTechs.includes(imp.techRequired))
                                                    ).map(([key, imp]) => {
                                                        const reqMet = !imp.terrainRequired || (selectedTile && imp.terrainRequired.includes(selectedTile.terrain));
                                                        const canAffordRes = !imp.buildCost || Object.entries(imp.buildCost).every(([res, amount]) => (gameState.inventory[res as ResourceType] || 0) >= (amount as number));

                                                        const isDisabled = 
                                                            gameState.treasury < imp.cost || 
                                                            !reqMet || 
                                                            !canAffordRes || 
                                                            !!selectedTile.improvement;

                                                        return (
                                                            <button 
                                                                key={key}
                                                                onClick={() => handleBuild(key)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border ${reqMet ? 'border-slate-600' : 'border-red-900'} rounded text-xs flex flex-col items-center min-w-[80px] transition group relative`}
                                                            >
                                                                <span className="font-bold text-slate-200">{imp.name}</span>
                                                                <span className="text-yellow-500/80 text-[10px]">${imp.cost}</span>
                                                                
                                                                {/* Resource Cost Tooltip */}
                                                                {imp.buildCost && (
                                                                    <div className="absolute bottom-full mb-2 bg-black/90 p-2 rounded border border-slate-700 hidden group-hover:block z-50 whitespace-nowrap">
                                                                        <div className="font-bold text-slate-400 mb-1">Requires:</div>
                                                                        {Object.entries(imp.buildCost).map(([res, amount]) => {
                                                                            const has = gameState.inventory[res as ResourceType] || 0;
                                                                            return (
                                                                                <div key={res} className={`flex items-center gap-1 ${has < (amount as number) ? 'text-red-400' : 'text-slate-300'}`}>
                                                                                    <span>{RESOURCES[res as ResourceType]?.icon || ''}</span>
                                                                                    <span>{amount} {RESOURCES[res as ResourceType]?.name || res}</span>
                                                                                    <span className="text-slate-500">({has})</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center">
                                <div className="text-slate-500 italic mb-2">Select a tile to inspect or build...</div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                        {/* Find Home Button */}
                        <button 
                            onClick={handleFocusHome}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg border border-slate-600 transition group mb-2 self-end"
                            title="Find Home Unit/City"
                        >
                            <Target size={20} className="text-blue-400 group-hover:text-blue-300"/>
                        </button>
                        
                        {/* Mini Map */}
                        <div className="hidden md:block">
                            <MiniMap tiles={gameState.tiles} selectedTileId={gameState.selectedTileId} cameraPos={cameraPos} />
                        </div>
                    </div>

                    {/* End Turn Button */}
                    <button 
                        onClick={handleEndTurn}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded shadow-lg shadow-amber-900/50 transform hover:scale-105 transition cinzel border border-amber-400 shrink-0"
                    >
                        PROCESS TURN
                    </button>
                </div>
            </div>

            {/* Right Side: Gemini Panel */}
            {isPanelOpen && (
                <div className="absolute right-0 top-[60px] bottom-0 z-20 pointer-events-auto flex transition-transform">
                     <GeminiPanel gameState={gameState} />
                </div>
            )}
        </div>
    );
}

export default App;
