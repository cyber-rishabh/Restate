import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, ScrollView, TouchableOpacity } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  Easing,
  withSequence
} from 'react-native-reanimated';

import { categories } from "@/constants/data";

const AnimatedFilterButton = ({ 
  item, 
  index, 
  isSelected, 
  onPress 
}: {
  item: any;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * 100;
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        className={`flex flex-col items-start mr-4 px-4 py-3 rounded-full ${
          isSelected
            ? "bg-primary-300 shadow-lg"
            : "bg-white border border-gray-200 shadow-sm"
        }`}
        style={{
          shadowColor: isSelected ? '#0061FF' : '#000',
          shadowOpacity: isSelected ? 0.3 : 0.1,
          shadowRadius: isSelected ? 8 : 4,
          shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
          elevation: isSelected ? 6 : 2,
        }}
      >
        <Text
          className={`text-sm font-rubik-medium ${
            isSelected
              ? "text-white"
              : "text-black-300"
          }`}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Filters = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    params.filter || "All"
  );

  const handleCategoryPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      router.setParams({ filter: "" });
      return;
    }

    setSelectedCategory(category);
    router.setParams({ filter: category });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3 mb-2"
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      {categories.map((item, index) => (
        <AnimatedFilterButton
          key={index}
          item={item}
          index={index}
          isSelected={selectedCategory === item.category}
          onPress={() => handleCategoryPress(item.category)}
        />
      ))}
    </ScrollView>
  );
};

export default Filters;
