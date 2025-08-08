import icons from "@/constants/icons";
import images from "@/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { Property } from '@/lib/firebase';
import { getAverageRating } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobalContext } from '@/lib/global-provider';

interface Props {
  item: Property;
  onPress?: () => void;
  index?: number;
}

export const FeaturedCard = ({ item, onPress, index = 0 }: Props) => {
  const avgRating = getAverageRating(item);
  const { favorites, addFavorite, removeFavorite } = useGlobalContext();
  // Check if property is favorited
  const isFavorited = item.id ? favorites.includes(item.id) : false;
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (!item.id) return;
    if (isFavorited) {
      removeFavorite(item.id);
    } else {
      addFavorite(item.id);
    }
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{ width: 240, height: 320, marginRight: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
    >
      <Image 
        source={{ uri: item.image }} 
        style={{ width: '100%', height: '100%', borderRadius: 24, position: 'absolute' }}
        resizeMode="cover"
      />
      {/* Gradient overlay for text readability */}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
      {/* Property type badge */}
      <View style={{ position: 'absolute', top: 20, left: 20, backgroundColor: '#0061FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, zIndex: 10 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>{item.type}</Text>
      </View>
      {/* Favorite heart icon */}
      <TouchableOpacity 
        onPress={handleFavoritePress}
        style={{ position: 'absolute', top: 20, right: 20, backgroundColor: '#fff', padding: 8, borderRadius: 16, zIndex: 10 }}
        activeOpacity={0.7}
      >
        <Image 
          source={icons.heart} 
          style={{ width: 16, height: 16, tintColor: isFavorited ? '#FF3B30' : '#ccc' }} 
        />
      </TouchableOpacity>
      {/* Rating badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, position: 'absolute', top: 60, right: 20, zIndex: 10 }}>
        <Image source={icons.star} style={{ width: 14, height: 14 }} />
        {item.reviews && item.reviews.length > 0 ? (
          <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>{Math.round(avgRating)} / 5 ({item.reviews.length})</Text>
        ) : (
          <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>New</Text>
        )}
      </View>
      <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Image source={icons.location} style={{ width: 16, height: 16, tintColor: '#fff', marginRight: 4 }} />
          <Text style={{ color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, borderRadius: 8 }} numberOfLines={2}>{item.address || 'No address provided'}</Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const Card = ({ item, onPress, index = 0 }: Props) => {
  const avgRating = getAverageRating(item);
  const { favorites, addFavorite, removeFavorite } = useGlobalContext();
  const isFavorited = item.id ? favorites.includes(item.id) : false;
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (!item.id) return;
    if (isFavorited) {
      removeFavorite(item.id);
    } else {
      addFavorite(item.id);
    }
  };
  return (
    <TouchableOpacity
      style={{ flex: 1, margin: 8, borderRadius: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
        <Image 
          source={{ uri: item.image }} 
          style={{ width: '100%', height: 160, borderRadius: 16 }}
          resizeMode="cover"
        />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
        {/* Favorite heart icon */}
        <TouchableOpacity 
          onPress={handleFavoritePress}
          style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', padding: 6, borderRadius: 16, zIndex: 10 }}
          activeOpacity={0.7}
        >
          <Image 
            source={icons.heart} 
            style={{ width: 16, height: 16, tintColor: isFavorited ? '#FF3B30' : '#ccc' }} 
          />
        </TouchableOpacity>
        {/* Property type badge */}
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#0061FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, zIndex: 10 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' }}>{item.type}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
        <Text style={{ color: '#191D31', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Image source={icons.location} style={{ width: 14, height: 14, tintColor: '#0061FF', marginRight: 4 }} />
          <Text style={{ color: '#333', fontSize: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 6, borderRadius: 6 }} numberOfLines={2}>{item.address || 'No address provided'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 15 }}>${item.price}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
            <Image source={icons.star} style={{ width: 12, height: 12 }} />
            {item.reviews && item.reviews.length > 0 ? (
              <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 11, marginLeft: 2 }}>{Math.round(avgRating)} / 5</Text>
            ) : (
              <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 11, marginLeft: 2 }}>New</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
