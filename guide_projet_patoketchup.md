  I- LE CONCEPT:
  
  patOketchup

L'app qui Transforme ce que tu as en ce que tu veux !

“Tes envies, Tes recettes”

Une expérience culinaire simple, immédiate et inspirante. L'application t'aide à créer des plats délicieux à partir de ce que tu as déjà chez toi — sans gaspillage, sans stress, sans perte de temps.

Chaque utilisateur devient un 'chef improvisé' capable de transformer ce qu'il a dans ses placards en idée pleine de goût.

II- L'ARCHITECHTURE DE L'APPLICATION :

1. ## Étape 1 : La Structure (HTML)

Nous allons construire le squelette de l'application. Crée un fichier `index.html`.

### Ce qu'il faut mettre en place :
a.  **En-tête (Header) :** Le logo "patOketchup" et la promesse ("Tes envies, Tes recettes").
b.  **Zone de recherche :** Un champ de texte pour saisir les ingrédients et un bouton "Trouver une recette".
c.  **Zone de résultats :** Un conteneur vide qui se remplira avec les cartes de recettes.



   ## Étape 2 : Le Style et l'Identité Visuelle (CSS)

Nous allons appliquer les couleurs définies dans le document patOketchup pour donner vie à l'app. Crée un fichier style.css.

La Palette de couleurs (selon le PDF) :
Fond Corail Doux : #FA9175 (Convivialité)

Tomate Rouge : #FF6347 (Action, Boutons, Titres)

Texte Blanc : #FFFFFF (Lisibilité).  #f8f9fa

Consignes CSS :
Utilise le #FA9175 comme couleur de fond principale ou en dégradé.

Stylise le bouton de recherche avec le rouge #FF6347 pour qu'il ressorte ("Call to Action").

Utilise une police sans-serif ronde (comme 'Poppins' ou 'Arial Rounded') pour le côté "fun et accessible".

Crée une classe .recipe-card pour les résultats (fond blanc, bords arrondis, ombre légère).


   ## Étape 3 : La Logique (JavaScript)

Au lieu d'écrire tout nos recettes à la main (ce qui est long et limité), on va connecter notre application à une API (Application Programming Interface).

CE QU'IL FAUT INTÉGRER: 

a. UX améliorée : Quand tu cliques sur "Voir la recette", le fond s'assombrit et la recette apparaît au centre.

b. Scroll : Si la recette est longue, tu peux scroller à l'intérieur de la fenêtre sans perdre la page principale.

c. Fermeture facile : L'utilisateur peut cliquer sur la croix OU cliquer dans le vide à côté de la fenêtre pour la fermer (un standard du web).

d. Formatage du texte : Grâce à white-space: pre-line dans le CSS, les paragraphes de la recette ne seront pas collés en un seul bloc illisible.



2. ## Liste des fonctionnalités recommandées :

Pour rendre l'application fun, pratique et utile, voici une liste des fonctionnalités qu'on doit implémenter, basées sur le concept "patOketchup" (anti-gaspi, cuisine improvisée) et les standards actuels :


a- Recherche par ingrédients (Le cœur du projet) : L'utilisateur rentre ce qu'il a dans son frigo (ex: "tomate, oeuf, oignon") et l'app propose des recettes réalisables.


b- Mode "J'ai faim tout de suite" : Un filtre pour afficher uniquement les recettes réalisables en moins de 20 minutes (la promesse "instantané" du document).


c- Jauge Anti-Gaspi : Un petit indicateur visuel (fun) montrant à quel point la recette permet de sauver des aliments.

d- Générateur de liste de courses inversée : Si une recette plaît mais qu'il manque juste un ingrédient, l'ajouter à une liste.

e- Étape par étape interactif : Une vue simple où l'utilisateur peut cocher les étapes réalisées pour ne pas se perdre.

f- Bouton "Surprends-moi" : Pour les indécis, une recette au hasard basée sur 1 ou 2 ingrédients clés.

g- Calculateur de portions : Pouvoir changer le nombre de personnes (1, 2, 4...) et voir les quantités s'ajuster automatiquement.

h- Favoris (Mon Carnet) : Sauvegarder les recettes réussies pour les refaire plus tard.

