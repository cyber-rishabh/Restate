import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Config:', {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('🔥 Firebase initialized successfully');

export { app, db, auth, storage };

export interface Property {
  id?: string;
  name: string;
  address: string;
  price: string;
  rating?: number; // Now optional, calculated from reviews
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  agent: {
    name: string;
    email: string;
    avatar: string;
  };
  facilities: string[];
  description: string;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    public?: boolean;
    user: {
      name: string;
      avatar: string;
      email: string;
    };
  }>;
  gallery: Array<{
    id: string;
    image: string;
  }>;
  createdAt?: Date;
  sold?: boolean;
  owner?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const addProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'properties'), {
    ...propertyData,
    createdAt: new Date()
  });
  return { id: docRef.id, ...propertyData };
};

export const uploadImagesToFirebase = async (uris: string[]) => {
  const urls = [];
  for (const uri of uris) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `properties/${Date.now()}-${Math.random()}.jpg`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    urls.push(downloadURL);
  }
  return urls;
};

export const getProperties = async (filter?: string, searchQuery?: string, limitCount?: number, includeSold?: boolean) => {
  console.log('🔥 Firebase: Getting properties with filter:', filter, 'search:', searchQuery, 'limit:', limitCount, 'includeSold:', includeSold);
  
  try {
    let q = collection(db, 'properties');
    let constraints: any[] = [];

    if (filter && filter !== 'All') {
      constraints.push(where('type', '==', filter));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    // Only apply limit if there is no search query
    if (!searchQuery && limitCount) {
      constraints.push(limitFn(limitCount));
    }

    const qRef = constraints.length ? query(q, ...constraints) : q;
    console.log('🔥 Firebase: Executing query with constraints:', constraints.length);
    
    const querySnapshot = await getDocs(qRef);
    console.log('🔥 Firebase: Query returned', querySnapshot.size, 'documents');

    let properties: Property[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🔥 Firebase: Document data:', doc.id, data);
      properties.push({ id: doc.id, ...data } as Property);
    });

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      properties = properties.filter(property =>
        property.name.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.type.toLowerCase().includes(searchTerm)
      );
    }

    // Filter out sold properties unless includeSold is true
    if (!includeSold) {
      properties = properties.filter(property => !property.sold);
    }

    console.log('🔥 Firebase: Returning', properties.length, 'properties');
    return properties;
  } catch (error) {
    console.error('🔥 Firebase: Error getting properties:', error);
    throw error;
  }
};

export const getPropertyById = async (id: string) => {
  console.log('🔥 Firebase: Getting property by ID:', id);
  
  try {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('🔥 Firebase: Property found:', data);
      return { id: docSnap.id, ...data } as Property;
    }
    console.log('🔥 Firebase: Property not found for ID:', id);
    return null;
  } catch (error) {
    console.error('🔥 Firebase: Error getting property by ID:', error);
    throw error;
  }
};

export const getLatestProperties = async () => {
  console.log('🔥 Firebase: Getting latest properties');
  
  try {
    const qRef = query(
      collection(db, 'properties'),
      orderBy('createdAt', 'desc'),
      limitFn(3)
    );
    const querySnapshot = await getDocs(qRef);
    console.log('🔥 Firebase: Latest query returned', querySnapshot.size, 'documents');
    
    const properties: Property[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🔥 Firebase: Latest document data:', doc.id, data);
      properties.push({ id: doc.id, ...data } as Property);
    });
    
    console.log('🔥 Firebase: Returning', properties.length, 'latest properties');
    return properties;
  } catch (error) {
    console.error('🔥 Firebase: Error getting latest properties:', error);
    throw error;
  }
}; 

export const deleteProperty = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'properties', id));
    console.log('🔥 Firebase: Property deleted:', id);
  } catch (error) {
    console.error('🔥 Firebase: Error deleting property:', error);
    throw error;
  }
}; 

export const markPropertyAsSold = async (id: string, owner: { name: string; email: string; avatar?: string }) => {
  const docRef = doc(db, 'properties', id);
  await updateDoc(docRef, { sold: true, owner });
}; 

export const markPropertyAsUnsold = async (id: string) => {
  const docRef = doc(db, 'properties', id);
  await updateDoc(docRef, { sold: false, owner: null });
}; 

export const addReviewToProperty = async (propertyId: string, review: { rating: number; comment: string; user: { name: string; avatar: string; email: string; } }) => {
  const docRef = doc(db, 'properties', propertyId);
  const reviewWithId = { ...review, id: `${Date.now()}-${Math.random()}`, public: false };
  await updateDoc(docRef, { reviews: arrayUnion(reviewWithId) });
};

export const approveReview = async (propertyId: string, reviewId: string) => {
  const docRef = doc(db, 'properties', propertyId);
  const propertySnap = await getDoc(docRef);
  if (!propertySnap.exists()) return;
  const property = propertySnap.data() as Property;
  const updatedReviews = property.reviews.map(r => r.id === reviewId ? { ...r, public: true } : r);
  await updateDoc(docRef, { reviews: updatedReviews });
};

export const getAverageRating = (property: Property) => {
  if (!property.reviews || property.reviews.length === 0) return 0;
  const ratings = property.reviews.map(r => r.rating);
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}; 