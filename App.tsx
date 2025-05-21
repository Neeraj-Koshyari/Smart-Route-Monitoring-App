import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AppNavigation from './src/navigation/Navigation';
import { LocationProvider } from './src/context/LocationContext';
import { SosProvider } from './src/context/SosContext';

export default function App() {
  return (
    <LocationProvider>
      <SosProvider>
      <SafeAreaView style={{ flex: 1 }}>
          <AppNavigation />
        </SafeAreaView>
      </SosProvider>
    </LocationProvider>
  );
}