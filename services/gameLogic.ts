
import { GameState, Tile, Unit, RESOURCES, IMPROVEMENTS, DISTRICTS, Act, ResourceType, TerrainType, WeatherType, UNIT_DEFINITIONS, CIVILIZATIONS, CivilizationName } from '../types';

const MAP_RADIUS = 40;

// --- Noise Helpers ---
// Simple Pseudo Random Number Generator
const fract = (x: number) => x - Math.floor(x);
const hash = (x: number, y: number) => {
    return fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123);
}

// 2D Value Noise
const noise2D = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const f = fract(x);
    const g = fract(y);
    
    // Smoothstep interpolation
    const u = f * f * (3.0 - 2.0 * f);
    const v = g * g * (3.0 - 2.0 * g);
    
    const a = hash(i, j);
    const b = hash(i + 1, j);
    const c = hash(i, j + 1);
    const d = hash(i + 1, j + 1);
    
    return (a * (1.0 - u) + b * u) * (1.0 - v) + (c * (1.0 - u) + d * u) * v;
}

// Fractal Brownian Motion
const fbm = (x: number, y: number, octaves: number, persistence: number = 0.5, lacunarity: number = 2.0) => {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;  // Used for normalizing result to 0.0 - 1.0
    for(let i=0; i<octaves; i++) {
        total += noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
}

export const generateMap = (): { tiles: Tile[], units: Unit[] } => {
    const tiles: Tile[] = [];
    const wonderCandidates: Tile[] = [];
    const seed = Math.random() * 1000;
    
    // Generate Hex Grid
    for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
        const r1 = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
        const r2 = Math.min(MAP_RADIUS, -q + MAP_RADIUS);
        for (let r = r1; r <= r2; r++) {
            // Convert axial to world-like coordinates for noise sampling
            // Smoother terrain: reduced scale for larger continents
            const scale = 0.06; 
            const x = (3/2 * q) * scale + seed;
            const y = (Math.sqrt(3) * (r + q/2)) * scale + seed;

            // Generate Map Layers
            // Elevation: Base FBM + domain warping for more natural shapes
            let elevation = fbm(x, y, 5); 
            // Add some ridge noise or variations
            const detail = noise2D(x * 3, y * 3) * 0.1;
            elevation += detail;
            elevation = Math.max(0, Math.min(1, elevation)); // Clamp

            const moisture = fbm(x + 500, y + 500, 3);
            const temperature = fbm(x - 500, y - 500, 3); // Local variance + latitude
            
            // Apply Latitude to Temperature (Poles are cold)
            const distFromEquator = Math.abs(r + q/2) / MAP_RADIUS; // 0 to 1
            const adjustedTemp = temperature * (1 - distFromEquator * 0.7) - (distFromEquator * 0.2);

            let terrain: TerrainType = 'ocean';
            let resource: ResourceType | null = null;
            let pop = 0;
            const variation = Math.random(); // Visual variation

            // 1. Terrain Determination
            if (elevation < 0.45) { // Higher threshold for more water/distinct continents
                // Ocean / Water
                terrain = elevation < 0.25 ? 'ocean' : 'coast';
            } else {
                // Land
                if (elevation > 0.88) {
                    terrain = 'mountains';
                } else if (elevation > 0.75) {
                    terrain = 'hill';
                } else {
                    // Flat lands determined by Moisture & Temp
                    if (adjustedTemp < 0.25) {
                        terrain = 'tundra';
                    } else if (moisture < 0.20) {
                        terrain = 'desert';
                    } else if (moisture < 0.40) {
                        // Semi-arid region
                        if (adjustedTemp > 0.5) terrain = 'shrubland'; 
                        else terrain = 'plains'; 
                    } else if (moisture > 0.75) {
                         // High moisture
                         if (adjustedTemp > 0.6) terrain = 'swamp';
                         else terrain = 'forest';
                    } else {
                        // Moderate moisture
                        if (adjustedTemp > 0.65) terrain = 'savanna'; 
                        else if (moisture > 0.55) terrain = 'forest';
                        else terrain = 'plains';
                    }
                }
            }

            // 2. Resource Placement (Expanded for Antiquities)
            const rng = Math.random();

            if (terrain === 'mountains' || terrain === 'hill') {
                if (rng > 0.95) resource = 'uranium'; 
                else if (rng > 0.92) resource = 'precious_stones';
                else if (rng > 0.85) resource = 'precious_metal';
                else if (rng > 0.80) resource = 'coal'; 
                else if (rng > 0.75) resource = 'iron'; 
                else if (rng > 0.72 && terrain === 'hill') resource = 'saffron'; 
                else if (rng > 0.65) resource = 'aluminum'; 
                else if (rng > 0.60) resource = 'ore';
                else if (rng > 0.50) resource = 'stone';
            }
            else if (terrain === 'forest') {
                if (rng > 0.92) resource = 'silk'; 
                else if (rng > 0.88) resource = 'mandrake';
                else if (rng > 0.85) resource = 'rubber'; 
                else if (rng > 0.82) resource = 'dye'; 
                else if (rng > 0.75) resource = 'fur';
                else if (rng > 0.50) resource = 'wood';
            }
            else if (terrain === 'desert') {
                if (rng > 0.90) resource = 'spice';
                else if (rng > 0.85) resource = 'saffron'; 
                else if (rng > 0.75) resource = 'crude_oil'; 
                else if (rng > 0.70) resource = 'silicates'; 
                else if (rng > 0.60) resource = 'salt';
            }
            else if (terrain === 'swamp') {
                if (rng > 0.92) resource = 'vanilla'; 
                else if (rng > 0.88) resource = 'tea_leaves';
                else if (rng > 0.85) resource = 'rubber'; 
                else if (rng > 0.80) resource = 'hogs';
                else if (rng > 0.75) resource = 'crude_oil'; 
                else if (rng > 0.60) resource = 'clay';
            }
            else if (['plains', 'savanna'].includes(terrain)) {
                if (rng > 0.96) resource = 'flowers'; 
                else if (rng > 0.94) resource = 'horse';
                else if (rng > 0.90) resource = 'cattle';
                else if (rng > 0.85) resource = 'cotton';
                else if (rng > 0.80) resource = 'grape';
                else if (rng > 0.50) resource = 'grain';
                else if (rng > 0.40 && terrain === 'savanna') resource = 'goat';
                else if (rng > 0.40 && terrain === 'plains') resource = 'sheep';
            }
            else if (terrain === 'shrubland') {
                if (rng > 0.88) resource = 'saffron';
                else if (rng > 0.85) resource = 'dye'; 
                else if (rng > 0.75) resource = 'goat';
                else if (rng > 0.70) resource = 'aluminum'; 
                else if (rng > 0.60) resource = 'clay';
            }
            else if (terrain === 'tundra') {
                if (rng > 0.90) resource = 'uranium';
                else if (rng > 0.85) resource = 'crude_oil';
                else if (rng > 0.80) resource = 'aluminum';
                else if (rng > 0.70) resource = 'fur';
            }
            else if ((terrain as TerrainType) === 'coast') {
                 if (rng > 0.85) resource = 'silicates'; 
                 else if (rng > 0.70) resource = 'fish'; 
                 else if (rng > 0.60) resource = 'clay';
            }
            else if (terrain === 'ocean') {
                if (rng > 0.95) resource = 'crude_oil'; 
                else if (rng > 0.85) resource = 'fish';
            }


            // 3. Population (Habitability) (Note: We remove default owner assignment here, done in init)
            if (terrain !== 'ocean' && terrain !== 'mountains') {
                let habitability = 0.3;
                if (terrain === 'plains') habitability = 0.6;
                if (terrain === 'savanna') habitability = 0.5;
                if ((terrain as TerrainType) === 'coast') habitability = 0.5;
                if (terrain === 'shrubland') habitability = 0.2;
                if (terrain === 'desert' || terrain === 'tundra') habitability = 0.1;

                if (Math.random() < habitability) {
                    pop = Math.floor(Math.random() * 3); 
                }
            }

            const tile: Tile = {
                id: `${q},${r}`,
                q,
                r,
                terrain,
                resource,
                population: pop,
                ownerId: null, // Set during initialization
                improvement: null,
                districts: [],
                variation
            };

            tiles.push(tile);

            if (['mountains', 'forest', 'desert', 'coast', 'swamp', 'shrubland'].includes(terrain)) {
                wonderCandidates.push(tile);
            }
        }
    }

    // 4. Natural Wonders
    let wondersSpawned = 0;
    while (wondersSpawned < 3 && wonderCandidates.length > 0) {
        const idx = Math.floor(Math.random() * wonderCandidates.length);
        const candidate = wonderCandidates[idx];
        
        candidate.isNaturalWonder = true;
        candidate.wonderName = getRandomWonderName(candidate.terrain);
        
        if (!candidate.resource) {
            if (candidate.terrain === 'mountains') candidate.resource = 'precious_metal';
            else if (candidate.terrain === 'forest') candidate.resource = 'mandrake';
            else candidate.resource = 'grain'; 
        }

        wondersSpawned++;
        wonderCandidates.splice(idx, 1);
    }

    return { tiles, units: [] };
};

