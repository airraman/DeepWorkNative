import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = 24;
const MAX_BOXES_PER_ROW = 10;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

const mockDeepWorkData = {
  '2024-02-13': [
    { activity: 'write', duration: 30 },
    { activity: 'write', duration: 20 },
  ],
  '2024-02-14': [
    { activity: 'code', duration: 30 },
    { activity: 'write', duration: 20 },
    { activity: 'write', duration: 30 },
  ],
};

const activityColors = {
  'write': '#E4D0FF',      // Purple
  'code': '#D0FFDB',       // Green
  'produce-music': '#FFE4D0' // Orange
};

const MetricsScreen = () => {
  const today = new Date();
  const currentRealMonth = today.getMonth();
  const currentRealYear = today.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(currentRealMonth);
  const [currentYear, setCurrentYear] = useState(currentRealYear);
  const panX = useRef(new Animated.Value(0)).current;
  
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

  const getDaysInMonth = () => {
    const dates = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date) => {
    return `${date.getDate()}`;
  };

  const renderActivityBoxes = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const sessions = mockDeepWorkData[dateString] || [];
    
    return (
      <View style={styles.boxesContainer}>
        {sessions.map((session, index) => (
          <View
            key={index}
            style={[
              styles.activityBox,
              { backgroundColor: activityColors[session.activity] }
            ]}
          />
        ))}
        {[...Array(MAX_BOXES_PER_ROW - sessions.length)].map((_, index) => (
          <View
            key={`empty-${index}`}
            style={[styles.activityBox, styles.emptyBox]}
          />
        ))}
      </View>
    );
  };

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
          {Object.entries(activityColors).map(([activity, color]) => (
            <View key={activity} style={styles.legendItem}>
              <View
                style={[styles.legendBox, { backgroundColor: color }]}
              />
              <Text style={styles.legendText}>
                {activity.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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