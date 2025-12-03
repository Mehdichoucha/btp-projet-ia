// ========================================
// PATOKETCHUP - APPLICATION DE RECETTES
// Étape 3 : JavaScript avec API TheMealDB (adapté)
// ========================================

// Configuration de l'API TheMealDB
const API_CONFIG = {
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    endpoints: {
        searchByName: '/search.php',        // ?s=nom
        searchByIngredient: '/filter.php',  // ?i=ingredient
        getById: '/lookup.php',             // ?i=ID
        random: '/random.php',
        categories: '/categories.php'
    }
};

// Cache pour optimiser les performances
const recipeCache = new Map();
const searchCache = new Map();

// Variables globales
let currentRecipes = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let isLoading = false;
let currentSection = 'home'; // Section active
let selectedIngredients = []; // Ingrédients sélectionnés pour "Mon Frigo"
let selectedIngredientsTranslated = []; // Traductions automatiques en anglais pour les appels API

// --- Supabase configuration (PLACEHOLDERS) ---
// Créez un projet Supabase et remplacez les valeurs ci-dessous par celles de votre projet.
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
let supabaseClient = null;
if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
        console.warn('Impossible d\'initialiser Supabase:', err);
    }
} else {
    console.log('Supabase non configuré. Ajoutez SUPABASE_URL et SUPABASE_ANON_KEY dans script.js pour activer la persistance.');
}

// Données de fallback pour les tests (si API non disponible)
const fallbackRecipes = [
    {
        id: 1,
        name: "Tacos de Poisson Épicés",
        category: "plats",
        difficulty: "Facile",
        time: "25 min",
        servings: 4,
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop&auto=format",
        description: "Des tacos frais et épicés avec du poisson grillé, avocat et sauce crémeuse.",
        ingredients: [
            "4 filets de poisson blanc",
            "8 tortillas de maïs",
            "2 avocats mûrs",
            "1 chou rouge émincé",
            "1 citron vert",
            "Crème fraîche",
            "Épices mexicaines"
        ],
        instructions: [
            "Mariner le poisson avec les épices pendant 15 minutes",
            "Griller le poisson 3-4 minutes de chaque côté",
            "Réchauffer les tortillas",
            "Préparer l'avocat en lamelles",
            "Assembler les tacos avec tous les ingrédients"
        ]
    },
    {
        id: 2,
        name: "Salade Buddha Bowl",
        category: "entrees",
        difficulty: "Facile",
        time: "20 min",
        servings: 2,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&auto=format",
        description: "Bowl coloré et nutritif avec quinoa, légumes frais et vinaigrette tahini.",
        ingredients: [
            "1 tasse de quinoa",
            "2 carottes râpées",
            "1 concombre",
            "200g pois chiches",
            "Épinards frais",
            "Graines de tournesol",
            "Sauce tahini"
        ],
        instructions: [
            "Cuire le quinoa selon les instructions",
            "Préparer tous les légumes",
            "Disposer harmonieusement dans le bowl",
            "Préparer la sauce tahini",
            "Servir avec la sauce"
        ]
    },
    {
        id: 3,
        name: "Tiramisu aux Fruits Rouges",
        category: "desserts",
        difficulty: "Moyen",
        time: "4h 30min",
        servings: 6,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&auto=format",
        description: "Variation moderne du tiramisu classique avec des fruits rouges frais.",
        ingredients: [
            "500g mascarpone",
            "4 œufs",
            "100g sucre",
            "300ml café fort",
            "24 biscuits à la cuillère",
            "300g fruits rouges mixtes",
            "Cacao en poudre"
        ],
        instructions: [
            "Séparer les blancs des jaunes d'œufs",
            "Mélanger jaunes, sucre et mascarpone",
            "Monter les blancs en neige et incorporer",
            "Tremper les biscuits dans le café",
            "Alterner couches biscuits et crème",
            "Réfrigérer 4h minimum",
            "Décorer avec fruits rouges avant service"
        ]
    },
    {
        id: 4,
        name: "Pasta Carbonara Authentique",
        category: "plats",
        difficulty: "Moyen",
        time: "20 min",
        servings: 4,
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop&auto=format",
        description: "La vraie carbonara italienne : simple, crémeuse et délicieuse.",
        ingredients: [
            "400g spaghetti",
            "200g guanciale ou pancetta",
            "4 jaunes d'œuf",
            "100g pecorino romano râpé",
            "Poivre noir fraîchement moulu",
            "Sel pour l'eau des pâtes"
        ],
        instructions: [
            "Faire bouillir l'eau salée pour les pâtes",
            "Faire revenir le guanciale jusqu'à croustillant",
            "Mélanger jaunes et fromage dans un bol",
            "Cuire les pâtes al dente",
            "Mélanger pâtes chaudes avec œufs hors du feu",
            "Ajouter guanciale et son gras",
            "Servir immédiatement avec du poivre"
        ]
    },
    {
        id: 5,
        name: "Velouté de Potiron",
        category: "entrees",
        difficulty: "Facile",
        time: "35 min",
        servings: 4,
        image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop&auto=format",
        description: "Soupe onctueuse et réconfortante parfaite pour l'automne.",
        ingredients: [
            "1kg potiron",
            "2 oignons",
            "2 carottes",
            "1L bouillon de légumes",
            "Crème liquide",
            "Gingembre frais",
            "Huile d'olive"
        ],
        instructions: [
            "Éplucher et couper le potiron en cubes",
            "Faire revenir oignons et carottes",
            "Ajouter potiron et gingembre",
            "Couvrir de bouillon et laisser mijoter 25min",
            "Mixer jusqu'à consistance lisse",
            "Ajouter crème et assaisonner",
            "Servir chaud avec des graines de courge"
        ]
    },
    {
        id: 6,
        name: "Cheesecake aux Myrtilles",
        category: "desserts",
        difficulty: "Moyen",
        time: "5h 20min",
        servings: 8,
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&auto=format",
        description: "Cheesecake crémeux avec un coulis de myrtilles maison.",
        ingredients: [
            "300g biscuits digestifs",
            "150g beurre fondu",
            "600g cream cheese",
            "200g sucre",
            "3 œufs",
            "300g myrtilles",
            "Vanille"
        ],
        instructions: [
            "Broyer biscuits et mélanger avec beurre",
            "Tasser le mélange dans le moule",
            "Battre cream cheese, sucre et œufs",
            "Verser sur la base biscuitée",
            "Cuire 45min au four à 180°C",
            "Laisser refroidir puis réfrigérer 4h",
            "Préparer coulis myrtilles et décorer"
        ]
    }
];

// ========================================
// FONCTIONS API SPOONACULAR
// ========================================

