import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, NativeModules } from 'react-native';

const { SmsModule } = NativeModules;

const SosModule = ({ 
  visible, 
  onClose, 
  contact,           // Array of contacts (e.g., phone numbers)
  currentLocation    // The current live location { latitude, longitude }
}) => {
  const [counter, setCounter] = useState(60);

  // Start a countdown when the modal becomes visible.
  useEffect(() => {
    if (!visible) {
      // Reset timer when modal is hidden.
      setCounter(10);
      return;
    }

    const timerId = setInterval(() => {
      setCounter(prevCounter => {
        if (prevCounter <= 1) {
          clearInterval(timerId);
          handleSendSOS(); // Trigger SMS automatically when timer reaches 0.
          return 0;
        }
        return prevCounter - 1;
      });
    }, 1000);

    // Clear timer on cleanup.
    return () => clearInterval(timerId);
  }, [visible]);

  // Send SMS to all contacts
  const handleSendSOS = () => {
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
    const message = `SOS Alert: The person is not safe! Location: ${mapLink}`;

    // Loop through all contacts and send the message
    contact.forEach((phoneNumber) => {
      SmsModule.sendSMS(phoneNumber, message, (error, success) => {
        if (error) {
          console.error(`Failed to send SMS to ${phoneNumber}:`, error);
        } else {
          console.log(`SMS sent to ${phoneNumber}:`, success);
        }
      });
    });

    // Close the modal after sending the SMS
    setTimeout(() => {
      onClose();
    }, 0);
  };

  // Called when the user selects "Yes" (indicating they are safe)
  const handleSafe = () => {
    setTimeout(() => {
      onClose();
    }, 0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.timerText}>{counter}s</Text>
          <Text style={styles.messageText}>Are you safe?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.safeButton]} onPress={handleSafe}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.noButton]} onPress={handleSendSOS}>
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  safeButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SosModule;
