import React from 'react';
import { View, Text } from 'react-native';

const categoryColors: Record<string, string> = {
  Beauty: 'bg-pink-50 text-pink-500',
  Meat: 'bg-red-50 text-red-500',
  Fish: 'bg-blue-50 text-blue-500',
  Vegetables: 'bg-emerald-50 text-emerald-600',
  Fruits: 'bg-orange-50 text-orange-500',
  Dairy: 'bg-yellow-50 text-yellow-600',
  Snacks: 'bg-purple-50 text-purple-500',
  Drinks: 'bg-cyan-50 text-cyan-500',
  Household: 'bg-slate-50 text-slate-500',
  Medicine: 'bg-teal-50 text-teal-500',
  Other: 'bg-gray-50 text-gray-500',
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorClass = categoryColors[category] || categoryColors['Other'];
  
  return (
    <View className={`px-2.5 py-0.5 rounded-full ${colorClass.split(' ')[0]} border border-${colorClass.split(' ')[1].replace('text-', '')}/10`}>
      <Text className={`text-[9px] font-black uppercase tracking-wider ${colorClass.split(' ')[1]}`}>
        {category}
      </Text>
    </View>
  );
};

export default CategoryBadge;
