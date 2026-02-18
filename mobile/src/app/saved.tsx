import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import SavedPostCard from "../components/SavedPostCard";

export default function Saved() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 py-4 bg-white">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Saved</Text>
      </View>

      <View className="flex-1" style={{ backgroundColor: '#8e4de0' }}>
        <ScrollView>
          <View className="mx-4 my-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <Text className="text-2xl font-extrabold text-gray-900 mb-2">Saved Posts</Text>
            <Text className="text-sm text-gray-600">All the posts you've saved for later</Text>
          </View>

          {/* Sample saved post card (matches post style) */}
          <View className="mx-4 mb-6">
            <SavedPostCard />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
