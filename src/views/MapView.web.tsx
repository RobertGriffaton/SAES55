import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import { colors } from "../styles/theme";
import { getAllRestaurants, getRestaurantsNearby, addFavorite, removeFavorite, isFavorite, getFavorites } from "../services/Database";
import { getActiveProfile } from "../controllers/ProfileController";
import 'leaflet/dist/leaflet.css';

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
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [citiesIndex, setCitiesIndex] = useState<{ label: string; lat: number; lon: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userId, setUserId] = useState<string>('default');
  const [favoritesList, setFavoritesList] = useState<Set<number>>(new Set());

  // charger l'utilisateur et ses favoris
  useEffect(() => {
    const init = async () => {
      const profile = await getActiveProfile();
      const uid = profile?.id || 'default';
      setUserId(uid);

      const favs = await getFavorites(uid);
      setFavoritesList(new Set(favs.map(f => Number(f.id))));
    };
    init();
  }, []);

  const toggleFavorite = async (restaurant: any) => {
    const restaurantId = Number(restaurant.id);
    const isFav = favoritesList.has(restaurantId);

    if (isFav) {
      await removeFavorite(restaurantId, userId);
      const newList = new Set(favoritesList);
      newList.delete(restaurantId);
      setFavoritesList(newList);
    } else {
      await addFavorite(restaurantId, userId);
      const newList = new Set(favoritesList);
      newList.add(restaurantId);
      setFavoritesList(newList);
    }
  };

  useEffect(() => {
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

          setLibLoaded(true);
        } catch (e) {
          console.error("Erreur chargement Leaflet:", e);
        }
      }
    };
    loadLeaflet();

    if (typeof navigator !== 'undefined') {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserPosition([latitude, longitude]);
          setPosition([latitude, longitude]);
        },
        () => {
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
      } catch (e) { }
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
        if (isMounted) setRestaurants(data);
      } catch (e) { } finally {
        if (isMounted) setLoadingNearby(false);
      }
    };
    fetchNearby();
    return () => { isMounted = false; };
  }, [position, radiusKm]);

  // Helper pour créer les icônes rondes colorées
  const getCircleIcon = (color: string, iconMarkup?: string, size: number = 32) => {
    const half = size / 2;
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: ${size > 32 ? '4px' : '3px'} solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: ${size / 2}px;
      ">${iconMarkup || '<div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>'}</div>`,
      iconSize: [size, size],
      iconAnchor: [half, half],
      popupAnchor: [0, -half]
    });
  };

  const citySuggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (q.length < 2) return [];
    return citiesIndex
      .filter((c) => c.label.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchText, citiesIndex]);

  if (!libLoaded || !position) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.inactive }}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div style={{ height: '100vh', width: '100%', zIndex: 0 }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            icon={getCircleIcon('#FF8C00', '📍', 48)}
          >
            <Popup>Vous recherchez ici</Popup>
          </Marker>

          {restaurants.map((resto) => {
            const cuisine = (resto.cuisines || resto.type || '').toLowerCase();
            let color = '#6B4EFF';
            let emoji = '';

            if (cuisine.includes('burger') || cuisine.includes('fast')) { color = '#FF6B6B'; emoji = '🍔'; }
            else if (cuisine.includes('pizza')) { color = '#FFA500'; emoji = '🍕'; }
            else if (cuisine.includes('sushi') || cuisine.includes('japonais')) { color = '#FF69B4'; emoji = '🍱'; }
            else if (cuisine.includes('kebab')) { color = '#8B4513'; emoji = '🥙'; }
            else if (cuisine.includes('cafe')) { color = '#8B4513'; emoji = '☕'; }

            return (
              <Marker
                key={resto.id}
                position={[resto.lat, resto.lon]}
                icon={getCircleIcon(color, emoji)}
                eventHandlers={{
                  click: () => onRestaurantSelect && onRestaurantSelect(resto),
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <button
                        onClick={() => toggleFavorite(resto)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontSize: '20px' }}
                      >
                        {favoritesList.has(Number(resto.id)) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <strong style={{ fontSize: '16px' }}>{resto.name}</strong><br />
                    <span style={{ fontSize: '13px', color: '#666' }}>{resto.cuisines || resto.type}</span>
                    <br />
                    <button
                      onClick={() => onRestaurantSelect && onRestaurantSelect(resto)}
                      style={{
                        marginTop: '10px', padding: '6px 12px', background: colors.primary,
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '12px'
                      }}
                    >
                      Détails
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Floating UI elements with modern look */}
      <div style={webStyles.uiWrapper}>
        <div style={webStyles.searchBar}>
          <div style={webStyles.inputRow}>
            <span style={{ marginRight: '10px' }}>🔍</span>
            <input
              style={webStyles.input}
              value={searchText}
              onChange={(e: any) => { setSearchText(e.target.value); setShowSuggestions(true); }}
              placeholder="Rechercher une ville..."
            />
            {userPosition && (
              <button style={webStyles.gpsBtn} onClick={() => setPosition(userPosition)}>📍</button>
            )}
          </div>
          {showSuggestions && citySuggestions.length > 0 && (
            <div style={webStyles.suggestions}>
              {citySuggestions.map((c) => (
                <div key={c.label} style={webStyles.suggestionItem} onClick={() => {
                  setSearchText(c.label); setPosition([c.lat, c.lon]); setShowSuggestions(false);
                }}>{c.label}</div>
              ))}
            </div>
          )}
        </div>

        <div style={webStyles.badges}>
          <div style={webStyles.badgeOuvert}>Ouvert (48)</div>
          <div style={webStyles.badgeRadius}>≤ {radiusKm} km</div>
        </div>
      </div>

      <div style={webStyles.bottomRightControls}>
        <div style={webStyles.radiusCard}>
          <div style={webStyles.radiusButtons}>
            <button style={webStyles.circBtn} onClick={() => setRadiusKm(r => Math.max(1, r - 1))}>+</button>
            <button style={webStyles.circBtn} onClick={() => setRadiusKm(r => Math.min(50, r + 1))}>-</button>
          </div>
        </div>
        <div style={webStyles.legend}>{restaurants.length} trouvés</div>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

const webStyles = {
  uiWrapper: {
    position: 'absolute' as 'absolute', top: '25px', left: '25px', zIndex: 1000,
    display: 'flex', flexDirection: 'column' as 'column', gap: '15px'
  },
  searchBar: {
    backgroundColor: 'white', padding: '10px 15px', borderRadius: '15px', width: '320px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' as 'column'
  },
  inputRow: { display: 'flex', alignItems: 'center' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '15px', padding: '5px' },
  gpsBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  suggestions: { marginTop: '10px', borderTop: '1px solid #eee' },
  suggestionItem: { padding: '10px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f9f9f9' },

  badges: { display: 'flex', gap: '10px' },
  badgeOuvert: {
    background: colors.primary, color: 'white', padding: '8px 15px', borderRadius: '20px',
    fontSize: '13px', fontWeight: 'bold' as 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },
  badgeRadius: {
    background: 'white', color: '#333', padding: '8px 15px', borderRadius: '20px',
    fontSize: '13px', fontWeight: 'bold' as 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },

  bottomRightControls: {
    position: 'absolute' as 'absolute', bottom: '30px', right: '30px', zIndex: 1000,
    display: 'flex', flexDirection: 'column' as 'column', alignItems: 'flex-end', gap: '15px'
  },
  radiusCard: {
    background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
  },
  radiusButtons: { display: 'flex', flexDirection: 'column' as 'column', gap: '8px' },
  circBtn: {
    width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #eee',
    background: 'white', cursor: 'pointer', fontWeight: 'bold' as 'bold', fontSize: '20px'
  },
  legend: {
    background: 'rgba(255,255,255,0.9)', padding: '8px 15px', borderRadius: '20px',
    fontSize: '14px', fontWeight: 'bold' as 'bold', color: '#333', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  }
};
