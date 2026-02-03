
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Sparkles, Stars, Cloud, Edges, MapControls as DreiMapControls } from '@react-three/drei';
import * as THREE from 'three';
import { Tile, Unit, WeatherType, DistrictType, CIVILIZATIONS, CivilizationName, RESOURCES } from '../types';

interface WorldMapProps {
    tiles: Tile[];
    units: Unit[];
    onTileSelect: (id: string) => void;
    selectedTileId: string | null;
    showResources: boolean;
    showPopulation: boolean;
    weather: WeatherType;
    onCameraMove?: (x: number, z: number) => void;
    focusTarget?: {x: number, z: number} | null;
    act: string;
    playerColor: string;
}

interface HexTileProps {
    tile: Tile;
    onSelect: () => void;
    isSelected: boolean;
    showResources: boolean;
    showPopulation: boolean;
    act: string;
    roadConnections: number[];
    playerColor: string;
}

// --- TEXTURE GENERATION ---
const createNoiseTexture = (type: 'noise' | 'water' | 'sand' | 'rock') => {
    if (typeof document === 'undefined') return null; // Server-side guard
    
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base fill
    ctx.fillStyle = '#808080';
    if (type === 'water') ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, size, size);

    // Noise function
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const intensity = type === 'rock' ? 100 : type === 'sand' ? 20 : type === 'water' ? 15 : 60;
    
    for (let i = 0; i < data.length; i += 4) {
        const val = (Math.random() - 0.5) * intensity;
        data[i] = Math.min(255, Math.max(0, data[i] + val));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + val));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + val));
    }
    ctx.putImageData(imageData, 0, 0);

    // Specific Details
    if (type === 'sand') {
        ctx.strokeStyle = '#a1a1aa';
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(size/3, y + Math.random() * 50, size/3 * 2, y - Math.random() * 50, size, y);
            ctx.stroke();
        }
    } else if (type === 'rock') {
        ctx.strokeStyle = '#4b5563';
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 3;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * size, Math.random() * size);
            ctx.lineTo(Math.random() * size, Math.random() * size);
            ctx.stroke();
        }
    } else if (type === 'water') {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 10 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = '#404040';
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 500; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

const TERRAIN_TEXTURES: Record<string, THREE.CanvasTexture | null> = {
    noise: null,
    water: null,
    sand: null,
    rock: null
};

const getTerrainTexture = (type: string) => {
    const key = type as keyof typeof TERRAIN_TEXTURES;
    if (!TERRAIN_TEXTURES[key]) {
        TERRAIN_TEXTURES[key] = createNoiseTexture(key as any);
    }
    return TERRAIN_TEXTURES[key];
};

const getTileHeight = (tile: Tile) => {
    const v = tile.variation * 0.15;
    switch(tile.terrain) {
        case 'mountains': return 1.6 + v * 0.8;
        case 'hill': return 1.0 + v * 0.3;
        case 'forest': return 0.6 + v * 0.1;
        case 'shrubland': return 0.5 + v * 0.05;
        case 'savanna': return 0.45 + v * 0.05;
        case 'swamp': return 0.4 + v * 0.05;
        case 'coast': return 0.35;
        case 'ocean': return 0.25;
        case 'desert': return 0.5 + v * 0.15;
        default: return 0.4 + v * 0.05;
    }
};

// --- TERRAIN FEATURE MODELS ---

const TreeModel = ({ variation, color = "#166534" }: { variation: number, color?: string }) => {
    const scale = 0.2 + variation * 0.15;
    return (
        <group>
            <mesh position={[0, scale, 0]} castShadow>
                <coneGeometry args={[scale * 0.8, scale * 2.5, 7]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            <mesh position={[0, scale * 0.2, 0]} castShadow>
                <cylinderGeometry args={[scale * 0.2, scale * 0.25, scale * 0.5]} />
                <meshStandardMaterial color="#3f2e18" />
            </mesh>
        </group>
    )
}

const RockModel = ({ variation }: { variation: number }) => {
    const scale = 0.15 + variation * 0.15;
    // Fix: Deterministic rotation to prevent spinning on re-render
    const rotX = variation * Math.PI;
    const rotY = variation * Math.PI * 2;
    return (
        <mesh position={[0, scale * 0.5, 0]} castShadow rotation={[rotX, rotY, 0]}>
            <dodecahedronGeometry args={[scale, 0]} />
            <meshStandardMaterial color="#57534e" flatShading />
        </mesh>
    )
}

const CactusModel = ({ variation }: { variation: number }) => {
    const scale = 0.15 + variation * 0.1;
    return (
        <group>
            <mesh position={[0, scale, 0]} castShadow>
                <capsuleGeometry args={[scale * 0.3, scale * 2, 4, 8]} />
                <meshStandardMaterial color="#15803d" />
            </mesh>
            {variation > 0.5 && (
                <mesh position={[scale * 0.4, scale * 1.2, 0]} rotation={[0, 0, -0.5]} castShadow>
                    <capsuleGeometry args={[scale * 0.2, scale * 0.8, 4, 8]} />
                    <meshStandardMaterial color="#15803d" />
                </mesh>
            )}
            {variation > 0.7 && (
                <mesh position={[-scale * 0.4, scale * 0.8, 0]} rotation={[0, 0, 0.5]} castShadow>
                    <capsuleGeometry args={[scale * 0.2, scale * 0.6, 4, 8]} />
                    <meshStandardMaterial color="#15803d" />
                </mesh>
            )}
        </group>
    )
}

const TerrainFeatures = ({ tile }: { tile: Tile }) => {
    const seed = tile.q * 1000 + tile.r;
    const rng = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    if (tile.terrain === 'forest') {
        const count = 3 + Math.floor(rng(1) * 3);
        return (
            <group>
                {Array.from({length: count}).map((_, i) => {
                    const angle = rng(i * 2) * Math.PI * 2;
                    const r = 0.2 + rng(i * 2 + 1) * 0.3;
                    return (
                        <group key={i} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                            <TreeModel variation={rng(i)} />
                        </group>
                    )
                })}
            </group>
        );
    }

    if (tile.terrain === 'swamp') {
        const count = 3 + Math.floor(rng(1) * 2);
        return (
            <group>
                {Array.from({length: count}).map((_, i) => {
                    const angle = rng(i * 2) * Math.PI * 2;
                    const r = 0.2 + rng(i * 2 + 1) * 0.3;
                    return (
                        <group key={i} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                            <TreeModel variation={rng(i)} color="#3f6212" />
                        </group>
                    )
                })}
            </group>
        );
    }

    if (tile.terrain === 'hill' || tile.terrain === 'mountains') {
        const count = tile.terrain === 'mountains' ? 4 : 2;
        return (
            <group>
                {Array.from({length: count}).map((_, i) => {
                    const angle = rng(i * 3) * Math.PI * 2;
                    const r = 0.1 + rng(i * 3 + 1) * 0.4;
                    return (
                        <group key={i} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                            <RockModel variation={rng(i)} />
                        </group>
                    )
                })}
            </group>
        );
    }

    if (tile.terrain === 'desert') {
        const count = 1 + Math.floor(rng(1) * 2);
        return (
            <group>
                {Array.from({length: count}).map((_, i) => {
                    const angle = rng(i * 4) * Math.PI * 2;
                    const r = 0.2 + rng(i * 4 + 1) * 0.3;
                    return (
                        <group key={i} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                            <CactusModel variation={rng(i)} />
                        </group>
                    )
                })}
            </group>
        );
    }

    if (tile.terrain === 'savanna') {
        const count = 1;
        const angle = rng(5) * Math.PI * 2;
        const r = 0.2;
        return (
            <group position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                <TreeModel variation={rng(6)} color="#a3e635" />
            </group>
        )
    }

    return null;
}

// --- UNIT COMPONENT ---
const UnitModel: React.FC<{ type: string, owner: string, position: [number, number, number], isSelected: boolean, color: string }> = ({ type, owner, position, isSelected, color }) => {
    const unitColor = useMemo(() => {
        if (owner === 'player') return color;
        if (CIVILIZATIONS[owner as CivilizationName]) return CIVILIZATIONS[owner as CivilizationName].color;
        return '#ef4444'; 
    }, [owner, color]);

    const isSettler = type === 'settler';
    const isRanged = type === 'archer' || type === 'crossbowman';

    return (
        <group position={position}>
            {/* Selection Ring */}
            {isSelected && (
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.3, 0.4, 32]} />
                    <meshBasicMaterial color="#fbbf24" opacity={0.8} transparent />
                </mesh>
            )}

            <group position={[0, 0.25, 0]}>
                {/* Body */}
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.2, 0.25, 0.12]} />
                    <meshStandardMaterial color={unitColor} />
                </mesh>
                {/* Head */}
                <mesh position={[0, 0.35, 0]} castShadow>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#fca5a5" /> 
                </mesh>
                {/* Helmet/Hat */}
                <mesh position={[0, 0.38, 0]} castShadow>
                    <sphereGeometry args={[0.085, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                </mesh>

                {/* Legs */}
                <mesh position={[-0.06, -0.05, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.25]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[0.06, -0.05, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.25]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>

                {/* Equipment based on type */}
                {isSettler && (
                    <group position={[0, 0, -0.2]}>
                        {/* Backpack / Cart */}
                        <mesh position={[0, 0.1, 0.15]} castShadow>
                            <boxGeometry args={[0.25, 0.3, 0.15]} />
                            <meshStandardMaterial color="#78350f" />
                        </mesh>
                        <mesh position={[0, 0.3, 0.15]} rotation={[0,0,Math.PI/2]}>
                             <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                             <meshStandardMaterial color="#d4d4d8" />
                        </mesh>
                    </group>
                )}

                {!isSettler && !isRanged && (
                    // Warrior - Spear/Sword
                    <group>
                        <mesh position={[0.15, 0.1, 0.1]} rotation={[Math.PI/4, 0, -Math.PI/4]}>
                            <cylinderGeometry args={[0.015, 0.015, 0.5]} />
                            <meshStandardMaterial color="#9ca3af" metalness={0.8} />
                        </mesh>
                        {/* Shield */}
                        <mesh position={[-0.12, 0.1, 0.05]} rotation={[0, -Math.PI/3, 0]}>
                            <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
                            <meshStandardMaterial color={unitColor} />
                        </mesh>
                        <mesh position={[-0.12, 0.1, 0.06]} rotation={[0, -Math.PI/3, 0]}>
                            <sphereGeometry args={[0.03]} />
                            <meshStandardMaterial color="#fbbf24" metalness={1} />
                        </mesh>
                    </group>
                )}

                {isRanged && (
                    // Archer - Bow
                    <group position={[0.1, 0.1, 0.1]} rotation={[0, 0, -Math.PI/4]}>
                        <mesh>
                            <torusGeometry args={[0.15, 0.01, 8, 16, Math.PI]} />
                            <meshStandardMaterial color="#78350f" />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};

// --- BUILDING MODELS ---

const FarmModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
            <cylinderGeometry args={[0.35, 0.38, 0.1, 6]} />
            <meshStandardMaterial color="#5c4033" />
        </mesh>
        {[...Array(4)].map((_, i) => (
             <mesh key={i} position={[0.15 - i*0.1, 0.12, 0.1]} rotation={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.05, 0.05, 0.4]} />
                <meshStandardMaterial color="#fcd34d" />
             </mesh>
        ))}
        <group position={[0, 0.15, -0.15]}>
             <mesh castShadow>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#78350f" />
             </mesh>
             <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                <coneGeometry args={[0.18, 0.2, 4]} />
                <meshStandardMaterial color="#451a03" />
             </mesh>
        </group>
        <mesh position={[-0.2, 0.2, -0.1]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.3]} />
            <meshStandardMaterial color="#9a3412" />
        </mesh>
    </group>
);

const OilWellModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.15, 0.6, 4, 1, true]} />
            <meshStandardMaterial color="#555" wireframe />
        </mesh>
        <mesh position={[0.1, 0.15, 0]} rotation={[0, 0, Math.PI/4]}>
            <boxGeometry args={[0.3, 0.05, 0.05]} />
            <meshStandardMaterial color="#222" />
        </mesh>
    </group>
);

const PowerPlantModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.4]} />
            <meshStandardMaterial color="#555" />
        </mesh>
        <mesh position={[-0.15, 0.4, -0.1]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.4, 16]} />
            <meshStandardMaterial color="#777" />
        </mesh>
        <mesh position={[0.15, 0.4, -0.1]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.4, 16]} />
            <meshStandardMaterial color="#777" />
        </mesh>
    </group>
);

const MineModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
            <dodecahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#4b5563" flatShading />
        </mesh>
        <group position={[0.15, 0.15, 0.15]} rotation={[0, -Math.PI/4, 0]}>
            <mesh castShadow>
                <boxGeometry args={[0.2, 0.25, 0.1]} />
                <meshStandardMaterial color="#27272a" />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.25, 0.05, 0.15]} />
                <meshStandardMaterial color="#713f12" />
            </mesh>
        </group>
        <group position={[-0.1, 0.3, -0.1]}>
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.02, 0.03, 0.4]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0.1, 0.25, 0]} rotation={[0, 0, -Math.PI/4]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
        </group>
        <mesh position={[0.2, 0.05, 0.2]} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.15]} />
            <meshStandardMaterial color="#3f3f46" />
        </mesh>
    </group>
);

const CampModel = ({ type }: { type: 'logging' | 'hunting' }) => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0.1, 0.15, 0.1]} castShadow>
            <coneGeometry args={[0.2, 0.3, 5]} />
            <meshStandardMaterial color={type === 'logging' ? "#78350f" : "#d97706"} />
        </mesh>
        <mesh position={[-0.15, 0.12, -0.1]} castShadow>
            <coneGeometry args={[0.15, 0.25, 5]} />
            <meshStandardMaterial color={type === 'logging' ? "#5c4033" : "#b45309"} />
        </mesh>
        {type === 'logging' ? (
            <>
                <mesh position={[-0.1, 0.05, 0.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.3]} />
                    <meshStandardMaterial color="#3f2e18" />
                </mesh>
                <mesh position={[-0.1, 0.09, 0.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.3]} />
                    <meshStandardMaterial color="#3f2e18" />
                </mesh>
                <mesh position={[0.2, 0.05, -0.2]} castShadow>
                    <cylinderGeometry args={[0.06, 0.08, 0.1]} />
                    <meshStandardMaterial color="#3f2e18" />
                </mesh>
            </>
        ) : (
            <>
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.08, 0.1, 0.05]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
                <mesh position={[0, 0.05, 0]}>
                    <dodecahedronGeometry args={[0.04]} />
                    <meshStandardMaterial color="#ef4444" emissive="#ea580c" emissiveIntensity={0.8} />
                </mesh>
            </>
        )}
    </group>
);

