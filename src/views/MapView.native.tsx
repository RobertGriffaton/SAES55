import React, { useEffect, useState, useRef, useMemo } from "react";
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
import { getRestaurantsNearby, addFavorite, removeFavorite, isFavorite } from "../services/Database";
import { getRestaurantImage } from "../utils/ImageMapping";
import { getActiveProfile } from "../controllers/ProfileController";
import { MapSessionState } from "../models/MapModel";

const { width } = Dimensions.get('window');

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
  savedState?: MapSessionState | null;
  onSaveState?: (state: MapSessionState) => void;
}

export const MapViewComponent = ({ onRestaurantSelect, savedState, onSaveState }: MapViewProps) => {
  // États
  const [position, setPosition] = useState<[number, number] | null>(savedState?.position || null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>(savedState?.restaurants || []);
  const [loading, setLoading] = useState(!savedState?.position);
  const [radiusKm, setRadiusKm] = useState(savedState?.radiusKm || 5);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(savedState?.selectedRestaurant || null);
  const [isFavoriteRestaurant, setIsFavoriteRestaurant] = useState(false);
  const [userId, setUserId] = useState<string>('default');

  // Recherche
  const [searchText, setSearchText] = useState(savedState?.searchText || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const carouselRef = useRef<FlatList>(null);
  const skipSearchRef = useRef(!!savedState?.searchText);

  // 0. Récupérer l'ID de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      const profile = await getActiveProfile();
      if (profile?.id) setUserId(profile.id);
    };
    fetchUser();
  }, []);

  // Vérifier si le restaurant sélectionné est en favori
  useEffect(() => {
    const checkFav = async () => {
      if (selectedRestaurant && selectedRestaurant.id) {
        const fav = await isFavorite(Number(selectedRestaurant.id), userId);
        setIsFavoriteRestaurant(fav);
      }
    };
    checkFav();
  }, [selectedRestaurant, userId]);

  // 1. Initialisation GPS
  useEffect(() => {
    if (savedState?.position && savedState?.restaurants?.length > 0) {
      setLoading(false);
      return;
    }

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
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }
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

  // 2 bis. Sauvegarde de l'état
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSaveState) {
        onSaveState({
          searchText,
          position,
          radiusKm,
          selectedRestaurant,
          restaurants
        });
      }
    }, 1500);
    return () => clearTimeout(handler);
  }, [searchText, position, radiusKm, selectedRestaurant, restaurants]);

  // 2 ter. Synchronisation du marqueur sélectionné sur la carte
  useEffect(() => {
    if (webViewRef.current && selectedRestaurant) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.setSelectedMarkerId === 'function') {
          window.setSelectedMarkerId(${selectedRestaurant.id});
        }
        true;
      `);
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async (lat: number, lon: number, rad: number) => {
    try {
      const data = await getRestaurantsNearby(lat, lon, rad);
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestaurant(data[0]);
      }

      if (webViewRef.current) {
        const lightData = data.slice(0, 100).map((r: any) => ({
          id: r.id,
          lat: r.lat,
          lon: r.lon,
          name: r.name,
          cuisines: r.cuisines,
          type: r.type,
          distanceKm: r.distanceKm
        }));

        webViewRef.current.injectJavaScript(`
          if (typeof renderMarkers === 'function') {
            renderMarkers(${JSON.stringify(lightData)}, ${selectedRestaurant?.id || 'null'});
          }
          true;
        `);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAddress = (item: any) => {
    const lon = item.geometry.coordinates[0];
    const lat = item.geometry.coordinates[1];

    skipSearchRef.current = true;
    setSearchText(item.properties.label);
    setSuggestions([]);
    Keyboard.dismiss();
    setPosition([lat, lon]);
    fetchRestaurants(lat, lon, radiusKm);

    if (webViewRef.current) {
      const script = `
        if (typeof window.map !== 'undefined') {
          window.shouldFitBounds = false;
          window.map.setView([${lat}, ${lon}], 15, { animate: true });
          if (window.updateUserPos) {
            window.updateUserPos(${lat}, ${lon});
          }
          setTimeout(() => { window.shouldFitBounds = true; }, 3000);
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const changeRadius = (delta: number) => {
    if (!position) return;
    const newRadius = Math.max(1, Math.min(50, radiusKm + delta));
    if (newRadius !== radiusKm) {
      setRadiusKm(newRadius);
      fetchRestaurants(position[0], position[1], newRadius);

      if (webViewRef.current) {
        // LOGIQUE CORRIGÉE :
        // Si delta > 0 (On augmente le rayon, ex: +1), on veut voir PLUS LARGE -> Zoom OUT
        // Si delta < 0 (On réduit le rayon, ex: -1), on veut voir PLUS PRÈS -> Zoom IN
        const script = delta < 0
          ? "if (window.map) { window.shouldFitBounds = false; window.map.zoomIn(); setTimeout(() => { window.shouldFitBounds = true; }, 3000); } true;"
          : "if (window.map) { window.shouldFitBounds = false; window.map.zoomOut(); setTimeout(() => { window.shouldFitBounds = true; }, 3000); } true;";
        webViewRef.current.injectJavaScript(script);
      }
    }
  };

  const toggleFavorite = async (restaurant: any) => {
    if (!restaurant) return;
    const restaurantId = Number(restaurant.id);
    if (isFavoriteRestaurant) {
      await removeFavorite(restaurantId, userId);
      setIsFavoriteRestaurant(false);
    } else {
      await addFavorite(restaurantId, userId);
      setIsFavoriteRestaurant(true);
    }
  };

  const centerOnRealGPS = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      if (location && webViewRef.current) {
        const { latitude: lat, longitude: lon } = location.coords;
        setSearchText("");
        setSuggestions([]);
        setPosition([lat, lon]);
        setUserPosition([lat, lon]);
        fetchRestaurants(lat, lon, radiusKm);

        const script = `
          window.shouldFitBounds = false;
          if (typeof window.updateUserPos === 'function') {
             window.updateUserPos(${lat}, ${lon}, 15);
          } else if (typeof window.map !== 'undefined') {
             window.map.setView([${lat}, ${lon}], 15, { animate: true });
          }
          setTimeout(() => { window.shouldFitBounds = true; }, 3000);
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (e) {
      console.warn("Erreur recentrage GPS:", e);
    }
  };

  const mapHtml = useMemo(() => `
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
            transition: all 0.3s ease;
          }

          .selected-marker {
            border: 4px solid #FFD700 !important;
            transform: scale(1.35);
            z-index: 999;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
          }

          .user-marker {
            width: 52px; height: 52px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 4px solid white;
            box-shadow: 0 0 25px rgba(0, 122, 255, 0.9), 0 0 45px rgba(0, 122, 255, 0.4);
            font-size: 26px;
            background: #007AFF;
            animation: pulse-user 1.5s infinite;
            position: relative;
            z-index: 1000;
          }
          .user-marker::after {
            content: '';
            position: absolute;
            width: 100%; height: 100%;
            border-radius: 50%;
            border: 2px solid #007AFF;
            animation: halo 1.5s linear infinite;
          }
          @keyframes halo {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes pulse-user {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.shouldFitBounds = false; 

          window.map = L.map('map', { zoomControl: false }).setView([48.85, 2.35], 15);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '© CARTO', maxZoom: 20
          }).addTo(window.map);

          window.map.on('movestart', function() {
            window.shouldFitBounds = false;
          });

          var currentRestaurants = [];
          var currentSelectedId = null;

          var userMarker = L.marker([48.85, 2.35], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="user-marker">📍</div>',
              iconSize: [52, 52], iconAnchor: [26, 26]
            })
          }).addTo(window.map);

          window.updateUserPos = function(lat, lon, zoom) {
            if (!lat || !lon) return;
            userMarker.setLatLng([lat, lon]);
            if (zoom && window.map) {
              window.map.setView([lat, lon], zoom, { animate: true });
            }
          };

          var markersLayer = L.layerGroup().addTo(window.map);

          window.setSelectedMarkerId = function(id) {
            currentSelectedId = id;
            renderMarkers(currentRestaurants, id);
          };

          function renderMarkers(restos, selectedId) {
            if (restos) currentRestaurants = restos;
            var restosToRender = currentRestaurants;
            if (selectedId !== undefined) currentSelectedId = selectedId;
            
            markersLayer.clearLayers();
            var group = L.featureGroup();
            group.addLayer(userMarker);

            restos.forEach(function(r) {
              var cuisine = (r.cuisines || r.type || '').toLowerCase();
              var color = '#6B4EFF';
              var icon = '🍽️';

              if (cuisine.includes('burger')) { color = '#FF6B6B'; icon = '🍔'; }
              else if (cuisine.includes('pizza')) { color = '#FFA500'; icon = '🍕'; }
              else if (cuisine.includes('sushi') || cuisine.includes('asian')) { color = '#FF69B4'; icon = '🍱'; }
              
              var isSelected = r.id == currentSelectedId;
              var markerClass = isSelected ? 'custom-marker selected-marker' : 'custom-marker';

              var m = L.marker([r.lat, r.lon], {
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  html: '<div class="' + markerClass + '" style="background: ' + color + '">' + icon + '</div>',
                  iconSize: isSelected ? [48, 48] : [36, 36], 
                  iconAnchor: isSelected ? [24, 24] : [18, 18]
                })
              });

              m.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify(r));
              });

              markersLayer.addLayer(m);
              group.addLayer(m);
            });

            if (restos.length > 0 && window.shouldFitBounds) {
              window.map.fitBounds(group.getBounds().pad(0.15), {
                paddingTopLeft: [0, 150],
                paddingBottomRight: [0, 200],
                maxZoom: 18
              });
            }
          }

          window.renderMarkers = renderMarkers;
          setTimeout(function() { window.shouldFitBounds = true; }, 3000);
        </script>
      </body>
    </html>
  `, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.id) {
        // IMPORTANT: On cherche l'objet COMPLET dans notre state local
        // car le marqueur WebView ne contient qu'une version allégée.
        const fullRestaurant = restaurants.find(r => r.id === data.id);
        if (fullRestaurant) {
          setSelectedRestaurant(fullRestaurant);

          // Faire défiler le carrousel vers l'item sélectionné
          if (carouselRef.current) {
            carouselRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        }
      }
    } catch (e) {
      console.warn("Erreur message WebView:", e);
    }
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
        key="map-static-root"
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        onLoad={() => {
          if (webViewRef.current && position) {
            const lightData = restaurants.slice(0, 100).map((r: any) => ({
              id: r.id, lat: r.lat, lon: r.lon, name: r.name, cuisines: r.cuisines, type: r.type, distanceKm: r.distanceKm
            }));
            const script = `
              if (window.updateUserPos) window.updateUserPos(${position[0]}, ${position[1]}, 15);
              if (window.renderMarkers) window.renderMarkers(${JSON.stringify(lightData)}, ${selectedRestaurant?.id || 'null'});
              true;
            `;
            webViewRef.current.injectJavaScript(script);
          }
        }}
      />

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={centerOnRealGPS}>
              <Ionicons name="locate" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Rechercher une zone..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(""); setSuggestions([]); }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => changeRadius(1)} // LOGIQUE CORRIGÉE : + Augmente le rayon
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.radiusBadge}>
          <Text style={styles.radiusBadgeText}>{radiusKm}</Text>
          <Text style={styles.radiusBadgeUnit}>km</Text>
        </View>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => changeRadius(-1)} // LOGIQUE CORRIGÉE : - Diminue le rayon
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={24} color="#333" />
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
                    <Text style={styles.restaurantDistance}>
                      {(item.distanceKm !== undefined && item.distanceKm !== null)
                        ? `${item.distanceKm.toFixed(1)} km`
                        : (item.distance !== undefined && item.distance !== null
                          ? `${item.distance.toFixed(1)} km`
                          : '0.5 km')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(item)}
                >
                  <Ionicons
                    name={isFavoriteRestaurant ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavoriteRestaurant ? "#FF6B6B" : "#999"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
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
    flex: 1, flexDirection: 'row', backgroundColor: 'white', borderRadius: 18,
    height: 54, alignItems: 'center', paddingHorizontal: 15,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  input: { flex: 1, fontSize: 16, marginLeft: 12, color: '#1a1a1a', fontWeight: '500' },

  suggestionsBox: {
    backgroundColor: 'white', marginTop: 12, borderRadius: 20,
    maxHeight: 300, elevation: 15, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f5'
  },

  radiusControls: {
    position: 'absolute',
    bottom: 200, // ABAISSÉ (était 260)
    right: 20,
    alignItems: 'center',
    gap: 8, // Écart réduit entre les boutons
    zIndex: 100,
  },
  controlBtn: {
    width: 44, // TAILLE RÉDUITE (était 54)
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22, // Rond
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
  },
  radiusBadge: {
    backgroundColor: '#007AFF',
    width: 44, // TAILLE RÉDUITE (était 54)
    height: 44,
    borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    borderWidth: 2, borderColor: 'white',
  },
  radiusBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 16, lineHeight: 18 }, // Font réduite
  radiusBadgeUnit: { color: 'white', fontWeight: '700', fontSize: 10, marginTop: -2 }, // Font réduite

  restaurantCarousel: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
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
  restaurantDistance: { fontSize: 12, color: '#888' },
  favoriteButton: { padding: 5 },
});