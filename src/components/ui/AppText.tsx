import React from "react";
import { Text, TextProps } from "react-native";

export type TAppTextVariant = "display" | "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption";

export interface IAppTextProps extends TextProps {
  variant?: TAppTextVariant;
  className?: string;
}

/**
 * Standard Typography Component
 * Why: Standardises font sizes, weights, and leading settings across the app based on our design tokens.
 * @param props - Component props including typography variant, custom styles, and standard Text attributes
 */
export const AppText = ({
  variant = "body",
  className = "",
  children,
  ...props
}: IAppTextProps) => {
  const variantStyles: Record<TAppTextVariant, string> = {
    display: "font-sans text-[32px] font-bold text-text-primary leading-tight",
    h1: "font-sans text-[24px] font-bold text-text-primary leading-snug",
    h2: "font-sans text-[18px] font-bold text-text-primary leading-normal",
    h3: "font-sans text-[13px] font-bold text-text-primary leading-normal",
    body: "font-sans text-[15px] font-medium text-text-secondary leading-relaxed",
    bodySmall: "font-sans text-[13px] font-medium text-text-secondary leading-normal",
    caption: "font-sans text-[11px] font-normal text-text-muted leading-normal",
  };

  const combinedClassName = `${variantStyles[variant]} ${className}`.trim();

  return (
    <Text className={combinedClassName} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
