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
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { deepWorkStore } from '../services/deepWorkStore';
import SessionDetailsModal from '../components/modals/SessionDetailsModal';
import SharedHeader from '../components/SharedHeader';
import { useTheme, THEMES } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = 24;
const MAX_BOXES_PER_ROW = 10;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 60 : 50;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

const MetricsScreen = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === THEMES.DARK;
  
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
    return activity?.color || colors.border;
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
            currentMonth === index && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
        >
          <Text style={[
            { color: colors.textSecondary },
            currentMonth === index && { color: colors.text }
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
        style={[
          styles.monthTabsContainer,
          { 
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          }
        ]}
        contentContainerStyle={styles.monthTabsContent}
      >
        {visibleMonths}
      </ScrollView>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SharedHeader title="DEEP TRACKER.io" />
        <View style={[styles.centered, { marginTop: HEADER_HEIGHT / 2 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SharedHeader title="DEEP TRACKER.io" />
        <View style={[styles.centered, { marginTop: HEADER_HEIGHT / 2 }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadInitialData}
          >
            <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentWrapper}>
        <SharedHeader title="DEEP TRACKER.io" />
        
        <View style={styles.tabWrapper}>
          {renderMonthTabs()}
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          {...panResponder.panHandlers}
        >
          {getDaysInMonth().map((date, index) => (
            <View key={index} style={[
              styles.dateRow, 
              { 
                borderBottomWidth: 1, 
                borderBottomColor: colors.border 
              }
            ]}>
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date)}</Text>
              {renderActivityBoxes(date)}
            </View>
          ))}
        </ScrollView>

        <View style={[
          styles.legend, 
          { 
            borderTopWidth: 1, 
            borderTopColor: colors.border 
          }
        ]}>
          <Text style={[styles.legendTitle, { color: colors.text }]}>Activities:</Text>
          <View style={styles.legendItems}>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.legendItem}>
                <View
                  style={[styles.legendBox, { backgroundColor: activity.color }]}
                />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  {activity.name}
                </Text>
              </View>
            ))}
          </View>
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
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  tabWrapper: {
    position: 'absolute',
    top: HEADER_HEIGHT - 1, // Overlap with header by 1px
    left: 0,
    right: 0,
    zIndex: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  }, 
  monthTabsContainer: {
    height: 40,
    backgroundColor: '#000000',
  },
  monthTabsContent: {
    paddingHorizontal: 8,
  },
  monthTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    // Add enough top padding to account for header and month tabs
    marginTop: HEADER_HEIGHT + 40, 
  },
  scrollContentContainer: {
    paddingTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dateText: {
    width: 30,
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
  },
  legendTitle: {
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
    fontSize: 12,
  },
});

export default MetricsScreen;