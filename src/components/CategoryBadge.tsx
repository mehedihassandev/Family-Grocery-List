import React from 'react';
import { View, Text } from 'react-native';

const categoryColors: Record<string, string> = {
  Beauty: 'bg-pink-100 text-pink-700',
  Meat: 'bg-red-100 text-red-700',
  Fish: 'bg-blue-100 text-blue-700',
  Vegetables: 'bg-green-100 text-green-700',
  Fruits: 'bg-orange-100 text-orange-700',
  Dairy: 'bg-yellow-100 text-yellow-700',
  Snacks: 'bg-purple-100 text-purple-700',
  Drinks: 'bg-cyan-100 text-cyan-700',
  Household: 'bg-slate-100 text-slate-700',
  Medicine: 'bg-emerald-100 text-emerald-700',
  Other: 'bg-gray-100 text-gray-700',
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorClass = categoryColors[category] || categoryColors['Other'];
  
  return (
    <View className={`px-2 py-0.5 rounded-full ${colorClass.split(' ')[0]}`}>
      <Text className={`text-xs font-medium ${colorClass.split(' ')[1]}`}>
        {category}
      </Text>
    </View>
  );
};

export default CategoryBadge;
