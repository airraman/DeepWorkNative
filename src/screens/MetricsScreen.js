import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const MetricsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Metrics Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default MetricsScreen;