// Fonction utilitaire pour faire des appels API vers TheMealDB
async function makeAPICall(endpoint, params = {}) {
    try {
        const url = new URL(API_CONFIG.baseUrl + endpoint);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });

        console.log('🌐 TheMealDB API Call:', url.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ TheMealDB API Error:', error);
        return null;
    }
}

// Fonction pour améliorer la qualité des images (fallback)
function enhanceImageQuality(imageUrl, size = '636x393') {
    console.log('🔍 enhanceImageQuality called with:', imageUrl);
    
    // Temporairement, retourner directement l'URL sans modification pour debug
    if (!imageUrl || imageUrl.includes('placeholder')) {
        const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format';
        console.log('🔄 Using fallback image:', fallback);
        return fallback;
    }
    
    // Retourner directement l'URL originale pour le moment
    console.log('✅ Returning original URL:', imageUrl);
    return imageUrl;
}

// Charger des recettes aléatoires
async function loadRandomRecipes(number = 12) {
    const cacheKey = `random_${number}`;
    
    // Vérifier le cache d'abord
    if (recipeCache.has(cacheKey)) {
        console.log('📦 Cache hit for random recipes');
        return recipeCache.get(cacheKey);
    }
    
    try {
        setLoadingState(true);
        
        const data = await makeAPICall(API_CONFIG.endpoints.random, {
            number: number,
            tags: 'meal' // Filtrer pour avoir des vrais repas
        });
        
        if (data && data.recipes) {
            const recipes = data.recipes.map(recipe => {
                const enhancedImage = enhanceImageQuality(recipe.image || 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=636&h=393&fit=crop&auto=format', '636x393');
                console.log('🖼️ Image URL:', recipe.image, '→', enhancedImage);
                
                return {
                    id: recipe.id,
                    name: recipe.title,
                    category: getCategoryFromDishTypes(recipe.dishTypes || []),
                    difficulty: getDifficultyFromTime(recipe.readyInMinutes),
                    time: `${recipe.readyInMinutes || 30} min`,
                    servings: recipe.servings || 4,
                    image: enhancedImage,
                    description: recipe.summary ? recipe.summary.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'Délicieuse recette à découvrir',
                    ingredients: [],
                    instructions: []
                };
            });
            
            // Mettre en cache
            recipeCache.set(cacheKey, recipes);
            return recipes;
        } else {
            // Fallback vers les données locales
            console.log('🔄 Using fallback recipes');
            return fallbackRecipes;
        }
        
    } catch (error) {
        console.error('❌ Error loading random recipes:', error);
        return fallbackRecipes;
    } finally {
        setLoadingState(false);
    }
}

// Rechercher des recettes
async function searchRecipes(query, type = '', number = 12) {
    const cacheKey = `search_${query}_${type}_${number}`;
    
    // Vérifier le cache
    if (searchCache.has(cacheKey)) {
        console.log('📦 Cache hit for search:', query);
        return searchCache.get(cacheKey);
    }
    
    try {
        setLoadingState(true);

        const data = await makeAPICall(API_CONFIG.endpoints.searchByName, { s: query });

        if (data && data.meals) {
            const recipes = data.meals.map(meal => ({
                id: meal.idMeal,
                name: meal.strMeal,
                category: meal.strCategory ? meal.strCategory.toLowerCase() : 'plats',
                difficulty: getDifficultyFromTime(null),
                time: '30 min',
                servings: 4,
                image: enhanceImageQuality(meal.strMealThumb || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=636&h=393&fit=crop&auto=format', '636x393'),
                description: meal.strInstructions ? meal.strInstructions.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'Délicieuse recette trouvée',
                ingredients: extractMealIngredients(meal),
                instructions: meal.strInstructions ? meal.strInstructions.split('\n').filter(Boolean) : []
            }));

            searchCache.set(cacheKey, recipes);
            return recipes;
        } else {
            return [];
        }

    } catch (error) {
        console.error('❌ Error searching recipes:', error);
        return [];
    } finally {
        setLoadingState(false);
    }
}

// Obtenir les détails complets d'une recette (TheMealDB)
async function getRecipeDetails(recipeId) {
    const cacheKey = `details_${recipeId}`;
    
    // Vérifier le cache
    if (recipeCache.has(cacheKey)) {
        console.log('📦 Cache hit for recipe details:', recipeId);
        return recipeCache.get(cacheKey);
    }
    
    try {
        const data = await makeAPICall(API_CONFIG.endpoints.getById, { i: recipeId });

        if (data && data.meals && data.meals.length > 0) {
            const meal = data.meals[0];
            const ingredients = extractMealIngredients(meal);
            const instructions = meal.strInstructions ? meal.strInstructions.split('\n').filter(Boolean) : (meal.strInstructions ? [meal.strInstructions] : []);

            const recipe = {
                id: meal.idMeal,
                name: meal.strMeal,
                category: meal.strCategory || 'Plat',
                difficulty: getDifficultyFromTime(null),
                time: '30 min',
                servings: 4,
                image: enhanceImageQuality(meal.strMealThumb || '' , '800x600'),
                description: meal.strInstructions ? meal.strInstructions.replace(/<[^>]*>/g, '') : 'Délicieuse recette',
                ingredients: ingredients,
                instructions: instructions
            };

            recipeCache.set(cacheKey, recipe);
            return recipe;
        }

        return null;

    } catch (error) {
        console.error('❌ Error getting recipe details:', error);
        return null;
    }
}

// Fonctions utilitaires pour convertir les données API
function getCategoryFromDishTypes(dishTypes) {
    const dishTypeStr = dishTypes.join(' ').toLowerCase();
    
    if (dishTypeStr.includes('appetizer') || dishTypeStr.includes('starter') || dishTypeStr.includes('salad')) {
        return 'entrees';
    } else if (dishTypeStr.includes('dessert') || dishTypeStr.includes('sweet')) {
        return 'desserts';
    } else {
        return 'plats';
    }
}

function getDifficultyFromTime(minutes) {
    if (!minutes) return 'Moyen';
    if (minutes <= 20) return 'Facile';
    if (minutes <= 45) return 'Moyen';
    return 'Difficile';
}

function setLoadingState(loading) {
    isLoading = loading;
    const recipesGrid = document.querySelector('.recipes-grid');
    
    if (loading && recipesGrid) {
        recipesGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <h3>Chargement des recettes...</h3>
                <p>Recherche dans notre base de données culinaire</p>
            </div>
        `;
    }
}

// ========================================
// FONCTIONS D'INITIALISATION
// ========================================

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🍅 PatOketchup App - Initialisation...');
    
    // Initialiser les composants
    initializeEventListeners();
    
    // Charger nos recettes de présentation par défaut
    await loadInitialRecipes();
    
    console.log('✅ Application prête !');
});

// Charger les recettes initiales (nos recettes de présentation)
async function loadInitialRecipes() {
    try {
        console.log('�️ Chargement des recettes de présentation PatOketchup...');
        
        // Utiliser nos belles recettes de présentation
        currentRecipes = fallbackRecipes;
        displayRecipes(currentRecipes);
        updateResultsCount(currentRecipes.length);
        
        console.log('✅ Recettes de présentation chargées !');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des recettes:', error);
        // En cas d'erreur, utiliser quand même nos recettes
        currentRecipes = fallbackRecipes;
        displayRecipes(currentRecipes);
        updateResultsCount(currentRecipes.length);
    }
}

// ========================================
// NAVIGATION ENTRE SECTIONS
// ========================================

// Changer de section
function switchSection(sectionName) {
    if (currentSection === sectionName) return;
    
    // Masquer toutes les sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });
    
    // Retirer la classe active de tous les liens
    document.querySelectorAll('.nav-link').forEach(link => {
        link.parentElement.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        // Fallback vers section accueil si elle existe
        const homeSection = document.getElementById('results-section') || document.getElementById('home-section');
        if (homeSection) {
            homeSection.style.display = 'block';
            sectionName = 'home';
        }
    }
    
    // Activer le lien de navigation correspondant
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
    }
    
    currentSection = sectionName;
    console.log(`📱 Section active: ${sectionName}`);
    
    // Actions spécifiques selon la section
    handleSectionChange(sectionName);
}

// Gérer les changements de section
function handleSectionChange(sectionName) {
    switch (sectionName) {
        case 'home':
            // Afficher nos recettes de présentation
            if (currentRecipes.length === 0) {
                currentRecipes = fallbackRecipes;
                displayRecipes(currentRecipes);
                updateResultsCount(currentRecipes.length);
            }
            break;
        case 'frigo':
            // Initialiser la section Mon Frigo
            initializeFrigoSection();
            break;
        case 'favorites':
            // TODO: Implémenter les favoris
            break;
        case 'shopping':
            // TODO: Implémenter la liste de courses
            break;
        case 'quick':
            // TODO: Implémenter les recettes rapides
            break;
        case 'anti-gaspi':
            // TODO: Implémenter l'anti-gaspi
            break;
    }
}

// ========================================
// FONCTIONNALITÉ MON FRIGO
// ========================================

// Initialiser la section Mon Frigo
function initializeFrigoSection() {
    updateIngredientsDisplay();
    setupFrigoEventListeners();
}

// Ajouter un ingrédient à la liste
function addIngredient(ingredient) {
    if (!ingredient || ingredient.trim() === '') return;
    
    const cleanIngredient = ingredient.trim().toLowerCase();
    
    // Éviter les doublons
    if (selectedIngredients.includes(cleanIngredient)) {
        showNotification('Cet ingrédient est déjà dans ta liste !', 'warning');
        return;
    }
    
    // Traduction automatique en anglais (pour les appels API)
    const translated = translateIngredientToEnglish(cleanIngredient);

    selectedIngredients.push(cleanIngredient);
    selectedIngredientsTranslated.push(translated);
    updateIngredientsDisplay();
    
    // Vider le champ de saisie
    const input = document.getElementById('frigo-ingredient-input');
    if (input) input.value = '';
    
    showNotification(`${ingredient} ajouté !`, 'success');
    
    // 🎯 NOUVELLE FONCTIONNALITÉ : Suggestions automatiques
    setTimeout(() => {
        autoSuggestRecipes();
    }, 500); // Petit délai pour laisser l'animation se terminer
}

// Supprimer un ingrédient
function removeIngredient(ingredient) {
    const index = selectedIngredients.indexOf(ingredient);
    if (index > -1) {
        selectedIngredients.splice(index, 1);
        // Supprimer la traduction correspondante
        selectedIngredientsTranslated.splice(index, 1);
        updateIngredientsDisplay();
        showNotification(`${ingredient} retiré`, 'info');
        
        // Actualiser les suggestions
        if (selectedIngredients.length > 0) {
            setTimeout(() => {
                autoSuggestRecipes();
            }, 300);
        } else {
            // Masquer les résultats si plus d'ingrédients
            const resultsContainer = document.getElementById('frigo-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        }
    }
}

// 🎯 NOUVELLE FONCTIONNALITÉ : Suggestions automatiques de recettes
async function autoSuggestRecipes() {
    if (selectedIngredients.length === 0) return;
    
    const resultsContainer = document.getElementById('frigo-results');
    const gridContainer = document.getElementById('frigo-recipes-grid');
    const resultsTitle = document.querySelector('.frigo-results-title');
    
    if (!resultsContainer || !gridContainer) return;
    
    // Afficher la section des suggestions
    resultsContainer.style.display = 'block';
    
    // Mettre à jour le titre avec le nombre d'ingrédients
    if (resultsTitle) {
        const count = selectedIngredients.length;
        resultsTitle.innerHTML = `🍽️ Suggestions avec ${count} ingrédient${count > 1 ? 's' : ''} :`;
    }
    
    // Afficher le loader de suggestion
    gridContainer.innerHTML = `
        <div class="suggestion-loading">
            <div class="loading-spinner-small"></div>
            <h4>🤖 Recherche de suggestions...</h4>
            <p>Analyse de tes ingrédients en cours</p>
        </div>
    `;
    
    try {
        // Utiliser l'API pour des suggestions intelligentes
        const ingredientsQuery = (selectedIngredientsTranslated.length ? selectedIngredientsTranslated.join(',') : selectedIngredients.join(','));
        console.log(`🤖 Auto-suggestion avec: ${ingredientsQuery}`);
        
        const recipes = await searchRecipesByIngredientsAPI(ingredientsQuery, 6); // Limiter à 6 suggestions
        
        if (recipes && recipes.length > 0) {
            displayFrigoRecipes(recipes);
            
            // Afficher un message d'info selon le nombre de recettes
            if (recipes.length >= 3) {
                showNotification(`${recipes.length} suggestions trouvées ! 🎉`, 'success');
            } else {
                showNotification(`${recipes.length} suggestion${recipes.length > 1 ? 's' : ''} trouvée${recipes.length > 1 ? 's' : ''}. Ajoute d'autres ingrédients pour plus d'options !`, 'info');
            }
        } else {
            // Aucune recette trouvée - proposer des suggestions d'ingrédients complémentaires
            gridContainer.innerHTML = `
                <div class="no-suggestions">
                    <div class="no-suggestions-icon">🤔</div>
                    <h4>Aucune recette trouvée</h4>
                    <p>Essaye d'ajouter ces ingrédients populaires :</p>
                    <div class="complementary-suggestions">
                        <button class="suggestion-chip" onclick="addIngredient('oeufs')">🥚 Œufs</button>
                        <button class="suggestion-chip" onclick="addIngredient('oignons')">🧅 Oignons</button>
                        <button class="suggestion-chip" onclick="addIngredient('ail')">🧄 Ail</button>
                        <button class="suggestion-chip" onclick="addIngredient('huile d\\'olive')">🫒 Huile d'olive</button>
                        <button class="suggestion-chip" onclick="addIngredient('sel')">🧂 Sel & Poivre</button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur suggestions automatiques:', error);
        
        // En cas d'erreur, proposer nos recettes locales qui correspondent
        const localSuggestions = getLocalRecipeSuggestions();
        
        if (localSuggestions.length > 0) {
            displayLocalSuggestions(localSuggestions);
            showNotification('Suggestions locales disponibles 📍', 'info');
        } else {
            gridContainer.innerHTML = `
                <div class="error-suggestions">
                    <div class="error-icon">⚠️</div>
                    <h4>Problème de connexion</h4>
                    <p>Impossible de chercher des suggestions pour le moment</p>
                    <button class="retry-btn" onclick="autoSuggestRecipes()">🔄 Réessayer</button>
                </div>
            `;
        }
    }
}

// Obtenir des suggestions depuis nos recettes locales
function getLocalRecipeSuggestions() {
    return fallbackRecipes.filter(recipe => {
        // Vérifier si la recette contient au moins un des ingrédients sélectionnés
        return selectedIngredients.some(ingredient => 
            recipe.ingredients.some(recipeIngredient => 
                recipeIngredient.toLowerCase().includes(ingredient) || 
                ingredient.includes(recipeIngredient.toLowerCase().split(' ')[0])
            )
        );
    });
}

// Afficher les suggestions locales
function displayLocalSuggestions(recipes) {
    const gridContainer = document.getElementById('frigo-recipes-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = recipes.map(recipe => `
        <article class="recipe-card local-suggestion" data-recipe-id="${recipe.id}" onclick="openRecipeModal(${recipe.id})">
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                <div class="recipe-category">${getCategoryLabel(recipe.category)}</div>
                <div class="local-badge">📍 Suggestion locale</div>
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span class="recipe-time">⏱️ ${recipe.time}</span>
                    <span class="recipe-difficulty ${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                    <span class="recipe-servings">🍽️ ${recipe.servings} pers.</span>
                </div>
            </div>
        </article>
    `).join('');
}

// Vider tous les ingrédients
function clearAllIngredients() {
    selectedIngredients = [];
    selectedIngredientsTranslated = [];
    updateIngredientsDisplay();
    
    // Masquer les résultats
    const resultsContainer = document.getElementById('frigo-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    showNotification('Liste vidée !', 'info');
}

// Mettre à jour l'affichage des ingrédients
function updateIngredientsDisplay() {
    const listContainer = document.getElementById('ingredients-list');
    const actionsContainer = document.querySelector('.ingredients-actions');
    
    if (!listContainer) return;
    
    if (selectedIngredients.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-ingredients">
                <p>👆 Commence par ajouter des ingrédients de ton frigo</p>
            </div>
        `;
        if (actionsContainer) actionsContainer.style.display = 'none';
    } else {
        listContainer.innerHTML = selectedIngredients.map(ingredient => `
            <div class="ingredient-item">
                <span>${ingredient}</span>
                <button class="ingredient-remove" onclick="removeIngredient('${ingredient}')" title="Retirer">×</button>
            </div>
        `).join('');
        
        if (actionsContainer) actionsContainer.style.display = 'flex';
    }
}

// Configurer les écouteurs d'événements pour Mon Frigo
function setupFrigoEventListeners() {
    // Ajout par entrée
    const input = document.getElementById('frigo-ingredient-input');
    const addBtn = document.getElementById('add-ingredient-btn');
    
    if (input && addBtn) {
        // Ajout par clic
        addBtn.onclick = () => addIngredient(input.value);
        
        // Ajout par Entrée
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                addIngredient(input.value);
            }
        };
    }
    
    // Suggestions d'ingrédients
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.onclick = () => {
            const ingredient = chip.getAttribute('data-ingredient');
            addIngredient(ingredient);
        };
    });
    
    // Bouton rechercher
    const searchBtn = document.getElementById('search-by-ingredients-btn');
    if (searchBtn) {
        searchBtn.onclick = searchRecipesByIngredients;
    }
    
    // Bouton vider
    const clearBtn = document.getElementById('clear-ingredients-btn');
    if (clearBtn) {
        clearBtn.onclick = clearAllIngredients;
    }
}

