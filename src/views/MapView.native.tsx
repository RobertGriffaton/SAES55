import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Alert, TouchableOpacity, TextInput, Keyboard, FlatList, Image } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/theme";
import { getRestaurantsNearby } from "../services/Database";

// Fonction pour obtenir l'image basée sur le type de cuisine
const getRestaurantImage = (cuisines: string, type: string, name: string = '') => {
  const cuisine = (cuisines || type || '').toLowerCase();
  const restaurantName = name.toLowerCase();

  // Marques spécifiques
  if (restaurantName.includes('mcdo') || restaurantName.includes('mcdonald')) {
    return require('../../assets/imagescover/mcdo.png');
  } else if (restaurantName.includes('kfc')) {
    return require('../../assets/imagescover/kfc.png');
  } else if (restaurantName.includes('burger king')) {
    return require('../../assets/imagescover/burgerking.png');
  } else if (restaurantName === 'quick' || restaurantName.startsWith('quick ') || restaurantName.endsWith(' quick')) {
    return require('../../assets/imagescover/quick.png');
  } else if (restaurantName.includes('starbucks')) {
    return require('../../assets/imagescover/starbucks.png');
  } else if (restaurantName.includes('subway')) {
    return require('../../assets/imagescover/subway.png');
  }

  // Types de cuisine
  if (cuisine.includes('burger')) {
    return require('../../assets/imagescover/burger.png');
  } else if (cuisine.includes('pizza')) {
    return require('../../assets/imagescover/pizza.png');
  } else if (cuisine.includes('sushi') || cuisine.includes('japonais')) {
    return require('../../assets/imagescover/japonais.png');
  } else if (cuisine.includes('chinois') || cuisine.includes('chinese')) {
    return require('../../assets/imagescover/chinois.png');
  } else if (cuisine.includes('kebab') || cuisine.includes('turkish')) {
    return require('../../assets/imagescover/kebab.png');
  } else if (cuisine.includes('tacos') || cuisine.includes('mexican')) {
    return require('../../assets/imagescover/tacos.png');
  } else if (cuisine.includes('italien') || cuisine.includes('italia')) {
    return require('../../assets/imagescover/italien.png');
  } else if (cuisine.includes('indien') || cuisine.includes('indian')) {
    return require('../../assets/imagescover/asie_du_sud.png');
  } else if (cuisine.includes('thai') || cuisine.includes('thaï')) {
    return require('../../assets/imagescover/thai.png');
  } else if (cuisine.includes('vietnamien') || cuisine.includes('vietnam')) {
    return require('../../assets/imagescover/vietnamien.png');
  } else if (cuisine.includes('coreen') || cuisine.includes('korean')) {
    return require('../../assets/imagescover/coreen.png');
  } else if (cuisine.includes('cafe') || cuisine.includes('coffee')) {
    return require('../../assets/imagescover/cafe.png');
  } else if (cuisine.includes('patisserie') || cuisine.includes('dessert')) {
    return require('../../assets/imagescover/patisserie.png');
  } else if (cuisine.includes('creperie') || cuisine.includes('crepe')) {
    return require('../../assets/imagescover/creperie.png');
  } else if (cuisine.includes('sandwich')) {
    return require('../../assets/imagescover/sandwich.png');
  } else if (cuisine.includes('grec') || cuisine.includes('greek')) {
    return require('../../assets/imagescover/grec.png');
  } else if (cuisine.includes('francais') || cuisine.includes('french')) {
    return require('../../assets/imagescover/francais.png');
  } else if (cuisine.includes('americain') || cuisine.includes('american')) {
    return require('../../assets/imagescover/americain.png');
  } else if (cuisine.includes('asiatique') || cuisine.includes('asian')) {
    return require('../../assets/imagescover/asiatique.png');
  } else if (cuisine.includes('fast') || cuisine.includes('rapide')) {
    return require('../../assets/imagescover/fast_food.png');
  } else if (cuisine.includes('poulet') || cuisine.includes('chicken')) {
    return require('../../assets/imagescover/poulet.png');
  } else if (cuisine.includes('grill')) {
    return require('../../assets/imagescover/grill.png');
  } else if (cuisine.includes('healthy') || cuisine.includes('vegan') || cuisine.includes('vegetarian')) {
    return require('../../assets/imagescover/healthy.png');
  } else if (cuisine.includes('bubble') || cuisine.includes('tea')) {
    return require('../../assets/imagescover/bubble_tea.png');
  } else if (cuisine.includes('bar')) {
    return require('../../assets/imagescover/bar.png');
  } else if (cuisine.includes('fruits') || cuisine.includes('mer')) {
    return require('../../assets/imagescover/fruits_de_mer.png');
  } else {
    return require('../../assets/imagescover/divers.png');
  }
};


