import { Tabs } from "expo-router";
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  User as UserIcon,
  Coins,
  Shield,
  Wallet,
  LogOut,
} from "lucide-react-native";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../../components/ui/Avatar";

export default function TabLayout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const points =
    // @ts-ignore
    (user?.points as number | undefined) ?? 0;
  const wallet = user?.walletBalance ?? "0";
  const isAdmin = Array.isArray(user?.roles)
    ? user?.roles.includes("admin")
    : // @ts-ignore
      user?.roles === "admin";

  return (
    <>
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
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: ({ accessibilityState, ...rest }) => (
            <TouchableOpacity
              {...rest}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.8}
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <View
                className={`rounded-full border-2 ${
                  accessibilityState?.selected ? "border-blue-600" : "border-transparent"
                }`}
              >
                <Avatar source={user?.profileImage} size="md" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      </Tabs>

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setMenuVisible(false)}
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        />
        <View
          style={{
            position: "absolute",
            right: 12,
            bottom: 80,
            minWidth: 220,
          }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/profile");
            }}
          >
            <View className="flex-row items-center gap-3">
              <UserIcon size={18} color="#111827" />
              <Text className="text-gray-900 font-medium">Profile</Text>
            </View>
          </TouchableOpacity>

          <View className="h-px bg-gray-100" />

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/points");
            }}
          >
            <View className="flex-row items-center gap-3">
              <Coins size={18} color="#111827" />
              <Text className="text-gray-900 font-medium">Points</Text>
            </View>
            <Text className="text-blue-600 font-semibold">{points}</Text>
          </TouchableOpacity>

          {isAdmin ? (
            <>
              <View className="h-px bg-gray-100" />
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
                onPress={() => {
                  setMenuVisible(false);
                  // Placeholder: navigate to admin panel route if present
                  // router.push("/(tabs)/admin"); // create when available
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Shield size={18} color="#111827" />
                  <Text className="text-gray-900 font-medium">Admin panel</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : null}

          <View className="h-px bg-gray-100" />

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/wallet");
            }}
          >
            <View className="flex-row items-center gap-3">
              <Wallet size={18} color="#111827" />
              <Text className="text-gray-900 font-medium">Wallet</Text>
            </View>
            <Text className="text-blue-600 font-semibold">₦{wallet}</Text>
          </TouchableOpacity>

          <View className="h-px bg-gray-100" />

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
            onPress={async () => {
              setMenuVisible(false);
              await logout();
            }}
          >
            <View className="flex-row items-center gap-3">
              <LogOut size={18} color="#111827" />
              <Text className="text-gray-900 font-medium">Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

