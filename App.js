import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Settings, BarChart2 } from 'lucide-react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MetricsScreen from './src/screens/MetricsScreen';
import DeepWorkSession from './src/screens/DeepWorkSession';

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

export default function App() {
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