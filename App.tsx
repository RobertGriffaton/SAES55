import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// 1. On importe l'initialisation de la BDD
import { initDatabase } from './src/services/Database';

// 2. On importe votre navigation principale
import { NavigationController } from './src/controllers/NavigationController';

// 3. On importe la nouvelle SplashScreen
import { SplashScreen } from './src/components/SplashScreen';

// Durée minimum d'affichage de la splash screen (en ms)
const MIN_SPLASH_DURATION = 2000;

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Animation fade-out de la splash screen
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startTime = Date.now();
    
    const prepare = async () => {
      try {
        console.log("Démarrage de l'application...");
        // On lance l'initialisation de SQLite et du JSON
        await initDatabase();
        console.log("Base de données prête !");
        
        setIsDbReady(true);
      } catch (e) {
        console.warn("Erreur durant le chargement :", e);
      }
    };

    // Timer pour le délai minimum
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_SPLASH_DURATION);

    prepare();

    return () => clearTimeout(minTimer);
  }, []);

  // Quand les deux conditions sont remplies, on lance la transition
  useEffect(() => {
    if (isDbReady && minTimeElapsed) {
      // Animation de transition : fade-out splash + fade-in app
      Animated.parallel([
        Animated.timing(fadeOutAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Une fois l'animation terminée, on cache complètement la splash
        setShowSplash(false);
      });
    }
  }, [isDbReady, minTimeElapsed]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Application principale avec fade-in */}
      <Animated.View style={[styles.appContainer, { opacity: fadeInAnim }]}>
        {(isDbReady && minTimeElapsed) && <NavigationController />}
      </Animated.View>
      
      {/* Splash screen avec fade-out */}
      {showSplash && (
        <Animated.View style={[styles.splashContainer, { opacity: fadeOutAnim }]}>
          <SplashScreen />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  appContainer: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});