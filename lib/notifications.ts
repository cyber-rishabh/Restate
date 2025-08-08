import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, getProperties } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  newProperties: boolean;
  priceDrops: boolean;
  openHouses: boolean;
  marketUpdates: boolean;
  agentMessages: boolean;
  savedSearches: boolean;
}

export interface SavedSearch {
  id?: string;
  userId: string;
  name: string;
  criteria: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    location?: string;
  };
  isActive: boolean;
  lastChecked: Date;
}

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: 'newProperty' | 'priceDrop' | 'openHouse' | 'marketUpdate' | 'agentMessage' | 'savedSearch';
  read: boolean;
  createdAt: Date;
  propertyId?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  // Initialize notification service
  async initialize() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.expoPushToken = token.data;
        console.log('Push token:', this.expoPushToken);
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Create specific channels for different notification types
        Notifications.setNotificationChannelAsync('new-properties', {
          name: 'New Properties',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });

        Notifications.setNotificationChannelAsync('price-drops', {
          name: 'Price Drops',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9800',
        });

        Notifications.setNotificationChannelAsync('open-houses', {
          name: 'Open Houses',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
        });
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Start background checking for saved searches
      this.startBackgroundChecking();
      
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  // Start background checking for saved searches
  private startBackgroundChecking() {
    // Check for new properties every 30 minutes
    setInterval(async () => {
      try {
        // Get all users with saved searches
        const usersWithSearches = await this.getUsersWithSavedSearches();
        
        for (const userId of usersWithSearches) {
          await this.checkSavedSearches(userId);
          await this.checkPriceDrops(userId);
        }
      } catch (error) {
        console.error('Error in background checking:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  // Get users who have saved searches
  private async getUsersWithSavedSearches(): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'savedSearches'),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const userIds = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userIds.add(data.userId);
      });
      
      return Array.from(userIds);
    } catch (error) {
      console.error('Error getting users with saved searches:', error);
      return [];
    }
  }

  // Set up notification listeners
  private setupNotificationListeners() {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // Handle notification response
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'newProperty' && data?.propertyId) {
      // Navigate to property detail
      // You can implement navigation logic here
      console.log('Navigate to property:', data.propertyId);
    } else if (data?.type === 'openHouse' && data?.propertyId) {
      // Navigate to open house details
      console.log('Navigate to open house:', data.propertyId);
    }
  }

  // Get push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Save push token to user profile
  async savePushToken(userId: string) {
    if (!this.expoPushToken) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: this.expoPushToken,
        notificationPreferences: {
          newProperties: true,
          priceDrops: true,
          openHouses: true,
          marketUpdates: true,
          agentMessages: true,
          savedSearches: true,
        },
      });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Send local notification
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'default'
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Save notification to database
  async saveNotification(notification: Omit<NotificationData, 'id' | 'createdAt'>) {
    try {
      const notificationData: Omit<NotificationData, 'id'> = {
        ...notification,
        createdAt: new Date(),
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications: NotificationData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore timestamp to Date object
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
        notifications.push({ 
          id: doc.id, 
          ...data,
          createdAt 
        } as NotificationData);
      });
      
      return notifications.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Save search criteria
  async saveSearch(userId: string, search: Omit<SavedSearch, 'id' | 'userId' | 'lastChecked'>) {
    try {
      const searchData: Omit<SavedSearch, 'id'> = {
        ...search,
        userId,
        lastChecked: new Date(),
      };
      
      await addDoc(collection(db, 'savedSearches'), searchData);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }

  // Get user saved searches
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const q = query(
        collection(db, 'savedSearches'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const searches: SavedSearch[] = [];
      
      querySnapshot.forEach((doc) => {
        searches.push({ id: doc.id, ...doc.data() } as SavedSearch);
      });
      
      return searches;
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  // Check for new properties matching saved searches
  async checkSavedSearches(userId: string) {
    try {
      const savedSearches = await this.getSavedSearches(userId);
      
      for (const search of savedSearches) {
        // Find properties that match the search criteria
        const matchingProperties = await this.findMatchingProperties(search.criteria);
        
        // Filter for properties created after the last check
        const newProperties = matchingProperties.filter(property => {
          if (!property.createdAt) return false;
          const propertyDate = new Date(property.createdAt);
          const lastCheckDate = new Date(search.lastChecked);
          return propertyDate > lastCheckDate;
        });
        
        if (newProperties.length > 0) {
          // Create detailed notification message
          const propertyDetails = newProperties.slice(0, 3).map(p => 
            `• ${p.name} - ${p.price}`
          ).join('\n');
          
          const notificationBody = newProperties.length === 1 
            ? `New property found: ${newProperties[0].name} - ${newProperties[0].price}`
            : `${newProperties.length} new properties found matching your "${search.name}" search:\n${propertyDetails}${newProperties.length > 3 ? '\n...and more!' : ''}`;
          
          // Send notification for new matching properties
          await this.sendLocalNotification(
            'New Properties Found! 🏠',
            notificationBody,
            {
              type: 'savedSearch',
              searchId: search.id,
              propertyCount: newProperties.length,
              properties: newProperties.map(p => ({ id: p.id, name: p.name, price: p.price }))
            },
            'new-properties'
          );
          
          // Save notification to database
          await this.saveNotification({
            userId,
            title: 'New Properties Found! 🏠',
            body: notificationBody,
            type: 'savedSearch',
            read: false,
            data: {
              searchId: search.id,
              propertyCount: newProperties.length,
              properties: newProperties.map(p => ({ id: p.id, name: p.name, price: p.price }))
            },
          });
          
          // Update the last checked time for this search
          if (search.id) {
            const searchRef = doc(db, 'savedSearches', search.id);
            await updateDoc(searchRef, { lastChecked: new Date() });
          }
        }
      }
    } catch (error) {
      console.error('Error checking saved searches:', error);
    }
  }

  // Check for price drops on properties matching saved searches
  async checkPriceDrops(userId: string) {
    try {
      const savedSearches = await this.getSavedSearches(userId);
      
      for (const search of savedSearches) {
        const matchingProperties = await this.findMatchingProperties(search.criteria);
        
        // For each matching property, check if price has dropped
        for (const property of matchingProperties) {
          // This would typically check against a price history collection
          // For now, we'll simulate price drop detection
          // In a real implementation, you'd store price history and compare
          const hasPriceDropped = await this.checkPropertyPriceDrop(property.id);
          
          if (hasPriceDropped) {
            await this.sendPriceDropNotification(
              userId, 
              property.id!, 
              hasPriceDropped.oldPrice, 
              hasPriceDropped.newPrice
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking price drops:', error);
    }
  }

  // Check if a property's price has dropped (placeholder implementation)
  private async checkPropertyPriceDrop(propertyId: string | undefined): Promise<{ oldPrice: number; newPrice: number } | null> {
    // This is a placeholder - in real implementation, you'd:
    // 1. Query a price history collection
    // 2. Compare current price with previous price
    // 3. Return price drop data if detected
    
    // For demo purposes, return null (no price drop)
    return null;
  }

  // Find properties matching saved search criteria
  private async findMatchingProperties(criteria: any): Promise<any[]> {
    try {
      // Get all properties (we'll filter them in memory for better matching)
      const allProperties = await getProperties();
      
      // Filter properties based on criteria
      const matchingProperties = allProperties.filter(property => {
        // Check if property is sold - we don't want to notify about sold properties
        if (property.sold) return false;
        
        let matches = true;
        
        // Check location match (case-insensitive partial match)
        if (criteria.location && criteria.location.trim()) {
          const searchLocation = criteria.location.toLowerCase().trim();
          const propertyLocation = property.address.toLowerCase();
          const propertyName = property.name.toLowerCase();
          
          if (!propertyLocation.includes(searchLocation) && 
              !propertyName.includes(searchLocation)) {
            matches = false;
          }
        }
        
        // Check property type match
        if (criteria.propertyType && criteria.propertyType.trim()) {
          const searchType = criteria.propertyType.toLowerCase().trim();
          const propertyType = property.type.toLowerCase();
          
          if (searchType !== 'all' && propertyType !== searchType) {
            matches = false;
          }
        }
        
        // Check price range match
        if (criteria.minPrice || criteria.maxPrice) {
          const propertyPrice = parseFloat(property.price.replace(/[^0-9.]/g, ''));
          
          if (criteria.minPrice && propertyPrice < criteria.minPrice) {
            matches = false;
          }
          
          if (criteria.maxPrice && propertyPrice > criteria.maxPrice) {
            matches = false;
          }
        }
        
        // Check bedrooms match
        if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) {
          matches = false;
        }
        
        // Check bathrooms match
        if (criteria.bathrooms && property.bathrooms < criteria.bathrooms) {
          matches = false;
        }
        
        return matches;
      });
      
      return matchingProperties;
    } catch (error) {
      console.error('Error finding matching properties:', error);
      return [];
    }
  }

  // Send price drop notification
  async sendPriceDropNotification(userId: string, propertyId: string, oldPrice: number, newPrice: number) {
    const priceDrop = oldPrice - newPrice;
    const percentageDrop = ((priceDrop / oldPrice) * 100).toFixed(1);
    
    await this.sendLocalNotification(
      'Price Drop Alert! 💰',
      `A property you're watching dropped by $${priceDrop.toLocaleString()} (${percentageDrop}%)`,
      {
        type: 'priceDrop',
        propertyId,
        oldPrice,
        newPrice,
        priceDrop,
      },
      'price-drops'
    );
    
    await this.saveNotification({
      userId,
      title: 'Price Drop Alert! 💰',
      body: `A property you're watching dropped by $${priceDrop.toLocaleString()} (${percentageDrop}%)`,
      type: 'priceDrop',
      read: false,
      propertyId,
      data: {
        oldPrice,
        newPrice,
        priceDrop,
      },
    });
  }

  // Send open house notification
  async sendOpenHouseNotification(userId: string, propertyId: string, date: Date, address: string) {
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    
    await this.sendLocalNotification(
      'Open House Reminder 🏠',
      `Open house at ${address} on ${formattedDate}`,
      {
        type: 'openHouse',
        propertyId,
        date: date.toISOString(),
        address,
      },
      'open-houses'
    );
    
    await this.saveNotification({
      userId,
      title: 'Open House Reminder 🏠',
      body: `Open house at ${address} on ${formattedDate}`,
      type: 'openHouse',
      read: false,
      propertyId,
      data: {
        date: date.toISOString(),
        address,
      },
    });
  }

  // Send new property notification
  async sendNewPropertyNotification(userId: string, propertyId: string, propertyName: string, price: number) {
    await this.sendLocalNotification(
      'New Property Alert! 🆕',
      `${propertyName} - $${price.toLocaleString()}`,
      {
        type: 'newProperty',
        propertyId,
        propertyName,
        price,
      },
      'new-properties'
    );
    
    await this.saveNotification({
      userId,
      title: 'New Property Alert! 🆕',
      body: `${propertyName} - $${price.toLocaleString()}`,
      type: 'newProperty',
      read: false,
      propertyId,
      data: {
        propertyName,
        price,
      },
    });
  }

  // Send market update notification
  async sendMarketUpdateNotification(userId: string, update: string) {
    await this.sendLocalNotification(
      'Market Update 📊',
      update,
      {
        type: 'marketUpdate',
        update,
      },
      'default'
    );
    
    await this.saveNotification({
      userId,
      title: 'Market Update 📊',
      body: update,
      type: 'marketUpdate',
      read: false,
      data: { update },
    });
  }

  // Send agent message notification
  async sendAgentMessageNotification(userId: string, agentName: string, message: string) {
    await this.sendLocalNotification(
      `Message from ${agentName} 💬`,
      message.length > 50 ? message.substring(0, 50) + '...' : message,
      {
        type: 'agentMessage',
        agentName,
        message,
      },
      'default'
    );
    
    await this.saveNotification({
      userId,
      title: `Message from ${agentName} 💬`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      type: 'agentMessage',
      read: false,
      data: {
        agentName,
        message,
      },
    });
  }

  // Manually trigger saved search checking for a user
  async triggerSavedSearchCheck(userId: string) {
    try {
      console.log('🔍 Triggering saved search check for user:', userId);
      await this.checkSavedSearches(userId);
      await this.checkPriceDrops(userId);
      console.log('✅ Saved search check completed for user:', userId);
    } catch (error) {
      console.error('Error triggering saved search check:', error);
    }
  }

  // Get saved searches count for a user
  async getSavedSearchesCount(userId: string): Promise<number> {
    try {
      const searches = await this.getSavedSearches(userId);
      return searches.length;
    } catch (error) {
      console.error('Error getting saved searches count:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService(); 