import { notificationService } from './notifications';

// Demo functions to test the notification system
export const demoNotifications = {
  // Send a new property notification
  sendNewPropertyNotification: async (userId: string) => {
    await notificationService.sendNewPropertyNotification(
      userId,
      'demo-property-1',
      'Luxury Downtown Apartment',
      750000
    );
  },

  // Send a price drop notification
  sendPriceDropNotification: async (userId: string) => {
    await notificationService.sendPriceDropNotification(
      userId,
      'demo-property-2',
      800000,
      750000
    );
  },

  // Send an open house notification
  sendOpenHouseNotification: async (userId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM
    
    await notificationService.sendOpenHouseNotification(
      userId,
      'demo-property-3',
      tomorrow,
      '123 Main St, Downtown'
    );
  },

  // Send a market update notification
  sendMarketUpdateNotification: async (userId: string) => {
    await notificationService.sendMarketUpdateNotification(
      userId,
      'Market prices in Downtown area increased by 5% this month. Great time to invest!'
    );
  },

  // Send an agent message notification
  sendAgentMessageNotification: async (userId: string) => {
    await notificationService.sendAgentMessageNotification(
      userId,
      'Sarah Johnson',
      'Hi! I found a perfect property that matches your criteria. Would you like to schedule a viewing?'
    );
  },

  // Send all demo notifications
  sendAllDemoNotifications: async (userId: string) => {
    try {
      // Send notifications with delays to avoid overwhelming
      await demoNotifications.sendNewPropertyNotification(userId);
      
      setTimeout(async () => {
        await demoNotifications.sendPriceDropNotification(userId);
      }, 2000);
      
      setTimeout(async () => {
        await demoNotifications.sendOpenHouseNotification(userId);
      }, 4000);
      
      setTimeout(async () => {
        await demoNotifications.sendMarketUpdateNotification(userId);
      }, 6000);
      
      setTimeout(async () => {
        await demoNotifications.sendAgentMessageNotification(userId);
      }, 8000);
      
      console.log('All demo notifications scheduled!');
    } catch (error) {
      console.error('Error sending demo notifications:', error);
    }
  },
}; 