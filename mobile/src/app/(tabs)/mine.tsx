import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Rocket, ArrowLeft } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { useRouter, useLocalSearchParams } from "expo-router";
 

export default function MineComingSoon() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const section = typeof params.section === "string" ? params.section : undefined;
  const title =
    section === "popular"
      ? "Popular"
      : section === "offers"
      ? "My Offers"
      : section === "blogs"
      ? "My Blogs"
      : section === "scheduled"
      ? "Scheduled"
      : section === "packages"
      ? "Packages"
      : section === "affiliates"
      ? "Affiliates"
      : section === "ads"
      ? "Ads Manager"
      : "Mine";
 

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200 bg-white">
          <Text className="text-xl font-bold text-gray-900">{title}</Text>
        </View>
        {
          <View className="px-4 pt-4">
            <View className="bg-white rounded-2xl overflow-hidden border border-purple-200">
              <View
                className="rounded-2xl px-4 py-5"
                style={{ backgroundColor: "#7b47d6" }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "#9b69ff" }}
                  >
                    <Rocket size={20} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xl font-bold">
                      Something exciting is on the way
                    </Text>
                    <Text className="text-white/90 mt-1">
                      We're polishing the last bits. Stay tuned!
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        }

        <View className="px-4 py-4">
          <View className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-3">
            <View className="flex-row items-center">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: "#F59E0B",
                  marginRight: 8,
                }}
              />
              <Text className="text-gray-800">Launching soon</Text>
            </View>
          </View>

          <View className="mt-4">
            <Button
              className="flex-row items-center self-start bg-[#1877F2]"
              onPress={() => router.replace("/(tabs)")}
            >
              <ArrowLeft size={18} color="#ffffff" />
              <Text className="text-white font-medium">Back to feed</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