// Rechercher des recettes par ingrédients (via API)
async function searchRecipesByIngredients() {
    if (selectedIngredients.length === 0) {
        showNotification('Ajoute au moins un ingrédient !', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('frigo-results');
    const gridContainer = document.getElementById('frigo-recipes-grid');
    
    if (!resultsContainer || !gridContainer) return;
    
    // Afficher le loader
    resultsContainer.style.display = 'block';
    gridContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <h3>🔍 Recherche en cours...</h3>
            <p>Nous cherchons les meilleures recettes avec tes ingrédients</p>
        </div>
    `;
    
    try {
        // Utiliser l'API pour chercher des recettes
        const ingredientsQuery = (selectedIngredientsTranslated.length ? selectedIngredientsTranslated.join(',') : selectedIngredients.join(','));
        console.log(`🔍 Recherche API avec ingrédients: ${ingredientsQuery}`);
        
        const recipes = await searchRecipesByIngredientsAPI(ingredientsQuery);
        
        if (recipes && recipes.length > 0) {
            displayFrigoRecipes(recipes);
            showNotification(`${recipes.length} recettes trouvées !`, 'success');
        } else {
            gridContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">😅</div>
                    <h3>Aucune recette trouvée</h3>
                    <p>Essaye d'ajouter d'autres ingrédients ou vérifie l'orthographe</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur recherche par ingrédients:', error);
        gridContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">⚠️</div>
                <h3>Erreur de connexion</h3>
                <p>Impossible de chercher des recettes pour le moment</p>
                <button class="retry-btn" onclick="searchRecipesByIngredients()">Réessayer</button>
            </div>
        `;
    }
}

// Recherche Multi-Ingrédients avec TheMealDB (approximation)
async function searchRecipesByIngredientsAPI(ingredients, maxResults = 12) {
    console.log('🔎 Recherche multi-ingrédients (TheMealDB):', ingredients);

    const ingredientsList = ingredients.toLowerCase().split(',').map(ing => ing.trim()).filter(Boolean);

    if (ingredientsList.length === 0) return [];

    try {
        setLoadingState(true);

        // TheMealDB filter endpoint supports filtering by a single ingredient. Use the first ingredient to get candidates.
        const firstIng = ingredientsList[0];
        const data = await makeAPICall(API_CONFIG.endpoints.searchByIngredient, { i: firstIng });

        if (!data || !data.meals) {
            console.log('❌ Aucun résultat TheMealDB pour:', firstIng);
            return [];
        }

        const candidates = data.meals.slice(0, maxResults * 3);
        const detailedRecipes = [];

        for (let item of candidates) {
            try {
                const details = await getRecipeDetails(item.idMeal);
                if (!details) continue;

                const recipeIngredients = (details.ingredients || []).map(i => i.toLowerCase());

                const matchScore = calculateIngredientMatch(ingredientsList, recipeIngredients);
                const bestScore = matchScore;

                if (bestScore.totalMatches > 0) {
                    detailedRecipes.push({
                        id: details.id,
                        name: details.name,
                        category: details.category || 'Plat',
                        difficulty: details.difficulty || getDifficultyFromIngredientCount(recipeIngredients.length),
                        time: details.time || estimateTimeFromIngredients(recipeIngredients.length),
                        servings: details.servings || 4,
                        image: details.image || item.strMealThumb || '',
                        description: details.description ? details.description.substring(0,150) + '...' : '',
                        ingredients: details.ingredients,
                        instructions: details.instructions,
                        matchScore: bestScore,
                        usedIngredientCount: bestScore.totalMatches,
                        missedIngredientCount: Math.max(0, ingredientsList.length - bestScore.totalMatches),
                        totalIngredients: recipeIngredients.length,
                        wasteReduction: Math.round((bestScore.totalMatches / ingredientsList.length) * 100)
                    });
                }

            } catch (err) {
                console.warn('Erreur récupération détails TheMealDB:', err);
            }
        }

        // Tri intelligent Anti-Gaspi
        detailedRecipes.sort((a, b) => {
            if (a.usedIngredientCount !== b.usedIngredientCount) return b.usedIngredientCount - a.usedIngredientCount;
            if (a.missedIngredientCount !== b.missedIngredientCount) return a.missedIngredientCount - b.missedIngredientCount;
            return a.totalIngredients - b.totalIngredients;
        });

        console.log('🍽️ Recettes filtrées et triées (TheMealDB):', detailedRecipes.length);
        return detailedRecipes.slice(0, maxResults);

    } catch (error) {
        console.error('❌ Error searchRecipesByIngredientsAPI (TheMealDB):', error);
        return [];
    } finally {
        setLoadingState(false);
    }
}
}

