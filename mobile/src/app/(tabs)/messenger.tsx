import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Messenger() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Text className="text-lg font-semibold">Messenger</Text>
      <Text className="text-gray-500">Coming Soon</Text>
    </SafeAreaView>
  );
}
