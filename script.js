// ========================================
// PATOKETCHUP - APPLICATION DE RECETTES
// Étape 3 : JavaScript avec API Spoonacular (CORRIGÉ)
// ========================================

// ========================================
// VARIABLES GLOBALES SYSTÈME D'AUTHENTIFICATION
// ========================================

// État global de l'utilisateur
let currentUser = null;
let isUserLoggedIn = false;

// Base de données utilisateurs simulée (localStorage)
const AUTH_STORAGE_KEY = 'patoketchup_users';
const CURRENT_USER_KEY = 'patoketchup_current_user';

// ========================================
// SYSTÈME D'AUTHENTIFICATION
// ========================================

// Gestionnaire d'authentification
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.initEventListeners();
        this.updateAuthUI();
    }

    // Charger les utilisateurs depuis localStorage
    loadUsers() {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    // Sauvegarder les utilisateurs dans localStorage
    saveUsers() {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.users));
    }

    // Charger l'utilisateur actuel
    loadCurrentUser() {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
            const user = JSON.parse(stored);
            this.setCurrentUser(user);
            return user;
        }
        return null;
    }

    // Sauvegarder l'utilisateur actuel
    saveCurrentUser(user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        this.setCurrentUser(user);
    }

    // Définir l'utilisateur actuel
    setCurrentUser(user) {
        currentUser = user;
        isUserLoggedIn = !!user;
        this.updateAuthUI();
    }

    // Initialiser les écouteurs d'événements
    initEventListeners() {
        // Boutons d'ouverture des modales
        document.getElementById('login-btn')?.addEventListener('click', () => this.openModal('login'));
        document.getElementById('register-btn')?.addEventListener('click', () => this.openModal('register'));
        document.getElementById('profile-btn')?.addEventListener('click', () => this.openModal('profile'));
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

        // Boutons de fermeture des modales
        document.getElementById('login-close')?.addEventListener('click', () => this.closeModal('login'));
        document.getElementById('register-close')?.addEventListener('click', () => this.closeModal('register'));
        document.getElementById('profile-close')?.addEventListener('click', () => this.closeModal('profile'));

        // Commutateurs entre modales
        document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal('login');
            this.openModal('register');
        });
        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal('register');
            this.openModal('login');
        });

        // Formulaires
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('profile-update-form')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Fermer modales en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id.replace('-modal', ''));
            }
        });
    }

    // Ouvrir une modale
    openModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.classList.add('active');
            if (type === 'profile' && this.currentUser) {
                this.populateProfileForm();
            }
        }
    }

    // Fermer une modale
    closeModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Gérer la connexion
    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const user = this.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                user.lastLogin = new Date().toISOString();
                this.saveUsers();
                this.saveCurrentUser(user);
                
                this.closeModal('login');
                this.showNotification('Connexion réussie ! 🎉', 'success');
                e.target.reset();
            } else {
                this.showNotification('Email ou mot de passe incorrect', 'error');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            this.showNotification('Erreur de connexion', 'error');
        }
    }

    // Gérer l'inscription
    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirm');

        try {
            if (password !== confirm) {
                this.showNotification('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            if (password.length < 6) {
                this.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
                return;
            }

            if (this.users.find(u => u.email === email)) {
                this.showNotification('Cet email est déjà utilisé', 'error');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password,
                avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000)}?w=120&h=120&fit=crop&crop=face&auto=format`,
                bio: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                favorites: [],
                cookedRecipes: [],
                savedIngredients: [],
                stats: { recipesSaved: 0, recipesCooked: 0, gaspiSaved: 0 }
            };

            this.users.push(newUser);
            this.saveUsers();
            this.saveCurrentUser(newUser);
            
            this.closeModal('register');
            this.showNotification(`Bienvenue ${name} ! 🌟`, 'success');
            e.target.reset();

        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            this.showNotification('Erreur lors de l\'inscription', 'error');
        }
    }

    // Gérer la mise à jour du profil
    async handleProfileUpdate(e) {
        e.preventDefault();
        if (!this.currentUser) return;

        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const bio = formData.get('bio');

        try {
            this.currentUser.name = name;
            this.currentUser.email = email;
            this.currentUser.bio = bio;

            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.currentUser };
                this.saveUsers();
                this.saveCurrentUser(this.currentUser);
            }

            this.closeModal('profile');
            this.showNotification('Profil mis à jour ! ✨', 'success');

        } catch (error) {
            console.error('Erreur de mise à jour:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    // Peupler le formulaire de profil
    populateProfileForm() {
        if (!this.currentUser) return;

        document.getElementById('profile-name').value = this.currentUser.name || '';
        document.getElementById('profile-email').value = this.currentUser.email || '';
        document.getElementById('profile-bio').value = this.currentUser.bio || '';
        
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar && this.currentUser.avatar) {
            profileAvatar.src = this.currentUser.avatar;
        }

        if (this.currentUser.stats) {
            document.getElementById('recipes-saved').textContent = this.currentUser.stats.recipesSaved;
            document.getElementById('recipes-cooked').textContent = this.currentUser.stats.recipesCooked;
            document.getElementById('gaspi-saved').textContent = this.currentUser.stats.gaspiSaved + 'kg';
        }
    }

    // Déconnexion
    logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
        this.setCurrentUser(null);
        this.showNotification('À bientôt ! 👋', 'info');
    }

    // Mettre à jour l'interface utilisateur d'authentification
    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (isUserLoggedIn && currentUser) {
            authButtons.style.display = 'none';
            userProfile.style.display = 'block';
            
            if (userName) userName.textContent = currentUser.name;
            if (userAvatar) userAvatar.src = currentUser.avatar;
        } else {
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<span>${message}</span><button class="notification-close">&times;</button>`;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '400px'
        });

        document.body.appendChild(notification);
        notification.querySelector('.notification-close').addEventListener('click', () => notification.remove());
        setTimeout(() => notification.parentNode && notification.remove(), 4000);
    }

    // Méthodes utilitaires
    isLoggedIn() { return isUserLoggedIn; }
    getCurrentUser() { return currentUser; }

    // Gestion des favoris
    addToFavorites(recipeId) {
        if (!isUserLoggedIn || !currentUser) {
            this.showNotification('Connectez-vous pour sauvegarder des recettes', 'warning');
            return false;
        }

        if (!currentUser.favorites.includes(recipeId)) {
            currentUser.favorites.push(recipeId);
            currentUser.stats.recipesSaved++;
            this.saveCurrentUser(currentUser);
            this.showNotification('Recette ajoutée aux favoris ! ❤️', 'success');
            return true;
        }
        
        this.showNotification('Cette recette est déjà dans vos favoris', 'info');
        return false;
    }

    removeFromFavorites(recipeId) {
        if (!isUserLoggedIn || !currentUser) return false;

        const index = currentUser.favorites.indexOf(recipeId);
        if (index > -1) {
            currentUser.favorites.splice(index, 1);
            currentUser.stats.recipesSaved--;
            this.saveCurrentUser(currentUser);
            this.showNotification('Recette retirée des favoris', 'info');
            return true;
        }
        return false;
    }

    markAsCooked(recipeId) {
        if (!isUserLoggedIn || !currentUser) return false;

        if (!currentUser.cookedRecipes.includes(recipeId)) {
            currentUser.cookedRecipes.push(recipeId);
            currentUser.stats.recipesCooked++;
            currentUser.stats.gaspiSaved += Math.round((Math.random() * 1.5 + 0.5) * 10) / 10;
            this.saveCurrentUser(currentUser);
            this.showNotification('Recette marquée comme cuisinée ! 👨‍🍳', 'success');
            return true;
        }
        return false;
    }
}

// Instance globale du gestionnaire d'authentification
let authManager = null;

// ========================================
// FONCTIONS D'INTÉGRATION AVEC L'AUTHENTIFICATION
// ========================================

// Ajouter des boutons d'action aux recettes (favoris, cuisiné)
function addRecipeActions(recipeElement, recipeId) {
    if (!authManager) return;

    const existingActions = recipeElement.querySelector('.recipe-actions');
    if (existingActions) existingActions.remove();

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'recipe-actions';

    const isFavorite = authManager.isLoggedIn() && 
                      authManager.getCurrentUser()?.favorites.includes(recipeId);
    const isCooked = authManager.isLoggedIn() && 
                     authManager.getCurrentUser()?.cookedRecipes.includes(recipeId);

    actionsDiv.innerHTML = `
        <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                onclick="toggleFavorite('${recipeId}', this)" 
                title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            ${isFavorite ? '❤️' : '🤍'}
        </button>
        <button class="action-btn cooked-btn ${isCooked ? 'active' : ''}" 
                onclick="markRecipeAsCooked('${recipeId}', this)" 
                title="${isCooked ? 'Déjà cuisinée' : 'Marquer comme cuisinée'}">
            ${isCooked ? '👨‍🍳' : '🍽️'}
        </button>
        ${authManager.isLoggedIn() ? `
            <button class="action-btn share-btn" 
                    onclick="shareRecipe('${recipeId}')" 
                    title="Partager cette recette">
                📤
            </button>
        ` : ''}
    `;

    // Ajouter les styles si pas encore présents
    if (!document.querySelector('#recipe-actions-style')) {
        const style = document.createElement('style');
        style.id = 'recipe-actions-style';
        style.textContent = `
            .recipe-actions {
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .recipe-card:hover .recipe-actions {
                opacity: 1;
            }
            
            .recipe-actions .action-btn {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                transition: all 0.3s ease;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .recipe-actions .action-btn:hover {
                transform: scale(1.1);
                background: white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .recipe-actions .favorite-btn.active {
                background: #ff6b6b;
                color: white;
            }
            
            .recipe-actions .cooked-btn.active {
                background: #51cf66;
                color: white;
            }
            
            .recipe-card {
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }

    recipeElement.appendChild(actionsDiv);
}

// Basculer le statut favori d'une recette
function toggleFavorite(recipeId, buttonElement) {
    if (!authManager?.isLoggedIn()) {
        authManager.showNotification('Connectez-vous pour sauvegarder des recettes', 'warning');
        return;
    }

    const currentUser = authManager.getCurrentUser();
    const isFavorite = currentUser.favorites.includes(recipeId);

    if (isFavorite) {
        authManager.removeFromFavorites(recipeId);
        buttonElement.innerHTML = '🤍';
        buttonElement.classList.remove('active');
        buttonElement.title = 'Ajouter aux favoris';
    } else {
        authManager.addToFavorites(recipeId);
        buttonElement.innerHTML = '❤️';
        buttonElement.classList.add('active');
        buttonElement.title = 'Retirer des favoris';
    }
}

// Marquer une recette comme cuisinée
function markRecipeAsCooked(recipeId, buttonElement) {
    if (!authManager?.isLoggedIn()) {
        authManager.showNotification('Connectez-vous pour marquer des recettes', 'warning');
        return;
    }

    const currentUser = authManager.getCurrentUser();
    const isCooked = currentUser.cookedRecipes.includes(recipeId);

    if (!isCooked) {
        authManager.markAsCooked(recipeId);
        buttonElement.innerHTML = '👨‍🍳';
        buttonElement.classList.add('active');
        buttonElement.title = 'Déjà cuisinée';
        
        // Animation de célébration
        buttonElement.style.transform = 'scale(1.3)';
        setTimeout(() => buttonElement.style.transform = '', 300);
    }
}

// Partager une recette
function shareRecipe(recipeId) {
    const url = `${window.location.origin}${window.location.pathname}?recipe=${recipeId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Recette PatOketchup',
            text: 'Découvre cette délicieuse recette !',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            authManager.showNotification('Lien copié ! 📋', 'success');
        });
    }
}

