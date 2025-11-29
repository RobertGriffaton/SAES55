import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Image,
  useWindowDimensions, // <--- AJOUTÉ
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";

// --- MAPPING DES IMAGES ---
const CATEGORY_IMAGES: Record<string, any> = {
  "francais": require("../../assets/imagescover/francais.png"),
  "pizza": require("../../assets/imagescover/pizza.png"),
  "japonais": require("../../assets/imagescover/japonais.png"),
  "italien": require("../../assets/imagescover/italien.png"),
  "burger": require("../../assets/imagescover/burger.png"),
  "asiatique": require("../../assets/imagescover/asiatique.png"),
  "kebab": require("../../assets/imagescover/kebab.png"),
  "chinois": require("../../assets/imagescover/chinois.png"),
  "sandwich": require("../../assets/imagescover/sandwich.png"),
  "cafe": require("../../assets/imagescover/cafe.png"),
  "asie_du_sud": require("../../assets/imagescover/asie_du_sud.png"),
  "creperie": require("../../assets/imagescover/creperie.png"),
  "thai": require("../../assets/imagescover/thai.png"),
  "poulet": require("../../assets/imagescover/poulet.png"),
  "vietnamien": require("../../assets/imagescover/vietnamien.png"),
  "middle_eastern": require("../../assets/imagescover/middle_eastern.png"),
  "oriental": require("../../assets/imagescover/oriental.png"),
  "healthy": require("../../assets/imagescover/healthy.png"),
  "latino": require("../../assets/imagescover/latino.png"),
  "coreen": require("../../assets/imagescover/coreen.png"),
  "turkish": require("../../assets/imagescover/turkish.png"),
  "grill": require("../../assets/imagescover/grill.png"),
  "patisserie": require("../../assets/imagescover/patisserie.png"),
  "europeen": require("../../assets/imagescover/europeen.png"),
  "fast_food": require("../../assets/imagescover/fast_food.png"),
  "africain": require("../../assets/imagescover/africain.png"),
  "bubble_tea": require("../../assets/imagescover/bubble_tea.png"),
  "fruits_de_mer": require("../../assets/imagescover/fruits_de_mer.png"),
  "americain": require("../../assets/imagescover/americain.png"), 
  "divers": require("../../assets/imagescover/divers.png"),
  "mediterranean": require("../../assets/imagescover/mediterranean.png"),
  "grec": require("../../assets/imagescover/grec.png"),
  "espagnol": require("../../assets/imagescover/espagnol.png"),
  "tacos": require("../../assets/imagescover/tacos.png"),
  "creole": require("../../assets/imagescover/creole.png"),
  "balkans": require("../../assets/imagescover/balkans.png"),
  "bar": require("../../assets/imagescover/bar.png"),
};

interface RestaurantDetailProps {
  restaurant: any;
  onBack: () => void;
}

export const RestaurantDetailView = ({ restaurant, onBack }: RestaurantDetailProps) => {
  // --- RESPONSIVE LOGIC ---
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768; // On considère PC/Tablette au-dessus de 768px

  // --- LOGIQUE IMAGE ---
  const imageSource = useMemo(() => {
    if (!restaurant) return null;
    let candidates: string[] = [];
    if (restaurant.cuisines) {
      candidates = [...candidates, ...String(restaurant.cuisines).split(",")];
    }
    if (restaurant.type) {
      candidates.push(String(restaurant.type));
    }

    for (const rawKey of candidates) {
      const cleanKey = rawKey.trim().toLowerCase().replace(/ /g, "_").replace(/-/g, "_");
      if (CATEGORY_IMAGES[cleanKey]) return CATEGORY_IMAGES[cleanKey];
    }
    return null;
  }, [restaurant]);

  // Fonction utilitaire
  const openLink = (type: 'tel' | 'web' | 'map') => {
    let url = '';
    if (type === 'tel' && restaurant.phone) url = `tel:${restaurant.phone.replace(/\s/g, '')}`;
    if (type === 'web' && restaurant.website) url = restaurant.website;
    if (type === 'map') {
      const label = encodeURIComponent(restaurant.name);
      url = `geo:0,0?q=${restaurant.lat},${restaurant.lon}(${label})`;
    }
    if (url) Linking.openURL(url).catch(err => console.error("Erreur", err));
  };

  return (
    // ROOT : Prend tout l'écran, couleur de fond neutre
    <View style={styles.rootContainer}>
      
      {/* CENTRAGE : Sur PC, on centre tout le contenu dans une boite de max 900px */}
      <View style={[styles.mainContainer, isLargeScreen && styles.mainContainerWeb]}>
        
        {/* --- HEADER IMAGE --- */}
        <View style={[
          styles.imageContainer, 
          // Sur PC, on agrandit l'image et on arrondit les coins pour faire "Carte"
          isLargeScreen && { height: 400, borderRadius: 16, marginTop: 20, overflow: 'hidden' }
        ]}>
          {imageSource ? (
            <Image 
              source={imageSource} 
              style={styles.coverImage} 
              resizeMode="cover" 
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant" size={60} color="#fff" />
            </View>
          )}

          {/* Bouton retour */}
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* --- CONTENU DÉFILANT --- */}
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* TITRE ET TYPE */}
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.subtitle}>
            {restaurant.type?.replace('_', ' ')} • {restaurant.cuisines ? restaurant.cuisines.replace(',', ', ') : "Cuisine variée"}
          </Text>

          {/* TAGS */}
          <View style={styles.tagsRow}>
            {restaurant.vegetarian === 1 && <Tag icon="leaf" label="Végétarien" color="green" />}
            {restaurant.vegan === 1 && <Tag icon="nutrition" label="Végan" color="green" />}
            {restaurant.takeaway === 1 && <Tag icon="basket" label="A emporter" color="orange" />}
          </View>

          <View style={styles.divider} />

          {/* INFORMATIONS PRATIQUES */}
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

          {/* BOUTONS D'ACTION */}
          <View style={styles.actionsRow}>
            <ActionButton label="Y aller" icon="navigate" primary onPress={() => openLink('map')} />
            {restaurant.phone && (
              <ActionButton label="Appeler" icon="call" onPress={() => openLink('tel')} />
            )}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
};

// --- PETITS COMPOSANTS ---
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
  // Root prend tout l'écran
  rootContainer: { 
    flex: 1, 
    backgroundColor: "#fff" // ou une couleur de fond grisée pour le web : #f9f9f9
  },

  // Conteneur principal qui s'adapte
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
  // Style spécifique PC : centré et limité en largeur
  mainContainerWeb: {
    alignSelf: "center",
    maxWidth: 900, // Largeur max type "Site Web"
    width: "100%",
    // Optionnel : ajouter une ombre sur PC pour faire ressortir la "page"
    // shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
  },

  // Header Image
  imageContainer: { 
    height: 250, 
    backgroundColor: colors.primary,
    position: 'relative'
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ddd' 
  },
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'web' ? 20 : 50, // Ajustement safe area
    left: 20, 
    backgroundColor: '#fff', 
    padding: 8, 
    borderRadius: 20, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: {width:0, height:2}, 
    shadowOpacity:0.2, 
    shadowRadius:2,
    zIndex: 10 
  },

  content: { padding: spacing.large || 20 },
  
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.inactive || '#888', marginBottom: 16, textTransform: 'capitalize' },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  infoText: { fontSize: 16, color: colors.text, flex: 1 },
  
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnText: { fontWeight: '600', fontSize: 16 },
});