import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Inbox, Check, X } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import {
  listMyInvites,
  acceptInvite,
  declineInvite,
} from "../../services/pagesService";
import { API_BASE_URL, ASSET_BASE_URL } from "../../constants/config";

export default function PagesInvites() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchInvites = async () => {
    if (!accessToken) return;
    try {
      const data = await listMyInvites(headersRef.current);
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvites();
  };

  const handleAccept = async (pageName: string, inviteId: number) => {
    setBusyId(inviteId);
    try {
      await acceptInvite(pageName, inviteId, headersRef.current);
      Alert.alert("Success", "You have joined the page!");
      fetchInvites();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept invite");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (pageName: string, inviteId: number) => {
    setBusyId(inviteId);
    try {
      await declineInvite(pageName, inviteId, headersRef.current);
      fetchInvites();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to decline invite");
    } finally {
      setBusyId(null);
    }
  };

  const renderInviteItem = ({ item }: { item: any }) => (
    <View className="bg-white p-4 mb-2 flex-row items-center border-b border-gray-100">
      <TouchableOpacity
        onPress={() => router.push(`/pages/${item.page_name}`)}
        className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden"
      >
        {item.page_picture && (
          <Image
            source={{
              uri: `${ASSET_BASE_URL}/${item.page_picture.replace(/^\/+/, "")}`,
            }}
            className="w-full h-full"
          />
        )}
      </TouchableOpacity>

      <View className="ml-3 flex-1">
        <TouchableOpacity
          onPress={() => router.push(`/pages/${item.page_name}`)}
        >
          <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
            {item.page_title}
          </Text>
        </TouchableOpacity>
        <Text className="text-gray-500 text-xs" numberOfLines={1}>
          @{item.page_name} • invited by {item.fromUsername}
        </Text>
      </View>

      <View className="flex-row items-center ml-2">
        <TouchableOpacity
          onPress={() => handleAccept(item.page_name, item.inviteId)}
          disabled={busyId === item.inviteId}
          className="bg-blue-600 px-3 py-1.5 rounded-lg mr-2 flex-row items-center"
        >
          {busyId === item.inviteId ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Check size={14} color="#ffffff" />
              <Text className="text-white text-xs font-bold ml-1">Join</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDecline(item.page_name, item.inviteId)}
          disabled={busyId === item.inviteId}
          className="bg-gray-100 p-2 rounded-lg"
        >
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Page Invites</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderInviteItem}
        keyExtractor={(item) => String(item.inviteId)}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20 px-10">
              <Inbox size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4 text-center font-medium">
                No pending invites at the moment.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="small" color="#2563EB" className="py-10" />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
