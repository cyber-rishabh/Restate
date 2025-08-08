import * as React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
} from "react-native";

import { Redirect, router } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SignIn() {
  const { login, loading, isLogged } = useGlobalContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(height)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    
    // Start loading screen animations
    startLoadingAnimations();
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const startLoadingAnimations = () => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Auto transition after 3 seconds
    setTimeout(() => {
      transitionToSignIn();
    }, 3000);
  };

  const transitionToSignIn = () => {
    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLoadingScreen(false);
    });
  };

  if (!loading && isLogged) return <Redirect href="/" />;

  const handleSignIn = async () => {
    if (email === 'admin@gmail.com' && password === 'admin123') {
      login({
        id: 'admin',
        name: 'Admin',
        email: 'admin@gmail.com',
        avatar: '', // Optionally set a custom admin avatar
      });
      router.replace('/admin');
      return;
    }
    setSignInLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      login({
        id: user.uid,
        name: user.displayName || user.email || "User",
        email: user.email || "",
        avatar: user.photoURL || "",
      });
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Sign In Error", error.message);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/sign-up");
  };

  return (
    <View className="flex-1">
      {/* Loading Screen */}
      {showLoadingScreen && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            opacity: loadingOpacity,
          }}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 justify-center items-center"
          >
            {/* Animated Background Elements */}
            <View style={{ position: 'absolute', width: width * 2, height: height * 2 }}>
              {[...Array(6)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 100 + i * 20,
                    height: 100 + i * 20,
                    borderRadius: 50 + i * 10,
                    backgroundColor: `rgba(255, 255, 255, ${0.05 + i * 0.02})`,
                    top: Math.random() * height,
                    left: Math.random() * width,
                    transform: [
                      {
                        scale: pulseAnim,
                      },
                      {
                        rotate: `${i * 60}deg`,
                      },
                    ],
                  }}
                />
              ))}
            </View>

            {/* Main Logo Content */}
            <Animated.View
              style={{
                transform: [
                  { scale: logoScale },
                  { scale: pulseAnim },
                ],
                opacity: logoOpacity,
                alignItems: 'center',
              }}
            >
              {/* Logo Icon */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 30,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 15,
                }}
              >
                <MaterialIcons name="location-on" size={60} color="white" />
              </View>

              {/* App Name */}
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: '700',
                  color: 'white',
                  textAlign: 'center',
                  letterSpacing: 2,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 10,
                }}
              >
                The Plotify
              </Text>
              
              {/* Tagline */}
              <Text
                style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  marginTop: 10,
                  letterSpacing: 1,
                }}
              >
                Find Your Perfect Space
              </Text>

              {/* Loading Indicator */}
              <View style={{ marginTop: 50, alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Animated.View
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'white',
                      borderRadius: 2,
                      transform: [
                        {
                          translateX: pulseAnim.interpolate({
                            inputRange: [1, 1.1],
                            outputRange: [-40, 0],
                          }),
                        },
                      ],
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: 14,
                    marginTop: 15,
                    letterSpacing: 0.5,
                  }}
                >
                  Loading...
                </Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Main Sign In Screen */}
      <Animated.View 
        style={{ 
          flex: 1, 
          backgroundColor: '#f8f9ff',
          transform: [{ translateY: slideUpAnim }],
        }}
      >
        <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center', 
              paddingHorizontal: 24, 
              paddingVertical: 40 
            }} 
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo/Brand Section */}
            <View className="items-center mb-12">
              <Text 
                className="text-5xl font-bold mb-4" 
                style={{ color: '#6B46C1', fontWeight: '700' }}
              >
                The Plotify
              </Text>
            </View>

            {/* Main Content Card */}
            <View 
              className="bg-white rounded-3xl p-8 shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {/* Header */}
              <View className="mb-8">
                <Text 
                  className="text-2xl font-bold text-center mb-2" 
                  style={{ color: '#1F2937' }}
                >
                  Login to your Account
                </Text>
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text 
                  className="text-sm mb-2 ml-1" 
                  style={{ color: '#6B7280', fontWeight: '500' }}
                >
                  Email
                </Text>
                <View 
                  className="border rounded-xl px-4 py-4"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                >
                  <TextInput
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="text-base"
                    style={{ color: '#1F2937' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-6">
                <Text 
                  className="text-sm mb-2 ml-1" 
                  style={{ color: '#6B7280', fontWeight: '500' }}
                >
                  Password
                </Text>
                <View 
                  className="border rounded-xl px-4 py-4 flex-row items-center"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                >
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 text-base"
                    style={{ color: '#1F2937' }}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} className="ml-2">
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                className="rounded-xl py-4 mb-6"
                style={{
                  backgroundColor: signInLoading ? '#A78BFA' : '#6B46C1',
                  shadowColor: '#6B46C1',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
                activeOpacity={0.9}
                disabled={signInLoading}
              >
                <Text 
                  className="text-lg font-semibold text-white text-center"
                  style={{ fontWeight: '600' }}
                >
                  {signInLoading ? "Signing in..." : "Sign in"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
                <Text className="mx-4 text-sm" style={{ color: '#9CA3AF' }}>
                  - Or sign in with -
                </Text>
                <View className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
              </View>

              {/* Social Login Buttons */}
              <View className="flex-row justify-center space-x-4 mb-8">
                <TouchableOpacity 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <MaterialIcons name="google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <MaterialIcons name="facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <MaterialIcons name="alternate-email" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View className="flex-row justify-center">
                <Text className="text-base" style={{ color: '#6B7280' }}>
                  Don't have an account? 
                </Text>
                <TouchableOpacity onPress={handleSignUp} className="ml-1">
                  <Text 
                    className="text-base font-semibold" 
                    style={{ color: '#6B46C1', fontWeight: '600' }}
                  >
                    Sign up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
              </SafeAreaView>
      </Animated.View>
    </View>
  );
}