// Extraire les ingrédients d'une recette TheMealDB
function extractMealIngredients(meal) {
    const ingredients = [];
    
    // TheMealDB stocke les ingrédients dans strIngredient1, strIngredient2, etc.
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            const fullIngredient = measure ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim();
            ingredients.push(fullIngredient);
        }
    }
    
    return ingredients;
}

// Calculer la correspondance entre ingrédients demandés et ingrédients de la recette
function calculateIngredientMatch(userIngredients, recipeIngredients) {
    let exactMatches = 0;
    let partialMatches = 0;
    const matchedIngredients = [];
    
    userIngredients.forEach(userIng => {
        let found = false;
        
        recipeIngredients.forEach(recipeIng => {
            const recipeLower = recipeIng.toLowerCase();
            
            // Correspondance exacte
            if (recipeLower.includes(userIng)) {
                if (!found) {
                    exactMatches++;
                    matchedIngredients.push(userIng);
                    found = true;
                }
            }
            // Correspondance partielle (synonymes basiques)
            else if (!found && checkIngredientSynonyms(userIng, recipeLower)) {
                partialMatches++;
                matchedIngredients.push(userIng);
                found = true;
            }
        });
    });
    
    return {
        exactMatches,
        partialMatches,
        totalMatches: exactMatches + partialMatches,
        matchedIngredients,
        matchPercentage: Math.round(((exactMatches + partialMatches) / userIngredients.length) * 100)
    };
}

