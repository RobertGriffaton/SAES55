import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { getFavorites, removeFavorite, validateFavorite, unvalidateFavorite } from '../services/Database';
import { getActiveProfile } from '../controllers/ProfileController';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -100; // Seuil pour valider le swipe gauche

// Mapping des images (copié depuis RestaurantDetailView)
const CATEGORY_IMAGES: Record<string, any> = {
  "mcdonald's": require("../../assets/imagescover/mcdo.png"),
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
  "thai": require("../../assets/imagescover/thai.png"),
  "poulet": require("../../assets/imagescover/poulet.png"),
  "fast_food": require("../../assets/imagescover/fast_food.png"),
  "healthy": require("../../assets/imagescover/healthy.png"),
  "tacos": require("../../assets/imagescover/tacos.png"),
};

interface FavoritesViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

// Composant de carte avec swipe
const SwipeableCard = ({
  restaurant,
  onSwipeComplete,
  onRemove,
  onPress,
  getImageSource,
  formatInfo,
  isValidated
}: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        // Seulement swipe gauche
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe validé - animer et callback
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeComplete(restaurant);
          });
        } else {
          // Retour à la position initiale
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.cardWrapper}>
      {/* Badge "Validé" en arrière-plan */}
      <View style={styles.swipeBackground}>
        <Ionicons name="checkmark-circle" size={28} color="#fff" />
        <Text style={styles.swipeBackgroundText}>
          {isValidated ? 'Retour' : 'Validé !'}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateX }], opacity },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => onPress(restaurant)}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            {getImageSource(restaurant) ? (
              <Image
                source={getImageSource(restaurant)}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Ionicons name="restaurant" size={32} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {restaurant.score ? `${Math.round(restaurant.score)}%` : '90%'}
              </Text>
            </View>
            {isValidated && (
              <View style={styles.validatedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <TouchableOpacity
                onPress={() => onRemove(Number(restaurant.id))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="heart" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.restaurantInfo}>{formatInfo(restaurant)}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.tags}>
                {restaurant.vegetarian === 1 && (
                  <View style={styles.tagGreen}>
                    <Text style={styles.tagTextGreen}>Végé</Text>
                  </View>
                )}
                {(restaurant.takeaway === 1 || restaurant.takeaway === 'yes') && (
                  <View style={styles.tagGray}>
                    <Text style={styles.tagTextGray}>À emporter</Text>
                  </View>
                )}
              </View>
              <View style={styles.arrowButton}>
                <FontAwesome name="arrow-right" size={12} color="white" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function FavoritesView({ onRestaurantSelect }: FavoritesViewProps) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [validatedFavorites, setValidatedFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'toTest' | 'validated'>('toTest');
  const [userId, setUserId] = useState<string>('default');

  const loadFavorites = useCallback(async () => {
    try {
      // Récupérer le profil actif
      const profile = await getActiveProfile();
      const uid = profile?.id || 'default';
      setUserId(uid);

      // Charger les favoris pour cet utilisateur
      const toTest = await getFavorites(uid, false);
      const validated = await getFavorites(uid, true);

      setFavorites(toTest);
      setValidatedFavorites(validated);
    } catch (e) {
      console.error("Erreur chargement favoris:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = async (restaurantId: number) => {
    await removeFavorite(restaurantId, userId);
    setFavorites(prev => prev.filter(r => Number(r.id) !== restaurantId));
    setValidatedFavorites(prev => prev.filter(r => Number(r.id) !== restaurantId));
  };

  const handleSwipeToValidate = async (restaurant: any) => {
    const restaurantId = Number(restaurant.id);
    await validateFavorite(restaurantId, userId);
    // Déplacer de toTest vers validated
    setFavorites(prev => prev.filter(r => Number(r.id) !== restaurantId));
    setValidatedFavorites(prev => [...prev, { ...restaurant, validated: true }]);
  };

  const handleSwipeToUnvalidate = async (restaurant: any) => {
    const restaurantId = Number(restaurant.id);
    await unvalidateFavorite(restaurantId, userId);
    // Déplacer de validated vers toTest
    setValidatedFavorites(prev => prev.filter(r => Number(r.id) !== restaurantId));
    setFavorites(prev => [...prev, { ...restaurant, validated: false }]);
  };

  // Fonction pour trouver l'image du restaurant
  const getImageSource = (restaurant: any) => {
    const candidates: string[] = [];
    if (restaurant.brand) candidates.push(String(restaurant.brand));
    if (restaurant.name) candidates.push(String(restaurant.name));
    if (restaurant.cuisines) {
      candidates.push(...String(restaurant.cuisines).split(","));
    }
    if (restaurant.type) candidates.push(String(restaurant.type));

    for (const rawKey of candidates) {
      const cleanKey = rawKey.trim().toLowerCase().replace(/ /g, "_").replace(/-/g, "_");
      if (CATEGORY_IMAGES[cleanKey]) return CATEGORY_IMAGES[cleanKey];
    }
    return null;
  };

  // Formater les infos du restaurant
  const formatInfo = (restaurant: any) => {
    const type = restaurant.type?.replace(/_/g, ' ') || restaurant.cuisines?.split(',')[0] || 'Restaurant';
    const price = '€€';
    const distance = restaurant.distanceKm ? `${restaurant.distanceKm.toFixed(1)}km` : '';
    return [type, price, distance].filter(Boolean).join(' • ');
  };

  const currentList = activeTab === 'toTest' ? favorites : validatedFavorites;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ma Graille-List ❤️</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={activeTab === 'toTest' ? styles.tabActive : styles.tabInactive}
            onPress={() => setActiveTab('toTest')}
          >
            <Text style={activeTab === 'toTest' ? styles.tabTextActive : styles.tabTextInactive}>
              À tester ({favorites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={activeTab === 'validated' ? styles.tabActive : styles.tabInactive}
            onPress={() => setActiveTab('validated')}
          >
            <Text style={activeTab === 'validated' ? styles.tabTextActive : styles.tabTextInactive}>
              Déjà validé ({validatedFavorites.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B4EFF']} />
        }
      >

        {currentList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'toTest' ? "heart-outline" : "checkmark-circle-outline"}
              size={64}
              color="#E5E7EB"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'toTest' ? 'Pas encore de favoris' : 'Aucun resto validé'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'toTest'
                ? 'Explorez les restaurants et appuyez sur le ❤️ pour les ajouter ici !'
                : 'Balayez vers la gauche sur un favori pour le marquer comme testé !'
              }
            </Text>
          </View>
        ) : (
          <>
            {/* Hint de swipe */}
            <View style={styles.swipeHint}>
              <Ionicons name="arrow-back" size={14} color="#9CA3AF" />
              <Text style={styles.swipeHintText}>
                {activeTab === 'toTest'
                  ? 'Glisse vers la gauche pour valider'
                  : 'Glisse vers la gauche pour remettre "À tester"'
                }
              </Text>
            </View>

            {currentList.map((restaurant) => (
              <SwipeableCard
                key={restaurant.id}
                restaurant={restaurant}
                onSwipeComplete={activeTab === 'toTest' ? handleSwipeToValidate : handleSwipeToUnvalidate}
                onRemove={handleRemoveFavorite}
                onPress={(r: any) => onRestaurantSelect && onRestaurantSelect(r)}
                getImageSource={getImageSource}
                formatInfo={formatInfo}
                isValidated={activeTab === 'validated'}
              />
            ))}

            {/* AI Suggestion - seulement dans À tester */}
            {activeTab === 'toTest' && favorites.length > 0 && (
              <View style={styles.aiSuggestion}>
                <View style={styles.aiIcon}>
                  <FontAwesome name="magic" size={16} color="#6B4EFF" />
                </View>
                <Text style={styles.aiText}>En basant sur tes favoris, l'IA te suggère :</Text>
                <TouchableOpacity>
                  <Text style={styles.aiLink}>Voir les recommandations +</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: 'white',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 24,
  },
  tabContainer: {
    backgroundColor: '#F5F5F7',
    padding: 4,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabActive: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 10,
  },
  tabTextActive: {
    textAlign: 'center',
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextInactive: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Swipe hint
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card Wrapper (for swipe background)
  cardWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  swipeBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#10B981',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  swipeBackgroundText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTouchable: {
    padding: 12,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6B4EFF',
  },
  validatedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  restaurantInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
  tagGreen: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagTextGreen: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  tagGray: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagTextGray: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '700',
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // AI Suggestion
  aiSuggestion: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(107, 78, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(107, 78, 255, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  aiLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B4EFF',
  },
});
