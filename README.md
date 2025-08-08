# 🏠 Restate - Modern Real Estate App

<div align="center">
  <br />
  <h3 align="center">A Full-Stack Real Estate Application</h3>
  <p align="center">Built with React Native, Expo, and modern web technologies</p>
  
  <div>
    <img src="https://img.shields.io/badge/-Expo-black?style=for-the-badge&logoColor=white&logo=expo&color=000020" alt="expo" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-React_Native-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="react-native" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Firebase-black?style=for-the-badge&logoColor=white&logo=firebase&color=FFCA28" alt="firebase" />
  </div>
</div>

## 📋 Table of Contents

1. [🚀 Features](#-features)
2. [⚙️ Tech Stack](#️-tech-stack)
3. [🔧 Installation](#-installation)
4. [📱 Usage](#-usage)
5. [🏗️ Architecture](#️-architecture)
6. [🔔 Advanced Features](#-advanced-features)
7. [📚 Documentation](#-documentation)
8. [🤝 Contributing](#-contributing)

## 🚀 Features

### 🏠 **Core Real Estate Features**
- **Property Listings** - Browse comprehensive property listings with detailed information
- **Advanced Search & Filters** - Search by location, price, bedrooms, bathrooms, and property type
- **Property Details** - View detailed property information including images, amenities, and agent details
- **Agent Profiles** - Connect with real estate agents and view their listings
- **Property Reviews** - Read and write reviews for properties
- **Image Galleries** - High-quality property images with gallery view

### 🔔 **Smart Notifications System**
- **New Property Alerts** - Get notified when new properties match your criteria
- **Price Drop Alerts** - Receive notifications when properties drop in price
- **Open House Reminders** - Never miss an open house opportunity
- **Market Updates** - Stay informed about market trends and insights
- **Agent Messages** - Direct communication from real estate agents
- **Saved Search Alerts** - Automatic notifications for saved search criteria

### 💾 **Save Search Feature**
- **Save Search Criteria** - Save your search preferences for future use
- **Automatic Monitoring** - Background checking for new matching properties
- **Smart Notifications** - Get notified when new properties match your saved searches
- **Multiple Searches** - Save and manage multiple search criteria

### 🎨 **Modern UI/UX**
- **Responsive Design** - Works seamlessly across all device sizes
- **Dark/Light Mode** - Customizable theme preferences
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Intuitive Navigation** - Easy-to-use tab-based navigation
- **Loading States** - Professional loading indicators and skeleton screens

### 🔐 **Authentication & Security**
- **Google Authentication** - Secure sign-in with Google accounts
- **User Profiles** - Personalized user experience with profile management
- **Data Privacy** - Secure handling of user data and preferences

## ⚙️ Tech Stack

### **Frontend**
- **React Native** - Cross-platform mobile development
- **Expo SDK 52** - Development platform and tools
- **TypeScript** - Type-safe JavaScript development
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation library for React Native

### **Backend & Services**
- **Firebase** - Authentication, database, and cloud services
- **Supabase** - Additional backend services and functions
- **Appwrite** - Backend-as-a-Service for data management

### **UI & Styling**
- **Tailwind CSS** - Utility-first CSS framework
- **Expo Vector Icons** - Comprehensive icon library
- **React Native Reanimated** - Smooth animations
- **Expo Linear Gradient** - Beautiful gradient effects

### **Development Tools**
- **Expo Router** - File-based routing
- **Metro** - JavaScript bundler
- **Jest** - Testing framework
- **ESLint** - Code linting

## 🔧 Installation

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

### **Clone the Repository**
```bash
git clone https://github.com/your-username/restate.git
cd restate
```

### **Install Dependencies**
```bash
npm install
# or
yarn install
```

### **Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Appwrite Configuration (if using)
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_appwrite_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_appwrite_database_id
EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID=your_galleries_collection_id
EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID=your_reviews_collection_id
EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID=your_agents_collection_id
EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID=your_properties_collection_id

# Supabase Configuration (if using)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Start the Development Server**
```bash
npx expo start
```

This will open the Expo development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with Expo Go app on your phone

## 📱 Usage

### **For Users**

#### **Getting Started**
1. Download the app or run it in development mode
2. Sign in with your Google account
3. Grant notification permissions for the best experience
4. Start exploring properties!

#### **Browsing Properties**
1. **Home Tab** - View featured and recommended properties
2. **Explore Tab** - Search and filter properties by various criteria
3. **Profile Tab** - Manage your account and preferences

#### **Using Advanced Features**
1. **Save Searches** - Apply filters and save your search criteria
2. **Notifications** - Tap the bell icon to view and manage notifications
3. **Property Details** - Tap any property to view detailed information
4. **Contact Agents** - Reach out to agents directly from property pages

### **For Developers**

#### **Project Structure**
```
restate/
├── app/                    # Main application screens
│   ├── (tabs)/           # Tab-based navigation
│   ├── properties/       # Property-related screens
│   └── _layout.tsx      # Root layout
├── components/           # Reusable UI components
├── lib/                 # Utility functions and services
├── constants/           # App constants and data
├── assets/             # Images, fonts, and static assets
└── supabase/           # Supabase functions
```

#### **Key Components**
- `components/Search.tsx` - Advanced search functionality
- `components/NotificationCenter.tsx` - Notification management
- `components/SaveSearchModal.tsx` - Save search feature
- `lib/notifications.ts` - Notification service
- `lib/useAppwrite.ts` - Custom data fetching hook

## 🏗️ Architecture

### **Data Flow**
```
User Interface → Components → Services → Backend APIs → Database
```

### **State Management**
- **React Hooks** - Local component state
- **Custom Hooks** - Reusable state logic
- **Context API** - Global state management
- **Async Storage** - Local data persistence

### **API Integration**
- **Firebase** - Authentication and real-time database
- **Supabase** - Additional backend services
- **Appwrite** - Data management and storage
- **Custom Hooks** - Centralized data fetching

## 🔔 Advanced Features

### **Notification System**
The app includes a comprehensive notification system with:
- Real-time push notifications
- Background processing
- Smart filtering and grouping
- User preference management

### **Save Search Functionality**
Users can save their search criteria and receive automatic notifications when:
- New properties match their criteria
- Prices drop on properties they're interested in
- Open houses are scheduled for saved properties

### **Property Management**
- Comprehensive property listings
- Detailed property information
- Image galleries and virtual tours
- Agent contact information
- Review and rating system

## 📚 Documentation

### **Additional Documentation**
- [Save Search Feature](./SAVE_SEARCH_FEATURE.md) - Detailed guide on save search functionality
- [Notification System](./NOTIFICATION_SYSTEM.md) - Comprehensive notification system documentation

### **API Documentation**
The app integrates with multiple backend services:
- **Firebase** - Authentication and real-time features
- **Supabase** - Database and serverless functions
- **Appwrite** - Backend-as-a-Service

### **Testing**
```bash
# Run tests
npm test

# Test specific features
npm run test-properties
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### **Development Guidelines**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Code Style**
- Follow TypeScript best practices
- Use consistent formatting with Prettier
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)

---

<div align="center">
  <p>Made with ❤️ by the Restate Team</p>
  <p>If you find this project helpful, please give it a ⭐️</p>
</div>
