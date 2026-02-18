import { Tabs } from "expo-router";
import { Home, Users, MessageCircle, Bell } from "lucide-react-native";
import { View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../../components/ui/Avatar";

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#6b7280",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Home size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color, size }) => (
              <Users size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="messenger"
          options={{
            title: "Messenger",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, size }) => (
              <Bell size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="watch"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="memories"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="points"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="packages"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="mine"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <View
                className={`rounded-full border-2 ${
                  focused ? "border-blue-600" : "border-transparent"
                }`}
              >
                <Avatar source={user?.profileImage} size="md" />
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}
