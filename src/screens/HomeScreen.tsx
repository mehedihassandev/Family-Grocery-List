import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Plus, LayoutGrid, ListFilter, Search } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToGroceryList, toggleItemCompletion } from '../services/grocery';
import { GroceryItem } from '../types';
import ItemCard from '../components/ItemCard';
import AddItemModal from '../components/AddItemModal';
import EmptyState from '../components/EmptyState';

const HomeScreen = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'Active' | 'Completed'>('Active');

  useEffect(() => {
    if (!user?.familyId) return;

    const unsubscribe = subscribeToGroceryList(user.familyId, (newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.familyId]);

  const sortedItems = useMemo(() => {
    const filtered = items.filter(item => 
      filter === 'Active' ? item.status === 'pending' : item.status === 'completed'
    );

    if (filter === 'Active') {
      // Sort priority: Urgent (1), Medium (2), Low (3)
      const priorityMap: Record<string, number> = { Urgent: 0, Medium: 1, Low: 2 };
      return [...filtered].sort((a, b) => {
        if (priorityMap[a.priority] !== priorityMap[b.priority]) {
          return priorityMap[a.priority] - priorityMap[b.priority];
        }
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
    }

    // For completed, just show latest first
    return [...filtered].sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [items, filter]);

  const handleToggle = async (item: GroceryItem) => {
    if (!user) return;
    await toggleItemCompletion(item.id, item.status, {
      uid: user.uid,
      name: user.displayName
    });
  };

  const activeCount = items.filter(i => i.status === 'pending').length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white flex-row justify-between items-end border-b border-gray-100">
        <View>
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Shared Grocery</Text>
          <Text className="text-2xl font-bold text-gray-900">Our List</Text>
        </View>
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          {(['Active', 'Completed'] as const).map((t) => (
            <TouchableOpacity 
              key={t}
              onPress={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg ${filter === t ? 'bg-white' : ''}`}
            >
              <Text className={`text-xs font-bold ${filter === t ? 'text-primary-600' : 'text-gray-400'}`}>
                {t} {t === 'Active' && activeCount > 0 ? `(${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#0ea5e9" size="large" />
          </View>
        ) : sortedItems.length === 0 ? (
          <EmptyState 
            title={filter === 'Active' ? 'The list is empty' : 'No completed items'}
            description={filter === 'Active' 
              ? "Tap the '+' button below to add your first grocery item."
              : "Items you complete will show up here for future reference."}
          />
        ) : (
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <ItemCard 
                item={item} 
                onToggle={handleToggle}
                onPress={() => {}} // Could open details or edit later
              />
            )}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        className="absolute bottom-8 right-8 w-16 h-16 bg-primary-600 rounded-full items-center justify-center"
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>

      <AddItemModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)}
        familyId={user?.familyId || ''}
        user={{ uid: user?.uid || '', name: user?.displayName || 'Anonymous' }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
