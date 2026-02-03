
export enum Act {
    I = 'Act I: The Dawn',
    II = 'Act II: The Bronze Age',
    III = 'Act III: The Iron Age',
    IV = 'Act IV: Classical Antiquity',
    V = 'Act V: The Middle Ages',
    VI = 'Act VI: The Renaissance',
    VII = 'Act VII: The Enlightenment',
    VIII = 'Act VIII: The Machine Age',
    IX = 'Act IX: The Atomic Age',
    X = 'Act X: The Interstellar Age'
}

export type CivilizationName = 'Africa' | 'Polynesia' | 'Rome' | 'China' | 'Inca' | 'United States' | 'Scotland';

export interface Civilization {
    name: CivilizationName;
    description: string;
    bonus: string;
    startingTechs: string[];
    color: string;
    units?: UnitType[]; // Optional starting units override
}

export const CIVILIZATIONS: Record<CivilizationName, Civilization> = {
    'Africa': {
        name: 'Africa',
        description: 'Cradle of humanity, rich in resources and culture.',
        bonus: '+2 Gold from Mines',
        startingTechs: ['agriculture', 'mining'],
        color: '#f59e0b' // Amber
    },
    'Polynesia': {
        name: 'Polynesia',
        description: 'Masters of the sea and island navigation.',
        bonus: 'Units ignore movement penalty on Coast',
        startingTechs: ['agriculture', 'sailing'],
        color: '#0ea5e9' // Sky Blue
    },
    'Rome': {
        name: 'Rome',
        description: 'Legions, engineering, and the glory of empire.',
        bonus: '+10% Science generation',
        startingTechs: ['agriculture', 'writing'],
        color: '#8b5cf6' // Violet
    },
    'China': {
        name: 'China',
        description: 'Ancient dynasties with disciplined armies.',
        bonus: '+10% Combat Strength in friendly territory',
        startingTechs: ['agriculture', 'archery'],
        color: '#ef4444' // Red
    },
    'Inca': {
        name: 'Inca',
        description: 'Builders of mountain citadels and terrace farms.',
        bonus: 'Farms on Hills provide +1 Food',
        startingTechs: ['agriculture', 'masonry'],
        color: '#22c55e' // Green
    },
    'United States': {
        name: 'United States',
        description: 'Vast plains and industrial potential.',
        bonus: 'Industrial Zones cost 20% less',
        startingTechs: ['agriculture', 'pottery'],
        color: '#3b82f6' // Blue
    },
    'Scotland': {
        name: 'Scotland',
        description: 'Highlanders fierce in defense of their freedom.',
        bonus: 'Hills provide +1 Defense to units',
        startingTechs: ['agriculture', 'animal_husbandry'],
        color: '#1d4ed8' // Dark Blue
    }
};

export type ResourceType = 
    // Raw
    'grain' | 'wood' | 'ore' | 'clay' | 'stone' | 'cotton' | 'fur' | 'grape' | 'precious_metal' | 'precious_stones' | 'salt' | 'spice' | 'cattle' | 'goat' | 'sheep' | 'horse' | 'hogs' | 'wool' | 'mandrake' | 'tea_leaves' | 'fish' | 'iron' | 'dye' | 'saffron' | 'silk' | 'vanilla' | 'flowers' | 'silicates' |
    // Enlightenment Raw
    'rubber' | 'aluminum' | 'coal' |
    // Machine Age Raw
    'uranium' | 'crude_oil' |
    // Manufactured
    'food' | 'lumber' | 'tools' | 'amenities' | 'basket' | 'jewelry' | 'leather' | 'syrup' | 'cured_meat' | 'plow' | 'wine' | 'bread' | 'herbal_medicine' | 'ceramic_pots' | 'metal_ingot' | 'food_oil' |
    // Bronze/Iron Age Manufactured
    'fabric' | 'salted_fish' | 'carriage' | 'decorative_vase' | 'wheel' | 'bandage' | 'furniture' | 'rope' | 'tunic' | 'sandal' | 'anvil' | 'metal_pot' | 'metal_tool' | 'tallow' | 'candle' | 'biscuit' | 'baked_goods' | 'loom' |
    // Antiquities Manufactured
    'coins' | 'paper' | 'barrel' | 'concrete' | 'gear' | 'glass' | 'mining_pick' | 'grain_store' | 'preserved_food' | 'book' |
    // Middle Age Manufactured
    'beer' | 'censer' | 'paintings' | 'dried_food' | 'liquor' | 'medicine' | 'pastries' | 'perfume' | 'soap' | 'stained_glass' | 'statuary' |
    // Renaissance Manufactured
    'explosive' | 'eyeglasses' | 'stove' | 'newspaper' | 'map' | 'steel' | 'telescope' | 'cannon_parts' |
    // Enlightenment Manufactured
    'canned_food' | 'currency' | 'fuel' | 'industrial_tools' | 'lamp_post' | 'machined_parts' | 'piano' | 'sewing_machine' | 'trousers' | 'cement' |
    // Machine Age Manufactured
    'fuselage' | 'light_bulb' | 'power' | 'antibiotic' | 'indoor_toilets' | 'tractor' | 'car' | 'engine' | 'movie' | 'musical_instruments' | 'photograph' | 'radio' | 'record_album' | 'vaccine' |
    // Atomic Age Manufactured
    'sneakers' | 'toy' | 'refrigerator' | 'fertilizer' | 'fresh_produce' | 'air_conditioner' | 'microwave' | 'plastic' | 'plastic_container' | 'computer' | 'electronics' |
    // Information Age Manufactured
    'game_console' | 'tablet' | 'mobile_phone' | 'hd_television' | 'cybernetics' | 'fuel_cell' | 'gene_therapy' |
    // Future Age
    'nanobots' | 'fusion_core' | 'quantum_chip' |
    // Interstellar Age
    'biofuel' | 'bionics' | 'alloys' | 'neutronium' | 'deuterium' | 'dark_matter' | 'programmable_matter' | 'superconductive_coil' |
    // Other
    'water' | 'health' | 'gold' | 'science';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';
