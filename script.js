// Données de l'application (stockées en mémoire pour l'instant)
let historyRecipes = [];
let favoriteRecipes = [];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Bouton créer une recette
    const createBtn = document.querySelector('.create-recipe-btn');
    createBtn.addEventListener('click', function() {
        alert('Fonctionnalité "Créer une recette" à venir !');
        // TODO: Rediriger vers la page de création de recette
    });

    // Gestion des boutons de navigation des sliders
    const sliderButtons = document.querySelectorAll('.slider-btn');
    sliderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            const direction = this.classList.contains('slider-btn-left') ? -1 : 1;
            scrollSlider(section, direction);
        });
    });

    // Charger les recettes (vide pour l'instant)
    loadRecipes();
});

// Fonction pour faire défiler les sliders
function scrollSlider(section, direction) {
    const slider = document.getElementById(`${section}-slider`);
    const scrollAmount = 300; // Pixels à défiler
    slider.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Fonction pour charger et afficher les recettes
function loadRecipes() {
    updateSlider('history', historyRecipes);
    updateSlider('favorites', favoriteRecipes);
}

// Fonction pour mettre à jour un slider
function updateSlider(section, recipes) {
    const slider = document.getElementById(`${section}-slider`);
    const buttons = document.querySelectorAll(`.slider-btn[data-section="${section}"]`);

    if (recipes.length === 0) {
        // Afficher l'état vide
        slider.innerHTML = `
            <div class="empty-state">
                <p>${section === 'history' ? 'Aucune recette dans l\'historique.' : 'Aucune recette favorite.'}</p>
                <p>${section === 'history' ? 'Créez votre première recette pour commencer !' : 'Ajoutez des recettes à vos favoris après les avoir créées !'}</p>
            </div>
        `;
        // Cacher les boutons de navigation
        buttons.forEach(btn => btn.style.display = 'none');
    } else {
        // Afficher les recettes
        slider.innerHTML = '';
        recipes.forEach(recipe => {
            const card = createRecipeCard(recipe);
            slider.appendChild(card);
        });
        // Afficher les boutons de navigation
        buttons.forEach(btn => btn.style.display = 'block');
    }
}

// Fonction pour créer une carte de recette
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
        <img src="${recipe.image || 'images/placeholder.jpg'}" alt="${recipe.title}" class="recipe-card-image">
        <div class="recipe-card-content">
            <h3 class="recipe-card-title">${recipe.title}</h3>
            <p class="recipe-card-description">${recipe.description}</p>
        </div>
    `;
    card.addEventListener('click', () => openRecipe(recipe));
    return card;
}

// Fonction pour ouvrir une recette (à implémenter)
function openRecipe(recipe) {
    alert(`Ouverture de la recette : ${recipe.title}`);
    // TODO: Afficher les détails de la recette
}

// Fonctions utilitaires pour ajouter des recettes (pour tester plus tard)
function addRecipeToHistory(recipe) {
    historyRecipes.unshift(recipe);
    updateSlider('history', historyRecipes);
}

function addRecipeToFavorites(recipe) {
    if (!favoriteRecipes.find(r => r.id === recipe.id)) {
        favoriteRecipes.unshift(recipe);
        updateSlider('favorites', favoriteRecipes);
    }
}

function removeRecipeFromFavorites(recipeId) {
    favoriteRecipes = favoriteRecipes.filter(r => r.id !== recipeId);
    updateSlider('favorites', favoriteRecipes);
}

// Exemple pour tester (à supprimer plus tard)
// Pour tester l'ajout de recettes, décommentez ces lignes:
/*
setTimeout(() => {
    addRecipeToHistory({
        id: 1,
        title: 'Pâtes à la tomate',
        description: 'Une recette simple et délicieuse',
        image: null
    });
    addRecipeToHistory({
        id: 2,
        title: 'Salade César',
        description: 'Fraîche et savoureuse',
        image: null
    });
}, 2000);
*/