// 🧪 Fonction de test pour vérifier les traductions (à supprimer en production)
function testTranslations() {
    const testIngredients = ['tomate', 'oignon', 'poulet', 'fromage', 'oeuf'];
    console.log('🧪 Test des traductions:');
    testIngredients.forEach(ingredient => {
        const translation = translateIngredientToEnglish(ingredient);
        console.log(`  ${ingredient} → ${translation}`);
    });
}

// 🌍 Dictionnaire de traduction français → anglais pour l'API TheMealDB
const INGREDIENT_TRANSLATION = {
    // Légumes de base
    'tomate': 'tomato',
    'tomates': 'tomato',
    'oignon': 'onion',
    'oignons': 'onion',
    'ail': 'garlic',
    'carotte': 'carrot',
    'carottes': 'carrot',
    'pomme de terre': 'potato',
    'pommes de terre': 'potato',
    'patate': 'potato',
    'courgette': 'zucchini',
    'courgettes': 'zucchini',
    'aubergine': 'eggplant',
    'aubergines': 'eggplant',
    'champignon': 'mushroom',
    'champignons': 'mushroom',
    'poivron': 'pepper',
    'poivrons': 'pepper',
    'salade': 'lettuce',
    'épinard': 'spinach',
    'épinards': 'spinach',
    'brocoli': 'broccoli',
    'chou': 'cabbage',
    'concombre': 'cucumber',
    
    // Protéines
    'poulet': 'chicken',
    'boeuf': 'beef',
    'porc': 'pork',
    'agneau': 'lamb',
    'poisson': 'fish',
    'saumon': 'salmon',
    'thon': 'tuna',
    'crevette': 'shrimp',
    'crevettes': 'shrimp',
    'oeuf': 'egg',
    'oeufs': 'egg',
    
    // Produits laitiers
    'lait': 'milk',
    'fromage': 'cheese',
    'beurre': 'butter',
    'crème': 'cream',
    'yaourt': 'yogurt',
    'mozzarella': 'mozzarella',
    'parmesan': 'parmesan',
    
    // Féculents
    'riz': 'rice',
    'pâte': 'pasta',
    'pâtes': 'pasta',
    'pain': 'bread',
    'farine': 'flour',
    'quinoa': 'quinoa',
    
    // Fruits
    'pomme': 'apple',
    'pommes': 'apple',
    'banane': 'banana',
    'bananes': 'banana',
    'orange': 'orange',
    'oranges': 'orange',
    'citron': 'lemon',
    'citrons': 'lemon',
    'avocat': 'avocado',
    'avocats': 'avocado',
    
    // Herbes et épices
    'basilic': 'basil',
    'persil': 'parsley',
    'thym': 'thyme',
    'origan': 'oregano',
    'romarin': 'rosemary',
    'coriandre': 'cilantro',
    'menthe': 'mint',
    
    // Autres
    'huile': 'oil',
    "huile d'olive": 'olive oil',
    'vinaigre': 'vinegar',
    'sel': 'salt',
    'poivre': 'pepper',
    'sucre': 'sugar'
};

