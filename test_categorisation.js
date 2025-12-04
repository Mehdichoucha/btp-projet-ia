// Test de la fonction de catégorisation des desserts
function detectRecipeCategory(recipe) {
    const name = (recipe.name || '').toLowerCase();
    const description = (recipe.description || '').toLowerCase();
    const category = (recipe.category || '').toLowerCase();
    const fullText = `${name} ${description} ${category}`;
    
    console.log(`🔍 Analyse recette: "${recipe.name}" - Texte: "${fullText.substring(0, 100)}..."`);
    
    // Mots-clés pour recettes sucrées (TOUS LES DESSERTS)
    const sweetKeywords = [
        // Desserts en anglais
        'cake', 'cookie', 'dessert', 'sweet', 'chocolate', 'sugar', 'candy',
        'pie', 'tart', 'cream', 'ice cream', 'pudding', 'brownie', 'muffin',
        'banana bread', 'cheesecake', 'cookies', 'cupcake', 'donut', 'macaron', 
        'mousse', 'soufflé', 'pancake', 'waffle', 'tiramisu', 'flan', 'crumble',
        'cobbler', 'parfait', 'sundae', 'float', 'shake', 'smoothie bowl',
        'fruit salad', 'berry', 'strawberry', 'blueberry', 'raspberry',
        'apple pie', 'lemon', 'vanilla', 'caramel', 'honey', 'maple',
        'cinnamon', 'nutella', 'frosting', 'icing', 'jam', 'jelly',
        'marshmallow', 'whipped cream', 'custard', 'gelato', 'sorbet',
        
        // Desserts en français
        'gâteau', 'sucré', 'chocolat', 'sucre', 'crème', 'glace', 'dessert',
        'tarte', 'biscuit', 'bonbon', 'pâtisserie', 'confiture', 'miel',
        'vanille', 'caramel', 'cannelle', 'fraise', 'pomme', 'citron',
        'fruits', 'baies', 'chantilly', 'crème anglaise', 'sorbet',
        
        // Types de plats sucrés spécifiques
        'birthday cake', 'wedding cake', 'layer cake', 'pound cake',
        'sponge cake', 'chocolate cake', 'carrot cake', 'red velvet',
        'fruit cake', 'coffee cake', 'bundt cake', 'sheet cake'
    ];
    
    // Mots-clés pour recettes végétariennes
    const vegKeywords = [
        'vegetarian', 'vegan', 'veggie', 'vegetables', 'salad', 'tofu',
        'quinoa', 'beans', 'lentils', 'vegetable', 'plant', 'herb',
        'végétarien', 'végétalien', 'légume', 'salade', 'haricot', 'lentille',
        'quinoa', 'tofu', 'plante', 'herbe', 'spinach', 'broccoli', 'avocado',
        'chickpea', 'mushroom', 'zucchini', 'eggplant', 'artichoke'
    ];
    
    // Vérifier recettes sucrées en PREMIER ABSOLU (priorité maximale)
    // Chercher dans le nom, description, catégorie ET ingrédients
    const ingredients = Array.isArray(recipe.ingredients) ? 
        recipe.ingredients.join(' ').toLowerCase() : '';
    const fullTextWithIngredients = `${fullText} ${ingredients}`;
    
    const sweetMatch = sweetKeywords.find(keyword => fullTextWithIngredients.includes(keyword));
    if (sweetMatch) {
        console.log(`🧁 RECETTE SUCRÉE détectée: "${recipe.name}" (mot-clé: "${sweetMatch}")`);
        return 'sucrees';
    }
    
    // Vérification supplémentaire pour les desserts cachés
    if (name.includes('sweet') || description.includes('sweet') || 
        category.includes('sweet') || category.includes('dessert') ||
        name.includes('cake') || name.includes('pie') || name.includes('cookie')) {
        console.log(`🧁 RECETTE SUCRÉE détectée (vérification supplémentaire): "${recipe.name}"`);
        return 'sucrees';
    }
    
    // Vérifier recettes végétariennes
    const vegMatch = vegKeywords.find(keyword => fullText.includes(keyword));
    if (vegMatch || category.includes('vegetarian') || 
        (recipe.area && recipe.area.toLowerCase().includes('vegetarian'))) {
        console.log(`🥬 RECETTE VÉGÉTARIENNE détectée: "${recipe.name}" (mot-clé: "${vegMatch || 'category/area'}")`);
        return 'vegetariennes';
    }
    
    // Par défaut : recettes salées
    console.log(`🥘 RECETTE SALÉE par défaut: "${recipe.name}"`);
    return 'salees';
}

// Tests avec différents types de desserts
const testRecipes = [
    {
        name: "Chocolate Chip Cookies",
        description: "Delicious homemade cookies with chocolate chips",
        category: "dessert"
    },
    {
        name: "Apple Pie", 
        description: "Traditional American apple pie with cinnamon",
        category: "dessert"
    },
    {
        name: "Tiramisu",
        description: "Classic Italian dessert with coffee and mascarpone",
        category: "dessert"
    },
    {
        name: "Cheesecake",
        description: "Rich and creamy New York style cheesecake", 
        category: "dessert"
    },
    {
        name: "Banana Bread",
        description: "Moist banana bread perfect for breakfast",
        category: "bread"
    },
    {
        name: "Ice Cream Sundae",
        description: "Vanilla ice cream with chocolate sauce and whipped cream",
        category: "dessert"
    },
    {
        name: "Grilled Chicken",
        description: "Juicy grilled chicken breast with herbs",
        category: "main course"
    },
    {
        name: "Vegetarian Salad",
        description: "Fresh mixed green salad with vegetables",
        category: "salad"
    }
];

console.log("=== TEST DE CATÉGORISATION DES DESSERTS ===\n");

testRecipes.forEach((recipe, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    const category = detectRecipeCategory(recipe);
    console.log(`✅ Résultat: ${category}\n`);
});

console.log("\n=== RÉSUMÉ DES TESTS ===");
console.log("Tous les desserts devraient être dans la catégorie 'sucrees'");