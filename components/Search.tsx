import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Image, TextInput, Text } from "react-native";
import { useDebouncedCallback } from "use-debounce";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  Easing 
} from 'react-native-reanimated';

import icons from "@/constants/icons";
import { useLocalSearchParams, router, usePathname } from "expo-router";

const Search = () => {
  const path = usePathname();
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query);
  const [isFocused, setIsFocused] = useState(false);

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    router.setParams({ query: text });
  }, 500);

  const handleSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[animatedStyle]}
      className={`flex flex-row items-center justify-between w-full px-4 rounded-xl py-3 mt-5 ${
        isFocused 
          ? 'bg-white border-2 border-primary-300 shadow-lg' 
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <View className="flex-1 flex flex-row items-center justify-start z-50">
        <Image 
          source={icons.search} 
          className="size-5" 
          style={{ tintColor: isFocused ? '#0061FF' : '#666876' }}
        />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search for properties, locations..."
          placeholderTextColor="#666876"
          className="text-sm font-rubik text-black-300 ml-3 flex-1"
          style={{ fontSize: 16 }}
        />
      </View>
      {search && (
        <TouchableOpacity
          onPress={() => {
            setSearch('');
            debouncedSearch('');
          }}
          className="ml-2 p-1"
        >
          <View className="bg-gray-200 rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-gray-600 text-xs">✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default Search;
