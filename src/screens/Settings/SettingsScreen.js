import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SosContext } from '../../context/SosContext';

export default function SettingsScreen({ navigation }) {
  const { sosContacts, saveSosContacts } = useContext(SosContext);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState('');

  useEffect(() => {
    setContacts(sosContacts || []);
  }, [sosContacts]);

  const handleAddContact = () => {
    if (!newContact.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Check for duplicate contacts
    if (contacts.includes(newContact.trim())) {
      Alert.alert('Error', 'This contact already exists');
      return;
    }

    setContacts([...contacts, newContact.trim()]);
    setNewContact('');
  };

  const handleDeleteContact = (index) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
  };

  const handleSave = async () => {
    if (contacts.length === 0) {
      Alert.alert('Error', 'Please add at least one contact');
      return;
    }
    try {
      await saveSosContacts(contacts);
      Alert.alert('Success', 'Emergency contacts updated');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save contacts:', error);
      Alert.alert('Error', 'Failed to save contacts. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Emergency Contacts</Text>
      <FlatList
        data={contacts}
        removeClippedSubviews={false}
        keyExtractor={(item, index) => `${item}-${index}`} // Ensure unique keys
        renderItem={({ item, index }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactText}>{item}</Text>
            <TouchableOpacity onPress={() => handleDeleteContact(index)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        value={newContact}
        onChangeText={setNewContact}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
      />
      <Button title="Add Contact" onPress={handleAddContact} />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  label: { fontSize: 18, marginBottom: 10 },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: { fontSize: 16 },
  deleteButton: { color: 'red' },
});
