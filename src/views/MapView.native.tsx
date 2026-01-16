import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Alert, TouchableOpacity, TextInput, Keyboard, FlatList } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/theme";
import { getRestaurantsNearby } from "../services/Database";

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
  
  // Recherche
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // 1. Initialisation GPS (Optimisée V2 : Stratégie Économe)
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

        // --- OPTIMISATION V2 ---
        // On tente d'abord la dernière position connue pour économiser la batterie
        let location = await Location.getLastKnownPositionAsync({});

        // Si pas de dernière position (ex: redémarrage), on lance le GPS avec précision équilibrée
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
            fetchRestaurants(latitude, longitude, 5);
        }
      } catch (e) {
        console.warn("Erreur init Map:", e);
        Alert.alert("Erreur", "Impossible de récupérer la position.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Debounce (Attendre que l'utilisateur finisse de taper)
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


  // 3. --- NOUVELLE API : ADRESSE.DATA.GOUV.FR ---
  const fetchAddressSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
        // Cette API est spécialisée pour la France et gère les fautes de frappe
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`;
        
        const response = await fetch(url);
        const json = await response.json();
        
        // L'API renvoie un tableau "features" (format GeoJSON)
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
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Sélection d'une adresse (Adapté au GeoJSON)
  const handleSelectAddress = (item: any) => {
    // GeoJSON met les coordonnées dans l'ordre [Longitude, Latitude] !
    const lon = item.geometry.coordinates[0];
    const lat = item.geometry.coordinates[1];
    
    // Le label complet (ex: "25 Rue de la Résistance 95200 Sarcelles")
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
    if(userPosition) {
        setSearchText("");
        setSuggestions([]);
        setPosition(userPosition);
        fetchRestaurants(userPosition[0], userPosition[1], radiusKm);
    }
  };

  // HTML DE LA CARTE
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; background: #e1e1e1; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var data = ${JSON.stringify(restaurants)};
          var centerLat = ${position ? position[0] : 48.85};
          var centerLon = ${position ? position[1] : 2.35};

          var map = L.map('map').setView([centerLat, centerLon], 13);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
            attribution: '© CARTO', maxZoom: 19
          }).addTo(map);

          var blueIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });

          var redIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });

          // Marqueur Utilisateur
          var userMarker = L.marker([centerLat, centerLon], {icon: redIcon})
           .addTo(map)
           .bindPopup("<b>📍 RECHERCHE</b>")
           .openPopup();

          var markersLayer = L.layerGroup().addTo(map);

          function renderMarkers(restos) {
             markersLayer.clearLayers();
             var group = L.featureGroup();
             group.addLayer(userMarker);

             restos.forEach(function(r) {
               var m = L.marker([r.lat, r.lon], {icon: blueIcon});
               m.on('click', function() { 
                 window.ReactNativeWebView.postMessage(JSON.stringify(r)); 
               });
               m.bindPopup("<b>" + r.name + "</b><br>" + (r.cuisines || r.type));
               markersLayer.addLayer(m);
               group.addLayer(m);
             });

             if (restos.length > 0) {
                 map.fitBounds(group.getBounds().pad(0.1));
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
        if (onRestaurantSelect) onRestaurantSelect(r);
    } catch(e) {}
  };

  const reloadMap = () => {
    if (webViewRef.current) webViewRef.current.reload();
  };

  if (loading || !position) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: 10, color: '#666'}}>Chargement...</Text>
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
        <View style={styles.searchBar}>
            <TextInput
                style={styles.input}
                placeholder="Adresse (ex: 25 rue...)"
                value={searchText}
                onChangeText={setSearchText}
            />
            {isSearching ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Ionicons name="search" size={20} color="#999" />
            )}
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
                            <Ionicons name="location-outline" size={16} color={colors.primary} style={{marginRight:8}} />
                            {/* On affiche le label complet fourni par l'API Gouv */}
                            <Text numberOfLines={1} style={{flex:1}}>{item.properties.label}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        )}

        {/* Bouton GPS */}
        {userPosition && (position[0] !== userPosition[0] || position[1] !== userPosition[1]) && (
             <TouchableOpacity style={styles.gpsButton} onPress={resetToGPS}>
                <Ionicons name="navigate-circle" size={24} color={colors.primary} />
                <Text style={styles.gpsText}>Ma position</Text>
             </TouchableOpacity>
        )}
      </View>

      {/* CONTRÔLES RAYON */}
      <View style={styles.radiusControls}>
        <View style={styles.radiusBadge}>
            <Text style={styles.radiusText}>{radiusKm} km</Text>
        </View>
        <View style={styles.radiusButtons}>
            <TouchableOpacity style={styles.controlBtn} onPress={() => changeRadius(-1)}>
                <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={() => changeRadius(1)}>
                <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={reloadMap}>
         <Ionicons name="refresh" size={24} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.legend}>
        <Text style={styles.legendText}>{restaurants.length} restos trouvés</Text>
      </View>
    </View>
  );
};

export { MapViewComponent as MapView };

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  searchContainer: {
    position: 'absolute', top: 50, left: 15, right: 15,
    zIndex: 10, alignItems: 'center'
  },
  searchBar: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 25,
    elevation: 6, shadowColor: '#000', shadowOffset:{width:0, height:3}, shadowOpacity:0.2,
    alignItems: 'center', paddingHorizontal: 15, height: 50, width: '100%'
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  
  suggestionsBox: {
    width: '100%', backgroundColor: 'white', marginTop: 5, borderRadius: 10,
    elevation: 5, maxHeight: 200, paddingVertical: 5
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },

  gpsButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginTop: 8,
    elevation: 4
  },
  gpsText: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginLeft: 4 },

  radiusControls: {
    position: 'absolute', bottom: 100, right: 20,
    alignItems: 'center', gap: 10,
  },
  radiusBadge: { backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 },
  radiusText: { fontWeight: 'bold', color: colors.primary },
  radiusButtons: { flexDirection: 'column', gap: 10 },
  controlBtn: {
    backgroundColor: 'white', width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  btnText: { fontSize: 20, fontWeight: 'bold' },
  legend: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10, borderRadius: 25, elevation: 4
  },
  legendText: { fontWeight: "bold", color: colors.text },
  refreshBtn: {
    position: 'absolute', bottom: 100, left: 20,
    backgroundColor: 'white', padding: 10, borderRadius: 30, elevation: 5
  }
});