// Fonction pour obtenir une couleur et icône basées sur le type de cuisine
const getRestaurantVisual = (cuisines: string, type: string) => {
  const cuisine = (cuisines || type || '').toLowerCase();

  // Mapping cuisine -> couleur de fond et icône
  if (cuisine.includes('burger') || cuisine.includes('fast')) {
    return { color: '#FF6B6B', icon: '🍔' };
  } else if (cuisine.includes('pizza') || cuisine.includes('italia')) {
    return { color: '#FFA500', icon: '🍕' };
  } else if (cuisine.includes('sushi') || cuisine.includes('japonais') || cuisine.includes('asian')) {
    return { color: '#FF69B4', icon: '🍱' };
  } else if (cuisine.includes('chinese') || cuisine.includes('chinois')) {
    return { color: '#DC143C', icon: '🥡' };
  } else if (cuisine.includes('kebab') || cuisine.includes('turkish')) {
    return { color: '#8B4513', icon: '🥙' };
  } else if (cuisine.includes('mexican') || cuisine.includes('mexicain')) {
    return { color: '#FFD700', icon: '🌮' };
  } else if (cuisine.includes('indian') || cuisine.includes('indien')) {
    return { color: '#FF4500', icon: '🍛' };
  } else if (cuisine.includes('cafe') || cuisine.includes('coffee')) {
    return { color: '#8B4513', icon: '☕' };
  } else if (cuisine.includes('dessert') || cuisine.includes('patisserie')) {
    return { color: '#FFB6C1', icon: '🍰' };
  } else if (cuisine.includes('vegan') || cuisine.includes('vegetarian')) {
    return { color: '#90EE90', icon: '🥗' };
  } else {
    return { color: '#9370DB', icon: '🍽️' };
  }
};

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

