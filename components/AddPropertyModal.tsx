import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import icons from '@/constants/icons';
import { categories } from '@/constants/data';
import { addProperty } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import RNBlobUtil from 'react-native-blob-util';
import { LinearGradient } from 'expo-linear-gradient';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'property-photos';
const supabase = createClient(supabaseUrl, supabaseKey);

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onPropertyAdded: () => void;
}

const AddPropertyModal = ({ visible, onClose, onPropertyAdded }: AddPropertyModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price: '',
    type: 'Apartment',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
  });

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [customFacility, setCustomFacility] = useState('');
  const [showCustomImageInput, setShowCustomImageInput] = useState(false);
  const [images, setImages] = useState<string[]>([]); // For local image URIs
  const [isSubmitting, setIsSubmitting] = useState(false);


  const facilities = [
    'Wifi', 'Gym', 'Swimming pool', 'Car Parking', 'Laundry', 'Garden', 'Concierge'
  ];

  // Preset property images
  const presetImages = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
      label: 'Modern Apartment'
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=400&h=300&fit=crop',
      label: 'Luxury House'
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop',
      label: 'City View'
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
      label: 'Cozy Home'
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop',
      label: 'Villa'
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop',
      label: 'Penthouse'
    }
  ];

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImages(result.assets.map(asset => asset.uri));
    }
  };

  // Helper to upload base64 images to Supabase Edge Function
  const uploadImagesViaEdge = async (uris: string[]) => {
    const urls = [];
    for (const uri of uris) {
      try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        // POST to Edge Function with Authorization header
        const response = await fetch('https://wtbpozmsonugvmuoqkfw.supabase.co/functions/v1/upload-image', {
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
        if (!response.ok) {
          throw new Error('Edge Function upload error: ' + response.statusText);
        }
        const data = await response.json();
        if (!data.publicUrl) {
          throw new Error('No publicUrl returned from Edge Function');
        }
        urls.push(data.publicUrl);
      } catch (err) {
        console.error('Edge Function image upload error:', err);
        Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
        return [];
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate form
      if (!formData.name || !formData.address || !formData.price) {
        Alert.alert('Failed', 'Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      let galleryUrls: string[] = [];
      if (images.length > 0) {
        galleryUrls = await uploadImagesViaEdge(images);
        if (galleryUrls.length === 0) {
          setIsSubmitting(false);
          return; // Stop if upload failed
        }
      } else if (formData.image) {
        galleryUrls = [formData.image];
      }

      // Data validation: ensure all fields are serializable and not undefined
      const safeFacilities = Array.isArray(selectedFacilities) ? selectedFacilities.filter(Boolean) : [];
      const safeGallery = Array.isArray(galleryUrls)
        ? galleryUrls.filter(Boolean).map((url, idx) => ({ id: `${idx + 1}`, image: url }))
        : [];
      const safeImage = galleryUrls[0] || '';
      if (!safeImage) {
        Alert.alert('Failed', 'No image was uploaded.');
        setIsSubmitting(false);
        return;
      }

      const propertyData = {
        name: formData.name,
        address: formData.address,
        price: formData.price,
        rating: 4.5, // Default rating
        type: formData.type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 1,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 1,
        area: formData.area ? parseInt(formData.area) : 1000,
        image: safeImage,
        agent: {
          name: 'Demo Agent',
          email: 'demo@realestate.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        },
        facilities: safeFacilities,
        description: formData.description || 'Beautiful property with modern amenities.',
        reviews: [],
        gallery: safeGallery,

      };

      // Log the propertyData for debugging
      console.log('Submitting property to Firebase:', JSON.stringify(propertyData, null, 2));

      await addProperty(propertyData);
      console.log('Property added!');
      Alert.alert('Success', 'Property added successfully!');
      onPropertyAdded();
      onClose();
      // Reset form
      setFormData({
        name: '',
        address: '',
        price: '',
        type: 'Apartment',
        bedrooms: '',
        bathrooms: '',
        area: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
      });
      setImages([]);
      setSelectedFacilities([]);
      setShowCustomImageInput(false);
    } catch (error) {
      // Enhanced error logging
      console.error('Add Property Error:', error);
      if (error instanceof Error) {
        Alert.alert('Failed', error.message);
      } else if (typeof error === 'string') {
        Alert.alert('Failed', error);
      } else {
        Alert.alert('Failed', 'Failed to add property. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const selectImage = (imageUrl: string) => {
    setFormData({ ...formData, image: imageUrl });
    setShowCustomImageInput(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Gradient Header */}
        <LinearGradient colors={["#0061FF", "#4F8CFF"]} className="flex-row items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl">
          <TouchableOpacity onPress={onClose}>
            <Image source={icons.backArrow} className="w-6 h-6 tint-white" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-white">Add New Property</Text>
          <View className="w-6" />
        </LinearGradient>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            {/* Property Name */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Property Name *</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                <Image source={icons.home} className="w-5 h-5 mr-2 tint-primary-300" />
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter property name"
                  className="flex-1 py-3 text-base font-rubik bg-transparent"
                />
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Address *</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                <Image source={icons.location} className="w-5 h-5 mr-2 tint-primary-300" />
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter property address"
                  className="flex-1 py-3 text-base font-rubik bg-transparent"
                />

              </View>

            </View>

            {/* Price */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Price *</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                <Image source={icons.wallet} className="w-5 h-5 mr-2 tint-primary-300" />
                <TextInput
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="Enter price (e.g., 2,500)"
                  keyboardType="numeric"
                  className="flex-1 py-3 text-base font-rubik bg-transparent"
                />
              </View>
            </View>

            {/* Property Images */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Property Photos</Text>
              <View className="mb-3 flex-row flex-wrap">
                {images.length > 0 ? (
                  images.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} className="w-24 h-24 rounded-lg mr-2 mb-2" resizeMode="cover" />
                  ))
                ) : (
                  <Image source={{ uri: formData.image }} className="w-24 h-24 rounded-lg mr-2 mb-2" resizeMode="cover" />
                )}
              </View>
              <TouchableOpacity onPress={pickImages} className="bg-primary-100 rounded-lg p-3 border border-primary-200 mb-2">
                <Text className="text-primary-300 text-center font-rubik-medium">Select Photos</Text>
              </TouchableOpacity>
            </View>

            {/* Property Type */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Property Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category.category}
                      onPress={() => setFormData({ ...formData, type: category.category })}
                      className={`px-4 py-2 rounded-full ${
                        formData.type === category.category
                          ? 'bg-primary-300'
                          : 'bg-primary-100 border border-primary-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.type === category.category
                            ? 'text-white font-rubik-bold'
                            : 'text-black-300 font-rubik'
                        }`}
                      >
                        {category.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Bedrooms and Bathrooms */}
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-base font-rubik-medium text-black-300 mb-2">Bedrooms</Text>
                <TextInput
                  value={formData.bedrooms}
                  onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                  placeholder="2"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-rubik-medium text-black-300 mb-2">Bathrooms</Text>
                <TextInput
                  value={formData.bathrooms}
                  onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                  placeholder="2"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
                />
              </View>
            </View>

            {/* Area */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Area (sqft)</Text>
              <TextInput
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
                placeholder="1200"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter property description"
                multiline
                numberOfLines={4}
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
              />
            </View>

            {/* Facilities */}
            <View>
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Facilities</Text>
              <View className="flex-row flex-wrap space-x-2 space-y-2">
                {facilities.map((facility) => (
                  <TouchableOpacity
                    key={facility}
                    onPress={() => toggleFacility(facility)}
                    className={`px-3 py-2 rounded-full ${
                      selectedFacilities.includes(facility)
                        ? 'bg-primary-300'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedFacilities.includes(facility)
                          ? 'text-white font-rubik-bold'
                          : 'text-black-300 font-rubik'
                      }`}
                    >
                      {facility}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Custom facility input */}
              <View className="flex-row items-center mt-3">
                <TextInput
                  value={customFacility}
                  onChangeText={setCustomFacility}
                  placeholder="Add custom facility"
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-base font-rubik mr-2"
                />
                <TouchableOpacity
                  onPress={() => {
                    if (customFacility.trim() && !selectedFacilities.includes(customFacility.trim())) {
                      setSelectedFacilities([...selectedFacilities, customFacility.trim()]);
                      setCustomFacility('');
                    }
                  }}
                  className="bg-primary-300 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-rubik-bold">Add</Text>
                </TouchableOpacity>
              </View>
              {/* Show selected facilities as removable chips */}
              <View className="flex-row flex-wrap mt-2">
                {selectedFacilities.map((facility, idx) => (
                  <View key={facility + idx} className="flex-row items-center bg-primary-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-primary-300 font-rubik-medium mr-2">{facility}</Text>
                    <TouchableOpacity onPress={() => setSelectedFacilities(selectedFacilities.filter(f => f !== facility))}>
                      <Text className="text-primary-300 font-bold">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-primary-300 rounded-lg py-4 mt-6"
            disabled={isSubmitting}
          >
            <Text className="text-white text-center text-lg font-rubik-bold">
              {isSubmitting ? 'Adding...' : 'Add Property'}
            </Text>
          </TouchableOpacity>
        </ScrollView>


      </SafeAreaView>
    </Modal>
  );
};

export default AddPropertyModal; 