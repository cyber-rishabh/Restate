import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { addReviewToProperty, Property, getAverageRating } from '@/lib/firebase';
import icons from '@/constants/icons';

interface PropertyReviewsProps {
  visible: boolean;
  onClose: () => void;
  property: Property;
  onReviewAdded: () => void;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  public?: boolean;
  user: {
    name: string;
    avatar: string;
    email: string;
  };
  createdAt?: Date;
  helpful?: number;
  category?: 'overall' | 'location' | 'value' | 'condition' | 'agent';
}

const PropertyReviews = ({ visible, onClose, property, onReviewAdded }: PropertyReviewsProps) => {
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'reviews' | 'agent' | 'neighborhood'>('reviews');
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    category: 'overall' as const,
  });

  const categories = [
    { id: 'overall', label: 'Overall', icon: '⭐' },
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'value', label: 'Value', icon: '💰' },
    { id: 'condition', label: 'Condition', icon: '🏠' },
    { id: 'agent', label: 'Agent', icon: '👤' },
  ];

  const handleAddReview = async () => {
    if (!user || !newReview.rating || !newReview.comment.trim()) {
      Alert.alert('Error', 'Please provide both rating and comment');
      return;
    }

    try {
      await addReviewToProperty(property.id!, {
        rating: newReview.rating,
        comment: newReview.comment,
        user: {
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
      });
      
      setNewReview({ rating: 0, comment: '', category: 'overall' });
      setShowAddReview(false);
      onReviewAdded();
      Alert.alert('Success', 'Review added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add review');
    }
  };

  const renderStars = (rating: number, size: number = 20, interactive: boolean = false, onPress?: (star: number) => void) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onPress?.(star)}
            disabled={!interactive}
            style={{ marginRight: 2 }}
          >
            <Text style={{ 
              fontSize: size, 
              color: rating >= star ? '#FFD700' : '#ccc',
              textShadowColor: '#191D31',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewsTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Review Summary */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-rubik-bold text-black-300">Property Reviews</Text>
            <TouchableOpacity
              onPress={() => setShowAddReview(true)}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-rubik-medium">Write Review</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center space-x-4">
            <View className="items-center">
              <Text className="text-3xl font-rubik-bold text-blue-600">
                {getAverageRating(property).toFixed(1)}
              </Text>
              {renderStars(getAverageRating(property), 24)}
              <Text className="text-sm text-gray-500 mt-1">
                {property.reviews?.length || 0} reviews
              </Text>
            </View>
            
            <View className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = property.reviews?.filter(r => r.rating === star).length || 0;
                const percentage = property.reviews?.length ? (count / property.reviews.length) * 100 : 0;
                return (
                  <View key={star} className="flex-row items-center mb-1">
                    <Text className="text-sm text-gray-600 w-8">{star}★</Text>
                    <View className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <View 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </View>
                    <Text className="text-sm text-gray-600 w-8">{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View className="space-y-4">
          <Text className="text-lg font-rubik-bold text-black-300">Recent Reviews</Text>
          
          {property.reviews && property.reviews.length > 0 ? (
            property.reviews.map((review, index) => (
              <View key={review.id || index} className="bg-white rounded-lg p-4 shadow-sm">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center">
                    <Image 
                      source={{ uri: review.user.avatar }} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <View>
                      <Text className="font-rubik-medium text-black-300">{review.user.name}</Text>
                      <Text className="text-sm text-gray-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                  </View>
                  {renderStars(review.rating)}
                </View>
                
                <Text className="text-gray-700 leading-5">{review.comment}</Text>
                
                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Text className="text-blue-500 mr-1">👍</Text>
                    <Text className="text-sm text-gray-500">
                      Helpful ({review.helpful || 0})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text className="text-sm text-blue-500">Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <Text className="text-2xl mb-2">⭐</Text>
              <Text className="text-lg font-rubik-medium text-gray-600 mb-2">No reviews yet</Text>
              <Text className="text-gray-500 text-center">
                Be the first to share your experience with this property
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddReview(true)}
                className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
              >
                <Text className="text-white font-rubik-medium">Write First Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add Comment Section */}
        <View className="bg-white rounded-lg p-4 shadow-sm mt-6">
          <Text className="text-lg font-rubik-bold text-black-300 mb-2">Add a Review</Text>
          <View className="flex-row items-center mb-2">
            {renderStars(newReview.rating, 28, true, (star) => setNewReview({ ...newReview, rating: star }))}
          </View>
          <TextInput
            value={newReview.comment}
            onChangeText={text => setNewReview({ ...newReview, comment: text })}
            placeholder="Write your review..."
            multiline
            className="border border-gray-300 rounded-lg p-3 mb-2 font-rubik"
            style={{ minHeight: 60 }}
          />
          <TouchableOpacity
            onPress={handleAddReview}
            className="bg-blue-500 rounded-lg py-3"
          >
            <Text className="text-white font-rubik-bold text-center">Submit Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderAgentTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Agent Profile */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Image 
              source={{ uri: property.agent.avatar }} 
              className="w-16 h-16 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className="text-xl font-rubik-bold text-black-300">{property.agent.name}</Text>
              <Text className="text-gray-600">{property.agent.email}</Text>
              <View className="flex-row items-center mt-1">
                {renderStars(4.8, 16)}
                <Text className="text-sm text-gray-500 ml-2">4.8 (127 reviews)</Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row justify-around py-4 border-t border-gray-100">
            <View className="items-center">
              <Text className="text-lg font-rubik-bold text-blue-600">156</Text>
              <Text className="text-sm text-gray-500">Properties Sold</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-rubik-bold text-blue-600">98%</Text>
              <Text className="text-sm text-gray-500">Success Rate</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-rubik-bold text-blue-600">2.3</Text>
              <Text className="text-sm text-gray-500">Avg Days</Text>
            </View>
          </View>
        </View>

        {/* Agent Reviews */}
        <View className="space-y-4">
          <Text className="text-lg font-rubik-bold text-black-300">Agent Reviews</Text>
          
          {[1, 2, 3].map((_, index) => (
            <View key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View>
                    <Text className="font-rubik-medium text-black-300">Sarah Johnson</Text>
                    <Text className="text-sm text-gray-500">2 weeks ago</Text>
                  </View>
                </View>
                {renderStars(5)}
              </View>
              
              <Text className="text-gray-700 leading-5">
                "Excellent agent! Very responsive and helped us find our dream home. 
                Professional throughout the entire process."
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderNeighborhoodTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Neighborhood Overview */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-xl font-rubik-bold text-black-300 mb-4">Neighborhood Insights</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Walkability Score</Text>
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-green-600 mr-2">85</Text>
                <Text className="text-sm text-gray-500">/100</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Transit Score</Text>
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-blue-600 mr-2">72</Text>
                <Text className="text-sm text-gray-500">/100</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Safety Rating</Text>
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-green-600 mr-2">A+</Text>
                <Text className="text-sm text-gray-500">Very Safe</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nearby Amenities */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-rubik-bold text-black-300 mb-4">Nearby Amenities</Text>
          
          <View className="space-y-3">
            {[
              { name: 'Coffee Shops', count: 8, distance: '0.2 mi' },
              { name: 'Restaurants', count: 23, distance: '0.3 mi' },
              { name: 'Grocery Stores', count: 3, distance: '0.5 mi' },
              { name: 'Schools', count: 5, distance: '0.8 mi' },
              { name: 'Parks', count: 2, distance: '0.4 mi' },
            ].map((amenity, index) => (
              <View key={index} className="flex-row justify-between items-center">
                <Text className="text-gray-700">{amenity.name}</Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-500 mr-2">{amenity.count} places</Text>
                  <Text className="text-sm text-blue-500">{amenity.distance}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Neighborhood Reviews */}
        <View className="space-y-4">
          <Text className="text-lg font-rubik-bold text-black-300">Neighborhood Reviews</Text>
          
          {[1, 2].map((_, index) => (
            <View key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' }} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View>
                    <Text className="font-rubik-medium text-black-300">Emily Chen</Text>
                    <Text className="text-sm text-gray-500">1 month ago</Text>
                  </View>
                </View>
                {renderStars(4)}
              </View>
              
              <Text className="text-gray-700 leading-5">
                "Great neighborhood! Lots of young families, good schools nearby, 
                and plenty of restaurants within walking distance."
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <LinearGradient colors={["#0061FF", "#4F8CFF"]} className="flex-row items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-white font-rubik-medium">✕</Text>
            </TouchableOpacity>
            <Text className="text-xl font-rubik-bold text-white">Reviews & Insights</Text>
            <View className="w-6" />
          </LinearGradient>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200">
            {[
              { id: 'reviews', label: 'Reviews', icon: '⭐' },
              { id: 'agent', label: 'Agent', icon: '👤' },
              { id: 'neighborhood', label: 'Area', icon: '📍' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-2 ${
                  activeTab === tab.id ? 'border-b-2 border-blue-500' : ''
                }`}
              >
                <Text className={`text-center font-rubik-medium ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {tab.icon} {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'reviews' && renderReviewsTab()}
          {activeTab === 'agent' && renderAgentTab()}
          {activeTab === 'neighborhood' && renderNeighborhoodTab()}
        </SafeAreaView>
      </Modal>

      {/* Add Review Modal */}
      <Modal
        visible={showAddReview}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-6 w-11/12 max-h-96">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">Write a Review</Text>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Rating</Text>
              <View className="items-center">
                {renderStars(newReview.rating, 32, true, (star) => 
                  setNewReview({ ...newReview, rating: star })
                )}
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setNewReview({ ...newReview, category: category.id as any })}
                      className={`px-3 py-2 rounded-lg border ${
                        newReview.category === category.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Text className={`text-sm ${
                        newReview.category === category.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {category.icon} {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            <View className="mb-6">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Comment</Text>
              <TextInput
                value={newReview.comment}
                onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
                placeholder="Share your experience with this property..."
                multiline
                numberOfLines={4}
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
                textAlignVertical="top"
              />
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowAddReview(false)}
                className="flex-1 bg-gray-300 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddReview}
                className="flex-1 bg-blue-500 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-white">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PropertyReviews; 