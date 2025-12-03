# Configuration API Spoonacular pour PatOketchup

## 🚀 Comment obtenir votre clé API Spoonacular (GRATUITE)

### Étape 1 : Inscription
1. Allez sur [spoonacular.com/food-api](https://spoonacular.com/food-api)
2. Cliquez sur "Get API Key" ou "Start Free"
3. Créez un compte gratuit avec votre email

### Étape 2 : Récupérer votre clé
1. Connectez-vous à votre compte Spoonacular
2. Allez dans votre tableau de bord (Dashboard)
3. Copiez votre "API Key"

### Étape 3 : Configuration dans PatOketchup
1. Ouvrez le fichier `script.js`
2. Trouvez la ligne : `apiKey: 'YOUR_API_KEY_HERE',`
3. Remplacez `YOUR_API_KEY_HERE` par votre vraie clé API
4. Sauvegardez le fichier

## 📊 Limites gratuites
- **150 requêtes par jour** (largement suffisant pour les tests)
- **Accès à toutes les fonctionnalités** de base
- **Pas de carte bancaire** requise

## 🔧 Exemple de configuration
```javascript
const API_CONFIG = {
    baseUrl: 'https://api.spoonacular.com/recipes',
    apiKey: 'votre-cle-api-ici', // Remplacez par votre vraie clé
    // ...
};
```

## 🎯 Fonctionnalités disponibles avec l'API
- ✅ **Recherche** dans des milliers de recettes
- ✅ **Filtres avancés** par type, régime, ingrédients
- ✅ **Détails complets** : ingrédients, instructions, nutrition
- ✅ **Images haute qualité** pour toutes les recettes
- ✅ **Recettes du monde entier** avec variety

## 🚨 Mode Fallback
Sans clé API, l'application fonctionne quand même avec :
- 6 recettes d'exemple locales
- Toutes les fonctionnalités de base
- Interface complète

## 💡 Pour la production
Pour un usage intensif, considérez l'upgrade vers un plan payant Spoonacular pour :
- Plus de requêtes par jour
- Accès aux données nutritionnelles avancées
- Support prioritaire