export const initializeCivilizations = (tiles: Tile[], playerCiv: CivilizationName): { updatedTiles: Tile[], units: Unit[] } => {
    const units: Unit[] = [];
    const updatedTiles = [...tiles];
    const occupiedTiles = new Set<string>();

    const allCivs = Object.keys(CIVILIZATIONS) as CivilizationName[];
    
    // Sort so player is first, then random AI
    const startOrder = [playerCiv, ...allCivs.filter(c => c !== playerCiv)];

    startOrder.forEach((civName) => {
        // 1. Find a valid start location
        let bestTile: Tile | null = null;
        let maxDistance = -1;

        // Try 20 times to find a good spot relative to existing spawns
        for (let i = 0; i < 25; i++) {
            const candidates = updatedTiles.filter(t => 
                ['plains', 'hill', 'savanna', 'shrubland'].includes(t.terrain) && 
                !t.isNaturalWonder && 
                !occupiedTiles.has(t.id) &&
                t.population > 0 // Ensure habitability
            );
            
            if (candidates.length === 0) break;
            
            const randomTile = candidates[Math.floor(Math.random() * candidates.length)];
            
            // Calculate distance to nearest occupied tile
            let minDistToOthers = Infinity;
            if (occupiedTiles.size > 0) {
                occupiedTiles.forEach(occId => {
                    const occTile = updatedTiles.find(t => t.id === occId);
                    if (occTile) {
                        const dist = (Math.abs(randomTile.q - occTile.q) + Math.abs(randomTile.q + randomTile.r - occTile.q - occTile.r) + Math.abs(randomTile.r - occTile.r)) / 2;
                        if (dist < minDistToOthers) minDistToOthers = dist;
                    }
                });
            } else {
                minDistToOthers = Infinity;
            }

            // Accept if distance is good enough (e.g., > 10 tiles) or if it's the best we found
            if (minDistToOthers > 15) {
                bestTile = randomTile;
                break;
            }
            if (minDistToOthers > maxDistance) {
                maxDistance = minDistToOthers;
                bestTile = randomTile;
            }
        }

        if (bestTile) {
            occupiedTiles.add(bestTile.id);
            const ownerId = civName === playerCiv ? 'player' : civName;

            // Update Tile Ownership
            bestTile.ownerId = ownerId;

            // Spawn Settler
            units.push({
                id: `u_${civName}_settler`,
                type: 'settler',
                tileId: bestTile.id,
                moves: UNIT_DEFINITIONS['settler'].moves,
                maxMoves: UNIT_DEFINITIONS['settler'].moves,
                owner: ownerId
            });

            // Spawn Warrior/Scout
            const escort = civName === 'China' || civName === 'Scotland' ? 'spearman' : 'warrior';
            units.push({
                id: `u_${civName}_warrior`,
                type: escort as any,
                tileId: bestTile.id,
                moves: UNIT_DEFINITIONS['warrior'].moves,
                maxMoves: UNIT_DEFINITIONS['warrior'].moves,
                owner: ownerId
            });
        }
    });

    return { updatedTiles, units };
}