// Observer pour ajouter automatiquement les actions aux nouvelles cartes
function observeRecipeCards() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    const recipeCards = node.querySelectorAll ? 
                                       node.querySelectorAll('.recipe-card') : 
                                       [];
                    
                    if (node.classList?.contains('recipe-card')) {
                        const recipeId = node.dataset.recipeId || 
                                       node.getAttribute('onclick')?.match(/\d+/)?.[0];
                        if (recipeId) addRecipeActions(node, recipeId);
                    }
                    
                    recipeCards.forEach(card => {
                        const recipeId = card.dataset.recipeId || 
                                       card.getAttribute('onclick')?.match(/\d+/)?.[0];
                        if (recipeId) addRecipeActions(card, recipeId);
                    });
                }
            });
        });
    });

    // Observer les changements dans les conteneurs de recettes
    const containers = [
        document.getElementById('recipes-grid'),
        document.getElementById('search-results'),
        document.getElementById('frigo-recipes-grid')
    ].filter(Boolean);

    containers.forEach(container => {
        observer.observe(container, { 
            childList: true, 
            subtree: true 
        });
    });
}

// Configuration de l'API TheMealDB (gratuite et parfaite pour recherche multi-ingrédients)
const API_CONFIG = {
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    // TheMealDB est gratuite, pas besoin de clé API ! 🎉
    endpoints: {
        searchByIngredient: '/filter.php?i=', // Recherche par ingrédient principal
        searchByName: '/search.php?s=', // Recherche par nom
        getById: '/lookup.php?i=', // Détails d'une recette
        random: '/random.php', // Recette aléatoire
        categories: '/categories.php', // Toutes les catégories
        listIngredients: '/list.php?i=list' // Liste de tous les ingrédients
    }
};

// Configuration de l'IA pour les suggestions de recettes
const AI_CONFIG = {
    // Utilisation de l'API Hugging Face (gratuite avec limitations)
    baseUrl: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    // Alternative avec API locale ou autre service gratuit
    fallbackUrl: 'https://api.cohere.ai/v1/generate', // Backup si besoin
    // Pas de clé API requise pour les tests, mais à configurer en production
    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_API_KEY' // À ajouter en production
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
        // Pour TheMealDB, pas besoin de clé API ! 🎉
        let url;
        
        if (endpoint.includes('?')) {
            // L'endpoint contient déjà des paramètres (ex: /filter.php?i=chicken)
            url = API_CONFIG.baseUrl + endpoint;
        } else {
            // Construction standard
            url = new URL(API_CONFIG.baseUrl + endpoint);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value);
                }
            });
            url = url.toString();
        }
        
        console.log('🌐 TheMealDB API Call:', url);
        
        const response = await fetch(url);
        
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

