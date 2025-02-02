import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Settings, BarChart2 } from 'lucide-react-native';
import { View, Text, ActivityIndicator } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MetricsScreen from './src/screens/MetricsScreen';
import DeepWorkSession from './src/screens/DeepWorkSession';

// Import storage service
import { deepWorkStore } from './src/services/deepWorkStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create a stack navigator for the Home tab
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen 
        name="DeepWorkSession" 
        component={DeepWorkSession}
        options={{
          gestureEnabled: false,
          tabBarStyle: { display: 'none' }
        }}
      />
    </Stack.Navigator>
  );
}

// Loading screen component for initialization
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 12, color: '#4b5563', fontSize: 16 }}>
        Initializing DeepWork...
      </Text>
    </View>
  );
}

export default function App() {
  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  // Initialize the storage system when the app starts
// Initialize the storage system when the app starts
useEffect(() => {
  const initializeStorage = async () => {
    try {
      // Initialize the storage system first
      const initialized = await deepWorkStore.initialize();
      if (!initialized) {
        throw new Error('Storage initialization failed');
      }

      // Only after initialization is complete, verify and repair if needed
      const isValid = await deepWorkStore.verifyStorageIntegrity();
      if (!isValid) {
        const repaired = await deepWorkStore.repairStorage();
        if (!repaired) {
          throw new Error('Unable to repair storage');
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Storage initialization error:', error);
      setInitError(error.message);
    }
  };

  initializeStorage();
}, []);

  // Show loading screen during initialization
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // If there was an initialization error, we could show an error screen
  // or handle it in another way depending on your needs
  if (initError) {
    // For now, we'll continue loading the app anyway
    console.warn('Storage initialization error:', initError);
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let icon;

            if (route.name === 'Home') {
              icon = <Home size={size} color={color} />;
            } else if (route.name === 'Settings') {
              icon = <Settings size={size} color={color} />;
            } else if (route.name === 'Metrics') {
              icon = <BarChart2 size={size} color={color} />;
            }

            return icon;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{
            title: 'Home'
          }}
        />
        <Tab.Screen 
          name="Metrics" 
          component={MetricsScreen}
          options={{
            title: 'Metrics'
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}