const getRandomWonderName = (terrain: TerrainType): string => {
    const names = {
        mountains: ['Titan\'s Peak', 'Cloudpiercer', 'Dragon\'s Roost'],
        desert: ['Sands of Time', 'Sunken Oasis', 'Glass Plains'],
        forest: ['Whispering Grove', 'Yggdrasil\'s Root', 'Eternal Canopy'],
        coast: ['Siren\'s Cove', 'Pearl Lagoon', 'Kraken\'s Deep'],
        swamp: ['Mirror Marshes', 'Witch\'s Bog'],
        hill: ['Golden Highlands', 'Windy Barrows'],
        plains: ['Fields of Elysium'],
        tundra: ['Frostfang', 'Crystal Glacier'],
        shrubland: ['Thorn Maze', 'Singing Stones'],
        savanna: ['Lion\'s Rock', 'Great Migration Path'],
        ocean: ['The Abyss']
    };
    const list = names[terrain as keyof typeof names] || ['Mystic Nexus'];
    return list[Math.floor(Math.random() * list.length)];
}

export const getHousingCap = (tile: Tile): number => {
    let cap = 0;
    
    // Base city structure
    if (tile.structure === 'city') {
        cap += 5;
    }

    // Improvements
    if (tile.improvement) {
        cap += tile.improvement.housing || 0;
    }

    // Districts bonuses
    if (tile.districts && tile.districts.includes('residential')) {
        cap += 5;
    }
    
    // Wild population cap
    if (!tile.structure && !tile.improvement) {
        const habitable: TerrainType[] = ['plains', 'savanna', 'forest', 'coast'];
        if (habitable.includes(tile.terrain)) return 1;
        return 0;
    }

    return cap;
};

