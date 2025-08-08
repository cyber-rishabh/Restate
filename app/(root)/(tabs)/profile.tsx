import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { useGlobalContext } from "@/lib/global-provider";
import { useRouter } from 'expo-router';

import icons from "@/constants/icons";
import { settings } from "@/constants/data";
import React, { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/firebase';
import { getProperties, markPropertyAsSold, markPropertyAsUnsold, Property } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import images from '@/constants/images';
import { demoNotifications } from '@/lib/notification-demo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemProp) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex flex-row items-center justify-between py-3"
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>

    {showArrow && <Image source={icons.rightArrow} className="size-5" />}
  </TouchableOpacity>
);

const Profile = () => {
  const { user, login, logout, favorites, removeFavorite } = useGlobalContext();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [favoritesModal, setFavoritesModal] = useState(false); // New favorites modal
  const [propertyAdded, setPropertyAdded] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<number | null>(null);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showUnsoldModal, setShowUnsoldModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [soldLoading, setSoldLoading] = useState(false);
  const [unsoldLoading, setUnsoldLoading] = useState(false);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);

  useEffect(() => {
    // Fetch favorite properties on mount or when favorites change
    if (favorites.length > 0) {
      getProperties(undefined, undefined, undefined, true).then(props => {
        setFavoriteProperties(props.filter(p => p.id && favorites.includes(p.id)));
      }).catch(error => {
        console.error('Error fetching favorite properties:', error);
        setFavoriteProperties([]);
      });
    } else {
      setFavoriteProperties([]);
    }
  }, [favorites]);

  // Assume admin is determined by email
  const isAdmin = user?.email === 'admin@gmail.com';

  const fetchProperties = async () => {
    try {
      const props = await getProperties(undefined, undefined, undefined, true); // includeSold = true
      setProperties(props);
    } catch (e) {
      Alert.alert('Error', 'Failed to load properties');
    }
  };

  const handleMarkSold = async () => {
    if (!selectedProperty || !ownerName || !ownerEmail) return;
    setSoldLoading(true);
    try {
      await markPropertyAsSold(selectedProperty.id!, { name: ownerName, email: ownerEmail });
      Alert.alert('Success', 'Property marked as sold!');
      setShowSoldModal(false);
      setOwnerName('');
      setOwnerEmail('');
      setSelectedProperty(null);
      fetchProperties();
    } catch (e) {
      Alert.alert('Error', 'Failed to mark property as sold.');
    } finally {
      setSoldLoading(false);
    }
  };

  const handleMarkUnsold = async (property: Property) => {
    setUnsoldLoading(true);
    try {
      await markPropertyAsUnsold(property.id!);
      Alert.alert('Success', 'Property added back to listings!');
      fetchProperties();
    } catch (e) {
      Alert.alert('Error', 'Failed to add property back.');
    } finally {
      setUnsoldLoading(false);
    }
  };

  const languages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Hindi", "Arabic", "Portuguese", "Russian"
  ];
  const helpOptions = [
    {
      question: "How to add a property?",
      answer: "Go to the home screen and tap the 'Add Property' button. Fill in the details and submit."
    },
    {
      question: "How to edit my profile?",
      answer: "Go to your profile, tap the edit icon, and update your name or photo."
    },
    {
      question: "How to contact support?",
      answer: "Email us at support@restate.com or use the contact form in the app."
    },
    {
      question: "How to reset password?",
      answer: "On the sign-in screen, tap 'Forgot Password' and follow the instructions."
    },
    {
      question: "How to delete my account?",
      answer: "Contact support to request account deletion."
    }
  ];

  const handleEditPress = () => {
    setNewName(user?.name || "");
    setNewPhoto(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let photoURL = user?.avatar || "";
    try {
      if (newPhoto) {
        // Upload new photo to Supabase via Edge Function (base64)
        console.log('Uploading profile photo to Supabase via Edge Function:', newPhoto);
        const base64 = await FileSystem.readAsStringAsync(newPhoto, { encoding: FileSystem.EncodingType.Base64 });
        const fileExt = newPhoto.split('.').pop() || 'jpg';
        const fileName = `avatar-${user?.id || Date.now()}.${fileExt}`;
        const response = await fetch('https://wtbpozmsonugvmuoqkfw.supabase.co/functions/v1/agent-avatars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            fileName,
            base64,
            contentType: `image/${fileExt}`,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.publicUrl) {
          console.error('Supabase Edge Function upload error:', data.error || response.statusText);
          Alert.alert('Error', 'Failed to upload profile photo.');
        } else {
          photoURL = data.publicUrl + '?v=' + Date.now();
            console.log('Supabase profile photo public URL:', photoURL);
          Alert.alert('Success', 'Profile photo updated successfully!');
          // Save avatar and name in Firestore users collection
          if (auth.currentUser) {
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
              name: newName,
              avatar: photoURL,
              email: auth.currentUser.email,
            }, { merge: true });
          }
        }
      }
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: newName,
          photoURL,
        });
        // Update context
        login({
          ...user!,
          name: newName,
          avatar: photoURL,
        });
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      Alert.alert("Success", "Logged out successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleSettingPress = (title: string) => {
    if (title === "Profile") {
      setNewName(user?.name || "");
      setModalVisible(true);
    }
    if (title === "Favorites") {
      setFavoritesModal(true);
    }
    if (title === "Notifications" && propertyAdded) setNotifModal(true);
    if (title === "Language") setLangModal(true);
    if (title === "Help Center") {
      setHelpModal(true);
      setSelectedHelp(null);
    }
    if (title === "Test Notifications") {
      if (user) {
        demoNotifications.sendAllDemoNotifications(user.id);
        Alert.alert('Demo Notifications', 'Demo notifications will be sent over the next 10 seconds!');
      }
    }
  };

  const defaultAvatar = images.avatar;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1 px-6">
          <View className="flex flex-row items-center justify-between mt-5">
            <Text className="text-xl font-rubik-bold">Profile</Text>
          </View>

          {/* Removed topmost user photo for cleaner UI */}

          <View className="flex flex-col mt-10">
            {/* Removed My Bookings and Payments */}
          </View>

          {/* Removed Favorites Section - now handled in modal */}

          {/* Sold Properties Section - moved above settings for visibility */}
          {isAdmin && (
            <View style={{ marginTop: 16, marginBottom: 32 }}>
              <View style={{ borderBottomWidth: 1, borderColor: '#e0e7ff', marginBottom: 18 }} />
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 12, color: '#191D31', letterSpacing: 0.2 }}>Sold Properties</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#0061FF', padding: 14, borderRadius: 12, marginBottom: 18, alignItems: 'center', shadowColor: '#0061FF', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
                onPress={() => { fetchProperties(); setShowSoldModal(true); }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.2 }}>Mark Property as Sold</Text>
              </TouchableOpacity>
              {properties.filter(p => p.sold).length === 0 ? (
                <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginTop: 12 }}>No sold properties yet.</Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {properties.filter(p => p.sold).map((p) => (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f8fa', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1, marginBottom: 2 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#191D31', marginBottom: 2 }}>{p.name}</Text>
                        <Text style={{ color: '#666', fontSize: 14, marginBottom: 2 }}>{p.address}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 13, marginRight: 8 }}>SOLD</Text>
                          <Image source={icons.star} style={{ width: 16, height: 16, tintColor: '#FF3B30' }} />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: '#34C759', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, marginLeft: 10 }}
                        onPress={() => handleMarkUnsold(p)}
                        disabled={unsoldLoading}
                        activeOpacity={0.85}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{unsoldLoading ? 'Adding...' : 'Add Back'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
            {/* Show profile picture above settings */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={defaultAvatar}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#0061FF', backgroundColor: '#eee' }}
              />
              <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: 16 }}>{user?.name}</Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => router.replace('/admin')}
                  className="bg-primary-300 rounded-xl py-3 px-6 mt-4 mb-2 flex-row items-center justify-center shadow-md"
                  activeOpacity={0.85}
                >
                  <Image source={icons.edit} className="w-5 h-5 mr-2 tint-white" />
                  <Text className="text-white text-lg font-rubik-bold">Go to Admin Panel</Text>
                </TouchableOpacity>
              )}
              {/* Logout button - always visible below profile info */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 rounded-xl py-3 px-6 mt-4 mb-4 flex-row items-center justify-center shadow-md"
                activeOpacity={0.85}
                style={{ maxWidth: 400 }}
              >
                <Image source={icons.logout} className="w-5 h-5 mr-2 tint-white" />
                <Text className="text-white text-lg font-rubik-bold">Logout</Text>
              </TouchableOpacity>
            </View>
            
            {/* Settings Menu - Always visible */}
            <SettingsItem
              icon={icons.person}
              title="Profile"
              onPress={() => handleSettingPress("Profile")}
            />
            
            <SettingsItem
              icon={icons.heart}
              title="Favorites"
              onPress={() => handleSettingPress("Favorites")}
              textStyle={favorites.length > 0 ? "text-red-500" : ""}
            />
            
            <SettingsItem
              icon={icons.language}
              title="Language"
              onPress={() => handleSettingPress("Language")}
            />
            
            <SettingsItem
              icon={icons.info}
              title="Help Center"
              onPress={() => handleSettingPress("Help Center")}
            />
            
            {/* Test Notifications Button */}
            {user && (
              <SettingsItem
                icon={icons.bell}
                title="Test Notifications"
                onPress={() => handleSettingPress("Test Notifications")}
                textStyle="text-blue-600"
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Favorites Modal */}
      <Modal
        visible={favoritesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFavoritesModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-2xl w-96 max-h-96">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-rubik-bold">My Favorites</Text>
              <TouchableOpacity onPress={() => setFavoritesModal(false)}>
                <Text className="text-primary-500 font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            {favoriteProperties.length === 0 ? (
              <Text className="text-center text-gray-500 mb-4">No favorites yet. Add properties to your favorites to see them here.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {favoriteProperties.map((property) => (
                  <View key={property.id} className="flex-row items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <Image source={{ uri: property.image }} className="w-16 h-16 rounded-lg mr-3" />
                    <View className="flex-1">
                      <Text className="font-rubik-bold text-black-300">{property.name}</Text>
                      <Text className="text-sm text-gray-500">{property.address}</Text>
                      <Text className="text-primary-300 font-rubik-bold">${property.price}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFavorite(property.id!)}
                      className="bg-red-500 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-white text-sm font-rubik-bold">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-2xl w-80">
            <Text className="text-xl font-rubik-bold mb-4">Edit Profile</Text>
            {/* Profile photo picker - replaced with default avatar */}
            <View style={{ alignSelf: 'center', marginBottom: 16 }}>
              <Image
                source={defaultAvatar}
                style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#0061FF', backgroundColor: '#eee' }}
              />
            </View>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              className="border border-primary-200 rounded-lg px-3 py-2 mb-4"
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={loading}>
                <Text className="text-black-300">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-primary-500 font-bold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Notifications Modal */}
      <Modal
        visible={notifModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotifModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-2xl w-80">
            <Text className="text-xl font-rubik-bold mb-4">Notifications</Text>
            <Text className="mb-4">A new property has been added.</Text>
            <TouchableOpacity onPress={() => setNotifModal(false)}>
              <Text className="text-primary-500 font-bold text-right">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Language Modal */}
      <Modal
        visible={langModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLangModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-2xl w-80">
            <Text className="text-xl font-rubik-bold mb-4">Select Language</Text>
            {languages.map((lang, idx) => (
              <Text key={idx} className="mb-2 text-lg">{lang}</Text>
            ))}
            <TouchableOpacity onPress={() => setLangModal(false)}>
              <Text className="text-primary-500 font-bold text-right mt-2">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Help Center Modal */}
      <Modal
        visible={helpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-6 rounded-2xl w-80">
            <Text className="text-xl font-rubik-bold mb-4">Help Center</Text>
            {selectedHelp === null ? (
              helpOptions.map((opt, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedHelp(idx)}>
                  <Text className="mb-2 text-lg text-primary-500">{opt.question}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View>
                <Text className="mb-2 text-lg font-bold">{helpOptions[selectedHelp].question}</Text>
                <Text className="mb-4 text-base">{helpOptions[selectedHelp].answer}</Text>
                <TouchableOpacity onPress={() => setSelectedHelp(null)}>
                  <Text className="text-primary-500 font-bold text-right mt-2">Back</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setHelpModal(false)}>
              <Text className="text-primary-500 font-bold text-right mt-2">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Sold Modal */}
      {isAdmin && showSoldModal && (
        <Modal visible={showSoldModal} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Mark Property as Sold</Text>
              <Text style={{ marginBottom: 8 }}>Select Property:</Text>
              <ScrollView style={{ maxHeight: 120, marginBottom: 12 }}>
                {properties.filter(p => !p.sold).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={{ padding: 8, backgroundColor: selectedProperty?.id === p.id ? '#e0e7ff' : '#f5f5f5', borderRadius: 6, marginBottom: 6 }}
                    onPress={() => setSelectedProperty(p)}
                  >
                    <Text>{p.name} ({p.address})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                placeholder="Owner Name"
                value={ownerName}
                onChangeText={setOwnerName}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8 }}
              />
              <TextInput
                placeholder="Owner Email"
                value={ownerEmail}
                onChangeText={setOwnerEmail}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 16 }}
                keyboardType="email-address"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#ccc', padding: 10, borderRadius: 6, flex: 1, marginRight: 8 }}
                  onPress={() => setShowSoldModal(false)}
                  disabled={soldLoading}
                >
                  <Text style={{ textAlign: 'center' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#0061FF', padding: 10, borderRadius: 6, flex: 1 }}
                  onPress={handleMarkSold}
                  disabled={soldLoading || !selectedProperty || !ownerName || !ownerEmail}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>{soldLoading ? 'Saving...' : 'Mark as Sold'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default Profile;
