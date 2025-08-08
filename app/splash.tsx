// app/splash.tsx
import * as React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useGlobalContext } from '@/lib/global-provider';
import { useEffect, useRef } from 'react';

export default function SplashScreen() {
  const { loading, isLogged } = useGlobalContext();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.stagger(200, [
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (!loading && isLogged) return <Redirect href="/" />;
  if (!loading && !isLogged) return <Redirect href="/sign-in" />;

  return (
    <LinearGradient
      colors={['#3F51B5', '#5C6BC0', '#7986CB']}
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <Text style={styles.logo}>cignifi</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
          <Animated.View style={[styles.dot, { opacity: Animated.add(dotOpacity, -0.3) }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Rubik-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    marginHorizontal: 6,
  },
});