const WorkshopModel = ({ act }: { act: string }) => {
    const isIndustrial = act.includes('Enlightenment') || act.includes('Renaissance') || act.includes('Machine') || act.includes('Atomic') || act.includes('Interstellar');
    return (
        <group position={[0, 0.05, 0]}>
            <mesh position={[0, 0.2, 0]} castShadow>
                <boxGeometry args={[0.4, 0.35, 0.3]} />
                <meshStandardMaterial color={isIndustrial ? "#7f1d1d" : "#9ca3af"} />
            </mesh>
            <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0]} castShadow>
                 <coneGeometry args={[0.35, 0.25, 4]} />
                 <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0.15, 0.4, 0.1]} castShadow>
                <boxGeometry args={[0.08, 0.4, 0.08]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            {isIndustrial && (
                <mesh position={[0.15, 0.65, 0.1]}>
                    <sphereGeometry args={[0.06, 4, 4]} />
                    <meshStandardMaterial color="#e5e7eb" transparent opacity={0.6} />
                </mesh>
            )}
            <mesh position={[-0.25, 0.1, 0]}>
                <boxGeometry args={[0.1, 0.15, 0.1]} />
                <meshStandardMaterial color="#171717" />
            </mesh>
        </group>
    );
};

const MarketModel = () => (
    <group position={[0, 0.05, 0]}>
        <group position={[-0.15, 0, 0.1]}>
            <mesh position={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#b45309" />
            </mesh>
            <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.15, 0.15, 4]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
        </group>
        <group position={[0.15, 0, -0.1]}>
            <mesh position={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#b45309" />
            </mesh>
            <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.15, 0.15, 4]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>
        </group>
        <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
    </group>
);

const SAMBatteryModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#374151" />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.1, 8]} />
            <meshStandardMaterial color="#4b5563" />
        </mesh>
        <group position={[0, 0.3, 0]} rotation={[Math.PI/4, 0, 0]}>
            <mesh position={[0.1, 0, 0]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[-0.1, 0, 0]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0.1, 0.25, 0]}>
                <coneGeometry args={[0.05, 0.1, 8]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[-0.1, 0.25, 0]}>
                <coneGeometry args={[0.05, 0.1, 8]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
        </group>
    </group>
);

const ReflectingPoolModel = () => (
    <group position={[0, 0.01, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[0.6, 0.05, 0.8]} />
            <meshStandardMaterial color="#e5e5e5" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.05, 0.6, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
    </group>
);

const OperaHouseModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.45, 0.2, 8]} />
            <meshStandardMaterial color="#e5e5e5" />
        </mesh>
        {[...Array(3)].map((_, i) => (
            <mesh key={i} position={[0, 0.3, 0]} rotation={[Math.PI/3, 0, (i * Math.PI * 2) / 3]} castShadow>
                <sphereGeometry args={[0.25, 16, 16, 0, Math.PI]} />
                <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
            </mesh>
        ))}
    </group>
);

const PlaygroundModel = () => (
    <group position={[0, 0.05, 0]}>
        <group position={[-0.15, 0, 0.1]}>
            <mesh position={[-0.1, 0.15, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.3]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            <mesh position={[0.1, 0.15, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.3]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.01, 0.01, 0.22]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
        </group>
        <group position={[0.15, 0, -0.1]}>
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.1, 0.2, 0.1]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.1, 0.1, 0.1]} rotation={[Math.PI/4, 0, 0]}>
                <boxGeometry args={[0.08, 0.3, 0.02]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>
        </group>
    </group>
);

const PharmacyModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        <group position={[0, 0.4, 0]}>
            <mesh>
                <boxGeometry args={[0.05, 0.15, 0.02]} />
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
            </mesh>
            <mesh>
                <boxGeometry args={[0.15, 0.05, 0.02]} />
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
            </mesh>
        </group>
    </group>
);

const ArtGalleryModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.4]} />
            <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[-0.2, 0.3, 0.1]} rotation={[0, 0, Math.PI/6]}>
            <boxGeometry args={[0.2, 0.4, 0.2]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.1, 0.1, 0.25]}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
            <meshStandardMaterial color="#334155" />
        </mesh>
    </group>
);

const ZooModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.2, 0.25]} castShadow>
            <torusGeometry args={[0.15, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#166534" />
        </mesh>
        <mesh position={[0, 0.05, 0]} receiveShadow>
            <ringGeometry args={[0.3, 0.32, 16]} />
            <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 0.1, -0.1]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.1]} />
            <meshStandardMaterial color="#5c4033" />
        </mesh>
        <mesh position={[0, 0.2, -0.1]} castShadow>
            <dodecahedronGeometry args={[0.1]} />
            <meshStandardMaterial color="#15803d" />
        </mesh>
    </group>
);

const FusionCenterModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
            <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e0f2fe" opacity={0.8} transparent />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.05]} />
            <meshStandardMaterial color="#334155" />
        </mesh>
    </group>
);

const PlasmaReactorModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.45, 0.2, 8]} />
            <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.25, 0.05, 16, 32]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} />
        </mesh>
        {[0, 1, 2, 3].map(i => (
            <mesh key={i} position={[Math.cos(i*Math.PI/2)*0.25, 0.3, Math.sin(i*Math.PI/2)*0.25]}>
                <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        ))}
    </group>
);

const DomeModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
            <sphereGeometry args={[0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#a5f3fc" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.4, 0.48, 32]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.1, 0.1, 0.1]}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[-0.15, 0.1, -0.1]}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
    </group>
);

const BiofuelPlantModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />
            <meshStandardMaterial color="#166534" />
        </mesh>
        <mesh position={[0.25, 0.1, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3]} />
            <meshStandardMaterial color="#4ade80" />
        </mesh>
        <mesh position={[0.35, 0.15, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
    </group>
);

const VerticalFarmModel = () => (
    <group position={[0, 0.05, 0]}>
        {[0, 1, 2, 3].map(i => (
            <group key={i} position={[0, 0.1 + i*0.15, 0]}>
                <mesh castShadow>
                    <cylinderGeometry args={[0.3 - i*0.05, 0.3 - i*0.05, 0.02, 16]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.28 - i*0.05, 0.28 - i*0.05, 0.02, 16]} />
                    <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.2} />
                </mesh>
            </group>
        ))}
        <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>
    </group>
);

const ZPEGeneratorModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} />
        </mesh>
        {[0, 1, 2].map(i => (
            <mesh key={i} position={[Math.cos(i*2.1)*0.2, 0.15, Math.sin(i*2.1)*0.2]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.08, 0.3, 4]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        ))}
    </group>
);

const DarkMatterReactorModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
            <dodecahedronGeometry args={[0.35]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} wireframe />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI/4, 0, 0]}>
            <torusGeometry args={[0.4, 0.02, 8, 16]} />
            <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={2} />
        </mesh>
    </group>
);

const MatterCompilerModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.6]} />
            <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.5, 16]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} wireframe />
        </mesh>
        <mesh position={[-0.25, 0.3, 0.25]} rotation={[0, Math.PI/4, 0.5]}>
            <boxGeometry args={[0.05, 0.4, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0.25, 0.3, -0.25]} rotation={[0, Math.PI/4, -0.5]}>
            <boxGeometry args={[0.05, 0.4, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
    </group>
);

const StadiumModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow scale={[1, 0.5, 1.2]}>
            <torusGeometry args={[0.3, 0.1, 16, 32]} />
            <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.05, 0]} scale={[1, 1, 1.2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.02]} />
            <meshStandardMaterial color="#16a34a" />
        </mesh>
    </group>
);

const SolarPanelModel = () => (
    <group position={[0, 0.05, 0]}>
        {[...Array(3)].map((_, i) => (
            <group key={i} position={[(i-1)*0.25, 0, 0]} rotation={[-Math.PI/6, 0, 0]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.2, 0.25, 0.02]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.05, 0.05]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.2]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
            </group>
        ))}
    </group>
);

const WindTurbineModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.04, 0.8]} />
            <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <group position={[0, 0.8, 0.05]}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.05]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {[0, 1, 2].map(i => (
                <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0.25, 0]}> 
                    <boxGeometry args={[0.05, 0.5, 0.01]} />
                    <meshStandardMaterial color="#f1f5f9" />
                </mesh>
            ))}
        </group>
    </group>
);

const GeothermalModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI/2]}>
            <torusGeometry args={[0.15, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.15, 0.05, 0]}>
            <coneGeometry args={[0.1, 0.2, 8]} />
            <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[-0.15, 0.1, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.2]} />
            <meshStandardMaterial color="#475569" />
        </mesh>
    </group>
);

const ArcologyModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[0.4, 1.0, 4]} />
            <meshStandardMaterial color="#1e293b" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.35, 0.9, 4]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
    </group>
);

const MedicalLabModel = () => (
    <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.5, 0.25, 0.3]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.05, 0.15, 0.05]} />
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.15, 0.05, 0.05]} />
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
    </group>
);

const CityModel = ({ act }: { act: string }) => {
    // Determine Era Style based on Act string
    const getEra = (a: string) => {
        if (a.includes('Dawn')) return 'ancient';
        if (a.includes('Bronze') || a.includes('Iron') || a.includes('Antiquity')) return 'classical';
        if (a.includes('Middle') || a.includes('Renaissance')) return 'medieval';
        if (a.includes('Enlightenment')) return 'industrial';
        if (a.includes('Machine') || a.includes('Atomic')) return 'modern';
        if (a.includes('Interstellar')) return 'future';
        return 'ancient';
    };

    const era = getEra(act);

    if (era === 'future') {
        return (
            <group position={[0, 0.5, 0]}>
                <mesh position={[0, 0.8, 0]} castShadow>
                    <coneGeometry args={[0.3, 2, 6]} />
                    <meshStandardMaterial color="#e0f2fe" emissive="#0ea5e9" emissiveIntensity={0.5} transparent opacity={0.9} />
                </mesh>
                <mesh position={[0, 1.2, 0]} rotation={[0.2, 0, 0]}>
                    <torusGeometry args={[0.4, 0.02, 16, 32]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" />
                </mesh>
                {[0, 1, 2].map(i => (
                    <mesh key={i} position={[Math.cos(i*2.1)*0.4, 0.2, Math.sin(i*2.1)*0.4]}>
                        <cylinderGeometry args={[0.15, 0.1, 0.4]} />
                        <meshStandardMaterial color="#fff" />
                    </mesh>
                ))}
            </group>
        );
    }

    if (era === 'modern') {
        return (
            <group position={[0, 0.1, 0]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[0.3, 1.2, 0.3]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
                </mesh>
                <mesh position={[0.25, 0.4, 0.25]} castShadow>
                    <boxGeometry args={[0.25, 0.8, 0.25]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.3} />
                </mesh>
                <mesh position={[-0.2, 0.5, -0.2]} castShadow>
                    <boxGeometry args={[0.2, 1.0, 0.2]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
            </group>
        );
    }

    if (era === 'industrial') {
        return (
            <group position={[0, 0.1, 0]}>
                <mesh position={[0, 0.3, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.4]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
                <mesh position={[0.2, 0.6, 0.15]} castShadow>
                    <cylinderGeometry args={[0.05, 0.08, 0.8]} />
                    <meshStandardMaterial color="#3f3f46" />
                </mesh>
                <mesh position={[-0.1, 0.5, -0.1]} castShadow>
                    <boxGeometry args={[0.3, 0.6, 0.3]} />
                    <meshStandardMaterial color="#9a3412" />
                </mesh>
            </group>
        );
    }

    if (era === 'medieval') {
        return (
            <group position={[0, 0.1, 0]}>
                <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.6, 0.4]} />
                    <meshStandardMaterial color="#a8a29e" />
                </mesh>
                <mesh position={[0, 0.8, 0]} rotation={[0, Math.PI/4, 0]}>
                    <coneGeometry args={[0.35, 0.4, 4]} />
                    <meshStandardMaterial color="#7c2d12" />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[0.7, 0.3, 0.7]} />
                    <meshStandardMaterial color="#78716c" />
                </mesh>
                <mesh position={[0.3, 0.5, 0.3]}>
                    <cylinderGeometry args={[0.1, 0.15, 0.6]} />
                    <meshStandardMaterial color="#78716c" />
                </mesh>
                 <mesh position={[0.3, 0.85, 0.3]}>
                    <coneGeometry args={[0.12, 0.3, 4]} />
                    <meshStandardMaterial color="#1e3a8a" />
                </mesh>
            </group>
        );
    }

    if (era === 'classical') {
        return (
            <group position={[0, 0.1, 0]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.15, 0.5]} />
                    <meshStandardMaterial color="#e5e5e5" />
                </mesh>
                {/* Columns */}
                {[-1, 1].map(i => [-1,1].map(j => (
                    <mesh key={`${i}-${j}`} position={[i*0.2, 0.35, j*0.15]}>
                        <cylinderGeometry args={[0.04, 0.05, 0.4]} />
                        <meshStandardMaterial color="#f5f5f5" />
                    </mesh>
                )))}
                {/* Roof/Dome */}
                 <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[0.25, 8, 8, 0, Math.PI * 2, 0, Math.PI/2]} />
                    <meshStandardMaterial color="#fcd34d" />
                </mesh>
            </group>
        );
    }

    // Ancient (Default)
    return (
        <group position={[0, 0.1, 0]}>
            <group position={[0.15, 0, 0.15]}>
                <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                    <coneGeometry args={[0.15, 0.15, 4]} />
                    <meshStandardMaterial color="#fcd34d" />
                </mesh>
            </group>
            <group position={[-0.1, 0, -0.1]}>
                <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[0.25, 0.2, 0.25]} />
                    <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh position={[0, 0.25, 0]}>
                    <coneGeometry args={[0.18, 0.2, 4]} />
                    <meshStandardMaterial color="#fcd34d" />
                </mesh>
            </group>
        </group>
    );
};

