import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
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
  const { accessToken } = useAuth();
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
      console.error("Failed to load stories", error);
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
