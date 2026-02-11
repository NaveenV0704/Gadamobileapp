import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";

const REACTIONS = [
  { label: "Like", emoji: "👍", value: "like" },
  { label: "Love", emoji: "❤️", value: "love" },
  { label: "Care", emoji: "🥰", value: "care" },
  { label: "Haha", emoji: "😆", value: "haha" },
  { label: "Wow", emoji: "😮", value: "wow" },
  { label: "Sad", emoji: "😢", value: "sad" },
  { label: "Angry", emoji: "😡", value: "angry" },
];

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({
  visible,
  onSelect,
  onClose,
}: ReactionPickerProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/20 justify-center items-center" onPress={onClose}>
        <View className="bg-white rounded-full flex-row p-3 shadow-xl border border-gray-200 items-center justify-around w-[90%] max-w-sm">
          {REACTIONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              onPress={() => onSelect(r.value)}
              className="mx-1 items-center transform active:scale-125 transition-transform"
            >
              <Text className="text-3xl">{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
