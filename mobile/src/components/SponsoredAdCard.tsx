import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { serveAd, trackClick, trackView, getAudienceHints } from "../services/adsService";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { ExternalLink, Megaphone } from "lucide-react-native";
import { stripUploads } from "../lib/url";
import { ASSET_BASE_URL } from "../constants/config";
import { useIsFocused } from "@react-navigation/native";

type Placement = "newsfeed" | "sidebar";
type AdRow = {
  campaign_id: number;
  campaign_bidding: "click" | "view";
  ads_title: string | null;
  ads_description: string | null;
  ads_image: string | null;
  ads_url: string | null;
  ads_placement: Placement;
};

export default function SponsoredAdCard({
  placement,
  className = "",
}: {
  placement: Placement;
  className?: string;
}) {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const isFocused = useIsFocused();

  const [ad, setAd] = useState<AdRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);
  const [viewSent, setViewSent] = useState(false);

  const [audience, setAudience] = useState<{ country_id?: number; gender?: string; relationship?: string }>({});

  useEffect(() => {
    let mounted = true;

    const fromCtx = user && (user as any).country_id ? { country_id: (user as any).country_id } : {};
    if (fromCtx.country_id) {
      setAudience((s) => ({ ...s, ...fromCtx }));
      return;
    }

    (async () => {
      try {
        const r = await getAudienceHints(headers);
        if (!mounted) return;
        if (r?.ok) {
          setAudience({
            country_id: r.country_id || undefined,
            gender: r.gender || undefined,
            relationship: r.relationship || undefined,
          });
        }
      } catch {
        // silent
      }
    })();

    return () => { mounted = false; };
  }, [user, accessToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const q: any = { placement };
        if (audience.country_id) q.country_id = audience.country_id;
        if (audience.gender) q.gender = audience.gender;
        if (audience.relationship) q.relationship = audience.relationship;

        const res = await serveAd(q, headers);
        if (!mounted) return;
        if (res?.ok && res?.item) {
          setAd(res.item);
          setErr(null);
        } else {
          setAd(null);
          setErr(res?.error || "No ad");
        }
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load ad");
        setAd(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [placement, audience.country_id, audience.gender, audience.relationship, accessToken]);

  // View tracking
  useEffect(() => {
    if (!ad || viewSent || !isFocused) return;
    setViewSent(true);
    trackView(ad.campaign_id, headers).catch(() => {});
  }, [ad, isFocused, viewSent, headers]);

  const onClick = () => {
    if (!ad) return;
    trackClick(ad.campaign_id, headers).catch(() => {});
    if (ad.ads_url) {
      Linking.openURL(ad.ads_url).catch((err) => console.error("Couldn't load page", err));
    }
  };

  if (loading) {
    return (
      <View className={`rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-center ${className}`}>
        <ActivityIndicator size="small" color="#9333ea" />
      </View>
    );
  }
  if (!ad) return null;

  const imageUrl = ad.ads_image 
    ? `${ASSET_BASE_URL}/uploads/${stripUploads(ad.ads_image)}`
    : null;

  return (
    <View className={`rounded-2xl border border-gray-100 bg-white overflow-hidden mb-3 mx-2 shadow-sm ${className}`}>
      <View className="px-4 pt-3 pb-2 flex-row items-center">
        <Megaphone size={16} color="#eab308" />
        <Text className="ml-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Sponsored</Text>
      </View>

      {imageUrl && (
        <TouchableOpacity activeOpacity={0.9} onPress={onClick} className="w-full aspect-video bg-gray-100">
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        </TouchableOpacity>
      )}

      <View className="px-4 py-3">
        {ad.ads_title && (
          <TouchableOpacity onPress={onClick}>
            <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={2}>
              {ad.ads_title}
            </Text>
          </TouchableOpacity>
        )}
        {ad.ads_description && (
          <Text className="text-sm text-gray-600 leading-5" numberOfLines={3}>
            {ad.ads_description}
          </Text>
        )}
        {ad.ads_url && (
          <TouchableOpacity 
            onPress={onClick} 
            className="mt-3 flex-row items-center justify-center bg-purple-600 rounded-xl px-4 py-2.5"
          >
            <Text className="text-white font-semibold mr-2">Learn more</Text>
            <ExternalLink size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
