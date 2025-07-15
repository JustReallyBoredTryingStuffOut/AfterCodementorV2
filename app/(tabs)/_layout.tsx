import { Tabs } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Home, Dumbbell, Calendar, Apple, User, ActivitySquare, Map } from "lucide-react-native";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color }) => <Apple size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color }) => <ActivitySquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}