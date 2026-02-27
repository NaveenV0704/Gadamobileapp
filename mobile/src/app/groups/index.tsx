import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Plus, Filter, Users, Inbox, Shield } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { fetchGroupCategories, listGroups, listMyGroupInvites } from "../../services/groupsService";
import { API_BASE_URL, ASSET_BASE_URL } from "../../constants/config";

export default function GroupsIndex() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sort, setSort] = useState<"recent" | "popular">("popular");
  const [myOnly, setMyOnly] = useState(false);

  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState(false);
  const [invCount, setInvCount] = useState(0);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchGroupCategories(headersRef.current).then(setCats).catch(console.error);
    listMyGroupInvites(headersRef.current)
      .then((arr) => setInvCount(arr.length))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadMore(true);
  }, [q, categoryId, sort, myOnly, accessToken]);

  const loadMore = async (reset = false) => {
    if (loading) return;
    if (!reset && done) return;

    setLoading(true);
    try {
      const { items: groupItems = [], nextCursor } = await listGroups(
        {
          q: q.trim(),
          categoryId: categoryId || undefined,
          sort,
          my: myOnly ? 1 : undefined,
          cursor: reset ? undefined : cursor,
          limit: 12,
        },
        headersRef.current
      );

      if (reset) {
        setItems(groupItems);
      } else {
        setItems((prev) => [...prev, ...groupItems]);
      }

      setCursor(nextCursor ?? null);
      if (!nextCursor || groupItems.length === 0) setDone(true);
      else setDone(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMore(true);
  };

  const renderGroupItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/groups/${item.group_name}`)}
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
    >
      <View className="h-28 bg-gray-200">
        {item.group_cover && (
          <Image
            source={{ uri: `${ASSET_BASE_URL}/${item.group_cover.replace(/^\/+/, "")}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
      </View>
      <View className="p-3 flex-row items-center">
        <View className="h-14 w-14 rounded-xl bg-gray-300 border-2 border-white -mt-10 overflow-hidden shadow-sm">
          {item.group_picture && (
            <Image
              source={{ uri: `${ASSET_BASE_URL}/${item.group_picture.replace(/^\/+/, "")}` }}
              className="w-full h-full"
            />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
            {item.group_title}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-xs">@{item.group_name}</Text>
            <View className="mx-1 h-1 w-1 rounded-full bg-gray-300" />
            <Text className="text-gray-500 text-xs capitalize">{item.group_privacy}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-blue-600 font-semibold text-xs">{item.group_members} members</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Groups</Text>
          <Text className="text-xs text-gray-500">Find your community</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push("/groups/invites")}
            className="p-2 mr-2 relative"
          >
            <Inbox size={22} color="#4B5563" />
            {invCount > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                <Text className="text-[10px] text-white font-bold">{invCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/groups/create")}
            className="bg-blue-600 px-4 py-2 rounded-full shadow-md flex-row items-center"
          >
            <Plus size={18} color="#ffffff" />
            <Text className="text-white font-bold ml-1 text-xs">Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-4 flex-1">
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm mb-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholder="Search groups..."
            value={q}
            onChangeText={setQ}
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="ml-2">
            <Filter size={20} color={showFilters ? "#2563EB" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-3">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity
                onPress={() => setCategoryId(null)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  categoryId === null ? "bg-blue-600" : "bg-gray-100"
                }`}
              >
                <Text className={`text-xs ${categoryId === null ? "text-white" : "text-gray-600"}`}>
                  All
                </Text>
              </TouchableOpacity>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.category_id}
                  onPress={() => setCategoryId(c.category_id)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    categoryId === c.category_id ? "bg-blue-600" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      categoryId === c.category_id ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {c.category_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="flex-row items-center justify-between">
              <View className="flex-row bg-gray-100 rounded-lg p-1">
                <TouchableOpacity
                  onPress={() => setSort("popular")}
                  className={`px-3 py-1.5 rounded-md ${
                    sort === "popular" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      sort === "popular" ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    Popular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSort("recent")}
                  className={`px-3 py-1.5 rounded-md ${
                    sort === "recent" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      sort === "recent" ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    Recent
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setMyOnly(!myOnly)}
                className={`flex-row items-center px-3 py-1.5 rounded-lg border ${
                  myOnly ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                }`}
              >
                <Users size={14} color={myOnly ? "#2563EB" : "#6B7280"} />
                <Text
                  className={`text-xs ml-1.5 font-medium ${
                    myOnly ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  Your Groups
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={items}
          renderItem={renderGroupItem}
          keyExtractor={(item) => String(item.group_id || item.groupId)}
          onEndReached={() => loadMore()}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View className="items-center justify-center py-20">
                <Text className="text-gray-400">No groups found</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading && !refreshing ? (
              <ActivityIndicator size="small" color="#2563EB" className="py-4" />
            ) : (
              <View className="h-40" />
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
        />
      </View>
    </SafeAreaView>
  );
}
