import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { colors } from "../styles/theme";
import { getAllRestaurants, getRestaurantsNearby } from "../services/Database";
import 'leaflet/dist/leaflet.css'; // Indispensable pour que la carte s'affiche bien

// Variables pour les modules chargés dynamiquement
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any;

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

export const MapView = ({ onRestaurantSelect }: MapViewProps) => {
  const [libLoaded, setLibLoaded] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [purpleIcon, setPurpleIcon] = useState<any>(null);
  const [orangeIcon, setOrangeIcon] = useState<any>(null);
  const [radiusKm, setRadiusKm] = useState<number>(4);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [citiesIndex, setCitiesIndex] = useState<{ label: string; lat: number; lon: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

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

          // Custom icons matching the reference design
          const createCustomIcon = (color: string) => L.divIcon({
            className: 'custom-marker-icon',
            html: `<div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${color};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          setPurpleIcon(createCustomIcon('#6B4EFF'));
          setOrangeIcon(createCustomIcon('#FF8C00'));
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
          setUserPosition([latitude, longitude]);
          setPosition([latitude, longitude]);
        },
        (err) => {
          console.warn("Erreur GPS Web:", err);
          // Fallback sur Paris si refus ou erreur
          setUserPosition([48.8566, 2.3522]);
          setPosition([48.8566, 2.3522]);
        }
      );
    }
  }, []);

  useEffect(() => {
    const buildCityIndex = async () => {
      try {
        const all = await getAllRestaurants();
        const map = new Map<string, { label: string; latSum: number; lonSum: number; count: number }>();
        all.forEach((r: any) => {
          if (typeof r.lat !== "number" || typeof r.lon !== "number") return;
          const label = r.meta_name_com || r.meta_name_dep || r.meta_name_reg || "";
          if (!label) return;
          const key = String(label).toLowerCase();
          const existing = map.get(key) || { label, latSum: 0, lonSum: 0, count: 0 };
          existing.latSum += r.lat;
          existing.lonSum += r.lon;
          existing.count += 1;
          map.set(key, existing);
        });
        const aggregated = Array.from(map.values()).map((item) => ({
          label: item.label,
          lat: item.latSum / item.count,
          lon: item.lonSum / item.count,
        }));
        setCitiesIndex(aggregated);
      } catch (e) {
        console.error("Erreur construction index villes:", e);
      }
    };
    buildCityIndex();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchNearby = async () => {
      if (!position) return;
      try {
        setLoadingNearby(true);
        const data = await getRestaurantsNearby(position[0], position[1], radiusKm);
        if (isMounted) {
          setRestaurants(data);
          // Auto-sélectionner le premier restaurant
          if (data.length > 0) {
            setSelectedRestaurant(data[0]);
          }
        }
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

  const citySuggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (q.length < 2) return [];
    return citiesIndex
      .filter((c) => c.label.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchText, citiesIndex]);

  const handleCitySelect = (city: { label: string; lat: number; lon: number }) => {
    setSearchText(city.label);
    setPosition([city.lat, city.lon]);
    setShowSuggestions(false);
  };

  const resetToUserPosition = () => {
    if (userPosition) {
      setPosition(userPosition);
      setSearchText("");
    }
  };

  if (!libLoaded || !position || !purpleIcon || !orangeIcon) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.inactive }}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Conteneur HTML standard pour la carte */}
      <div style={{ height: '100vh', width: '100%', zIndex: 0 }}>
        <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>

          {/* Tile Layer with lighter style */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          />

          {/* Marqueur position utilisateur (orange) */}
          <Marker position={position} icon={orangeIcon} />

          {/* Marqueurs Restaurants (purple) */}
          {restaurants.map((resto) => (
            <Marker
              key={resto.id}
              position={[resto.lat, resto.lon]}
              icon={purpleIcon}
              eventHandlers={{
                click: () => {
                  setSelectedRestaurant(resto);
                  // Ne pas ouvrir la vue détaillée
                },
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>{resto.name}</strong><br />
                  <span style={{ fontSize: '0.9em', color: '#666' }}>{resto.cuisines || resto.type}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Barre de recherche moderne */}
      <div style={webStyles.searchBox}>
        <div style={webStyles.searchRow}>
          <div style={webStyles.searchInputWrapper}>
            <span style={webStyles.searchIcon}>🔍</span>
            <input
              style={webStyles.searchInput}
              value={searchText}
              onChange={(e: any) => {
                setSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Rechercher une zone..."
            />
          </div>
          <button style={webStyles.filterButton} title="Filtres">
            ⚙️
          </button>
        </div>

        {/* Badges */}
        <div style={webStyles.badgesRow}>
          <button style={webStyles.badge}>Ouvert (48)</button>
          <button style={webStyles.badge}>€€ Moins de 15€</button>
          <button style={webStyles.badge}>≤ {radiusKm} km</button>
        </div>

        {showSuggestions && citySuggestions.length > 0 && (
          <div style={webStyles.suggestions}>
            {citySuggestions.map((c) => (
              <div
                key={`${c.label}-${c.lat}-${c.lon}`}
                style={webStyles.suggestionItem}
                onClick={() => handleCitySelect(c)}
              >
                {c.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contrôles rayon (minimalistes) */}
      <div style={webStyles.radiusControl}>
        <button
          style={webStyles.radiusButton}
          onClick={() => changeRadius(-1)}
          disabled={radiusKm <= 1}
        >
          -
        </button>
        <button
          style={webStyles.radiusButton}
          onClick={() => changeRadius(1)}
          disabled={radiusKm >= 30}
        >
          +
        </button>
      </div>

      {/* Carte restaurant en bas */}
      {selectedRestaurant && (
        <div style={webStyles.restaurantCard}>
          <img
            src={selectedRestaurant.image || 'https://via.placeholder.com/80'}
            style={webStyles.restaurantImage}
            alt={selectedRestaurant.name}
          />
          <div style={webStyles.restaurantInfo}>
            <div style={webStyles.restaurantName}>{selectedRestaurant.name}</div>
            <div style={webStyles.restaurantType}>
              {selectedRestaurant.cuisines || selectedRestaurant.type} • €€
            </div>
            <div style={webStyles.restaurantMeta}>
              <span style={webStyles.restaurantStatus}>Ouvert</span>
              <span style={webStyles.restaurantDot}> • </span>
              <span style={webStyles.restaurantDistance}>
                {selectedRestaurant.distance ? `${selectedRestaurant.distance.toFixed(1)} km` : '0.5km'}
              </span>
            </div>
          </div>
          <button style={webStyles.favoriteButton}>♡</button>
          <button
            style={webStyles.navigationButton}
            onClick={() => {
              // Action de navigation
              console.log('Navigation vers:', selectedRestaurant.name);
            }}
          >
            ➤
          </button>
        </div>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

// Styles CSS spécifiques au Web (pour la légende flottante)
const webStyles = {
  searchBox: {
    position: 'absolute' as 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    width: '320px',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  searchRow: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    gap: '10px',
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative' as 'relative',
    display: 'flex',
    flexDirection: 'row' as 'row',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px 15px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    alignItems: 'center',
    gap: '8px',
  },
  searchIcon: {
    fontSize: '16px',
    color: '#999',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    fontFamily: 'inherit',
  },
  filterButton: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer' as 'pointer',
    fontSize: '18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    gap: '8px',
    flexWrap: 'wrap' as 'wrap',
  },
  badge: {
    backgroundColor: colors.primary || '#8a60c2',
    color: 'white',
    border: 'none',
    paddingLeft: '14px',
    paddingRight: '14px',
    paddingTop: '8px',
    paddingBottom: '8px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer' as 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  suggestions: {
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  suggestionItem: {
    padding: '12px 15px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer' as 'pointer',
    fontSize: '14px',
  },
  radiusControl: {
    position: 'absolute' as 'absolute',
    bottom: '200px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '10px',
  },
  radiusButton: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#fff',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer' as 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  restaurantCard: {
    position: 'absolute' as 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'row' as 'row',
    padding: '12px',
    alignItems: 'center',
    gap: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  restaurantImage: {
    width: '70px',
    height: '70px',
    borderRadius: '12px',
    objectFit: 'cover' as 'cover',
    backgroundColor: '#f0f0f0',
  },
  restaurantInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '4px',
  },
  restaurantName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#333',
  },
  restaurantType: {
    fontSize: '13px',
    color: '#666',
  },
  restaurantMeta: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    gap: '4px',
  },
  restaurantStatus: {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: 600,
  },
  restaurantDot: {
    fontSize: '12px',
    color: '#999',
  },
  restaurantDistance: {
    fontSize: '12px',
    color: '#999',
  },
  favoriteButton: {
    width: '40px',
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer' as 'pointer',
    fontSize: '24px',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    border: 'none',
    backgroundColor: colors.grayeOrange || '#FF8C00',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer' as 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(255,140,0,0.3)',
  },
};
