import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";

import icons from "@/constants/icons";
import Search from "@/components/Search";
import { Card } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";

import { getProperties } from "@/lib/firebase";
import type { Property } from '@/lib/firebase';
import SaveSearchModal from "@/components/SaveSearchModal";
import { useGlobalContext } from "@/lib/global-provider";

const Explore = () => {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveSearch, setShowSaveSearch] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    console.log('🔍 Fetching properties for explore with filter:', params.filter, 'query:', params.query);
    const props = await getProperties(params.filter, params.query, undefined, false); // includeSold = false
    console.log('📊 Fetched properties for explore:', props.length, 'properties');
    setProperties(props);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [params.filter, params.query]);

  const handleCardPress = (id: string) => {
    console.log('Navigating to property detail with id:', id);
    router.push(`/properties/${id}`);
  };

  const getSearchCriteria = () => {
    return {
      propertyType: params.filter,
      location: params.query,
    };
  };

  return (
    <SafeAreaView className="h-full bg-white">
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
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>

              <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                Search for Your Ideal Home
              </Text>
              <Image source={icons.bell} className="w-6 h-6" />
            </View>

            <Search />

            <View className="mt-5">
              <Filters />

              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Found {properties?.length} Properties
                </Text>
                
                {user && (
                  <TouchableOpacity
                    onPress={() => setShowSaveSearch(true)}
                    className="bg-primary-100 px-4 py-2 rounded-full border border-primary-200"
                  >
                    <Text className="text-primary-300 font-rubik-medium text-sm">
                      🔔 Save Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      />
      
      {/* Save Search Modal */}
      <SaveSearchModal
        visible={showSaveSearch}
        onClose={() => setShowSaveSearch(false)}
        searchCriteria={getSearchCriteria()}
      />
    </SafeAreaView>
  );
};

export default Explore;
