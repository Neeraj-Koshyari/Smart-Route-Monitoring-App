import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SosContext = createContext();

export const SosProvider = ({ children }) => {
  const [sosContacts, setSosContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stored SOS contacts on startup.
    const loadSosContacts = async () => {
      try {
        const value = await AsyncStorage.getItem('sosContacts');
        if (value) {
          setSosContacts(JSON.parse(value));
        }
      } catch (error) {
        console.error('Failed to load SOS contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSosContacts();
  }, []);

  const saveSosContacts = async (contacts) => {
    setSosContacts(contacts);
    await AsyncStorage.setItem('sosContacts', JSON.stringify(contacts));
  };

  return (
    <SosContext.Provider value={{ sosContacts, saveSosContacts, loading }}>
      {children}
    </SosContext.Provider>
  );
};