export const getMovementCost = (weather: WeatherType, improvement: any): number => {
    let cost = 1;
    
    // Weather Penalties
    switch(weather) {
        case 'storm': cost = 3; break; // Severe penalty
        case 'snow': cost = 2; break; // Moderate penalty
        case 'rain': cost = 1.5; break; // Slight penalty
        default: cost = 1; // Clear
    }
    
    // Road Bonus
    if (improvement?.name === 'Road') {
        cost = Math.max(0.5, cost * 0.5);
    }
    // Magrail Bonus (Near instant)
    if (improvement?.name === 'Magrail') {
        cost = 0.1;
    }

    return cost;
}

const determineNextWeather = (current: WeatherType): WeatherType => {
    const rand = Math.random();
    
    // Weather State Machine with Probabilities
    switch(current) {
        case 'clear':
            if (rand < 0.70) return 'clear';
            if (rand < 0.90) return 'rain';
            if (rand < 0.95) return 'snow';
            return 'storm';
        case 'rain':
            if (rand < 0.40) return 'clear';
            if (rand < 0.80) return 'rain';
            return 'storm';
        case 'snow':
            if (rand < 0.50) return 'clear';
            if (rand < 0.90) return 'snow';
            return 'storm';
        case 'storm':
            // Storms pass quickly
            if (rand < 0.30) return 'clear';
            if (rand < 0.70) return 'rain';
            return 'storm';
        default:
            return 'clear';
    }
}

export const isValidMove = (unit: Unit, targetTile: Tile): boolean => {
    const def = UNIT_DEFINITIONS[unit.type];
    if (def.movementType === 'land') {
        return targetTile.terrain !== 'ocean' && (targetTile.terrain as string) !== 'coast';
    } else if (def.movementType === 'water') {
        return targetTile.terrain === 'ocean' || (targetTile.terrain as string) === 'coast' || (targetTile.structure === 'city' && (targetTile.terrain as string) === 'coast');
    }
    return true;
};

// Helper to get neighbors
const getNeighbors = (tile: Tile, allTiles: Tile[]): Tile[] => {
    const neighbors: Tile[] = [];
    const offsets = [
        {q: 1, r: 0}, {q: 0, r: 1}, {q: -1, r: 1},
        {q: -1, r: 0}, {q: 0, r: -1}, {q: 1, r: -1}
    ];
    offsets.forEach(o => {
        const t = allTiles.find(x => x.q === tile.q + o.q && x.r === tile.r + o.r);
        if (t) neighbors.push(t);
    });
    return neighbors;
}

