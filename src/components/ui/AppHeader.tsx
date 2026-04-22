import React, { ReactNode } from "react";
import { Text, View } from "react-native";

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
};

const AppHeader = ({ eyebrow, title, right }: AppHeaderProps) => {
  return (
    <View className="flex-row items-end justify-between border-b border-border-muted bg-surface/90 px-6 pb-5 pt-4">
      <View>
        {eyebrow ? (
          <Text className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="text-3xl font-extrabold tracking-tight text-text-primary">
          {title}
        </Text>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
};

export default AppHeader;