const HexTile: React.FC<HexTileProps> = ({ tile, onSelect, isSelected, showResources, showPopulation, act, roadConnections, playerColor }) => {
    const height = getTileHeight(tile);
    const texture = getTerrainTexture(tile.terrain === 'ocean' ? 'water' : tile.terrain === 'desert' ? 'sand' : tile.terrain === 'mountains' || tile.terrain === 'hill' ? 'rock' : 'noise');
    
    // Terrain Colors map
    const getTerrainColor = (t: string) => {
        switch(t) {
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

    const x = tile.q * 1.5;
    const z = (tile.r + tile.q/2) * Math.sqrt(3);

    return (
        <group position={[x, 0, z]}>
            <mesh 
                position={[0, height/2, 0]} 
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                receiveShadow 
                castShadow
            >
                {/* Increased radius to 1.05 to visually merge tiles and eliminate gaps */}
                <cylinderGeometry args={[1.05, 1.05, height, 6]} />
                <meshStandardMaterial 
                    color={getTerrainColor(tile.terrain)} 
                    map={texture}
                    flatShading={tile.terrain === 'mountains' || tile.terrain === 'hill'}
                />
                {isSelected && <Edges color="white" linewidth={2} threshold={15} />}
            </mesh>

            {isSelected && (
                <mesh position={[0, 0.1, 0]}>
                    <ringGeometry args={[0.8, 0.9, 6]} />
                    <meshBasicMaterial color="#fbbf24" />
                </mesh>
            )}

            {(tile.terrain === 'ocean' || tile.terrain === 'coast') && (
                 <mesh position={[0, height * 0.8, 0]}>
                    <cylinderGeometry args={[0.9, 0.9, height * 0.1, 6]} />
                    <meshStandardMaterial color={tile.terrain === 'ocean' ? "#1e3a8a" : "#7dd3fc"} transparent opacity={0.6} />
                 </mesh>
            )}

            <group position={[0, height, 0]}>
                <TerrainFeatures tile={tile} />

                {tile.improvement && (
                    <group>
                        {tile.improvement.name === 'Farm' && <FarmModel />}
                        {tile.improvement.name === 'Mine' && <MineModel />}
                        {tile.improvement.name === 'Oil Well' && <OilWellModel />}
                        {tile.improvement.name === 'Pasture' && <CampModel type="hunting" />} 
                        {tile.improvement.name === 'Camp' && <CampModel type="hunting" />}
                        {tile.improvement.name === 'Lumber Mill' && <CampModel type="logging" />}
                        {tile.improvement.name === 'Workshop' && <WorkshopModel act={act} />}
                        {/* Fallback for others using FarmModel temporarily or just nothing */}
                    </group>
                )}

                {tile.structure === 'city' && (
                    <CityModel act={act} />
                )}

                {(tile.hasRoad || tile.hasMagrail) && roadConnections.map((angle, i) => (
                    <mesh key={i} rotation={[0, angle, 0]} position={[0, 0.01, 0]} receiveShadow>
                        <planeGeometry args={[0.2, 1]} />
                        <meshStandardMaterial color="#57534e" />
                    </mesh>
                ))}

                {showResources && tile.resource && (
                    <Html position={[0, 0.5, 0]} center distanceFactor={15} style={{pointerEvents:'none'}}>
                        <div className="bg-black/50 p-1 rounded-full border border-white/20 text-xs backdrop-blur-sm">
                             <span className="text-white font-bold">{tile.resource.substring(0,2).toUpperCase()}</span>
                        </div>
                    </Html>
                )}
                 
                 {showPopulation && tile.population > 0 && (
                     <Html position={[0, 1, 0]} center distanceFactor={15} style={{pointerEvents:'none'}}>
                        <div className="bg-blue-900/80 p-1 rounded-full border border-blue-400 text-[10px] backdrop-blur-sm font-bold text-white px-2">
                            {tile.population}
                        </div>
                    </Html>
                 )}
            </group>
        </group>
    );
};

const MapControls = ({ onMove, focusTarget }: { onMove?: (x: number, z: number) => void, focusTarget?: {x: number, z: number} | null }) => {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (controlsRef.current) {
            const { x, z } = controlsRef.current.target;
            if (onMove) onMove(x, z);
            
            if (focusTarget) {
                 controlsRef.current.target.lerp(new THREE.Vector3(focusTarget.x, 0, focusTarget.z), 0.1);
                 
                 // Also move the camera to maintain relative position if needed, 
                 // but typically OrbitControls handles rotation around target.
                 // For panning style MapControls, we might want to shift camera position too.
                 const offset = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
                 const newCamPos = new THREE.Vector3(focusTarget.x, 0, focusTarget.z).add(offset);
                 camera.position.lerp(newCamPos, 0.1);
                 
                 controlsRef.current.update();
            }
        }
    });

    return <DreiMapControls ref={controlsRef} enableDamping dampingFactor={0.1} maxPolarAngle={Math.PI / 2.5} minDistance={5} maxDistance={100} />;
};