export const MapViewComponent = ({ onRestaurantSelect }: MapViewProps) => {
  // États
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(4);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

  // Recherche
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const carouselRef = useRef<FlatList>(null);

  // 1. Initialisation GPS
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Info", "Position refusée. Paris par défaut.");
          const paris: [number, number] = [48.8566, 2.3522];
          setPosition(paris);
          fetchRestaurants(paris[0], paris[1], 4);
          setLoading(false);
          return;
        }

        // Optimisation : On tente d'abord la dernière position connue
        let location = await Location.getLastKnownPositionAsync({});

        if (!location) {
          console.log("[Map] Pas de cache GPS, localisation active...");
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
        } else {
          console.log("[Map] Utilisation dernière position connue.");
        }

        if (location) {
          const { latitude, longitude } = location.coords;
          setUserPosition([latitude, longitude]);
          setPosition([latitude, longitude]);

          // Chargement initial
          fetchRestaurants(latitude, longitude, 4);
        }
      } catch (e) {
        console.warn("Erreur init Map:", e);
        Alert.alert("Erreur", "Impossible de récupérer la position.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Debounce pour la recherche
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.length > 3) {
        fetchAddressSuggestions(searchText);
      } else {
        setSuggestions([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);


  // 3. API Adresse Data Gouv
  const fetchAddressSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`;
      const response = await fetch(url);
      const json = await response.json();
      setSuggestions(json.features || []);
    } catch (e) {
      console.warn("Erreur API Adresse", e);
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Charger les restaurants
  const fetchRestaurants = async (lat: number, lon: number, rad: number) => {
    try {
      const data = await getRestaurantsNearby(lat, lon, rad);
      setRestaurants(data);
      // Auto-sélectionner le premier restaurant s'il existe
      if (data.length > 0) {
        setSelectedRestaurant(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Sélection d'une adresse
  const handleSelectAddress = (item: any) => {
    const lon = item.geometry.coordinates[0];
    const lat = item.geometry.coordinates[1];
    const label = item.properties.label;

    setSearchText(label);
    setSuggestions([]);
    Keyboard.dismiss();

    setPosition([lat, lon]);
    fetchRestaurants(lat, lon, radiusKm);
  };

  const changeRadius = (delta: number) => {
    if (!position) return;
    const newRadius = Math.max(1, Math.min(50, radiusKm + delta));
    if (newRadius !== radiusKm) {
      setRadiusKm(newRadius);
      fetchRestaurants(position[0], position[1], newRadius);
    }
  };

  const resetToGPS = () => {
    if (userPosition) {
      setSearchText("");
      setSuggestions([]);
      setPosition(userPosition);
      fetchRestaurants(userPosition[0], userPosition[1], radiusKm);
    }
  };

  // HTML DE LA CARTE LEAFLET avec marqueurs personnalisés
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; background: #e8e8e8; }
          
          .leaflet-top {
            top: 140px; 
          }
          
          /* Custom marker styles */
          .custom-marker {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            font-size: 18px;
          }
          .marker-purple {
            background: #6B4EFF;
          }
          .marker-orange {
            background: #FF8C00;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var data = ${JSON.stringify(restaurants)};
          var centerLat = ${position ? position[0] : 48.85};
          var centerLon = ${position ? position[1] : 2.35};

          var map = L.map('map', {
            zoomControl: false
          }).setView([centerLat, centerLon], 14);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '© CARTO', maxZoom: 19
          }).addTo(map);

          // Custom icon for user position (orange)
          var orangeMarkerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="custom-marker marker-orange">📍</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          // Custom icon for restaurants (purple)
          var purpleMarkerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="custom-marker marker-purple">🍽️</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          // Marqueur Utilisateur
          var userMarker = L.marker([centerLat, centerLon], {icon: orangeMarkerIcon})
           .addTo(map);

          var markersLayer = L.layerGroup().addTo(map);

          function renderMarkers(restos) {
             markersLayer.clearLayers();
             var group = L.featureGroup();
             group.addLayer(userMarker);

             restos.forEach(function(r) {
               var cuisine = (r.cuisines || r.type || '').toLowerCase();
               var color = '#9370DB';
               var icon = '🍽️';
               
               if (cuisine.includes('burger') || cuisine.includes('fast')) {
                 color = '#FF6B6B'; icon = '🍔';
               } else if (cuisine.includes('pizza') || cuisine.includes('italia')) {
                 color = '#FFA500'; icon = '🍕';
               } else if (cuisine.includes('sushi') || cuisine.includes('japonais') || cuisine.includes('asian')) {
                 color = '#FF69B4'; icon = '🍱';
               } else if (cuisine.includes('chinese') || cuisine.includes('chinois')) {
                 color = '#DC143C'; icon = '🥡';
               } else if (cuisine.includes('kebab') || cuisine.includes('turkish')) {
                 color = '#8B4513'; icon = '🥙';
               } else if (cuisine.includes('mexican') || cuisine.includes('mexicain')) {
                 color = '#FFD700'; icon = '🌮';
               } else if (cuisine.includes('indian') || cuisine.includes('indien')) {
                 color = '#FF4500'; icon = '🍛';
               } else if (cuisine.includes('cafe') || cuisine.includes('coffee')) {
                 color = '#8B4513'; icon = '☕';
               } else if (cuisine.includes('dessert') || cuisine.includes('patisserie')) {
                 color = '#FFB6C1'; icon = '🍰';
               } else if (cuisine.includes('vegan') || cuisine.includes('vegetarian')) {
                 color = '#90EE90'; icon = '🥗';
               }
               
               var customIcon = L.divIcon({
                 className: 'custom-div-icon',
                 html: '<div class="custom-marker" style="background: ' + color + '">' + icon + '</div>',
                 iconSize: [36, 36],
                 iconAnchor: [18, 18]
               });
               
               var m = L.marker([r.lat, r.lon], {icon: customIcon});
               m.on('click', function() { 
                 window.ReactNativeWebView.postMessage(JSON.stringify(r)); 
               });
               m.bindPopup("<b>" + r.name + "</b><br>" + (r.cuisines || r.type));
               markersLayer.addLayer(m);
               group.addLayer(m);
             });

             if (restos.length > 0) {
                 map.fitBounds(group.getBounds().pad(0.15), {
                   paddingTopLeft: [0, 150],
                   paddingBottomRight: [0, 180]
                 });
             }
          }

          if (data && data.length > 0) {
             renderMarkers(data);
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const r = JSON.parse(event.nativeEvent.data);
      setSelectedRestaurant(r);
      // Afficher seulement ce restaurant en bas
    } catch (e) {
      console.warn('Error handling message:', e);
    }
  };

  const reloadMap = () => {
    if (webViewRef.current) webViewRef.current.reload();
  };

  if (loading || !position) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: '#666' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={`${position[0]}-${position[1]}-${radiusKm}`}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
      />

      {/* BARRE DE RECHERCHE AVEC FILTRE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Rechercher une zone..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* BADGES: Statut et filtres */}
        <View style={styles.badgesContainer}>
          <View style={styles.badgesRow}>
            <TouchableOpacity style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>Ouvert (48)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesRow}>
            <TouchableOpacity style={styles.badgeSecondary}>
              <Text style={styles.badgeSecondaryText}>≤ {radiusKm} km</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTE DES SUGGESTIONS */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, i) => i.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectAddress(item)}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text numberOfLines={1} style={{ flex: 1 }}>{item.properties.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* CONTRÔLES RAYON */}
      <View style={styles.radiusControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => changeRadius(1)}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => changeRadius(-1)}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* CARROUSEL RESTAURANTS EN BAS */}
      {selectedRestaurant ? (
        <View style={styles.restaurantCarousel}>
          <FlatList
            ref={carouselRef}
            horizontal
            data={[selectedRestaurant]}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={styles.restaurantCard}
                  onPress={() => {
                    setSelectedRestaurant(item);
                    // Ouvrir la vue détaillée
                    if (onRestaurantSelect) onRestaurantSelect(item);
                  }}
                  activeOpacity={0.9}
                >
                  <Image
                    source={getRestaurantImage(item.cuisines, item.type, item.name)}
                    style={styles.restaurantImage}
                  />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.restaurantType} numberOfLines={1}>
                      {item.cuisines || item.type}
                    </Text>
                    <View style={styles.restaurantMeta}>
                      <Text style={styles.restaurantStatus}>Ouvert</Text>
                      <Text style={styles.restaurantDot}> • </Text>
                      <Text style={styles.restaurantDistance}>
                        {item.distance ? `${item.distance.toFixed(1)} km` : '0.5km'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={20} color="#999" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}

      {/* BARRE DE NAVIGATION EN BAS */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="heart-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export { MapViewComponent as MapView };

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  map: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    zIndex: 10,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 48,
  },

  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    color: '#333',
  },

  filterButton: {
    backgroundColor: 'white',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },

  badgesContainer: {
    marginTop: 12,
    gap: 8,
  },

  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },

  badgePrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
  },

  badgePrimaryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },

  badgeSecondary: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },

  badgeSecondaryText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },

  suggestionsBox: {
    width: '100%',
    backgroundColor: 'white',
    marginTop: 8,
    borderRadius: 12,
    elevation: 5,
    maxHeight: 200,
    paddingVertical: 5
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },

  radiusControls: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },

  controlBtn: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },

  btnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  // CARROUSEL RESTAURANTS
  restaurantCarousel: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    height: 110,
  },

  carouselContent: {
    paddingHorizontal: 15,
    gap: 12,
  },

  restaurantCard: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },

  restaurantImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },

  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },

  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  restaurantType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },

  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  restaurantStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },

  restaurantDot: {
    fontSize: 12,
    color: '#999',
  },

  restaurantDistance: {
    fontSize: 12,
    color: '#999',
  },

  favoriteButton: {
    padding: 6,
  },

  // BARRE DE NAVIGATION
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  navItem: {
    padding: 8,
  },
});