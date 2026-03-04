import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import {
  createLivePost,
  startLive,
  type StartLiveResp,
} from "../services/liveService";
import { CameraView, useCameraPermissions } from "expo-camera";

type Props = {
  visible: boolean;
  onClose: () => void;
  onStarted?: (live: StartLiveResp) => void;
};

export function LiveModal({ visible, onClose, onStarted }: Props) {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "only_me">(
    "public",
  );
  const [busy, setBusy] = useState(false);
  const [thumb, setThumb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const camRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;
    if (!permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setError(null);
      const createdPostId = await createLivePost(
        { type: "live", text: title || "Live", privacy, userId: user?.id },
        headers,
      );

      const agoraUid = Number(user?.id ?? Date.now());
      const channelName = `live_${agoraUid}_${Date.now()}`;

      let thumbnailDataUrl: string | null | undefined = null;
      const val = thumb.trim();
      if (val.startsWith("data:image")) {
        thumbnailDataUrl = val;
      } else if (val.length > 0) {
        thumbnailDataUrl = undefined;
      } else if (camRef.current) {
        const pic = await camRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
          skipProcessing: true,
        });
        if (pic?.base64)
          thumbnailDataUrl = `data:image/jpeg;base64,${pic.base64}`;
      }

      const started = await startLive(
        {
          postId: createdPostId,
          channelName,
          agoraUid,
          thumbnailDataUrl: thumbnailDataUrl ?? null,
        },
        headers,
      );

      onStarted?.(started);
      onClose();
    } catch (e) {
      const msg =
        typeof (e as any)?.message === "string"
          ? (e as any).message
          : "Could not start live";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="w-full max-w-md bg-white rounded-2xl p-4">
          <Text className="text-lg font-semibold mb-3">Go Live</Text>

          {error ? (
            <View className="mb-2">
              <Text className="text-red-600 text-xs">{error}</Text>
            </View>
          ) : null}

          <View
            className="mb-3 rounded-md overflow-hidden bg-black"
            style={{ height: 220 }}
          >
            {permission?.granted ? (
              <CameraView
                ref={(r) => {
                  camRef.current = r;
                }}
                style={{ flex: 1 }}
                facing={facing}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <TouchableOpacity
                  onPress={requestPermission}
                  className="px-4 py-2 rounded-md bg-blue-600"
                >
                  <Text className="text-white text-sm">
                    Enable camera preview
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="My live…"
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Privacy</Text>
            <View className="flex-row">
              {(["public", "friends", "only_me"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setPrivacy(opt)}
                  className={`px-3 py-2 mr-2 rounded-md border ${
                    privacy === opt
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={
                      privacy === opt
                        ? "text-white text-xs"
                        : "text-gray-700 text-xs"
                    }
                  >
                    {opt.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-1">
            <Text className="text-xs text-gray-600 mb-1">
              Thumbnail (optional URL/dataURL — leave blank to auto-capture)
            </Text>
            <TextInput
              value={thumb}
              onChangeText={setThumb}
              placeholder="/uploads/.../thumb.png or data:image/png;base64,…"
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </View>

          <View className="flex-row justify-end mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 mr-2 rounded-md border border-gray-300"
            >
              <Text className="text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStart}
              disabled={busy}
              className={`px-4 py-2 rounded-md ${busy ? "bg-blue-300" : "bg-blue-600"}`}
            >
              {busy ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white ml-2">Starting…</Text>
                </View>
              ) : (
                <Text className="text-white">Start Live</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
