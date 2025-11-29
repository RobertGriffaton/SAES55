import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Callout, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { colors } from "../styles/theme";
import { getRestaurantsNearby } from "../services/Database";

interface MapViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

const MapViewComponent = ({ onRestaurantSelect }: MapViewProps) => {
  const [region, setRegion] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      try {
        const data = await getRestaurantsNearby(latitude, longitude, 2);
        setRestaurants(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !region) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="none" // On cache Google Maps
      >
        {/* SERVEUR DE TUILES CARTODB (Plus rapide et pas de blocage) */}
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={-1}
          shouldReplaceMapContent={true}
        />

        {restaurants.map((resto) => (
          <Marker
            key={resto.id}
            coordinate={{ latitude: resto.lat, longitude: resto.lon }}
            pinColor={colors.primary}
          >
            <Callout onPress={() => onRestaurantSelect && onRestaurantSelect(resto)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{resto.name}</Text>
                <Text>ℹ️ Voir détails</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export { MapViewComponent as MapView };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { width: "100%", height: "100%" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  callout: { width: 150, padding: 5 },
  calloutTitle: { fontWeight: "bold", marginBottom: 5 },
});