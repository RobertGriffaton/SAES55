import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  Keyboard,
  FlatList,
  Image,
  Dimensions
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/theme";
import { getRestaurantsNearby } from "../services/Database";
import { getRestaurantImage } from "../utils/ImageMapping";

const { width } = Dimensions.get('window');

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

export const MapViewComponent = ({ onRestaurantSelect }: MapViewProps) => {
  // États
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5);
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
          fetchRestaurants(paris[0], paris[1], 5);
          setLoading(false);
          return;
        }

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
        }

        if (location) {
          const { latitude, longitude } = location.coords;
          setUserPosition([latitude, longitude]);
          setPosition([latitude, longitude]);
          fetchRestaurants(latitude, longitude, 5);
        }
      } catch (e) {
        console.warn("Erreur init Map:", e);
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

  const fetchRestaurants = async (lat: number, lon: number, rad: number) => {
    try {
      const data = await getRestaurantsNearby(lat, lon, rad);
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestaurant(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAddress = (item: any) => {
    const lon = item.geometry.coordinates[0];
    const lat = item.geometry.coordinates[1];
    setSearchText(item.properties.label);
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

  // HTML DE LA CARTE LEAFLET
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; background: #f0f0f0; }
          .leaflet-top { top: 180px; }
          
          .custom-div-icon { background: none; border: none; }
          .custom-marker {
            width: 36px; height: 36px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            font-size: 18px;
          }
          /* User marker specific - Larger and Pulsing */
          .user-marker {
            width: 48px; height: 48px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 4px solid white;
            box-shadow: 0 0 15px rgba(255, 140, 0, 0.6);
            font-size: 24px;
            background: #FF8C00;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
          }
          .marker-orange { background: #FF8C00; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var centerLat = ${position ? position[0] : 48.85};
          var centerLon = ${position ? position[1] : 2.35};
          var restaurants = ${JSON.stringify(restaurants)};

          var map = L.map('map', { zoomControl: false }).setView([centerLat, centerLon], 14);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '© CARTO', maxZoom: 19
          }).addTo(map);

          var userMarker = L.marker([centerLat, centerLon], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="user-marker">📍</div>',
              iconSize: [48, 48], iconAnchor: [24, 24]
            })
          }).addTo(map);

          var markersLayer = L.layerGroup().addTo(map);

          function renderMarkers(restos) {
            markersLayer.clearLayers();
            var group = L.featureGroup();
            group.addLayer(userMarker);

            restos.forEach(function(r) {
              var cuisine = (r.cuisines || r.type || '').toLowerCase();
              var color = '#9370DB'; // violet par défaut
              var icon = '🍽️';

              if (cuisine.includes('burger') || cuisine.includes('fast')) { color = '#FF6B6B'; icon = '🍔'; }
              else if (cuisine.includes('pizza') || cuisine.includes('italia')) { color = '#FFA500'; icon = '🍕'; }
              else if (cuisine.includes('sushi') || cuisine.includes('japonais') || cuisine.includes('asian')) { color = '#FF69B4'; icon = '🍱'; }
              else if (cuisine.includes('kebab') || cuisine.includes('turkish')) { color = '#8B4513'; icon = '🥙'; }
              else if (cuisine.includes('taco') || cuisine.includes('mexic')) { color = '#FFD700'; icon = '🌮'; }
              else if (cuisine.includes('cafe')) { color = '#8B4513'; icon = '☕'; }

              var m = L.marker([r.lat, r.lon], {
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  html: '<div class="custom-marker" style="background: ' + color + '">' + icon + '</div>',
                  iconSize: [36, 36], iconAnchor: [18, 18]
                })
              });

              m.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify(r));
              });

              markersLayer.addLayer(m);
              group.addLayer(m);
            });

            if (restos.length > 0) {
              map.fitBounds(group.getBounds().pad(0.15), {
                paddingTopLeft: [0, 150],
                paddingBottomRight: [0, 200]
              });
            }
          }

          renderMarkers(restaurants);
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const r = JSON.parse(event.nativeEvent.data);
      setSelectedRestaurant(r);
    } catch (e) { }
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

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
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

        {/* BADGES */}
        <View style={styles.badgesContainer}>
          <TouchableOpacity style={styles.badgePrimary}>
            <Text style={styles.badgePrimaryText}>Ouvert (48)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.badgeSecondary}>
            <Text style={styles.badgeSecondaryText}>≤ {radiusKm} km</Text>
          </TouchableOpacity>
        </View>

        {/* SUGGESTIONS */}
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

      {/* CARROUSEL RESTAURANTS */}
      {selectedRestaurant && (
        <View style={styles.restaurantCarousel}>
          <FlatList
            ref={carouselRef}
            data={[selectedRestaurant]}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.restaurantCard}
                onPress={() => onRestaurantSelect && onRestaurantSelect(item)}
                activeOpacity={0.9}
              >
                <Image
                  source={getRestaurantImage(item) || undefined}
                  style={styles.restaurantImage}
                />
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.restaurantType} numberOfLines={1}>{item.cuisines || item.type}</Text>
                  <View style={styles.restaurantMeta}>
                    <Text style={styles.restaurantStatus}>Ouvert</Text>
                    <Text style={styles.restaurantDot}> • </Text>
                    <Text style={styles.restaurantDistance}>{item.distance ? `${item.distance.toFixed(1)} km` : '0.5km'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.favoriteButton}>
                  <Ionicons name="heart-outline" size={20} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* BARRE DE NAVIGATION */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchContainer: {
    position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10,
  },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBar: {
    flex: 1, flexDirection: 'row', backgroundColor: 'white', borderRadius: 15,
    height: 50, alignItems: 'center', paddingHorizontal: 15,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  input: { flex: 1, fontSize: 16, marginLeft: 10, color: '#333' },
  filterButton: {
    width: 50, height: 50, backgroundColor: 'white', borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },

  badgesContainer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  badgePrimary: {
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
  },
  badgePrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  badgeSecondary: {
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
  },
  badgeSecondaryText: { color: '#333', fontWeight: 'bold', fontSize: 13 },

  suggestionsBox: {
    backgroundColor: 'white', marginTop: 10, borderRadius: 15,
    maxHeight: 250, elevation: 10, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },

  radiusControls: {
    position: 'absolute', bottom: 200, right: 20, gap: 10,
  },
  controlBtn: {
    width: 44, height: 44, backgroundColor: 'white', borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2,
  },
  btnText: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  restaurantCarousel: {
    position: 'absolute', bottom: 90, left: 0, right: 0,
  },
  carouselContent: { paddingHorizontal: 20, paddingBottom: 15 },
  restaurantCard: {
    width: width - 40, backgroundColor: 'white', borderRadius: 20, padding: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  restaurantImage: { width: 70, height: 70, borderRadius: 15, backgroundColor: '#eee' },
  restaurantInfo: { flex: 1, marginLeft: 15 },
  restaurantName: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  restaurantType: { fontSize: 13, color: '#666', marginTop: 2 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  restaurantStatus: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold' },
  restaurantDot: { color: '#ddd', marginHorizontal: 5 },
  restaurantDistance: { fontSize: 12, color: '#888' },
  favoriteButton: { padding: 5 },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0',
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  navItem: { padding: 10 }
});