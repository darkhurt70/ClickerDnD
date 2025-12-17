// Données des bâtiments du jeu
// producesResource = true pour les bâtiments qui produisent des ressources (à stocker dans l'inventaire)
// producesResource = false pour les bâtiments qui donnent directement de l'argent

// Types d'effets des capacités :
// "production_percent" : +X% production
// "production_multiply" : xX production
// "production_add" : +X ressources par niveau
// "click_bonus" : +X% bonus de clic (multiplicatif)
// "click_value_add" : +X pc par clic (additif, avant les bonus %)
// "click_gains_multiply" : xX sur les gains totaux de clics
// "global_bonus" : +X% global (tout le jeu)
// "sell_bonus" : +X% sur prix de vente des ressources

// ===== DONNÉES DE L'ATELIER DE VARGAS =====

// Crafts standards (5 tiers)
const CRAFTS_DATA = [
    // Tier 1 - Simples
    { id: 0, name: "Soupe paysanne", tier: 1, ingredients: [{ type: "resource", name: "Légume", quantity: 30 }, { type: "resource", name: "Viande", quantity: 10 }], time: 1, multiplier: 1.4 },
    { id: 1, name: "Sac en cuir", tier: 1, ingredients: [{ type: "resource", name: "Peau", quantity: 30 }], time: 1, multiplier: 1.3 },
    { id: 2, name: "Ration simple", tier: 1, ingredients: [{ type: "resource", name: "Légume", quantity: 20 }, { type: "resource", name: "Viande", quantity: 10 }], time: 1, multiplier: 1.25 },
    { id: 3, name: "Viande séchée", tier: 1, ingredients: [{ type: "resource", name: "Viande", quantity: 20 }], time: 1, multiplier: 1.2 },
    { id: 4, name: "Trousse rustique", tier: 1, ingredients: [{ type: "craft", name: "Sac en cuir", quantity: 10 }, { type: "craft", name: "Ration simple", quantity: 10 }], time: 2, multiplier: 1.5 },

    // Tier 2 - Artisanat brut
    { id: 5, name: "Lingot brut", tier: 2, ingredients: [{ type: "resource", name: "Minerai", quantity: 20 }], time: 2, multiplier: 1.5 },
    { id: 6, name: "Lame brute", tier: 2, ingredients: [{ type: "resource", name: "Arme", quantity: 10 }, { type: "craft", name: "Lingot brut", quantity: 20 }], time: 2, multiplier: 1.4 },
    { id: 7, name: "Sac renforcé", tier: 2, ingredients: [{ type: "craft", name: "Sac en cuir", quantity: 10 }, { type: "resource", name: "Peau", quantity: 10 }], time: 2, multiplier: 1.6 },
    { id: 8, name: "Couteau utilitaire", tier: 2, ingredients: [{ type: "craft", name: "Lame brute", quantity: 10 }, { type: "resource", name: "Peau", quantity: 100 }], time: 3, multiplier: 1.7 },
    { id: 9, name: "Ration renforcée", tier: 2, ingredients: [{ type: "craft", name: "Ration simple", quantity: 10 }, { type: "resource", name: "Viande", quantity: 100 }], time: 2, multiplier: 1.6 },

    // Tier 3 - Alchimique & magique
    { id: 10, name: "Essence alchimique", tier: 3, ingredients: [{ type: "resource", name: "Potion", quantity: 20 }, { type: "resource", name: "Viande", quantity: 200 }], time: 3, multiplier: 1.8 },
    { id: 11, name: "Catalyseur de mana", tier: 3, ingredients: [{ type: "resource", name: "Cristal de Mana", quantity: 20 }, { type: "craft", name: "Lingot brut", quantity: 100 }], time: 3, multiplier: 1.9 },
    { id: 12, name: "Potion d'endurance", tier: 3, ingredients: [{ type: "craft", name: "Élixir mineur", quantity: 10 }, { type: "craft", name: "Ration renforcée", quantity: 20 }], time: 3, multiplier: 2.0 },
    { id: 13, name: "Talisman instable", tier: 3, ingredients: [{ type: "craft", name: "Catalyseur de mana", quantity: 10 }, { type: "craft", name: "Sac renforcé", quantity: 10 }], time: 4, multiplier: 2.1 },
    { id: 14, name: "Élixir mineur", tier: 3, ingredients: [{ type: "craft", name: "Essence alchimique", quantity: 10 }, { type: "resource", name: "Potion", quantity: 10 }], time: 4, multiplier: 2.3 },

    // Tier 4 - Sacré et cosmique
    { id: 15, name: "Sceau consacré", tier: 4, ingredients: [{ type: "resource", name: "Sceau magique", quantity: 10 }, { type: "craft", name: "Essence alchimique", quantity: 100 }], time: 5, multiplier: 2.6 },
    { id: 16, name: "Relique éveillée", tier: 4, ingredients: [{ type: "resource", name: "Relique sacrée", quantity: 30 }, { type: "craft", name: "Catalyseur de mana", quantity: 110 }], time: 6, multiplier: 2.8 },
    { id: 17, name: "Condensat cosmique", tier: 4, ingredients: [{ type: "resource", name: "Énergie cosmique", quantity: 20 }, { type: "resource", name: "Cristal de Mana", quantity: 270 }], time: 6, multiplier: 3.0 },
    { id: 18, name: "Insigne astral", tier: 4, ingredients: [{ type: "craft", name: "Sceau consacré", quantity: 20 }, { type: "craft", name: "Talisman instable", quantity: 10 }], time: 7, multiplier: 3.2 },
    { id: 19, name: "Élixir transcendant", tier: 4, ingredients: [{ type: "craft", name: "Élixir mineur", quantity: 100 }, { type: "craft", name: "Condensat cosmique", quantity: 10 }], time: 7, multiplier: 3.5 },

    // Tier 5 - Entropique & stellaire
    { id: 20, name: "Fragment du néant", tier: 5, ingredients: [{ type: "resource", name: "Écho du néant", quantity: 10 }, { type: "craft", name: "Relique éveillée", quantity: 270 }], time: 8, multiplier: 4.0 },
    { id: 21, name: "Sablier fracturé", tier: 5, ingredients: [{ type: "resource", name: "Sablier éternel", quantity: 10 }, { type: "craft", name: "Condensat cosmique", quantity: 1000 }], time: 9, multiplier: 5.0 },
    { id: 22, name: "Cœur instable", tier: 5, ingredients: [{ type: "resource", name: "Cœur d'étoile", quantity: 40 }, { type: "craft", name: "Élixir transcendant", quantity: 170 }], time: 10, multiplier: 6.0 },
    { id: 23, name: "Essence d'effondrement", tier: 5, ingredients: [{ type: "craft", name: "Fragment du néant", quantity: 30 }, { type: "craft", name: "Relique éveillée", quantity: 120 }], time: 11, multiplier: 7.0 },
    { id: 24, name: "Artefact originel", tier: 5, ingredients: [{ type: "craft", name: "Essence d'effondrement", quantity: 10 }, { type: "craft", name: "Cœur instable", quantity: 10 }], time: 14, multiplier: 8.0 }
];

