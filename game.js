// ===== SYSTÈME DE BASE =====

// État du jeu
const Game = {
    money: 0, // Tout est stocké en pièces de cuivre (pc)
    buildings: new Array(20).fill(0), // Niveau de chaque bâtiment
    clicksToday: 0, // Clics de la journée en cours
    timeElapsed: 0, // Temps écoulé dans la journée (0-24 secondes)
    dayCount: 0, // Compteur de jours
    isReportShowing: false, // État de la modal
    inventory: {}, // Inventaire des ressources: { "Légume": 10, "Peau": 5, etc. }
    abilities: {}, // Capacités débloquées: { "0-10": true, "2-50": true, etc. } (buildingId-level)
    prestige: 0, // Points de prestige (conservés entre les réincarnations)
    prestigeTotalCumule: 0, // Prestige total cumulé (ne diminue JAMAIS, même après dépense)
    prestigeUnlocked: false, // Débloqué après avoir obtenu 1 ♦
    autoReport: false, // Auto-skip des rapports (débloqué par Marchand niveau 10)

    // Atelier de Vargas (débloqué après prestige > 0)
    workshop: {
        unlocked: false, // Débloqué après première réincarnation
        slots: 1, // Nombre de slots de craft achetés (1-6)
        queueSize: 1, // Taille de la file d'attente (1-10)
        activeSlots: [], // Crafts en cours: [{ craftId, type ('craft'/'monument'/'rose'), startDay, duration, ingredients }, ...]
        queue: [], // File d'attente: [{ craftId, type, ingredients }, ...]
        completedMonuments: [], // IDs des monuments construits
        craftedItems: {}, // Inventaire des crafts fabriqués: { "Soupe paysanne": 5, "Lingot brut": 2, etc. }
        roseEtherCompleted: [], // IDs des Rose d'Éther complétées (0-5)
        firstRoseMade: false // True si la Rose d'Éther finale a été craftée au moins une fois
    },

    // Orphelinat de Riton (débloqué après prestige > 0)
    orphanage: {
        unlocked: false, // Débloqué après première réincarnation
        children: [], // Enfants présents: [{ id, name, age, rarity, affinity, birthDay }, ...]
        assignedChildren: [], // Enfants partis et affectés: [{ buildingId, rarity, bonus }, ...]
        nextChildDay: 10 // Prochain jour d'apparition d'un enfant
    }
};

// Système de monnaie (conversion en pc)
const CURRENCY = {
    pc: 1,           // Pièce de cuivre (base)
    pa: 100,         // Pièce d'argent = 100 pc
    po: 10000,       // Pièce d'or = 100 pa = 10000 pc
    pp: 1000000,     // Pièce de platine = 100 po = 1000000 pc
    diamond: 1000000000,       // Diamant = 1000 pp = 1,000,000,000 pc
    essence: 1000000000000,    // Essence divine = 1000 ♦ = 1,000,000,000,000 pc
    fragment: 1000000000000000, // Fragment d'éternité = 1000 ✦ = 1e15 pc
    multiverse: 1000000000000000000, // Souffle du Multivers = 1000 ⟁ = 1e18 pc
    origin: 1000000000000000000000 // Éclat d'origine = 1000 ∞ = 1e21 pc
};

// Formatage de la monnaie pour affichage
function formatMoney(amount) {
    if (amount === 0) return "0 pc";

    const units = [
        { symbol: "✪", value: CURRENCY.origin },
        { symbol: "∞", value: CURRENCY.multiverse },
        { symbol: "⟁", value: CURRENCY.fragment },
        { symbol: "✦", value: CURRENCY.essence },
        { symbol: "♦", value: CURRENCY.diamond },
        { symbol: "pp", value: CURRENCY.pp },
        { symbol: "po", value: CURRENCY.po },
        { symbol: "pa", value: CURRENCY.pa }
    ];

    let result = [];
    let remaining = amount;

    for (let unit of units) {
        if (remaining >= unit.value) {
            const count = Math.floor(remaining / unit.value);
            result.push(`${count} ${unit.symbol}`);
            remaining = remaining % unit.value;

            // Limiter à 3 unités pour la lisibilité
            if (result.length >= 3) break;
        }
    }

    // Pour les pc, afficher avec les décimales si nécessaire
    if (remaining > 0 && result.length < 3) {
        const formattedPc = remaining.toFixed(2).replace('.', ',');
        result.push(`${formattedPc} pc`);
    }

    return result.length > 0 ? result.join(" ") : "0 pc";
}

// Formatage des nombres avec séparateurs
function formatNumber(num) {
    if (num % 1 !== 0) {
        // Si c'est un nombre à virgule
        return num.toFixed(2).replace('.', ',');
    }
    return num.toLocaleString('fr-FR');
}

// ===== SYSTÈME TEMPOREL =====

let gameInterval = null;

function startTimer() {
    // Timer qui tick toutes les 100ms
    gameInterval = setInterval(() => {
        if (!Game.isReportShowing) {
            Game.timeElapsed += 0.1;

            // Mise à jour de l'affichage
            updateTimeDisplay();

            // Fin de journée à 24 secondes
            if (Game.timeElapsed >= 24) {
                endDay();
            }
        }
    }, 100);
}

function updateTimeDisplay() {
    const hour = Math.floor(Game.timeElapsed);
    const period = getPeriod();
    const progress = (Game.timeElapsed / 24) * 100;

    document.getElementById('time-value').textContent = `Heure : ${hour}h`;
    document.getElementById('period-value').textContent = period;
    document.getElementById('timer-progress').style.width = `${progress}%`;
}

function getPeriod() {
    const time = Game.timeElapsed;
    if (time < 8) return "Matin";
    if (time < 16) return "Après-midi";
    return "Soir";
}

function getPeriodKey() {
    const time = Game.timeElapsed;
    if (time < 8) return "matin";
    if (time < 16) return "aprem";
    return "soir";
}

function endDay() {
    Game.isReportShowing = true;
    Game.dayCount++;

    // Traiter les crafts en cours dans l'atelier
    processWorkshopCrafts();

    // Traiter le vieillissement et les départs de l'orphelinat
    processOrphanageAging();

    // Calculer les gains de la journée
    const report = calculateDayProduction();

    // Ajouter les gains d'argent
    Game.money += report.totalMoney;

    // Réinitialiser
    Game.clicksToday = 0;
    Game.timeElapsed = 0;

    // Afficher le rapport
    showReport(report);

    // Sauvegarder automatiquement
    saveGame();

    // Mettre à jour l'affichage
    updateMoneyDisplay();
    updateClickDisplay();
    updateInventoryDisplay();
    updateWorkshopDisplay();
}

// ===== SYSTÈME DE CLICS =====

function handleClick() {
    // Compter simplement le nombre de clics
    Game.clicksToday++;
    updateClickDisplay();

    // Animation du bouton
    const button = document.getElementById('click-button');
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 100);
}

function updateClickDisplay() {
    document.getElementById('click-count').textContent = formatNumber(Game.clicksToday);
}

// ===== SYSTÈME DE BÂTIMENTS =====

function calculateBuildingCost(buildingId) {
    const building = BUILDINGS_DATA[buildingId];
    const level = Game.buildings[buildingId];

    // Coût = coût_base × 1.2^niveau (chaque amélioration est 20% plus chère que la précédente)
    return building.baseCost * Math.pow(1.2, level);
}

function getProductionDisplay(buildingId) {
    const building = BUILDINGS_DATA[buildingId];
    const level = Game.buildings[buildingId];

    if (level === 0) {
        // Si niveau 0, afficher la production de base
        if (building.producesResource) {
            const resourcesText = building.resources.map(resource => {
                return `${resource.quantity} ${resource.name}`;
            }).join(' + ');
            return resourcesText;
        } else {
            return formatMoney(building.baseProduction);
        }
    }

    // Obtenir les bonus de production
    const bonuses = getProductionMultiplier(buildingId);

    if (building.producesResource) {
        // Afficher les ressources produites avec bonus
        const resourcesText = building.resources.map(resource => {
            let quantity = resource.quantity * level;

            // Appliquer le bonus additif
            if (bonuses.additiveBonus > 0) {
                quantity += bonuses.additiveBonus * level;
            }

            // Appliquer le multiplicateur
            quantity = quantity * bonuses.multiplier;

            return `${formatNumber(quantity)} ${resource.name}`;
        }).join(' + ');
        return resourcesText || "Aucune production";
    } else {
        // Afficher l'argent produit avec bonus
        let production = building.baseProduction * level;
        production = production * bonuses.multiplier;

        // Note: pour Fouille-Tas, afficher la moyenne (sans variabilité)
        if (building.isVariable) {
            return `~${formatMoney(production)} (variable)`;
        }

        return formatMoney(production);
    }
}

function canAfford(buildingId) {
    return Game.money >= calculateBuildingCost(buildingId);
}

function buyBuilding(buildingId) {
    const cost = calculateBuildingCost(buildingId);

    if (canAfford(buildingId)) {
        Game.money -= cost;
        Game.buildings[buildingId]++;

        updateMoneyDisplay();
        updateBuildingDisplay(buildingId);
    }
}

function updateBuildingDisplay(buildingId) {
    const building = BUILDINGS_DATA[buildingId];
    const level = Game.buildings[buildingId];
    const cost = calculateBuildingCost(buildingId);
    const productionDisplay = getProductionDisplay(buildingId);

    const buildingCard = document.querySelector(`[data-building-id="${buildingId}"]`);
    if (!buildingCard) return;

    buildingCard.querySelector('.building-level').textContent = `Niveau ${level}`;
    buildingCard.querySelector('.building-cost').textContent = formatMoney(cost);
    buildingCard.querySelector('.building-production').textContent = productionDisplay;

    const buyButton = buildingCard.querySelector('.buy-button');
    buyButton.disabled = !canAfford(buildingId);
}

function updateAllBuildingsDisplay() {
    BUILDINGS_DATA.forEach((building, index) => {
        updateBuildingDisplay(index);
    });
}

