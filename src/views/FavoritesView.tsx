import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { getActiveProfile } from '../controllers/ProfileController';
import { getFavorites, removeFavorite, unvalidateFavorite, validateFavorite } from '../services/Database';
import { getRestaurantImage } from '../utils/ImageMapping';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -50; // Seuil pour valider le swipe gauche (réduit pour iOS)

interface FavoritesViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

// Composant de carte avec swipe
const SwipeableCard = ({
  restaurant,
  onSwipeComplete,
  onRemove,
  onPress,
  formatInfo,
  isValidated
}: any) => {
  const imageSource = getRestaurantImage(restaurant);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (_, gestureState) => {
        // Seulement swipe gauche
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Validation par distance OU par vélocité (pour les swipes rapides)
        const shouldValidate = gestureState.dx < SWIPE_THRESHOLD || gestureState.vx < -0.5;
        
        if (shouldValidate) {
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
            {imageSource ? (
              <Image
                source={imageSource}
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
  const viewShotRef = useRef<View>(null);

  const handleShareImage = async () => {
    try {
      if (!favorites.length && !validatedFavorites.length) {
        Alert.alert('Liste vide', 'Ajoutez des favoris pour partager votre Graye List !');
        return;
      }

      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 0.9,
          result: 'tmpfile'
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager ma Graye List',
          UTI: 'public.png'
        });
      }
    } catch (error) {
      console.error("Erreur partage image:", error);
      Alert.alert('Erreur', 'Impossible de générer l\'image');
    }
  };

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



  // Formater les infos du restaurant (Cuisine > Type • Ville • Distance)
  const formatInfo = (restaurant: any) => {
    // 1. Déterminer le type (Cuisine prioritaire sur Type générique)
    let displayType = restaurant.type?.replace(/_/g, ' ') || 'Restaurant';
    if (restaurant.cuisines && restaurant.cuisines.length > 0) {
      // Prend la première cuisine listée et met la 1ère lettre en majuscule
      const mainCuisine = restaurant.cuisines.split(',')[0];
      displayType = mainCuisine.charAt(0).toUpperCase() + mainCuisine.slice(1);
    } else {
      displayType = displayType.charAt(0).toUpperCase() + displayType.slice(1);
    }

    const city = restaurant.city || restaurant.meta_name_com || '';
    const distance = restaurant.distanceKm ? `${restaurant.distanceKm.toFixed(1)}km` : '';
    
    return [displayType, city, distance].filter(Boolean).join(' • ');
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>Graye List</Text>
          {(favorites.length > 0 || validatedFavorites.length > 0) && (
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareImage}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={20} color="#6B4EFF" />
            </TouchableOpacity>
          )}
        </View>

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

      {/* Hidden View for Sharing - Correctly Placed */}
      <View style={styles.hiddenContainer} collapsable={false}>
        <View ref={viewShotRef} style={styles.shareContainer} collapsable={false}>
          <View style={styles.shareHeader}>
            <Text style={styles.shareTitle}>Ma Graye List ❤️</Text>
            <Text style={styles.shareSubtitle}>
              {favorites.length + validatedFavorites.length} restaurants coups de coeur
            </Text>
          </View>

          <View style={styles.shareList}>
            {[...favorites, ...validatedFavorites].slice(0, 8).map((restaurant, index) => (
              <View key={`share-${restaurant.id || index}`} style={styles.shareItem}>
                <View style={styles.shareImageContainer}>
                   {getRestaurantImage(restaurant) ? (
                    <Image source={getRestaurantImage(restaurant) as any} style={styles.shareImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.shareImage, { backgroundColor: '#ddd' }]} />
                  )}
                </View>
                <View style={styles.shareInfo}>
                   <Text style={styles.shareName} numberOfLines={1}>{restaurant.name}</Text>
                   <Text style={styles.shareMeta}>
                    {formatInfo(restaurant)}
                   </Text>
                </View>
                {(restaurant.score || 90) > 85 && (
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                )}
              </View>
            ))}
            {favorites.length + validatedFavorites.length > 8 && (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 8 }}>
                ... et {favorites.length + validatedFavorites.length - 8} autres pépites ✨
              </Text>
            )}
          </View>

          <View style={styles.shareFooter}>
            <Text style={styles.shareFooterText}>Généré par App Graye List 🍽️</Text>
          </View>
        </View>
      </View>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Share View Styles
  hiddenContainer: {
    position: 'absolute',
    top: 0,
    left: -10000, 
    width: 375, // Largeur fixe type smartphone
    backgroundColor: '#fff',
  },
  shareContainer: {
    backgroundColor: '#fff',
    padding: 24,
    paddingBottom: 48,
  },
  shareHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  shareTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6B4EFF',
    marginBottom: 8,
  },
  shareSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  shareList: {
    gap: 16,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  shareImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shareImage: {
    width: '100%',
    height: '100%',
  },
  shareInfo: {
    marginLeft: 16,
    flex: 1,
  },
  shareName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  shareMeta: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  shareFooter: {
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  shareFooterText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
