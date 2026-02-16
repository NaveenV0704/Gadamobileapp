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
import { fetchStories } from "../services/storyService";
import { useAuth } from "./AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";

interface StoryContextType {
  stories: Story[];
  isLoading: boolean;
  refreshStories: () => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export function StoryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessToken, logout } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize headers to prevent infinite loop in useEffect
  const authHeader = useAuthHeader(accessToken);

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

  return (
    <StoryContext.Provider
      value={{
        stories,
        isLoading,
        refreshStories: loadStories,
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