export type UnitType = 'settler' | 'scout' | 'spearman' | 'archer' | 'hoplite' | 'immortal' | 'impi' | 'jaguar' | 'catapult' | 'knight' | 'trireme' | 'house_archer' | 'longship' | 'pikeman' | 'cataphract' |
    // Middle Age Units
    'crossbowman' | 'longbowman' | 'cog' | 'carrack' | 'lancer' | 'trebuchet' | 'musketman' |
    // Renaissance Units
    'cannon' | 'man_at_arms' | 'caravel' | 'galleon' |
    // Enlightenment Units
    'mortar' | 'line_infantry' | 'frigate' | 'ironclad' |
    // Machine Age Units
    'infantry' | 'tank' | 'dreadnought' |
    // Atomic Age Units
    'aircraft_carrier' | 'bomber' | 'jet_fighter' | 'assault_infantry' | 'modern_armor' | 'nuclear_submarine' | 'helicopter' | 'rocket_artillery' |
    // Information Age Units
    'dread_lancer' | 'cyber_soldier' |
    // Future Units
    'mech_warrior' | 'railgun_destroyer' |
    // Interstellar Units
    'starship';

export type DistrictType = 'residential' | 'commercial' | 'industrial' | 'military' | 'government';

export type TerrainType = 'ocean' | 'coast' | 'mountains' | 'hill' | 'tundra' | 'desert' | 'shrubland' | 'plains' | 'forest' | 'swamp' | 'savanna';

export interface Tech {
    id: string;
    name: string;
    cost: number;
    description: string;
    prerequisites: string[];
    unlocks: string[];
    tree: 'standard' | 'advance';
}

export interface Improvement {
    name: string;
    type: 'civic' | 'manufacturing' | 'infrastructure' | 'wonder' | 'gathering';
    cost: number;
    techRequired?: string;
    terrainRequired?: TerrainType[];
    buildCost?: Partial<Record<ResourceType, number>>;
    housing?: number;
    productionRate?: number;
    input?: ResourceType[];
    output?: ResourceType[];
    perTurnScience?: number;
    perTurnGold?: number;
    perTurnYields?: Partial<Record<ResourceType, number>>;
    description?: string;
}

export interface District {
    name: string;
    type: DistrictType;
    cost: number;
    techRequired: string;
    bonuses: string[];
    perTurnScience?: number;
    perTurnGold?: number;
    perTurnYields?: Partial<Record<ResourceType, number>>;
}

export interface UnitDefinition {
    name: string;
    cost: number;
    moves: number;
    strength: number;
    techRequired?: string;
    districtRequired?: DistrictType;
    movementType: 'land' | 'water' | 'air' | 'space';
}

export interface Tile {
    id: string;
    q: number;
    r: number;
    terrain: TerrainType;
    resource: ResourceType | null;
    population: number;
    ownerId: string | null;
    improvement: Improvement | null;
    districts: DistrictType[] | null;
    variation: number;
    isNaturalWonder?: boolean;
    wonderName?: string;
    structure?: 'city';
    hasRoad?: boolean;
    hasMagrail?: boolean;
}

