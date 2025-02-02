import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { deepWorkStore } from '../services/deepWorkStore';
import SessionDetailsModal from '../components/SessionDetailsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = 24;
const MAX_BOXES_PER_ROW = 10;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

// Define base activity colors - these should match the display colors from settings
const activityColors = {
  'write': '#E4D0FF',      // Purple
  'code': '#D0FFDB',       // Green
  'produce-music': '#FFE4D0' // Orange
};

const MetricsScreen = () => {
  // Date-related state
  const today = new Date();
  const currentRealMonth = today.getMonth();
  const currentRealYear = today.getFullYear();

  // UI state
  const [currentMonth, setCurrentMonth] = useState(currentRealMonth);
  const [currentYear, setCurrentYear] = useState(currentRealYear);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  
  // Data state
  const [sessions, setSessions] = useState({});
  const [activities, setActivities] = useState([]);
  
  // Animation state
  const panX = useRef(new Animated.Value(0)).current;

  // Load data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadInitialData();
    }, [])
  );

  // Load both sessions and activities data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load sessions and settings in parallel
      const [sessionsData, settings] = await Promise.all([
        deepWorkStore.getSessions(),
        deepWorkStore.getSettings()
      ]);

      setSessions(sessionsData);
      setActivities(settings.activities);
    } catch (error) {
      console.error('Failed to load metrics data:', error);
      setError('Failed to load data. Pull down to refresh.');
    } finally {
      setIsLoading(false);
    }
  };





  // Handle month navigation through gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SCREEN_WIDTH / 3) {
          if (gestureState.dx > 0) {
            navigateMonth(-1);
          } else {
            navigateMonth(1);
          }
        }
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Navigate between months
  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    // Prevent navigation to future dates
    if (newYear > currentRealYear || 
        (newYear === currentRealYear && newMonth > currentRealMonth)) {
      return;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Get all days in the current month
  const getDaysInMonth = () => {
    const dates = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      dates.push(date);
    }
    return dates;
  };

  // Format date for display
  const formatDate = (date) => {
    return `${date.getDate()}`;
  };

  // Get color for an activity, falling back to a default if not found
  const getActivityColor = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    return activity?.color || activityColors[activityId] || '#gray';
  };

  const handleSessionPress = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const renderActivityBoxes = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const daySessions = sessions[dateString] || [];
    
    return (
      <View style={styles.boxesContainer}>
        {daySessions.map((session, index) => (
          <TouchableOpacity
            key={`${dateString}-${index}`}
            onPress={() => handleSessionPress(session)}
          >
            <View
              style={[
                styles.activityBox,
                { backgroundColor: getActivityColor(session.activity) }
              ]}
            />
          </TouchableOpacity>
        ))}
        {[...Array(MAX_BOXES_PER_ROW - daySessions.length)].map((_, index) => (
          <View
            key={`empty-${dateString}-${index}`}
            style={[styles.activityBox, styles.emptyBox]}
          />
        ))}
      </View>
    );
  };


  // Render month selection tabs
  const renderMonthTabs = () => {
    const visibleMonths = MONTHS.map((month, index) => {
      const isVisible = currentYear < currentRealYear || 
        (currentYear === currentRealYear && index <= currentRealMonth);
      
      if (!isVisible) return null;

      return (
        <TouchableOpacity
          key={month}
          onPress={() => setCurrentMonth(index)}
          style={[
            styles.monthTab,
            currentMonth === index && styles.monthTabActive
          ]}
        >
          <Text style={[
            styles.monthTabText,
            currentMonth === index && styles.monthTabTextActive
          ]}>
            {month}
          </Text>
        </TouchableOpacity>
      );
    });

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.monthTabsContainer}
        contentContainerStyle={styles.monthTabsContent}
      >
        {visibleMonths}
      </ScrollView>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#E4D0FF" />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadInitialData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }









return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.brandName}>DEEP TRACKER.io</Text>
        <Text style={styles.title}>DEEP WORK SUMMARY</Text>
      </View>

      {renderMonthTabs()}
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        {...panResponder.panHandlers}
      >
        {getDaysInMonth().map((date, index) => (
          <View key={index} style={styles.dateRow}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            {renderActivityBoxes(date)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Activities:</Text>
        <View style={styles.legendItems}>
          {activities.map((activity) => (
            <View key={activity.id} style={styles.legendItem}>
              <View
                style={[styles.legendBox, { backgroundColor: activity.color }]}
              />
              <Text style={styles.legendText}>
                {activity.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <SessionDetailsModal
        visible={showSessionDetails}
        session={selectedSession}
        onClose={() => {
          setShowSessionDetails(false);
          setSelectedSession(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  }, 
  
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  monthTabsContainer: {
    maxHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  monthTabsContent: {
    paddingHorizontal: 8,
  },
  monthTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E4D0FF',
  },
  monthTabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  monthTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateText: {
    width: 30,
    color: '#FFFFFF',
    fontSize: 12,
  },
  boxesContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  activityBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 4,
  },
  emptyBox: {
    backgroundColor: 'transparent',
  },
  legend: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 4,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default MetricsScreen;