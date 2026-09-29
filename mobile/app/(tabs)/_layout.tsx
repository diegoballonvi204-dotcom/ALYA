import { Tabs } from "expo-router";
import { Sparkles, MessageSquare, Calendar, User } from "lucide-react-native";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#070D1E",
          borderBottomWidth: 1,
          borderBottomColor: "#1E293B",
        },
        headerTitleStyle: {
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: "#070D1E",
          borderTopWidth: 1,
          borderTopColor: "#1E293B",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#64748B",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Matching",
          headerTitle: "LEGALMATCH Perú",
          tabBarIcon: ({ color, size }) => (
            <Sparkles color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Mensajes",
          headerTitle: "Canal Seguro",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Citas",
          headerTitle: "Agenda Jurídica",
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerTitle: "Mi Cuenta Legal",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 22} />
          ),
        }}
      />
    </Tabs>
  );
}
