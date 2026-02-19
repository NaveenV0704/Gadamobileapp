import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Avatar } from "./ui/Avatar";
import { Heart, MessageCircle, Share2, Eye, Bookmark, Shield } from "lucide-react-native";

export default function SavedPostCard({}: { post?: any }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const btnRef = useRef<any>(null);

  const handleUnsave = () => {
    // TODO: implement unsave action
    console.log("Unsave post");
    setMenuVisible(false);
  };

  const handleReport = () => {
    // TODO: implement report action
    console.log("Report post");
    setMenuVisible(false);
  };

  return (
    <>
      <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <Avatar source={undefined} size="sm" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">ernestokereafor</Text>
            <Text className="text-xs text-gray-500">Nov 22, 12:09 PM</Text>
          </View>
          <View>
            <TouchableOpacity
              ref={btnRef}
              onPress={() => {
                if (btnRef.current && btnRef.current.measureInWindow) {
                  btnRef.current.measureInWindow((bx: number, by: number, bw: number, bh: number) => {
                    setMenuPos({ x: bx, y: by, width: bw, height: bh });
                    setMenuVisible(true);
                  });
                } else {
                  setMenuVisible(true);
                }
              }}
              className="p-2"
            >
              <Text className="text-gray-500 text-xl">⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body (empty for sample) */}
        <View className="h-6 bg-white" />

        {/* Action Bar */}
        <View className="bg-white">
          <View className="flex-row items-center h-14">
            <TouchableOpacity className="flex-1 items-center justify-center flex-row space-x-2">
              <Heart size={18} color="#6b7280" />
              <Text className="text-gray-600">Like</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 items-center justify-center flex-row space-x-2">
              <MessageCircle size={18} color="#6b7280" />
              <Text className="text-gray-600">Comment</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 items-center justify-center flex-row space-x-2">
              <Share2 size={18} color="#6b7280" />
              <Text className="text-gray-600">Share</Text>
            </TouchableOpacity>

            <View className="w-16 items-center justify-center flex-row space-x-1">
              <Eye size={18} color="#6b7280" />
              <Text className="text-gray-600 text-sm">0</Text>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setMenuVisible(false)}
        >
          {(() => {
            const MENU_W = 224; // w-56
            let left = menuPos.x + menuPos.width - MENU_W;
            if (left < 8) left = 8;
            const top = menuPos.y + menuPos.height + 6;
            return (
              <View style={{ position: 'absolute', top, left }}>
                <View className="bg-white rounded-lg shadow-sm border border-gray-100 w-56 overflow-hidden">
                  <Pressable onPress={handleUnsave} className="px-4 py-3">
                    <View className="flex-row items-center">
                      <Bookmark size={18} color="#111827" />
                      <Text className="ml-3 text-gray-900">Unsave Post</Text>
                    </View>
                  </Pressable>
                  <View className="h-px bg-gray-100" />
                  <Pressable onPress={handleReport} className="px-4 py-3">
                    <View className="flex-row items-center">
                      <Shield size={18} color="#111827" />
                      <Text className="ml-3 text-gray-900">Report post</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </Pressable>
      </Modal>
    </>
  );
}
