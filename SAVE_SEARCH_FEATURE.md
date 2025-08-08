# Save Search Feature with Notifications

## Overview

The Save Search feature allows users to save their search criteria and receive notifications when new properties match their saved searches. This feature automatically monitors for new properties and sends notifications for location, property type, and price matches.

## Features

### 🔍 Save Search Criteria
- **Location**: City, neighborhood, or area
- **Property Type**: House, Apartment, Condo, Villa, etc.
- **Price Range**: Minimum and maximum price
- **Bedrooms**: Minimum number of bedrooms
- **Bathrooms**: Minimum number of bathrooms

### 🔔 Smart Notifications
- **New Properties**: Notifications when new properties match saved criteria
- **Price Drops**: Alerts when properties in saved searches have price reductions
- **Detailed Information**: Property names, prices, and locations in notifications
- **Multiple Matches**: Summarized notifications for multiple matching properties

### ⚡ Automatic Monitoring
- **Background Checking**: Automatically checks for new properties every 30 minutes
- **Real-time Updates**: Immediate notifications when new properties are added
- **Smart Filtering**: Only notifies about unsold properties

## How It Works

### 1. Saving a Search
1. User performs a search with filters (location, property type, price, etc.)
2. "Save This Search" button appears when search criteria are set
3. User clicks the button and enters a name for their search
4. Search criteria are saved to the database with user association

### 2. Automatic Monitoring
- Background service runs every 30 minutes
- Checks all active saved searches for all users
- Compares new properties against saved criteria
- Sends notifications for matches

### 3. Notification System
- **Local Notifications**: Immediate push notifications on device
- **Database Storage**: Notifications stored for in-app viewing
- **Smart Grouping**: Multiple matches summarized in single notification
- **Action Support**: Tapping notifications can navigate to properties

## Technical Implementation

### Database Collections

#### `savedSearches`
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

#### `notifications`
```typescript
interface NotificationData {
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
```

### Key Components

#### `SaveSearchModal.tsx`
- Modal for saving search criteria
- Displays current search parameters
- Validates user input
- Shows notification benefits

#### `NotificationService` (lib/notifications.ts)
- Manages all notification logic
- Background checking for saved searches
- Property matching algorithm
- Notification sending and storage

### Property Matching Algorithm

The system uses a comprehensive matching algorithm that checks:

1. **Location Match**: Case-insensitive partial matching on property address and name
2. **Property Type**: Exact match on property type (with "All" as wildcard)
3. **Price Range**: Property price within min/max range
4. **Bedrooms**: Property has at least the minimum number of bedrooms
5. **Bathrooms**: Property has at least the minimum number of bathrooms
6. **Availability**: Only matches unsold properties

### Example Matching Scenarios

#### Scenario 1: Downtown Apartment Search
- **Saved Criteria**: Location: "Downtown", Type: "Apartment", Price: $400k-$500k
- **New Property**: "Downtown Luxury Apartment" at $450k
- **Result**: ✅ Match - Notification sent

#### Scenario 2: Family Home Search
- **Saved Criteria**: Type: "House", Bedrooms: 3+, Price: $500k-$700k
- **New Property**: "Suburban Family House" with 4 beds at $650k
- **Result**: ✅ Match - Notification sent

#### Scenario 3: Beach Property Search
- **Saved Criteria**: Location: "Beach", Type: "Condos", Min Price: $800k
- **New Property**: "Beachfront Condo" at $850k
- **Result**: ✅ Match - Notification sent

## Usage Instructions

### For Users

1. **Perform a Search**:
   - Enter location in search bar
   - Select property type from filters
   - Set price range (if available in UI)

2. **Save the Search**:
   - Click "Save This Search" button
   - Enter a memorable name
   - Confirm to start receiving notifications

3. **Receive Notifications**:
   - Get push notifications for new matches
   - View detailed notifications in app
   - Tap notifications to view properties

### For Developers

#### Testing the Feature

1. **Run Test Script**:
   ```bash
   node scripts/test-save-search.js
   ```

2. **Add Test Data**:
   - Creates sample properties
   - Creates sample saved searches
   - Triggers notification testing

3. **Manual Testing**:
   - Search for properties with filters
   - Save searches through the UI
   - Check notification delivery

#### Customization

1. **Adjust Check Frequency**:
   ```typescript
   // In notifications.ts, modify the interval
   setInterval(async () => {
     // Check logic
   }, 30 * 60 * 1000); // 30 minutes
   ```

2. **Add New Criteria**:
   - Extend the `SavedSearch` interface
   - Update the matching algorithm
   - Modify the UI components

3. **Customize Notifications**:
   - Modify notification templates
   - Add new notification types
   - Customize notification channels

## Configuration

### Environment Variables
Ensure these Firebase environment variables are set:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

### Notification Permissions
The app automatically requests notification permissions on first launch. Users can:
- Grant permissions for full functionality
- Deny permissions (notifications won't work)
- Change permissions in device settings

## Troubleshooting

### Common Issues

1. **No Notifications Received**:
   - Check notification permissions
   - Verify saved searches are active
   - Check Firebase configuration

2. **Incorrect Matches**:
   - Review property data format
   - Check matching algorithm logic
   - Verify search criteria format

3. **Background Checking Not Working**:
   - Ensure app has background permissions
   - Check Firebase connection
   - Verify user authentication

### Debug Information

Enable debug logging by checking console output for:
- `🔍 Triggering saved search check`
- `✅ Saved search check completed`
- `📊 Found X matching properties`

## Future Enhancements

### Planned Features
- **Email Notifications**: Send email alerts in addition to push notifications
- **Advanced Filters**: More detailed search criteria (amenities, square footage, etc.)
- **Search Analytics**: Track search performance and user engagement
- **Smart Recommendations**: AI-powered property suggestions
- **Market Insights**: Price trends and market analysis

### Performance Optimizations
- **Caching**: Cache property data for faster matching
- **Batch Processing**: Process multiple searches efficiently
- **Indexing**: Database indexes for faster queries
- **Rate Limiting**: Prevent notification spam

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team. 