// Monuments (crafts uniques)
const MONUMENTS_DATA = [
    { id: 0, name: "Autel des Premiers Jours", tier: 1, ingredients: [{ type: "craft", name: "Soupe paysanne", quantity: 5000 }, { type: "craft", name: "Ration simple", quantity: 5000 }, { type: "craft", name: "Sac en cuir", quantity: 3000 }, { type: "special", name: "Emblème de Subsistance", quantity: 1 }], time: 10, bonus: "T1" },
    { id: 1, name: "Forge des Liens Forgés", tier: 2, ingredients: [{ type: "craft", name: "Lingot brut", quantity: 3000 }, { type: "craft", name: "Couteau utilitaire", quantity: 2500 }, { type: "craft", name: "Sac renforcé", quantity: 2000 }, { type: "special", name: "Insigne d'Artisanat", quantity: 1 }], time: 14, bonus: "T2" },
    { id: 2, name: "Cercle Alchimique Majeur", tier: 3, ingredients: [{ type: "craft", name: "Essence alchimique", quantity: 2000 }, { type: "craft", name: "Talisman instable", quantity: 1500 }, { type: "craft", name: "Élixir mineur", quantity: 1000 }, { type: "special", name: "Sceau de Convergence", quantity: 1 }], time: 18, bonus: "T3" },
    { id: 3, name: "Sanctuaire Astral", tier: 4, ingredients: [{ type: "craft", name: "Relique éveillée", quantity: 1200 }, { type: "craft", name: "Insigne astral", quantity: 1000 }, { type: "craft", name: "Élixir transcendant", quantity: 800 }, { type: "special", name: "Sigil de Transcendance", quantity: 1 }], time: 22, bonus: "T4" },
    { id: 4, name: "Nexus de l'Origine", tier: 5, ingredients: [{ type: "craft", name: "Fragment du néant", quantity: 500 }, { type: "craft", name: "Sablier fracturé", quantity: 400 }, { type: "craft", name: "Cœur instable", quantity: 300 }, { type: "special", name: "Clef de l'Apocalypse", quantity: 1 }], time: 30, bonus: "T5" }
];

