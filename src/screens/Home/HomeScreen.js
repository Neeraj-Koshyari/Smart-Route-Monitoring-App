import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { View, StyleSheet, Button, Text, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useFocusEffect } from '@react-navigation/native';
import { SosContext } from '../../context/SosContext'; // Import SosContext
import 'react-native-get-random-values';

const HomeScreen = ({ navigation }) => {
  const { sosContacts } = useContext(SosContext); // Access sosContacts from context
  const [mode, setMode] = useState(null);
  const [open, setOpen] = useState(false);
  const [items] = useState([
    { label: 'Automatic', value: 'Automatic' },
    { label: 'Manual', value: 'Manual' },
  ]);

  // useRef to track first render
  const isFirstRender = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (!isFirstRender.current) {
        setMode(null);
      }
      isFirstRender.current = false;
    }, [])
  );

  const handleSearch = () => {
    if (!mode) {
      Alert.alert('Error', 'Please select the mode!');
      return;
    }

    // Check if at least one SOS contact exists
    if (!sosContacts || sosContacts.length === 0) {
      Alert.alert(
        'No Emergency Contact',
        'Please add at least one emergency contact in the Settings before proceeding.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }]
      );
      return;
    }

    navigation.navigate(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to the Navigation App!</Text>
      <Text style={styles.infoText}>
        This app helps you set your destination and navigate through checkpoints:{'\n'}
        {'\u2022'} Automatic Mode: Predefined checkpoints are automatically set for your route.{'\n'}
        {'\u2022'} Manual Mode: You can manually set your checkpoints.
      </Text>
      <Text style={styles.label}>Select Mode:</Text>
      <DropDownPicker
        open={open}
        value={mode}
        items={items}
        setOpen={setOpen}
        setValue={setMode}
        placeholder="Select navigation mode"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />
      <Button title="Start Navigation" onPress={handleSearch} color="#4CAF50" />

      {/* Settings button to change SOS phone number */}
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'justify',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  dropdown: {
    marginBottom: 16,
    borderColor: '#ccc',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default HomeScreen;
