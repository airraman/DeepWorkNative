import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = 24;
const MAX_BOXES_PER_ROW = 10;

// Mock data structure
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
  // ... more dates
};

const activityColors = {
  'write': '#E4D0FF',      // Purple
  'code': '#D0FFDB',       // Green
  'produce-music': '#FFE4D0' // Orange
};

const MetricsScreen = () => {
  // Generate dates for the past year
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
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
        {/* Add empty boxes to maintain consistent spacing */}
        {[...Array(MAX_BOXES_PER_ROW - sessions.length)].map((_, index) => (
          <View
            key={`empty-${index}`}
            style={[styles.activityBox, styles.emptyBox]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandName}>DEEP TRACKER.io</Text>
        <Text style={styles.title}>DEEP WORK SUMMARY</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {generateDates().map((date, index) => (
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateText: {
    width: 50,
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
    padding: 16,
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