// Fonction pour traduire un ingrédient français en anglais
function translateIngredientToEnglish(frenchIngredient) {
    const normalizedInput = frenchIngredient.toLowerCase().trim();
    
    // Recherche exacte
    if (INGREDIENT_TRANSLATION[normalizedInput]) {
        return INGREDIENT_TRANSLATION[normalizedInput];
    }
    
    // Recherche partielle (pour gérer les pluriels et variations)
    for (const [french, english] of Object.entries(INGREDIENT_TRANSLATION)) {
        if (normalizedInput.includes(french) || french.includes(normalizedInput)) {
            return english;
        }
    }
    
    // Si pas de traduction trouvée, retourner l'original (pour les mots déjà en anglais)
    return normalizedInput;
}

// Vérifier les synonymes d'ingrédients (version basique)
function checkIngredientSynonyms(userIngredient, recipeIngredient) {
    const synonyms = {
        'tomate': ['tomato', 'tomatoes'],
        'oignon': ['onion', 'onions'],
        'oeuf': ['egg', 'eggs'],
        'oeufs': ['egg', 'eggs'],
        'fromage': ['cheese', 'cheddar', 'mozzarella'],
        'pâtes': ['pasta', 'spaghetti', 'noodles'],
        'pomme de terre': ['potato', 'potatoes'],
        'pommes de terre': ['potato', 'potatoes']
    };
    
    const userSynonyms = synonyms[userIngredient] || [];
    return userSynonyms.some(synonym => recipeIngredient.includes(synonym));
}

// 🎯 Indicateur de complexité basé sur le nombre d'ingrédients
function getDifficultyFromIngredientCount(ingredientCount) {
    if (ingredientCount <= 5) return "⚡ Super Rapide";
    if (ingredientCount <= 10) return "🕒 Moyen";
    return "👨‍🍳 Élaboré";
}

// Estimer le temps de cuisson basé sur le nombre d'ingrédients
function estimateTimeFromIngredients(ingredientCount) {
    if (ingredientCount <= 5) return "15-20 min";
    if (ingredientCount <= 10) return "25-40 min";
    return "45+ min";
}

// 🎯 Afficher les recettes trouvées dans Mon Frigo avec indicateurs Anti-Gaspi
function displayFrigoRecipes(recipes) {
    const gridContainer = document.getElementById('frigo-recipes-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = recipes.map((recipe, index) => {
        // Déterminer la couleur du badge selon le score Anti-Gaspi
        let badgeClass = 'waste-reduction-low';
        let badgeIcon = '🟡';
        
        if (recipe.wasteReduction >= 80) {
            badgeClass = 'waste-reduction-high';
            badgeIcon = '🏆';
        } else if (recipe.wasteReduction >= 50) {
            badgeClass = 'waste-reduction-medium';
            badgeIcon = '🟢';
        }
        
        return `
            <article class="recipe-card anti-gaspi-card" data-recipe-id="${recipe.id}" onclick="openRecipeModal('${recipe.id}')">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.name}" loading="lazy" 
                         onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format';">
                    
                    <!-- Badge Anti-Gaspi -->
                    <div class="anti-gaspi-badge ${badgeClass}">
                        ${badgeIcon} ${recipe.wasteReduction}%
                    </div>
                    
                    <!-- Indicateur de correspondance -->
                    ${recipe.usedIngredientCount ? `
                        <div class="ingredient-match">
                            ✅ ${recipe.usedIngredientCount}/${selectedIngredients.length} ingrédients
                        </div>
                    ` : ''}
                    
                    <!-- Indicateur de complexité -->
                    <div class="complexity-badge ${recipe.difficulty.includes('⚡') ? 'quick' : recipe.difficulty.includes('🕒') ? 'medium' : 'complex'}">
                        ${recipe.difficulty}
                    </div>
                </div>
                
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <p class="recipe-description">${recipe.description}</p>
                    
                    <!-- Informations Anti-Gaspi détaillées -->
                    <div class="anti-gaspi-details">
                        <div class="gaspi-stat">
                            <span class="gaspi-label">Tes ingrédients utilisés:</span>
                            <span class="gaspi-value">${recipe.usedIngredientCount}/${selectedIngredients.length}</span>
                        </div>
                        ${recipe.missedIngredientCount > 0 ? `
                            <div class="gaspi-stat missing">
                                <span class="gaspi-label">Ingrédients à acheter:</span>
                                <span class="gaspi-value">+${recipe.missedIngredientCount}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="recipe-meta">
                        <span class="recipe-time">⏱️ ${recipe.time}</span>
                        <span class="recipe-category">${getCategoryLabel(recipe.category)}</span>
                        <span class="recipe-ingredients-count">📝 ${recipe.totalIngredients} ingrédients</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ========================================
// NOTIFICATIONS SYSTÈME
// ========================================

// Afficher une notification
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Afficher avec animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Masquer automatiquement après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Fermer manuellement
    notification.querySelector('.notification-close').onclick = () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    };
}

// Obtenir l'icône selon le type de notification
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle', 
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// Configuration des écouteurs d'événements
function initializeEventListeners() {
    // Navigation entre sections
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });
    
    // Recherche en temps réel (seulement sur la page d'accueil)
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filtres par catégorie (seulement sur la page d'accueil)
    const categoryChips = document.querySelectorAll('.chip');
    categoryChips.forEach(chip => {
        chip.addEventListener('click', handleCategoryFilter);
    });
    
    // Bouton de filtre avancé
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleAdvancedFilters);
    }
    
    // Initialiser la section d'accueil par défaut
    switchSection('home');
}

// ========================================
// FONCTIONS DE RECHERCHE ET FILTRAGE
// ========================================

// Gestion de la recherche avec API
async function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log('🔍 Recherche API:', searchTerm);
    
    currentSearchTerm = searchTerm;
    
    // Si pas de terme de recherche, charger les recettes par défaut
    if (!searchTerm) {
        if (currentCategory === 'all') {
            await loadInitialRecipes();
        } else {
            await handleCategoryFilter(null, currentCategory);
        }
        return;
    }
    
    try {
        // Rechercher avec l'API
        const recipes = await searchRecipes(searchTerm, currentCategory === 'all' ? '' : currentCategory, 12);
        currentRecipes = recipes;
        
        renderRecipes(currentRecipes);
        updateRecipeCount(currentRecipes.length);
        
    } catch (error) {
        console.error('❌ Erreur recherche:', error);
        showNotification('Erreur lors de la recherche', 'error');
    }
}