function createBuildingsList() {
    const container = document.getElementById('buildings-list');
    container.innerHTML = '';

    BUILDINGS_DATA.forEach((building, index) => {
        const level = Game.buildings[index];
        const cost = calculateBuildingCost(index);
        const productionDisplay = getProductionDisplay(index);
        const scheduleText = building.schedule.join(', ');

        const card = document.createElement('div');
        card.className = 'building-card';
        card.setAttribute('data-building-id', index);

        card.innerHTML = `
            <div class="building-header">
                <span class="building-icon">${building.icon}</span>
                <div class="building-info">
                    <h3 class="building-name">${building.name}</h3>
                    <p class="building-description">${building.description}</p>
                </div>
            </div>
            <div class="building-stats">
                <div class="stat">
                    <span class="stat-label">Niveau :</span>
                    <span class="building-level">Niveau ${level}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Production/jour :</span>
                    <span class="building-production">${productionDisplay}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Horaire :</span>
                    <span class="building-schedule">${scheduleText}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Type :</span>
                    <span class="building-type">${building.productionType}</span>
                </div>
            </div>
            <div class="building-footer">
                <span class="building-cost">${formatMoney(cost)}</span>
                <div class="building-actions">
                    <button class="buy-button" onclick="buyBuilding(${index})" ${!canAfford(index) ? 'disabled' : ''}>
                        Acheter
                    </button>
                    <button class="abilities-button" onclick="showAbilities(${index})">
                        ⭐ Capacités
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// ===== SYSTÈME DE PRODUCTION AUTOMATIQUE =====

function calculateDayProduction() {
    let totalMoney = 0;
    let details = [];

    // Gains des clics
    if (Game.clicksToday > 0) {
        // Valeur de base : 0.01 pc par clic
        let clickValue = 0.01;

        // Bonus de Mendiant : +0.01 pc par niveau
        const mendiantLevel = Game.buildings[0]; // Mendiant est l'index 0
        clickValue += mendiantLevel * 0.01;

        // Ajouter les bonus additifs (Tour du Mage, etc.)
        const clickValueAdd = getClickValueAdd();
        clickValue += clickValueAdd;

        // Appliquer les bonus de clic en % (après les valeurs additives)
        const clickBonus = getClickBonus();
        clickValue = clickValue * (1 + clickBonus / 100);

        let clickGains = Game.clicksToday * clickValue;

        // Bonus si plus de 100 clics : x4
        if (Game.clicksToday > 100) {
            clickGains *= 4;
        }

        // Multiplicateur des gains de clics (Tour du Mage niveau 500)
        const clickGainsMultiplier = getClickGainsMultiplier();
        clickGains *= clickGainsMultiplier;

        totalMoney += clickGains;

        details.push({
            type: 'money',
            source: `${formatNumber(Game.clicksToday)} clics${Game.clicksToday > 100 ? ' (×4 bonus!)' : ''}`,
            amount: clickGains
        });
    }

    // Gains des bâtiments
    BUILDINGS_DATA.forEach((building, index) => {
        const level = Game.buildings[index];

        if (level > 0) {
            // Obtenir les bonus de production
            const bonuses = getProductionMultiplier(index);

            if (building.producesResource) {
                // Bâtiment produit des ressources
                building.resources.forEach(resource => {
                    // Quantité de base par niveau
                    let quantity = resource.quantity * level;

                    // Appliquer le bonus additif (par niveau de bâtiment)
                    if (bonuses.additiveBonus > 0) {
                        quantity += bonuses.additiveBonus * level;
                    }

                    // Appliquer le multiplicateur
                    quantity = quantity * bonuses.multiplier;

                    // Ajouter à l'inventaire
                    if (!Game.inventory[resource.name]) {
                        Game.inventory[resource.name] = 0;
                    }
                    Game.inventory[resource.name] += quantity;

                    details.push({
                        type: 'resource',
                        source: `${building.name} (×${level})`,
                        resourceName: resource.name,
                        quantity: quantity,
                        icon: resource.icon
                    });
                });
            } else {
                // Bâtiment produit de l'argent directement
                let production = building.baseProduction * level;

                // Appliquer le multiplicateur de bonus
                production = production * bonuses.multiplier;

                // Appliquer la variabilité pour Fouille-Tas
                if (building.isVariable) {
                    // Range de base: 0.5 à 1.5 (±50%)
                    const variance = 0.5 + Math.random();
                    production = production * variance;
                }

                totalMoney += production;

                details.push({
                    type: 'money',
                    source: `${building.name} (×${level})`,
                    amount: production,
                    icon: building.icon
                });
            }
        }
    });

    // Appliquer le bonus global (Marchand)
    const globalBonus = getGlobalBonus();
    if (globalBonus > 0) {
        totalMoney = totalMoney * (1 + globalBonus / 100);
    }

    // Appliquer le bonus de prestige (sur TOUT)
    const prestigeBonus = getPrestigeBonus();
    if (prestigeBonus > 0) {
        totalMoney = totalMoney * (1 + prestigeBonus / 100);
    }

    // Appliquer le bonus global de l'orphelinat (sur TOUT)
    const orphanageGlobalBonus = getOrphanageGlobalBonus();
    if (orphanageGlobalBonus > 0) {
        totalMoney = totalMoney * (1 + orphanageGlobalBonus / 100);
    }

    return {
        totalMoney,
        details,
        day: Game.dayCount
    };
}

function showReport(report) {
    const modal = document.getElementById('report-modal');
    const content = document.getElementById('report-content');

    let html = `
        <div class="report-header">
            <p class="report-day">Jour ${report.day}</p>
        </div>
        <div class="report-details">
    `;

    report.details.forEach(detail => {
        if (detail.type === 'money') {
            html += `
                <div class="report-line">
                    ${detail.icon ? `<span class="report-icon">${detail.icon}</span>` : ''}
                    <span class="report-source">${detail.source}</span>
                    <span class="report-amount">+${formatMoney(detail.amount)}</span>
                </div>
            `;
        } else if (detail.type === 'resource') {
            html += `
                <div class="report-line">
                    ${detail.icon ? `<span class="report-icon">${detail.icon}</span>` : ''}
                    <span class="report-source">${detail.source}</span>
                    <span class="report-resource">+${detail.quantity} ${detail.resourceName}</span>
                </div>
            `;
        }
    });

    html += `
        </div>
        <div class="report-total">
            <span class="report-total-label">Argent gagné :</span>
            <span class="report-total-amount">${formatMoney(report.totalMoney)}</span>
        </div>
    `;

    content.innerHTML = html;
    modal.classList.add('show');

    // Si auto-report activé, fermer automatiquement après 2 secondes
    if (Game.autoReport) {
        setTimeout(() => {
            hideReport();
        }, 2000);
    }
}

function hideReport() {
    const modal = document.getElementById('report-modal');
    modal.classList.remove('show');
    Game.isReportShowing = false;
}

// ===== SYSTÈME DE SAUVEGARDE =====

function saveGame() {
    const saveData = {
        money: Game.money,
        buildings: Game.buildings,
        dayCount: Game.dayCount,
        inventory: Game.inventory,
        abilities: Game.abilities,
        prestige: Game.prestige,
        prestigeTotalCumule: Game.prestigeTotalCumule,
        prestigeUnlocked: Game.prestigeUnlocked,
        autoReport: Game.autoReport,
        workshop: Game.workshop, // Ajouter l'état de l'atelier
        orphanage: Game.orphanage, // Ajouter l'état de l'orphelinat
        timestamp: Date.now()
    };

    localStorage.setItem('dnd-clicker-save', JSON.stringify(saveData));

    // Afficher message de confirmation
    const message = document.getElementById('save-message');
    message.textContent = 'Partie sauvegardée !';
    message.style.opacity = '1';

    setTimeout(() => {
        message.style.opacity = '0';
    }, 2000);
}

function loadGame() {
    const saveData = localStorage.getItem('dnd-clicker-save');

    if (saveData) {
        const data = JSON.parse(saveData);
        Game.money = data.money || 0;
        Game.buildings = data.buildings || new Array(20).fill(0);
        Game.dayCount = data.dayCount || 0;
        Game.inventory = data.inventory || {};
        Game.abilities = data.abilities || {};
        Game.prestige = data.prestige || 0;
        Game.prestigeTotalCumule = data.prestigeTotalCumule || 0;
        Game.prestigeUnlocked = data.prestigeUnlocked || false;
        Game.autoReport = data.autoReport || false;

        // Charger l'état de l'atelier (avec valeurs par défaut si non présent)
        if (data.workshop) {
            Game.workshop = {
                unlocked: data.workshop.unlocked || false,
                slots: data.workshop.slots || 1,
                queueSize: data.workshop.queueSize || 1,
                activeSlots: data.workshop.activeSlots || [],
                queue: data.workshop.queue || [],
                completedMonuments: data.workshop.completedMonuments || [],
                craftedItems: data.workshop.craftedItems || {},
                roseEtherCompleted: data.workshop.roseEtherCompleted || [],
                firstRoseMade: data.workshop.firstRoseMade || false
            };
        }

        // Charger l'état de l'orphelinat (avec valeurs par défaut si non présent)
        if (data.orphanage) {
            Game.orphanage = {
                unlocked: data.orphanage.unlocked || false,
                children: data.orphanage.children || [],
                assignedChildren: data.orphanage.assignedChildren || [],
                nextChildDay: data.orphanage.nextChildDay || 10
            };
        }

        // Afficher l'onglet prestige si débloqué
        if (Game.prestigeUnlocked) {
            document.getElementById('prestige-tab-button').style.display = 'block';
        }

        // Afficher l'onglet atelier si débloqué
        if (Game.workshop.unlocked) {
            document.getElementById('workshop-tab-button').style.display = 'block';
        }

        // Afficher l'onglet orphelinat si débloqué
        if (Game.orphanage.unlocked) {
            document.getElementById('orphanage-tab-button').style.display = 'block';
        }

        // Mettre à jour la checkbox auto-report
        document.getElementById('auto-report-checkbox').checked = Game.autoReport;

        console.log('Partie chargée !');
    }
}

function exportSave() {
    const saveData = {
        money: Game.money,
        buildings: Game.buildings,
        dayCount: Game.dayCount,
        inventory: Game.inventory,
        abilities: Game.abilities,
        prestige: Game.prestige,
        prestigeTotalCumule: Game.prestigeTotalCumule,
        prestigeUnlocked: Game.prestigeUnlocked,
        autoReport: Game.autoReport,
        workshop: Game.workshop,
        orphanage: Game.orphanage,
        timestamp: Date.now()
    };

    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dnd-clicker-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage('Sauvegarde exportée !', 'success');
}

function importSave() {
    document.getElementById('import-file').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Valider les données
            if (typeof data.money !== 'number' || !Array.isArray(data.buildings)) {
                throw new Error('Format de sauvegarde invalide');
            }

            // Charger les données
            Game.money = data.money;
            Game.buildings = data.buildings;
            Game.dayCount = data.dayCount || 0;
            Game.inventory = data.inventory || {};
            Game.abilities = data.abilities || {};
            Game.prestige = data.prestige || 0;
            Game.prestigeTotalCumule = data.prestigeTotalCumule || 0;
            Game.prestigeUnlocked = data.prestigeUnlocked || false;
            Game.autoReport = data.autoReport || false;
            Game.clicksToday = 0;
            Game.timeElapsed = 0;

            // Charger l'état de l'atelier
            if (data.workshop) {
                Game.workshop = {
                    unlocked: data.workshop.unlocked || false,
                    slots: data.workshop.slots || 1,
                    queueSize: data.workshop.queueSize || 1,
                    activeSlots: data.workshop.activeSlots || [],
                    queue: data.workshop.queue || [],
                    completedMonuments: data.workshop.completedMonuments || [],
                    craftedItems: data.workshop.craftedItems || {},
                    roseEtherCompleted: data.workshop.roseEtherCompleted || [],
                    firstRoseMade: data.workshop.firstRoseMade || false
                };
            }

            // Charger l'état de l'orphelinat
            if (data.orphanage) {
                Game.orphanage = {
                    unlocked: data.orphanage.unlocked || false,
                    children: data.orphanage.children || [],
                    assignedChildren: data.orphanage.assignedChildren || [],
                    nextChildDay: data.orphanage.nextChildDay || 10
                };
            }

            // Afficher l'onglet prestige si débloqué
            if (Game.prestigeUnlocked) {
                document.getElementById('prestige-tab-button').style.display = 'block';
            }

            // Afficher l'onglet atelier si débloqué
            if (Game.workshop.unlocked) {
                document.getElementById('workshop-tab-button').style.display = 'block';
            }

            // Afficher l'onglet orphelinat si débloqué
            if (Game.orphanage.unlocked) {
                document.getElementById('orphanage-tab-button').style.display = 'block';
            }

            // Mettre à jour la checkbox auto-report
            document.getElementById('auto-report-checkbox').checked = Game.autoReport;

            // Sauvegarder dans localStorage
            localStorage.setItem('dnd-clicker-save', JSON.stringify(data));

            // Mettre à jour l'affichage
            updateMoneyDisplay();
            updateClickDisplay();
            createBuildingsList();
            updateInventoryDisplay();
            checkAutoReportUnlock();

            showMessage('Sauvegarde importée !', 'success');
        } catch (error) {
            showMessage('Erreur : fichier invalide', 'error');
            console.error('Erreur d\'importation:', error);
        }
    };
    reader.readAsText(file);

    // Réinitialiser l'input file
    event.target.value = '';
}

function resetGame() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Toute votre progression sera perdue !')) {
        // Supprimer la sauvegarde
        localStorage.removeItem('dnd-clicker-save');

        // Réinitialiser l'état du jeu (SAUF le prestige)
        Game.money = 0;
        Game.buildings = new Array(20).fill(0);
        Game.clicksToday = 0;
        Game.timeElapsed = 0;
        Game.dayCount = 0;
        Game.isReportShowing = false;
        Game.inventory = {};
        Game.abilities = {};
        // prestige et prestigeUnlocked sont conservés

        // Mettre à jour l'affichage
        updateMoneyDisplay();
        updateClickDisplay();
        updateTimeDisplay();
        createBuildingsList();
        updateInventoryDisplay();
        updatePrestigeDisplay();

        showMessage('Jeu réinitialisé ! (Prestige conservé)', 'success');
    }
}

function showMessage(text, type = 'success') {
    const message = document.getElementById('save-message');
    message.textContent = text;
    message.className = type === 'error' ? 'save-message error' : 'save-message';
    message.style.opacity = '1';

    setTimeout(() => {
        message.style.opacity = '0';
    }, 3000);
}

// ===== SYSTÈME D'INVENTAIRE =====

function updateInventoryDisplay() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';

    // Obtenir toutes les ressources et leurs infos
    const resourcesInfo = {};
    BUILDINGS_DATA.forEach(building => {
        if (building.producesResource) {
            building.resources.forEach(resource => {
                resourcesInfo[resource.name] = {
                    price: resource.price,
                    icon: resource.icon
                };
            });
        }
    });

    // Afficher les ressources
    const resourceNames = Object.keys(Game.inventory).sort();

    if (resourceNames.length === 0) {
        container.innerHTML = '<p class="inventory-empty">Votre inventaire est vide. Les bâtiments produisant des ressources les ajouteront ici.</p>';
        return;
    }

    resourceNames.forEach(resourceName => {
        const quantity = Game.inventory[resourceName];
        if (quantity > 0) {
            const info = resourcesInfo[resourceName];
            const totalValue = quantity * info.price;

            const card = document.createElement('div');
            card.className = 'inventory-item';
            card.innerHTML = `
                <div class="item-header">
                    <span class="item-icon">${info.icon}</span>
                    <div class="item-info">
                        <h3 class="item-name">${resourceName}</h3>
                        <p class="item-quantity">Quantité : ${quantity}</p>
                    </div>
                </div>
                <div class="item-details">
                    <span class="item-price">Prix unitaire : ${formatMoney(info.price)}</span>
                    <span class="item-total">Valeur totale : ${formatMoney(totalValue)}</span>
                </div>
                <div class="item-actions">
                    <button class="sell-one-button" onclick="sellResource('${resourceName}', 1)">Vendre 1</button>
                    <button class="sell-all-button" onclick="sellResource('${resourceName}', ${quantity})">Vendre tout</button>
                </div>
            `;
            container.appendChild(card);
        }
    });
}

function sellResource(resourceName, quantity) {
    if (!Game.inventory[resourceName] || Game.inventory[resourceName] < quantity) {
        return;
    }

    // Trouver le prix de la ressource
    let price = 0;
    BUILDINGS_DATA.forEach(building => {
        if (building.producesResource) {
            building.resources.forEach(resource => {
                if (resource.name === resourceName) {
                    price = resource.price;
                }
            });
        }
    });

    // Calculer l'argent gagné
    let moneyGained = price * quantity;

    // Appliquer UNIQUEMENT le bonus de vente
    // Les bonus globaux (global_bonus, prestige, orphelinat) affectent la PRODUCTION, pas le prix de vente
    const sellBonus = getSellBonus();
    if (sellBonus > 0) {
        moneyGained = moneyGained * (1 + sellBonus / 100);
    }

    // Vendre
    Game.inventory[resourceName] -= quantity;
    Game.money += moneyGained;

    // Nettoyer l'inventaire si quantité = 0
    if (Game.inventory[resourceName] === 0) {
        delete Game.inventory[resourceName];
    }

    // Mettre à jour l'affichage
    updateInventoryDisplay();
    updateMoneyDisplay();

    // Message de confirmation
    showMessage(`Vendu ${quantity} ${resourceName} pour ${formatMoney(moneyGained)} !`, 'success');
}

// ===== SYSTÈME DE CAPACITÉS =====

function showAbilities(buildingId) {
    const building = BUILDINGS_DATA[buildingId];
    const level = Game.buildings[buildingId];

    const modal = document.getElementById('abilities-modal');
    const content = document.getElementById('abilities-content');
    const title = document.getElementById('abilities-modal-title');

    title.textContent = `${building.icon} ${building.name} - Capacités`;

    let html = `<div class="abilities-list">`;

    building.abilities.forEach((ability, index) => {
        const abilityKey = `${buildingId}-${ability.level}`;
        const isUnlocked = Game.abilities[abilityKey] === true;
        const canUnlock = level >= ability.level && !isUnlocked;
        const canAfford = Game.money >= ability.cost;

        let statusClass = '';
        let statusText = '';
        let buttonHtml = '';

        if (isUnlocked) {
            statusClass = 'unlocked';
            statusText = '✓ Débloquée';
            buttonHtml = '<span class="ability-unlocked">Débloquée</span>';
        } else if (level < ability.level) {
            statusClass = 'locked';
            statusText = `🔒 Nécessite niveau ${ability.level}`;
            buttonHtml = `<span class="ability-locked">Niveau ${ability.level} requis</span>`;
        } else {
            statusClass = 'available';
            statusText = `Disponible (niveau ${ability.level})`;
            const disabled = !canAfford ? 'disabled' : '';
            buttonHtml = `<button class="unlock-ability-button" onclick="buyAbility(${buildingId}, ${ability.level})" ${disabled}>
                Débloquer pour ${formatMoney(ability.cost)}
            </button>`;
        }

        html += `
            <div class="ability-card ${statusClass}">
                <div class="ability-header">
                    <span class="ability-level">Pallier ${ability.level}</span>
                    <span class="ability-status">${statusText}</span>
                </div>
                <div class="ability-description">${ability.description}</div>
                <div class="ability-footer">
                    ${buttonHtml}
                </div>
            </div>
        `;
    });

    html += `</div>`;

    content.innerHTML = html;
    modal.classList.add('show');
}

function hideAbilities() {
    const modal = document.getElementById('abilities-modal');
    modal.classList.remove('show');
}

function buyAbility(buildingId, abilityLevel) {
    const building = BUILDINGS_DATA[buildingId];
    const ability = building.abilities.find(a => a.level === abilityLevel);

    if (!ability) return;

    const abilityKey = `${buildingId}-${abilityLevel}`;
    const level = Game.buildings[buildingId];

    // Vérifications
    if (Game.abilities[abilityKey]) {
        showMessage('Capacité déjà débloquée !', 'error');
        return;
    }

    if (level < abilityLevel) {
        showMessage(`Niveau ${abilityLevel} requis !`, 'error');
        return;
    }

    if (Game.money < ability.cost) {
        showMessage('Pas assez d\'argent !', 'error');
        return;
    }

    // Acheter
    Game.money -= ability.cost;
    Game.abilities[abilityKey] = true;

    // Mettre à jour l'affichage
    updateMoneyDisplay();
    showAbilities(buildingId); // Rafraîchir la modal
    checkAutoReportUnlock(); // Vérifier si auto-report est débloqué

    showMessage(`Capacité "${ability.description}" débloquée !`, 'success');
}

function isAbilityUnlocked(buildingId, abilityLevel) {
    const abilityKey = `${buildingId}-${abilityLevel}`;
    return Game.abilities[abilityKey] === true;
}

// ===== SYSTÈME DE BONUS DES CAPACITÉS =====

// Calcule le multiplicateur de production pour un bâtiment donné
function getProductionMultiplier(buildingId) {
    const building = BUILDINGS_DATA[buildingId];
    let multiplier = 1;
    let additiveBonus = 0;

    building.abilities.forEach(ability => {
        if (isAbilityUnlocked(buildingId, ability.level)) {
            const effect = ability.effect;

            if (effect.type === 'production_percent') {
                // +X% de production (multiplicatif)
                multiplier *= (1 + effect.value / 100);
            } else if (effect.type === 'production_multiply') {
                // Multiplie par X
                multiplier *= effect.value;
            } else if (effect.type === 'production_add') {
                // +X ressources par niveau (additif)
                additiveBonus += effect.value;
            }
        }
    });

    // Ajouter le bonus de l'orphelinat pour ce bâtiment
    const orphanageBonus = getOrphanageBuildingBonus(buildingId);
    if (orphanageBonus > 0) {
        multiplier *= (1 + orphanageBonus / 100);
    }

    return { multiplier, additiveBonus };
}

// Calcule le bonus de clic total (en %)
function getClickBonus() {
    let bonus = 0;

    BUILDINGS_DATA.forEach((building, buildingId) => {
        building.abilities.forEach(ability => {
            if (isAbilityUnlocked(buildingId, ability.level)) {
                if (ability.effect.type === 'click_bonus') {
                    bonus += ability.effect.value;
                }
            }
        });
    });

    return bonus;
}

// Calcule la valeur additionnelle des clics (en pc, additif)
function getClickValueAdd() {
    let value = 0;

    BUILDINGS_DATA.forEach((building, buildingId) => {
        building.abilities.forEach(ability => {
            if (isAbilityUnlocked(buildingId, ability.level)) {
                if (ability.effect.type === 'click_value_add') {
                    value += ability.effect.value;
                }
            }
        });
    });

    return value;
}

// Calcule le multiplicateur des gains de clics
function getClickGainsMultiplier() {
    let multiplier = 1;

    BUILDINGS_DATA.forEach((building, buildingId) => {
        building.abilities.forEach(ability => {
            if (isAbilityUnlocked(buildingId, ability.level)) {
                if (ability.effect.type === 'click_gains_multiply') {
                    multiplier *= ability.effect.value;
                }
            }
        });
    });

    return multiplier;
}

// Calcule le bonus global (Marchand)
function getGlobalBonus() {
    let bonus = 0;

    BUILDINGS_DATA.forEach((building, buildingId) => {
        building.abilities.forEach(ability => {
            if (isAbilityUnlocked(buildingId, ability.level)) {
                if (ability.effect.type === 'global_bonus') {
                    bonus += ability.effect.value;
                }
            }
        });
    });

    return bonus;
}

// Calcule le bonus de vente
function getSellBonus() {
    let bonus = 0;

    BUILDINGS_DATA.forEach((building, buildingId) => {
        building.abilities.forEach(ability => {
            if (isAbilityUnlocked(buildingId, ability.level)) {
                if (ability.effect.type === 'sell_bonus') {
                    bonus += ability.effect.value;
                }
            }
        });
    });

    return bonus;
}

// ===== SYSTÈME D'AUTO-REPORT =====

// Vérifie si l'auto-report est débloqué (capacité Marchand niveau 1)
function checkAutoReportUnlock() {
    const isUnlocked = isAbilityUnlocked(7, 1); // Marchand (id=7) niveau 1

    if (isUnlocked) {
        document.getElementById('auto-report-container').style.display = 'flex';
    } else {
        document.getElementById('auto-report-container').style.display = 'none';
    }
}

// Active/désactive l'auto-report
function toggleAutoReport() {
    const checkbox = document.getElementById('auto-report-checkbox');
    Game.autoReport = checkbox.checked;
    saveGame();

    if (Game.autoReport) {
        showMessage('⚡ Rapports automatiques activés !', 'success');
    } else {
        showMessage('Rapports automatiques désactivés', 'success');
    }
}

// ===== SYSTÈME DE CHEAT =====

let cheatBuffer = '';
let cheatTimeout = null;

// Détecte la saisie du code "cheat"
function initCheatDetection() {
    document.addEventListener('keypress', (e) => {
        // Ignorer si on est dans un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ajouter le caractère au buffer
        cheatBuffer += e.key.toLowerCase();

        // Réinitialiser après 2 secondes d'inactivité
        clearTimeout(cheatTimeout);
        cheatTimeout = setTimeout(() => {
            cheatBuffer = '';
        }, 2000);

        // Vérifier si "cheat" a été tapé
        if (cheatBuffer.includes('cheat')) {
            cheatBuffer = '';
            openCheatModal();
        }

        // Limiter la taille du buffer
        if (cheatBuffer.length > 10) {
            cheatBuffer = cheatBuffer.slice(-10);
        }
    });
}

// Ouvre le modal de cheat
function openCheatModal() {
    const modal = document.getElementById('cheat-modal');
    modal.classList.add('show');
    document.getElementById('cheat-amount').value = '';
    document.getElementById('cheat-amount').focus();
}

// Ferme le modal de cheat
function closeCheatModal() {
    const modal = document.getElementById('cheat-modal');
    modal.classList.remove('show');
}

// Définit un montant rapide
function setCheatAmount(amount) {
    document.getElementById('cheat-amount').value = amount;
}

// Ajoute l'argent
function addCheatMoney() {
    const input = document.getElementById('cheat-amount');
    const amount = parseFloat(input.value);

    if (isNaN(amount) || amount <= 0) {
        showMessage('Montant invalide !', 'error');
        return;
    }

    Game.money += amount;
    updateMoneyDisplay();
    closeCheatModal();
    showMessage(`💰 ${formatMoney(amount)} ajoutés !`, 'success');
}

// ===== SYSTÈME DE PRESTIGE =====

// Vérifie si le prestige est débloqué
function checkPrestigeUnlock() {
    // Débloqué après avoir obtenu 1 ♦ (1 000 000 000 pc)
    if (!Game.prestigeUnlocked && Game.money >= CURRENCY.diamond) {
        Game.prestigeUnlocked = true;
        document.getElementById('prestige-tab-button').style.display = 'block';
        showMessage('🌟 Le Prestige est maintenant débloqué !', 'success');
    }
}

// Calcule le prestige qui serait obtenu avec l'argent actuel
function calculatePrestigeGain() {
    // Formule : floor(log10(argent_total_en_cc)) - 12
    // 1 cc = 0.01 pc, donc argent en cc = money * 100
    const moneyInCc = Game.money * 100;

    if (moneyInCc < 1e12) { // Moins de 1 ✦
        return 0;
    }

    const prestigeGain = Math.floor(Math.log10(moneyInCc)) - 12;
    return Math.max(0, prestigeGain);
}

// Calcule le bonus actuel du prestige (en %)
function getPrestigeBonus() {
    // Chaque point de prestige = +1%
    return Game.prestige;
}

// Vérifie si le joueur peut se réincarner
function canReincarnate() {
    const cost = 100 * CURRENCY.diamond; // 100 ♦
    return Game.money >= cost;
}

// Réincarne le joueur
function reincarnate() {
    const cost = 100 * CURRENCY.diamond; // 100 ♦

    // Vérifier si le joueur peut se réincarner
    if (!canReincarnate()) {
        showMessage('Vous avez besoin de 100 ♦ pour vous réincarner !', 'error');
        return;
    }

    // Calculer les points de prestige obtenus
    const prestigeGain = calculatePrestigeGain();

    // Confirmation
    const confirmMessage = `Voulez-vous vraiment vous réincarner ?\n\n` +
        `Vous obtiendrez : +${prestigeGain} points de prestige\n` +
        `Nouveau total : ${Game.prestige + prestigeGain} points\n` +
        `Bonus total : +${Game.prestige + prestigeGain}%\n\n` +
        `⚠️ Toute votre progression sera réinitialisée (sauf le prestige) !`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Ajouter les points de prestige (avec bonus de la Rose d'Éther finale si applicable)
    let finalPrestigeGain = prestigeGain;
    if (Game.workshop.firstRoseMade) {
        finalPrestigeGain *= 2;
    }
    Game.prestige += finalPrestigeGain;
    Game.prestigeTotalCumule += finalPrestigeGain; // Le prestige total cumulé ne diminue JAMAIS

    // Réinitialiser le jeu (tout sauf le prestige et l'atelier)
    Game.money = 0;
    Game.buildings = new Array(20).fill(0);
    Game.clicksToday = 0;
    Game.timeElapsed = 0;
    Game.dayCount = 0;
    Game.inventory = {};
    Game.abilities = {};
    // prestigeUnlocked reste true pour ne pas avoir à redébloquer

    // Réinitialiser l'atelier (mais garder les monuments et l'unlock)
    const wasWorkshopUnlocked = Game.workshop.unlocked;
    const completedMonuments = [...Game.workshop.completedMonuments]; // Conserver les monuments
    const firstRoseMade = Game.workshop.firstRoseMade; // Conserver le bonus de Rose
    Game.workshop = {
        unlocked: wasWorkshopUnlocked,
        slots: 1,
        queueSize: 1,
        activeSlots: [],
        queue: [],
        completedMonuments: completedMonuments,
        craftedItems: {},
        roseEtherCompleted: [],
        firstRoseMade: firstRoseMade
    };

    // Débloquer l'atelier après la première réincarnation
    if (Game.prestige > 0) {
        Game.workshop.unlocked = true;
    }

    // Réinitialiser l'orphelinat (les enfants sont perdus, mais l'unlock reste)
    const wasOrphanageUnlocked = Game.orphanage.unlocked;
    Game.orphanage = {
        unlocked: wasOrphanageUnlocked,
        children: [],
        assignedChildren: [],
        nextChildDay: Game.dayCount + 10
    };

    // Débloquer l'orphelinat après la première réincarnation
    if (Game.prestige > 0) {
        Game.orphanage.unlocked = true;
    }

    // Sauvegarder
    saveGame();

    // Mettre à jour l'affichage
    updateMoneyDisplay();
    updateClickDisplay();
    updateTimeDisplay();
    createBuildingsList();
    updateInventoryDisplay();
    updatePrestigeDisplay();
    checkWorkshopUnlock();
    updateWorkshopDisplay();
    checkOrphanageUnlock();
    updateOrphanageDisplay();

    // Message de confirmation
    const message = finalPrestigeGain > prestigeGain
        ? `🌟 Réincarnation réussie ! Vous avez maintenant ${Game.prestige} points de prestige (+${Game.prestige}% sur tous les gains) ! 🌹 La Rose d'Éther a doublé vos points !`
        : `🌟 Réincarnation réussie ! Vous avez maintenant ${Game.prestige} points de prestige (+${Game.prestige}% sur tous les gains) !`;
    showMessage(message, 'success');

    // Revenir à l'onglet bâtiments
    switchTab('buildings');
}

// Met à jour l'affichage du prestige
function updatePrestigeDisplay() {
    if (!Game.prestigeUnlocked) return;

    const prestigeGain = calculatePrestigeGain();
    const prestigeBonus = getPrestigeBonus();

    document.getElementById('current-prestige').textContent = Game.prestige;
    document.getElementById('prestige-bonus').textContent = `+${prestigeBonus}%`;
    document.getElementById('prestige-current-money').textContent = formatMoney(Game.money);
    document.getElementById('prestige-gain').textContent = `+${prestigeGain}`;

    // Activer/désactiver le bouton
    const button = document.getElementById('reincarnate-button');
    button.disabled = !canReincarnate();
}

// ===== SYSTÈME DE L'ATELIER DE VARGAS =====

// Vérifie si l'atelier est débloqué et affiche/cache le bouton
function checkWorkshopUnlock() {
    if (Game.workshop.unlocked) {
        document.getElementById('workshop-tab-button').style.display = 'block';
    } else {
        document.getElementById('workshop-tab-button').style.display = 'none';
    }
}

// Calcule le coût d'achat d'un slot supplémentaire
function getSlotCost(slotNumber) {
    // Prix du slot n = 100 po × (10 ^ (n - 2))
    if (slotNumber <= 1) return 0; // Premier slot gratuit
    return 100 * CURRENCY.po * Math.pow(10, slotNumber - 2);
}

// Calcule le coût d'agrandissement de la file
function getQueueCost(queueSize) {
    // Prix file n = 10 po × (2 ^ (n - 2))
    if (queueSize <= 1) return 0; // Première position gratuite
    return 10 * CURRENCY.po * Math.pow(2, queueSize - 2);
}

// Achète un slot supplémentaire
function buyWorkshopSlot() {
    if (Game.workshop.slots >= 6) {
        showMessage('Nombre maximum de slots atteint !', 'error');
        return;
    }

    const cost = getSlotCost(Game.workshop.slots + 1);

    if (Game.money < cost) {
        showMessage('Pas assez d\'argent pour acheter un slot !', 'error');
        return;
    }

    Game.money -= cost;
    Game.workshop.slots++;

    updateMoneyDisplay();
    updateWorkshopDisplay();
    saveGame();

    showMessage(`Slot acheté ! Vous avez maintenant ${Game.workshop.slots} slots.`, 'success');
}

// Achète une position de file supplémentaire
function buyWorkshopQueue() {
    if (Game.workshop.queueSize >= 10) {
        showMessage('Taille maximale de file atteinte !', 'error');
        return;
    }

    const cost = getQueueCost(Game.workshop.queueSize + 1);

    if (Game.money < cost) {
        showMessage('Pas assez d\'argent pour agrandir la file !', 'error');
        return;
    }

    Game.money -= cost;
    Game.workshop.queueSize++;

    updateMoneyDisplay();
    updateWorkshopDisplay();
    saveGame();

    showMessage(`File agrandie ! Vous pouvez maintenant mettre ${Game.workshop.queueSize} crafts en attente.`, 'success');
}

// Calcule le coût total d'un craft (en ressources/crafts/items)
function calculateCraftCost(craftData) {
    let totalCost = 0;
    const missingIngredients = [];

    for (let ingredient of craftData.ingredients) {
        if (ingredient.type === 'resource') {
            // Ressource du bâtiment - chercher dans les resources de chaque bâtiment
            let resourcePrice = 0;
            for (let building of BUILDINGS_DATA) {
                if (building.resources) {
                    const resource = building.resources.find(r => r.name === ingredient.name);
                    if (resource) {
                        resourcePrice = resource.price;
                        break;
                    }
                }
            }

            const availableQty = Game.inventory[ingredient.name] || 0;
            const requiredQty = ingredient.quantity;

            if (availableQty < requiredQty) {
                missingIngredients.push(`${ingredient.name} (${availableQty}/${requiredQty})`);
            }

            // Coût = prix de la ressource × quantité
            totalCost += resourcePrice * requiredQty;
        } else if (ingredient.type === 'craft') {
            // Autre craft
            const availableCraft = Game.workshop.craftedItems[ingredient.name] || 0;
            const requiredQty = ingredient.quantity;

            if (availableCraft < requiredQty) {
                missingIngredients.push(`${ingredient.name} (${availableCraft}/${requiredQty})`);
            }

            // Trouver le craft dans les données pour calculer son coût
            const craftInfo = CRAFTS_DATA.find(c => c.name === ingredient.name);
            if (craftInfo) {
                const craftCost = calculateCraftCost(craftInfo);
                // IMPORTANT : Utiliser le prix de VENTE du craft (coût × multiplicateur)
                const craftSellValue = craftCost.totalCost * craftInfo.multiplier;
                totalCost += craftSellValue * requiredQty;
            }
        } else if (ingredient.type === 'special') {
            // Item spécial (obtenu au prestige)
            const specialItem = SPECIAL_ITEMS_DATA.find(s => s.name === ingredient.name);
            if (specialItem && Game.prestige < specialItem.prestigeRequired) {
                missingIngredients.push(`${ingredient.name} (Prestige ${specialItem.prestigeRequired} requis)`);
            }
            // Les items spéciaux n'ont pas de coût monétaire
        }
    }

    return { totalCost, missingIngredients };
}

// Vérifie si un craft peut être lancé
function canCraft(craftId, type = 'craft') {
    let craftData;

    if (type === 'craft') {
        craftData = CRAFTS_DATA[craftId];
    } else if (type === 'monument') {
        craftData = MONUMENTS_DATA[craftId];
        // Vérifier si le monument n'est pas déjà construit
        if (Game.workshop.completedMonuments.includes(craftId)) {
            return { canCraft: false, reason: 'Monument déjà construit' };
        }
    } else if (type === 'rose') {
        craftData = ROSE_CRAFTS_DATA[craftId];
        // Vérifier si la Rose n'est pas déjà craftée
        if (Game.workshop.roseEtherCompleted.includes(craftId)) {
            return { canCraft: false, reason: 'Rose d\'Éther déjà craftée' };
        }
        // Vérifier si le monument requis est construit
        if (craftData.requiresMonument !== undefined && !Game.workshop.completedMonuments.includes(craftData.requiresMonument)) {
            return { canCraft: false, reason: 'Monument requis non construit' };
        }
        // Pour la Rose finale (id 5), vérifier que toutes les autres sont complétées
        if (craftId === 5) {
            for (let i = 0; i < 5; i++) {
                if (!Game.workshop.roseEtherCompleted.includes(i)) {
                    return { canCraft: false, reason: 'Toutes les Roses d\'Éther I-V doivent être craftées' };
                }
            }
        }
    }

    if (!craftData) {
        return { canCraft: false, reason: 'Craft introuvable' };
    }

    // Vérifier les ingrédients
    for (let ingredient of craftData.ingredients) {
        if (ingredient.type === 'resource') {
            const available = Game.inventory[ingredient.name] || 0;
            if (available < ingredient.quantity) {
                return { canCraft: false, reason: `Pas assez de ${ingredient.name}` };
            }
        } else if (ingredient.type === 'craft') {
            const available = Game.workshop.craftedItems[ingredient.name] || 0;
            if (available < ingredient.quantity) {
                return { canCraft: false, reason: `Pas assez de ${ingredient.name}` };
            }
        } else if (ingredient.type === 'special') {
            const specialItem = SPECIAL_ITEMS_DATA.find(s => s.name === ingredient.name);
            if (specialItem && Game.prestige < specialItem.prestigeRequired) {
                return { canCraft: false, reason: `Prestige ${specialItem.prestigeRequired} requis` };
            }
        }
    }

    return { canCraft: true };
}

// Lance un craft dans un slot disponible
function startCraft(craftId, type = 'craft') {
    // Vérifier qu'il y a un slot libre
    if (Game.workshop.activeSlots.length >= Game.workshop.slots) {
        // Essayer d'ajouter à la file
        if (Game.workshop.queue.length < Game.workshop.queueSize) {
            addToQueue(craftId, type);
            return;
        } else {
            showMessage('Aucun slot disponible et file pleine !', 'error');
            return;
        }
    }

    // Vérifier si le craft peut être lancé
    const check = canCraft(craftId, type);
    if (!check.canCraft) {
        showMessage(check.reason, 'error');
        return;
    }

    // Récupérer les données du craft
    let craftData;
    if (type === 'craft') {
        craftData = CRAFTS_DATA[craftId];
    } else if (type === 'monument') {
        craftData = MONUMENTS_DATA[craftId];
    } else if (type === 'rose') {
        craftData = ROSE_CRAFTS_DATA[craftId];
    }

    // Consommer les ingrédients
    for (let ingredient of craftData.ingredients) {
        if (ingredient.type === 'resource') {
            Game.inventory[ingredient.name] -= ingredient.quantity;
        } else if (ingredient.type === 'craft') {
            Game.workshop.craftedItems[ingredient.name] -= ingredient.quantity;
        }
        // Les items spéciaux ne se consomment pas
    }

    // Ajouter le craft au slot actif
    Game.workshop.activeSlots.push({
        craftId: craftId,
        type: type,
        startDay: Game.dayCount,
        duration: craftData.time,
        name: craftData.name
    });

    updateWorkshopDisplay();
    updateInventoryDisplay();
    saveGame();

    showMessage(`⚒️ Craft de "${craftData.name}" démarré ! (${craftData.time} jours)`, 'success');
}

// Ajoute un craft à la file d'attente
function addToQueue(craftId, type = 'craft') {
    if (Game.workshop.queue.length >= Game.workshop.queueSize) {
        showMessage('File d\'attente pleine !', 'error');
        return;
    }

    // Récupérer le nom du craft
    let craftName;
    if (type === 'craft') {
        craftName = CRAFTS_DATA[craftId].name;
    } else if (type === 'monument') {
        craftName = MONUMENTS_DATA[craftId].name;
    } else if (type === 'rose') {
        craftName = ROSE_CRAFTS_DATA[craftId].name;
    }

    Game.workshop.queue.push({
        craftId: craftId,
        type: type,
        name: craftName
    });

    updateWorkshopDisplay();
    saveGame();

    showMessage(`📜 "${craftName}" ajouté à la file d'attente.`, 'success');
}

// Retire un craft de la file d'attente
function removeFromQueue(index) {
    if (index < 0 || index >= Game.workshop.queue.length) return;

    const removed = Game.workshop.queue.splice(index, 1)[0];
    updateWorkshopDisplay();
    saveGame();

    showMessage(`"${removed.name}" retiré de la file.`, 'success');
}

// Annule un craft en cours
function cancelCraft(slotIndex) {
    if (slotIndex < 0 || slotIndex >= Game.workshop.activeSlots.length) return;

    const craft = Game.workshop.activeSlots[slotIndex];

    if (!confirm(`Voulez-vous vraiment annuler "${craft.name}" ? Les ressources NE seront PAS récupérées.`)) {
        return;
    }

    Game.workshop.activeSlots.splice(slotIndex, 1);

    // Lancer le prochain craft de la file si disponible
    processWorkshopQueue();

    updateWorkshopDisplay();
    saveGame();

    showMessage(`Craft "${craft.name}" annulé.`, 'error');
}

// Traite la file d'attente (lance le prochain craft si un slot se libère)
function processWorkshopQueue() {
    while (Game.workshop.activeSlots.length < Game.workshop.slots && Game.workshop.queue.length > 0) {
        const nextCraft = Game.workshop.queue.shift();

        // Vérifier si le craft peut toujours être lancé
        const check = canCraft(nextCraft.craftId, nextCraft.type);
        if (check.canCraft) {
            // Lancer le craft (version interne, sans ajouter à la queue)
            let craftData;
            if (nextCraft.type === 'craft') {
                craftData = CRAFTS_DATA[nextCraft.craftId];
            } else if (nextCraft.type === 'monument') {
                craftData = MONUMENTS_DATA[nextCraft.craftId];
            } else if (nextCraft.type === 'rose') {
                craftData = ROSE_CRAFTS_DATA[nextCraft.craftId];
            }

            // Consommer les ingrédients
            for (let ingredient of craftData.ingredients) {
                if (ingredient.type === 'resource') {
                    Game.inventory[ingredient.name] -= ingredient.quantity;
                } else if (ingredient.type === 'craft') {
                    Game.workshop.craftedItems[ingredient.name] -= ingredient.quantity;
                }
            }

            // Ajouter au slot
            Game.workshop.activeSlots.push({
                craftId: nextCraft.craftId,
                type: nextCraft.type,
                startDay: Game.dayCount,
                duration: craftData.time,
                name: craftData.name
            });

            showMessage(`📜➡️⚒️ "${craftData.name}" lancé depuis la file !`, 'success');
        } else {
            // Ne peut plus être crafté, informer le joueur
            showMessage(`⚠️ "${nextCraft.name}" retiré de la file : ${check.reason}`, 'error');
        }
    }
}

// Vérifie et complète les crafts terminés (appelé à chaque fin de journée)
function processWorkshopCrafts() {
    if (!Game.workshop.unlocked) return;

    let completedCrafts = [];

    // Parcourir les slots actifs
    for (let i = Game.workshop.activeSlots.length - 1; i >= 0; i--) {
        const craft = Game.workshop.activeSlots[i];
        const elapsed = Game.dayCount - craft.startDay;

        if (elapsed >= craft.duration) {
            // Craft terminé !
            completedCrafts.push(craft);

            // Retirer du slot
            Game.workshop.activeSlots.splice(i, 1);

            // Appliquer les effets selon le type
            if (craft.type === 'craft') {
                // Ajouter le craft à l'inventaire
                if (!Game.workshop.craftedItems[craft.name]) {
                    Game.workshop.craftedItems[craft.name] = 0;
                }
                Game.workshop.craftedItems[craft.name]++;
            } else if (craft.type === 'monument') {
                // Marquer le monument comme complété
                Game.workshop.completedMonuments.push(craft.craftId);
            } else if (craft.type === 'rose') {
                // Marquer la Rose comme complétée
                Game.workshop.roseEtherCompleted.push(craft.craftId);

                // Si c'est la Rose finale (id 5), activer le bonus prestige
                if (craft.craftId === 5) {
                    Game.workshop.firstRoseMade = true;
                }
            }
        }
    }

    // Traiter la file d'attente si des slots se sont libérés
    if (completedCrafts.length > 0) {
        processWorkshopQueue();

        // Afficher un message récapitulatif
        for (let craft of completedCrafts) {
            if (craft.type === 'craft') {
                showMessage(`✅ "${craft.name}" terminé ! Disponible dans l'atelier.`, 'success');
            } else if (craft.type === 'monument') {
                showMessage(`🏛️ Monument "${craft.name}" construit !`, 'success');
            } else if (craft.type === 'rose') {
                const msg = craft.craftId === 5
                    ? `🌹✨ "${craft.name}" craftée ! Les points de prestige sont maintenant DOUBLÉS !`
                    : `🌹 "${craft.name}" craftée !`;
                showMessage(msg, 'success');
            }
        }
    }

    saveGame();
}

// Met à jour l'affichage de l'atelier
function updateWorkshopDisplay() {
    if (!Game.workshop.unlocked) return;

    // Mettre à jour le nombre de slots
    document.getElementById('workshop-slots-current').textContent = Game.workshop.slots;

    // Mettre à jour le coût du prochain slot
    if (Game.workshop.slots < 6) {
        const slotCost = getSlotCost(Game.workshop.slots + 1);
        document.getElementById('slot-cost').textContent = formatMoney(slotCost);
        document.getElementById('buy-slot-button').disabled = Game.money < slotCost;
    } else {
        document.getElementById('buy-slot-button').textContent = 'Maximum atteint';
        document.getElementById('buy-slot-button').disabled = true;
    }

    // Mettre à jour la file d'attente
    document.getElementById('workshop-queue-current').textContent = Game.workshop.queue.length;
    document.getElementById('workshop-queue-max').textContent = Game.workshop.queueSize;

    if (Game.workshop.queueSize < 10) {
        const queueCost = getQueueCost(Game.workshop.queueSize + 1);
        document.getElementById('queue-cost').textContent = formatMoney(queueCost);
        document.getElementById('buy-queue-button').disabled = Game.money < queueCost;
    } else {
        document.getElementById('buy-queue-button').textContent = 'Maximum atteint';
        document.getElementById('buy-queue-button').disabled = true;
    }

    // Afficher les slots actifs
    updateWorkshopSlots();

    // Afficher la file d'attente
    updateWorkshopQueue();

    // Afficher les listes de crafts, monuments, et Rose
    updateWorkshopCraftsList();
    updateWorkshopMonumentsList();
    updateWorkshopRoseList();
}

// Met à jour l'affichage des slots actifs
function updateWorkshopSlots() {
    const slotsList = document.getElementById('workshop-slots-list');
    let html = '';

    for (let i = 0; i < Game.workshop.slots; i++) {
        const craft = Game.workshop.activeSlots[i];

        if (craft) {
            const elapsed = Game.dayCount - craft.startDay;
            const progress = Math.min(100, (elapsed / craft.duration) * 100);

            html += `
                <div class="workshop-slot active">
                    <div class="slot-header">
                        <span class="slot-name">${craft.name}</span>
                        <button class="slot-cancel-btn" onclick="cancelCraft(${i})">✖</button>
                    </div>
                    <div class="slot-progress-bar">
                        <div class="slot-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="slot-info">
                        <span>${Math.floor(elapsed)}/${craft.duration} jours</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="workshop-slot empty">
                    <span class="slot-empty-text">Slot vide</span>
                </div>
            `;
        }
    }

    slotsList.innerHTML = html;
}

// Met à jour l'affichage de la file d'attente
function updateWorkshopQueue() {
    const queueList = document.getElementById('workshop-queue-list');

    if (Game.workshop.queue.length === 0) {
        queueList.innerHTML = '<div class="queue-empty">Aucun craft en attente</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < Game.workshop.queue.length; i++) {
        const queued = Game.workshop.queue[i];
        html += `
            <div class="queue-item">
                <span class="queue-position">${i + 1}.</span>
                <span class="queue-name">${queued.name}</span>
                <button class="queue-remove-btn" onclick="removeFromQueue(${i})">✖</button>
            </div>
        `;
    }

    queueList.innerHTML = html;
}

// Met à jour la liste des crafts standards
function updateWorkshopCraftsList() {
    const craftsList = document.getElementById('crafts-list');
    const tierFilter = document.getElementById('craft-tier-filter').value;

    let html = '';

    for (let tier = 1; tier <= 5; tier++) {
        if (tierFilter !== 'all' && parseInt(tierFilter) !== tier) continue;

        const tierCrafts = CRAFTS_DATA.filter(c => c.tier === tier);
        if (tierCrafts.length === 0) continue;

        const tierNames = ['', 'Simples', 'Artisanat', 'Alchimique', 'Sacré', 'Entropique'];
        html += `<h4 class="craft-tier-title">Tier ${tier} - ${tierNames[tier]}</h4>`;

        for (let craft of tierCrafts) {
            const check = canCraft(craft.id, 'craft');
            const { totalCost } = calculateCraftCost(craft);
            const sellValue = totalCost * craft.multiplier;
            const owned = Game.workshop.craftedItems[craft.name] || 0;

            // Construire la liste des ingrédients
            let ingredientsHtml = craft.ingredients.map(ing => {
                let available;
                if (ing.type === 'resource') {
                    available = Game.inventory[ing.name] || 0;
                } else if (ing.type === 'craft') {
                    available = Game.workshop.craftedItems[ing.name] || 0;
                } else {
                    available = '∞';
                }
                const hasEnough = typeof available === 'number' ? available >= ing.quantity : true;
                const color = hasEnough ? 'green' : 'red';
                return `<span style="color: ${color}">${ing.quantity} ${ing.name} (${available})</span>`;
            }).join(', ');

            html += `
                <div class="craft-card ${check.canCraft ? '' : 'disabled'}">
                    <div class="craft-header">
                        <h5 class="craft-name">${craft.name}</h5>
                        <span class="craft-owned">Possédés : ${owned}</span>
                    </div>
                    <div class="craft-body">
                        <div class="craft-info-line">
                            <span class="craft-label">Ingrédients :</span>
                            <span class="craft-value">${ingredientsHtml}</span>
                        </div>
                        <div class="craft-info-line">
                            <span class="craft-label">Temps :</span>
                            <span class="craft-value">${craft.time} jour(s)</span>
                        </div>
                        <div class="craft-info-line">
                            <span class="craft-label">Valeur de vente :</span>
                            <span class="craft-value">${formatMoney(sellValue)} (×${craft.multiplier})</span>
                        </div>
                    </div>
                    <div class="craft-footer">
                        <button class="craft-start-btn" onclick="startCraft(${craft.id}, 'craft')" ${!check.canCraft ? 'disabled' : ''}>
                            ${check.canCraft ? '⚒️ Crafter' : check.reason}
                        </button>
                        ${owned > 0 ? `<button class="craft-sell-btn" onclick="sellCraftedItem('${craft.name}')">💰 Vendre</button>` : ''}
                    </div>
                </div>
            `;
        }
    }

    if (html === '') {
        html = '<p class="no-crafts">Aucun craft disponible dans ce tier.</p>';
    }

    craftsList.innerHTML = html;
}

// Met à jour la liste des monuments
function updateWorkshopMonumentsList() {
    const monumentsList = document.getElementById('monuments-list');
    let html = '';

    for (let monument of MONUMENTS_DATA) {
        const isCompleted = Game.workshop.completedMonuments.includes(monument.id);
        const check = canCraft(monument.id, 'monument');

        // Construire la liste des ingrédients
        let ingredientsHtml = monument.ingredients.map(ing => {
            let available;
            if (ing.type === 'resource') {
                available = Game.inventory[ing.name] || 0;
            } else if (ing.type === 'craft') {
                available = Game.workshop.craftedItems[ing.name] || 0;
            } else if (ing.type === 'special') {
                const item = SPECIAL_ITEMS_DATA.find(s => s.name === ing.name);
                available = item && Game.prestige >= item.prestigeRequired ? '✓' : '✗';
            }
            const hasEnough = typeof available === 'number' ? available >= ing.quantity : available === '✓';
            const color = hasEnough ? 'green' : 'red';
            const qty = ing.quantity || 1;
            return `<span style="color: ${color}">${qty} ${ing.name} ${typeof available === 'number' ? `(${available})` : available}</span>`;
        }).join(', ');

        html += `
            <div class="monument-card ${isCompleted ? 'completed' : (check.canCraft ? '' : 'disabled')}">
                <div class="monument-header">
                    <h5 class="monument-name">${monument.name}</h5>
                    ${isCompleted ? '<span class="monument-status">✓ Construit</span>' : ''}
                </div>
                <div class="monument-body">
                    <div class="monument-info-line">
                        <span class="monument-label">Tier :</span>
                        <span class="monument-value">Tier ${monument.tier}</span>
                    </div>
                    <div class="monument-info-line">
                        <span class="monument-label">Ingrédients :</span>
                        <span class="monument-value">${ingredientsHtml}</span>
                    </div>
                    <div class="monument-info-line">
                        <span class="monument-label">Temps :</span>
                        <span class="monument-value">${monument.time} jours</span>
                    </div>
                    <div class="monument-info-line">
                        <span class="monument-label">Bonus :</span>
                        <span class="monument-value">Débloque craft spécial ${monument.bonus}</span>
                    </div>
                </div>
                <div class="monument-footer">
                    ${!isCompleted ? `
                        <button class="monument-build-btn" onclick="startCraft(${monument.id}, 'monument')" ${!check.canCraft ? 'disabled' : ''}>
                            ${check.canCraft ? '🏛️ Construire' : check.reason}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    monumentsList.innerHTML = html;
}

// Met à jour la liste des Rose d'Éther
function updateWorkshopRoseList() {
    const roseList = document.getElementById('rose-list');
    let html = '';

    for (let rose of ROSE_CRAFTS_DATA) {
        const isCompleted = Game.workshop.roseEtherCompleted.includes(rose.id);
        const check = canCraft(rose.id, 'rose');

        // Construire la liste des ingrédients
        let ingredientsHtml = rose.ingredients.map(ing => {
            let available;
            if (ing.type === 'resource') {
                available = Game.inventory[ing.name] || 0;
            } else if (ing.type === 'craft') {
                available = Game.workshop.craftedItems[ing.name] || 0;
            }
            const hasEnough = available >= ing.quantity;
            const color = hasEnough ? 'green' : 'red';
            return `<span style="color: ${color}">${ing.quantity} ${ing.name} (${available})</span>`;
        }).join(', ');

        // Vérifier monument requis
        let monumentReq = '';
        if (rose.requiresMonument !== undefined) {
            const monument = MONUMENTS_DATA[rose.requiresMonument];
            const hasMonument = Game.workshop.completedMonuments.includes(rose.requiresMonument);
            monumentReq = `<div class="rose-info-line">
                <span class="rose-label">Monument requis :</span>
                <span class="rose-value" style="color: ${hasMonument ? 'green' : 'red'}">
                    ${monument.name} ${hasMonument ? '✓' : '✗'}
                </span>
            </div>`;
        }

        html += `
            <div class="rose-card ${isCompleted ? 'completed' : (check.canCraft ? '' : 'disabled')}">
                <div class="rose-header">
                    <h5 class="rose-name">🌹 ${rose.name}</h5>
                    ${isCompleted ? '<span class="rose-status">✓ Craftée</span>' : ''}
                </div>
                <div class="rose-body">
                    ${monumentReq}
                    <div class="rose-info-line">
                        <span class="rose-label">Ingrédients :</span>
                        <span class="rose-value">${ingredientsHtml}</span>
                    </div>
                    <div class="rose-info-line">
                        <span class="rose-label">Temps :</span>
                        <span class="rose-value">${rose.time} jours</span>
                    </div>
                    <div class="rose-info-line">
                        <span class="rose-label">Multiplicateur :</span>
                        <span class="rose-value">×${rose.multiplier}</span>
                    </div>
                    ${rose.id === 5 ? '<div class="rose-special">🌟 DOUBLE les points de prestige à la réincarnation !</div>' : ''}
                </div>
                <div class="rose-footer">
                    ${!isCompleted ? `
                        <button class="rose-craft-btn" onclick="startCraft(${rose.id}, 'rose')" ${!check.canCraft ? 'disabled' : ''}>
                            ${check.canCraft ? '🌹 Crafter' : check.reason}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    roseList.innerHTML = html;
}

// Vend un craft fabriqué
function sellCraftedItem(craftName) {
    const owned = Game.workshop.craftedItems[craftName] || 0;
    if (owned === 0) {
        showMessage('Vous n\'avez aucun de ce craft à vendre !', 'error');
        return;
    }

    const craftData = CRAFTS_DATA.find(c => c.name === craftName);
    if (!craftData) return;

    const { totalCost } = calculateCraftCost(craftData);
    const sellValue = totalCost * craftData.multiplier;

    // Appliquer le bonus de vente
    const sellBonus = getSellBonus();
    const finalValue = sellValue * (1 + sellBonus / 100);

    Game.workshop.craftedItems[craftName]--;
    Game.money += finalValue;

    updateMoneyDisplay();
    updateWorkshopDisplay();
    saveGame();

    showMessage(`💰 "${craftName}" vendu pour ${formatMoney(finalValue)} !`, 'success');
}

// Gère le changement d'onglet dans l'atelier
function switchWorkshopTab(tabName) {
    // Désactiver tous les sous-onglets
    document.querySelectorAll('.workshop-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.workshop-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activer l'onglet sélectionné
    document.querySelector(`[data-workshop-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`workshop-${tabName}-tab`).classList.add('active');
}

// ===== SYSTÈME DE L'ORPHELINAT DE RITON =====

// Données des affinités (catégories de bâtiments)
const ORPHANAGE_AFFINITIES = {
    production: {
        name: "🏗️ Production",
        buildings: [2, 4, 5], // Fermier, Chasseur, Mineur
        icon: "🏗️"
    },
    craft: {
        name: "⚙️ Craft",
        buildings: [6, 8, 11], // Forgeron, Alchimiste, Forge Stellaire
        icon: "⚙️"
    },
    argent: {
        name: "💰 Argent",
        buildings: [1, 3, 7], // Mendiant, Barde, Marchand
        icon: "💰"
    },
    magie: {
        name: "🔮 Magie",
        buildings: [9, 12, 13], // Tour du Mage, Observatoire Arcanique, Sanctuaire de l'Esprit
        icon: "🔮"
    },
    chaos: {
        name: "🌀 Chaos",
        buildings: [10, 14], // Temple du Temps, Forteresse Céleste
        icon: "🌀"
    }
};

// Vérifie si l'orphelinat est débloqué et affiche/cache le bouton
function checkOrphanageUnlock() {
    if (Game.orphanage.unlocked) {
        document.getElementById('orphanage-tab-button').style.display = 'block';
    } else {
        document.getElementById('orphanage-tab-button').style.display = 'none';
    }
}

// Calcule la capacité maximale de l'orphelinat
function getOrphanageCapacity() {
    // Capacité max = 1 + floor(sqrt(PrestigeTotal))
    return 1 + Math.floor(Math.sqrt(Game.prestigeTotalCumule));
}

// Génère un nouvel enfant
function generateChild() {
    if (!Game.orphanage.unlocked) return;

    const capacity = getOrphanageCapacity();
    if (Game.orphanage.children.length >= capacity) return;

    // Déterminer la rareté (tirage aléatoire)
    const rand = Math.random() * 100;
    let rarity;
    if (rand < 75) {
        rarity = 'common'; // 75%
    } else if (rand < 93) { // 75 + 18
        rarity = 'rare'; // 18%
    } else if (rand < 99) { // 93 + 6
        rarity = 'epic'; // 6%
    } else {
        rarity = 'legendary'; // 1%
    }

    // Choisir une affinité aléatoire
    const affinityKeys = Object.keys(ORPHANAGE_AFFINITIES);
    const affinity = affinityKeys[Math.floor(Math.random() * affinityKeys.length)];

    // Générer un nom aléatoire
    const firstNames = ["Abel", "Léo", "Emma", "Zoé", "Liam", "Mia", "Noah", "Lily", "Tom", "Eva", "Max", "Luna", "Sam", "Rose", "Tim", "Jade", "Finn", "Ruby", "Jack", "Ella"];
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];

    // Créer l'enfant
    const child = {
        id: Date.now() + Math.random(), // ID unique
        name: name,
        age: 6, // Commence à 6 ans
        rarity: rarity,
        affinity: affinity,
        birthDay: Game.dayCount
    };

    Game.orphanage.children.push(child);
    updateOrphanageDisplay();
    saveGame();

    const rarityText = {
        common: "Commune",
        rare: "Rare",
        epic: "Épique",
        legendary: "LÉGENDAIRE"
    };

    showMessage(`👶 ${name} (${rarityText[rarity]}) rejoint l'orphelinat ! Affinité : ${ORPHANAGE_AFFINITIES[affinity].name}`, 'success');
}

// Vieillit les enfants et gère les départs
function processOrphanageAging() {
    if (!Game.orphanage.unlocked) return;

    // Vérifier si c'est le moment de faire vieillir (tous les 10 jours)
    for (let i = Game.orphanage.children.length - 1; i >= 0; i--) {
        const child = Game.orphanage.children[i];
        const daysAtOrphanage = Game.dayCount - child.birthDay;

        // Vieillir tous les 10 jours
        const newAge = 6 + Math.floor(daysAtOrphanage / 10);
        child.age = newAge;

        // Partir à 16 ans (après 100 jours)
        if (child.age >= 16) {
            // Choisir un bâtiment de son affinité
            const affinityData = ORPHANAGE_AFFINITIES[child.affinity];
            const buildingId = affinityData.buildings[Math.floor(Math.random() * affinityData.buildings.length)];

            // Déterminer le bonus selon la rareté
            const rarityBonus = {
                common: 1,
                rare: 3,
                epic: 5,
                legendary: 10
            };
            const bonus = rarityBonus[child.rarity];

            // Affecter l'enfant
            Game.orphanage.assignedChildren.push({
                buildingId: buildingId,
                rarity: child.rarity,
                bonus: bonus,
                name: child.name
            });

            // Retirer l'enfant de l'orphelinat
            Game.orphanage.children.splice(i, 1);

            const buildingName = BUILDINGS_DATA[buildingId].name;
            showMessage(`🎓 ${child.name} a 16 ans et devient ${buildingName} (+${bonus}%) !`, 'success');
        }
    }

    // Générer un nouvel enfant si c'est le bon jour
    if (Game.dayCount >= Game.orphanage.nextChildDay) {
        generateChild();
        Game.orphanage.nextChildDay = Game.dayCount + 10;
    }

    updateOrphanageDisplay();
    saveGame();
}

// Calcule le bonus global de l'orphelinat (0.5% par enfant présent)
function getOrphanageGlobalBonus() {
    if (!Game.orphanage.unlocked) return 0;
    return Game.orphanage.children.length * 0.5;
}

// Calcule le bonus permanent pour un bâtiment donné
function getOrphanageBuildingBonus(buildingId) {
    if (!Game.orphanage.unlocked) return 0;

    let totalBonus = 0;
    for (let assigned of Game.orphanage.assignedChildren) {
        if (assigned.buildingId === buildingId) {
            totalBonus += assigned.bonus;
        }
    }
    return totalBonus;
}

// Met à jour l'affichage de l'orphelinat
function updateOrphanageDisplay() {
    if (!Game.orphanage.unlocked) return;

    const capacity = getOrphanageCapacity();
    const currentCount = Game.orphanage.children.length;
    const globalBonus = getOrphanageGlobalBonus();

    // Mettre à jour les stats globales
    document.getElementById('orphanage-prestige-total').textContent = Game.prestigeTotalCumule;
    document.getElementById('orphanage-capacity').textContent = `${currentCount}/${capacity}`;
    document.getElementById('orphanage-global-bonus').textContent = `+${globalBonus.toFixed(1)}%`;

    // Afficher les enfants présents
    const childrenList = document.getElementById('orphanage-children-list');
    if (Game.orphanage.children.length === 0) {
        childrenList.innerHTML = '<div class="orphanage-empty">Aucun enfant à l\'orphelinat pour le moment...</div>';
    } else {
        let html = '';
        for (let child of Game.orphanage.children) {
            const daysAtOrphanage = Game.dayCount - child.birthDay;
            const daysUntilLeaving = 100 - daysAtOrphanage;
            const affinityData = ORPHANAGE_AFFINITIES[child.affinity];

            const rarityClass = child.rarity;
            const rarityText = {
                common: "Commune",
                rare: "Rare",
                epic: "Épique",
                legendary: "Légendaire"
            };

            html += `
                <div class="orphanage-child-card rarity-${rarityClass}">
                    <div class="child-header">
                        <span class="child-name">${child.name}</span>
                        <span class="child-age">${child.age} ans</span>
                    </div>
                    <div class="child-body">
                        <div class="child-info-line">
                            <span class="child-label">Rareté :</span>
                            <span class="child-rarity">${rarityText[child.rarity]}</span>
                        </div>
                        <div class="child-info-line">
                            <span class="child-label">Affinité :</span>
                            <span class="child-affinity">${affinityData.icon} ${affinityData.name}</span>
                        </div>
                        <div class="child-info-line">
                            <span class="child-label">Départ dans :</span>
                            <span class="child-days">${daysUntilLeaving} jours</span>
                        </div>
                    </div>
                </div>
            `;
        }
        childrenList.innerHTML = html;
    }

    // Afficher les bonus permanents par bâtiment
    const bonusList = document.getElementById('orphanage-bonus-list');
    let bonusHtml = '';
    let hasBonus = false;

    for (let i = 0; i < BUILDINGS_DATA.length; i++) {
        const bonus = getOrphanageBuildingBonus(i);
        if (bonus > 0) {
            hasBonus = true;
            const building = BUILDINGS_DATA[i];
            const assignedCount = Game.orphanage.assignedChildren.filter(a => a.buildingId === i).length;

            bonusHtml += `
                <div class="orphanage-bonus-card">
                    <div class="bonus-building">
                        <span class="bonus-icon">${building.icon}</span>
                        <span class="bonus-name">${building.name}</span>
                    </div>
                    <div class="bonus-details">
                        <span class="bonus-count">${assignedCount} enfant(s)</span>
                        <span class="bonus-value">+${bonus}%</span>
                    </div>
                </div>
            `;
        }
    }

    if (!hasBonus) {
        bonusList.innerHTML = '<div class="orphanage-empty">Aucun enfant n\'a encore quitté l\'orphelinat...</div>';
    } else {
        bonusList.innerHTML = bonusHtml;
    }

    // Afficher le prochain enfant
    const daysUntilNext = Game.orphanage.nextChildDay - Game.dayCount;
    document.getElementById('orphanage-next-child').textContent = `Prochain enfant dans ${daysUntilNext} jour(s)`;
}

// ===== SYSTÈME D'ONGLETS =====

function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ===== MISE À JOUR DE L'AFFICHAGE =====

function updateMoneyDisplay() {
    document.getElementById('money-value').textContent = formatMoney(Game.money);
    updateAllBuildingsDisplay();
    checkPrestigeUnlock();
    updatePrestigeDisplay();
    checkAutoReportUnlock();
}

// ===== INITIALISATION =====

function init() {
    console.log('Initialisation du jeu...');

    // Charger la sauvegarde
    loadGame();

    // Créer la liste des bâtiments et l'inventaire
    createBuildingsList();
    updateInventoryDisplay();

    // Mettre à jour l'affichage
    updateMoneyDisplay();
    updateClickDisplay();
    updateTimeDisplay();
    updatePrestigeDisplay();
    checkAutoReportUnlock();
    checkWorkshopUnlock();
    updateWorkshopDisplay();
    checkOrphanageUnlock();
    updateOrphanageDisplay();

    // Event listeners - Boutons
    document.getElementById('click-button').addEventListener('click', handleClick);
    document.getElementById('continue-button').addEventListener('click', hideReport);
    document.getElementById('close-abilities-button').addEventListener('click', hideAbilities);
    document.getElementById('save-button').addEventListener('click', saveGame);
    document.getElementById('export-button').addEventListener('click', exportSave);
    document.getElementById('import-button').addEventListener('click', importSave);
    document.getElementById('import-file').addEventListener('change', handleImportFile);
    document.getElementById('reset-button').addEventListener('click', resetGame);

    // Event listeners - Onglets principaux
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
            if (tabName === 'workshop') {
                updateWorkshopDisplay();
            }
        });
    });

    // Event listeners - Sous-onglets de l'atelier
    document.querySelectorAll('.workshop-tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-workshop-tab');
            switchWorkshopTab(tabName);
        });
    });

    // Démarrer le timer
    startTimer();

    // Initialiser la détection du cheat code
    initCheatDetection();

    console.log('Jeu initialisé !');
}

// Démarrer le jeu quand la page est chargée
window.addEventListener('DOMContentLoaded', init);
