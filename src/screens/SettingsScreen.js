import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,  // This was missing
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  SafeAreaView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Plus, X, Save } from 'lucide-react-native';
import { deepWorkStore } from '../services/deepWorkStore';

const SettingsScreen = () => {
  // Core state management
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [selectedColor, setSelectedColor] = useState('#c8b2d6');
  const [selectedDurations, setSelectedDurations] = useState([]);
  
  // UI state management
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const colorPalette = [
    '#c8b2d6', '#f1dbbc', '#bcd2f1', '#d6b2c8', 
    '#b2d6c8', '#dbbcf1', '#bcf1db', '#f1bcdb'
  ];

  const durations = [5, 10, 15, 20, 30, 45];

  // Load saved settings when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await deepWorkStore.getSettings();
      setActivities(settings.activities);
      setSelectedDurations(settings.durations);
    } catch (error) {
      showFeedback('Error loading settings');
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showFeedback = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;

    try {
      setIsSaving(true);
      const id = newActivity.toLowerCase().replace(/\s+/g, '-');
      const updatedActivities = [
        ...activities, 
        { 
          id, 
          name: newActivity, 
          color: selectedColor 
        }
      ];
      
      const success = await deepWorkStore.updateActivities(updatedActivities);
      
      if (success) {
        setActivities(updatedActivities);
        setNewActivity('');
        setSelectedColor(colorPalette[0]);
        showFeedback('Activity added successfully!');
      } else {
        throw new Error('Failed to save activity');
      }
    } catch (error) {
      showFeedback('Error saving activity');
      console.error('Failed to add activity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (idToDelete) => {
    try {
      setIsSaving(true);
      const updatedActivities = activities.filter(
        activity => activity.id !== idToDelete
      );
      
      const success = await deepWorkStore.updateActivities(updatedActivities);
      
      if (success) {
        setActivities(updatedActivities);
        showFeedback('Activity deleted');
      } else {
        throw new Error('Failed to delete activity');
      }
    } catch (error) {
      showFeedback('Error deleting activity');
      console.error('Failed to delete activity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDurationClick = async (duration) => {
    try {
      setIsSaving(true);
      let newDurations;
      
      if (selectedDurations.includes(duration)) {
        newDurations = selectedDurations.filter(d => d !== duration);
      } else {
        if (selectedDurations.length === 3) {
          newDurations = [duration];
        } else {
          newDurations = [...selectedDurations, duration];
        }
      }
      
      const success = await deepWorkStore.updateDurations(newDurations);
      
      if (success) {
        setSelectedDurations(newDurations);
      } else {
        throw new Error('Failed to update durations');
      }
    } catch (error) {
      showFeedback('Error updating durations');
      console.error('Failed to update durations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (selectedDurations.length !== 3) {
      showFeedback('Please select exactly 3 durations');
      return;
    }

    try {
      setIsSaving(true);
      const success = await deepWorkStore.updateSettings({
        activities,
        durations: selectedDurations,
      });

      if (success) {
        showFeedback('Settings updated successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showFeedback('Error saving settings');
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderActivity = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityInfo}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={styles.activityName}>{item.name}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteActivity(item.id)}
          style={styles.deleteButton}
          disabled={isSaving}
        >
          <X size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Add Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Activity</Text>
          <View style={styles.addActivityForm}>
            <TextInput
              style={styles.input}
              value={newActivity}
              onChangeText={setNewActivity}
              placeholder="Activity name"
              maxLength={20}
              editable={!isSaving}
            />
            <View style={styles.formControls}>
              <View style={styles.colorSelectContainer}>
                <Text style={styles.colorSelectLabel}>Color:</Text>
                <TouchableOpacity
                  style={[styles.selectedColorPreview, { backgroundColor: selectedColor }]}
                  onPress={() => setShowColorPicker(true)}
                  disabled={isSaving}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!newActivity.trim() || isSaving) && styles.disabledButton
                ]}
                onPress={handleAddActivity}
                disabled={!newActivity.trim() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Plus size={20} color="white" />
                    <Text style={styles.buttonText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Activities List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activities</Text>
          <FlatList
            data={activities}
            renderItem={renderActivity}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activitiesList}
          />
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Lengths</Text>
          <Text style={styles.helpText}>
            Select 3 options ({selectedDurations.length}/3)
          </Text>
          <View style={styles.durationGrid}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  selectedDurations.includes(duration) && styles.selectedDuration,
                  selectedDurations.length === 3 &&
                    !selectedDurations.includes(duration) &&
                    styles.disabledDuration,
                  isSaving && styles.disabledButton
                ]}
                onPress={() => handleDurationClick(duration)}
                disabled={
                  isSaving ||
                  (selectedDurations.length === 3 &&
                    !selectedDurations.includes(duration))
                }
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDurations.includes(duration) &&
                      styles.selectedDurationText,
                  ]}
                >
                  {duration}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[
            styles.updateButton,
            (selectedDurations.length !== 3 || isSaving) && styles.disabledButton,
          ]}
          onPress={handleSaveSettings}
          disabled={selectedDurations.length !== 3 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.buttonText}>Update Settings</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowColorPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Color</Text>
              <View style={styles.colorGrid}>
                {colorPalette.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }]}
                    onPress={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Alert */}
        {showAlert && (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{alertMessage}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Core container styles that provide the basic layout structure
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },

  // Loading state styles for the centered loading indicator
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },

  // Header section styles
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Common section styles used throughout the screen
  section: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1f2937',
  },

  // Add Activity form styles
  addActivityForm: {
    width: '100%',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  formControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Color selection styles
  colorSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSelectLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedColorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Button styles used throughout the screen
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Activity list styles
  activitiesList: {
    flexGrow: 0,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: 200,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },

  // Duration selection styles
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  durationButton: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDuration: {
    backgroundColor: '#2563eb',
  },
  durationText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedDurationText: {
    color: 'white',
  },
  disabledDuration: {
    opacity: 0.5,
  },

  // Update button styles
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    margin: 15,
    gap: 8,
  },

  // Modal styles for color picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1f2937',
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Alert styles for feedback messages
  alert: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default SettingsScreen;