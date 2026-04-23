import React from "react";
import { Text, View } from "react-native";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

const SectionHeader = ({ eyebrow, title, subtitle }: SectionHeaderProps) => {
  return (
    <View>
      {eyebrow ? (
        <Text className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-3xl font-extrabold tracking-tight text-text-primary">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-sm leading-6 text-text-secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

export default SectionHeader;
