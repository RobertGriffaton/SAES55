import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// 1. On importe l'initialisation de la BDD
import { initDatabase } from './src/services/Database'; 

// 2. On importe votre navigation principale
import { NavigationController } from './src/controllers/NavigationController';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log("Démarrage de l'application...");
        // On lance l'initialisation de SQLite et du JSON
        await initDatabase();
        console.log("Base de données prête !");
        // On ajoute un petit délai artificiel si on veut voir le splash screen (optionnel)
        // await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        setIsDbReady(true);
      } catch (e) {
        console.warn("Erreur durant le chargement :", e);
      }
    };

    prepare();
  }, []);

  // TANT QUE la base n'est pas prête, on affiche un écran de chargement
  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement des restaurants...</Text>
        <Text style={styles.loadingSubText}>(Premier lancement = import du JSON)</Text>
      </View>
    );
  }

  // UNE FOIS PRÊT, on affiche votre vraie application
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Ici, c'est votre navigation principale */}
      <NavigationController />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  }
});