export interface Unit {
    id: string;
    type: UnitType;
    tileId: string;
    moves: number;
    maxMoves: number;
    owner: string;
}

export interface GameState {
    act: Act;
    turn: number;
    treasury: number;
    science: number;
    researchedTechs: string[];
    inventory: Partial<Record<ResourceType, number>>;
    tiles: Tile[];
    units: Unit[];
    selectedTileId: string | null;
    processingTurn: boolean;
    logs: string[];
    cameraMode: string;
    weather: WeatherType;
    playerCivilization: CivilizationName | null;
}

export const TECHS: Record<string, Tech> = {
    // --- STANDARD TREE ---
    agriculture: { id: 'agriculture', name: 'Agriculture', cost: 0, description: 'The foundation of civilization.', prerequisites: [], unlocks: ['Farm', 'Dwelling', 'Palace'], tree: 'standard' },
    mining: { id: 'mining', name: 'Mining', cost: 50, description: 'Extract resources.', prerequisites: ['agriculture'], unlocks: ['Mine', 'Stone Pit'], tree: 'standard' },
    pottery: { id: 'pottery', name: 'Pottery', cost: 50, description: 'Store food.', prerequisites: ['agriculture'], unlocks: ['Granary', 'Ceramic Shop', 'Clay Pit', 'Bakery'], tree: 'standard' },
    animal_husbandry: { id: 'animal_husbandry', name: 'Animal Husbandry', cost: 50, description: 'Domesticate animals.', prerequisites: ['agriculture'], unlocks: ['Pasture', 'Hunting Camp', 'Butcher Shop'], tree: 'standard' },
    
    // Bronze Age
    sailing: { id: 'sailing', name: 'Sailing', cost: 80, description: 'Navigate the waters.', prerequisites: ['pottery'], unlocks: ['Dock', 'Fishing Net', 'Trireme'], tree: 'standard' },
    wheel: { id: 'wheel', name: 'The Wheel', cost: 100, description: 'Transportation revolution.', prerequisites: ['mining'], unlocks: ['Road', 'Carriage', 'Stable'], tree: 'standard' },
    weaving: { id: 'weaving', name: 'Weaving', cost: 100, description: 'Create fabrics.', prerequisites: ['animal_husbandry'], unlocks: ['Weaver', 'Tannery'], tree: 'standard' },
    mysticism: { id: 'mysticism', name: 'Mysticism', cost: 120, description: 'Connection to the divine.', prerequisites: ['pottery'], unlocks: ['Altar', 'Stonehenge'], tree: 'standard' },
    
    // Iron Age
    archery: { id: 'archery', name: 'Archery', cost: 100, description: 'Ranged warfare.', prerequisites: ['animal_husbandry'], unlocks: ['Archer', 'Watchtower'], tree: 'standard' },
    iron_working: { id: 'iron_working', name: 'Iron Working', cost: 150, description: 'Stronger metals.', prerequisites: ['mining'], unlocks: ['Iron Mine', 'Blacksmith', 'Anvil'], tree: 'standard' },
    fermentation: { id: 'fermentation', name: 'Fermentation', cost: 80, description: 'Beverages.', prerequisites: ['agriculture'], unlocks: ['Fermenting Pit'], tree: 'standard' },
    bronze_working: { id: 'bronze_working', name: 'Bronze Working', cost: 120, description: 'Alloys.', prerequisites: ['mining'], unlocks: ['Spearman', 'Smithy', 'Hoplite'], tree: 'standard' },
    masonry: { id: 'masonry', name: 'Masonry', cost: 100, description: 'Stone buildings.', prerequisites: ['mining'], unlocks: ['Walls', 'Residential District', 'Water Well'], tree: 'standard' },
    writing: { id: 'writing', name: 'Writing', cost: 150, description: 'Record keeping.', prerequisites: ['pottery'], unlocks: ['Apothecary', 'Commercial District'], tree: 'standard' },
    mathematics: { id: 'mathematics', name: 'Mathematics', cost: 200, description: 'Numbers.', prerequisites: ['writing', 'archery'], unlocks: ['Catapult'], tree: 'standard' },
    engineering: { id: 'engineering', name: 'Engineering', cost: 300, description: 'Construction.', prerequisites: ['mathematics', 'masonry'], unlocks: ['Industrial District', 'Irrigated Farm'], tree: 'standard' },
    military_tactics: { id: 'military_tactics', name: 'Military Tactics', cost: 250, description: 'Warfare.', prerequisites: ['bronze_working', 'archery'], unlocks: ['Military District', 'House Archer'], tree: 'standard' },
    currency: { id: 'currency', name: 'Currency', cost: 300, description: 'Standardized trade.', prerequisites: ['writing', 'mathematics'], unlocks: ['Trading Post', 'Inn'], tree: 'standard' },
    navigation: { id: 'navigation', name: 'Navigation', cost: 300, description: 'Ocean travel.', prerequisites: ['sailing', 'mathematics'], unlocks: ['Lighthouse', 'Longship'], tree: 'standard' },
    horticulture: { id: 'horticulture', name: 'Horticulture', cost: 250, description: 'Cultivation of plants.', prerequisites: ['agriculture'], unlocks: ['Hanging Gardens', 'Plantation'], tree: 'standard' },

    // Antiquities
    coinage: { id: 'coinage', name: 'Coinage', cost: 400, description: 'State-issued currency.', prerequisites: ['currency', 'iron_working'], unlocks: ['Mint', 'Bazaar'], tree: 'standard' },
    education: { id: 'education', name: 'Education', cost: 450, description: 'Formal learning.', prerequisites: ['writing'], unlocks: ['School', 'Library', 'Great Library'], tree: 'standard' },
    machinery: { id: 'machinery', name: 'Machinery', cost: 500, description: 'Complex mechanisms.', prerequisites: ['engineering', 'wheel'], unlocks: ['Mill', 'Gear'], tree: 'standard' },
    glassblowing: { id: 'glassblowing', name: 'Glassblowing', cost: 400, description: 'Shaping glass.', prerequisites: ['pottery', 'fire'], unlocks: ['Glassmaker', 'Sand Pit'], tree: 'standard' },
    construction: { id: 'construction', name: 'Construction', cost: 550, description: 'Advanced building techniques.', prerequisites: ['engineering', 'masonry'], unlocks: ['City Walls', 'Concrete', 'Castle'], tree: 'standard' },
    civil_service: { id: 'civil_service', name: 'Civil Service', cost: 600, description: 'Government administration.', prerequisites: ['writing', 'currency'], unlocks: ['Town Center', 'Pikeman'], tree: 'standard' },

    // Middle Ages
    guilds: { id: 'guilds', name: 'Guilds', cost: 750, description: 'Professional associations.', prerequisites: ['currency', 'civil_service'], unlocks: ['Crafting Guild', 'Artisan Studio', 'Cobbler', 'Grocer'], tree: 'standard' },
    theology: { id: 'theology', name: 'Theology', cost: 700, description: 'Study of the divine.', prerequisites: ['mysticism', 'writing'], unlocks: ['Monastery', 'Shrine', 'Cemetery'], tree: 'standard' },
    chivalry: { id: 'chivalry', name: 'Chivalry', cost: 800, description: 'The knightly code.', prerequisites: ['military_tactics'], unlocks: ['Knight', 'Lancer'], tree: 'standard' },
    cartography: { id: 'cartography', name: 'Cartography', cost: 800, description: 'Advanced mapping.', prerequisites: ['navigation', 'writing'], unlocks: ['Cog', 'Carrack'], tree: 'standard' },
    metallurgy: { id: 'metallurgy', name: 'Metallurgy', cost: 850, description: 'Advanced metalworking.', prerequisites: ['iron_working', 'chemistry'], unlocks: ['Armory', 'Crossbowman'], tree: 'standard' },
    chemistry: { id: 'chemistry', name: 'Chemistry', cost: 800, description: 'Study of matter.', prerequisites: ['apothecary', 'glassblowing'], unlocks: ['Chemist', 'Distillery', 'Brewery'], tree: 'standard' },
    physics: { id: 'physics', name: 'Physics', cost: 900, description: 'Laws of nature.', prerequisites: ['mathematics', 'machinery'], unlocks: ['Trebuchet', 'Observatory'], tree: 'standard' },
    banking: { id: 'banking', name: 'Banking', cost: 900, description: 'Financial systems.', prerequisites: ['coinage', 'guilds'], unlocks: ['Central Bank'], tree: 'standard' },
    drama: { id: 'drama', name: 'Drama', cost: 700, description: 'Theatrical arts.', prerequisites: ['writing'], unlocks: ['Amphitheater', 'Park'], tree: 'standard' },
    academia: { id: 'academia', name: 'Academia', cost: 950, description: 'Higher learning.', prerequisites: ['education', 'theology'], unlocks: ['University'], tree: 'standard' },
    gunpowder: { id: 'gunpowder', name: 'Gunpowder', cost: 1200, description: 'Explosive powder.', prerequisites: ['chemistry', 'metallurgy'], unlocks: ['Musketman'], tree: 'standard' },

    // Renaissance
    printing_press: { id: 'printing_press', name: 'Printing Press', cost: 1500, description: 'Mass production of text.', prerequisites: ['machinery', 'writing'], unlocks: ['Print Shop', 'Newspaper'], tree: 'standard' },
    optics: { id: 'optics', name: 'Optics', cost: 1300, description: 'Lenses and light.', prerequisites: ['glassblowing', 'physics'], unlocks: ['Eye Glasses', 'Telescope'], tree: 'standard' },
    anatomy: { id: 'anatomy', name: 'Anatomy', cost: 1400, description: 'Detailed medical study.', prerequisites: ['academia', 'chemistry'], unlocks: ['General Hospital'], tree: 'standard' },
    blast_furnace: { id: 'blast_furnace', name: 'Blast Furnace', cost: 1600, description: 'High heat smelting.', prerequisites: ['metallurgy'], unlocks: ['Forge', 'Steel', 'Indoor Stove'], tree: 'standard' },
    naval_engineering: { id: 'naval_engineering', name: 'Naval Engineering', cost: 1500, description: 'Advanced ship design.', prerequisites: ['cartography'], unlocks: ['Drydock', 'Galleon', 'Caravel'], tree: 'standard' },
    ballistics: { id: 'ballistics', name: 'Ballistics', cost: 1800, description: 'Projectile physics.', prerequisites: ['physics', 'gunpowder'], unlocks: ['Cannon', 'Explosive'], tree: 'standard' },
    globalization: { id: 'globalization', name: 'Globalization', cost: 1400, description: 'Worldwide trade networks.', prerequisites: ['cartography', 'banking'], unlocks: ['Coffee House', 'Plaza'], tree: 'standard' },
    mechanization: { id: 'mechanization', name: 'Mechanization', cost: 1600, description: 'Wind and water power.', prerequisites: ['machinery', 'engineering'], unlocks: ['Windmill'], tree: 'standard' },

    // Enlightenment
    industrialization: { id: 'industrialization', name: 'Industrialization', cost: 2000, description: 'Machine manufacturing.', prerequisites: ['mechanization', 'blast_furnace'], unlocks: ['Factory', 'Coal', 'Steam Engine'], tree: 'standard' },
    refining: { id: 'refining', name: 'Refining', cost: 1800, description: 'Chemical purification.', prerequisites: ['chemistry'], unlocks: ['Refinery', 'Fuel', 'Rubber'], tree: 'standard' },
    enlightenment_civics: { id: 'enlightenment_civics', name: 'Enlightenment Civics', cost: 1900, description: 'Reason and individualism.', prerequisites: ['globalization'], unlocks: ['City Hall', 'Museum', 'Currency'], tree: 'standard' },
    mass_production: { id: 'mass_production', name: 'Mass Production', cost: 2200, description: 'Assembly lines.', prerequisites: ['industrialization'], unlocks: ['Canned Food', 'Sewing Machine', 'Tailor'], tree: 'standard' },
    modern_warfare: { id: 'modern_warfare', name: 'Modern Warfare', cost: 2400, description: 'Organized large-scale conflict.', prerequisites: ['ballistics'], unlocks: ['Line Infantry', 'Mortar'], tree: 'standard' },
    steel_hulls: { id: 'steel_hulls', name: 'Steel Hulls', cost: 2500, description: 'Armored naval vessels.', prerequisites: ['naval_engineering', 'blast_furnace'], unlocks: ['Ironclad', 'Frigate'], tree: 'standard' },
    cultural_heritage: { id: 'cultural_heritage', name: 'Cultural Heritage', cost: 2000, description: 'Celebrating history and arts.', prerequisites: ['drama', 'enlightenment_civics'], unlocks: ['Concert Hall', 'Exhibition Hall', 'Piano'], tree: 'standard' },
    materials_science: { id: 'materials_science', name: 'Materials Science', cost: 2300, description: 'New construction materials.', prerequisites: ['blast_furnace', 'chemistry'], unlocks: ['Cement Plant', 'Foundry', 'Aluminum'], tree: 'standard' },

    // Machine Age
    combustion: { id: 'combustion', name: 'Combustion', cost: 3000, description: 'Internal combustion engines.', prerequisites: ['refining', 'industrialization'], unlocks: ['Oil Well', 'Vehicle Factory', 'Engine', 'Car'], tree: 'standard' },
    flight: { id: 'flight', name: 'Flight', cost: 3200, description: 'Heavier than air travel.', prerequisites: ['combustion', 'physics'], unlocks: ['Air Force Base', 'Aircraft Factory', 'Fuselage'], tree: 'standard' },
    electronics: { id: 'electronics', name: 'Electronics', cost: 3100, description: 'Control of electricity.', prerequisites: ['physics', 'materials_science'], unlocks: ['Radio Tower', 'Radio', 'Light Bulb'], tree: 'standard' },
    sanitation: { id: 'sanitation', name: 'Sanitation', cost: 2800, description: 'Public health systems.', prerequisites: ['chemistry', 'enlightenment_civics'], unlocks: ['Water Treatment Plant', 'Clinic', 'Indoor Toilets', 'Soap'], tree: 'standard' },
    mass_media: { id: 'mass_media', name: 'Mass Media', cost: 2900, description: 'Broadcast entertainment.', prerequisites: ['electronics', 'cultural_heritage'], unlocks: ['Movie Studio', 'Theater', 'Movie', 'Photograph', 'Record Album'], tree: 'standard' },
};