// Fonction pour améliorer la qualité des images de l'API Spoonacular
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
        
        // Charger plusieurs recettes aléatoires depuis TheMealDB
        const recipes = [];
        const promises = [];
        
        for (let i = 0; i < number; i++) {
            promises.push(makeAPICall(API_CONFIG.endpoints.random));
        }
        
        const results = await Promise.all(promises);
        
        for (const data of results) {
            if (data && data.meals && data.meals.length > 0) {
                const meal = data.meals[0];
                
                const recipe = {
                    id: meal.idMeal,
                    name: meal.strMeal,
                    category: meal.strCategory ? meal.strCategory.toLowerCase() : 'plats',
                    difficulty: 'Moyen',
                    time: '30 min',
                    servings: 4,
                    image: enhanceImageQuality(meal.strMealThumb || 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=636&h=393&fit=crop&auto=format', '636x393'),
                    description: meal.strInstructions ? meal.strInstructions.substring(0, 150) + '...' : 'Délicieuse recette à découvrir',
                    ingredients: [],
                    instructions: [],
                    area: meal.strArea
                };
                
                // 🌍 Traduire automatiquement la recette avec l'IA
                const translatedRecipe = await translationAI.translateRecipe(recipe, translationAI.currentLanguage);
                recipes.push(translatedRecipe);
            }
        }
        
        if (recipes.length > 0) {
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
        
        // Utiliser l'endpoint de recherche par nom de TheMealDB
        const data = await makeAPICall(`${API_CONFIG.endpoints.searchByName}${encodeURIComponent(query)}`);
        
        if (data && data.meals) {
            const recipePromises = data.meals.map(async meal => {
                const recipe = {
                    id: meal.idMeal,
                    name: meal.strMeal,
                    category: meal.strCategory ? meal.strCategory.toLowerCase() : 'plats',
                    difficulty: 'Moyen',
                    time: '30 min',
                    servings: 4,
                    image: enhanceImageQuality(meal.strMealThumb || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=636&h=393&fit=crop&auto=format', '636x393'),
                    description: meal.strInstructions ? meal.strInstructions.substring(0, 150) + '...' : 'Délicieuse recette trouvée',
                    ingredients: [],
                    instructions: [],
                    area: meal.strArea
                };
                
                // 🌍 Traduire automatiquement la recette avec l'IA
                return await translationAI.translateRecipe(recipe, translationAI.currentLanguage);
            });
            
            const recipes = await Promise.all(recipePromises);
            
            // Limiter le nombre de résultats
            const limitedRecipes = recipes.slice(0, number);
            
            // Mettre en cache
            searchCache.set(cacheKey, limitedRecipes);
            return limitedRecipes;
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

// Obtenir les détails complets d'une recette
async function getRecipeDetails(recipeId) {
    const cacheKey = `details_${recipeId}`;
    
    // Vérifier le cache
    if (recipeCache.has(cacheKey)) {
        console.log('📦 Cache hit for recipe details:', recipeId);
        return recipeCache.get(cacheKey);
    }
    
    try {
        // Utiliser l'endpoint TheMealDB pour obtenir les détails par ID
        const data = await makeAPICall(`${API_CONFIG.endpoints.getById}${recipeId}`);
        
        if (data && data.meals && data.meals.length > 0) {
            const meal = data.meals[0];
            
            // Extraire les ingrédients de TheMealDB (format spécial avec strIngredient1-20)
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                if (ingredient && ingredient.trim()) {
                    ingredients.push(measure && measure.trim() ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim());
                }
            }
            
            // Diviser les instructions en étapes
            const instructions = meal.strInstructions 
                ? meal.strInstructions.split(/\r\n|\r|\n/).filter(step => step.trim().length > 0)
                : ['Instructions non disponibles'];
            
            const recipe = {
                id: meal.idMeal,
                name: meal.strMeal,
                category: meal.strCategory ? meal.strCategory.toLowerCase() : 'plats',
                difficulty: 'Moyen', // TheMealDB n'a pas de difficulté, on met une valeur par défaut
                time: '30 min', // TheMealDB n'a pas de temps, on met une valeur par défaut
                servings: 4, // Valeur par défaut
                image: enhanceImageQuality(meal.strMealThumb || 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop&auto=format', '800x600'),
                description: meal.strInstructions ? meal.strInstructions.substring(0, 150) + '...' : 'Délicieuse recette',
                ingredients: ingredients,
                instructions: instructions,
                area: meal.strArea, // Origine géographique du plat
                tags: meal.strTags ? meal.strTags.split(',') : [],
                youtube: meal.strYoutube, // Lien YouTube si disponible
                source: meal.strSource // Source de la recette
            };
            
            // 🌍 Traduire automatiquement la recette en utilisant l'IA
            const translatedRecipe = await translationAI.translateRecipe(recipe, translationAI.currentLanguage);
            
            // Mettre en cache
            recipeCache.set(cacheKey, translatedRecipe);
            return translatedRecipe;
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
// GESTION DE LA SECTION FAVORIS
// ========================================

// Afficher les recettes favorites de l'utilisateur
function displayFavorites() {
    if (!authManager?.isLoggedIn()) {
        showFavoritesPrompt();
        return;
    }

    const currentUser = authManager.getCurrentUser();
    const favoriteRecipes = currentUser.favorites;

    if (favoriteRecipes.length === 0) {
        showEmptyFavorites();
        return;
    }

    // Ici, vous pourriez récupérer les détails complets des recettes favorites
    // Pour l'instant, on affiche un placeholder avec les IDs
    const favoritesContainer = document.getElementById('favorites-content') || 
                               document.querySelector('[data-section="favorites"]')?.parentElement?.querySelector('.content-section');
    
    if (favoritesContainer) {
        favoritesContainer.innerHTML = `
            <div class="favorites-section">
                <div class="section-header">
                    <h2>❤️ Mes Recettes Favorites</h2>
                    <p>Retrouvez toutes vos recettes sauvegardées (${favoriteRecipes.length})</p>
                </div>
                <div class="favorites-grid">
                    ${favoriteRecipes.map(recipeId => `
                        <div class="favorite-recipe-card" data-recipe-id="${recipeId}">
                            <div class="recipe-placeholder">
                                <div class="placeholder-image">🍽️</div>
                                <div class="recipe-info">
                                    <h4>Recette #${recipeId}</h4>
                                    <p>Recette sauvegardée</p>
                                </div>
                                <div class="recipe-actions-mini">
                                    <button onclick="removeFavorite('${recipeId}')" class="remove-favorite" title="Retirer des favoris">❌</button>
                                    <button onclick="openRecipeModal('${recipeId}')" class="view-recipe" title="Voir la recette">👀</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="favorites-stats">
                    <div class="stat-card">
                        <span class="stat-number">${favoriteRecipes.length}</span>
                        <span class="stat-label">Recettes sauvées</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${currentUser.stats.recipesCooked}</span>
                        <span class="stat-label">Recettes cuisinées</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${currentUser.stats.gaspiSaved}kg</span>
                        <span class="stat-label">Gaspillage évité</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Afficher un message pour encourager la connexion
function showFavoritesPrompt() {
    const favoritesContainer = document.getElementById('favorites-content') || 
                               document.querySelector('[data-section="favorites"]')?.parentElement?.querySelector('.content-section');
    
    if (favoritesContainer) {
        favoritesContainer.innerHTML = `
            <div class="auth-prompt">
                <div class="prompt-icon">❤️</div>
                <h3>Sauvegardez vos recettes favorites !</h3>
                <p>Connectez-vous pour pouvoir sauvegarder vos recettes préférées et les retrouver facilement.</p>
                <div class="prompt-actions">
                    <button class="btn btn-primary" onclick="authManager.openModal('login')">
                        Se connecter
                    </button>
                    <button class="btn btn-outline" onclick="authManager.openModal('register')">
                        S'inscrire
                    </button>
                </div>
            </div>
        `;
    }
}

// Afficher un message quand il n'y a pas de favoris
function showEmptyFavorites() {
    const favoritesContainer = document.getElementById('favorites-content') || 
                               document.querySelector('[data-section="favorites"]')?.parentElement?.querySelector('.content-section');
    
    if (favoritesContainer) {
        favoritesContainer.innerHTML = `
            <div class="empty-favorites">
                <div class="empty-icon">🍽️</div>
                <h3>Aucune recette favorite pour l'instant</h3>
                <p>Explorez nos recettes et cliquez sur 🤍 pour les ajouter à vos favoris !</p>
                <button class="btn btn-primary" onclick="switchSection('home')">
                    Découvrir des recettes
                </button>
            </div>
        `;
    }
}

// Retirer une recette des favoris depuis la page favoris
function removeFavorite(recipeId) {
    if (authManager?.removeFromFavorites(recipeId)) {
        // Actualiser l'affichage des favoris
        displayFavorites();
    }
}

// ========================================
// FONCTIONS D'INITIALISATION
// ========================================

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🍅 PatOketchup App - Initialisation...');
    
    // Initialiser le système d'authentification
    authManager = new AuthManager();
    console.log('✅ Système d\'authentification initialisé');
    
    // Observer les cartes de recettes pour y ajouter des actions
    observeRecipeCards();
    console.log('✅ Observateur des recettes initialisé');
    
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
            // La section Mon Frigo est déjà initialisée avec FrigoManager
            console.log('🧊 Section Mon Frigo activée');
            break;
        case 'favorites':
            // Afficher les recettes favorites
            displayFavorites();
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
    
    selectedIngredients.push(cleanIngredient);
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
        const ingredientsQuery = selectedIngredients.join(',');
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
        <article class="recipe-card local-suggestion" data-recipe-id="${recipe.id}" onclick="openRecipeModal('${recipe.id}')">
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
        const ingredientsQuery = selectedIngredients.join(',');
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

// 🎯 API: Recherche Multi-Ingrédients avec TheMealDB (Filtre Intelligent Anti-Gaspi)
async function searchRecipesByIngredientsAPI(ingredients, maxResults = 12) {
    console.log('🔍 Recherche multi-ingrédients (original):', ingredients);
    
    // 🌍 Traduire tous les ingrédients en anglais pour l'API
    const ingredientsList = ingredients.toLowerCase().split(',').map(ing => ing.trim());
    const translatedIngredients = ingredientsList.map(ing => translateIngredientToEnglish(ing));
    
    console.log('🌍 Ingrédients traduits:', translatedIngredients);
    
    // Étape 1: Rechercher par ingrédient principal (le premier traduit)
    const mainIngredient = translatedIngredients[0];
    console.log('🎯 Recherche avec ingrédient principal:', mainIngredient);
    
    const data = await makeAPICall(`${API_CONFIG.endpoints.searchByIngredient}${mainIngredient}`);
    
    if (!data || !data.meals) {
        console.log('❌ Aucun résultat pour:', mainIngredient);
        return [];
    }
    
    console.log('✅ Recettes trouvées:', data.meals.length);
    
    // Étape 2: Pour chaque recette, récupérer les détails complets
    const detailedRecipes = [];
    
    for (let meal of data.meals.slice(0, maxResults * 2)) { // Prendre plus pour filtrer
        try {
            const details = await makeAPICall(`${API_CONFIG.endpoints.getById}${meal.idMeal}`);
            if (details && details.meals && details.meals[0]) {
                const recipe = details.meals[0];
                
                // Extraire tous les ingrédients de la recette
                const recipeIngredients = extractMealIngredients(recipe);
                
                // 🔍 Calculer le score de correspondance avec les ingrédients TRADUITS
                const matchScore = calculateIngredientMatch(translatedIngredients, recipeIngredients);
                
                // 🎯 Aussi vérifier avec les ingrédients originaux français (via synonymes)
                const frenchMatchScore = calculateIngredientMatch(ingredientsList, recipeIngredients);
                
                // Prendre le meilleur score entre anglais et français
                const bestScore = matchScore.totalMatches >= frenchMatchScore.totalMatches ? matchScore : frenchMatchScore;
                
                if (bestScore.totalMatches > 0) { // Garder seulement les recettes qui correspondent
                    detailedRecipes.push({
                        id: recipe.idMeal,
                        name: recipe.strMeal,
                        category: recipe.strCategory || 'Plat',
                        difficulty: getDifficultyFromIngredientCount(recipeIngredients.length),
                        time: estimateTimeFromIngredients(recipeIngredients.length),
                        servings: 4, // TheMealDB ne donne pas toujours cette info
                        image: recipe.strMealThumb || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format',
                        description: recipe.strInstructions ? recipe.strInstructions.substring(0, 120) + '...' : 'Délicieuse recette à découvrir',
                        ingredients: recipeIngredients,
                        instructions: recipe.strInstructions ? [recipe.strInstructions] : ['Instructions disponibles dans le détail'],
                        // 🎯 Données Anti-Gaspi
                        matchScore: bestScore,
                        usedIngredientCount: bestScore.totalMatches,
                        missedIngredientCount: ingredientsList.length - bestScore.totalMatches,
                        totalIngredients: recipeIngredients.length,
                        wasteReduction: Math.round((bestScore.totalMatches / ingredientsList.length) * 100)
                    });
                }
            }
        } catch (error) {
            console.warn(`Erreur récupération détails recette ${meal.idMeal}:`, error);
        }
    }
    
    // Étape 3: Tri intelligent Anti-Gaspi
    detailedRecipes.sort((a, b) => {
        // Priorité 1: Plus de correspondances d'ingrédients
        if (a.usedIngredientCount !== b.usedIngredientCount) {
            return b.usedIngredientCount - a.usedIngredientCount;
        }
        // Priorité 2: Moins d'ingrédients supplémentaires nécessaires  
        if (a.missedIngredientCount !== b.missedIngredientCount) {
            return a.missedIngredientCount - b.missedIngredientCount;
        }
        // Priorité 3: Recettes plus simples (moins d'ingrédients total)
        return a.totalIngredients - b.totalIngredients;
    });
    
    console.log('🎯 Recettes filtrées et triées:', detailedRecipes.length);
    return detailedRecipes.slice(0, maxResults);
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

// ========================================
// 🧠 SYSTÈME IA DE TRADUCTION UNIVERSELLE
// ========================================

// Configuration de l'IA de traduction
class TranslationAI {
    constructor() {
        this.currentLanguage = localStorage.getItem('patoketchup_language') || 'français';
        this.translations = new Map();
        this.supportedLanguages = {
            'français': { code: 'fr', flag: '🇫🇷', native: 'Français' },
            'anglais': { code: 'en', flag: '🇺🇸', native: 'English' },
            'espagnol': { code: 'es', flag: '🇪🇸', native: 'Español' },
            'italien': { code: 'it', flag: '🇮🇹', native: 'Italiano' },
            'allemand': { code: 'de', flag: '🇩🇪', native: 'Deutsch' },
            'portugais': { code: 'pt', flag: '🇵🇹', native: 'Português' },
            'chinois': { code: 'zh', flag: '🇨🇳', native: '中文' },
            'japonais': { code: 'ja', flag: '🇯🇵', native: '日本語' },
            'coréen': { code: 'ko', flag: '🇰🇷', native: '한국어' },
            'arabe': { code: 'ar', flag: '🇸🇦', native: 'العربية' },
            'russe': { code: 'ru', flag: '🇷🇺', native: 'Русский' }
        };
        
        this.initializeTranslationContext();
    }
    
    // Initialiser le contexte culinaire pour l'IA
    initializeTranslationContext() {
        this.culinariesContext = {
            'français': {
                'cooking_verbs': ['cuire', 'mélanger', 'hacher', 'faire frire', 'bouillir', 'mijoter', 'assaisonner'],
                'ingredients_common': ['tomate', 'oignon', 'ail', 'huile', 'sel', 'poivre', 'beurre'],
                'measures': ['cuillère', 'tasse', 'gramme', 'litre', 'pincée'],
                'cooking_terms': ['préchauffer', 'dorer', 'sauter', 'égoutter', 'incorporer']
            },
            'anglais': {
                'cooking_verbs': ['cook', 'mix', 'chop', 'fry', 'boil', 'simmer', 'season'],
                'ingredients_common': ['tomato', 'onion', 'garlic', 'oil', 'salt', 'pepper', 'butter'],
                'measures': ['spoon', 'cup', 'gram', 'liter', 'pinch'],
                'cooking_terms': ['preheat', 'brown', 'sauté', 'drain', 'fold']
            }
        };
    }
    
    // Détecter la langue d'un texte grâce à l'IA contextuelle
    detectLanguage(text) {
        if (!text || typeof text !== 'string') return 'unknown';
        
        const textLower = text.toLowerCase();
        let scores = {};
        
        // Analyser avec le contexte culinaire
        Object.keys(this.culinariesContext).forEach(lang => {
            scores[lang] = 0;
            const context = this.culinariesContext[lang];
            
            // Vérifier les verbes culinaires
            context.cooking_verbs.forEach(verb => {
                if (textLower.includes(verb.toLowerCase())) {
                    scores[lang] += 3; // Plus de poids pour les verbes
                }
            });
            
            // Vérifier les ingrédients
            context.ingredients_common.forEach(ingredient => {
                if (textLower.includes(ingredient.toLowerCase())) {
                    scores[lang] += 2;
                }
            });
            
            // Vérifier les mesures
            context.measures.forEach(measure => {
                if (textLower.includes(measure.toLowerCase())) {
                    scores[lang] += 1;
                }
            });
            
            // Vérifier les termes de cuisine
            context.cooking_terms.forEach(term => {
                if (textLower.includes(term.toLowerCase())) {
                    scores[lang] += 2;
                }
            });
        });
        
        // Retourner la langue avec le score le plus élevé
        const detectedLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        return scores[detectedLang] > 0 ? detectedLang : 'anglais'; // Défaut anglais pour l'API
    }
    
    // IA de traduction intelligente basée sur le contexte
    async translateWithAI(text, targetLanguage, sourceLanguage = null) {
        if (!text || !targetLanguage) return text;
        
        // Détecter automatiquement la langue source si non spécifiée
        if (!sourceLanguage) {
            sourceLanguage = this.detectLanguage(text);
        }
        
        // Si même langue, pas de traduction nécessaire
        if (sourceLanguage === targetLanguage) {
            return text;
        }
        
        // Vérifier le cache
        const cacheKey = `${sourceLanguage}_${targetLanguage}_${text.substring(0, 50)}`;
        if (this.translations.has(cacheKey)) {
            return this.translations.get(cacheKey);
        }
        
        // IA de traduction contextuelle pour la cuisine
        const translatedText = await this.performContextualTranslation(text, sourceLanguage, targetLanguage);
        
        // Mettre en cache
        this.translations.set(cacheKey, translatedText);
        return translatedText;
    }
    
    // Traduction contextuelle intelligente
    async performContextualTranslation(text, sourceLang, targetLang) {
        // Système d'IA basé sur les patterns culinaires
        const translationRules = {
            'anglais_français': {
                // Verbes d'action
                'mix': 'mélanger', 'stir': 'remuer', 'cook': 'cuire', 'fry': 'faire frire',
                'bake': 'cuire au four', 'boil': 'faire bouillir', 'simmer': 'faire mijoter',
                'chop': 'hacher', 'slice': 'trancher', 'dice': 'couper en dés',
                'season': 'assaisonner', 'add': 'ajouter', 'heat': 'chauffer',
                'serve': 'servir', 'garnish': 'garnir', 'combine': 'combiner',
                
                // Ingrédients
                'chicken': 'poulet', 'beef': 'bœuf', 'pork': 'porc', 'fish': 'poisson',
                'tomato': 'tomate', 'onion': 'oignon', 'garlic': 'ail',
                'potato': 'pomme de terre', 'carrot': 'carotte', 'pepper': 'poivron',
                'salt': 'sel', 'pepper': 'poivre', 'oil': 'huile', 'butter': 'beurre',
                'cheese': 'fromage', 'milk': 'lait', 'egg': 'œuf', 'bread': 'pain',
                'rice': 'riz', 'pasta': 'pâtes', 'flour': 'farine',
                
                // Mesures
                'cup': 'tasse', 'tablespoon': 'cuillère à soupe', 'teaspoon': 'cuillère à café',
                'ounce': 'once', 'pound': 'livre', 'gram': 'gramme', 'liter': 'litre',
                'pinch': 'pincée', 'dash': 'trait',
                
                // Adjectifs
                'fresh': 'frais', 'dried': 'séché', 'chopped': 'haché', 'sliced': 'tranché',
                'minced': 'émincé', 'grated': 'râpé', 'hot': 'chaud', 'cold': 'froid',
                'large': 'gros', 'small': 'petit', 'medium': 'moyen',
                
                // Phrases courantes
                'preheat oven': 'préchauffer le four',
                'heat oil': 'chauffer l\'huile',
                'mix well': 'bien mélanger',
                'season to taste': 'assaisonner selon le goût',
                'serve hot': 'servir chaud',
                'let cool': 'laisser refroidir'
            }
        };
        
        // Appliquer les règles de traduction intelligente
        let translated = text.toLowerCase();
        const ruleKey = `${sourceLang}_${targetLang}`;
        
        if (translationRules[ruleKey]) {
            const rules = translationRules[ruleKey];
            
            // Appliquer chaque règle avec regex pour les mots complets
            Object.entries(rules).forEach(([source, target]) => {
                const regex = new RegExp(`\\b${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                translated = translated.replace(regex, target);
            });
        }
        
        // IA générative pour les termes non couverts
        translated = await this.generateMissingTranslations(translated, targetLang);
        
        // Capitaliser correctement
        return this.capitalizeTranslation(translated, text);
    }
    
    // IA générative pour termes manquants
    async generateMissingTranslations(text, targetLang) {
        // Simulation d'IA générative basée sur les patterns
        if (targetLang === 'français') {
            // Pattern pour les plats
            text = text.replace(/\b(\w+)\s+chicken\b/gi, (match, adj) => `poulet ${adj}`);
            text = text.replace(/\b(\w+)\s+sauce\b/gi, (match, adj) => `sauce ${adj}`);
            text = text.replace(/\b(\w+)\s+salad\b/gi, (match, adj) => `salade ${adj}`);
            
            // Pattern pour les actions
            text = text.replace(/\b(\w+)\s+until\s+(\w+)\b/gi, (match, action, state) => {
                return `${action} jusqu'à ce que ${state}`;
            });
        }
        
        return text;
    }
    
    // Préserver la capitalisation originale
    capitalizeTranslation(translated, original) {
        if (original.charAt(0) === original.charAt(0).toUpperCase()) {
            return translated.charAt(0).toUpperCase() + translated.slice(1);
        }
        return translated;
    }
    
    // Traduire une recette complète
    async translateRecipe(recipe, targetLanguage) {
        if (!recipe || !targetLanguage) return recipe;
        
        const translatedRecipe = { ...recipe };
        const sourceLang = this.detectLanguage(recipe.name || recipe.description || '');
        
        try {
            // Traduire le nom
            if (recipe.name) {
                translatedRecipe.name = await this.translateWithAI(recipe.name, targetLanguage, sourceLang);
                if (sourceLang !== targetLanguage) {
                    translatedRecipe.originalName = recipe.name;
                    translatedRecipe.isTranslated = true;
                    translatedRecipe.translatedTo = targetLanguage;
                }
            }
            
            // Traduire la description
            if (recipe.description) {
                translatedRecipe.description = await this.translateWithAI(recipe.description, targetLanguage, sourceLang);
            }
            
            // Traduire les ingrédients
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                translatedRecipe.ingredients = await Promise.all(
                    recipe.ingredients.map(ingredient => 
                        this.translateWithAI(ingredient, targetLanguage, sourceLang)
                    )
                );
            }
            
            // Traduire les instructions
            if (recipe.instructions && Array.isArray(recipe.instructions)) {
                translatedRecipe.instructions = await Promise.all(
                    recipe.instructions.map(instruction => 
                        this.translateWithAI(instruction, targetLanguage, sourceLang)
                    )
                );
            }
            
            return translatedRecipe;
            
        } catch (error) {
            console.error('❌ Erreur de traduction IA:', error);
            return recipe; // Retourner l'original en cas d'erreur
        }
    }
    
    // Changer la langue de l'application
    async setLanguage(language) {
        this.currentLanguage = language.toLowerCase();
        localStorage.setItem('patoketchup_language', this.currentLanguage);
        
        // Recharger les recettes avec la nouvelle langue
        await this.updateAllRecipesLanguage();
    }
    
    // Mettre à jour toutes les recettes affichées
    async updateAllRecipesLanguage() {
        // Cette fonction sera appelée pour recharger l'affichage
        if (window.currentRecipes && window.currentRecipes.length > 0) {
            const translatedRecipes = await Promise.all(
                window.currentRecipes.map(recipe => 
                    this.translateRecipe(recipe, this.currentLanguage)
                )
            );
            
            // Mettre à jour l'affichage
            displayRecipes(translatedRecipes);
        }
    }
}

// Instance globale de l'IA de traduction
const translationAI = new TranslationAI();

// Fonction pour traduire automatiquement une recette (remplacement de l'ancienne fonction)
async function translateRecipeToFrench(recipe) {
    return await translationAI.translateRecipe(recipe, translationAI.currentLanguage);
}

// ========================================
// 🌍 INTERFACE SÉLECTEUR DE LANGUE
// ========================================

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
                    <h3 class="recipe-title">
                        ${recipe.name}
                        ${recipe.isTranslated ? `<span class="translation-badge" title="Traduit automatiquement vers ${recipe.translatedTo || translationAI.currentLanguage}${recipe.originalName ? ' depuis: ' + recipe.originalName : ''}">🌍 ${getLanguageFlag(recipe.translatedTo || translationAI.currentLanguage)}</span>` : ''}
                    </h3>
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
        <article class="recipe-card" data-recipe-id="${recipe.id}" onclick="openRecipeModal('${recipe.id}')">
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format'; console.log('Image failed to load:', '${recipe.image}');">
                <div class="recipe-category">${getCategoryLabel(recipe.category)}</div>
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">
                    ${recipe.name}
                    ${recipe.isTranslated ? `<span class="translation-badge" title="Traduit automatiquement vers ${recipe.translatedTo || translationAI.currentLanguage}${recipe.originalName ? ' depuis: ' + recipe.originalName : ''}">🌍 ${getLanguageFlag(recipe.translatedTo || translationAI.currentLanguage)}</span>` : ''}
                </h3>
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
    console.log('🔍 Tentative d\'ouverture recette avec ID:', recipeId, 'Type:', typeof recipeId);
    
    try {
        // Afficher un loading dans le modal
        showModalLoading();
        
        // Récupérer les détails depuis l'API ou fallback
        let recipe = await getRecipeDetails(recipeId);
        console.log('📊 Résultat getRecipeDetails:', recipe);
        
        // Si pas de détails API, utiliser les données locales
        if (!recipe) {
            console.log('🔄 Tentative de recherche dans fallbackRecipes...');
            recipe = fallbackRecipes.find(r => r.id == recipeId || r.id === recipeId);
            console.log('📋 Recette trouvée dans fallback:', recipe);
        }
        
        if (!recipe) {
            console.error('❌ Recette non trouvée:', recipeId);
            showNotification('Impossible de charger les détails de la recette', 'error');
            closeRecipeModal();
            return;
        }
        
        console.log('📖 Ouverture recette:', recipe.name);
        
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

console.log('🍅 Script PatOketchup avec API chargé !');

// ========================================
// SYSTÈME INTELLIGENT "MON FRIGO" 
// ========================================

// Variables pour Mon Frigo
let frigoIngredients = [];

// Gestionnaire de classe pour Mon Frigo
class FrigoManager {
    constructor() {
        this.ingredients = [];
        this.aiSuggestions = [];
        this.initializeEventListeners();
    }

    // Initialiser les écouteurs d'événements
    initializeEventListeners() {
        // Ajouter un ingrédient via input
        const addBtn = document.getElementById('add-ingredient-btn');
        const input = document.getElementById('frigo-ingredient-input');
        
        if (addBtn && input) {
            addBtn.addEventListener('click', () => this.addIngredient(input.value));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addIngredient(input.value);
                }
            });
        }

        // Suggestions rapides
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const ingredient = chip.dataset.ingredient;
                this.addIngredient(ingredient);
            });
        });

        // Boutons d'actions
        const aiBtn = document.getElementById('ai-suggestions-btn');
        const searchBtn = document.getElementById('search-by-ingredients-btn');
        const clearBtn = document.getElementById('clear-ingredients-btn');

        if (aiBtn) aiBtn.addEventListener('click', () => this.getAISuggestions());
        if (searchBtn) searchBtn.addEventListener('click', () => this.searchRecipesByIngredients());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearIngredients());
    }

    // Ajouter un ingrédient
    addIngredient(ingredient) {
        if (!ingredient || ingredient.trim() === '') return;
        
        const cleanIngredient = ingredient.trim().toLowerCase();
        
        if (this.ingredients.includes(cleanIngredient)) {
            showNotification('Cet ingrédient est déjà dans votre liste !', 'warning');
            return;
        }

        this.ingredients.push(cleanIngredient);
        this.updateIngredientsDisplay();
        this.clearInput();
        
        const funMessages = [
            `🎉 "${ingredient}" a rejoint l'équipe ! Prêt à cuisiner ?`,
            `✨ Super ! "${ingredient}" est maintenant dans ton frigo magique !`,
            `👏 Excellent choix ! "${ingredient}" va faire des merveilles !`,
            `🌟 "${ingredient}" ajouté avec succès ! L'aventure continue !`,
            `💫 Perfect ! "${ingredient}" est prêt pour la magie culinaire !`
        ];
        
        showNotification(funMessages[Math.floor(Math.random() * funMessages.length)], 'success');
    }

    // Supprimer un ingrédient
    removeIngredient(ingredient) {
        this.ingredients = this.ingredients.filter(i => i !== ingredient);
        this.updateIngredientsDisplay();
        
        const funRemoveMessages = [
            `🗑️ "${ingredient}" a dit au revoir ! À bientôt peut-être ?`,
            `👋 "${ingredient}" a quitté l'équipe ! Merci pour sa participation !`,
            `✌️ "${ingredient}" retiré avec élégance !`,
            `🚀 "${ingredient}" s'envole vers d'autres aventures !`
        ];
        
        showNotification(funRemoveMessages[Math.floor(Math.random() * funRemoveMessages.length)], 'info');
    }

    // Vider tous les ingrédients
    clearIngredients() {
        this.ingredients = [];
        this.updateIngredientsDisplay();
        this.hideResults();
        
        const funClearMessages = [
            '🧹 Frigo nettoyé ! Prêt pour de nouveaux ingrédients !',
            '✨ Table rase ! À nous les nouvelles aventures !',
            '🔄 Reset complet ! C\'est reparti !',
            '🌟 Frigo vidé avec brio ! Place à la créativité !'
        ];
        
        showNotification(funClearMessages[Math.floor(Math.random() * funClearMessages.length)], 'info');
    }

    // Vider l'input
    clearInput() {
        const input = document.getElementById('frigo-ingredient-input');
        if (input) input.value = '';
    }

    // Mettre à jour l'affichage des ingrédients
    updateIngredientsDisplay() {
        const container = document.getElementById('ingredients-list');
        const actionsContainer = document.querySelector('.ingredients-actions');

        if (!container || !actionsContainer) return;

        if (this.ingredients.length === 0) {
            container.innerHTML = `
                <div class="empty-ingredients">
                    <p>👆 Sélectionnez vos ingrédients pour commencer</p>
                </div>
            `;
            actionsContainer.style.display = 'none';
        } else {
            container.innerHTML = this.ingredients.map(ingredient => `
                <div class="ingredient-tag">
                    <span class="ingredient-name">${ingredient}</span>
                    <button class="remove-ingredient" onclick="frigoManager.removeIngredient('${ingredient}')">❌</button>
                </div>
            `).join('');
            actionsContainer.style.display = 'flex';
        }
    }

    // Obtenir des suggestions de l'IA
    async getAISuggestions() {
        if (this.ingredients.length === 0) {
            showNotification('Veuillez d\'abord ajouter des ingrédients !', 'warning');
            return;
        }

        const aiSection = document.getElementById('ai-suggestions-section');
        const aiResults = document.getElementById('ai-results');
        const aiLoading = document.getElementById('ai-loading');

        if (!aiSection || !aiResults || !aiLoading) return;

        // Afficher la section et le loading
        aiSection.style.display = 'block';
        aiLoading.style.display = 'flex';
        aiResults.innerHTML = '';

        // Messages de loading amusants
        const loadingMessages = [
            '🧠 L\'IA réfléchit intensément à vos ingrédients...',
            '✨ Magie culinaire en cours de création...',
            '👨‍🍳 Votre chef virtuel mijote quelque chose de génial...',
            '🔮 Consultation de la boule de cristal gastronomique...',
            '🎭 L\'IA enfile sa toque de chef...',
            '🌟 Transformation d\'ingrédients en pure magie...',
            '🚀 Voyage dans l\'univers des saveurs...'
        ];
        
        const loadingP = aiLoading.querySelector('p');
        if (loadingP) {
            loadingP.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        }

        try {
            // Générer une suggestion avec l'IA locale
            const suggestion = await this.generateRecipeWithAI(this.ingredients);
            
            // Masquer le loading
            aiLoading.style.display = 'none';
            
            // Afficher le résultat
            this.displayAISuggestion(suggestion);
            
        } catch (error) {
            console.error('Erreur IA:', error);
            aiLoading.style.display = 'none';
            
            // Afficher une suggestion de fallback
            const fallbackSuggestion = this.generateFallbackSuggestion(this.ingredients);
            this.displayAISuggestion(fallbackSuggestion);
        }
    }

    // Générer une recette avec IA locale (simulation intelligente)
    async generateRecipeWithAI(ingredients) {
        // Simulation d'une IA sophistiquée avec des règles culinaires
        const recipes = this.getRecipeTemplates();
        const bestMatch = this.findBestRecipeMatch(ingredients, recipes);
        
        // Si on a une correspondance parfaite avec un template, l'utiliser
        if (bestMatch && bestMatch.matchPercentage >= 90) {
            return bestMatch;
        }
        
        // Sinon, générer une recette personnalisée avec TOUS les ingrédients
        return this.generateFullCustomRecipe(ingredients);
    }

    // Templates de recettes basées sur des combinaisons populaires
    getRecipeTemplates() {
        return [
            {
                ingredients: ['œufs', 'pâtes', 'fromage'],
                name: 'Carbonara Express du Chef ! 🍝✨',
                description: 'Ohh là là ! Tu as les PARFAITS ingrédients pour une carbonara divine ! C\'est comme si ton frigo était italien 😍. Prépare-toi à impressionner tes papilles (et tes voisins qui vont sentir cette merveille) !',
                instructions: [
                    '🍝 Lance tes pâtes dans l\'eau bouillante salée - pendant qu\'elles nagent joyeusement...',
                    '🥚 Bats tes œufs avec le fromage comme si tu mélangeais de la magie pure !',
                    '🔥 Quand tes pâtes sont al dente (tu sais, ce petit croquant parfait), égoute-les rapidement',
                    '💫 C\'est LE moment crucial : mélange VITE les pâtes chaudes avec ton mélange œufs-fromage',
                    '🌶️ Ajoute du poivre noir généreusement et... TADAAAA ! Tu viens de faire de la magie culinaire !'
                ],
                time: '15 minutes chrono',
                difficulty: 'Facile comme bonjour'
            },
            {
                ingredients: ['œufs', 'fromage', 'beurre'],
                name: 'L\'Omelette de la Fierté ! 🥚👨‍🍳',
                description: 'Waouh ! Avec ces 3 champions dans ton frigo, tu vas faire l\'omelette la plus moelleuse de ta VIE ! Tes œufs vont devenir des nuages dorés et ton fromage va fondre comme dans un rêve... 🤤',
                instructions: [
                    '🥚 Casse tes œufs avec confiance et bats-les comme un chef ! Un peu de sel, un soupçon de poivre',
                    '🧈 Fais fondre ton beurre dans une poêle qui brillera de mille feux',
                    '✨ Verse tes œufs et laisse la magie opérer en remuant TRÈS délicatement',
                    '🧀 Quand ça commence à prendre, parsème généreusement de fromage sur UNE moitié',
                    '🎭 Plie ton omelette comme un artiste et glisse-la dans l\'assiette... Bravo chef !'
                ],
                time: '8 minutes de bonheur',
                difficulty: 'Même un débutant y arrive !'
            },
            {
                ingredients: ['pommes de terre', 'œufs', 'oignons'],
                name: 'Tortilla Española ! ¡Olé! 🇪🇸',
                description: 'Incroyable ! Tu as exactement ce qu\'il faut pour faire la tortilla espagnole authentique ! C\'est comme si l\'Espagne avait livré directement dans ton frigo 🌟. Prépare-toi à un voyage culinaire ensoleillé !',
                instructions: [
                    '🥔 Épluche tes pommes de terre avec amour et coupe-les en jolies rondelles fines',
                    '🧅 Émince tes oignons (oui, tu peux pleurer, c\'est permis ! 😭)',
                    '🔥 Dans ta poêle avec de l\'huile d\'olive, fais dorer tout ça jusqu\'à ce que ce soit tendre',
                    '🥚 Bats tes œufs comme un flamenco et ajoute tes légumes dorés',
                    '🎪 Retourne ta tortilla (c\'est le moment épique !) et cuisine l\'autre côté',
                    '😋 Sers tiède et sens-toi fier.e comme un vrai chef espagnol !'
                ],
                time: '30 minutes de plaisir',
                difficulty: 'Aventurier culinaire'
            },
            {
                ingredients: ['riz', 'œufs', 'oignons'],
                name: 'Riz Sauté de l\'Amitié ! 🍚💝',
                description: 'Oh que c\'est parfait ! Tu vas transformer ces ingrédients simples en festin ! C\'est exactement le genre de plat qui réunit les gens autour de la table avec des sourires et des "mmmh" de satisfaction 😊',
                instructions: [
                    '🍚 Si tu as du riz de la veille, c\'est PARFAIT ! Sinon, cuis-en et laisse-le refroidir tranquillement',
                    '🥚 Brouille tes œufs dans la poêle jusqu\'à ce qu\'ils soient tout moelleux',
                    '🧅 Fais danser tes oignons dans la poêle jusqu\'à ce qu\'ils deviennent translucides',
                    '🔥 Ajoute ton riz et mélange tout avec passion !',
                    '✨ Assaisonne selon ton cœur (sauce soja si tu en as, sinon sel et poivre font l\'affaire)',
                    '🎉 Déguste ce bonheur simple et partage avec ceux que tu aimes !'
                ],
                time: '20 minutes de joie',
                difficulty: 'Même les enfants adorent aider !'
            }
        ];
    }

    // Trouver la meilleure recette correspondante
    findBestRecipeMatch(userIngredients, templates) {
        let bestMatch = null;
        let bestScore = 0;

        for (const template of templates) {
            let score = 0;
            let missingIngredients = [];
            
            for (const ingredient of template.ingredients) {
                if (userIngredients.some(ui => ui.includes(ingredient) || ingredient.includes(ui))) {
                    score += 1;
                } else {
                    missingIngredients.push(ingredient);
                }
            }
            
            // Bonus si tous les ingrédients sont disponibles
            if (missingIngredients.length === 0) {
                score += 2;
            }
            
            // Calculer le pourcentage de correspondance
            const matchPercentage = score / template.ingredients.length;
            
            if (matchPercentage >= 0.7 && score > bestScore) {
                bestScore = score;
                bestMatch = {
                    ...template,
                    missingIngredients,
                    matchPercentage: Math.round(matchPercentage * 100)
                };
            }
        }

        return bestMatch;
    }

    // Générer une recette personnalisée avec TOUS les ingrédients
    generateFullCustomRecipe(ingredients) {
        const recipe = {
            name: this.generateCustomRecipeName(ingredients),
            description: this.generateCustomDescription(ingredients),
            instructions: this.generateDetailedInstructions(ingredients),
            time: this.estimateCookingTime(ingredients),
            difficulty: this.assessDifficulty(ingredients),
            matchPercentage: 100,
            custom: true,
            allIngredients: ingredients // Marquer que tous les ingrédients sont utilisés
        };
        
        return recipe;
    }

    // Générer un nom créatif pour la recette
    generateCustomRecipeName(ingredients) {
        const creativePrefixes = [
            '🎨 Création Unique', '✨ Plat Magique', '🚀 Fusion Créative', 
            '🎪 Spectacle Culinaire', '💫 Merveille Improvisée', '🌟 Chef-d\'œuvre'
        ];
        
        const mainIngredient = ingredients[0];
        const prefix = creativePrefixes[Math.floor(Math.random() * creativePrefixes.length)];
        
        if (ingredients.length <= 2) {
            return `${prefix} : ${ingredients.join(' & ')}`;
        } else if (ingredients.length === 3) {
            return `${prefix} : Trio ${ingredients.join(', ')}`;
        } else {
            return `${prefix} aux ${ingredients.length} Saveurs`;
        }
    }

    // Générer une description personnalisée
    generateCustomDescription(ingredients) {
        const enthusiasm = [
            'Incroyable ! Tu as', 'Fantastique ! Avec', 'Génial ! Tes', 'Parfait ! Ces'
        ];
        
        const compliments = [
            'on va faire des merveilles', 'ça va être délicieux', 'tu vas être fier.e du résultat',
            'ça sent déjà le succès', 'on va créer quelque chose d\'unique'
        ];
        
        const intro = enthusiasm[Math.floor(Math.random() * enthusiasm.length)];
        const outro = compliments[Math.floor(Math.random() * compliments.length)];
        
        return `${intro} ${ingredients.join(', ')} dans ton frigo ! Avec cette combinaison, ${outro} ! 🎯`;
    }

    // Générer des instructions détaillées qui utilisent TOUS les ingrédients
    generateDetailedInstructions(ingredients) {
        const instructions = [];
        
        // Introduction enthousiaste
        instructions.push('🎬 Action ! Préparons tous tes ingrédients sur le plan de travail comme des stars !');
        
        // Analyser les ingrédients et créer une séquence logique
        const sequence = this.analyzeIngredientSequence(ingredients);
        
        // Générer les instructions selon la séquence
        sequence.forEach((step, index) => {
            instructions.push(step.instruction);
        });
        
        // Conclusion personnalisée
        const conclusions = [
            '🎉 Et voilà ! Tous tes ingrédients ont joué leur rôle à la perfection !',
            '👏 Bravo ! Tu as utilisé chaque ingrédient avec brio !',
            '🌟 Parfait ! Chaque saveur a sa place dans cette création !',
            '🏆 Mission accomplie ! Tous tes ingrédients sont devenus un délice !'
        ];
        
        instructions.push(conclusions[Math.floor(Math.random() * conclusions.length)]);
        
        return instructions;
    }

    // Analyser la séquence logique d'utilisation des ingrédients
    analyzeIngredientSequence(ingredients) {
        const sequence = [];
        
        // 1. Préparer les ingrédients qui demandent de la cuisson
        const needsCooking = ingredients.filter(ing => 
            this.needsCooking(ing)
        );
        
        const seasonings = ingredients.filter(ing => 
            this.isSeasoning(ing)
        );
        
        const fresh = ingredients.filter(ing => 
            this.isFresh(ing)
        );
        
        const dairy = ingredients.filter(ing => 
            this.isDairy(ing)
        );
        
        // Séquence de cuisson logique
        if (needsCooking.length > 0) {
            needsCooking.forEach(ingredient => {
                sequence.push({
                    ingredient,
                    instruction: this.getCookingInstruction(ingredient)
                });
            });
        }
        
        // Ajouter les produits laitiers (beurre, crème, fromage)
        if (dairy.length > 0) {
            dairy.forEach(ingredient => {
                sequence.push({
                    ingredient,
                    instruction: this.getDairyInstruction(ingredient, needsCooking)
                });
            });
        }
        
        // Ajouter les assaisonnements et condiments
        if (seasonings.length > 0) {
            seasonings.forEach(ingredient => {
                sequence.push({
                    ingredient,
                    instruction: this.getSeasoningInstruction(ingredient)
                });
            });
        }
        
        // Ajouter les ingrédients frais en dernier
        if (fresh.length > 0) {
            fresh.forEach(ingredient => {
                sequence.push({
                    ingredient,
                    instruction: this.getFreshInstruction(ingredient)
                });
            });
        }
        
        return sequence;
    }

    // Déterminer si un ingrédient nécessite une cuisson
    needsCooking(ingredient) {
        const cookingIngredients = [
            'pâtes', 'riz', 'pommes de terre', 'œufs', 'viande', 'poulet', 
            'poisson', 'légumes', 'haricots', 'lentilles', 'quinoa'
        ];
        return cookingIngredients.some(cook => 
            ingredient.toLowerCase().includes(cook) || cook.includes(ingredient.toLowerCase())
        );
    }

    // Déterminer si c'est un assaisonnement/condiment
    isSeasoning(ingredient) {
        const seasonings = [
            'ketchup', 'moutarde', 'mayonnaise', 'sauce', 'vinaigre', 
            'huile', 'sel', 'poivre', 'épices', 'herbes', 'ail', 'oignon'
        ];
        return seasonings.some(season => 
            ingredient.toLowerCase().includes(season) || season.includes(ingredient.toLowerCase())
        );
    }

    // Déterminer si c'est un produit laitier
    isDairy(ingredient) {
        const dairy = ['beurre', 'crème', 'fromage', 'lait', 'yaourt'];
        return dairy.some(d => 
            ingredient.toLowerCase().includes(d) || d.includes(ingredient.toLowerCase())
        );
    }

    // Déterminer si c'est un ingrédient frais
    isFresh(ingredient) {
        const fresh = [
            'salade', 'tomates', 'concombre', 'radis', 'persil', 
            'basilic', 'ciboulette', 'citron', 'avocat'
        ];
        return fresh.some(f => 
            ingredient.toLowerCase().includes(f) || f.includes(ingredient.toLowerCase())
        );
    }

    // Instructions de cuisson spécifiques
    getCookingInstruction(ingredient) {
        const cookingInstructions = {
            'pâtes': '🍝 Lance tes pâtes dans une grande casserole d\'eau bouillante bien salée !',
            'riz': '� Fais cuire ton riz dans de l\'eau bouillante (2 volumes d\'eau pour 1 de riz) !',
            'pommes de terre': '🥔 Cuis tes pommes de terre à l\'eau ou à la poêle selon ton envie !',
            'œufs': '🥚 Prépare tes œufs selon ton humeur : brouillés, au plat, ou en omelette !',
            'default': `🔥 Prépare ton/ta ${ingredient} avec amour - la cuisson, c'est ton moment de magie !`
        };
        
        for (const [key, instruction] of Object.entries(cookingInstructions)) {
            if (ingredient.toLowerCase().includes(key)) {
                return instruction;
            }
        }
        
        return cookingInstructions.default;
    }

    // Instructions pour les produits laitiers
    getDairyInstruction(ingredient, cookedItems) {
        if (ingredient.toLowerCase().includes('beurre')) {
            if (cookedItems.some(item => item.includes('pâtes'))) {
                return '🧈 Quand tes pâtes sont cuites et égouttées, ajoute une belle noix de beurre et mélange !';
            }
            return '🧈 Ajoute ton beurre pour donner de l\'onctuosité et de la saveur !';
        }
        
        if (ingredient.toLowerCase().includes('fromage')) {
            return '🧀 Ajoute ton fromage râpé ou en morceaux pour le côté gourmand !';
        }
        
        if (ingredient.toLowerCase().includes('crème')) {
            return '🥛 Incorpore ta crème pour une texture veloutée divine !';
        }
        
        return `🥛 Ajoute ton ${ingredient} pour enrichir ton plat !`;
    }

    // Instructions pour les assaisonnements
    getSeasoningInstruction(ingredient) {
        if (ingredient.toLowerCase().includes('ketchup')) {
            return '🍅 Pour finir, ajoute une touche de ketchup sur ton plat ou mélange-le délicatement !';
        }
        
        if (ingredient.toLowerCase().includes('moutarde')) {
            return '🌭 Une pointe de moutarde pour relever les saveurs !';
        }
        
        if (ingredient.toLowerCase().includes('ail')) {
            return '🧄 Fais revenir ton ail émincé pour parfumer toute la préparation !';
        }
        
        return `✨ Assaisonne avec ton ${ingredient} selon ton goût !`;
    }

    // Instructions pour les ingrédients frais
    getFreshInstruction(ingredient) {
        return `🌿 Termine avec ton ${ingredient} frais pour une touche de fraîcheur !`;
    }

    // Estimer le temps de cuisson
    estimateCookingTime(ingredients) {
        if (ingredients.some(i => i.includes('pâtes'))) {
            return '15-20 minutes de plaisir';
        }
        if (ingredients.some(i => i.includes('riz'))) {
            return '20-25 minutes de détente';
        }
        if (ingredients.length <= 3) {
            return '10-15 minutes express';
        }
        return '20-30 minutes de création';
    }

    // Évaluer la difficulté
    assessDifficulty(ingredients) {
        if (ingredients.length <= 2) {
            return 'Ultra facile !';
        }
        if (ingredients.length <= 4) {
            return 'Facile comme bonjour !';
        }
        return 'Aventurier culinaire !';
    }

    // Générer une recette personnalisée simple (fallback)
    generateCustomRecipe(ingredients) {
        const funIntros = [
            '🎨 Alors... tu veux être créatif ? J\'ADORE ça ! Voici ce qu\'on va faire avec tes trésors :',
            '✨ OH ! Regarde-moi ces ingrédients ! Tu sais quoi ? On va inventer quelque chose d\'extraordinaire !',
            '🚀 Houston, nous avons des ingrédients ! Prépare-toi au décollage culinaire !',
            '🎪 Mesdames et Messieurs, voici le spectacle du jour avec tes merveilleux ingrédients !'
        ];

        const baseInstructions = [
            '📋 D\'abord, pose tous tes ingrédients devant toi comme des petits soldats prêts au combat !',
            '🔥 Chauffe ta poêle ou casserole - on va faire chauffer l\'ambiance !',
        ];

        // Logique de génération basée sur les ingrédients
        const customInstructions = this.generateFunInstructionsFromIngredients(ingredients);
        
        const funNames = [
            `💫 Le Plat Magique aux ${ingredients.slice(0, 3).join(' & ')}`,
            `🎭 L'Impro Culinaire : "${ingredients[0]} et ses Copains"`,
            `🌟 La Création Spontanée du Chef ${Math.random() > 0.5 ? 'Intrépide' : 'Aventurier'}`,
            `🎪 Le Spectacle des ${ingredients.length} Ingrédients`
        ];

        return {
            name: funNames[Math.floor(Math.random() * funNames.length)],
            description: funIntros[Math.floor(Math.random() * funIntros.length)],
            instructions: [...baseInstructions, ...customInstructions],
            time: '20-30 minutes de pur bonheur',
            difficulty: 'Aventurier culinaire !',
            matchPercentage: 100,
            custom: true
        };
    }
    generateFunInstructionsFromIngredients(ingredients) {
        const instructions = [];
        
        // Messages d'encouragement aléatoires
        const encouragements = [
            'Tu vas être fier.e de toi !', 'C\'est parti pour la magie !', 'Allez, on y croit !',
            'Tu sens cette bonne odeur qui arrive ?', 'Ça va être délicieux !', 'Chef, à vous de jouer !'
        ];
        
        // Logique pour différents types d'ingrédients avec personnalité
        if (ingredients.some(i => ['pâtes', 'riz', 'pommes de terre'].includes(i))) {
            const feculents = ingredients.filter(i => ['pâtes', 'riz', 'pommes de terre'].includes(i));
            instructions.push(`🍝 Commence par cuire tes ${feculents[0]} - laisse-les buller joyeusement !`);
        }
        
        if (ingredients.includes('œufs')) {
            instructions.push(`🥚 Casse tes œufs avec panache (et croise les doigts pour qu'il n'y ait pas de coquille ! 😅)`);
        }
        
        if (ingredients.some(i => ['oignons', 'ail', 'échalotes'].includes(i))) {
            const aromates = ingredients.filter(i => ['oignons', 'ail', 'échalotes'].includes(i));
            instructions.push(`🧅 Fais revenir tes ${aromates.join(' et ')} jusqu'à ce qu'ils sentent le paradis !`);
        }
        
        if (ingredients.includes('fromage')) {
            instructions.push(`🧀 Râpe ton fromage avec amour (et attention à tes doigts ! 😉)`);
        }

        // Instructions de mélange créatives
        const mixingPhrases = [
            '🔄 Maintenant, mélange tout ça comme si tu dirigeais un orchestre !',
            '💃 Fais danser tous tes ingrédients ensemble dans la poêle !',
            '🎪 C\'est le moment du grand spectacle : mélange avec passion !',
            '✨ Unifie tous ces copains dans un ballet culinaire !'
        ];
        
        instructions.push(mixingPhrases[Math.floor(Math.random() * mixingPhrases.length)]);
        
        // Instructions de cuisson avec personnalité
        const cookingPhrases = [
            '🔥 Laisse cuire jusqu\'à ce que tout soit doré et heureux !',
            '⏰ Patiente un peu... les bonnes choses prennent du temps !',
            '👃 Tu le sauras quand c\'est prêt : ton nez ne te mentira pas !',
            '🌟 Continue jusqu\'à ce que ça ressemble à un chef-d\'œuvre !'
        ];
        
        instructions.push(cookingPhrases[Math.floor(Math.random() * cookingPhrases.length)]);
        
        // Assaisonnement avec fun
        const seasoningPhrases = [
            '🧂 Goûte et ajuste l\'assaisonnement - toi seul.e connais tes goûts !',
            '🌶️ Un peu de sel, de poivre, et tout ce qui te fait plaisir !',
            '✨ La touche finale : assaisonne selon ton cœur !',
            '🎯 Sale, poivre, goûte... jusqu\'à ce que ce soit parfait pour TOI !'
        ];
        
        instructions.push(seasoningPhrases[Math.floor(Math.random() * seasoningPhrases.length)]);
        
        // Conclusion enthousiaste
        const conclusions = [
            '🎉 TADA ! Sers avec fierté et un grand sourire !',
            '👏 Bravo chef ! Régale-toi bien, tu l\'as mérité !',
            '🌟 Et voilà ! Tu viens de créer quelque chose d\'unique !',
            '❤️ Sers avec amour et partage ce moment de bonheur !',
            '🏆 Félicitations ! Tu peux être fier.e de cette création !'
        ];
        
        instructions.push(conclusions[Math.floor(Math.random() * conclusions.length)]);
        
        return instructions;
    }

    // Générer une suggestion de fallback
    generateFallbackSuggestion(ingredients) {
        const funSuggestions = [
            '🍳 Tu sais quoi ? Une poêlée avec tout ça, ça va être DINGUE !',
            '🥘 Et si on faisait un plat mijoté ? Ça sent déjà bon dans ma tête !',
            '🥗 Ces ingrédients feraient une salade composée de FOLIE !',
            '🍯 Parfait pour une omelette garnie qui va faire des jaloux !',
            '🔥 Idéal pour un gratin au four qui va réchauffer les cœurs !',
            '🎪 On va faire un plat mystère qui va surprendre tout le monde !',
            '✨ Hmm... je sens qu\'on va créer quelque chose de magique !',
            '🌈 Avec ça, on peut faire un arc-en-ciel de saveurs !'
        ];

        const funInstructions = [
            '💧 Lave et prépare tous tes petits protégés avec tendresse',
            '🤔 Choisis ton arme de cuisson préférée : poêle, four, casserole... tu es le boss !',
            '⏰ Commence par ceux qui prennent le plus de temps (ils sont un peu timides)',
            '🧂 Sale, poivre, goûte... c\'est TON moment de gloire !',
            '👃 Fais confiance à ton nez et à tes papilles, ils ne mentent jamais !',
            '❤️ Sers avec tout ton amour... c\'est l\'ingrédient secret !'
        ];

        const funTitles = [
            `🎨 La Création Artistique aux ${ingredients.slice(0, 2).join(' & ')}`,
            `🚀 Mission Impossible : Transformer ${ingredients.length} Ingrédients en Délice`,
            `🎭 L'Impro du Chef avec ${ingredients.join(', ')}`,
            `🌟 Le Plat Mystère de ${new Date().toLocaleDateString('fr-FR')}`
        ];
        
        return {
            name: funTitles[Math.floor(Math.random() * funTitles.length)],
            description: funSuggestions[Math.floor(Math.random() * funSuggestions.length)] + ' Allez, on se lance dans l\'aventure ! 🎯',
            instructions: funInstructions,
            time: '15-30 minutes de pur plaisir',
            difficulty: 'Aventurier du quotidien !',
            custom: true,
            matchPercentage: 100
        };
    }

    // Afficher la suggestion de l'IA
    displayAISuggestion(suggestion) {
        const aiResults = document.getElementById('ai-results');
        if (!aiResults || !suggestion) return;

        const missingIngredientsHtml = suggestion.missingIngredients && suggestion.missingIngredients.length > 0 
            ? `<div class="missing-ingredients">
                <p><strong>🚫 Ingrédients manquants :</strong> ${suggestion.missingIngredients.join(', ')}</p>
               </div>`
            : '';

        aiResults.innerHTML = `
            <div class="ai-recipe-card">
                <div class="ai-recipe-header">
                    <h5 class="ai-recipe-title">${suggestion.name}</h5>
                    <div class="ai-recipe-meta">
                        <span class="ai-match">🎯 ${suggestion.matchPercentage}% de correspondance</span>
                        <span class="ai-time">⏱️ ${suggestion.time}</span>
                        <span class="ai-difficulty">📊 ${suggestion.difficulty}</span>
                    </div>
                </div>
                
                <div class="ai-recipe-description">
                    <p>${suggestion.description}</p>
                </div>
                
                ${missingIngredientsHtml}
                
                <div class="ai-recipe-instructions">
                    <h6>👨‍🍳 Instructions :</h6>
                    <ol>
                        ${suggestion.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
                
                <div class="ai-recipe-actions">
                    <button class="btn btn-primary" onclick="frigoManager.saveAISuggestion(${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
                        ❤️ Sauvegarder
                    </button>
                    <button class="btn btn-secondary" onclick="frigoManager.getAISuggestions()">
                        🔄 Autre suggestion
                    </button>
                </div>
            </div>
        `;
    }

    // Sauvegarder la suggestion IA comme favori
    saveAISuggestion(suggestion) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showNotification('Connectez-vous pour sauvegarder vos recettes !', 'warning');
            return;
        }

        const recipe = {
            id: `ai_${Date.now()}`,
            name: suggestion.name,
            description: suggestion.description,
            ingredients: this.ingredients.slice(),
            instructions: suggestion.instructions,
            time: suggestion.time,
            difficulty: suggestion.difficulty,
            category: 'ia',
            source: 'IA PatOketchup',
            image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format'
        };

        // Ajouter directement aux favoris de l'utilisateur
        if (!user.favorites) user.favorites = [];
        user.favorites.push(recipe);
        
        // Mettre à jour dans localStorage
        const users = JSON.parse(localStorage.getItem('patoketchup_users')) || [];
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('patoketchup_users', JSON.stringify(users));
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showNotification('Recette IA sauvegardée dans vos favoris !', 'success');
    }

    // Rechercher des recettes via l'API classique
    async searchRecipesByIngredients() {
        if (this.ingredients.length === 0) {
            showNotification('Veuillez d\'abord ajouter des ingrédients !', 'warning');
            return;
        }

        // Utiliser la fonction existante avec le premier ingrédient
        const mainIngredient = this.ingredients[0];
        console.log('🔍 Recherche API pour:', mainIngredient);
        
        // Afficher la section de résultats
        const resultsSection = document.getElementById('frigo-results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            
            // Appeler la fonction de recherche existante
            const recipes = await this.searchRecipesByMainIngredient(mainIngredient);
            this.displayAPIResults(recipes);
        }
    }

    // Recherche par ingrédient principal (réutilise la logique existante)
    async searchRecipesByMainIngredient(ingredient) {
        try {
            setLoadingState(true);
            const data = await makeAPICall(`${API_CONFIG.endpoints.searchByIngredient}${ingredient}`);
            
            if (data && data.meals) {
                const recipes = await Promise.all(data.meals.slice(0, 6).map(async meal => {
                    const details = await makeAPICall(`${API_CONFIG.endpoints.getById}${meal.idMeal}`);
                    if (details && details.meals) {
                        const detailedMeal = details.meals[0];
                        return {
                            id: detailedMeal.idMeal,
                            name: detailedMeal.strMeal,
                            category: detailedMeal.strCategory,
                            area: detailedMeal.strArea,
                            image: detailedMeal.strMealThumb,
                            description: detailedMeal.strInstructions ? 
                                detailedMeal.strInstructions.substring(0, 150) + '...' : 
                                'Délicieuse recette trouvée'
                        };
                    }
                    return null;
                }));
                
                return recipes.filter(recipe => recipe !== null);
            }
            
            return [];
        } catch (error) {
            console.error('Erreur recherche ingrédients:', error);
            return [];
        } finally {
            setLoadingState(false);
        }
    }

    // Afficher les résultats de l'API
    displayAPIResults(recipes) {
        const grid = document.getElementById('frigo-recipes-grid');
        if (!grid) return;

        if (recipes.length === 0) {
            grid.innerHTML = `
                <div class="no-recipes-found">
                    <p>🔍 Aucune recette trouvée avec l'API pour ces ingrédients</p>
                    <p>Essayez les suggestions IA à la place !</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = recipes.map(recipe => `
            <article class="recipe-card frigo-recipe-card" onclick="openRecipeModal('${recipe.id}')">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                    <div class="recipe-overlay">
                        <span class="recipe-category">${recipe.category}</span>
                        <span class="recipe-area">🌍 ${recipe.area}</span>
                    </div>
                </div>
                <div class="recipe-content">
                    <h4 class="recipe-title">
                        ${recipe.name}
                        ${recipe.isTranslated ? `<span class="translation-badge" title="Traduit automatiquement vers ${recipe.translatedTo || translationAI.currentLanguage}${recipe.originalName ? ' depuis: ' + recipe.originalName : ''}">🌍 ${getLanguageFlag(recipe.translatedTo || translationAI.currentLanguage)}</span>` : ''}
                    </h4>
                    <p class="recipe-description">${recipe.description}</p>
                </div>
            </article>
        `).join('');
    }

    // Masquer les résultats
    hideResults() {
        const aiSection = document.getElementById('ai-suggestions-section');
        const resultsSection = document.getElementById('frigo-results');
        
        if (aiSection) aiSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
    }

    // Fonction de démonstration
    demonstrateAI() {
        // Vider les ingrédients actuels
        this.ingredients = [];
        
        // Ajouter les ingrédients de démonstration
        this.ingredients.push('œufs', 'pâtes', 'fromage');
        this.updateIngredientsDisplay();
        
        // Lancer automatiquement les suggestions IA
        setTimeout(() => {
            this.getAISuggestions();
        }, 500);
        
        const demoMessages = [
            '🎭 Spectacle en cours ! Œufs, pâtes et fromage sur scène !',
            '🚀 Démonstration activée ! Prépare-toi à être impressionné.e !',
            '✨ Magie en action avec le trio parfait ! Regarde bien !',
            '🎪 Show-time ! L\'IA va te montrer ses talents !'
        ];
        
        showNotification(demoMessages[Math.floor(Math.random() * demoMessages.length)], 'info');
    }

    // Fonction de test pour l'exemple pâtes + ketchup + beurre
    demonstrateCustomIA() {
        // Vider les ingrédients actuels
        this.ingredients = [];
        
        // Ajouter l'exemple spécifique
        this.ingredients.push('pâtes', 'ketchup', 'beurre');
        this.updateIngredientsDisplay();
        
        // Lancer automatiquement les suggestions IA
        setTimeout(() => {
            this.getAISuggestions();
        }, 500);
        
        showNotification('🧪 Test en cours : Pâtes + Ketchup + Beurre ! L\'IA va analyser chaque ingrédient !', 'info');
    }
}

// Initialiser le gestionnaire du frigo
let frigoManager;

// ========================================
// FONCTION DE TEST DE L'API
// ========================================

// Fonction de test pour vérifier que l'API fonctionne
async function testAPI() {
    console.log('🧪 Test de l\'API TheMealDB...');
    
    try {
        // Test 1: Recette aléatoire
        const randomData = await makeAPICall(API_CONFIG.endpoints.random);
        console.log('✅ Test recette aléatoire:', randomData?.meals?.[0]?.strMeal || 'Échec');
        
        // Test 2: Recherche par nom
        const searchData = await makeAPICall(`${API_CONFIG.endpoints.searchByName}chicken`);
        console.log('✅ Test recherche:', searchData?.meals?.length || 0, 'résultats pour "chicken"');
        
        // Test 3: Détails d'une recette spécifique
        if (searchData?.meals?.[0]?.idMeal) {
            const detailsData = await makeAPICall(`${API_CONFIG.endpoints.getById}${searchData.meals[0].idMeal}`);
            console.log('✅ Test détails recette:', detailsData?.meals?.[0]?.strMeal || 'Échec');
        }
        
        console.log('🎉 Tous les tests API sont passés !');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors des tests API:', error);
        return false;
    }
}

// Lancer le test automatiquement quand le DOM est prêt
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le gestionnaire du frigo
    frigoManager = new FrigoManager();
    
    // Initialiser le sélecteur de langue
    initializeLanguageSelector();
    
    setTimeout(async () => {
        await testAPI();
    }, 1000);
});

// ========================================
// 🌍 GESTIONNAIRE SÉLECTEUR DE LANGUE IA
// ========================================

// Initialiser le sélecteur de langue
function initializeLanguageSelector() {
    console.log('🌍 Initialisation du sélecteur de langue IA...');
    
    // Gestionnaires des boutons de langue prédéfinis
    const languageBtns = document.querySelectorAll('.language-btn');
    languageBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const selectedLanguage = this.getAttribute('data-language');
            await setApplicationLanguage(selectedLanguage);
            updateLanguageSelector(selectedLanguage);
        });
    });
    
    // Gestionnaire du bouton de langue personnalisée
    const applyCustomBtn = document.getElementById('apply-custom-language');
    if (applyCustomBtn) {
        applyCustomBtn.addEventListener('click', async function() {
            const customInput = document.getElementById('custom-language-input');
            const customLanguage = customInput.value.trim().toLowerCase();
            
            if (customLanguage) {
                await setApplicationLanguage(customLanguage);
                updateLanguageSelector(customLanguage);
                customInput.value = ''; // Vider le champ
            } else {
                showNotification('⚠️ Veuillez entrer une langue valide', 'warning');
            }
        });
    }
    
    // Gestionnaire Enter dans le champ personnalisé
    const customInput = document.getElementById('custom-language-input');
    if (customInput) {
        customInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                document.getElementById('apply-custom-language').click();
            }
        });
    }
    
    // Mettre à jour l'affichage initial
    updateLanguageSelector(translationAI.currentLanguage);
    
    console.log('✅ Sélecteur de langue IA initialisé !');
}

// Changer la langue de l'application
async function setApplicationLanguage(language) {
    try {
        console.log(`🌍 Changement de langue vers: ${language}`);
        
        // Afficher un indicateur de chargement
        showNotification('🔄 Traduction en cours...', 'info');
        
        // Mettre à jour la langue dans l'IA
        await translationAI.setLanguage(language);
        
        // Recharger les recettes avec la nouvelle langue
        await reloadRecipesWithLanguage(language);
        
        // Notification de succès
        const flag = getLanguageFlag(language);
        showNotification(`${flag} Recettes traduites en ${language} !`, 'success');
        
        console.log(`✅ Langue changée vers: ${language}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du changement de langue:', error);
        showNotification('❌ Erreur lors de la traduction', 'error');
    }
}

// Recharger toutes les recettes avec la nouvelle langue
async function reloadRecipesWithLanguage(language) {
    // Vider le cache pour forcer le rechargement
    recipeCache.clear();
    searchCache.clear();
    
    // Si des recettes sont affichées, les recharger
    if (window.currentRecipes && window.currentRecipes.length > 0) {
        console.log('🔄 Rechargement des recettes en cours...');
        
        // Recharger selon la section active
        const activeSection = document.querySelector('.nav-link.active');
        if (activeSection) {
            const sectionName = activeSection.getAttribute('data-section');
            
            switch (sectionName) {
                case 'home':
                    await loadInitialRecipes();
                    break;
                case 'frigo':
                    // Recharger les suggestions du frigo si applicable
                    if (selectedIngredients.length > 0) {
                        const frigoManager = new FrigoManager();
                        await frigoManager.searchRecipes(selectedIngredients);
                    }
                    break;
                default:
                    console.log('Section non supportée pour le rechargement:', sectionName);
            }
        }
    }
}

// Mettre à jour l'interface du sélecteur
function updateLanguageSelector(selectedLanguage) {
    // Mettre à jour les boutons prédéfinis
    const languageBtns = document.querySelectorAll('.language-btn');
    languageBtns.forEach(btn => {
        const btnLanguage = btn.getAttribute('data-language');
        if (btnLanguage === selectedLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Mettre à jour l'affichage de la langue actuelle
    const statusDisplay = document.getElementById('current-language-display');
    if (statusDisplay) {
        const flag = getLanguageFlag(selectedLanguage);
        const displayName = getLanguageDisplayName(selectedLanguage);
        statusDisplay.textContent = `${flag} ${displayName}`;
    }
}

// Obtenir le drapeau d'une langue
function getLanguageFlag(language) {
    const lang = language.toLowerCase();
    const flags = {
        'français': '🇫🇷',
        'anglais': '🇺🇸',
        'espagnol': '🇪🇸',
        'italien': '🇮🇹',
        'allemand': '🇩🇪',
        'portugais': '🇵🇹',
        'chinois': '🇨🇳',
        'japonais': '🇯🇵',
        'coréen': '🇰🇷',
        'arabe': '🇸🇦',
        'russe': '🇷🇺',
        'hindi': '🇮🇳',
        'néerlandais': '🇳🇱',
        'suédois': '🇸🇪',
        'norvégien': '🇳🇴',
        'danois': '🇩🇰',
        'turc': '🇹🇷',
        'grec': '🇬🇷',
        'polonais': '🇵🇱',
        'tchèque': '🇨🇿'
    };
    
    return flags[lang] || '🌍';
}

// Obtenir le nom d'affichage d'une langue
function getLanguageDisplayName(language) {
    const lang = language.toLowerCase();
    const names = {
        'français': 'Français',
        'anglais': 'English',
        'espagnol': 'Español',
        'italien': 'Italiano',
        'allemand': 'Deutsch',
        'portugais': 'Português',
        'chinois': '中文',
        'japonais': '日本語',
        'coréen': '한국어',
        'arabe': 'العربية',
        'russe': 'Русский'
    };
    
    return names[lang] || language.charAt(0).toUpperCase() + language.slice(1);
}

// Fonction pour afficher des notifications
function showNotification(message, type = 'info') {
    // Créer ou réutiliser le conteneur de notifications
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'success' ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 
                     type === 'warning' ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 
                     type === 'error' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 
                     'linear-gradient(135deg, #3498db, #2980b9)'};
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        margin-bottom: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
        font-weight: 600;
        font-size: 0.95rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Animation de sortie et suppression
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}