import React, { ReactNode } from "react";
import { Text, View } from "react-native";

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

const AppHeader = ({ eyebrow, title, subtitle, right }: AppHeaderProps) => {
  return (
    <View className="flex-row items-end justify-between border-b border-border-muted/60 bg-surface/95 px-6 pb-4 pt-3">
      <View>
        {eyebrow ? (
          <Text className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="text-[32px] font-extrabold tracking-tight text-text-primary">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-[15px] text-text-secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
};

export default AppHeader;