// Gestion des filtres par catégorie avec API
async function handleCategoryFilter(event, categoryOverride = null) {
    const category = categoryOverride || (event ? event.currentTarget.dataset.category : 'all');
    
    console.log('🏷️ Filtre catégorie API:', category);
    
    // Mettre à jour l'UI des puces
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (event) {
        event.currentTarget.classList.add('active');
    } else {
        // Trouver et activer la bonne puce
        const targetChip = document.querySelector(`[data-category="${category}"]`);
        if (targetChip) {
            targetChip.classList.add('active');
        }
    }
    
    currentCategory = category;
    
    try {
        let recipes;
        
        if (currentSearchTerm) {
            // Si on a un terme de recherche, l'appliquer avec le filtre
            recipes = await searchRecipes(currentSearchTerm, category === 'all' ? '' : category, 12);
        } else {
            // Sinon charger des recettes par catégorie
            if (category === 'all') {
                recipes = await loadRandomRecipes(12);
            } else {
                // Rechercher par type de plat
                const categoryQuery = getCategoryQuery(category);
                recipes = await searchRecipes(categoryQuery, category, 12);
            }
        }
        
        currentRecipes = recipes;
        renderRecipes(currentRecipes);
        updateRecipeCount(currentRecipes.length);
        
    } catch (error) {
        console.error('❌ Erreur filtre:', error);
        showNotification('Erreur lors du filtrage', 'error');
    }
}

// Convertir nos catégories vers les termes de recherche API
function getCategoryQuery(category) {
    const queries = {
        'entrees': 'appetizer salad starter',
        'plats': 'main course dinner lunch',
        'desserts': 'dessert sweet cake'
    };
    return queries[category] || '';
}

// Basculer les filtres avancés (placeholder)
function toggleAdvancedFilters() {
    console.log('🔧 Filtres avancés (à implémenter)');
    // Ici on pourrait ajouter des filtres par difficulté, temps, etc.
}

// ========================================
// FONCTIONS D'AFFICHAGE
// ========================================

