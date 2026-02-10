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
      <View className="w-full space-y-2">
        {label && (
          <Text className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </Text>
        )}
        <View className="relative">
          <TextInput
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 disabled:opacity-50",
              rightElement && "pr-10",
              error && "border-red-500",
              className,
            )}
            placeholderTextColor="#9ca3af"
            {...props}
          />
          {rightElement && (
            <View className="absolute right-3 top-0 bottom-0 justify-center">
              {rightElement}
            </View>
          )}
        </View>
        {error && <Text className="text-xs text-red-500">{error}</Text>}
      </View>
    );
  },
);
Input.displayName = "Input";

export { Input };
