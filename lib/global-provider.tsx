import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    AsyncStorage.getItem('lastLogin').then(val => {
      if (val) setLastLoginState(Number(val));
    });
    AsyncStorage.getItem('favorites').then(val => {
      if (val) setFavorites(JSON.parse(val));
    });
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
        setUser({
          id: firebaseUser.uid,
          name,
          email: firebaseUser.email || "",
          avatar,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isLogged = !!user;

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
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
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      AsyncStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };
  const removeFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter(fav => fav !== id);
      AsyncStorage.setItem('favorites', JSON.stringify(updated));
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
