// app/properties/[id].tsx
import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, ScrollView, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getPropertyById, Property, getAverageRating, addReviewToProperty } from "@/lib/firebase";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";
import { useGlobalContext } from '@/lib/global-provider';
import MortgageCalculator from "@/components/MortgageCalculator";
import PropertyReviews from "@/components/PropertyReviews";
import CommunityForums from "@/components/CommunityForums";
import PropertySharing from "@/components/PropertySharing";
import { 
  AnimatedButton, 
  AnimatedModal, 
  AnimatedSkeleton 
} from "@/components/AnimatedComponents";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

export default function PropertyDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { user, favorites, addFavorite, removeFavorite } = useGlobalContext();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showMortgageCalculator, setShowMortgageCalculator] = useState(false);
  const [showPropertyReviews, setShowPropertyReviews] = useState(false);
  const [showCommunityForums, setShowCommunityForums] = useState(false);
  const [showPropertySharing, setShowPropertySharing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(1); // No fade-in
  const headerTranslateY = useSharedValue(0); // No slide
  const contentOpacity = useSharedValue(1); // No fade-in
  const contentTranslateY = useSharedValue(0); // No slide

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPropertyById(id as string)
      .then((data) => {
        setProperty(data);
        setError(null);
        // Set header title to property name
        if (data && data.name && navigation && navigation.setOptions) {
          navigation.setOptions({ title: data.name });
        }
        // Remove heavy animations for mobile
        headerOpacity.value = 1;
        headerTranslateY.value = 0;
        contentOpacity.value = 1;
        contentTranslateY.value = 0;
      })
      .catch(() => {
        setError("Failed to load property");
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <AnimatedSkeleton width={width - 40} height={300} style={{ borderRadius: 20, marginBottom: 20 }} />
        <AnimatedSkeleton width={width - 40} height={200} style={{ borderRadius: 16, marginBottom: 16 }} />
        <AnimatedSkeleton width={width - 40} height={150} style={{ borderRadius: 16 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <Text>Property not found.</Text>
      </View>
    );
  }

  // Check if property is favorited
  const isFavorited = property && property.id ? favorites.includes(property.id) : false;

  // Check if user has already rated
  const userHasRated = !!(property && user && property.reviews.some(r => r.user.email === user.email));

  // Handle rating submit
  const handleRate = async () => {
    if (!property || !user || !userRating) return;
    setRatingSubmitting(true);
    await addReviewToProperty(property.id!, { rating: userRating, comment: '', user: { name: user.name, avatar: user.avatar, email: user.email } });
    setRatingSubmitting(false);
    // Optionally, refetch property details to update average
    getPropertyById(property.id!).then(setProperty);
  };

  const handleFavoritePress = () => {
    if (!property.id) return;
    if (isFavorited) {
      removeFavorite(property.id);
    } else {
      addFavorite(property.id);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      {/* Property Gallery (Multiple Photos) */}
      {property.gallery && property.gallery.length > 0 && (
        <View style={{ width: '100%', height: 260, marginBottom: 8 }}>
          <FlatList
            data={property.gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.image }} style={{ width, height: 260, resizeMode: 'cover' }} />
            )}
            onMomentumScrollEnd={e => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setGalleryIndex(index);
            }}
          />
          {/* Dots indicator */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, position: 'absolute', bottom: 10, left: 0, right: 0 }}>
            {property.gallery.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor: galleryIndex === idx ? "#0061FF" : "#ccc",
                }}
              />
            ))}
          </View>
        </View>
      )}
      {/* Header Image with Overlay (fallback if no gallery) */}
      {(!property.gallery || property.gallery.length === 0) && (
        <Animated.View style={[styles.headerImageContainer, headerAnimatedStyle]}>
          <Image source={{ uri: property.image }} style={styles.headerImage} />
          <LinearGradient 
            colors={["transparent", "rgba(0,0,0,0.7)"]} 
            style={styles.headerOverlay} 
          />
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Image source={icons.backArrow} style={{ width: 24, height: 24, tintColor: '#fff' }} />
          </TouchableOpacity>
          {/* Favorite Button */}
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
          >
            <Image 
              source={icons.heart} 
              style={{ 
                width: 24, 
                height: 24, 
                tintColor: isFavorited ? '#FF3B30' : '#fff' 
              }} 
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{property.name}</Text>
            <Text style={styles.headerPrice}>${property.price}</Text>
          </View>
        </Animated.View>
      )}
      {/* Content */}
      <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <AnimatedButton
            onPress={() => setShowMortgageCalculator(true)}
            variant="primary"
            style={{ flex: 1, marginRight: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>💰</Text>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Calculate Mortgage</Text>
          </AnimatedButton>
          
          <AnimatedButton
            onPress={() => setShowPropertyReviews(true)}
            variant="secondary"
            style={{ flex: 1, marginLeft: 8 }}
          >
            <Text style={{ fontWeight: 'bold', marginRight: 8 }}>⭐</Text>
            <Text style={{ fontWeight: 'bold' }}>Reviews</Text>
          </AnimatedButton>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <SectionTitle title="Property Details" />
          <View style={styles.detailsGrid}>
            <InfoItem icon={icons.bed} label={`${property.bedrooms} Bedrooms`} />
            <InfoItem icon={icons.bath} label={`${property.bathrooms} Bathrooms`} />
            <InfoItem icon={icons.area} label={`${property.area} sq ft`} />
            <InfoItem icon={icons.location} label={property.address} />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <SectionTitle title="Description" />
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* Amenities */}
        {property.facilities && property.facilities.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Amenities" />
            <View style={styles.amenitiesGrid}>
              {property.facilities.map((facility, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Text style={styles.amenityText}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Social Features */}
        <View style={styles.section}>
          <SectionTitle title="Community" />
          <View style={styles.socialButtons}>
            <AnimatedButton
              onPress={() => setShowCommunityForums(true)}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            >
              <Text style={{ color: '#0061FF', fontWeight: 'bold' }}>Forums</Text>
            </AnimatedButton>
            
            <AnimatedButton
              onPress={() => setShowPropertySharing(true)}
              variant="outline"
              style={{ flex: 1, marginLeft: 8 }}
            >
              <Text style={{ color: '#0061FF', fontWeight: 'bold' }}>Share</Text>
            </AnimatedButton>
          </View>
        </View>
      </Animated.View>

      {/* Modals */}
      <AnimatedModal
        visible={showMortgageCalculator}
        onClose={() => setShowMortgageCalculator(false)}
      >
        <MortgageCalculator
          visible={showMortgageCalculator}
          onClose={() => setShowMortgageCalculator(false)}
        />
      </AnimatedModal>

             <AnimatedModal
         visible={showPropertyReviews}
         onClose={() => setShowPropertyReviews(false)}
       >
         <PropertyReviews
           visible={showPropertyReviews}
           onClose={() => setShowPropertyReviews(false)}
           property={property}
           onReviewAdded={() => {
             // Refresh property data to show new review
             getPropertyById(property.id!).then(setProperty);
           }}
         />
       </AnimatedModal>

      <AnimatedModal
        visible={showCommunityForums}
        onClose={() => setShowCommunityForums(false)}
      >
        <CommunityForums
          visible={showCommunityForums}
          onClose={() => setShowCommunityForums(false)}
        />
      </AnimatedModal>

      <AnimatedModal
        visible={showPropertySharing}
        onClose={() => setShowPropertySharing(false)}
      >
        <PropertySharing
          visible={showPropertySharing}
          onClose={() => setShowPropertySharing(false)}
          property={property}
        />
      </AnimatedModal>
    </ScrollView>
  );
}

function InfoItem({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.infoItem}>
      <Image source={icon} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    position: 'relative',
    height: 300,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#0061FF',
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
  },
  socialButtons: {
    flexDirection: 'row',
  },
});
