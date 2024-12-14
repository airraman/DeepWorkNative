import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  SafeAreaView,
  Modal
} from 'react-native';
import { Plus, X, Save } from 'lucide-react-native';

const SettingsScreen = () => {
  const [activities, setActivities] = useState([
    { id: 'write', name: 'Write', color: '#c8b2d6' },
    { id: 'code', name: 'Code', color: '#f1dbbc' },
    { id: 'produce-music', name: 'Produce Music', color: '#bcd2f1' }
  ]);
  const [newActivity, setNewActivity] = useState('');
  const [selectedColor, setSelectedColor] = useState('#c8b2d6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedDurations, setSelectedDurations] = useState([]);

  const colorPalette = [
    '#c8b2d6', '#f1dbbc', '#bcd2f1', '#d6b2c8', 
    '#b2d6c8', '#dbbcf1', '#bcf1db', '#f1bcdb'
  ];

  const durations = [5, 10, 15, 20, 30, 45];

  const showFeedback = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      const id = newActivity.toLowerCase().replace(/\s+/g, '-');
      setActivities([...activities, { id, name: newActivity, color: selectedColor }]);
      setNewActivity('');
      setSelectedColor(colorPalette[0]);
      showFeedback('Activity added successfully!');
    }
  };

  const handleDeleteActivity = (idToDelete) => {
    setActivities(activities.filter(activity => activity.id !== idToDelete));
    showFeedback('Activity deleted');
  };

  const handleDurationClick = (duration) => {
    if (selectedDurations.includes(duration)) {
      setSelectedDurations(selectedDurations.filter(d => d !== duration));
    } else {
      if (selectedDurations.length === 3) {
        setSelectedDurations([duration]);
      } else {
        setSelectedDurations([...selectedDurations, duration]);
      }
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
        >
          <X size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
            />
            <View style={styles.formControls}>
              <View style={styles.colorSelectContainer}>
                <Text style={styles.colorSelectLabel}>Color:</Text>
                <TouchableOpacity
                  style={[styles.selectedColorPreview, { backgroundColor: selectedColor }]}
                  onPress={() => setShowColorPicker(true)}
                />
              </View>
              <TouchableOpacity
                style={[styles.addButton, !newActivity.trim() && styles.disabledButton]}
                onPress={handleAddActivity}
                disabled={!newActivity.trim()}
              >
                <Plus size={20} color="white" />
                <Text style={styles.buttonText}>Add</Text>
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
                ]}
                onPress={() => handleDurationClick(duration)}
                disabled={
                  selectedDurations.length === 3 &&
                  !selectedDurations.includes(duration)
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
            selectedDurations.length !== 3 && styles.disabledButton,
          ]}
          onPress={() => showFeedback('Settings updated successfully!')}
          disabled={selectedDurations.length !== 3}
        >
          <Save size={20} color="white" />
          <Text style={styles.buttonText}>Update Settings</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
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
  disabledButton: {
    opacity: 0.5,
  },
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