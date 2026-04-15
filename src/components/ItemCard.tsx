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

  const timeAgo = item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now';

  return (
    <TouchableOpacity 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      className={`bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row items-center`}
      style={isCompleted ? { opacity: 0.6 } : undefined}
    >
      <TouchableOpacity 
        onPress={() => onToggle(item)}
        className="mr-4"
      >
        {isCompleted ? (
          <CheckCircle2 stroke="#10b981" size={28} />
        ) : (
          <Circle stroke="#d1d5db" size={28} />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1">
          <Text
            className={`text-lg font-semibold flex-1 ${isCompleted ? 'text-gray-400' : 'text-gray-900'}`}
            style={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
          >
            {item.name}
            {item.quantity ? ` (${item.quantity})` : ''}
          </Text>
          {!isCompleted && item.priority === 'Urgent' && (
            <View style={{ marginLeft: 8 }}>
              <AlertCircle stroke="#ef4444" size={16} />
            </View>
          )}
        </View>

        <View className="flex-row items-center flex-wrap">
          <CategoryBadge category={item.category} />
          <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
          <Text className={`text-xs font-bold ${priorityColors[item.priority]}`}>
            {item.priority}
          </Text>
        </View>

        <View className="flex-row items-center mt-2">
          <Text className="text-[10px] text-gray-400 flex-row items-center">
            Added by <Text className="font-medium text-gray-600">{item.addedBy.uid === item.addedBy.uid ? 'You' : item.addedBy.name}</Text> • {timeAgo}
          </Text>
        </View>

        {isCompleted && item.completedBy && (
          <View className="flex-row items-center mt-1">
            <Text className="text-[10px] text-emerald-600 font-medium">
              Completed by {item.completedBy.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ItemCard;
