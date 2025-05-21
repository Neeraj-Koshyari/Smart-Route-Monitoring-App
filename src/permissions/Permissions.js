import { PermissionsAndroid, Platform } from 'react-native';

export async function requestAllPermissions() {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      const result = await PermissionsAndroid.requestMultiple(permissions);
      // console.log("Permission results:", result);
      
      const smsGranted = result[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;
      const locationGranted = result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      
      return smsGranted && locationGranted;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
}
