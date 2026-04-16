import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react-native';
import { GroceryItem } from '../types';
import CategoryBadge from './CategoryBadge';
import { formatDistanceToNow } from 'date-fns';

interface ItemCardProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onPress: (item: GroceryItem) => void;
}

const ItemCard = ({ item, onToggle, onPress }: ItemCardProps) => {
  const isCompleted = item.status === 'completed';
  
  const priorityColors = {
    Urgent: 'text-red-500',
    Medium: 'text-amber-500',
    Low: 'text-emerald-500',
  };

  const priorityBg = {
    Urgent: 'bg-red-50',
    Medium: 'bg-amber-50',
    Low: 'bg-emerald-50',
  };

  const timeAgo = item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now';

  return (
    <TouchableOpacity 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      className={`bg-white p-5 rounded-3xl mb-4 border border-gray-100/50 flex-row items-center shadow-sm shadow-gray-200/50`}
      style={isCompleted ? { opacity: 0.6 } : {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }}
    >
      <TouchableOpacity 
        onPress={() => onToggle(item)}
        className="mr-5"
        activeOpacity={0.6}
      >
        <View className={`w-8 h-8 rounded-full items-center justify-center ${isCompleted ? 'bg-emerald-50' : 'bg-gray-50 border border-gray-100'}`}>
          {isCompleted ? (
            <CheckCircle2 stroke="#10b981" size={20} strokeWidth={3} />
          ) : (
            <Circle stroke="#d1d5db" size={20} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1.5">
          <Text
            className={`text-lg font-bold flex-1 tracking-tight ${isCompleted ? 'text-gray-400' : 'text-gray-900'}`}
            style={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
          >
            {item.name}
            {item.quantity ? <Text className="text-gray-400 font-medium"> ({item.quantity})</Text> : ''}
          </Text>
          {!isCompleted && item.priority === 'Urgent' && (
            <View className="bg-red-50 p-1 rounded-lg">
              <AlertCircle stroke="#ef4444" size={14} strokeWidth={2.5} />
            </View>
          )}
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          <CategoryBadge category={item.category} />
          <View className={`px-2.5 py-0.5 rounded-full ${priorityBg[item.priority]}`}>
            <Text className={`text-[10px] font-extrabold uppercase tracking-widest ${priorityColors[item.priority]}`}>
              {item.priority}
            </Text>
          </View>
          <View className="flex-row items-center ml-auto">
            <Clock stroke="#94a3b8" size={10} className="mr-1" />
            <Text className="text-[10px] text-gray-400 font-medium">{timeAgo}</Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
          <View className="w-5 h-5 bg-gray-100 rounded-full items-center justify-center mr-2">
            <Text className="text-[8px] font-bold text-gray-500">{item.addedBy.name.charAt(0)}</Text>
          </View>
          <Text className="text-[10px] text-gray-400">
            Added by <Text className="font-bold text-gray-600">{item.addedBy.uid === item.addedBy.uid ? 'You' : item.addedBy.name}</Text>
          </Text>
        </View>

        {isCompleted && item.completedBy && (
          <View className="flex-row items-center mt-2 bg-emerald-50/50 p-2 rounded-xl">
             <View className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
            <Text className="text-[10px] text-emerald-700 font-semibold">
              Completed by {item.completedBy.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ItemCard;
