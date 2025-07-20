// app/properties/[id].tsx
import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, ScrollView, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getPropertyById, Property, getAverageRating, addReviewToProperty } from "@/lib/firebase";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";
import { useGlobalContext } from '@/lib/global-provider';

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
      })
      .catch(() => {
        setError("Failed to load property");
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      {/* Header Image with Overlay */}
      <View style={styles.headerImageContainer}>
        <Image source={{ uri: property.image }} style={styles.headerImage} />
        <View style={styles.headerOverlay} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{property.name}</Text>
          <Text style={styles.headerPrice}>${property.price}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <InfoItem icon={icons.bed} label={`${property.bedrooms} Beds`} />
        <InfoItem icon={icons.bath} label={`${property.bathrooms} Baths`} />
        <InfoItem icon={icons.area} label={`${property.area} sqft`} />
        <InfoItem icon={icons.home} label={property.type} />
      </View>

      {/* Description */}
      <SectionTitle title="Description" />
      <Text style={styles.description}>{property.description}</Text>

      {/* Facilities */}
      {property.facilities && property.facilities.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Facilities" />
          <View style={styles.facilitiesRow}>
            {property.facilities.map((f, idx) => (
              <View key={idx} style={styles.facilityBadge}>
                <Text style={styles.facilityText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Gallery Slider */}
      {property.gallery && property.gallery.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Gallery" />
          <FlatList
            data={property.gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.image }} style={[styles.galleryImage, { width, height: width * 0.6 }]} />
            )}
            onMomentumScrollEnd={e => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setGalleryIndex(index);
            }}
            style={{ marginTop: 8 }}
          />
          {/* Dots indicator */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
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

      {/* Agent Card */}
      <View style={styles.agentCard}>
        <Image source={{ uri: property.agent?.avatar }} style={styles.agentAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.agentName}>{property.agent?.name}</Text>
          <Text style={styles.agentEmail}>{property.agent?.email}</Text>
        </View>
      </View>
      {/* Move Favorite and Rate Section to the end */}
      {/* Favorite and Rate Section */}
      <View style={{ marginTop: 32, alignItems: 'center', paddingBottom: 32 }}>
        {/* Favorite Button */}
        <TouchableOpacity
          onPress={() => {
            if (!property?.id) return;
            if (isFavorited) removeFavorite(property.id);
            else addFavorite(property.id);
          }}
          style={{
            backgroundColor: isFavorited ? '#FF3B30' : '#fff',
            borderWidth: 2,
            borderColor: isFavorited ? '#FF3B30' : '#ccc',
            borderRadius: 32,
            width: 64,
            height: 64,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Image source={icons.heart} style={{ width: 36, height: 36, tintColor: isFavorited ? '#fff' : '#FF3B30' }} />
        </TouchableOpacity>
        {/* Average Rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginRight: 6, color: '#191D31' }}>Average Rating:</Text>
          {/* Show only full stars for average, or 'New' if no ratings */}
          {property.reviews && property.reviews.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={{ fontSize: 22, color: Math.round(getAverageRating(property)) >= star ? '#FFD700' : '#ccc', marginRight: 2 }}>
                  ★
                </Text>
              ))}
              <Text style={{ fontSize: 16, color: '#0061FF', fontWeight: 'bold', marginLeft: 6 }}>{Math.round(getAverageRating(property))} / 5</Text>
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>({property.reviews.length} rating{property.reviews.length > 1 ? 's' : ''})</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 16, color: '#0061FF', fontWeight: 'bold' }}>New</Text>
          )}
        </View>
        {/* Rate this property */}
        <View style={{ alignItems: 'center', backgroundColor: '#f0f4ff', borderRadius: 16, padding: 16, width: '90%', marginTop: 8, shadowColor: '#0061FF', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#0061FF' }}>Rate this property</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setUserRating(star)}
                disabled={ratingSubmitting || userHasRated}
                style={{ marginHorizontal: 4 }}
              >
                <Text style={{ fontSize: 40, color: userRating && userRating >= star ? '#FFD700' : '#ccc', textShadowColor: '#191D31', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleRate}
            disabled={ratingSubmitting || userHasRated || !userRating}
            style={{ marginTop: 12, backgroundColor: userHasRated ? '#ccc' : '#0061FF', paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{userHasRated ? 'Already Rated' : ratingSubmitting ? 'Submitting...' : 'Submit Rating'}</Text>
          </TouchableOpacity>
          {userHasRated && <Text style={{ color: '#666', marginTop: 8 }}>You have already rated this property.</Text>}
        </View>
      </View>
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
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerImageContainer: {
    position: "relative",
    width: "100%",
    height: width * 0.6,
    marginBottom: 12,
  },
  headerImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTextContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerPrice: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginTop: -32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 2,
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
    tintColor: "#3b82f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    color: "#222",
  },
  description: {
    fontSize: 15,
    color: "#444",
    marginHorizontal: 16,
    lineHeight: 22,
  },
  facilitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  facilityBadge: {
    backgroundColor: "#e0e7ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 13,
  },
  galleryImage: {
    width: 140,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
  },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 32,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  agentEmail: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
});
