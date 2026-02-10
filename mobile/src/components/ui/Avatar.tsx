import { View, Image } from "react-native";
import { cn } from "../../lib/utils";
import { API_BASE_URL } from "../../constants/config";

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

export function Avatar({ source, fallback = "/uploads//profile/defaultavatar.png", size = "md", className }: AvatarProps) {
  // Handle relative paths by prepending API_BASE_URL if needed
  const imageSource = source 
    ? (source.startsWith("http") ? source : `${API_BASE_URL}${source}`)
    : (fallback.startsWith("http") ? fallback : `${API_BASE_URL}${fallback}`);

  return (
    <View className={cn("rounded-full overflow-hidden bg-gray-200 border border-gray-100", sizeClasses[size], className)}>
      <Image
        source={{ uri: imageSource }}
        className="w-full h-full"
        resizeMode="cover"
      />
    </View>
  );
}