export const RESOURCES: Partial<Record<ResourceType, { name: string; icon?: string }>> = {
    grain: { name: 'Grain', icon: '🌾' },
    wood: { name: 'Wood', icon: '🌲' },
    ore: { name: 'Ore', icon: '⛏️' },
    food: { name: 'Food', icon: '🍎' },
    gold: { name: 'Gold', icon: '💰' },
    science: { name: 'Science', icon: '🧪' },
};

export const IMPROVEMENTS: Record<string, Improvement> = {
    road: { name: 'Road', type: 'infrastructure', cost: 10, description: 'Reduces movement cost.' },
    farm: { name: 'Farm', type: 'gathering', cost: 20, terrainRequired: ['plains', 'savanna'], output: ['grain'], productionRate: 2, description: 'Produces food.' },
    mine: { name: 'Mine', type: 'gathering', cost: 50, terrainRequired: ['hill', 'mountains'], output: ['ore'], productionRate: 2, description: 'Extracts minerals.' },
    plantation: { name: 'Plantation', type: 'gathering', cost: 40, output: ['cotton'], productionRate: 1 },
    camp: { name: 'Camp', type: 'gathering', cost: 30, output: ['fur'], productionRate: 1 },
    pasture: { name: 'Pasture', type: 'gathering', cost: 30, output: ['cattle'], productionRate: 1 },
    fishing_net: { name: 'Fishing Net', type: 'gathering', cost: 25, terrainRequired: ['coast'], output: ['fish'], productionRate: 2 },
    lumber_mill: { name: 'Lumber Mill', type: 'gathering', cost: 40, terrainRequired: ['forest'], output: ['lumber'], productionRate: 2 },
    // Add more to prevent runtime issues
};

