import React, { createContext, useState, useEffect } from 'react';
import GetLocation from 'react-native-get-location';
import { requestAllPermissions } from '../permissions/Permissions';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      const granted = await requestAllPermissions();
      if (granted) {
        setPermissionGranted(true);
        fetchLocation();
      } else {
        setPermissionGranted(false);
        Alert.alert(
          "Permissions Required",
          "SMS and location permissions are required for this app to work properly."
        );
      }
      // Set loading to false regardless—if getCurrentPosition takes a while, you may want a fallback.
      setLoading(false);
    }
    initialize();
  }, []);

  const fetchLocation = () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then((loc) => {
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      })
      .catch((error) => {
        console.warn('Location error:', error);
        // Even on error, we set loading false so the UI can react.
        setLoading(false);
      });
  };

  return (
    <LocationContext.Provider value={{ location, permissionGranted, loading, fetchLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
