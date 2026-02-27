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
import { ChevronLeft, Info, Globe, Tag } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { fetchCategories, createPage } from "../../services/pagesService";
import { Button } from "../../components/ui/Button";

export default function PageCreate() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    page_name: "",
    page_title: "",
    page_category: "",
    page_country: "",
    page_description: "",
  });
  const [busy, setBusy] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetchCategories(headersRef.current)
      .then(setCats)
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [accessToken]);

  const onSubmit = async () => {
    if (
      !form.page_name ||
      !form.page_title ||
      !form.page_category ||
      !form.page_country
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields (Handle, Title, Category, Country ID).",
      );
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await createPage(
        {
          ...form,
          page_category: Number(form.page_category),
          page_country: Number(form.page_country),
        },
        headersRef.current,
      );
      Alert.alert("Success", "Page created successfully!");
      router.replace(`/pages/${form.page_name}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Failed to create page");
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
        <Text className="text-xl font-bold text-gray-900">Create a Page</Text>
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
              <Info size={16} color="#4B5563" /> Page Information
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                  Handle (Username)
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="e.g. my-awesome-page"
                  autoCapitalize="none"
                  value={form.page_name}
                  onChangeText={(text) => setForm({ ...form, page_name: text })}
                />
                <Text className="text-[10px] text-gray-400 mt-1 ml-1">
                  This will be your page's URL handle. Use letters, numbers, and
                  hyphens.
                </Text>
              </View>

              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                  Page Title
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="The name of your page"
                  value={form.page_title}
                  onChangeText={(text) =>
                    setForm({ ...form, page_title: text })
                  }
                />
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
                              page_category: String(c.category_id),
                            })
                          }
                          className={`px-4 py-2 rounded-full mr-2 border ${
                            form.page_category === String(c.category_id)
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              form.page_category === String(c.category_id)
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
                    value={form.page_country}
                    onChangeText={(text) =>
                      setForm({ ...form, page_country: text })
                    }
                  />
                </View>

                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1 ml-1">
                    Description
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
                    placeholder="Tell people what your page is about..."
                    multiline
                    textAlignVertical="top"
                    value={form.page_description}
                    onChangeText={(text) =>
                      setForm({ ...form, page_description: text })
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
              className="rounded-xl"
              size="lg"
              label={busy ? "Creating Page..." : "Create Page"}
              textClassName="font-bold text-base"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
