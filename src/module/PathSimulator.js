export default class PathSimulator {
  constructor(routeCoordinates, updateLocationCallback, checkpoints, onSOS, onSimulationEnd, onTimerUpdate) {
    if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      throw new Error("No route coordinates provided for simulation.");
    }
    this.routeCoordinates = routeCoordinates;
    this.updateLocationCallback = updateLocationCallback; // UI location update callback
    this.checkpoints = checkpoints || []; // Checkpoints with expectedTime (in minutes)
    this.onSOS = onSOS; // Callback to trigger SOS popup if checkpoint is missed
    this.onSimulationEnd = onSimulationEnd; // Callback when simulation ends
    this.onTimerUpdate = onTimerUpdate; // Callback to update the timer in ManualScreen
    this.currentIndex = 0;
    this.simulationInterval = null;
    this.timerInterval = null; // Timer interval for updating elapsed time
    this.speed = 1000; // Default speed in ms per step
    this.currentCheckpointIndex = 0; // Next checkpoint to reach
    this.checkpointStartTime = null; // Timestamp for current checkpoint timer
  }

  // Helper: Calculate distance (in meters) using Haversine formula.
  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Start simulation.
  startSimulation() {
    if (!this.routeCoordinates.length) {
      Alert.alert("No route available for simulation.");
      return;
    }
    if (!this.checkpoints.length) {
      throw new Error("No checkpoints available for simulation. Please add at least one checkpoint.");
    }

    // Initialize checkpoint timer.
    this.checkpointStartTime = Date.now();

    // Start the timer interval to update elapsed time and check for SOS.
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - this.checkpointStartTime) / 1000);
        if (this.onTimerUpdate) {
          this.onTimerUpdate(elapsedSeconds); // Notify ManualScreen of the updated timer
        }

        // Check if the active checkpoint has an expected time and if it's exceeded.
        if (this.currentCheckpointIndex < this.checkpoints.length) {
          const activeCheckpoint = this.checkpoints[this.currentCheckpointIndex];
          const expectedMs = parseInt(activeCheckpoint.expectedTime) * 60000;
          if (Date.now() - this.checkpointStartTime > expectedMs) {
            console.log(`Checkpoint ${this.currentCheckpointIndex + 1} missed. Triggering SOS.`);
            
            // Update the checkpoint's expected time to 2 minutes.
            activeCheckpoint.expectedTime = "2";

            // Synchronize updated checkpoints with external components.
            if (this.updateCheckpoints) {
              this.updateCheckpoints(this.checkpoints);
            }

            if (this.onSOS) {
              try {
                this.onSOS(this.currentCheckpointIndex + 1);
              } catch (error) {
                console.error("Error in onSOS callback:", error.message);
              }
            }
            this.stopSimulation(true); // Stop simulation if SOS is triggered
          }
        }
      }, 1000);
    }

    // Start the simulation interval for location updates.
    if (!this.simulationInterval) {
      this.simulationInterval = setInterval(() => {
        this.runSimulationStep();
      }, this.speed);
    }
  }

  // Stop simulation.
  stopSimulation(silent = false) {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (!silent) console.log("Simulation stopped.");
  }

  // Pause simulation.
  pauseSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    // Do not clear the timer interval to preserve the elapsed time.
    console.log("Simulation paused.");
  }

  // Resume simulation.
  resumeSimulation() {
    if (!this.simulationInterval) {
      this.simulationInterval = setInterval(() => {
        this.runSimulationStep();
      }, this.speed);
    }
    // Do not reset the timer interval to preserve the elapsed time.
    console.log("Simulation resumed.");
  }

  runSimulationStep() {
    // End simulation when route is finished.
    if (this.currentIndex >= this.routeCoordinates.length) {
      this.stopSimulation();
      if (this.onSimulationEnd) this.onSimulationEnd("You have reached your destination.");
      return;
    }

    const newCoord = this.routeCoordinates[this.currentIndex];
    if (!newCoord || !newCoord.latitude || !newCoord.longitude) {
      console.error("Invalid coordinate at index", this.currentIndex);
      this.currentIndex++;
      return;
    }

    // Update current location via callback.
    this.updateLocationCallback(newCoord);

    // Check for checkpoint conditions.
    if (this.currentCheckpointIndex < this.checkpoints.length) {
      const activeCheckpoint = this.checkpoints[this.currentCheckpointIndex];
      const distance = this.getDistance(
        newCoord.latitude,
        newCoord.longitude,
        activeCheckpoint.latitude,
        activeCheckpoint.longitude
      );

      const threshold = 50; // meters threshold for reaching checkpoint.
      if (distance <= threshold) {
        console.log(`Checkpoint ${this.currentCheckpointIndex + 1} reached.`);
        this.currentCheckpointIndex++;
        this.checkpointStartTime = Date.now(); // Reset checkpoint timer
        if (this.onCheckpointReached) {
          this.onCheckpointReached(this.currentCheckpointIndex); // Notify ManualScreen
        }
      }
    }

    this.currentIndex++;
  }
  
  // Adjust speed only if simulation is running.
  speedUp() {
    if (!this.simulationInterval) return; // Do nothing if simulation is not active.
    if (this.speed > 300) {
      this.speed -= 200;
      this.restartSimulation(true);
      console.log(`Speed increased: ${this.speed} ms per step`);
    } else {
      console.log("Maximum speed reached.");
    }
  }
  
  slowDown() {
    if (!this.simulationInterval) return; // Do nothing if simulation is not active.
    if (this.speed < 3000) {
      this.speed += 200;
      this.restartSimulation(true);
      console.log(`Speed decreased: ${this.speed} ms per step`);
    } else {
      console.log("Minimum speed reached.");
    }
  }
  
  // Restart simulation to apply new speed without resetting state.
  restartSimulation(silent = false) {
    // Stop only the simulation interval, but preserve the timer interval.
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    // Restart the simulation interval without resetting the timer.
    this.simulationInterval = setInterval(() => {
      this.runSimulationStep();
    }, this.speed);

    if (!silent) console.log("Simulation restarted with new speed.");
  }
}
