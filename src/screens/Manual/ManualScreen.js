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
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import GetLocation from 'react-native-get-location';
import SosModule from '../../module/SosModule';
import { requestAllPermissions } from '../../permissions/Permissions';
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

export default function ManualScreen() {
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
  const proximityThresholdMeters = 50; // For checkpoint placement

  // SOS modal visibility.
  const [sosVisible, setSosVisible] = useState(false);

  // Checkpoint expected time modal state.
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);
  const [checkpointTime, setCheckpointTime] = useState('');
  const [newCheckpointCoordinate, setNewCheckpointCoordinate] = useState(null);

  // Optional: Checkpoint removal state.
  const [removeCheckpointModalVisible, setRemoveCheckpointModalVisible] = useState(false);
  const [selectedCheckpointIndex, setSelectedCheckpointIndex] = useState(null);

  // Global SOS number from context.
  const { sosContacts } = useContext(SosContext);

  // --- Simulation State ---
  const [simulator, setSimulator] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Timer for the current checkpoint and active checkpoint index.
  const [checkpointTimer, setCheckpointTimer] = useState(0);
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState(0);

  // const checkpointStartTimeRef = useRef(Date.now());
  // const checkpointTimerIntervalRef = useRef(null);

  // Request permissions on mount.
  useEffect(() => {
    async function checkPermissions() {
      if (Platform.OS === 'android') {
        const granted = await requestAllPermissions();
        if (granted) {
          fetchCurrentLocation();
          setPermissionGranted(true);
        } else {
          Alert.alert(
            "Permissions Required",
            "SMS and location permissions are required for this app to work properly."
          );
          setPermissionGranted(false);
        }
      } else {
        fetchCurrentLocation();
        setPermissionGranted(true);
      }
    }
    checkPermissions();
  }, []);

  const fetchCurrentLocation = () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then(location => {
        const updatedLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        setCurrentLocation(updatedLocation);
        setRegion({
          ...updatedLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkers([{ id: 1, ...updatedLocation, title: 'Current Location', description: 'Source' }]);
      })
      .catch(err => console.log(err));
  };

  const moveToLocation = (latitude, longitude) => {
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
    setCheckpoints([]); // Clear existing checkpoints
    setPolylineCoordinates([]); // Clear existing polyline
    setSimulator(null); // Reset the simulator instance
    setIsSimulating(false); // Reset simulation state
    setIsPaused(false); // Reset paused state
    setCheckpointTimer(0); // Reset the timer
    setActiveCheckpointIndex(0); // Reset active checkpoint index
    setMarkers([
      { id: 1, ...currentLocation, title: 'Current Location', description: 'Source' },
      { id: 2, latitude, longitude, title: 'Destination', description: 'This is your destination' },
    ]);
  };

  // Helper: Calculate distance (in meters) between two coordinates.
  const geodesicDistance = (coord1, coord2) => {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (coord2.latitude - coord1.latitude) * rad;
    const dLon = (coord2.longitude - coord1.longitude) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(coord1.latitude * rad) *
        Math.cos(coord2.latitude * rad) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ----- Checkpoint Addition: Prompt for expected time input -----
  const addCheckpoint = (event) => {
    if (isSimulating) {
      Alert.alert("Action Denied", "Cannot add new checkpoints while simulation is running.");
      return;
    }
    const { coordinate } = event.nativeEvent;
    const isNearPolyline = polylineCoordinates.some(point => {
      const distance = geodesicDistance(coordinate, point);
      return distance < proximityThresholdMeters;
    });
    if (isNearPolyline) {
      setNewCheckpointCoordinate(coordinate);
      setCheckpointModalVisible(true);
    } else {
      Alert.alert("Invalid Checkpoint", "Checkpoint must be near the route!");
    }
  };

  const handleCheckpointModalCancel = () => {
    setCheckpointModalVisible(false);
    setCheckpointTime('');
    setNewCheckpointCoordinate(null);
  };

  // Sort and renumber checkpoints.
  const sortAndNumberCheckpoints = (checkpoints) => {
    if (!destination) return checkpoints;

    // Sort checkpoints by distance from the destination in descending order
    const sortedCheckpoints = [...checkpoints].sort((a, b) => {
      const distanceA = geodesicDistance(a, destination);
      const distanceB = geodesicDistance(b, destination);
      return distanceB - distanceA; // Descending order
    });

    // Renumber checkpoints
    return sortedCheckpoints.map((checkpoint, index) => ({
      ...checkpoint,
      title: `Checkpoint ${index + 1}`,
    }));
  };


  const handleCheckpointModalOk = () => {
    if (newCheckpointCoordinate) {
      // Merge the new checkpoint into the existing array and renumber sequentially.
      setCheckpoints(prev => {
        const newCheckpoints = [
          ...prev,
          { 
            ...newCheckpointCoordinate, 
            description: `Expected Time: ${checkpointTime} min`,
            expectedTime: checkpointTime,
          },
        ];
        const sortedCheckpoints = sortAndNumberCheckpoints(newCheckpoints);  // Sort and renumber checkpoints
        
        // Update the active PathSimulator with the new sorted checkpoints.
        if (simulator) {
          simulator.updateCheckpoints(sortedCheckpoints);
        }

        return sortedCheckpoints;
      });

      setCheckpointModalVisible(false);
      setCheckpointTime('');
      setNewCheckpointCoordinate(null);
    }
  };

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
        // If the simulator already exists, resume or restart the simulation
        console.log("Simulation Start.");
        if(isPaused)  setIsPaused(false);

        simulator.startSimulation(); // Start the simulation
        setIsSimulating(true);
        return;
      }

      // Initialize the simulator for the first time
      console.log("Initializing PathSimulator.");
      const sim = new PathSimulator(
        polylineCoordinates,
        (newCoord) => {
          // Update current location.
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
          // SOS triggered.
          setSosVisible(true);
          Alert.alert(
            "Checkpoint Missed",
            `You missed checkpoint ${missedCheckpointIndex}. SOS triggered automatically.`
          );
          stopSimulation();
        },
        (message) => {
          // Simulation ended.
          Alert.alert("Simulation Ended", message);
          stopSimulation();
        },
        (elapsedSeconds) => {
          // Timer update.
          setCheckpointTimer(elapsedSeconds); // Update the timer in the UI
        },
        (checkpointIndex) => {
          // Checkpoint reached.
          console.log(`Checkpoint ${checkpointIndex} reached.`);
          setActiveCheckpointIndex(checkpointIndex); // Update active checkpoint index
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

      setSimulator(sim); // Save the simulator instance
      sim.startSimulation(); // Start the simulation
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

    // Clear the timer interval
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

  // ----- Optional: Checkpoint Removal Handlers -----
  const handleRemoveCheckpointConfirm = () => {
    if (isSimulating) {
      Alert.alert("Action Denied", "Cannot remove checkpoints while simulation is running.");
      setRemoveCheckpointModalVisible(false);
      setSelectedCheckpointIndex(null);
      return;
    }
    if (selectedCheckpointIndex !== null) {
      setCheckpoints(prev => {
        const newCheckpoints = prev.filter((_, idx) => idx !== selectedCheckpointIndex);
        return sortAndNumberCheckpoints(newCheckpoints);
      });
      setRemoveCheckpointModalVisible(false);
      setSelectedCheckpointIndex(null);
    }
  };

  const handleRemoveCheckpointCancel = () => {
    setRemoveCheckpointModalVisible(false);
    setSelectedCheckpointIndex(null);
  };
  // ----- End Checkpoint Removal Handlers -----

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

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <GooglePlacesAutocomplete
          fetchDetails
          placeholder="Search"
          onPress={(data, details = null) => {
            const { lat, lng } = details.geometry.location;
            moveToLocation(lat, lng);
          }}
          query={{ key: GOOGLE_MAPS_APIKEY, language: 'en' }}
          styles={{
            textInputContainer: { backgroundColor: 'white' },
            textInput: { height: 30, color: '#5d5d5d', fontSize: 16 },
          }}
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={addCheckpoint}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
          />
        ))}
        {destination && (
          <MapViewDirections
            origin={currentLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={3}
            strokeColor="blue"
            precision="high"
            onReady={(result) => setPolylineCoordinates(result.coordinates)}
            onError={() => Alert.alert('Routing Error', 'No route available by land.')}
          />
        )}
        {checkpoints.map((checkpoint, index) => (
          <Marker
            key={`checkpoint-${index}`}
            coordinate={{ latitude: checkpoint.latitude, longitude: checkpoint.longitude }}
            title={checkpoint.title}
            description={checkpoint.description}
            onCalloutPress={() => {
              setSelectedCheckpointIndex(index);
              setRemoveCheckpointModalVisible(true);
            }}
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

      {/* Modal for entering checkpoint expected time */}
      <Modal visible={checkpointModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              At what time (in minutes) will you reach this checkpoint?
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter expected time"
              keyboardType="numeric"
              value={checkpointTime}
              onChangeText={setCheckpointTime}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={handleCheckpointModalCancel} />
              <Button title="OK" onPress={handleCheckpointModalOk} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for checkpoint removal confirmation */}
      <Modal visible={removeCheckpointModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Remove Checkpoint</Text>
            <Text>Do you want to remove this checkpoint?</Text>
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={handleRemoveCheckpointCancel} />
              <Button title="Remove" onPress={handleRemoveCheckpointConfirm} />
            </View>
          </View>
        </View>
      </Modal>

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
        contact={sosContacts}
        currentLocation={currentLocation}
      />
    </View>
  );
}
