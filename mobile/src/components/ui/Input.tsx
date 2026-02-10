import * as React from "react";
import { TextInput, View, Text } from "react-native";
import { cn } from "../../lib/utils";

export interface InputProps extends React.ComponentPropsWithoutRef<
  typeof TextInput
> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, error, rightElement, ...props }, ref) => {
    return (
      <View className="w-full mb-4">
        {label && (
          <Text className="text-sm font-medium text-textPrimary mb-1">
            {label}
          </Text>
        )}

        <View className="relative">
          <TextInput
            ref={ref}
            className={cn(
              `
            h-11 w-full rounded-lg
            border border-borderDefault
            bg-cardBg
            px-3 py-2
            text-base text-textPrimary
            focus:border-brand
            `,
              rightElement && "pr-10",
              error && "border-red-500",
              className,
            )}
            placeholderTextColor="#9CA3AF"
            {...props}
          />

          {rightElement && (
            <View className="absolute right-3 top-0 bottom-0 justify-center">
              {rightElement}
            </View>
          )}
        </View>

        {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";
export { Input };
