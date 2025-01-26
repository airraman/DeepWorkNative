import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Clock, Music, Pencil } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { deepWorkStore } from '../services/deepWorkStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  
  // Core state for session configuration
  const [duration, setDuration] = useState('');
  const [activity, setActivity] = useState('');
  const [musicChoice, setMusicChoice] = useState('');
  
  // State for managing settings loaded from deepWorkStore
  const [availableDurations, setAvailableDurations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Music options remain constant as they're not configurable in settings
  const musicOptions = [
    { value: 'none', label: 'No music' },
    { value: 'white-noise', label: 'White noise' },
    { value: 'lofi', label: 'Lo-fi' }
  ];

  // Load settings when component first mounts
  useEffect(() => {
    loadSettings();
  }, []);

  // Reload settings whenever the screen comes into focus
  // This ensures we have the latest settings after changes in SettingsScreen
  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  // Function to load settings from deepWorkStore
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await deepWorkStore.getSettings();
      
      // Update local state with settings
      setAvailableDurations(settings.durations);
      setActivities(settings.activities);
      
      // Validate existing selections against new settings
      // If a selected duration or activity is no longer available, reset it
      if (duration && !settings.durations.includes(parseInt(duration))) {
        setDuration('');
      }
      if (activity && !settings.activities.some(a => a.id === activity)) {
        setActivity('');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting a new deep work session
  const handleStartSession = () => {
    navigation.navigate('DeepWorkSession', {
      duration,
      activity,
      musicChoice
    });
  };

  // Render individual activity item in the horizontal list
  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        activity === item.id && styles.activityItemSelected
      ]}
      onPress={() => setActivity(item.id)}
    >
      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
      <Text style={styles.activityName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Show loading screen while fetching settings
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
      <ScrollView style={styles.content}>
        <Text style={styles.brandName}>DeepWork.io</Text>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prepare Deep Work Session</Text>
        </View>
        <View style={styles.divider} />

        {/* Duration Selection - Now using dynamic durations from settings */}
        <View style={[styles.section, duration && styles.sectionCompleted]}>
          <View style={styles.sectionHeader}>
            <Clock stroke="#6b7280" size={20} />
            <Text style={styles.sectionTitle}>Session Duration</Text>
          </View>
          <View style={styles.durationButtons}>
            {availableDurations.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.durationButton,
                  duration === time.toString() && styles.durationButtonActive
                ]}
                onPress={() => setDuration(time.toString())}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    duration === time.toString() && styles.durationButtonTextActive
                  ]}
                >
                  {time}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Selection - Now using dynamic activities from settings */}
        <View style={[styles.section, activity && styles.sectionCompleted]}>
          <View style={styles.sectionHeader}>
            <Pencil stroke="#6b7280" size={20} />
            <Text style={styles.sectionTitle}>Activity Name</Text>
          </View>
          <FlatList
            data={activities}
            renderItem={renderActivity}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activitiesList}
          />
        </View>

        {/* Music Selection */}
        <View style={[styles.section, musicChoice && styles.sectionCompleted]}>
          <View style={styles.sectionHeader}>
            <Music stroke="#6b7280" size={20} />
            <Text style={styles.sectionTitle}>Background Music</Text>
          </View>
          <View style={styles.musicButtons}>
            {musicOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.musicButton,
                  musicChoice === option.value && styles.musicButtonActive
                ]}
                onPress={() => setMusicChoice(option.value)}
              >
                <Text
                  style={[
                    styles.musicButtonText,
                    musicChoice === option.value && styles.musicButtonTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!duration || !activity || !musicChoice) && styles.startButtonDisabled
          ]}
          onPress={handleStartSession}
          disabled={!duration || !activity || !musicChoice}
        >
          <Text style={styles.startButtonText}>Begin Deep Work Timer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  brandName: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  sectionCompleted: {
    borderColor: '#2563eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  durationButton: {
    width: (SCREEN_WIDTH - 96) / 3,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#2563eb',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  durationButtonTextActive: {
    color: 'white',
  },
  // New Activity Styles
  activitiesList: {
    flexGrow: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: SCREEN_WIDTH * 0.6,
  },
  activityItemSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  // Updated Music Styles
  musicButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  musicButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  musicButtonActive: {
    backgroundColor: '#2563eb',
  },
  musicButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  musicButtonTextActive: {
    color: 'white',
  },
  // Footer Styles
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  startButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;