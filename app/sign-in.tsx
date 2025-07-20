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
} from "react-native";

import { Redirect, router } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function SignIn() {
  const { login, loading, isLogged } = useGlobalContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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
    <LinearGradient
      colors={["#e0e7ff", "#f0f4ff", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="h-full">
        <ScrollView contentContainerStyle={{ height: "100%" }}>
          <Image
            source={images.onboarding}
            className="w-full h-2/5"
            resizeMode="contain"
          />
          <View className="flex-1 px-6 mt-[-40]">
            <View className="bg-white/80 rounded-3xl shadow-lg shadow-black-100/70 px-6 py-8 backdrop-blur-md">
              <Text className="text-base text-center uppercase font-rubik text-black-200 tracking-widest">
                Welcome To Real Scout
              </Text>
              <Text className="text-4xl font-rubik-bold text-black-300 text-center mt-2 leading-tight drop-shadow-md">
                Let's Get You Closer To {"\n"}
                <Text className="text-primary-300">Your Ideal Home</Text>
              </Text>
              <Text className="text-lg font-rubik text-black-200 text-center mt-6 mb-2">
                Please sign in or sign up to continue
              </Text>
              {/* Email Input */}
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 mt-8 bg-white/90">
                <MaterialIcons name="email" size={22} color="#8C8E98" className="mr-2" />
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 font-rubik text-base"
                  placeholderTextColor="#8C8E98"
                />
              </View>
              {/* Password Input */}
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 mt-4 bg-white/90">
                <MaterialIcons name="lock" size={22} color="#8C8E98" className="mr-2" />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="flex-1 font-rubik text-base"
                  placeholderTextColor="#8C8E98"
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color="#8C8E98"
                  />
                </TouchableOpacity>
              </View>
              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                className="rounded-full w-full py-4 mt-6 mb-2"
                style={{
                  backgroundColor: signInLoading ? '#8C8E98' : '#0061FF',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  transform: [{ scale: signInLoading ? 0.98 : 1 }],
                }}
                activeOpacity={0.85}
                disabled={signInLoading}
              >
                <Text className="text-lg font-rubik-medium text-white text-center tracking-wide">
                  {signInLoading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>
              {/* Divider */}
              <View className="flex-row items-center my-2">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-3 text-gray-400 font-rubik text-sm">or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>
              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                className="rounded-full w-full py-4 border border-primary-300 bg-white/80"
                style={{
                  shadowColor: '#0061FF',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
                activeOpacity={0.85}
              >
                <Text className="text-lg font-rubik-medium text-primary-300 text-center tracking-wide">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

