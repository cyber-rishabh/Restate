import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      console.log("Attempting sign up with:", email, password);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created:", user);
      // Store user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        uid: user.uid,
      });
      setSuccess(true);
    } catch (error: any) {
      console.log("Sign up error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="bg-white h-full justify-center items-center">
        <View className="w-4/5 items-center justify-center flex-1">
          <Text className="text-2xl font-rubik-bold text-primary-300 mb-6 text-center">Sign Up Successful!</Text>
          <Text className="text-lg text-black-300 mb-8 text-center">Your account has been created. You can now sign in.</Text>
          <TouchableOpacity onPress={() => router.replace("/sign-in")}
            className="bg-primary-300 rounded-full py-4 w-full">
            <Text className="text-lg font-rubik-medium text-white text-center">Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSignInRedirect = () => {
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="bg-white h-full justify-center items-center">
      <View className="w-4/5">
        <Text className="text-2xl font-rubik-bold text-black-300 mb-6 text-center">Sign Up</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        />
        <TouchableOpacity
          onPress={handleSignUp}
          className="bg-primary-300 rounded-full py-4"
          disabled={loading}
        >
          <Text className="text-lg font-rubik-medium text-white text-center">
            {loading ? "Signing Up..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignInRedirect}
          className="mt-4">
          <Text className="text-primary-300 text-center">Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SignUp; 