import { TouchableOpacity, View, Text, Linking } from "react-native";
import clsx from "clsx";
import { Share2 } from "lucide-react-native";

type ShareStripProps = {
  url: string;
  text?: string;
  title?: string;
  className?: string;
  size?: "sm" | "md";
  fbAppId?: string;
  fbRedirectUri?: string;
};

export default function ShareStrip({
  url,
  text = "Join me here!",
  title = "Check this out",
  className,
  size = "sm",
  fbAppId,
  fbRedirectUri,
}: ShareStripProps) {
  if (!url) return null;

  const U = encodeURIComponent(url);
  const T = encodeURIComponent(text);
  const TT = encodeURIComponent(title);

  const items: Array<{
    key: string;
    label: string;
    href: string;
    color: string;
    hidden?: boolean;
  }> = [
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${U}`, color: "#1877F2" },
    { key: "x",        label: "X",        href: `https://twitter.com/intent/tweet?url=${U}&text=${T}`,              color: "#000000" },
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${U}`,         color: "#0A66C2" },
    { key: "whatsapp", label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${T}%20${U}`,                   color: "#25D366" },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${U}&text=${T}`,                        color: "#0088CC" },
    { key: "reddit",   label: "Reddit",   href: `https://www.reddit.com/submit?url=${U}&title=${TT}`,               color: "#FF4500" },
    {
      key: "messenger",
      label: "Messenger",
      href: `https://www.facebook.com/dialog/send?link=${U}&app_id=${encodeURIComponent(
        fbAppId || ""
      )}&redirect_uri=${encodeURIComponent(fbRedirectUri || "")}`,
      color: "#1877F2",
      hidden: !fbAppId || !fbRedirectUri,
    },
  ];

  const canNativeShare = false;

  const onChipPress = async (href: string) => {
    try {
      await Linking.openURL(href);
    } catch {}
  };

  const chipBase =
    size === "sm"
      ? { height: 32, paddingHorizontal: 8, fontSize: 12 }
      : { height: 36, paddingHorizontal: 12, fontSize: 13 };

  return (
    <View className={clsx("flex-row flex-wrap items-center gap-2", className)}>
      {canNativeShare && (
        <TouchableOpacity
          onPress={() => {}}
          style={{
            height: chipBase.height,
            paddingHorizontal: chipBase.paddingHorizontal,
            borderRadius: 999,
            backgroundColor: "#111827",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Share2 size={16} color="#ffffff" />
          <Text style={{ color: "white", marginLeft: 6, fontSize: chipBase.fontSize }}>
            Share…
          </Text>
        </TouchableOpacity>
      )}

      {items.filter((i) => !i.hidden).map((i) => (
        <TouchableOpacity
          key={i.key}
          onPress={() => onChipPress(i.href)}
          style={{
            height: chipBase.height,
            paddingHorizontal: chipBase.paddingHorizontal,
            borderRadius: 999,
            backgroundColor: i.color,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: chipBase.fontSize }}>
            {i.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

