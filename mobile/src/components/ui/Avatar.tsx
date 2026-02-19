import React, { useState } from "react";
import { View, Image } from "react-native";
import { cn } from "../../lib/utils";
import { ASSET_BASE_URL } from "../../constants/config";

interface AvatarProps {
  source?: string | null;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function Avatar({
  source,
  fallback = "/uploads//profile/defaultavatar.png",
  size = "md",
  className,
}: AvatarProps) {
  const [useFallback, setUseFallback] = useState(false);

  const raw = useFallback ? fallback : source || fallback;

  const imageSource =
    raw && raw.startsWith("http")
      ? raw
      : raw?.startsWith("/")
        ? `${ASSET_BASE_URL}${raw}`
        : `${ASSET_BASE_URL}/${raw || ""}`;

  return (
    <View
      className={cn(
        "rounded-full overflow-hidden bg-gray-200 border border-gray-100",
        sizeClasses[size],
        className,
      )}
    >
      <Image
        source={{ uri: imageSource }}
        className="w-full h-full"
        resizeMode="cover"
        onError={() => setUseFallback(true)}
      />
    </View>
  );
}
