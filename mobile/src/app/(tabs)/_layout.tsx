import { Tabs } from "expo-router";
import { Home, Users, User, MessageCircle, Bell, Menu } from "lucide-react-native";
import { View, Image } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../../components/ui/Avatar";

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarShowLabel: false,
        tabBarStyle: {
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
          tabBarIcon: ({ color, size }) => <Home size={28} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, size }) => <Users size={28} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="messenger"
        options={{
          title: "Messenger",
          tabBarIcon: ({ color, size }) => <MessageCircle size={28} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => <Bell size={28} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
             <View className={`rounded-full border-2 ${color === '#2563eb' ? 'border-blue-600' : 'border-transparent'}`}>
                <Avatar source={user?.profileImage} size="sm" className="w-7 h-7" />
             </View>
          ),
        }}
      />
    </Tabs>
  );
}