export const processTurn = (state: GameState): GameState => {
    const newState = { ...state, processingTurn: true };
    const newInventory = { ...newState.inventory };
    const logs: string[] = [`Turn ${state.turn + 1} Report:`];
    let addedTreasury = 0;

    // 0. Weather Change
    const prevWeather = state.weather;
    newState.weather = determineNextWeather(state.weather);
    if (newState.weather !== prevWeather) {
        logs.push(`Weather changed from ${prevWeather.toUpperCase()} to ${newState.weather.toUpperCase()}.`);
    }
    
    // Weather Effects Description
    if (newState.weather === 'rain') logs.push("Rain increases Farm yields but slows movement.");
    if (newState.weather === 'snow') logs.push("Snow severely hampers movement and reduces lumber.");
    if (newState.weather === 'storm') logs.push("Storms disrupt manufacturing and travel!");
    if (newState.weather === 'clear') logs.push("Clear skies allow for optimal travel.");

    // Reset Unit Moves
    let newUnits = state.units.map(u => ({ ...u, moves: u.maxMoves }));
    
    // --- AI TURN PROCESSING ---
    // Simple AI: Settlers look for city spots, Warriors patrol
    const aiUnits = newUnits.filter(u => u.owner !== 'player');
    const tileMap = new Map(state.tiles.map(t => [t.id, t]));
    const unitsToRemove = new Set<string>();

    aiUnits.forEach(unit => {
        const currentTile = tileMap.get(unit.tileId);
        if (!currentTile) return;

        if (unit.type === 'settler') {
            // Check if can settle here (no city, decent terrain)
            if (!currentTile.structure && ['plains', 'savanna', 'hill'].includes(currentTile.terrain)) {
                // Found City!
                const tileIndex = newState.tiles.findIndex(t => t.id === currentTile.id);
                if (tileIndex !== -1) {
                    newState.tiles[tileIndex] = {
                        ...newState.tiles[tileIndex],
                        structure: 'city',
                        ownerId: unit.owner,
                        population: Math.max(currentTile.population, 3)
                    };
                    logs.push(`${unit.owner} founded a new city!`);
                    unitsToRemove.add(unit.id);
                }
            } else {
                // Move randomly to find a spot
                const neighbors = getNeighbors(currentTile, state.tiles);
                const validNeighbors = neighbors.filter(n => isValidMove(unit, n));
                if (validNeighbors.length > 0) {
                    const target = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    unit.tileId = target.id;
                }
            }
        } else {
            // Patrol: Move randomly
            const neighbors = getNeighbors(currentTile, state.tiles);
            const validNeighbors = neighbors.filter(n => isValidMove(unit, n));
            if (validNeighbors.length > 0) {
                const target = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                unit.tileId = target.id;
            }
        }
    });

    // Remove units that settled
    newUnits = newUnits.filter(u => !unitsToRemove.has(u.id));


    // 1. Production Phase (Gathering)
    state.tiles.forEach(tile => {
        // --- 1a. Gathering Improvements (Active Production based on terrain/resource) ---
        if (tile.improvement && tile.improvement.type === 'gathering' && tile.ownerId === 'player') {
            const imp = tile.improvement;
            imp.output?.forEach(res => {
                // Base production + Population bonus
                const popBonus = Math.floor(tile.population * 0.1 * imp.productionRate!);
                const wonderBonus = tile.isNaturalWonder ? 2 : 0;
                let amount = (imp.productionRate || 0) + popBonus + wonderBonus;
                
                // Weather Modifiers
                if (newState.weather === 'rain' && (res === 'grain' || res === 'cotton')) amount += 1;
                if (newState.weather === 'storm') amount = Math.floor(amount * 0.5);
                if (newState.weather === 'snow' && res === 'wood') amount = Math.max(0, amount - 1); 

                // Special: Plantation yield boost for luxury
                if (imp.name === 'Plantation') amount += 1; 

                newInventory[res] = (newInventory[res] || 0) + amount;
            });
        }
        
        // --- 1b. Passive Yields from Improvements (Civic/Infra/Wonder/Etc) ---
        if (tile.improvement && tile.ownerId === 'player') {
            const imp = tile.improvement;
            if (imp.perTurnScience) {
                newState.science += imp.perTurnScience;
            }
            if (imp.perTurnGold) {
                addedTreasury += imp.perTurnGold;
            }
            if (imp.perTurnYields) {
                Object.entries(imp.perTurnYields).forEach(([res, amount]) => {
                    newInventory[res as ResourceType] = (newInventory[res as ResourceType] || 0) + (amount as number);
                });
            }
        }

        // --- 1c. City Base Yields ---
        if (tile.structure === 'city' && tile.ownerId === 'player') {
             newInventory['grain'] = (newInventory['grain'] || 0) + 2;
             newInventory['wood'] = (newInventory['wood'] || 0) + 1;
             newInventory['food'] = (newInventory['food'] || 0) + 2; 
             
             // X4 RESEARCH: Add base city science (4)
             newState.science += 4;

             // Base City Gold (Taxation)
             // Base: 10, Per Pop: 2
             const cityGold = 10 + (tile.population * 2);
             addedTreasury += cityGold;

             // Districts Passive Yields
             if (tile.districts) {
                 tile.districts.forEach(dType => {
                    const dist = DISTRICTS[dType];
                    if (dist.perTurnScience) newState.science += dist.perTurnScience;
                    if (dist.perTurnGold) addedTreasury += dist.perTurnGold;
                    if (dist.perTurnYields) {
                         Object.entries(dist.perTurnYields).forEach(([res, amount]) => {
                             newInventory[res as ResourceType] = (newInventory[res as ResourceType] || 0) + (amount as number);
                        });
                    }
                 });
             }
        }
        
        // Simple AI Resource/Growth simulation (abstracted)
        if (tile.structure === 'city' && tile.ownerId !== 'player') {
            // Chance to grow population
            if (Math.random() < 0.1) {
                const idx = newState.tiles.findIndex(t => t.id === tile.id);
                if (idx !== -1) newState.tiles[idx].population += 1;
            }
        }
    });

    if (addedTreasury > 0) {
        newState.treasury += addedTreasury;
    }

    // 2. Manufacturing Phase
    state.tiles.forEach(tile => {
        if (tile.ownerId === 'player' && tile.improvement && (tile.improvement.type === 'manufacturing' || tile.improvement.type === 'wonder')) {
            const imp = tile.improvement;
            let canProduce = true;
            
            // Note: Wonders now primarily use perTurnYields/perTurnScience, but can still have manufacturing if inputs are defined.
            // Only run manufacturing logic if inputs are defined.
            if (imp.input && imp.input.length > 0) {
                const rate = imp.productionRate || 1;
                // Check inputs
                imp.input.forEach(inputRes => {
                    // Check if input is luxury (reusable source) or consumable
                    if ((newInventory[inputRes] || 0) < 1) {
                        canProduce = false;
                    }
                });

                if (canProduce) {
                    // Consume Inputs
                    imp.input.forEach(inputRes => {
                        newInventory[inputRes] = (newInventory[inputRes] || 0) - 1;
                    });
                    
                    // Produce Outputs
                    imp.output?.forEach(res => {
                         let amount = rate;
                         if (newState.weather === 'storm') amount = Math.floor(amount * 0.5);
                         newInventory[res] = (newInventory[res] || 0) + amount;
                    });
                }
            } else if (imp.output && imp.output.length > 0 && imp.type === 'manufacturing') {
                // Manufacturing without inputs (passive generation)
                const rate = imp.productionRate || 1;
                imp.output.forEach(res => {
                    let amount = rate;
                    if (newState.weather === 'storm') amount = Math.floor(amount * 0.5);
                    newInventory[res] = (newInventory[res] || 0) + amount;
                });
            }
        }
    });

    // 4. Update Game State
    newState.inventory = newInventory;
    newState.units = newUnits;
    newState.turn += 1;
    newState.processingTurn = false;

    return newState;
};
