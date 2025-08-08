import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from "@/lib/notifications";

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: () => void;
  login: (userData: User) => void;
  logout: () => void;
  lastLogin: number | null;
  setLastLogin: (time: number) => void;
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastLogin, setLastLoginState] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Helper function to get user-specific favorites key
  const getFavoritesKey = (userId: string) => `favorites_${userId}`;

  // Migration function to handle old global favorites
  const migrateOldFavorites = async (userId: string) => {
    try {
      // Check if there are old global favorites
      const oldFavorites = await AsyncStorage.getItem('favorites');
      if (oldFavorites) {
        const oldFavoritesArray = JSON.parse(oldFavorites);
        if (Array.isArray(oldFavoritesArray) && oldFavoritesArray.length > 0) {
          // Migrate old favorites to user-specific storage
          const favoritesKey = getFavoritesKey(userId);
          await AsyncStorage.setItem(favoritesKey, JSON.stringify(oldFavoritesArray));
          // Remove old global favorites
          await AsyncStorage.removeItem('favorites');
          console.log('Migrated old favorites to user-specific storage');
          return oldFavoritesArray;
        }
      }
      return null;
    } catch (error) {
      console.error('Error migrating old favorites:', error);
      return null;
    }
  };

  // Load favorites for a specific user
  const loadUserFavorites = async (userId: string) => {
    try {
      const favoritesKey = getFavoritesKey(userId);
      let storedFavorites = await AsyncStorage.getItem(favoritesKey);
      
      if (!storedFavorites) {
        // Try to migrate old favorites
        const migratedFavorites = await migrateOldFavorites(userId);
        if (migratedFavorites) {
          setFavorites(migratedFavorites);
          return;
        }
        setFavorites([]);
      } else {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading user favorites:', error);
      setFavorites([]);
    }
  };

  // Clear favorites when user logs out
  const clearFavorites = () => {
    setFavorites([]);
  };

  useEffect(() => {
    AsyncStorage.getItem('lastLogin').then(val => {
      if (val) setLastLoginState(Number(val));
    });
    
    // Initialize notification service
    notificationService.initialize();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try to get avatar from Firestore
        let avatar = firebaseUser.photoURL || "";
        let name = firebaseUser.displayName || firebaseUser.email || "User";
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.avatar) avatar = data.avatar;
            if (data.name) name = data.name;
          }
        } catch (e) {
          console.warn("Could not fetch user avatar from Firestore", e);
        }
        
        const userData = {
          id: firebaseUser.uid,
          name,
          email: firebaseUser.email || "",
          avatar,
        };
        
        setUser(userData);
        // Load user-specific favorites
        await loadUserFavorites(firebaseUser.uid);
        // Save push token for notifications
        await notificationService.savePushToken(firebaseUser.uid);
      } else {
        setUser(null);
        clearFavorites();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isLogged = !!user;

  const login = (userData: User) => {
    setUser(userData);
    // Load user-specific favorites when logging in
    loadUserFavorites(userData.id);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    clearFavorites();
  };

  const refetch = () => {
    // For now, just return the current user state
    // In the future, this could fetch user data from Firebase Auth
  };

  const setLastLogin = (time: number) => {
    setLastLoginState(time);
    AsyncStorage.setItem('lastLogin', String(time));
  };

  const addFavorite = (id: string) => {
    if (!user) return; // Don't add favorites if no user is logged in
    
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      // Store with user-specific key
      const favoritesKey = getFavoritesKey(user.id);
      AsyncStorage.setItem(favoritesKey, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = (id: string) => {
    if (!user) return; // Don't remove favorites if no user is logged in
    
    setFavorites((prev) => {
      const updated = prev.filter(fav => fav !== id);
      // Store with user-specific key
      const favoritesKey = getFavoritesKey(user.id);
      AsyncStorage.setItem(favoritesKey, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch,
        login,
        logout,
        lastLogin,
        setLastLogin,
        favorites,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error("useGlobalContext must be used within a GlobalProvider");

  return context;
};

export default GlobalProvider;
