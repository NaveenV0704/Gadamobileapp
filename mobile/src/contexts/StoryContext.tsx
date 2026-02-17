import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { Story } from "../types";
import {
  fetchStories,
  uploadStory,
  addTextStory as apiAddTextStory,
  StoryMeta,
} from "../services/storyService";
import { useAuth } from "./AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "../hooks/useAuthHeader";

type TextStoryMeta = {
  text: string;
  bg?: string;
  color?: string;
  overlays?: any[] | null;
  musicUrl?: string | null;
  musicVolume?: number | null;
};

interface StoryContextType {
  stories: Story[];
  isLoading: boolean;
  refreshStories: () => Promise<void>;
  addStory: (
    file: { uri: string; name?: string; type?: string },
    meta: StoryMeta,
  ) => Promise<void>;
  addTextStory: (meta: TextStoryMeta) => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export function StoryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessToken, logout, user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const authHeader = useAuthHeader(accessToken);
  const uploadHeader = useAuthHeaderupload(accessToken);

  const loadStories = async () => {
    if (!accessToken) return;
    try {
      const data = await fetchStories(authHeader);
      setStories(data);
    } catch (error) {
      const msg = String(
        (error as any)?.message ?? (error as any) ?? "Unknown error",
      );
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        await logout();
        Alert.alert("Session expired", "Please sign in again.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else if (
        msg.includes("429") ||
        msg.toLowerCase().includes("too many requests")
      ) {
        console.warn("Stories request rate limited, keeping existing list");
      } else {
        console.error("Failed to load stories", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();

    // Auto refresh every 60 seconds (same as web)
    const intervalId = setInterval(() => {
      if (accessToken) {
        fetchStories(authHeader)
          .then(setStories)
          .catch((err) => console.warn("Background story fetch failed", err));
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [accessToken, authHeader]);

  const addStory = async (
    file: { uri: string; name?: string; type?: string },
    meta: StoryMeta,
  ) => {
    if (!accessToken || !user) return;
    try {
      const data: any = await uploadStory(file, meta, uploadHeader);

      const url: string = data?.url || "";
      const type: "image" | "video" =
        data?.type ||
        (file.type && file.type.startsWith("video") ? "video" : "image");
      const savedMeta: any = data?.meta || meta || {};

      const newItem: any = {
        id: String(data?.id ?? Date.now()),
        type,
        url,
        meta: savedMeta,
        created_at: data?.created_at,
      };

      const uid = String((user as any)?.id ?? (user as any)?.userId);
      const uname =
        (user as any)?.username ||
        (user as any)?.user_name ||
        (user as any)?.name ||
        "You";
      const uavatar =
        (user as any)?.profileImage ||
        (user as any)?.user_picture ||
        "/uploads//profile/defaultavatar.png";

      setStories((prev) => {
        const arr = [...prev];
        const idx = arr.findIndex(
          (g) => String((g as any).userId) === String(uid),
        );
        if (idx >= 0) {
          arr[idx] = {
            ...arr[idx],
            stories: [...arr[idx].stories, newItem],
          };
          const [mine] = arr.splice(idx, 1);
          arr.unshift(mine);
          return arr;
        }
        return [
          { userId: uid, username: uname, avatar: uavatar, stories: [newItem] },
          ...arr,
        ];
      });
    } catch (error) {
      Alert.alert("Error", "Failed to publish story.");
    }
  };

  const addTextStory = async (meta: TextStoryMeta) => {
    if (!accessToken || !user) return;
    const payload = {
      text: (meta.text || "").trim(),
      bg: meta.bg ?? "#111111",
      color: meta.color ?? "#ffffff",
      overlays: meta.overlays ?? null,
      music_url: meta.musicUrl ?? null,
      music_volume:
        typeof meta.musicVolume === "number" ? meta.musicVolume : null,
    };
    try {
      const res: any = await apiAddTextStory(payload, authHeader);
      const item = res?.item || {};

      const newItem: any = {
        id: String(item.id ?? Date.now()),
        type: "text",
        url: "",
        meta:
          item.meta ||
          ({
            text: payload.text,
            bg: payload.bg,
            color: payload.color,
            overlays: payload.overlays,
            musicUrl: payload.music_url,
            musicVolume: payload.music_volume,
          } as any),
        created_at: item.created_at,
      };

      const uid = Number(
        (user as any)?.userId ?? (user as any)?.id ?? (user as any)?._id,
      );
      const uname =
        (user as any)?.user_name ||
        (user as any)?.username ||
        (user as any)?.name ||
        "You";
      const uavatar =
        (user as any)?.user_profile_picture ||
        (user as any)?.profileImage ||
        (user as any)?.avatar ||
        "/uploads//profile/defaultavatar.png";

      setStories((prev) => {
        const arr = [...prev];
        const idx = arr.findIndex((g) => Number((g as any).userId) === uid);
        if (idx >= 0) {
          arr[idx] = {
            ...arr[idx],
            stories: [...arr[idx].stories, newItem],
          };
          const [mine] = arr.splice(idx, 1);
          arr.unshift(mine);
          return arr;
        }
        return [
          {
            userId: String(uid),
            username: uname,
            avatar: uavatar,
            stories: [newItem],
          },
          ...arr,
        ];
      });
    } catch (error) {
      Alert.alert("Error", "Failed to publish story.");
    }
  };

  return (
    <StoryContext.Provider
      value={{
        stories,
        isLoading,
        refreshStories: loadStories,
        addStory,
        addTextStory,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStories() {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error("useStories must be used within a StoryProvider");
  }
  return context;
}
