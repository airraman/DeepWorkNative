import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  BackHandler,
  ActivityIndicator
} from 'react-native';

import { deepWorkStore } from '../services/deepWorkStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define colors for different activity types
const ACTIVITY_COLORS = {
  'write': '#4f46e5',     // indigo
  'code': '#0891b2',      // cyan
  'produce-music': '#7c3aed' // violet
};

const DeepWorkSession = ({ route, navigation }) => {
  // Get session parameters from navigation
  const { duration, activity, musicChoice } = route.params;
  
  // Convert duration from minutes to milliseconds for timer
  const totalDuration = parseInt(duration) * 60 * 1000;
  
  // Session state management
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // References for timing management
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const saveRetryCountRef = useRef(0);
  const animatedHeight = useRef(new Animated.Value(1)).current;

  // Maximum number of save retries before giving up
  const MAX_SAVE_RETRIES = 3;
  
  // Start or resume the timer
  const startTimer = () => {
    startTimeRef.current = Date.now() - (totalDuration - timeLeft);
    
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, totalDuration - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          handleTimeout();
        }
      }
    }, 1000);
  };

  // Handle timer completion
  const handleTimeout = async () => {
    try {
      // Pause timer while attempting to save
      clearInterval(intervalRef.current);
      setIsPaused(true);
      
      // Attempt to save the session
      const success = await handleSessionComplete();
      
      if (success) {
        // If save was successful, complete the session
        setIsCompleted(true);
      } else {
        // If save failed, restart timer with remaining time
        startTimer();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error handling timeout:', error);
      // Restart timer on error
      startTimer();
      setIsPaused(false);
    }
  };
  
  // Handle session completion and data saving
  const handleSessionComplete = async () => {
    if (isSaving) return false; // Prevent multiple save attempts
    
    try {
      setIsSaving(true);
      
      // Verify storage integrity before saving
      const storageOk = await deepWorkStore.verifyStorageIntegrity();
      if (!storageOk) {
        throw new Error('Storage integrity check failed');
      }
      
      // Save the completed session
      const result = await deepWorkStore.addSession({
        activity,
        duration: parseInt(duration),
        musicChoice
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save session');
      }
      
      // Show completion message after successful save
      Alert.alert(
        'Session Complete!',
        'Great work! Your deep work session has been recorded.',
        [
          {
            text: 'View Progress',
            onPress: () => navigation.navigate('Metrics'),
          },
          {
            text: 'New Session',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
      
      return true;
    } catch (error) {
      console.error('Error completing session:', error);
      saveRetryCountRef.current += 1;
      
      // If we haven't exceeded max retries, ask user to retry
      if (saveRetryCountRef.current < MAX_SAVE_RETRIES) {
        Alert.alert(
          'Save Error',
          'There was a problem saving your session. Would you like to try again?',
          [
            {
              text: 'Retry',
              onPress: async () => {
                setIsSaving(false);
                return await handleSessionComplete();
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Reset save state on cancel
                setIsSaving(false);
                return false;
              },
            },
          ]
        );
      } else {
        // If max retries exceeded, show final error
        Alert.alert(
          'Error',
          'Unable to save your session after multiple attempts. Would you like to try again later?',
          [
            {
              text: 'Continue Session',
              onPress: () => {
                setIsSaving(false);
                return false;
              },
            },
            {
              text: 'End Without Saving',
              style: 'destructive',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      }
      
      return false;
    }
  };
  
  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'End Session?',
          'Are you sure you want to end your deep work session early? This session will not be saved.',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'End Session',
              onPress: () => navigation.goBack(),
              style: 'destructive',
            },
          ]
        );
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation]);
  
  // Initialize timer and animation
  useEffect(() => {
    // Start the countdown and animation
    startTimer();
    
    // Animate the progress column
    Animated.timing(animatedHeight, {
      toValue: 0,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, totalDuration]);
  
  // Format remaining time as MM:SS
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format activity name for display
  const formatActivityName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Session Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.totalTimeText}>
            of {duration}:00 minutes
          </Text>
          {isSaving && (
            <ActivityIndicator 
              size="small" 
              color="#2563eb" 
              style={styles.savingIndicator} 
            />
          )}
        </View>
        
        {/* Progress Column */}
        <View style={styles.columnContainer}>
          <Animated.View
            style={[
              styles.column,
              {
                backgroundColor: ACTIVITY_COLORS[activity],
                height: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        
        {/* Session Info */}
        <View style={styles.infoSection}>
          <Text style={styles.activityText}>
            {formatActivityName(activity)}
          </Text>
          {musicChoice !== 'none' && (
            <Text style={styles.musicText}>
              {formatActivityName(musicChoice)}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  savingIndicator: {
    marginTop: 8,
  },

  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  timerSection: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalTimeText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    marginBotton: 5
  },
  columnContainer: {
    width: 120,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#e5e7eb',
    borderRadius: 60,
    marginTop: 8,
    overflow: 'hidden',
  },
  column: {
    width: '100%',
    borderRadius: 60,
  },
  infoSection: {
    alignItems: 'center',
  },
  activityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4b5563',
  },
  musicText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  }
});

export default DeepWorkSession;