export const DISTRICTS: Record<string, District> = {
    residential: { name: 'Residential District', type: 'residential', cost: 100, techRequired: 'masonry', bonuses: ['+5 Housing'] },
    commercial: { name: 'Commercial District', type: 'commercial', cost: 150, techRequired: 'writing', bonuses: ['+2 Gold/turn'], perTurnGold: 2 },
    industrial: { name: 'Industrial District', type: 'industrial', cost: 200, techRequired: 'engineering', bonuses: ['+2 Production'], perTurnYields: { tools: 1 } },
    military: { name: 'Military District', type: 'military', cost: 180, techRequired: 'military_tactics', bonuses: ['Unit Training Speed'] },
    government: { name: 'Government District', type: 'government', cost: 300, techRequired: 'civil_service', bonuses: ['+1 Influence'] }
};

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
    settler: { name: 'Settler', cost: 100, moves: 2, strength: 0, movementType: 'land' },
    scout: { name: 'Scout', cost: 30, moves: 3, strength: 5, movementType: 'land' },
    spearman: { name: 'Spearman', cost: 50, moves: 2, strength: 15, movementType: 'land', techRequired: 'bronze_working' },
    archer: { name: 'Archer', cost: 60, moves: 2, strength: 10, movementType: 'land', techRequired: 'archery' },
    warrior: { name: 'Warrior', cost: 40, moves: 2, strength: 10, movementType: 'land' },
} as any;
