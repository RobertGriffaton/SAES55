import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FavoritesView() {
  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ma Graille-List ❤️</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tabActive}>
            <Text style={styles.tabTextActive}>À tester (4)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabInactive}>
            <Text style={styles.tabTextInactive}>Déjà validé</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Card 1: Le Fat's Burger */}
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" }} 
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>98%</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.restaurantName}>Le Fat's Burger</Text>
              <FontAwesome name="heart" size={16} color="#EF4444" />
            </View>
            
            <Text style={styles.restaurantInfo}>Américain • €€ • 800m</Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.tags}>
                <View style={styles.tagGreen}>
                  <Text style={styles.tagTextGreen}>Halal</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.arrowButton}>
                <FontAwesome name="arrow-right" size={12} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card 2: Chicken Street */}
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" }} 
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>92%</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.restaurantName}>Chicken Street</Text>
              <FontAwesome name="heart" size={16} color="#EF4444" />
            </View>
            
            <Text style={styles.restaurantInfo}>Fast-Food • € • 1.2km</Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.tags}>
                <View style={styles.tagGray}>
                  <Text style={styles.tagTextGray}>Livraison</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.arrowButton}>
                <FontAwesome name="arrow-right" size={12} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card 3: Pitaya Thaï (Closed) */}
        <View style={[styles.card, styles.cardInactive]}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" }} 
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.closedOverlay}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>FERMÉ</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.restaurantName}>Pitaya Thaï</Text>
              <FontAwesome name="heart" size={16} color="#EF4444" />
            </View>
            
            <Text style={styles.restaurantInfo}>Asiatique • €€ • 2.5km</Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.tags}>
                <View style={styles.tagGreen}>
                  <Text style={styles.tagTextGreen}>Option Végé</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.arrowButtonInactive}>
                <FontAwesome name="arrow-right" size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AI Suggestion */}
        <View style={styles.aiSuggestion}>
          <View style={styles.aiIcon}>
            <FontAwesome name="magic" size={16} color="#6B4EFF" />
          </View>
          <Text style={styles.aiText}>En basant sur tes favoris, l'IA te suggère :</Text>
          <TouchableOpacity>
            <Text style={styles.aiLink}>Voir les recommandations +</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.75,
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
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBadge: {
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  closedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
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
  },
  restaurantInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
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
  arrowButtonInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
