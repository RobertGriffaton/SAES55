import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";

// Définition des props attendues par la vue
interface RestaurantDetailProps {
  restaurant: any;
  onBack: () => void;
}

// NOTEZ LE "export const" ICI (C'est ce qui corrige l'erreur)
export const RestaurantDetailView = ({ restaurant, onBack }: RestaurantDetailProps) => {

  // Fonction utilitaire pour ouvrir les liens externes
  const openLink = (type: 'tel' | 'web' | 'map') => {
    let url = '';
    
    // Appel téléphonique
    if (type === 'tel' && restaurant.phone) {
        url = `tel:${restaurant.phone.replace(/\s/g, '')}`;
    }
    
    // Site Web
    if (type === 'web' && restaurant.website) {
        url = restaurant.website;
    }
    
    // GPS (Google Maps / Apple Plans)
    if (type === 'map') {
      const label = encodeURIComponent(restaurant.name);
      // Format universel pour mobile
      url = `geo:0,0?q=${restaurant.lat},${restaurant.lon}(${label})`;
    }

    if (url) {
        Linking.openURL(url).catch(err => console.error("Erreur ouverture lien", err));
    } else {
        console.warn("Lien indisponible pour", type);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER : Image Placeholder + Bouton Retour --- */}
      <View style={styles.imageContainer}>
        <View style={styles.placeholderImage}>
          <Ionicons name="restaurant" size={60} color="#fff" />
        </View>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* --- TITRE ET TYPE --- */}
        <Text style={styles.title}>{restaurant.name}</Text>
        <Text style={styles.subtitle}>
          {restaurant.type?.replace('_', ' ')} • {restaurant.cuisines ? restaurant.cuisines.replace(',', ', ') : "Cuisine variée"}
        </Text>

        {/* --- TAGS (Végétarien, etc.) --- */}
        <View style={styles.tagsRow}>
          {restaurant.vegetarian === 1 && <Tag icon="leaf" label="Végétarien" color="green" />}
          {restaurant.vegan === 1 && <Tag icon="nutrition" label="Végan" color="green" />}
          {restaurant.takeaway === 1 && <Tag icon="basket" label="A emporter" color="orange" />}
        </View>

        <View style={styles.divider} />

        {/* --- INFORMATIONS PRATIQUES --- */}
        <InfoRow icon="location" text={`${restaurant.lat?.toFixed(5)}, ${restaurant.lon?.toFixed(5)}`} />
        
        {restaurant.phone && (
            <InfoRow icon="call" text={restaurant.phone} onPress={() => openLink('tel')} isLink />
        )}
        
        {restaurant.website && (
            <InfoRow icon="globe" text="Visiter le site web" onPress={() => openLink('web')} isLink />
        )}

        {restaurant.opening_hours && (
            <InfoRow icon="time" text={restaurant.opening_hours} />
        )}

        {/* --- BOUTONS D'ACTION (En bas) --- */}
        <View style={styles.actionsRow}>
          <ActionButton label="Y aller" icon="navigate" primary onPress={() => openLink('map')} />
          {restaurant.phone && (
            <ActionButton label="Appeler" icon="call" onPress={() => openLink('tel')} />
          )}
        </View>
        
        {/* Espace vide pour scroller confortablement en bas */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// --- PETITS COMPOSANTS INTERNES (Pour garder le code propre) ---

const Tag = ({ label, icon, color }: any) => (
  <View style={[styles.tag, { borderColor: color }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[styles.tagText, { color }]}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, text, onPress, isLink }: any) => (
  <TouchableOpacity disabled={!onPress} onPress={onPress} style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={colors.inactive || '#888'} />
    <Text style={[styles.infoText, isLink && { color: colors.primary, textDecorationLine: 'underline' }]}>
      {text}
    </Text>
  </TouchableOpacity>
);

const ActionButton = ({ label, icon, primary, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.actionButton, primary ? styles.btnPrimary : styles.btnSecondary]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={20} color={primary ? "#fff" : colors.text} />
    <Text style={[styles.btnText, primary ? { color: "#fff" } : { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  // Header Image
  imageContainer: { height: 200, backgroundColor: colors.primary },
  placeholderImage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ddd' },
  backButton: { 
    position: 'absolute', top: 40, left: 20, 
    backgroundColor: '#fff', padding: 8, borderRadius: 20, 
    elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.2, shadowRadius:2
  },

  content: { padding: spacing.large || 20 },
  
  // Textes
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.inactive || '#888', marginBottom: 16, textTransform: 'capitalize' },
  
  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  
  // Infos
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  infoText: { fontSize: 16, color: colors.text, flex: 1 }, // flex:1 pour éviter que le texte sorte de l'écran
  
  // Boutons
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnText: { fontWeight: '600', fontSize: 16 },
});