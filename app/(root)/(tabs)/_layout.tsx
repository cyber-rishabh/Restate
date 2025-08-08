import React from 'react';
import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, Text, View } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.6, { duration: 200 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle]} className="flex-1 mt-3 flex flex-col items-center">
      <Image
        source={icon}
        tintColor={focused ? "#0061FF" : "#666876"}
        resizeMode="contain"
        className="size-6"
      />
      <Text
        className={`${
          focused
            ? "text-primary-300 font-rubik-medium"
            : "text-black-200 font-rubik"
        } text-xs w-full text-center mt-1`}
      >
        {title}
      </Text>
    </Animated.View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "white",
          position: "absolute",
          borderTopColor: "#E9ECEF",
          borderTopWidth: 1,
          minHeight: 80,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 },
          elevation: 10,
        },
        tabBarActiveTintColor: "#0061FF",
        tabBarInactiveTintColor: "#666876",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Explore" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
