import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Modal,
} from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import icons from "@/constants/icons";

import Search from "@/components/Search";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import { Card, FeaturedCard } from "@/components/Cards";

import { useGlobalContext } from "@/lib/global-provider";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestProperties, getProperties } from "@/lib/firebase";
import type { Property } from '@/lib/firebase';

// Helper to get a consistent random color from a name
function getAvatarColor(name: string) {
  const colors = [
    '0061FF', 'FF5733', '28B463', '8E44AD', 'F1C40F', 'E67E22', '16A085', 'C0392B', '2C3E50', 'D35400'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

const Home = () => {
  const { user, lastLogin, setLastLogin } = useGlobalContext();
  console.log('Home page user.avatar:', user?.avatar);
  const params = useLocalSearchParams<{ filter?: string; search?: string }>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestLoading, setLatestLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(params.filter || 'All');
  const [search, setSearch] = useState(params.search || '');
  const [newPropertyCount, setNewPropertyCount] = useState(0);
  const [showNewPropModal, setShowNewPropModal] = useState(false);
  const [showNoNewPropModal, setShowNoNewPropModal] = useState(false);

  // Fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    console.log('📋 Fetching properties with filter:', filter, 'search:', search);
    const props = await getProperties(filter, search, 6);
    console.log('📊 Fetched properties:', props.length, 'properties');
    console.log('📋 Properties data:', JSON.stringify(props, null, 2));
    setProperties(props);
    setLoading(false);
  };

  // Fetch latest properties
  const fetchLatest = async () => {
    setLatestLoading(true);
    const latest = await getLatestProperties();
    // Filter out sold properties
    const filteredLatest = latest.filter((p) => !p.sold);
    setLatestProperties(filteredLatest);
    setLatestLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [filter, search]);

  useEffect(() => {
    fetchLatest();
  }, []);

  // Listen to parameter changes
  useEffect(() => {
    if (params.filter !== undefined) {
      setFilter(params.filter);
    }
    if (params.search !== undefined) {
      setSearch(params.search);
    }
  }, [params.filter, params.search]);

  useEffect(() => {
    // On login, check for new properties
    if (user && lastLogin !== null) {
      getProperties(undefined, undefined, undefined, false).then(props => {
        const newProps = props.filter(p => p.createdAt && new Date(p.createdAt).getTime() > lastLogin);
        if (newProps.length > 0) {
          setNewPropertyCount(newProps.length);
          setShowNewPropModal(true);
        }
        setLastLogin(Date.now());
      });
    } else if (user) {
      setLastLogin(Date.now());
    }
  }, [user]);

  const handleCardPress = (id: string) => {
    console.log('Navigating to property detail with id:', id);
    router.push(`/properties/${id}`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchProperties(), fetchLatest()]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleNotificationPress = () => {
    if (newPropertyCount > 0) {
      setShowNewPropModal(true);
    } else {
      // Show a quick message or modal for no new properties
      setShowNoNewPropModal(true);
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      {/* New Properties Notification Modal */}
      <Modal visible={showNewPropModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>New Properties Added</Text>
            <Text style={{ fontSize: 16, marginBottom: 16 }}>There {newPropertyCount === 1 ? 'is' : 'are'} {newPropertyCount} new propert{newPropertyCount === 1 ? 'y' : 'ies'} added since your last login.</Text>
            <TouchableOpacity style={{ backgroundColor: '#0061FF', padding: 10, borderRadius: 6 }} onPress={() => setShowNewPropModal(false)}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* No New Properties Modal */}
      <Modal visible={showNoNewPropModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Notifications</Text>
            <Text style={{ fontSize: 16, marginBottom: 16 }}>No new properties added.</Text>
            <TouchableOpacity style={{ backgroundColor: '#0061FF', padding: 10, borderRadius: 6 }} onPress={() => setShowNoNewPropModal(false)}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item }) => (
          <Card item={item} onPress={() => handleCardPress(item.id ?? '')} />
        )}
        keyExtractor={(item) => item.id ?? ''}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : (
            <NoResults />
          )
        }
        ListHeaderComponent={() => (
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row">
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name || 'U')[0])}&background=${getAvatarColor(user?.name || 'User')}&color=fff&size=256`
                  }}
                  className="size-12 rounded-full"
                  onError={({ nativeEvent }) => {
                    if (user?.avatar) {
                      user.avatar = '';
                    }
                  }}
                />

                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">
                    Good Morning
                  </Text>
                  <Text className="text-base font-rubik-medium text-black-300">
                    {user?.name}
                  </Text>
                </View>
              </View>
              <View className="flex flex-row items-center space-x-3">
                <TouchableOpacity onPress={handleNotificationPress}>
                  <Image source={icons.bell} className="size-6" />
                </TouchableOpacity>
              </View>
            </View>

            <Search />

            <View className="my-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Featured
                </Text>
              </View>

              {latestLoading ? (
                <ActivityIndicator size="large" className="text-primary-300" />
              ) : !latestProperties || latestProperties.length === 0 ? (
                <NoResults />
              ) : (
                <FlatList
                  data={latestProperties}
                  renderItem={({ item }) => (
                    <FeaturedCard
                      item={item}
                      onPress={() => handleCardPress(item.id ?? '')}
                    />
                  )}
                  keyExtractor={(item) => item.id ?? ''}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex gap-5 mt-5"
                />
              )}
            </View>

            <View className="mt-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Our Recommendation
                </Text>
              </View>

              <Filters />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;
