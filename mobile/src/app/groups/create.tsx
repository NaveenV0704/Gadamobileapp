import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Info, Globe, Shield, Users } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  fetchGroupCategories,
  createGroup,
} from "../../services/groupsService";
import { Button } from "../../components/ui/Button";

export default function GroupCreate() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    group_name: "",
    group_title: "",
    group_privacy: "public",
    group_category: "",
    group_country: "",
    group_description: "",
  });
  const [busy, setBusy] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetchGroupCategories(headersRef.current)
      .then(setCats)
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [accessToken]);

  const onSubmit = async () => {
    const { group_name, group_title, group_category, group_country } = form;
    if (!group_name || !group_title || !group_category || !group_country) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields (Handle, Title, Category, Country ID).",
      );
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await createGroup(
        {
          ...form,
          group_category: Number(form.group_category),
          group_country: Number(form.group_country),
        },
        headersRef.current,
      );
      Alert.alert("Success", "Group created successfully!");
      router.replace(`/groups/${form.group_name}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Failed to create group");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Create a Group</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-700 mb-2 flex-row items-center">
              <Info size={16} color="#4B5563" /> Group Information
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                  Handle (Username)
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="e.g. my-awesome-group"
                  autoCapitalize="none"
                  value={form.group_name}
                  onChangeText={(text) =>
                    setForm({ ...form, group_name: text })
                  }
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                  Group Title
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="The name of your group"
                  value={form.group_title}
                  onChangeText={(text) =>
                    setForm({ ...form, group_title: text })
                  }
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                    Privacy
                  </Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="p-2"
                    >
                      {["public", "closed", "secret"].map((p) => (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setForm({ ...form, group_privacy: p })}
                          className={`px-4 py-2 rounded-full mr-2 border ${
                            form.group_privacy === p
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium capitalize ${
                              form.group_privacy === p
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                  Category
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  {loadingCats ? (
                    <View className="py-3 items-center">
                      <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="p-2"
                    >
                      {cats.map((c) => (
                        <TouchableOpacity
                          key={c.category_id}
                          onPress={() =>
                            setForm({
                              ...form,
                              group_category: String(c.category_id),
                            })
                          }
                          className={`px-4 py-2 rounded-full mr-2 border ${
                            form.group_category === String(c.category_id)
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              form.group_category === String(c.category_id)
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {c.category_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>

              <View>
                <Text className="text-sm font-bold text-gray-700 mb-2 mt-2 flex-row items-center">
                  <Globe size={16} color="#4B5563" /> Location & Description
                </Text>

                <View className="mb-4">
                  <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                    Country ID (Numeric)
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="e.g. 1"
                    keyboardType="numeric"
                    value={form.group_country}
                    onChangeText={(text) =>
                      setForm({ ...form, group_country: text })
                    }
                  />
                </View>

                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                    Description
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
                    placeholder="Tell people what your group is about..."
                    multiline
                    textAlignVertical="top"
                    value={form.group_description}
                    onChangeText={(text) =>
                      setForm({ ...form, group_description: text })
                    }
                  />
                </View>
              </View>
            </View>
          </View>

          <View className="mb-20">
            <Button
              onPress={onSubmit}
              disabled={busy}
              className={`rounded-xl ${busy ? "opacity-70" : ""}`}
              size="lg"
              label={busy ? "Creating Group..." : "Create Group"}
              textClassName="font-bold text-base"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
