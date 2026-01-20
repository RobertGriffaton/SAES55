import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation séquence principale
    Animated.sequence([
      // 1. Fade in + Scale du logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // 2. Fade in du texte
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de glow en boucle
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  // Interpolation pour la largeur de la barre de progression
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Fond dégradé simulé avec plusieurs couches */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Logo avec effet glow */}
        <View style={styles.logoContainer}>
          {/* Glow effect derrière le logo */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
          
          {/* Logo principal */}
          <Animated.Image
            source={require('../../assets/LogoGrayeLong.png')}
            style={[
              styles.logo,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Texte de chargement */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textFadeAnim },
          ]}
        >
          <Text style={styles.loadingText}>Chargement</Text>
          <Text style={styles.dotsText}>...</Text>
        </Animated.View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>

      {/* Texte en bas */}
      <Animated.Text
        style={[
          styles.bottomText,
          { opacity: textFadeAnim },
        ]}
      >
        Découvrez les meilleurs restaurants
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  // Simulation d'un dégradé avec plusieurs couches
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
  },
  gradientLayer2: {
    position: 'absolute',
    top: '30%',
    left: '-20%',
    width: width * 1.4,
    height: height * 0.5,
    backgroundColor: '#16082e',
    opacity: 0.8,
    borderRadius: 200,
    transform: [{ rotate: '-15deg' }],
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: '10%',
    right: '-10%',
    width: width * 0.8,
    height: height * 0.3,
    backgroundColor: '#1a0a35',
    opacity: 0.6,
    borderRadius: 150,
    transform: [{ rotate: '20deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 320,
    height: 150,
    backgroundColor: '#d4a84b',
    opacity: 0.3,
    borderRadius: 100,
    shadowColor: '#d4a84b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  logo: {
    width: 280,
    height: 100,
  },
  textContainer: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dotsText: {
    fontSize: 16,
    color: '#d4a84b',
    fontWeight: '300',
    marginLeft: 4,
  },
  progressContainer: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#d4a84b',
    borderRadius: 2,
    shadowColor: '#d4a84b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  bottomText: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '300',
    letterSpacing: 1,
  },
});

export default SplashScreen;