export const WorldMap: React.FC<WorldMapProps> = ({
    tiles,
    units,
    onTileSelect,
    selectedTileId,
    showResources,
    showPopulation,
    weather,
    onCameraMove,
    focusTarget,
    act,
    playerColor
}) => {
    const isStorm = weather === 'storm';
    const isSnow = weather === 'snow';
    
    const tileMap = useMemo(() => {
        const map = new Map<string, Tile>();
        tiles.forEach(t => map.set(t.id, t));
        return map;
    }, [tiles]);

    const NEIGHBOR_OFFSETS = [
        { q: 1, r: 0, angle: Math.PI / 6 },
        { q: 0, r: 1, angle: Math.PI / 2 },
        { q: -1, r: 1, angle: 5 * Math.PI / 6 },
        { q: -1, r: 0, angle: 7 * Math.PI / 6 },
        { q: 0, r: -1, angle: -Math.PI / 2 },
        { q: 1, r: -1, angle: -Math.PI / 6 }
    ];

    return (
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 20, 20], fov: 40 }}>
            <color attach="background" args={['#0f172a']} />
            
            {/* Environment */}
            <ambientLight intensity={weather === 'storm' ? 0.2 : (weather === 'rain' ? 0.5 : 0.8)} />
            <directionalLight 
                position={[50, 50, 20]} 
                intensity={weather === 'storm' ? 0.5 : 1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
            />
            
            <Sky sunPosition={[100, 20, 100]} turbidity={weather === 'clear' ? 8 : 20} rayleigh={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {(weather === 'rain' || weather === 'storm') && (
                <Cloud opacity={0.5} speed={0.4} bounds={[50, 5, 50]} segments={20} position={[0, 15, 0]} />
            )}
             {(weather === 'snow') && (
                <Sparkles count={500} scale={40} size={4} speed={0.4} opacity={0.8} color="#fff" />
            )}

            <MapControls onMove={onCameraMove} focusTarget={focusTarget} />
            
            <group>
                {tiles.map(tile => {
                    const roadConnections: number[] = [];
                    if (tile.hasRoad || tile.hasMagrail) {
                        NEIGHBOR_OFFSETS.forEach(({ q, r, angle }) => {
                            const neighbor = tileMap.get(`${tile.q + q},${tile.r + r}`);
                            if (neighbor && (neighbor.hasRoad || neighbor.hasMagrail || neighbor.structure === 'city')) {
                                roadConnections.push(angle);
                            }
                        });
                    }

                    return (
                    <HexTile 
                        key={tile.id} 
                        tile={tile} 
                        onSelect={() => onTileSelect(tile.id)}
                        isSelected={selectedTileId === tile.id}
                        showResources={showResources}
                        showPopulation={showPopulation}
                        act={act}
                        roadConnections={roadConnections}
                        playerColor={playerColor}
                    />
                )})}
            </group>

            <group>
                {units.map(unit => {
                    const tile = tiles.find(t => t.id === unit.tileId);
                    if (!tile) return null;
                    const h = getTileHeight(tile);
                    const x = tile.q * 1.5;
                    const z = (tile.r + tile.q/2) * Math.sqrt(3);
                    const isSelected = selectedTileId === tile.id; 
                    
                    return <UnitModel key={unit.id} type={unit.type} owner={unit.owner} position={[x, h, z]} isSelected={isSelected} color={playerColor} />;
                })}
            </group>

        </Canvas>
    );
};
