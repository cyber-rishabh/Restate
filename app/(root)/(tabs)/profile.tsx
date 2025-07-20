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
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [propertyAdded, setPropertyAdded] = useState(false); // Track if property was added
  const [selectedHelp, setSelectedHelp] = useState<number | null>(null); // For help Q&A
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
    if (title === "Notifications" && propertyAdded) setNotifModal(true);
    if (title === "Language") setLangModal(true);
    if (title === "Help Center") {
      setHelpModal(true);
      setSelectedHelp(null);
    }
  };

  const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0061FF&color=fff&size=256';

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Profile</Text>
          <Image source={icons.bell} className="size-5" />
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={{ uri: user?.avatar }}
              className="size-44 relative rounded-full"
            />
            <Text className="text-2xl font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        <View className="flex flex-col mt-10">
          {/* Removed My Bookings and Payments */}
        </View>

        {/* Favorites Section */}
        {favoriteProperties.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Favorites</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {favoriteProperties.map((p) => (
                <View key={p.id} style={{ width: 220, marginRight: 12, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 10 }}>
                  <Image source={{ uri: p.image }} style={{ width: 200, height: 120, borderRadius: 8, marginBottom: 6 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{p.name}</Text>
                  <Text style={{ color: '#666', fontSize: 14 }}>{p.address}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FF3B30', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginTop: 6 }}
                    onPress={() => removeFavorite(p.id!)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {/* Show profile picture above settings */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name || 'U')[0])}&background=0061FF&color=fff&size=256` }}
              style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#0061FF', backgroundColor: '#eee' }}
            />
            <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: 16 }}>{user?.name}</Text>
          </View>
          {settings.map((item, index) => (
            (item.title !== "Notifications" || propertyAdded) && (
              <SettingsItem
                key={index}
                {...item}
                onPress={() => handleSettingPress(item.title)}
              />
            )
          ))}
        </View>

        <View className="flex flex-col border-t mt-5 pt-5 border-primary-200">
          <SettingsItem
            icon={icons.logout}
            title="Logout"
            textStyle="text-danger"
            showArrow={false}
            onPress={handleLogout}
          />
        </View>
        {isAdmin && (
          <View style={{ marginTop: 32 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Admin: Sold Properties</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#0061FF', padding: 12, borderRadius: 8, marginBottom: 12 }}
              onPress={() => { fetchProperties(); setShowSoldModal(true); }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Mark Property as Sold</Text>
            </TouchableOpacity>
            {/* List of sold properties with 'Add Back' option */}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Sold Properties</Text>
            <ScrollView style={{ maxHeight: 120, marginBottom: 12 }}>
              {properties.filter(p => p.sold).map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, backgroundColor: '#f5f5f5', borderRadius: 6, marginBottom: 6 }}>
                  <Text>{p.name} ({p.address})</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#34C759', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 }}
                    onPress={() => handleMarkUnsold(p)}
                    disabled={unsoldLoading}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{unsoldLoading ? 'Adding...' : 'Add Back'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

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
            {/* Profile photo picker */}
            <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 16 }}>
              <Image
                source={{ uri: newPhoto || user?.avatar || defaultAvatar }}
                style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#0061FF', backgroundColor: '#eee' }}
                onError={({ nativeEvent }) => {
                  // fallback to default avatar if image fails to load
                  setNewPhoto(null);
                  // Optionally, you could set a state to force defaultAvatar
                }}
              />
              <Text style={{ color: '#0061FF', textAlign: 'center', marginTop: 4, fontSize: 13 }}>Change Photo</Text>
            </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default Profile;
