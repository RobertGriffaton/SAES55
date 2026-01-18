import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  useWindowDimensions,
  Platform,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
import { logInteraction, addFavorite, removeFavorite, isFavorite as checkIsFavorite } from "../services/Database";
import { getActiveProfile } from "../controllers/ProfileController";

// --- MAPPING DES IMAGES ---
const CATEGORY_IMAGES: Record<string, any> = {
  // MARQUES
  "mcdonald's": require("../../assets/imagescover/mcdo.png"),

  // TYPES
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
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string>('default');

  useEffect(() => {
    const init = async () => {
      // Récupérer le profil actif pour l'userId
      const profile = await getActiveProfile();
      const uid = profile?.id || 'default';
      setUserId(uid);

      if (restaurant && restaurant.id) {
        logInteraction(restaurant.id, restaurant.cuisines, 'view');
        // Vérifier si le restaurant est déjà en favori pour cet utilisateur
        const fav = await checkIsFavorite(Number(restaurant.id), uid);
        setIsFavorite(fav);
      }
    };
    init();
  }, [restaurant]);

  // --- LOGIQUE IMAGE ---
  const imageSource = useMemo(() => {
    if (!restaurant) return null;
    let candidates: string[] = [];

    // 1. BRAND (JSON field: "brand": "McDonald's")
    if (restaurant.brand) candidates.push(String(restaurant.brand));
    // 2. NAME
    if (restaurant.name) candidates.push(String(restaurant.name));

    // 3. CUISINES (Gestion array ou string)
    const cuisinesData = restaurant.cuisines || restaurant.cuisine;
    if (cuisinesData) {
      const cuisineString = Array.isArray(cuisinesData) ? cuisinesData.join(",") : String(cuisinesData);
      candidates = [...candidates, ...cuisineString.split(",")];
    }

    // 4. TYPE
    if (restaurant.type) candidates.push(String(restaurant.type));

    for (const rawKey of candidates) {
      const cleanKey = rawKey.trim().toLowerCase().replace(/ /g, "_").replace(/-/g, "_");
      if (CATEGORY_IMAGES[cleanKey]) return CATEGORY_IMAGES[cleanKey];

      const noApostrophe = cleanKey.replace(/'/g, "");
      if (CATEGORY_IMAGES[noApostrophe]) return CATEGORY_IMAGES[noApostrophe];
    }
    return null;
  }, [restaurant]);

  // Formatage affichage cuisines
  const displayCuisines = (restaurant.cuisines || restaurant.cuisine)
    ? (Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : String(restaurant.cuisines).replace(/,/g, ", "))
    : (restaurant.type ? String(restaurant.type).replace(/_/g, " ") : "Cuisine variée");

  // Calcul du score de match (simulé basé sur les données)
  const matchScore = useMemo(() => {
    if (restaurant.score) return Math.round(restaurant.score);
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  }, [restaurant]);

  const openLink = async (type: 'tel' | 'web' | 'map') => {
    const actionType = type === 'map' ? 'route' : (type === 'tel' ? 'call' : 'website');
    if (restaurant && restaurant.id) {
      await logInteraction(restaurant.id, restaurant.cuisines, actionType);
    }

    let url = '';
    if (type === 'tel' && restaurant.phone) url = `tel:${restaurant.phone.replace(/\s/g, '')}`;
    if (type === 'web' && restaurant.website) url = restaurant.website;
    if (type === 'map') {
      const label = encodeURIComponent(restaurant.name);
      url = Platform.select({
        ios: `maps:0,0?q=${label}@${restaurant.lat},${restaurant.lon}`,
        android: `geo:0,0?q=${restaurant.lat},${restaurant.lon}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lon}`
      }) || "";
    }
    if (url) Linking.openURL(url).catch(err => console.error("Erreur lien", err));
  };

  const toggleFavorite = async () => {
    const restaurantId = Number(restaurant.id);
    if (isFavorite) {
      await removeFavorite(restaurantId, userId);
      setIsFavorite(false);
    } else {
      await addFavorite(restaurantId, userId);
      setIsFavorite(true);
    }
  };

  // Calcul distance formatée
  const formattedDistance = useMemo(() => {
    if (restaurant.distance) {
      const km = restaurant.distance;
      if (km < 1) return `${Math.round(km * 1000)}m`;
      return `${km.toFixed(1)}km`;
    }
    return null;
  }, [restaurant]);

  return (
    <View style={[styles.rootContainer, isLargeScreen && { backgroundColor: "#f5f5f5" }]}>
      <View style={[styles.mainContainer, isLargeScreen && styles.mainContainerWeb]}>

        {/* === IMAGE HEADER === */}
        <View style={styles.imageContainer}>
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

          {/* Gradient overlay en haut */}
          <View style={styles.topGradient} />

          {/* Boutons navigation */}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerBtnGroup}>
              <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
                <Ionicons name="share-social" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={toggleFavorite} activeOpacity={0.8}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#FF6B6B" : "#fff"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* === CONTENT SHEET === */}
        <View style={styles.contentSheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Title & Match Score */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{restaurant.name}</Text>
              <View style={styles.matchBadge}>
                <View style={styles.matchDot} />
                <Text style={styles.matchText}>{matchScore}% Match</Text>
              </View>
            </View>

            {/* Info Row: Rating, Type */}
            <View style={styles.infoRow}>
              {restaurant.rating ? (
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>{restaurant.rating}</Text>
                  {restaurant.review_count && (
                    <Text style={styles.reviewCount}>({restaurant.review_count} avis)</Text>
                  )}
                </View>
              ) : null}
              {restaurant.rating && <View style={styles.dot} />}
              <Text style={styles.cuisineType}>{displayCuisines}</Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {(restaurant.vegetarian === 1 || restaurant.vegetarian === "yes") && (
                <View style={[styles.tag, styles.tagGreen]}>
                  <Ionicons name="leaf" size={10} color="#15803D" />
                  <Text style={styles.tagTextGreen}>Végé</Text>
                </View>
              )}
              {(restaurant.vegan === 1 || restaurant.vegan === "yes") && (
                <View style={[styles.tag, styles.tagGreen]}>
                  <Ionicons name="leaf" size={10} color="#15803D" />
                  <Text style={styles.tagTextGreen}>Végan</Text>
                </View>
              )}
              {(restaurant.takeaway === "yes" || restaurant.takeaway === 1 || restaurant.takeaway === "only") && (
                <View style={[styles.tag, styles.tagOrange]}>
                  <Ionicons name="bag-handle" size={10} color="#C2410C" />
                  <Text style={styles.tagTextOrange}>À emporter</Text>
                </View>
              )}
              {(restaurant.delivery === "yes" || restaurant.delivery === 1) && (
                <View style={[styles.tag, styles.tagBlue]}>
                  <Ionicons name="bicycle" size={10} color="#1D4ED8" />
                  <Text style={styles.tagTextBlue}>Livraison</Text>
                </View>
              )}
              {restaurant.wheelchair === "yes" && (
                <View style={[styles.tag, styles.tagGray]}>
                  <Ionicons name="accessibility" size={10} color="#4B5563" />
                  <Text style={styles.tagTextGray}>PMR</Text>
                </View>
              )}
              {restaurant.internet_access && (
                <View style={[styles.tag, styles.tagGray]}>
                  <Ionicons name="wifi" size={10} color="#4B5563" />
                  <Text style={styles.tagTextGray}>Wifi</Text>
                </View>
              )}
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.aboutText}>
                {restaurant.description ||
                  `Découvrez ${restaurant.name}, un lieu unique proposant une cuisine ${displayCuisines.toLowerCase()}.`}
              </Text>
            </View>

            {/* Info Cards Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}>
                  <Ionicons name="time" size={14} color="#6B4EFF" />
                </View>
                <View>
                  <Text style={styles.infoCardLabel}>HORAIRES</Text>
                  <Text style={styles.infoCardValue}>
                    {restaurant.opening_hours ? restaurant.opening_hours.split(';')[0] : "Voir horaires"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}>
                  <Ionicons name="location" size={14} color="#6B4EFF" />
                </View>
                <View>
                  <Text style={styles.infoCardLabel}>LOCALISATION</Text>
                  <Text style={styles.infoCardValue} numberOfLines={1}>
                    {formattedDistance
                      ? formattedDistance
                      : restaurant.meta_name_com
                        ? restaurant.meta_name_com
                        : "Voir sur la carte"
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact info */}
            {(restaurant.phone || restaurant.website) && (
              <View style={styles.contactSection}>
                {restaurant.phone && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => openLink('tel')}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="call" size={16} color="#6B4EFF" />
                    </View>
                    <Text style={styles.contactText}>{restaurant.phone}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                {restaurant.website && (
                  <TouchableOpacity style={styles.contactRow} onPress={() => openLink('web')}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="globe" size={16} color="#6B4EFF" />
                    </View>
                    <Text style={styles.contactText} numberOfLines={1}>Visiter le site web</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Spacer for bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* === BOTTOM ACTION BUTTON === */}
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openLink('map')}
              activeOpacity={0.9}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Lancer l'itinéraire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%"
  },
  mainContainerWeb: {
    alignSelf: "center",
    maxWidth: 500,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden'
  },

  // Image Header
  imageContainer: {
    height: "42%",
    backgroundColor: "#6B4EFF",
    position: 'relative'
  },
  coverImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4EFF'
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' },
      default: {}
    })
  },
  headerButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    gap: 12
  },

  // Content Sheet
  contentSheet: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },

  // Title Row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
    flex: 1,
    lineHeight: 28,
  },
  matchBadge: {
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(107, 78, 255, 0.2)',
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B4EFF',
  },
  matchText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B4EFF',
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  cuisineType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  tagTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  tagOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  tagTextOrange: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  tagGray: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  tagTextGray: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tagBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tagTextBlue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  seeMore: {
    color: '#6B4EFF',
    fontWeight: '700',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16,
  },
  infoCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },

  // Contact Section
  contactSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  actionButton: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#FF8C00",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
});