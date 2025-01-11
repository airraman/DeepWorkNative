import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  BackHandler
} from 'react-native';

import { deepWorkStore } from '../services/deepWorkStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ACTIVITY_COLORS = {
  'write': '#4f46e5', // indigo
  'code': '#0891b2', // cyan
  'produce-music': '#7c3aed' // violet
};

const DeepWorkSession = ({ route, navigation }) => {
  // Get session parameters from navigation
  const { duration, activity, musicChoice } = route.params;
  
  // Convert duration from minutes to milliseconds
  const totalDuration = parseInt(duration) * 60 * 1000;
  
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const animatedHeight = useRef(new Animated.Value(1)).current;
  
  // Handle session completion
  const handleSessionComplete = async () => {
    try {
      setIsCompleted(true);
      
      // Save the completed session
      await deepWorkStore.addSession({
        activity,
        duration,
        musicChoice
      });
      
      // Show completion message
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
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert(
        'Error',
        'Failed to save your session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'End Session?',
          'Are you sure you want to end your deep work session early?',
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
  
  // Start and manage timer
  useEffect(() => {
    // Start the countdown and animation
    startTimeRef.current = Date.now();
    
    // Animate the column height
    Animated.timing(animatedHeight, {
      toValue: 0,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();
    
    // Update the time remaining
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, totalDuration - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          handleSessionComplete();
        }
      }
    }, 1000);
    
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