import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService, NotificationData, NotificationPreferences, SavedSearch } from '@/lib/notifications';
import { useGlobalContext } from '@/lib/global-provider';
import icons from '@/constants/icons';
import { Image } from 'react-native';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ visible, onClose }: NotificationCenterProps) => {
  const { user } = useGlobalContext();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'savedSearches' | 'preferences'>('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newProperties: true,
    priceDrops: true,
    openHouses: true,
    marketUpdates: true,
    agentMessages: true,
    savedSearches: true,
  });

  useEffect(() => {
    if (visible && user) {
      loadData();
    }
  }, [visible, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [notificationsData, searchesData] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getSavedSearches(user.id),
      ]);
      
      setNotifications(notificationsData);
      setSavedSearches(searchesData);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          notificationService.markNotificationAsRead(n.id!)
        )
      );
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you'd delete from Firebase
              setNotifications(prev => 
                prev.filter(n => n.id !== notificationId)
              );
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'newProperty':
        return '🆕';
      case 'priceDrop':
        return '💰';
      case 'openHouse':
        return '🏠';
      case 'marketUpdate':
        return '📊';
      case 'agentMessage':
        return '💬';
      case 'savedSearch':
        return '🔍';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'newProperty':
        return '#4CAF50';
      case 'priceDrop':
        return '#FF9800';
      case 'openHouse':
        return '#2196F3';
      case 'marketUpdate':
        return '#9C27B0';
      case 'agentMessage':
        return '#00BCD4';
      case 'savedSearch':
        return '#FF5722';
      default:
        return '#607D8B';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderNotification = (notification: NotificationData) => (
    <TouchableOpacity
      key={notification.id}
      onPress={() => !notification.read && markAsRead(notification.id!)}
      onLongPress={() => deleteNotification(notification.id!)}
      className={`p-4 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}
    >
      <View className="flex-row items-start">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: getNotificationColor(notification.type) + '20' }}
        >
          <Text className="text-lg">{getNotificationIcon(notification.type)}</Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-rubik-bold text-black-300 text-base">
              {notification.title}
            </Text>
            {!notification.read && (
              <View className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </View>
          
          <Text className="font-rubik text-gray-600 text-sm mt-1">
            {notification.body}
          </Text>
          
          <Text className="font-rubik text-gray-400 text-xs mt-2">
            {formatDate(notification.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSavedSearch = (search: SavedSearch) => (
    <View key={search.id} className="p-4 border-b border-gray-100 bg-white">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-rubik-bold text-black-300 text-base">
            {search.name}
          </Text>
          
          <View className="flex-row flex-wrap mt-1">
            {search.criteria.minPrice && (
              <Text className="font-rubik text-gray-600 text-xs mr-2">
                Min: ${search.criteria.minPrice.toLocaleString()}
              </Text>
            )}
            {search.criteria.maxPrice && (
              <Text className="font-rubik text-gray-600 text-xs mr-2">
                Max: ${search.criteria.maxPrice.toLocaleString()}
              </Text>
            )}
            {search.criteria.bedrooms && (
              <Text className="font-rubik text-gray-600 text-xs mr-2">
                {search.criteria.bedrooms} bed
              </Text>
            )}
            {search.criteria.propertyType && (
              <Text className="font-rubik text-gray-600 text-xs mr-2">
                {search.criteria.propertyType}
              </Text>
            )}
          </View>
          
          <Text className="font-rubik text-gray-400 text-xs mt-2">
            Last checked: {formatDate(search.lastChecked)}
          </Text>
        </View>
        
        <TouchableOpacity className="bg-primary-100 px-3 py-1 rounded-full">
          <Text className="font-rubik-medium text-primary-300 text-xs">
            Active
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreferences = () => (
    <View className="p-4">
      <Text className="font-rubik-bold text-black-300 text-lg mb-4">
        Notification Preferences
      </Text>
      
      {Object.entries(preferences).map(([key, value]) => (
        <TouchableOpacity
          key={key}
          onPress={() => togglePreference(key as keyof NotificationPreferences)}
          className="flex-row items-center justify-between p-3 border-b border-gray-100"
        >
          <View className="flex-1">
            <Text className="font-rubik-medium text-black-300">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <Text className="font-rubik text-gray-500 text-sm mt-1">
              Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </Text>
          </View>
          
          <View className={`w-12 h-6 rounded-full ${value ? 'bg-primary-300' : 'bg-gray-300'}`}>
            <View 
              className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                value ? 'ml-6' : 'ml-0.5'
              }`}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <LinearGradient colors={["#0061FF", "#4F8CFF"]} className="flex-row items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl">
          <TouchableOpacity onPress={onClose}>
            <Image source={icons.backArrow} className="w-6 h-6 tint-white" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-white">Notifications</Text>
          <View className="w-6" />
        </LinearGradient>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('notifications')}
            className={`flex-1 py-3 ${activeTab === 'notifications' ? 'border-b-2 border-primary-300' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'notifications' ? 'text-primary-300' : 'text-gray-500'}`}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('savedSearches')}
            className={`flex-1 py-3 ${activeTab === 'savedSearches' ? 'border-b-2 border-primary-300' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'savedSearches' ? 'text-primary-300' : 'text-gray-500'}`}>
              Saved Searches
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('preferences')}
            className={`flex-1 py-3 ${activeTab === 'preferences' ? 'border-b-2 border-primary-300' : ''}`}
          >
            <Text className={`text-center font-rubik-medium ${activeTab === 'preferences' ? 'text-primary-300' : 'text-gray-500'}`}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
          }
        >
          {activeTab === 'notifications' && (
            <View>
              {notifications.length > 0 ? (
                <>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      className="p-3 bg-primary-50 border-b border-primary-100"
                    >
                      <Text className="text-center font-rubik-medium text-primary-300">
                        Mark all as read
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {notifications.map(renderNotification)}
                </>
              ) : (
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-6xl mb-4">🔔</Text>
                  <Text className="font-rubik-bold text-gray-500 text-lg mb-2">
                    No notifications yet
                  </Text>
                  <Text className="font-rubik text-gray-400 text-center px-8">
                    You'll see notifications here when new properties match your criteria or when there are important updates.
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'savedSearches' && (
            <View>
              {savedSearches.length > 0 ? (
                savedSearches.map(renderSavedSearch)
              ) : (
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-6xl mb-4">🔍</Text>
                  <Text className="font-rubik-bold text-gray-500 text-lg mb-2">
                    No saved searches
                  </Text>
                  <Text className="font-rubik text-gray-400 text-center px-8">
                    Save your search criteria to get notified when new properties match your preferences.
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'preferences' && renderPreferences()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default NotificationCenter; 