// Crafts Rose d'Éther (débloqués par monuments)
const ROSE_CRAFTS_DATA = [
    { id: 0, name: "Rose d'Éther I", tier: 1, ingredients: [{ type: "craft", name: "Soupe paysanne", quantity: 100 }, { type: "craft", name: "Ration simple", quantity: 100 }, { type: "craft", name: "Trousse rustique", quantity: 50 }], time: 6, multiplier: 3.0, requiresMonument: 0 },
    { id: 1, name: "Rose d'Éther II", tier: 2, ingredients: [{ type: "craft", name: "Lingot brut", quantity: 50 }, { type: "craft", name: "Couteau utilitaire", quantity: 50 }, { type: "craft", name: "Sac renforcé", quantity: 30 }, { type: "craft", name: "Rose d'Éther I", quantity: 20 }], time: 8, multiplier: 4.0, requiresMonument: 1 },
    { id: 2, name: "Rose d'Éther III", tier: 3, ingredients: [{ type: "craft", name: "Essence alchimique", quantity: 40 }, { type: "craft", name: "Talisman instable", quantity: 30 }, { type: "craft", name: "Élixir mineur", quantity: 20 }, { type: "craft", name: "Rose d'Éther II", quantity: 30 }], time: 10, multiplier: 5.0, requiresMonument: 2 },
    { id: 3, name: "Rose d'Éther IV", tier: 4, ingredients: [{ type: "craft", name: "Relique éveillée", quantity: 30 }, { type: "craft", name: "Insigne astral", quantity: 20 }, { type: "craft", name: "Élixir transcendant", quantity: 20 }, { type: "craft", name: "Rose d'Éther III", quantity: 50 }], time: 12, multiplier: 6.5, requiresMonument: 3 },
    { id: 4, name: "Rose d'Éther V", tier: 5, ingredients: [{ type: "craft", name: "Fragment du néant", quantity: 20 }, { type: "craft", name: "Sablier fracturé", quantity: 20 }, { type: "craft", name: "Cœur instable", quantity: 10 }, { type: "craft", name: "Rose d'Éther IV", quantity: 30 }], time: 16, multiplier: 8.0, requiresMonument: 4 },
    { id: 5, name: "Rose d'Éther", tier: 6, ingredients: [{ type: "craft", name: "Rose d'Éther I", quantity: 10 }, { type: "craft", name: "Rose d'Éther II", quantity: 10 }, { type: "craft", name: "Rose d'Éther III", quantity: 10 }, { type: "craft", name: "Rose d'Éther IV", quantity: 10 }, { type: "craft", name: "Rose d'Éther V", quantity: 10 }], time: 25, multiplier: 12.0, requiresMonument: 4, finalRose: true }
];

