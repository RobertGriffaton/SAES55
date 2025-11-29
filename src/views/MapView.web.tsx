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
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [loadingNearby, setLoadingNearby] = useState(false);

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
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
            },
            (err) => {
                console.warn("Erreur GPS Web:", err);
                // Fallback sur Paris si refus ou erreur
                setPosition([48.8566, 2.3522]);
            }
        );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchNearby = async () => {
      if (!position) return;
      try {
        setLoadingNearby(true);
        const data = await getRestaurantsNearby(position[0], position[1], radiusKm);
        if (isMounted) setRestaurants(data);
      } catch (e) {
        console.error("Erreur chargement restos autour:", e);
      } finally {
        if (isMounted) setLoadingNearby(false);
      }
    };
    fetchNearby();
    return () => {
      isMounted = false;
    };
  }, [position, radiusKm]);

  const changeRadius = (delta: number) => {
    setRadiusKm((prev) => {
      const next = Math.max(1, Math.min(30, prev + delta));
      return next;
    });
  };

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

      {/* Contrôle du rayon */}
      <div style={webStyles.radiusControl}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          Rayon : {radiusKm} km
        </div>
        <div style={webStyles.radiusButtons}>
          <button
            style={{ ...webStyles.radiusButton, opacity: radiusKm <= 1 ? 0.6 : 1 }}
            onClick={() => changeRadius(-1)}
            disabled={radiusKm <= 1}
          >
            -
          </button>
          <button
            style={{ ...webStyles.radiusButton, opacity: radiusKm >= 30 ? 0.6 : 1 }}
            onClick={() => changeRadius(1)}
            disabled={radiusKm >= 30}
          >
            +
          </button>
        </div>
        {loadingNearby ? (
          <div style={webStyles.radiusHint}>Mise à jour des restaurants...</div>
        ) : (
          <div style={webStyles.radiusHint}>Ajuste le rayon pour voir plus ou moins de restos.</div>
        )}
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
    },
    radiusControl: {
        position: 'absolute' as 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '12px 14px',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        zIndex: 1000,
        width: '180px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    radiusButtons: {
        display: 'flex',
        gap: '8px'
    },
    radiusButton: {
        flex: 1,
        padding: '10px 0',
        borderRadius: '10px',
        border: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer' as 'pointer'
    },
    radiusHint: {
        marginTop: '8px',
        fontSize: '12px',
        color: '#666',
        lineHeight: 1.4
    }
};
