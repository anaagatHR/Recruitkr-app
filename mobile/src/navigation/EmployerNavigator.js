import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import MyJobsScreen from "../screens/employer/MyJobsScreen";
import PostJobScreen from "../screens/employer/PostJobScreen";
import ApplicantsScreen from "../screens/employer/ApplicantsScreen";
import EmployerProfileScreen from "../screens/employer/EmployerProfileScreen";
import ConversationsScreen from "../screens/shared/ConversationsScreen";
import ChatScreen from "../screens/shared/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function JobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="Applicants" component={ApplicantsScreen} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// Placeholder component; the tab press is intercepted to open the stack's PostJob.
function PostJobTabButton() {
  return null;
}

export default function EmployerNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const icons = { "My Jobs": "briefcase", "Post Job": "add-circle", Chat: "chatbubbles", Company: "business" };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="My Jobs" component={JobsStack} />
      <Tab.Screen
        name="Post Job"
        component={PostJobTabButton}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Open a FRESH PostJob inside the Jobs stack (no jobId => create mode)
            navigation.navigate("My Jobs", { screen: "PostJob", params: { jobId: undefined } });
          },
        })}
      />
      <Tab.Screen name="Chat" component={MessagesStack} />
      <Tab.Screen name="Company" component={EmployerProfileScreen} />
    </Tab.Navigator>
  );
}