// Items spéciaux requis pour les monuments (obtenus via prestige ou événements futurs)
const SPECIAL_ITEMS_DATA = [
    { name: "Emblème de Subsistance", description: "Obtenu au prestige 5", prestigeRequired: 5 },
    { name: "Insigne d'Artisanat", description: "Obtenu au prestige 10", prestigeRequired: 10 },
    { name: "Sceau de Convergence", description: "Obtenu au prestige 20", prestigeRequired: 20 },
    { name: "Sigil de Transcendance", description: "Obtenu au prestige 35", prestigeRequired: 35 },
    { name: "Clef de l'Apocalypse", description: "Obtenu au prestige 50", prestigeRequired: 50 }
];

const BUILDINGS_DATA = [
    {
        id: 0,
        name: "Mendiant",
        baseCost: 1,
        baseProduction: 2,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Argent simple",
        description: "Un mendiant qui quémande quelques pièces",
        icon: "🧙‍♂️",
        producesResource: false,
        abilities: [
            { level: 10, cost: 10000, effect: { type: "click_bonus", value: 50 }, description: "+50% bonus de clic" },
            { level: 50, cost: 1000000, effect: { type: "click_bonus", value: 100 }, description: "+100% bonus de clic" },
            { level: 100, cost: 20000000, effect: { type: "click_bonus", value: 300 }, description: "+300% bonus de clic" },
            { level: 500, cost: 500000000, effect: { type: "click_bonus", value: 20000 }, description: "+20 000% bonus de clic" }
        ]
    },
    {
        id: 1,
        name: "Fouille-Tas",
        baseCost: 10,
        baseProduction: 8,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Argent variable",
        description: "Fouille les déchets pour trouver des trésors (±50%)",
        icon: "🗑️",
        isVariable: true,
        producesResource: false,
        abilities: [
            { level: 10, cost: 20000, effect: { type: "production_percent", value: 50 }, description: "+50% production" },
            { level: 50, cost: 2000000, effect: { type: "production_percent", value: 100 }, description: "+100% production" },
            { level: 100, cost: 40000000, effect: { type: "production_percent", value: 200 }, description: "+200% production" },
            { level: 500, cost: 1000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 production" }
        ]
    },
    {
        id: 2,
        name: "Fermier",
        baseCost: 50,
        schedule: ["matin", "aprem"],
        productionType: "Ressource",
        description: "Cultive des légumes frais",
        icon: "🌾",
        producesResource: true,
        resources: [
            { name: "Légume", quantity: 2, price: 10, icon: "🥬" }
        ],
        abilities: [
            { level: 10, cost: 30000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 légume par niveau" },
            { level: 50, cost: 3000000, effect: { type: "production_multiply", value: 2 }, description: "x2 légumes" },
            { level: 100, cost: 60000000, effect: { type: "production_multiply", value: 5 }, description: "x5 légumes" },
            { level: 500, cost: 1500000000, effect: { type: "production_multiply", value: 200 }, description: "x200 légumes" }
        ]
    },
    {
        id: 3,
        name: "Barde",
        baseCost: 200,
        baseProduction: 100,
        schedule: ["soir"],
        productionType: "Argent",
        description: "Chante des ballades pour les clients",
        icon: "🎵",
        producesResource: false,
        abilities: [
            { level: 10, cost: 50000, effect: { type: "production_percent", value: 50 }, description: "+50% production" },
            { level: 50, cost: 5000000, effect: { type: "production_percent", value: 150 }, description: "+150% production" },
            { level: 100, cost: 100000000, effect: { type: "production_percent", value: 500 }, description: "+500% production" },
            { level: 500, cost: 2500000000, effect: { type: "production_percent", value: 20000 }, description: "+20 000% production" }
        ]
    },
    {
        id: 4,
        name: "Chasseur",
        baseCost: 1000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressources",
        description: "Traque le gibier dans les bois",
        icon: "🏹",
        producesResource: true,
        resources: [
            { name: "Peau", quantity: 1, price: 50, icon: "🦌" },
            { name: "Viande", quantity: 1, price: 20, icon: "🥩" }
        ],
        abilities: [
            { level: 10, cost: 100000, effect: { type: "production_add", value: 1, resourceIndex: 1 }, description: "+1 viande par niveau" },
            { level: 50, cost: 10000000, effect: { type: "production_multiply", value: 2, resourceIndex: 1 }, description: "x2 viande" },
            { level: 100, cost: 200000000, effect: { type: "production_add", value: 2, resourceIndex: 0 }, description: "+2 peau par niveau" },
            { level: 500, cost: 5000000000, effect: { type: "production_multiply", value: 200 }, description: "x200 toutes ressources" }
        ]
    },
    {
        id: 5,
        name: "Mineur",
        baseCost: 5000,
        schedule: ["aprem"],
        productionType: "Ressource",
        description: "Extrait des minerais précieux",
        icon: "⛏️",
        producesResource: true,
        resources: [
            { name: "Minerai", quantity: 2, price: 40, icon: "⛰️" }
        ],
        abilities: [
            { level: 10, cost: 1000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 minerai par niveau" },
            { level: 50, cost: 50000000, effect: { type: "production_multiply", value: 2 }, description: "x2 minerai" },
            { level: 100, cost: 1000000000, effect: { type: "sell_bonus", value: 50, resourceName: "Minerai" }, description: "+50% prix de revente" },
            { level: 500, cost: 25000000000, effect: { type: "production_multiply", value: 200 }, description: "x200 minerai" }
        ]
    },
    {
        id: 6,
        name: "Forgeron",
        baseCost: 25000,
        schedule: ["aprem", "soir"],
        productionType: "Ressource",
        description: "Forge des armes de qualité",
        icon: "⚔️",
        producesResource: true,
        resources: [
            { name: "Arme", quantity: 1, price: 500, icon: "⚔️" }
        ],
        abilities: [
            { level: 10, cost: 2000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 arme par niveau" },
            { level: 50, cost: 100000000, effect: { type: "production_multiply", value: 2 }, description: "x2 armes" },
            { level: 100, cost: 2000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 armes" },
            { level: 500, cost: 50000000000, effect: { type: "production_multiply", value: 200 }, description: "x200 armes" }
        ]
    },
    {
        id: 7,
        name: "Marchand",
        baseCost: 100000,
        baseProduction: 800,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Argent",
        description: "Commerce avec les voyageurs",
        icon: "🏪",
        producesResource: false,
        abilities: [
            { level: 1, cost: 0, effect: { type: "unlock_autoreport", value: 0 }, description: "Débloque les rapports automatiques" },
            { level: 10, cost: 3000000, effect: { type: "global_bonus", value: 5 }, description: "+5% production globale" },
            { level: 50, cost: 150000000, effect: { type: "global_bonus", value: 10 }, description: "+10% production globale" },
            { level: 100, cost: 3000000000, effect: { type: "global_bonus", value: 30 }, description: "+30% production globale" },
            { level: 500, cost: 75000000000, effect: { type: "global_bonus", value: 55 }, description: "+55% production globale" }
        ]
    },
    {
        id: 8,
        name: "Alchimiste",
        baseCost: 500000,
        schedule: ["aprem"],
        productionType: "Ressource rare",
        description: "Prépare des potions magiques",
        icon: "⚗️",
        producesResource: true,
        resources: [
            { name: "Potion", quantity: 1, price: 3000, icon: "⚗️" }
        ],
        abilities: [
            { level: 10, cost: 5000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 potion par niveau" },
            { level: 50, cost: 250000000, effect: { type: "production_multiply", value: 2 }, description: "x2 potions" },
            { level: 100, cost: 5000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 potions" },
            { level: 500, cost: 125000000000, effect: { type: "production_multiply", value: 200 }, description: "x200 potions" }
        ]
    },
    {
        id: 9,
        name: "Tour du Mage",
        baseCost: 5000000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressource précieuse",
        description: "Génère des cristaux de mana pure",
        icon: "🔮",
        producesResource: true,
        resources: [
            { name: "Cristal de Mana", quantity: 1, price: 50000, icon: "🔮" }
        ],
        abilities: [
            { level: 10, cost: 10000000, effect: { type: "click_value_add", value: 100 }, description: "+1 pa par clic" },
            { level: 50, cost: 500000000, effect: { type: "click_value_add", value: 10000 }, description: "+1 po par clic" },
            { level: 100, cost: 10000000000, effect: { type: "click_value_add", value: 1000000 }, description: "+1 pp par clic" },
            { level: 500, cost: 250000000000, effect: { type: "click_gains_multiply", value: 2 }, description: "x2 gains de clics" }
        ]
    },
    {
        id: 10,
        name: "Observatoire Arcanique",
        baseCost: 5000000,
        schedule: ["matin"],
        productionType: "Ressource",
        description: "Capte l'énergie des étoiles",
        icon: "🌠",
        producesResource: true,
        resources: [
            { name: "Énergie Cosmique", quantity: 1, price: 100000, icon: "🌠" }
        ],
        abilities: [
            { level: 10, cost: 200000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 énergie par niveau" },
            { level: 50, cost: 20000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 énergie" },
            { level: 100, cost: 400000000000, effect: { type: "sell_bonus", value: 100, resourceName: "Énergie Cosmique" }, description: "+100% prix de vente" },
            { level: 500, cost: 10000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 énergie" }
        ]
    },
    {
        id: 11,
        name: "Sanctuaire de l'Esprit",
        baseCost: 50000000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressource",
        description: "Génère des reliques saintes",
        icon: "⛪",
        producesResource: true,
        resources: [
            { name: "Relique Sacrée", quantity: 1, price: 400000, icon: "📿" }
        ],
        abilities: [
            { level: 10, cost: 400000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 relique par niveau" },
            { level: 50, cost: 40000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 reliques" },
            { level: 100, cost: 800000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 reliques" },
            { level: 500, cost: 20000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 reliques" }
        ]
    },
    {
        id: 12,
        name: "Trône du Sorcier-Roi",
        baseCost: 5000000000,
        schedule: ["aprem"],
        productionType: "Ressource",
        description: "Crée des sceaux de pouvoir",
        icon: "👑",
        producesResource: true,
        resources: [
            { name: "Sceau Magique", quantity: 1, price: 1500000, icon: "🪙" }
        ],
        abilities: [
            { level: 10, cost: 600000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 sceau par niveau" },
            { level: 50, cost: 60000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 sceaux" },
            { level: 100, cost: 1200000000000, effect: { type: "sell_bonus", value: 200, resourceName: "Sceau Magique" }, description: "+200% prix de vente" },
            { level: 500, cost: 30000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 sceaux" }
        ]
    },
    {
        id: 13,
        name: "Citadelle du Vide",
        baseCost: 50000000000,
        schedule: ["soir"],
        productionType: "Ressource",
        description: "Invoque les échos du vide",
        icon: "🌑",
        producesResource: true,
        resources: [
            { name: "Écho du Néant", quantity: 1, price: 5000000, icon: "🌑" }
        ],
        abilities: [
            { level: 10, cost: 800000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 écho par niveau" },
            { level: 50, cost: 80000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 échos" },
            { level: 100, cost: 1600000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 échos" },
            { level: 500, cost: 40000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 échos" }
        ]
    },
    {
        id: 14,
        name: "Temple du Temps",
        baseCost: 500000000000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressource",
        description: "Manipule les flux temporels",
        icon: "⏳",
        producesResource: true,
        resources: [
            { name: "Sablier Éternel", quantity: 1, price: 15000000, icon: "⏳" }
        ],
        abilities: [
            { level: 10, cost: 1000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 sablier par niveau" },
            { level: 50, cost: 100000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 sabliers" },
            { level: 100, cost: 2000000000000, effect: { type: "production_multiply", value: 3 }, description: "x3 sabliers +100% vente" },
            { level: 500, cost: 50000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 sabliers" }
        ]
    },
    {
        id: 15,
        name: "Forge Stellaire",
        baseCost: 5000000000000,
        schedule: ["soir"],
        productionType: "Ressource",
        description: "Forge le cœur des étoiles",
        icon: "⭐",
        producesResource: true,
        resources: [
            { name: "Cœur d'Étoile", quantity: 1, price: 50000000, icon: "⭐" }
        ],
        abilities: [
            { level: 10, cost: 100000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 cœur par niveau" },
            { level: 50, cost: 10000000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 cœurs" },
            { level: 100, cost: 200000000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 cœurs" },
            { level: 500, cost: 5000000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 cœurs" }
        ]
    },
    {
        id: 16,
        name: "Palais Draconique",
        baseCost: 50000000000000,
        schedule: ["soir"],
        productionType: "Ressource",
        description: "Élève des dragons légendaires",
        icon: "🐉",
        producesResource: true,
        resources: [
            { name: "Œuf de Dragon", quantity: 1, price: 150000000, icon: "🥚" }
        ],
        abilities: [
            { level: 10, cost: 200000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 œuf par niveau" },
            { level: 50, cost: 20000000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 œufs" },
            { level: 100, cost: 400000000000000, effect: { type: "sell_bonus", value: 200, resourceName: "Œuf de Dragon" }, description: "+200% valeur" },
            { level: 500, cost: 10000000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 œufs" }
        ]
    },
    {
        id: 17,
        name: "Forteresse Céleste",
        baseCost: 500000000000000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressource",
        description: "Extrait l'essence céleste",
        icon: "☁️",
        producesResource: true,
        resources: [
            { name: "Pierre Céleste", quantity: 1, price: 500000000, icon: "💎" }
        ],
        abilities: [
            { level: 10, cost: 300000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 pierre par niveau" },
            { level: 50, cost: 30000000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 pierres" },
            { level: 100, cost: 600000000000000, effect: { type: "production_multiply", value: 4 }, description: "x4 pierres" },
            { level: 500, cost: 15000000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 pierres" }
        ]
    },
    {
        id: 18,
        name: "Trône de l'Équilibre",
        baseCost: 5000000000000000,
        schedule: ["matin", "aprem", "soir"],
        productionType: "Ressource",
        description: "Harmonise les forces primordiales",
        icon: "⚖️",
        producesResource: true,
        resources: [
            { name: "Essence Primordiale", quantity: 1, price: 1500000000, icon: "💠" }
        ],
        abilities: [
            { level: 10, cost: 500000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 essence par niveau" },
            { level: 50, cost: 50000000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 essences" },
            { level: 100, cost: 1000000000000000, effect: { type: "sell_bonus", value: 200, resourceName: "Essence Primordiale" }, description: "+200% valeur" },
            { level: 500, cost: 25000000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 essences" }
        ]
    },
    {
        id: 19,
        name: "Domaine des Dieux Oubliés",
        baseCost: 50000000000000000,
        schedule: ["soir"],
        productionType: "Ressource ultime",
        description: "Canalise le pouvoir divin",
        icon: "✨",
        producesResource: true,
        resources: [
            { name: "Souffle Divin", quantity: 1, price: 5000000000, icon: "✨" }
        ],
        abilities: [
            { level: 10, cost: 1000000000000, effect: { type: "production_add", value: 1, resourceIndex: 0 }, description: "+1 souffle par niveau" },
            { level: 50, cost: 100000000000000, effect: { type: "production_multiply", value: 2 }, description: "x2 souffles" },
            { level: 100, cost: 2000000000000000, effect: { type: "sell_bonus", value: 200, resourceName: "Souffle Divin" }, description: "+200% valeur" },
            { level: 500, cost: 50000000000000000, effect: { type: "production_multiply", value: 250 }, description: "x250 souffles" }
        ]
    }
];
