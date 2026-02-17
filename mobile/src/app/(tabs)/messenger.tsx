import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "../../hooks/useAuthHeader";
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Camera,
} from "lucide-react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
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
  const uploadHeaders = useAuthHeaderupload(accessToken);

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
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const [callKind, setCallKind] = useState<"audio" | "video">("audio");
  const [callId, setCallId] = useState<number | null>(null);
  const [callBusy, setCallBusy] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>("front");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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

        const next = data?.nextCursor ?? null;
        if (!next || items.length === 0) {
          setMsgCursor(null);
          setMsgDone(true);
        } else {
          setMsgCursor(next);
          setMsgDone(false);
        }
      } catch (e) {
        setMsgError("Failed to load messages");
      } finally {
        setMsgLoading(false);
      }
    },
    [accessToken, headers, msgLoading],
  );

  const extractMeta = (rawText: string) => {
    if (!rawText?.startsWith("::meta::")) return null;

    const endIndex = rawText.indexOf("::/meta::");
    if (endIndex === -1) return null;

    const jsonPart = rawText.replace("::meta::", "").split("::/meta::")[0];

    try {
      return JSON.parse(jsonPart);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!activeId) return;

    fetch(`${API_BASE_URL}/api/messenger/conversations/${activeId}/seen`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({}),
    }).catch(() => {});
  }, [activeId, headers]);

  const sendTyping = async (typing: boolean) => {
    if (!activeId) return;
    typingRef.current = typing;
    try {
      await fetch(
        `${API_BASE_URL}/api/messenger/conversations/${activeId}/typing`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ typing }),
        },
      );
    } catch {}
  };

  const extractPlainText = (rawText: string) => {
    if (!rawText?.startsWith("::meta::")) return rawText;

    const afterMeta = rawText.split("::/meta::")[1] || "";
    return afterMeta.trim();
  };

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
          headers: uploadHeaders,
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
    if (!activeId) return;
    if (!text.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingRef.current) {
        void sendTyping(false);
      }
      return;
    }

    if (!typingRef.current) {
      void sendTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (typingRef.current) {
        void sendTyping(false);
      }
    }, 900) as unknown as number;
  }, [text, activeId]);

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

  const handleStartCall = async (kind: "audio" | "video") => {
    if (!activeConversation || !accessToken) return;
    if (callBusy) return;
    try {
      setCallBusy(true);
      setCallKind(kind);
      setMuted(false);
      setCamOff(kind === "audio");
      if (kind === "video") {
        const perm =
          cameraPermission && cameraPermission.granted
            ? cameraPermission
            : await requestCameraPermission();
        if (!perm?.granted) {
          setCamOff(true);
        }
      }
      const res = await fetch(`${API_BASE_URL}/api/messenger/call/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: activeConversation.conversationId,
          toUserId: activeConversation.peer.id,
          type: kind,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to start call");
      }
      const data = await res.json();
      setCallId(data?.callId ?? null);
      setCallVisible(true);
    } catch (e) {
    } finally {
      setCallBusy(false);
    }
  };

  const handleEndCall = async (declined = false) => {
    if (!callId || !accessToken) {
      setCallVisible(false);
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/api/messenger/call/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
        body: JSON.stringify({
          callId,
          type: callKind,
          declined,
        }),
      });
    } catch (e) {
    } finally {
      setCallId(null);
      setCallVisible(false);
    }
  };

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
                    {(() => {
                      const meta = extractMeta(item.lastText || "");
                      if (meta?.kind === "story_reply") {
                        return "📸 Replied to your story";
                      }
                      return extractPlainText(item.lastText || "");
                    })()}
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
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-gray-900"
                    numberOfLines={1}
                  >
                    {activeConversation.peer.fullName ||
                      activeConversation.peer.username}
                  </Text>
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    @{activeConversation.peer.username}
                  </Text>
                </View>
                <View className="ml-auto flex-row items-center">
                  <TouchableOpacity
                    onPress={() => handleStartCall("audio")}
                    disabled={callBusy}
                    className="mr-3"
                  >
                    <Phone size={18} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStartCall("video")}
                    disabled={callBusy}
                    className="mr-1"
                  >
                    <Video size={18} color="#111827" />
                  </TouchableOpacity>
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
                            {(() => {
                              const meta = extractMeta(item.text);
                              const plain = extractPlainText(item.text);

                              if (meta?.kind === "story_reply") {
                                return (
                                  <View>
                                    <Text
                                      className={`text-xs mb-1 ${
                                        isMine
                                          ? "text-white/70"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      Replied to a story
                                    </Text>

                                    {meta.story_preview_url && (
                                      <Image
                                        source={{ uri: meta.story_preview_url }}
                                        style={{
                                          width: 120,
                                          height: 120,
                                          borderRadius: 10,
                                          marginBottom: 6,
                                        }}
                                        resizeMode="cover"
                                      />
                                    )}

                                    {meta.reply?.emoji_code && (
                                      <Text style={{ fontSize: 24 }}>
                                        {
                                          ["👍", "❤️", "😂", "😲", "😢", "😡"][
                                            meta.reply.emoji_code - 1
                                          ]
                                        }
                                      </Text>
                                    )}

                                    {meta.reply?.text && (
                                      <Text
                                        className={
                                          isMine
                                            ? "text-white"
                                            : "text-gray-900"
                                        }
                                      >
                                        {meta.reply.text}
                                      </Text>
                                    )}

                                    {plain ? (
                                      <Text
                                        className={
                                          isMine
                                            ? "text-white"
                                            : "text-gray-900"
                                        }
                                      >
                                        {plain}
                                      </Text>
                                    ) : null}
                                  </View>
                                );
                              }

                              return (
                                <Text
                                  className={`text-sm ${
                                    isMine ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {plain}
                                </Text>
                              );
                            })()}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  ListFooterComponent={
                    messages &&
                    messages.length >= 20 &&
                    msgCursor &&
                    !msgDone ? (
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

      {activeConversation && (
        <Modal
          visible={callVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => handleEndCall(false)}
        >
          <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 items-center justify-center px-8">
              <View className="items-center mb-10">
                <View className="h-28 w-28 rounded-full bg-gray-200 items-center justify-center mb-4">
                  <Text className="text-3xl font-semibold text-gray-700">
                    {(
                      activeConversation.peer.fullName ||
                      activeConversation.peer.username ||
                      "?"
                    )
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text className="text-white text-xl font-semibold">
                  {activeConversation.peer.fullName ||
                    activeConversation.peer.username}
                </Text>
                <Text className="text-gray-300 text-sm mt-2">
                  {callKind === "video" ? "Video call" : "Audio call"}
                </Text>
              </View>

              {callKind === "video" && (
                <View className="w-full aspect-[3/4] bg-gray-900 rounded-3xl border border-gray-700 overflow-hidden items-center justify-center">
                  {!cameraPermission ? (
                    <Text className="text-gray-400 text-xs px-4 text-center">
                      Requesting camera permission
                    </Text>
                  ) : !cameraPermission.granted || camOff ? (
                    <View className="items-center">
                      <VideoOff size={40} color="#4B5563" />
                      <Text className="text-gray-400 text-xs px-4 text-center mt-3">
                        Camera is off
                      </Text>
                    </View>
                  ) : (
                    <CameraView
                      style={{ width: "100%", height: "100%" }}
                      facing={cameraType}
                    />
                  )}
                </View>
              )}
            </View>

            <View className="pb-10 flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => setMuted((m) => !m)}
                className="h-14 w-14 rounded-full bg-gray-700 items-center justify-center mx-4"
              >
                {muted ? (
                  <MicOff size={24} color="#ffffff" />
                ) : (
                  <Mic size={24} color="#ffffff" />
                )}
              </TouchableOpacity>

              {callKind === "video" && (
                <>
                  <TouchableOpacity
                    onPress={() => setCamOff((c) => !c)}
                    className="h-14 w-14 rounded-full bg-gray-700 items-center justify-center mx-4"
                  >
                    {camOff ? (
                      <VideoOff size={24} color="#ffffff" />
                    ) : (
                      <Video size={24} color="#ffffff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setCameraType((c) => (c === "front" ? "back" : "front"))
                    }
                    className="h-14 w-14 rounded-full bg-gray-700 items-center justify-center mx-4"
                  >
                    <Camera size={24} color="#ffffff" />
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                onPress={() => handleEndCall(false)}
                className="h-16 w-16 rounded-full bg-red-500 items-center justify-center mx-4"
              >
                <PhoneOff size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
