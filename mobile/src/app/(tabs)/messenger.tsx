import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader } from "../../hooks/useAuthHeader";
import { API_BASE_URL } from "../../constants/config";

type Peer = {
  id: number;
  username: string;
  fullName?: string;
  avatar?: string | null;
};

type Conversation = {
  conversationId: number;
  peer: Peer;
  lastText?: string | null;
  lastTime?: string | null;
  unread?: number;
};

type Message = {
  id: number;
  authorId: number;
  text: string;
  image: string | null;
  voice: string | null;
  time: string;
};

export default function Messenger() {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [msgCursor, setMsgCursor] = useState<number | null>(null);
  const [msgDone, setMsgDone] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !conversations) return conversations || [];
    return conversations.filter((c) => {
      const name = (c.peer.fullName || c.peer.username || "").toLowerCase();
      const last = (c.lastText || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [search, conversations]);

  const fetchConversationsApi = useCallback(async () => {
    if (!accessToken) return;
    setConvLoading(true);
    setConvError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/messenger/conversations`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }
      const data = await res.json();
      const list: Conversation[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];
      setConversations(list);
      if (!activeId && list.length > 0) {
        setActiveId(list[0].conversationId);
      }
    } catch (e) {
      setConvError("Failed to load conversations");
    } finally {
      setConvLoading(false);
    }
  }, [accessToken, headers, activeId]);

  const fetchMessagesApi = useCallback(
    async (conversationId: number, cursor?: number | null) => {
      if (!accessToken) return;
      if (msgLoading) return;
      setMsgLoading(true);
      setMsgError(null);
      try {
        const qs = new URLSearchParams();
        if (cursor) qs.set("cursor", String(cursor));
        qs.set("limit", "20");
        const res = await fetch(
          `${API_BASE_URL}/api/messenger/conversations/${conversationId}/messages?${qs.toString()}`,
          {
            headers,
            credentials: "include",
          },
        );
        if (!res.ok) {
          throw new Error("Failed to load messages");
        }
        const data = await res.json();
        const items: Message[] = Array.isArray(data?.items) ? data.items : [];
        setMessages((prev) => (cursor ? [...(prev || []), ...items] : items));
        setMsgCursor(data?.nextCursor ?? null);
        setMsgDone(!data?.nextCursor);
      } catch (e) {
        setMsgError("Failed to load messages");
      } finally {
        setMsgLoading(false);
      }
    },
    [accessToken, headers, msgLoading],
  );

  const handleSelectConversation = (c: Conversation) => {
    if (c.conversationId === activeId) return;
    setActiveId(c.conversationId);
    setMessages(null);
    setMsgCursor(null);
    setMsgDone(false);
    void fetchMessagesApi(c.conversationId, null);
  };

  const handleSend = async () => {
    if (!accessToken || !activeId) return;
    const body = text.trim();
    if (!body || sending) return;
    try {
      setSending(true);
      const fd = new FormData();
      fd.append("message", body);
      const res = await fetch(
        `${API_BASE_URL}/api/messenger/conversations/${activeId}/messages`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: fd as any,
        },
      );
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      const msg: Message = await res.json();
      setMessages((prev) => (prev ? [...prev, msg] : [msg]));
      setText("");
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void fetchConversationsApi();
  }, [fetchConversationsApi]);

  useEffect(() => {
    if (!activeId) return;
    if (messages === null && !msgLoading) {
      void fetchMessagesApi(activeId, null);
    }
  }, [activeId, messages, msgLoading, fetchMessagesApi]);

  const activeConversation = useMemo(
    () => conversations?.find((c) => c.conversationId === activeId) || null,
    [conversations, activeId],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 flex-row">
        {/* Left panel: conversations */}
        <View className="w-2/5 border-r border-gray-200">
          <View className="px-3 py-2 border-b border-gray-200">
            <Text className="text-lg font-semibold">Messages</Text>
            <View className="mt-2 flex-row items-center bg-gray-100 rounded-full px-3">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search messages"
                className="flex-1 text-sm"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {convLoading && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color="#1877F2" />
            </View>
          )}

          {convError && !convLoading && (
            <View className="p-3">
              <Text className="text-sm text-red-600">{convError}</Text>
            </View>
          )}

          {!convLoading && conversations && conversations.length === 0 && (
            <View className="p-3">
              <Text className="text-sm text-gray-500">
                No conversations yet
              </Text>
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.conversationId)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectConversation(item)}
                className={`px-3 py-2 flex-row items-center ${
                  item.conversationId === activeId ? "bg-blue-50" : "bg-white"
                }`}
              >
                <View className="h-10 w-10 rounded-full bg-gray-300 mr-3 items-center justify-center">
                  <Text className="text-sm font-semibold text-white">
                    {(item.peer.fullName || item.peer.username || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-medium text-gray-900"
                  >
                    {item.peer.fullName || item.peer.username}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-gray-500">
                    {item.lastText || " "}
                  </Text>
                </View>
                {!!item.unread && (
                  <View className="ml-2 px-2 py-1 rounded-full bg-[#1877F2]">
                    <Text className="text-[11px] text-white">
                      {item.unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Right panel: messages */}
        <View className="flex-1">
          {!activeConversation && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500">
                Select a conversation to start chatting
              </Text>
            </View>
          )}

          {activeConversation && (
            <View className="flex-1">
              <View className="px-3 py-2 border-b border-gray-200 flex-row items-center">
                <View className="h-9 w-9 rounded-full bg-gray-300 mr-3 items-center justify-center">
                  <Text className="text-sm font-semibold text-white">
                    {(
                      activeConversation.peer.fullName ||
                      activeConversation.peer.username ||
                      "?"
                    )
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-semibold text-gray-900">
                    {activeConversation.peer.fullName ||
                      activeConversation.peer.username}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    @{activeConversation.peer.username}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                {msgLoading && !messages && (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="small" color="#1877F2" />
                  </View>
                )}

                {msgError && (
                  <View className="p-3">
                    <Text className="text-sm text-red-600">{msgError}</Text>
                  </View>
                )}

                <FlatList
                  data={messages || []}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ padding: 12 }}
                  renderItem={({ item }) => {
                    const isMine = item.authorId === user?.id;
                    return (
                      <View
                        className={`mb-2 flex-row ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <View
                          className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                            isMine
                              ? "bg-[#1877F2] rounded-br-sm"
                              : "bg-gray-200 rounded-bl-sm"
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              isMine ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {item.text}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  ListFooterComponent={
                    msgCursor && !msgDone ? (
                      <TouchableOpacity
                        onPress={() =>
                          activeId &&
                          !msgLoading &&
                          fetchMessagesApi(activeId, msgCursor)
                        }
                        className="py-2 items-center"
                      >
                        {msgLoading ? (
                          <ActivityIndicator size="small" color="#1877F2" />
                        ) : (
                          <Text className="text-xs text-gray-500">
                            Load more
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null
                  }
                />
              </View>

              <View className="border-t border-gray-200 px-3 py-2">
                <View className="flex-row items-center bg-gray-100 rounded-full px-3">
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message"
                    className="flex-1 text-sm"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={sending || !text.trim()}
                    className="ml-2 px-3 py-1 rounded-full bg-[#1877F2] active:opacity-80"
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">
                        Send
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
