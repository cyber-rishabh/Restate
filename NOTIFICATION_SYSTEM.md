# 🔔 Push Notifications & Smart Alerts System

## 📱 Overview

The notification system provides real-time alerts for users about new properties, price drops, open houses, market updates, and agent messages. It's designed to keep users engaged and informed about relevant real estate opportunities.

## ✨ Features

### 🔔 **Smart Notifications**
- **New Property Alerts** - Notify when new properties match saved criteria
- **Price Drop Alerts** - Alert when properties drop in price
- **Open House Reminders** - Remind about upcoming open houses
- **Market Updates** - Share market trends and insights
- **Agent Messages** - Direct communication from agents
- **Saved Search Alerts** - Notify when new properties match saved searches

### 🎯 **User Experience**
- **Real-time Badge Count** - Shows unread notifications on bell icon
- **Notification Center** - Dedicated space to view all notifications
- **Mark as Read** - Easy way to manage notification status
- **Customizable Preferences** - Users can choose what to be notified about
- **Saved Searches** - Save search criteria for automatic notifications

## 🏗️ Architecture

### **Core Components**

1. **`lib/notifications.ts`** - Main notification service
2. **`components/NotificationCenter.tsx`** - UI for viewing notifications
3. **`components/SaveSearchModal.tsx`** - Save search criteria
4. **`lib/notification-demo.ts`** - Demo functions for testing

### **Data Flow**
```
User Action → Notification Service → Firebase → Push Notification → User Device
```

## 🚀 Setup & Installation

### **1. Dependencies**
```bash
npx expo install expo-notifications expo-device expo-constants
```

### **2. Firebase Configuration**
The system uses Firebase for:
- User authentication
- Notification storage
- Push token management
- Saved searches

### **3. Permissions**
The app automatically requests notification permissions on first launch.

## 📋 Usage

### **For Users**

#### **Viewing Notifications**
1. Tap the bell icon in the header
2. View all notifications in the notification center
3. Tap notifications to mark as read
4. Long press to delete notifications

#### **Saving Searches**
1. Go to Explore page
2. Apply filters (price, location, etc.)
3. Tap "🔔 Save Search" button
4. Enter a name for your search
5. Get notified when new properties match

#### **Managing Preferences**
1. Open notification center
2. Go to "Settings" tab
3. Toggle notification types on/off

### **For Developers**

#### **Sending Notifications**
```typescript
import { notificationService } from '@/lib/notifications';

// Send new property notification
await notificationService.sendNewPropertyNotification(
  userId,
  propertyId,
  propertyName,
  price
);

// Send price drop notification
await notificationService.sendPriceDropNotification(
  userId,
  propertyId,
  oldPrice,
  newPrice
);

// Send open house notification
await notificationService.sendOpenHouseNotification(
  userId,
  propertyId,
  date,
  address
);
```

#### **Testing Notifications**
1. Go to Profile page
2. Tap "Test Notifications"
3. Demo notifications will be sent over 10 seconds

## 🎨 UI Components

### **Notification Bell**
- Located in app header
- Shows unread count badge
- Opens notification center

### **Notification Center**
- **Notifications Tab** - View all notifications
- **Saved Searches Tab** - Manage saved searches
- **Settings Tab** - Configure preferences

### **Save Search Modal**
- Name your search
- Preview search criteria
- Enable notifications

## 🔧 Configuration

### **Notification Channels (Android)**
- **Default** - General notifications
- **New Properties** - High priority, green light
- **Price Drops** - High priority, orange light
- **Open Houses** - Medium priority, blue light

### **Notification Types**
```typescript
type NotificationType = 
  | 'newProperty'
  | 'priceDrop'
  | 'openHouse'
  | 'marketUpdate'
  | 'agentMessage'
  | 'savedSearch';
```

## 📊 Database Schema

### **Notifications Collection**
```typescript
interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  propertyId?: string;
}
```

### **Saved Searches Collection**
```typescript
interface SavedSearch {
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
```

## 🧪 Testing

### **Demo Functions**
```typescript
import { demoNotifications } from '@/lib/notification-demo';

// Send all demo notifications
await demoNotifications.sendAllDemoNotifications(userId);

// Send specific notification types
await demoNotifications.sendNewPropertyNotification(userId);
await demoNotifications.sendPriceDropNotification(userId);
await demoNotifications.sendOpenHouseNotification(userId);
```

### **Manual Testing**
1. **Save a Search** - Go to explore, apply filters, save search
2. **Test Notifications** - Use demo button in profile
3. **Check Badge Count** - Verify unread count updates
4. **Mark as Read** - Tap notifications to mark as read

## 🔒 Security

### **User-Specific Data**
- All notifications are tied to user ID
- Saved searches are user-specific
- Push tokens are stored per user

### **Permission Handling**
- Graceful fallback if permissions denied
- Clear user feedback about permission status

## 📈 Performance

### **Optimizations**
- Lazy loading of notifications
- Efficient Firebase queries
- Minimal re-renders with proper state management

### **Background Processing**
- Notifications work when app is closed
- Automatic badge count updates
- Efficient push token management

## 🚀 Future Enhancements

### **Planned Features**
- **Scheduled Notifications** - Send notifications at specific times
- **Rich Notifications** - Include images and actions
- **Notification Groups** - Group similar notifications
- **Advanced Filters** - More granular notification preferences
- **Analytics** - Track notification engagement

### **Integration Opportunities**
- **Email Notifications** - Send email summaries
- **SMS Notifications** - Critical alerts via SMS
- **Web Push** - Browser notifications
- **Social Media** - Share properties on social platforms

## 🐛 Troubleshooting

### **Common Issues**

#### **Notifications Not Appearing**
1. Check notification permissions
2. Verify push token is saved
3. Check Firebase configuration
4. Ensure device is not in Do Not Disturb mode

#### **Badge Count Not Updating**
1. Refresh notification center
2. Check Firebase connection
3. Verify user authentication

#### **Saved Searches Not Working**
1. Check search criteria format
2. Verify Firebase rules
3. Ensure user is logged in

### **Debug Commands**
```typescript
// Check push token
console.log('Push token:', notificationService.getPushToken());

// Check user notifications
const notifications = await notificationService.getUserNotifications(userId);
console.log('User notifications:', notifications);

// Check saved searches
const searches = await notificationService.getSavedSearches(userId);
console.log('Saved searches:', searches);
```

## 📞 Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

**🎉 The notification system is now fully integrated and ready to enhance user engagement!** 