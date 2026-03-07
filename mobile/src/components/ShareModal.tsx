import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (comment: string) => Promise<void>;
  loading: boolean;
}

export default function ShareModal({
  visible,
  onClose,
  onShare,
  loading,
}: ShareModalProps) {
  const [comment, setComment] = useState("");

  const handleShare = async () => {
    await onShare(comment);
    setComment("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40 justify-center px-4" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            className="bg-white rounded-2xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Share Post</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View className="p-4">
              <Text className="text-sm text-gray-600 mb-2">
                Add a comment (optional)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-base min-h-[100px]"
                placeholder="Say something about this post..."
                multiline
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                autoFocus
              />
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-end px-4 py-3 bg-gray-50 space-x-3">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                disabled={loading}
                className={`bg-[#1877F2] px-6 py-2 rounded-lg flex-row items-center ${
                  loading ? "opacity-70" : ""
                }`}
              >
                {loading && (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    className="mr-2"
                  />
                )}
                <Text className="text-white font-bold">Share Now</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
