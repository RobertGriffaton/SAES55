# 🍽️ Graye - Application de Recommandation de Restaurants Intelligente

<div align="center">

![Graye Logo](./assets/LogoGrayeLong.png)

**Découvrez les meilleurs restaurants près de chez vous grâce à un algorithme adaptatif d'intelligence artificielle**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.13-000020?logo=expo)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[📱 Fonctionnalités](#-fonctionnalités) •
[🧠 Algorithme IA](#-algorithme-ia-adaptatif) •
[🚀 Installation](#-installation) •
[💻 Technologies](#-technologies) •
[📖 Documentation](#-documentation)

</div>

---

## 📋 À Propos

**Graye** est une application mobile cross-platform de recommandation de restaurants développée dans le cadre du projet universitaire SAE S5. Elle se distingue par son **algorithme adaptatif avancé** inspiré du **Multi-Armed Bandit** qui apprend continuellement de vos habitudes pour vous proposer des recommandations personnalisées et diversifiées.

### 🎯 Objectifs du Projet

- 🔍 **Découverte Intelligente** : Recommandations basées sur vos préférences et habitudes
- 🎰 **Exploration/Exploitation** : Équilibre entre restaurants familiers et nouvelles découvertes
- 🌈 **Diversité Garantie** : Système anti-répétition pour varier les plaisirs
- 📍 **Géolocalisation Précise** : Restaurants à proximité avec calcul de distance
- 👤 **Multi-Profils** : Gestion de plusieurs utilisateurs avec préférences distinctes
- ⭐ **Système de Favoris** : Sauvegardez et validez vos restaurants préférés

---

## ✨ Fonctionnalités

### 🎨 Interface Utilisateur Moderne

#### 🚀 Splash Screen Animée
- Animation fluide au démarrage avec logo Graye
- Chargement asynchrone de la base de données
- Transition fade-in/fade-out élégante

#### 📝 Onboarding Personnalisé (4 Étapes)
1. **Sélection des Cuisines** : 34+ types de cuisine disponibles
   - Afrique, Asie, Europe, Maghreb, Amérique
   - Italien, Japonais, Chinois, Libanais, Turc
   - Français, Thai, Vietnamien, Coréen, Grec
   - FastFood, Café, Pâtisserie, Crêperie, etc.

2. **Budget & Distance**
   - Budget moyen par personne (5€ - 50€+)
   - Rayon de recherche (1km - 20km)

3. **Préférences Alimentaires**
   - Régimes : Végétarien, Végan, Halal, Sans gluten
   - Ambiances : Calme, Familial, Branché, Traditionnel, Romantique

4. **Options de Service**
   - Sur place
   - À emporter
   - Livraison

### 🗺️ Navigation et Exploration

#### 📍 Vue Carte Interactive
- **Support Multi-Plateforme** :
  - `MapView.native.tsx` : React Native Maps (iOS/Android)
  - `MapView.web.tsx` : React Leaflet (Web)
- **Fonctionnalités** :
  - Marqueurs personnalisés par catégorie de cuisine
  - Géolocalisation en temps réel
  - Clusters pour les zones denses
  - Filtrage par rayon de recherche
  - Affichage de tous les restaurants (pas de limite)

#### 🔍 Vue Recherche Intelligente
- **Top 50 Restaurants** personnalisés selon votre profil
- **Filtres Avancés** :
  - Recherche par nom
  - Filtrage par catégories multiples
  - Mode "À emporter" avec priorisation
  - Mode "Sur place"
  - Filtrage par localisation personnalisée
  - Seuils de score min/max configurables
- **Affichage Détaillé** :
  - Score de match en pourcentage (0-100%)
  - Distance en km
  - Catégories de cuisine
  - Indicateurs visuels (végétarien, végan, halal)
- **Pagination** : Navigation par pages de 10 restaurants
- **Bouton Reset** : Réinitialisation complète de l'algorithme

#### ⭐ Vue Favoris
- **Deux Catégories** :
  - Favoris validés (restaurants testés et approuvés)
  - Liste d'envie (à essayer)
- **Gestion Complète** :
  - Ajout/Suppression de favoris
  - Validation/Dévalidation
  - Statistiques par profil
- **Partage** : Export de vos favoris en image

#### ⚙️ Vue Paramètres
- **Gestion Multi-Profils** :
  - Création de profils utilisateur
  - Avatars personnalisés (🍔🍕🍣🌮🧁)
  - Système de niveaux et XP
  - Changement de profil à la volée
- **Modification des Préférences** :
  - Mise à jour des cuisines préférées
  - Ajustement budget/distance
  - Changement de régime alimentaire
- **Historique** : Consultation des restaurants visités

### 🏪 Vue Détail Restaurant

- **Informations Complètes** :
  - Nom, adresse, coordonnées GPS
  - Score de match personnalisé
  - Distance depuis votre position
  - Types de cuisine
  - Options (végétarien, végan, halal, takeaway)
  
- **Actions Rapides** :
  - 📞 Appel téléphonique
  - 🌐 Site web
  - 🗺️ Itinéraire (Google Maps/Apple Maps)
  - ⭐ Ajout aux favoris
  
- **Image Dynamique** : 40+ images de catégories via `ImageMapping.ts`

---

## 🧠 Algorithme IA Adaptatif

### 🎰 Multi-Armed Bandit (Exploration/Exploitation)

L'algorithme V4 implémente une stratégie inspirée du **problème du bandit manchot** pour équilibrer :
- **Exploitation** : Recommander ce que vous aimez déjà
- **Exploration** : Vous faire découvrir de nouveaux restaurants

#### 📊 Formule de Scoring

```typescript
Score Final = Score Base (100pts)
            + Bonus Préférences (25pts)
            + Bonus Habitudes (10pts × fréquence)
            + Bonus Fidélité (10pts × visites, max 50pts)
            + Boost Exploration (60pts, 35% de chance)
            + Bruit Aléatoire (0-5pts, change chaque heure)
            - Pénalité Distance (8pts/km)
            - Pénalité Régime Incompatible (200pts)
```

#### 🎲 Paramètres Clés

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `EXPLORATION_PROBABILITY` | 35% | Chance qu'un restaurant inconnu soit boosté |
| `EXPLORATION_BOOST` | 60pts | Bonus massif pour propulser la découverte |
| `MAX_PER_CUISINE` | 10 | Max de restaurants par type dans le top 50 |
| `PENALTY_DISTANCE` | 8pts/km | Pénalité par kilomètre |
| `BONUS_PREFERENCE` | 25pts | Bonus si correspond aux préférences |

#### 🌈 Système de Diversité

- **Limitation par Type** : Maximum 10 restaurants du même type dans le top 50
- **Distribution Équilibrée** : Garantit au moins 8 types de cuisine différents
- **Anti-Répétition** : Seed aléatoire basé sur l'heure (change toutes les heures)

#### 📈 Normalisation des Scores

Les scores bruts sont normalisés en **pourcentage de match (0-100%)** :
```typescript
matchPercentage = ((score - minScore) / (maxScore - minScore)) × 100
```

Cela permet une compréhension intuitive : **95% = excellent match**, **60% = match moyen**.

#### 🔄 Apprentissage Continu

L'algorithme enregistre vos interactions dans SQLite :
- **Actions Trackées** : `click`, `call`, `route`, `view`, `website`
- **Poids des Actions** :
  - Clic sur restaurant : +1 point
  - Appel téléphonique : +3 points
  - Itinéraire : +2 points
  - Visite du site web : +1 point
- **Mise à Jour en Temps Réel** : Les préférences s'affinent à chaque utilisation

#### 🗺️ Mapping Intelligent des Cuisines

Le système utilise un mapping sophistiqué pour faire correspondre vos préférences aux tags des restaurants :

```typescript
"Italien" → ["italien", "pizza", "italiano", "pasta"]
"Japonais" → ["japonais", "sushi", "ramen", "japanese"]
"Maghreb" → ["kebab", "maghreb", "oriental", "halal"]
// ... 34 mappings au total
```

---

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optionnel)

### Installation Locale

```bash
# 1. Cloner le repository
git clone https://github.com/RobertGriffaton/SAES55.git

# 2. Naviguer dans le dossier
cd SAES55

# 3. Installer les dépendances
npm install

# 4. Lancer l'application
npm start
```

### Lancement sur Différentes Plateformes

```bash
# Android (nécessite Android Studio ou émulateur)
npm run android

# iOS (macOS uniquement, nécessite Xcode)
npm run ios

# Web (navigateur)
npm run web
```

### 📱 Utilisation avec Expo Go

1. Installez **Expo Go** sur votre smartphone
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Lancez `npm start`

3. Scannez le QR code affiché dans le terminal

---

## 💻 Technologies

### Stack Technique

| Technologie | Version | Utilisation |
|------------|---------|-------------|
| **React** | 19.1.0 | Bibliothèque UI |
| **React Native** | 0.81.4 | Framework mobile cross-platform |
| **TypeScript** | 5.9.2 | Typage statique et sécurité du code |
| **Expo** | ~54.0.13 | Plateforme de développement et build |

### Dépendances Principales

#### Navigation & UI
- `@expo/vector-icons` (15.0.3) : Icônes Ionicons
- `react-native-safe-area-context` (5.6.0) : Gestion des zones sûres
- `nativewind` (4.2.1) : Styling avec Tailwind CSS
- `tailwindcss` (3.4.19) : Framework CSS utility-first

#### Cartographie
- `react-native-maps` (1.20.1) : Cartes natives (iOS/Android)
- `react-leaflet` (5.0.0) : Cartes web avec Leaflet
- `leaflet` (1.9.4) : Bibliothèque de cartographie web

#### Données & Stockage
- `expo-sqlite` (15.0.3) : Base de données SQLite native
- `@react-native-async-storage/async-storage` (2.2.0) : Stockage persistant clé-valeur

#### Géolocalisation & Permissions
- `expo-location` (19.0.7) : API de géolocalisation

#### Partage & Export
- `expo-sharing` (14.0.8) : Partage de fichiers
- `react-native-view-shot` (4.0.3) : Capture d'écran de composants

#### Web
- `react-dom` (19.1.0) : Rendu React pour le web
- `react-native-web` (0.21.0) : Adaptation React Native pour le web
- `react-native-webview` (13.15.0) : Affichage de contenu web

### Architecture du Projet

```
SAES55/
├── 📁 assets/                          # Ressources statiques
│   ├── LogoGrayeLong.png              # Logo principal
│   ├── icon.png                       # Icône de l'application
│   ├── splash-icon.png                # Splash screen
│   └── imagescover/                   # Images de catégories (40+)
│
├── 📁 src/
│   ├── 📁 components/                 # Composants réutilisables
│   │   ├── BottomNavBar.tsx          # Barre de navigation (3 onglets)
│   │   ├── RestaurantCard.tsx        # Carte d'affichage restaurant
│   │   └── SplashScreen.tsx          # Écran de démarrage animé
│   │
│   ├── 📁 context/                    # Contextes React
│   │   └── ProfileContext.tsx        # Gestion du profil actif
│   │
│   ├── 📁 controllers/                # Logique métier
│   │   ├── NavigationController.tsx  # Navigation principale
│   │   ├── PreferencesController.ts  # Gestion des préférences
│   │   └── ProfileController.ts      # Gestion des profils utilisateur
│   │
│   ├── 📁 data/                       # Données statiques
│   │   ├── restaurants.json          # Dataset principal (11 MB, ~5000 restaurants)
│   │   ├── restaurants_v1.json       # Dataset étendu (29 MB)
│   │   └── restaurants copy.json     # Backup
│   │
│   ├── 📁 models/                     # Types TypeScript
│   │   ├── PreferencesModel.ts       # Types des préférences utilisateur
│   │   ├── TabModel.ts               # Types de navigation
│   │   └── MapModel.ts               # Types pour la carte
│   │
│   ├── 📁 services/                   # Services métier
│   │   ├── Database.ts               # Interface TypeScript
│   │   ├── Database.native.ts        # Implémentation SQLite (mobile)
│   │   ├── Database.web.ts           # Implémentation LocalStorage (web)
│   │   └── RecommendationService.ts  # Algorithme IA (458 lignes)
│   │
│   ├── 📁 styles/                     # Thème global
│   │   └── theme.ts                  # Couleurs et styles
│   │
│   ├── 📁 utils/                      # Utilitaires
│   │   └── ImageMapping.ts           # Mapping images/catégories
│   │
│   └── 📁 views/                      # Écrans de l'application
│       ├── OnboardingPreferencesView.tsx  # Configuration initiale
│       ├── SearchView.tsx                 # Recherche et recommandations
│       ├── MapView.native.tsx             # Carte (mobile)
│       ├── MapView.web.tsx                # Carte (web)
│       ├── FavoritesView.tsx              # Gestion des favoris
│       ├── SettingsView.tsx               # Paramètres et profils
│       └── RestaurantDetailView.tsx       # Détails d'un restaurant
│
├── App.tsx                            # Point d'entrée principal
├── index.ts                           # Enregistrement de l'app
├── app.json                           # Configuration Expo
├── package.json                       # Dépendances npm
├── tsconfig.json                      # Configuration TypeScript
├── tailwind.config.js                 # Configuration Tailwind
├── babel.config.js                    # Configuration Babel
└── metro.config.js                    # Configuration Metro bundler
```

---

## 📖 Documentation Technique

### 🗂️ Modèles de Données

#### UserPreferences

```typescript
interface UserPreferences {
  cuisines: Cuisine[];           // Cuisines préférées (tableau)
  budgetEuro: number;            // Budget moyen par personne (5-50€)
  distanceKm: number;            // Rayon de recherche max (1-20km)
  diet: Diet;                    // Régime alimentaire
  ambiance: Ambiance | null;     // Ambiance préférée (optionnel)
  options: {
    surPlace: boolean;           // Consommation sur place
    emporter: boolean;           // Service à emporter
    livraison: boolean;          // Service de livraison
  };
}
```

#### UserProfile

```typescript
interface UserProfile {
  id: string;                    // Identifiant unique
  name: string;                  // Nom du profil
  avatar: AvatarId;              // Avatar (burger, pizza, sushi, taco, cupcake)
  level: number;                 // Niveau (gamification)
  xp: number;                    // Points d'expérience
  createdAt: string;             // Date de création (ISO)
  preferences: UserPreferences;  // Préférences associées
}
```

#### Types Disponibles

```typescript
// 34 types de cuisine
type Cuisine = 
  | "Afrique" | "Asie" | "Europe" | "Maghreb" | "Amérique"
  | "Inde" | "Italien" | "Japonais" | "Chinois" | "Libanais"
  | "Turc" | "Mexique" | "Français" | "Asiatique" | "Thai"
  | "Vietnamien" | "Coréen" | "Oriental" | "Grec" | "Latino"
  | "Poulet" | "Sandwich" | "FastFood" | "Café" | "Pâtisserie"
  | "Crêperie" | "Grill" | "FruitsDeMer" | "Américain" | "Espagnol"
  | "Créole" | "Méditerranéen" | "BubbleTea";

// Régimes alimentaires
type Diet = "Végétarien" | "Végan" | "Halal" | "Sans gluten" | "Aucune";

// Ambiances
type Ambiance = "Calme" | "Familial" | "Branché" | "Traditionnel" | "Romantique";

// Avatars
type AvatarId = 'burger' | 'pizza' | 'sushi' | 'taco' | 'cupcake';
```

### 🔌 API des Services

#### RecommendationService

```typescript
/**
 * Obtenir les recommandations adaptatives
 * @param forceLat - Latitude forcée (optionnel)
 * @param forceLon - Longitude forcée (optionnel)
 * @param radiusKm - Rayon de recherche en km (défaut: 20)
 * @param minScore - Score minimum (défaut: 50)
 * @param maxScore - Score maximum (défaut: 500)
 * @returns Tableau de restaurants scorés et triés
 */
getAdaptiveRecommendations(
  forceLat?: number,
  forceLon?: number,
  radiusKm: number = 20,
  minScore?: number,
  maxScore?: number
): Promise<Restaurant[]>

/**
 * Vider le cache et réinitialiser l'algorithme
 * Réinitialise également toutes les interactions
 */
clearRecommendationCache(): Promise<void>

/**
 * Vérifier si un refresh est nécessaire
 * @returns true si un refresh a été demandé
 */
checkAndResetRefreshFlag(): boolean
```

#### Database Service (Interface)

```typescript
// Initialisation
initDatabase(): Promise<void>

// Restaurants
getAllRestaurants(): Promise<Restaurant[]>
getRestaurantsNearby(lat: number, lon: number, radiusKm: number): Promise<Restaurant[]>
searchRestaurants(prefs: UserPreferences): Promise<Restaurant[]>

// Utilisateurs
createUser(username: string, avatar?: string): Promise<number | null>
getUser(id: number): Promise<User>
getAllUsers(): Promise<User[]>

// Interactions (pour l'algorithme)
type InteractionAction = 'click' | 'call' | 'route' | 'view' | 'website';
logInteraction(restaurantId: number, cuisine: string, action: InteractionAction): Promise<void>
getUserHabits(): Promise<Record<string, number>>
getRestaurantPopularity(): Promise<Record<number, number>>
resetAllInteractions(): Promise<void>

// Favoris
addFavorite(restaurantId: number, userId?: string): Promise<void>
removeFavorite(restaurantId: number, userId?: string): Promise<void>
validateFavorite(restaurantId: number, userId?: string): Promise<void>
unvalidateFavorite(restaurantId: number, userId?: string): Promise<void>
getFavorites(userId?: string, validated?: boolean): Promise<Restaurant[]>
isFavorite(restaurantId: number, userId?: string): Promise<boolean>
```

#### PreferencesController

```typescript
/**
 * Récupérer les préférences du profil actif
 */
getPreferences(): Promise<UserPreferences>

/**
 * Sauvegarder les préférences du profil actif
 */
savePreferences(prefs: UserPreferences): Promise<void>

/**
 * Réinitialiser aux préférences par défaut
 */
resetPreferences(): Promise<void>
```

#### ProfileController

```typescript
/**
 * Créer un nouveau profil utilisateur
 */
createProfile(name: string, avatar: AvatarId, preferences: UserPreferences): Promise<UserProfile>

/**
 * Récupérer tous les profils
 */
getAllProfiles(): Promise<UserProfile[]>

/**
 * Récupérer un profil par ID
 */
getProfile(id: string): Promise<UserProfile | null>

/**
 * Mettre à jour un profil
 */
updateProfile(id: string, updates: Partial<UserProfile>): Promise<void>

/**
 * Supprimer un profil
 */
deleteProfile(id: string): Promise<void>

/**
 * Ajouter de l'XP à un profil
 */
addXP(id: string, amount: number): Promise<void>
```

---

## 🎨 Design System

### Palette de Couleurs

```typescript
const colors = {
  // Couleurs principales
  primary: "#6B4EFF",        // Violet principal (boutons, accents)
  secondary: "#FF6B9D",      // Rose accent (highlights)
  
  // Arrière-plans
  background: "#FFFFFF",     // Fond blanc principal
  surface: "#F5F5F5",        // Surface grise claire (cartes)
  
  // Textes
  text: "#333333",           // Texte principal (noir doux)
  textSecondary: "#666666",  // Texte secondaire (gris foncé)
  
  // Bordures & Séparateurs
  border: "#E0E0E0",         // Bordures légères
  inactive: "#CCCCCC",       // Éléments inactifs
  
  // États
  error: "#FF5252",          // Erreurs et alertes
  success: "#4CAF50",        // Succès et validations
  warning: "#FFA726",        // Avertissements
  info: "#42A5F5",           // Informations
};
```

### Composants Principaux

#### Chip (Bouton de Sélection)
- États : actif/inactif
- Couleurs dynamiques selon l'état
- Bordures arrondies
- Animation au tap

#### RestaurantCard
- Image de catégorie dynamique
- Nom et distance
- Score de match en pourcentage
- Badges (végétarien, végan, halal)
- Catégories de cuisine

#### BottomNavBar
- 3 onglets : Carte, Recherche, Favoris
- Icônes Ionicons
- Indicateur d'onglet actif
- Navigation fluide

---

## 📊 Dataset

### Caractéristiques

- **Source** : OpenStreetMap (données réelles)
- **Taille** : ~5000 restaurants (11 MB)
- **Couverture** : France métropolitaine
- **Précision** : Coordonnées GPS exactes

### Format JSON

```json
{
  "id": 12345,
  "name": "Le Petit Bistrot",
  "type": "restaurant",
  "cuisines": "french,bistrot",
  "lat": 48.8566,
  "lon": 2.3522,
  "vegetarian": 1,
  "vegan": 0,
  "halal": 0,
  "takeaway": 1,
  "delivery": 0,
  "address": "123 Rue de la Paix, 75001 Paris",
  "phone": "+33123456789",
  "website": "https://example.com"
}
```

### Champs Disponibles

| Champ | Type | Description |
|-------|------|-------------|
| `id` | number | Identifiant unique |
| `name` | string | Nom du restaurant |
| `type` | string | Type (restaurant, cafe, fast_food, etc.) |
| `cuisines` | string | Types de cuisine (séparés par virgule) |
| `lat` | number | Latitude GPS |
| `lon` | number | Longitude GPS |
| `vegetarian` | 0/1 | Options végétariennes disponibles |
| `vegan` | 0/1 | Options véganes disponibles |
| `halal` | 0/1 | Nourriture halal |
| `takeaway` | 0/1 | Service à emporter |
| `delivery` | 0/1 | Service de livraison |
| `address` | string | Adresse complète (optionnel) |
| `phone` | string | Numéro de téléphone (optionnel) |
| `website` | string | Site web (optionnel) |

---

## 🔧 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de développement Expo |
| `npm run android` | Lance l'app sur émulateur/appareil Android |
| `npm run ios` | Lance l'app sur simulateur/appareil iOS (macOS uniquement) |
| `npm run web` | Lance l'app dans le navigateur web |

---

## 🐛 Débogage & Troubleshooting

### Problèmes Courants

#### ❌ Erreur de dépendances manquantes

```bash
# Solution 1 : Réinstallation classique
npm install

# Solution 2 : Forcer la résolution des dépendances
npm install --legacy-peer-deps

# Solution 3 : Nettoyer le cache
npm cache clean --force
npm install
```

#### ❌ Erreur de cache Expo

```bash
# Démarrer avec cache vidé
npx expo start --clear

# Ou avec la commande courte
expo start -c
```

#### ❌ Erreur SQLite sur Web

**Cause** : SQLite n'est pas disponible dans les navigateurs web.

**Solution** : L'application utilise automatiquement `Database.web.ts` qui implémente LocalStorage comme fallback. Aucune action requise.

#### ❌ Permissions de géolocalisation refusées

**Symptômes** : La carte ne centre pas sur votre position.

**Solutions** :
1. Vérifiez les permissions dans les paramètres de votre appareil
2. Sur iOS : Paramètres → Graye → Localisation → "Lors de l'utilisation"
3. Sur Android : Paramètres → Applications → Graye → Autorisations → Localisation
4. Sur Web : Autorisez la géolocalisation dans la barre d'adresse du navigateur

#### ❌ Les restaurants ne s'affichent pas

**Vérifications** :
1. La base de données est-elle initialisée ? (vérifier les logs console)
2. Avez-vous complété l'onboarding ?
3. Y a-t-il des restaurants dans votre rayon de recherche ?
4. Essayez d'augmenter le rayon dans les paramètres

#### ❌ L'algorithme recommande toujours les mêmes restaurants

**Solutions** :
1. Utilisez le bouton "Reset" dans la vue Recherche
2. Modifiez vos préférences dans les Paramètres (cela vide automatiquement le cache)
3. Augmentez votre rayon de recherche
4. Attendez 1 heure (le seed aléatoire change automatiquement)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### Processus de Contribution

1. **Fork** le projet
2. **Créer** une branche feature
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** vos changements
   ```bash
   git commit -m 'Add: AmazingFeature'
   ```
4. **Push** vers la branche
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Ouvrir** une Pull Request

### Guidelines de Code

- ✅ Utiliser **TypeScript** avec typage strict
- ✅ Respecter l'architecture MVC existante
- ✅ Commenter les parties complexes (surtout l'algorithme)
- ✅ Tester sur **iOS, Android et Web**
- ✅ Suivre les conventions de nommage :
  - PascalCase pour les composants React
  - camelCase pour les fonctions et variables
  - UPPER_CASE pour les constantes

### Idées de Contributions

- 🌍 Ajouter le support multilingue (i18n)
- 🎨 Créer un mode sombre
- 📊 Ajouter des statistiques utilisateur
- 🔔 Implémenter des notifications push
- 🗺️ Améliorer les clusters sur la carte
- 🤖 Optimiser l'algorithme de recommandation
- 📱 Améliorer l'UX mobile

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2026 Graye Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact & Support

### Signaler un Bug

- **GitHub Issues** : [Créer un ticket](https://github.com/RobertGriffaton/SAES55/issues)
- **Template** : Décrire le problème, les étapes pour le reproduire, et votre environnement

### Demander une Fonctionnalité

- **GitHub Discussions** : [Proposer une idée](https://github.com/RobertGriffaton/SAES55/discussions)
- **Pull Request** : Implémenter directement la fonctionnalité

### Documentation

- **Wiki** : [Documentation complète](https://github.com/RobertGriffaton/SAES55/wiki)
- **README** : Ce fichier (guide de démarrage)

---

## 🙏 Remerciements

- **OpenStreetMap** pour les données de restaurants de qualité
- **Expo Team** pour leur framework de développement exceptionnel
- **React Native Community** pour les bibliothèques open-source
- **Notre équipe pédagogique** pour l'encadrement du projet SAE S5
- **Contributeurs** qui ont participé à l'amélioration du projet

---

## 📈 Statistiques du Projet

- **Lignes de Code** : ~15,000 lignes (TypeScript/TSX)
- **Composants React** : 12 composants
- **Vues** : 7 écrans principaux
- **Services** : 4 services métier
- **Algorithme** : 458 lignes (RecommendationService)
- **Dataset** : 5,000+ restaurants
- **Types de Cuisine** : 34 catégories
- **Images** : 40+ images de catégories

---

## 🗺️ Roadmap

### Version 1.1 (Prochaine)
- [ ] Mode sombre
- [ ] Support multilingue (FR/EN)
- [ ] Notifications push
- [ ] Amélioration des performances de la carte

### Version 1.2
- [ ] Système de reviews utilisateur
- [ ] Partage de favoris entre profils
- [ ] Export PDF des recommandations
- [ ] Intégration API restaurants (temps réel)

### Version 2.0
- [ ] Machine Learning avancé (TensorFlow.js)
- [ ] Recommandations collaboratives
- [ ] Réalité augmentée (AR)
- [ ] Gamification complète

---

<div align="center">

**⭐ Si vous aimez ce projet, n'hésitez pas à lui donner une étoile ! ⭐**

Made with ❤️ by the Graye Team

[🔝 Retour en haut](#️-graye---application-de-recommandation-de-restaurants-intelligente)

</div>