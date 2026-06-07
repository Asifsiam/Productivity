import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Platform } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, color: string, size: number) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.supplements,
        tabBarInactiveTintColor: '#444444',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Supplements',
          tabBarActiveTintColor: Colors.supplements,
          tabBarIcon: ({ color, size }) => tabIcon('medical', color, size),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Routine',
          tabBarActiveTintColor: Colors.routine,
          tabBarIcon: ({ color, size }) => tabIcon('calendar', color, size),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          tabBarActiveTintColor: Colors.todo,
          tabBarIcon: ({ color, size }) => tabIcon('checkmark-circle', color, size),
        }}
      />
      <Tabs.Screen
        name="hours"
        options={{
          title: 'Hours',
          tabBarActiveTintColor: Colors.hours,
          tabBarIcon: ({ color, size }) => tabIcon('time', color, size),
        }}
      />
    </Tabs>
  );
}
