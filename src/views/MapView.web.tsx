import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { colors } from "../styles/theme";
import { getRestaurantsNearby } from "../services/Database";
import 'leaflet/dist/leaflet.css'; // Indispensable pour que la carte s'affiche bien

// Variables pour les modules chargés dynamiquement
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any;

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

export const MapView = ({ onRestaurantSelect }: MapViewProps) => {
  const [libLoaded, setLibLoaded] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  // Position par défaut (Paris) en attendant la géolocalisation
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    // 1. Chargement dynamique de Leaflet (pour éviter les erreurs de compilation "window is undefined")
    const loadLeaflet = async () => {
      if (Platform.OS === 'web') {
        try {
          const ReactLeaflet = require('react-leaflet');
          const Leaflet = require('leaflet');
          
          MapContainer = ReactLeaflet.MapContainer;
          TileLayer = ReactLeaflet.TileLayer;
          Marker = ReactLeaflet.Marker;
          Popup = ReactLeaflet.Popup;
          L = Leaflet;

          // Correction des icônes par défaut de Leaflet qui sont souvent brisées en React
          const myIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          });
          setIcon(myIcon);
          setLibLoaded(true);
        } catch (e) {
          console.error("Erreur chargement Leaflet:", e);
        }
      }
    };
    loadLeaflet();

    // 2. Géolocalisation du navigateur
    if (typeof navigator !== 'undefined') {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                // On charge les restos autour
                const data = await getRestaurantsNearby(latitude, longitude, 5);
                setRestaurants(data);
            },
            (err) => {
                console.warn("Erreur GPS Web:", err);
                // Fallback sur Paris si refus ou erreur
                setPosition([48.8566, 2.3522]);
            }
        );
    }
  }, []);

  if (!libLoaded || !position || !icon) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{marginTop: 10, color: colors.inactive}}>Chargement de la carte...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Conteneur HTML standard pour la carte */}
      <div style={{ height: '100vh', width: '100%', zIndex: 0 }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          
          {/* C'EST ICI QU'ON CHANGE POUR CARTODB (Comme sur mobile) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          />
          
          {/* Marqueur "Vous êtes ici" */}
          <Marker position={position} icon={icon}>
            <Popup>📍 Vous êtes ici</Popup>
          </Marker>

          {/* Marqueurs Restaurants */}
          {restaurants.map((resto) => (
             <Marker 
                key={resto.id} 
                position={[resto.lat, resto.lon]}
                icon={icon}
                eventHandlers={{
                    click: () => onRestaurantSelect && onRestaurantSelect(resto),
                }}
             >
                <Popup>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{resto.name}</strong><br/>
                        <span style={{ fontSize: '0.9em', color: '#666' }}>{resto.cuisines || resto.type}</span>
                        <br/>
                        <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 'bold' }}>
                            ℹ️ Voir détails
                        </a>
                    </div>
                </Popup>
             </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Légende flottante */}
      <div style={webStyles.legend}>
        {restaurants.length} restaurants trouvés
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

// Styles CSS spécifiques au Web (pour la légende flottante)
const webStyles = {
    legend: {
        position: 'absolute' as 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: 1000,
        fontWeight: 'bold',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    }
};