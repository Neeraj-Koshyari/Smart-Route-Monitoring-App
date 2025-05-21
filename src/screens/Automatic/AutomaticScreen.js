import React, { useEffect, useState, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  PermissionsAndroid, 
  Button, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import GetLocation from 'react-native-get-location';
import 'react-native-get-random-values';
import { requestAllPermissions } from '../../permissions/Permissions';
import SosModule from '../../module/SosModule';
import { SosContext } from '../../context/SosContext';
import PathSimulator from '../../module/PathSimulator';

const GOOGLE_MAPS_APIKEY = 'use API key here';

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchBarContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'column',
    zIndex: 1,
  },
  button: { marginVertical: 5 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  timerDisplay: {
    position: 'absolute',
    top: 70,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 5,
    zIndex: 2,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default function AutomaticScreen() {
  const mapRef = useRef(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 29.218246604576347,
    longitude: 79.5122371667713,
  });
  const [region, setRegion] = useState({
    latitude: 29.218246604576347,
    longitude: 79.5122371667713,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markers, setMarkers] = useState([]);
  const [destination, setDestination] = useState(null);
  const [polylineCoordinates, setPolylineCoordinates] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);

  // SOS modal visibility.
  const [sosVisible, setSosVisible] = useState(false);

  // Global SOS number from context.
  const { sosContacts } = useContext(SosContext);

  // --- Simulation State ---
  const [simulator, setSimulator] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Timer for the current checkpoint and active checkpoint index.
  const [checkpointTimer, setCheckpointTimer] = useState(0);
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState(0);
  
  // const checkpointTimerIntervalRef = useRef(null);

  const [checkpointsInitialized, setCheckpointsInitialized] = useState(false); // Flag for avoiding checkpoints initialization

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateAngle(coord1, coord2, coord3) {
    const vector1 = [coord2.latitude - coord1.latitude, coord2.longitude - coord1.longitude];
    const vector2 = [coord3.latitude - coord2.latitude, coord3.longitude - coord2.longitude];

    const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
    const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
    const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);

    const cosTheta = dotProduct / (magnitude1 * magnitude2);
    const angle = Math.acos(Math.min(Math.max(cosTheta, -1), 1)) * (180 / Math.PI);
    return angle;
  }

  function addCheckpoints(routeCoordinates) {
    if(checkpointsInitialized)  return checkpoints;

    
    const newCheckpoints = [];
    let lastCheckpoint = currentLocation;

    // newCheckpoints.push({
    //   latitude: currentLocation.latitude,
    //   longitude: currentLocation.longitude,
    //   title: 'Start Point',
    //   description: 'Distance: 0 km, Time: 0 minutes',
    //   expectedTime: 10,
    // });

    for (let i = 0; i < routeCoordinates.length - 2; i++) {
      const coord1 = routeCoordinates[i];
      const coord2 = routeCoordinates[i + 1];
      const coord3 = routeCoordinates[i + 2];

      const angle = calculateAngle(coord1, coord2, coord3);
      const isStraight = angle < 30;
      const checkpointDistance = isStraight ? 3 : 2;

      const distance = getDistanceFromLatLonInKm(
        lastCheckpoint.latitude,
        lastCheckpoint.longitude,
        coord2.latitude,
        coord2.longitude
      );

      const averageSpeed = 40; // km/h
      const timeForSegment = (distance / averageSpeed) * 60; // minutes

      if (distance >= checkpointDistance) {
        const expectedTime = Math.max(1, Math.round(timeForSegment));
        newCheckpoints.push({
          latitude: coord2.latitude,
          longitude: coord2.longitude,
          title: `Checkpoint ${newCheckpoints.length + 1}`,
          description: `Distance: ${distance.toFixed(2)} km, Time: ${expectedTime} minutes`,
          expectedTime,
        });

        lastCheckpoint = coord2;
      }
    }

    if (destination) {
      const distanceToDestination = getDistanceFromLatLonInKm(
        lastCheckpoint.latitude,
        lastCheckpoint.longitude,
        destination.latitude,
        destination.longitude
      );
      const timeToDestination = (distanceToDestination / 50) * 60;
      const expectedTime = Math.max(1, Math.round(timeToDestination));

      newCheckpoints.push({
        latitude: destination.latitude,
        longitude: destination.longitude,
        title: 'Destination',
        description: `Distance: ${distanceToDestination.toFixed(2)} km, Time: ${expectedTime} minutes`,
        expectedTime,
      });
    }

    setCheckpoints(newCheckpoints);
    setCheckpointsInitialized(true); // Set the flag to true
  }

  async function _getLocationPermission() {
    if (Platform.OS === 'android') {
      const locationGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      const smsGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);

      if (!locationGranted || !smsGranted) {
        const granted = await requestAllPermissions();
        if (granted) {
          setPermissionGranted(true);
          _getCurrentLocation();
        } else {
          console.log('Required permissions were not granted.');
        }
      } else {
        setPermissionGranted(true);
        _getCurrentLocation();
      }
    } else {
      setPermissionGranted(true);
      _getCurrentLocation();
    }
  }

  function _getCurrentLocation() {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then(location => {
        setCurrentLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkers([{
          id: 1,
          latitude: location.latitude,
          longitude: location.longitude,
          title: 'Current Location',
          description: 'Source',
        }]);
      })
      .catch(error => {
        console.log(error.code, error.message);
      });
  }

  const moveToLocation = async (latitude, longitude) => {
    if (isSimulating) {
      Alert.alert("Action Denied", "Cannot change destination while simulation is running.");
      return;
    }
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current.animateToRegion(newRegion, 2000);
    setRegion(newRegion);
    setDestination({ latitude, longitude });

    // Reset everything when a new destination is set.
    // setCheckpoints([]); // Clear existing checkpoints
    // setPolylineCoordinates([]); // Clear existing polyline

    setSimulator(null); // Reset the simulator instance
    setIsSimulating(false); // Reset simulation state
    setIsPaused(false); // Reset paused state
    setCheckpointTimer(0); // Reset the timer
    setActiveCheckpointIndex(0); // Reset active checkpoint index
    setCheckpointsInitialized(false); // Reset checkpoints initialization flag
    
    setMarkers([
      { id: 1, ...currentLocation, title: 'Current Location', description: 'Source' },
      { id: 2, latitude, longitude, title: 'Destination', description: 'This is your destination' },
    ]);
  };

  useEffect(() => {
    _getLocationPermission();
  }, []);

  const adjustZoom = (zoomIn) => {
    mapRef.current?.getCamera().then(camera => {
      const newCamera = {
        ...camera,
        zoom: zoomIn ? Math.min(camera.zoom + 1, 20) : Math.max(camera.zoom - 1, 2),
      };
      mapRef.current.animateCamera(newCamera, { duration: 500 });
    });
  };
  
  const goToCurrentLocation = () => {
    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      },
      1000
    );
  };


  // ----- Simulation Integration using external PathSimulator -----
  const startSimulation = () => {
    if (!checkpoints.length) {
      Alert.alert("No Checkpoints", "Please add at least one checkpoint before starting simulation.");
      return;
    }
    if (!polylineCoordinates || polylineCoordinates.length === 0) {
      Alert.alert("No Route", "No route available for simulation.");
      return;
    }

    try {
      if (simulator) {
        console.log("Simulation Start.");
        if (isPaused) setIsPaused(false);

        simulator.startSimulation();
        setIsSimulating(true);
        return;
      }

      console.log("Initializing PathSimulator.");
      const sim = new PathSimulator(
        polylineCoordinates,
        (newCoord) => {
          setCurrentLocation(newCoord);
          setMarkers((prev) =>
            prev.map((marker) =>
              marker.title === "Current Location"
                ? { ...marker, latitude: newCoord.latitude, longitude: newCoord.longitude }
                : marker
            )
          );
        },
        checkpoints,
        (missedCheckpointIndex) => {
          setSosVisible(true);
          Alert.alert(
            "Checkpoint Missed",
            `You missed checkpoint ${missedCheckpointIndex}. SOS triggered automatically.`
          );
          stopSimulation();
        },
        (message) => {
          Alert.alert("Simulation Ended", message);
          stopSimulation();
        },
        (elapsedSeconds) => {
          setCheckpointTimer(elapsedSeconds);
        },
        (checkpointIndex) => {
          console.log(`Checkpoint ${checkpointIndex} reached.`);
          setActiveCheckpointIndex(checkpointIndex);
        }
      );

      // Synchronize updated checkpoint time with the UI.
      sim.updateCheckpoints = updatedCheckpoints => {
        // map over each checkpoint and rebuild its description
        setCheckpoints(updatedCheckpoints.map(cp => ({
          ...cp,
          description: `Expected Time: ${cp.expectedTime} min`
        })));
      };

      setSimulator(sim);
      sim.startSimulation();
      setIsSimulating(true);
    } catch (error) {
      Alert.alert("Simulation Error", error.message);
    }
  };

  const stopSimulation = () => {
    if(simulator) {
      simulator.stopSimulation();
    }
    setIsSimulating(false);
    setIsPaused(true);

    // // Clear the timer interval
    // if (checkpointTimerIntervalRef.current) {
    //   clearInterval(checkpointTimerIntervalRef.current);
    //   checkpointTimerIntervalRef.current = null;
    // }

    setCheckpointTimer(0); // Reset the timer
  };

  const speedUp = () => {
    if (isSimulating) {
      simulator?.speedUp();
      // console.log("Simulation speed increased.");
    }
  };

  const slowDown = () => {
    if (isSimulating) {
      simulator?.slowDown();
      // console.log("Simulation speed decreased.");
    }
  };

  const pauseSimulation = () => {
    if (simulator && !isPaused) {
      simulator.pauseSimulation();
      setIsPaused(true);
      // console.log("Simulation paused.");
    }
  };

  const resumeSimulation = () => {
    if (simulator && isPaused) {
      simulator.resumeSimulation();
      setIsPaused(false);
      // console.log("Simulation resumed.");
    }
  };
  // ----- End Simulation Integration -----

  // SOS handling: When SOS is triggered and user selects "No", stop simulation and reset controls.
  const handleCloseSos = (decision) => {
    if(simulator) {
      stopSimulation();
    }
    setSosVisible(false);
  };

  if (!permissionGranted) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Display checkpoint timer */}
      {isSimulating && (
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            Timer: {checkpointTimer}s
          </Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <GooglePlacesAutocomplete
          fetchDetails
          placeholder="Search"
          onPress={(data, details = null) => {
            const { lat, lng } = details.geometry.location;
            moveToLocation(lat, lng);
          }}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'en',
          }}
          styles={{
            textInputContainer: { backgroundColor: 'white' },
            textInput: { height: 30, color: '#5d5d5d', fontSize: 16 },
          }}
        />
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}>
        {/* Current location markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
          />
        ))}

        {/* Polyline and checkpoints */}
        {destination && (
          <MapViewDirections
            origin={currentLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={3}
            strokeColor="blue"
            precision="high"
            onReady={(result) => {
              setPolylineCoordinates(result.coordinates);
              addCheckpoints(result.coordinates);
            }}
            onError={(errorMessage) => {
              Alert.alert('No route available by land. Please try another destination.');
            }}
          />
        )}

        {/* Checkpoints */}
        {checkpoints.map((checkpoint, index) => (
          <Marker
            key={`checkpoint-${index}`}
            coordinate={{ latitude: checkpoint.latitude, longitude: checkpoint.longitude }}
            title={checkpoint.title}
            description={checkpoint.description}
          />
        ))}
      </MapView>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Zoom In" onPress={() => adjustZoom(true)} />
        </View>
        <View style={styles.button}>
          <Button title="Zoom Out" onPress={() => adjustZoom(false)} />
        </View>
        <View style={styles.button}>
          <Button title="My Location" onPress={goToCurrentLocation} />
        </View>
        {/* Simulation Control Buttons */}
        {isSimulating ? (
          <>
            <View style={styles.button}>
              <Button title="Stop Simulation" onPress={stopSimulation} color="red" />
            </View>
            <View style={styles.button}>
              <Button title="Speed Up" onPress={speedUp} />
            </View>
            <View style={styles.button}>
              <Button title="Slow Down" onPress={slowDown} />
            </View>
            <View style={styles.button}>
              {isPaused ? (
                <Button title="Resume" onPress={resumeSimulation} color="purple" />
              ) : (
                <Button title="Pause" onPress={pauseSimulation} color="orange" />
              )}
            </View>
          </>
        ) : (
          <View style={styles.button}>
            <Button title="Start Simulation" onPress={startSimulation} color="green" />
          </View>
        )}
      </View>

      {/* SOS Modal for automatic SOS functionality */}
      <SosModule 
        visible={sosVisible}
        onClose={handleCloseSos}
        // onSendSOS={(decision) => {
        //   // If user chooses "no", stop simulation and reset controls.
        //   if (decision === "no") {
        //     stopSimulation();
        //     setIsSimulating(false);
        //     setIsPaused(false);
        //   }
        //   console.log("SOS sent with decision:", decision);
        // }}
        contacts={sosContacts}
        currentLocation={currentLocation}
      />
    </View>
  );
}
