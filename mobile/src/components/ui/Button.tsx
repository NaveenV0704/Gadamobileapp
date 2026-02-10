import { Text, Pressable, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import React from "react";

const buttonVariants = cva(
  "flex flex-row items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-blue-600",
        destructive: "bg-red-500",
        outline: "border border-gray-200 bg-transparent",
        secondary: "bg-gray-100",
        ghost: "bg-transparent",
        link: "text-blue-600 underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-white",
      destructive: "text-white",
      outline: "text-gray-900",
      secondary: "text-gray-900",
      ghost: "text-gray-900",
      link: "text-blue-600 underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  textClassName?: string;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, label, children, textClassName, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {label ? (
          <Text className={cn(textVariants({ variant }), textClassName)}>
            {label}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
