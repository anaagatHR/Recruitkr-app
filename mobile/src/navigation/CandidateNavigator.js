import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLang } from "../i18n/LanguageContext";
import { useTheme } from "../context/ThemeContext";

import JobListScreen from "../screens/candidate/JobListScreen";
import JobDetailScreen from "../screens/candidate/JobDetailScreen";
import InternshipsScreen from "../screens/candidate/InternshipsScreen";
import SavedJobsScreen from "../screens/candidate/SavedJobsScreen";
import MyApplicationsScreen from "../screens/candidate/MyApplicationsScreen";
import ProfileScreen from "../screens/candidate/ProfileScreen";
import EditProfileScreen from "../screens/candidate/EditProfileScreen";
import ResumeBuilderScreen from "../screens/candidate/ResumeBuilderScreen";
import NotificationsScreen from "../screens/candidate/NotificationsScreen";
import CompaniesScreen from "../screens/candidate/CompaniesScreen";
import CompanyDetailScreen from "../screens/candidate/CompanyDetailScreen";
import AIChatScreen from "../screens/candidate/AIChatScreen";
import ConversationsScreen from "../screens/shared/ConversationsScreen";
import ChatScreen from "../screens/shared/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobList" component={JobListScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Companies" component={CompaniesScreen} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
      <Stack.Screen name="Saved" component={SavedJobsScreen} />
    </Stack.Navigator>
  );
}

function InternStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InternList" component={InternshipsScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} />
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

export default function CandidateNavigator() {
  const { t } = useLang();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 6,
          backgroundColor: colors.surface, borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Jobs: "briefcase",
            Internships: "school",
            AI: focused ? "sparkles" : "sparkles-outline",
            Chat: "chatbubbles",
            Applications: "document-text",
            Account: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Jobs" component={HomeStack} options={{ tabBarLabel: t("jobs") }} />
      <Tab.Screen name="Internships" component={InternStack} options={{ tabBarLabel: "Interns" }} />
      <Tab.Screen name="AI" component={AIChatScreen} options={{ tabBarLabel: "AI Chat" }} />
      <Tab.Screen name="Chat" component={MessagesStack} options={{ tabBarLabel: "Messages" }} />
      <Tab.Screen name="Applications" component={MyApplicationsScreen} options={{ tabBarLabel: t("applications") }} />
      <Tab.Screen name="Account" component={ProfileStack} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}
