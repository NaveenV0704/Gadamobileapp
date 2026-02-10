import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../constants/config";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Cover Image */}
        <View className="h-40 bg-gray-200 w-full relative">
            {user?.coverImage ? (
                <Image 
                    source={{ uri: user.coverImage.startsWith('http') ? user.coverImage : `${API_BASE_URL}${user.coverImage}` }} 
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : null}
        </View>

        {/* Profile Info */}
        <View className="px-4 -mt-12 mb-4">
             <View className="w-24 h-24 bg-white rounded-full p-1 shadow-sm">
                <Image 
                    source={{ uri: user?.profileImage?.startsWith('http') ? user.profileImage : `${API_BASE_URL}${user?.profileImage}` }} 
                    className="w-full h-full rounded-full bg-gray-300"
                />
             </View>
             
             <View className="mt-3">
                <Text className="text-2xl font-bold">{user?.firstname} {user?.lastname}</Text>
                <Text className="text-gray-500">@{user?.username}</Text>
             </View>

             <View className="mt-4 flex-row gap-4">
                 <View>
                     <Text className="font-bold text-lg">0</Text>
                     <Text className="text-gray-500 text-xs">Friends</Text>
                 </View>
                 <View>
                     <Text className="font-bold text-lg">0</Text>
                     <Text className="text-gray-500 text-xs">Posts</Text>
                 </View>
             </View>
        </View>

        <View className="px-4 mt-4 space-y-3">
            <Button variant="outline" label="Edit Profile" />
            <Button variant="destructive" label="Logout" onPress={handleLogout} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
