import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Friends() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-blue-600">Friends</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-500 text-center mt-10">No friends yet.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