// Rendu des recettes
function renderRecipes(recipes) {
    const recipesGrid = document.querySelector('.recipes-grid');
    
    if (!recipesGrid) {
        console.error('❌ Element .recipes-grid non trouvé');
        return;
    }
    
    if (recipes.length === 0) {
        recipesGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>Aucune recette trouvée</h3>
                <p>Essayez d'autres mots-clés ou changez les filtres</p>
            </div>
        `;
        return;
    }
    
    const recipesHTML = recipes.map(recipe => `
        <article class="recipe-card" data-recipe-id="${recipe.id}" onclick="openRecipeModal(${recipe.id})">
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format'; console.log('Image failed to load:', '${recipe.image}');">
                <div class="recipe-category">${getCategoryLabel(recipe.category)}</div>
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span class="recipe-time">
                        <i class="fas fa-clock"></i> ${recipe.time}
                    </span>
                    <span class="recipe-difficulty ${recipe.difficulty.toLowerCase()}">
                        <i class="fas fa-signal"></i> ${recipe.difficulty}
                    </span>
                    <span class="recipe-servings">
                        <i class="fas fa-users"></i> ${recipe.servings}
                    </span>
                </div>
            </div>
            <div class="recipe-overlay">
                <button class="view-recipe-btn">
                    <i class="fas fa-eye"></i>
                    Voir la recette
                </button>
            </div>
        </article>
    `).join('');
    
    recipesGrid.innerHTML = recipesHTML;
    
    // Ajouter l'animation d'entrée
    setTimeout(() => {
        document.querySelectorAll('.recipe-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 50);
}

// Mettre à jour le compteur de recettes
function updateRecipeCount(count) {
    const subtitle = document.querySelector('.page-subtitle');
    if (subtitle) {
        if (count === 0) {
            if (currentSearchTerm) {
                subtitle.textContent = `Aucun résultat pour "${currentSearchTerm}"`;
            } else {
                subtitle.textContent = 'Aucune recette trouvée';
            }
        } else if (count === 1) {
            subtitle.textContent = '1 recette trouvée';
        } else {
            if (currentSearchTerm) {
                subtitle.textContent = `${count} recettes trouvées pour "${currentSearchTerm}"`;
            } else {
                subtitle.textContent = `${count} délicieuses recettes à découvrir`;
            }
        }
    }
}

// Obtenir le label de catégorie
function getCategoryLabel(category) {
    const labels = {
        'entrees': 'Entrées',
        'plats': 'Plats',
        'desserts': 'Desserts'
    };
    return labels[category] || category;
}

// ========================================
// FONCTIONS DU MODAL AVEC API
// ========================================

// Ouvrir le modal avec les détails de la recette depuis l'API
async function openRecipeModal(recipeId) {
    try {
        // Afficher un loading dans le modal
        showModalLoading();
        
        // Récupérer les détails depuis l'API ou fallback
        let recipe = await getRecipeDetails(recipeId);
        
        // Si pas de détails API, utiliser les données locales
        if (!recipe) {
            recipe = fallbackRecipes.find(r => r.id === recipeId);
        }
        
        if (!recipe) {
            console.error('❌ Recette non trouvée:', recipeId);
            showNotification('Impossible de charger les détails de la recette', 'error');
            closeRecipeModal();
            return;
        }
        
        console.log('📖 Ouverture recette API:', recipe.name);
        
        // Créer le contenu du modal avec les données API
        const modalHTML = `
            <div class="modal" id="recipeModal">
                <div class="modal-overlay" onclick="closeRecipeModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${recipe.name}</h2>
                        <button class="modal-close" onclick="closeRecipeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="recipe-details">
                            <div class="recipe-image-large">
                                <img src="${recipe.image}" alt="${recipe.name}" 
                                     onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format'; console.log('Modal image failed to load:', '${recipe.image}');">
                                <div class="recipe-meta-overlay">
                                    <span class="recipe-category-large">${getCategoryLabel(recipe.category)}</span>
                                    <div class="recipe-stats">
                                        <span><i class="fas fa-clock"></i> ${recipe.time}</span>
                                        <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                                        <span><i class="fas fa-users"></i> ${recipe.servings} personnes</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="recipe-info">
                                <div class="recipe-description-large">
                                    <p>${recipe.description}</p>
                                </div>
                                
                                <div class="recipe-ingredients">
                                    <h3><i class="fas fa-list-ul"></i> Ingrédients</h3>
                                    ${recipe.ingredients && recipe.ingredients.length > 0 ? `
                                        <ul class="ingredients-list">
                                            ${recipe.ingredients.map(ingredient => 
                                                `<li><i class="fas fa-check"></i> ${ingredient}</li>`
                                            ).join('')}
                                        </ul>
                                    ` : '<p class="no-data">Ingrédients non disponibles</p>'}
                                </div>
                                
                                <div class="recipe-instructions">
                                    <h3><i class="fas fa-utensils"></i> Préparation</h3>
                                    ${recipe.instructions && recipe.instructions.length > 0 ? `
                                        <ol class="instructions-list">
                                            ${recipe.instructions.map((instruction, index) => 
                                                `<li>
                                                    <span class="step-number">${index + 1}</span>
                                                    <span class="step-text">${instruction}</span>
                                                </li>`
                                            ).join('')}
                                        </ol>
                                    ` : '<p class="no-data">Instructions non disponibles</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeRecipeModal()">
                            <i class="fas fa-times"></i> Fermer
                        </button>
                        <button class="btn-primary" onclick="addToFavorites(${recipe.id})">
                            <i class="fas fa-heart"></i> Ajouter aux favoris
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Supprimer le modal existant s'il y en a un
        const existingModal = document.getElementById('recipeModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Ajouter le modal au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Afficher le modal avec animation
        const modal = document.getElementById('recipeModal');
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Erreur ouverture modal:', error);
        showNotification('Erreur lors de l\'ouverture de la recette', 'error');
        closeRecipeModal();
    }
}

// Afficher un loading dans le modal
function showModalLoading() {
    const modalHTML = `
        <div class="modal" id="recipeModal">
            <div class="modal-overlay" onclick="closeRecipeModal()"></div>
            <div class="modal-content">
                <div class="modal-body">
                    <div class="modal-loading">
                        <div class="loading-spinner"></div>
                        <h3>Chargement de la recette...</h3>
                        <p>Récupération des détails depuis notre base culinaire</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer le modal existant
    const existingModal = document.getElementById('recipeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter le modal de loading
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher immédiatement
    const modal = document.getElementById('recipeModal');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
}

// Fermer le modal
function closeRecipeModal() {
    const modal = document.getElementById('recipeModal');
    
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.remove();
            // Restaurer le scroll du body
            document.body.style.overflow = '';
        }, 300);
    }
}

// Ajouter aux favoris (avec localStorage)
function addToFavorites(recipeId) {
    try {
        // Récupérer les favoris existants
        let favorites = JSON.parse(localStorage.getItem('patoketchup_favorites') || '[]');
        
        // Vérifier si déjà dans les favoris
        if (favorites.includes(recipeId)) {
            showNotification('Cette recette est déjà dans vos favoris !', 'info');
            return;
        }
        
        // Ajouter aux favoris
        favorites.push(recipeId);
        localStorage.setItem('patoketchup_favorites', JSON.stringify(favorites));
        
        // Trouver le nom de la recette
        const recipe = currentRecipes.find(r => r.id === recipeId);
        const recipeName = recipe ? recipe.name : 'Recette';
        
        showNotification(`${recipeName} ajoutée aux favoris !`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur favoris:', error);
        showNotification('Erreur lors de l\'ajout aux favoris', 'error');
    }
}

// Afficher une notification améliorée
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconClass = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle',
        'warning': 'exclamation-triangle'
    }[type] || 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Suppression automatique
    const autoRemoveTimeout = setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, type === 'error' ? 5000 : 3000); // Erreurs restent plus longtemps
    
    // Permettre la fermeture manuelle
    notification.addEventListener('click', () => {
        clearTimeout(autoRemoveTimeout);
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    });
}

// Fermer le modal avec la touche Échap
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRecipeModal();
    }
});

// --- Supabase helper functions (auth + fridge persistence) ---

async function _getCurrentUser() {
    if (!supabaseClient) return null;
    try {
        if (supabaseClient.auth && supabaseClient.auth.getUser) {
            const { data } = await supabaseClient.auth.getUser();
            return data ? data.user : null;
        }
        // Fallback older API
        if (supabaseClient.auth && supabaseClient.auth.user) {
            return supabaseClient.auth.user();
        }
    } catch (err) {
        console.warn('Erreur getCurrentUser:', err);
    }
    return null;
}

async function supabaseSignUp(email, password) {
    if (!supabaseClient) { showNotification('Supabase non configuré', 'error'); return; }
    try {
        const method = supabaseClient.auth.signUp ? 'v1' : 'v2';
        if (method === 'v2') {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            showNotification('Inscription réussie — vérifie ton email', 'success');
        } else {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            showNotification('Inscription réussie — vérifie ton email', 'success');
        }
    } catch (err) {
        console.error('SignUp error:', err);
        showNotification('Erreur inscription', 'error');
    }
}

async function supabaseSignIn(email, password) {
    if (!supabaseClient) { showNotification('Supabase non configuré', 'error'); return; }
    try {
        // v2 method
        if (supabaseClient.auth.signInWithPassword) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient.auth.signIn({ email, password });
            if (error) throw error;
        }

        showNotification('Connecté avec succès', 'success');
        // mettre à jour UI
        const signoutBtn = document.getElementById('signout-btn');
        if (signoutBtn) signoutBtn.style.display = 'block';
        await loadFridgeForUser();
    } catch (err) {
        console.error('SignIn error:', err);
        showNotification('Erreur connexion', 'error');
    }
}

async function supabaseSignOut() {
    if (!supabaseClient) { showNotification('Supabase non configuré', 'error'); return; }
    try {
        await supabaseClient.auth.signOut();
        selectedIngredients = [];
        selectedIngredientsTranslated = [];
        updateIngredientsDisplay();
        showNotification('Déconnecté', 'info');
        const signoutBtn = document.getElementById('signout-btn');
        if (signoutBtn) signoutBtn.style.display = 'none';
    } catch (err) {
        console.error('SignOut error:', err);
        showNotification('Erreur déconnexion', 'error');
    }
}

async function loadFridgeForUser() {
    if (!supabaseClient) return;
    const user = await _getCurrentUser();
    if (!user) return;

    try {
        const { data, error } = await supabaseClient.from('fridges').select('*').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') {
            console.warn('Erreur fetch fridge:', error);
            return;
        }
        if (data) {
            // data.ingredients attendu comme array de strings ou array d'objets {name_fr}
            const ing = Array.isArray(data.ingredients) ? data.ingredients : [];
            selectedIngredients = ing.map(i => (typeof i === 'string' ? i : (i.name_fr || i.name || ''))).filter(Boolean);
            selectedIngredientsTranslated = selectedIngredients.map(t => translateIngredientToEnglish(t));
            updateIngredientsDisplay();
            autoSuggestRecipes();
            showNotification('Frigo chargé', 'success');
        }
    } catch (err) {
        console.error('loadFridge error:', err);
    }
}

async function saveFridgeForUser() {
    if (!supabaseClient) return;
    const user = await _getCurrentUser();
    if (!user) { showNotification('Connecte-toi pour sauvegarder ton frigo', 'warning'); return; }

    try {
        // Enregistrer uniquement les noms français pour affichage
        const payload = { user_id: user.id, ingredients: selectedIngredients };
        const { data, error } = await supabaseClient.from('fridges').upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        showNotification('Frigo sauvegardé', 'success');
    } catch (err) {
        console.error('saveFridge error:', err);
        showNotification('Erreur sauvegarde frigo', 'error');
    }
}

console.log('🍅 Script PatOketchup avec API chargé !');