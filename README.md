# 🍽️ Graye - Application de Recommandation de Restaurants

<div align="center">

![Graye Logo](./assets/LogoGrayeLong.png)

**Découvrez les meilleurs restaurants près de chez vous grâce à l'intelligence artificielle adaptative**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.13-000020?logo=expo)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[📱 Fonctionnalités](#-fonctionnalités) •
[🚀 Installation](#-installation) •
[💻 Technologies](#-technologies) •
[📖 Documentation](#-documentation) •
[👥 Contributeurs](#-contributeurs)

</div>

---

## 📋 À Propos

**Graye** est une application mobile innovante de recommandation de restaurants développée dans le cadre d'un projet universitaire (SAE S5). Elle utilise un algorithme adaptatif intelligent qui apprend de vos habitudes et préférences pour vous proposer les meilleures adresses gastronomiques à proximité.

### 🎯 Objectifs du Projet

- Faciliter la découverte de nouveaux restaurants
- Personnaliser l'expérience utilisateur avec l'IA
- Offrir une interface intuitive et moderne
- Géolocaliser les restaurants à proximité
- Adapter les recommandations selon les préférences alimentaires

---

## ✨ Fonctionnalités

### 🎨 Interface Utilisateur

- **Onboarding Personnalisé** : Configuration initiale des préférences en 4 étapes
  - Sélection des cuisines préférées (Africaine, Asiatique, Européenne, etc.)
  - Définition du budget moyen par personne
  - Choix de la distance maximale de recherche
  - Préférences alimentaires (Végétarien, Végan, Halal, Sans gluten)
  - Ambiance souhaitée (Calme, Familial, Branché, Traditionnel, Romantique)
  - Options de service (Sur place, À emporter, Livraison)

### 🗺️ Navigation et Exploration

- **Vue Carte Interactive** : Visualisation géographique des restaurants
  - Support natif (React Native Maps) et web (Leaflet)
  - Marqueurs personnalisés par catégorie
  - Géolocalisation en temps réel
  - Filtrage par rayon de recherche

- **Vue Recherche** : Liste intelligente de recommandations
  - Algorithme adaptatif basé sur l'IA
  - Scoring personnalisé selon vos habitudes
  - Affichage de la distance et du score
  - Tri automatique par pertinence

- **Vue Paramètres** : Gestion de votre profil
  - Modification des préférences
  - Historique de navigation
  - Paramètres de confidentialité

### 🧠 Intelligence Artificielle Adaptative

Notre algorithme de recommandation utilise plusieurs critères de scoring :

```typescript
Score Total = Score Base (100pts)
            + Bonus Préférences (50pts)
            + Bonus Habitudes (20pts × fréquence)
            - Pénalité Distance (5pts/km)
```

**Critères de Recommandation :**
- ✅ Correspondance avec vos cuisines préférées
- ✅ Analyse de votre historique de navigation
- ✅ Proximité géographique
- ✅ Respect de votre budget
- ✅ Options alimentaires (végétarien, végan, halal...)
- ✅ Disponibilité des services (sur place, emporter, livraison)

### 📱 Fonctionnalités Techniques

- **Base de Données SQLite** : Stockage local performant
- **AsyncStorage** : Persistence des préférences utilisateur
- **Géolocalisation** : Expo Location API
- **Multi-plateforme** : iOS, Android et Web
- **Offline-First** : Fonctionne sans connexion internet
- **Images Dynamiques** : 40+ catégories visuelles

---

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optionnel)
- [Git](https://git-scm.com/)

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
# Android
npm run android

# iOS (macOS uniquement)
npm run ios

# Web
npm run web
```

### Configuration Expo Go

1. Installez **Expo Go** sur votre smartphone
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scannez le QR code affiché après `npm start`

---

## 💻 Technologies

### Core Technologies

| Technologie | Version | Description |
|------------|---------|-------------|
| **React** | 19.1.0 | Bibliothèque UI |
| **React Native** | 0.81.4 | Framework mobile |
| **TypeScript** | 5.9.2 | Typage statique |
| **Expo** | ~54.0.13 | Plateforme de développement |

### Bibliothèques Principales

```json
{
  "navigation": "Gestion des écrans et tabs",
  "expo-sqlite": "Base de données locale",
  "expo-location": "Géolocalisation",
  "react-native-maps": "Cartes natives (iOS/Android)",
  "react-leaflet": "Cartes web",
  "@react-native-async-storage/async-storage": "Stockage persistant",
  "@expo/vector-icons": "Icônes Ionicons"
}
```

### Architecture du Projet

```
SAES55/
├── assets/                      # Ressources statiques
│   ├── LogoGrayeLong.png       # Logo de l'application
│   ├── icon.png                # Icône app
│   └── imagescover/            # Images de catégories (40+)
├── src/
│   ├── components/             # Composants réutilisables
│   │   ├── BottomNavBar.tsx   # Barre de navigation
│   │   └── RestaurantCard.tsx # Carte restaurant
│   ├── controllers/            # Logique métier
│   │   ├── NavigationController.tsx
│   │   └── PreferencesController.ts
│   ├── models/                 # Types TypeScript
│   │   ├── PreferencesModel.ts
│   │   └── TabModel.ts
│   ├── services/               # Services métier
│   │   ├── Database.ts        # SQLite (natif)
│   │   ├── Database.web.ts    # LocalStorage (web)
│   │   └── RecommendationService.ts
│   ├── styles/                 # Thème global
│   │   └── theme.ts
│   ├── views/                  # Écrans de l'app
│   │   ├── MapView.tsx
│   │   ├── SearchView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── OnboardingPreferencesView.tsx
│   │   └── RestaurantDetailView.tsx
│   └── data/
│       └── restaurants.json    # Dataset de restaurants
├── App.tsx                     # Point d'entrée
├── index.ts                    # Enregistrement de l'app
├── package.json                # Dépendances
└── tsconfig.json               # Configuration TypeScript
```

---

## 📖 Documentation

### Modèles de Données

#### UserPreferences

```typescript
interface UserPreferences {
  cuisines: Cuisine[];           // Cuisines préférées
  budgetEuro: number;            // Budget moyen/personne
  distanceKm: number;            // Rayon de recherche max
  diet: Diet;                    // Régime alimentaire
  ambiance: Ambiance | null;     // Ambiance préférée
  options: {
    surPlace: boolean;           // Consommation sur place
    emporter: boolean;           // À emporter
    livraison: boolean;          // Livraison
  };
}
```

#### Types Disponibles

```typescript
type Cuisine = "Afrique" | "Asie" | "Europe" | "Maghreb" | "Amérique" 
             | "Inde" | "Italien" | "Japonais" | "Chinois" | "Libanais" | "Turc";

type Diet = "Végétarien" | "Végan" | "Halal" | "Sans gluten" | "Aucune";

type Ambiance = "Calme" | "Familial" | "Branché" | "Traditionnel" | "Romantique";
```

### API et Services

#### RecommendationService

```typescript
// Obtenir les recommandations adaptatives
const recommendations = await getAdaptiveRecommendations(
  latitude?,   // Position forcée (optionnel)
  longitude?,  // Position forcée (optionnel)
  radiusKm?    // Rayon de recherche (défaut: 20km)
);
```

#### Database Service

```typescript
// Initialiser la base de données
await initDatabase();

// Récupérer tous les restaurants
const restaurants = await getAllRestaurants();

// Restaurants à proximité
const nearby = await getRestaurantsNearby(lat, lon, radiusKm);

// Historique utilisateur
const habits = await getUserHabits();
```

---

## 🎨 Interface Utilisateur

### Palette de Couleurs

```typescript
colors = {
  primary: "#6B4EFF",      // Violet principal
  secondary: "#FF6B9D",    // Rose accent
  background: "#FFFFFF",   // Fond blanc
  surface: "#F5F5F5",      // Surface grise claire
  text: "#333333",         // Texte principal
  textSecondary: "#666666",// Texte secondaire
  border: "#E0E0E0",       // Bordures
  inactive: "#CCCCCC",     // Éléments inactifs
  error: "#FF5252",        // Erreurs
  success: "#4CAF50"       // Succès
}
```

### Composants Principaux

- **Chip** : Bouton de sélection avec état actif/inactif
- **RestaurantCard** : Carte affichant les infos d'un restaurant
- **BottomNavBar** : Barre de navigation avec 3 onglets
- **ProgressBar** : Barre de progression de l'onboarding

---

## 🔧 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de développement Expo |
| `npm run android` | Lance l'app sur Android |
| `npm run ios` | Lance l'app sur iOS (macOS uniquement) |
| `npm run web` | Lance l'app dans le navigateur |

---

## 🐛 Débogage

### Problèmes Courants

**Erreur de dépendances manquantes**
```bash
npm install
# ou
npm install --legacy-peer-deps
```

**Erreur de cache Expo**
```bash
expo start -c
# ou
npx expo start --clear
```

**Erreur SQLite sur Web**
L'app utilise automatiquement LocalStorage sur web (voir `Database.web.ts`)

**Permissions de géolocalisation**
Assurez-vous d'accepter les permissions de localisation au premier lancement

---

## 📊 Dataset

L'application utilise un dataset de **restaurants réels** issus d'OpenStreetMap avec :

- ✅ Plus de 1000 restaurants
- ✅ Coordonnées GPS précises
- ✅ Types de cuisine variés
- ✅ Options végétariennes/véganes
- ✅ Services (emporter, livraison)

Format JSON :
```json
{
  "name": "Restaurant Name",
  "type": "restaurant",
  "cuisines": "italian,pizza",
  "lat": 48.8566,
  "lon": 2.3522,
  "vegetarian": 1,
  "vegan": 0,
  "takeaway": 1
}
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Respecter la structure du projet
- Utiliser TypeScript avec typage strict
- Commenter le code pour les parties complexes
- Tester sur iOS, Android et Web


---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Contact & Support

- **GitHub Issues** : [Signaler un bug](https://github.com/RobertGriffaton/SAES55/issues)
- **Email** : contact@graye.app
- **Documentation** : [Wiki du projet](https://github.com/RobertGriffaton/SAES55/wiki)

---

## 🙏 Remerciements

- **OpenStreetMap** pour les données de restaurants
- **Expo Team** pour leur excellent framework
- **React Native Community** pour les bibliothèques
- **Notre équipe pédagogique** pour l'encadrement du projet SAE S5

---

<div align="center">

**⭐ Si vous aimez ce projet, n'hésitez pas à lui donner une étoile ! ⭐**

Made with ❤️ by the Graye Team

</div>