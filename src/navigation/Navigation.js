import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import AutomaticScreen from '../screens/Automatic/AutomaticScreen';
import ManualScreen from '../screens/Manual/ManualScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigation({ onReady = () => {} }) {
  return (
    <NavigationContainer onReady={onReady}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="Automatic" component={AutomaticScreen} options={{ title: 'Automatic Mode' }} />
        <Stack.Screen name="Manual" component={ManualScreen} options={{ title: 'Manual Mode' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
