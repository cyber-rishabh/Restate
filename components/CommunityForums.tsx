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
  FlatList,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import icons from '@/constants/icons';

const { width } = Dimensions.get('window');

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    email: string;
  };
  category: 'general' | 'buying' | 'selling' | 'investing' | 'neighborhood' | 'expert';
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  createdAt: Date;
  isExpert?: boolean;
  neighborhood?: string;
  isTrending?: boolean;
  isPinned?: boolean;
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    email: string;
  };
  likes: number;
  createdAt: Date;
  isExpert?: boolean;
  isVerified?: boolean;
}

const CommunityForums = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'forums' | 'qa' | 'neighborhoods' | 'trending'>('forums');
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general' as const,
    tags: [] as string[],
  });
  const [newReply, setNewReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Demo data with enhanced features
  const demoPosts: ForumPost[] = [
    {
      id: '1',
      title: 'First-time buyer tips for downtown area',
      content: 'Looking to buy my first home in downtown. Any tips on what to look for? Budget around $400k. Would love advice on neighborhoods, schools, and future appreciation potential.',
      author: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        email: 'sarah@email.com',
      },
      category: 'buying',
      tags: ['first-time-buyer', 'downtown', 'tips', 'schools'],
      replies: 12,
      views: 156,
      likes: 8,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isTrending: true,
    },
    {
      id: '2',
      title: 'Market trends in Westside neighborhood',
      content: 'Has anyone noticed the recent price increases in Westside? Thinking of selling my condo. Looking for insights on timing and pricing strategy.',
      author: {
        name: 'Mike Chen',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        email: 'mike@email.com',
      },
      category: 'selling',
      tags: ['market-trends', 'westside', 'condo', 'pricing'],
      replies: 7,
      views: 89,
      likes: 5,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isPinned: true,
    },
    {
      id: '3',
      title: 'Investment property ROI analysis',
      content: 'Looking at a 4-unit building in Midtown. Anyone have experience with multi-family investments? Need advice on financing and management.',
      author: {
        name: 'David Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        email: 'david@email.com',
      },
      category: 'investing',
      tags: ['investment', 'multi-family', 'financing', 'roi'],
      replies: 15,
      views: 234,
      likes: 12,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isExpert: true,
      isTrending: true,
    },
    {
      id: '4',
      title: 'Best schools in North District',
      content: 'Moving to North District and need info on schools. Any parents with experience in the area? Looking for elementary and middle schools.',
      author: {
        name: 'Emily Watson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        email: 'emily@email.com',
      },
      category: 'neighborhood',
      tags: ['schools', 'north-district', 'family', 'education'],
      replies: 9,
      views: 123,
      likes: 6,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '🏠' },
    { id: 'buying', name: 'Buying', icon: '💰' },
    { id: 'selling', name: 'Selling', icon: '📈' },
    { id: 'investing', name: 'Investing', icon: '📊' },
    { id: 'neighborhood', name: 'Neighborhoods', icon: '🏘️' },
    { id: 'expert', name: 'Expert Q&A', icon: '👨‍💼' },
  ];

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', 'Post created successfully!');
    setShowNewPost(false);
    setNewPost({ title: '', content: '', category: 'general', tags: [] });
  };

  const handleAddReply = () => {
    if (!newReply.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }
    Alert.alert('Success', 'Reply added successfully!');
    setNewReply('');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleShare = async () => {
    if (!selectedPost) return;
    try {
      await Share.share({
        message: `${selectedPost.title}\n\n${selectedPost.content}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the post.');
    }
  };

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row space-x-2 px-4">
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full flex-row items-center ${
              selectedCategory === category.id
                ? 'bg-blue-500'
                : 'bg-gray-100'
            }`}
          >
            <Text className="mr-1">{category.icon}</Text>
            <Text className={`font-rubik-medium ${
              selectedCategory === category.id ? 'text-white' : 'text-gray-600'
            }`}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPostCard = (post: ForumPost) => (
    <TouchableOpacity
      onPress={() => setSelectedPost(post)}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Image source={{ uri: post.author.avatar }} className="w-10 h-10 rounded-full mr-3" />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-rubik-bold text-black-300">{post.author.name}</Text>
              {post.isExpert && (
                <View className="bg-yellow-100 px-2 py-1 rounded-full ml-2">
                  <Text className="text-yellow-800 text-xs font-rubik-bold">Expert</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm">{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        {post.isPinned && (
          <View className="bg-blue-100 px-2 py-1 rounded-full">
            <Text className="text-blue-800 text-xs font-rubik-bold">📌 Pinned</Text>
          </View>
        )}
      </View>

      <Text className="font-rubik-bold text-lg text-black-300 mb-2">{post.title}</Text>
      <Text className="text-gray-600 mb-3" numberOfLines={3}>{post.content}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row space-x-4">
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-1">💬</Text>
            <Text className="text-gray-600 text-sm">{post.replies}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-1">👁️</Text>
            <Text className="text-gray-600 text-sm">{post.views}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-1">❤️</Text>
            <Text className="text-gray-600 text-sm">{post.likes}</Text>
          </View>
        </View>
        {post.isTrending && (
          <View className="bg-red-100 px-2 py-1 rounded-full">
            <Text className="text-red-800 text-xs font-rubik-bold">🔥 Trending</Text>
          </View>
        )}
      </View>

      <View className="flex-row flex-wrap mt-3">
        {post.tags.slice(0, 3).map((tag) => (
          <View key={tag} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
            <Text className="text-gray-600 text-xs">#{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderForumsTab = () => (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Text className="text-gray-500 mr-2">🔍</Text>
          <TextInput
            placeholder="Search forums..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-rubik"
          />
        </View>
      </View>

      {renderCategoryFilter()}

      <ScrollView className="flex-1 px-4">
        {demoPosts
          .filter(post => selectedCategory === 'all' || post.category === selectedCategory)
          .filter(post => !searchQuery || post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((post) => (
            <React.Fragment key={post.id}>{renderPostCard(post)}</React.Fragment>
          ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowNewPost(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl">+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQATab = () => (
    <View className="flex-1 px-4">
      <View className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6">
        <Text className="text-white text-xl font-rubik-bold mb-2">Ask an Expert</Text>
        <Text className="text-white opacity-90">Get answers from real estate professionals</Text>
      </View>

      <ScrollView>
        {demoPosts.filter(post => post.isExpert).map((post) => (
          <React.Fragment key={post.id}>{renderPostCard(post)}</React.Fragment>
        ))}
      </ScrollView>
    </View>
  );

  const renderNeighborhoodsTab = () => (
    <View className="flex-1 px-4">
      <View className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 mb-6">
        <Text className="text-white text-xl font-rubik-bold mb-2">Neighborhood Guides</Text>
        <Text className="text-white opacity-90">Discover local insights and community info</Text>
      </View>

      <ScrollView>
        {demoPosts.filter(post => post.category === 'neighborhood').map((post) => (
          <React.Fragment key={post.id}>{renderPostCard(post)}</React.Fragment>
        ))}
      </ScrollView>
    </View>
  );

  const renderTrendingTab = () => (
    <View className="flex-1 px-4">
      <View className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6">
        <Text className="text-white text-xl font-rubik-bold mb-2">Trending Topics</Text>
        <Text className="text-white opacity-90">What's hot in the community right now</Text>
      </View>

      <ScrollView>
        {demoPosts.filter(post => post.isTrending).map((post) => (
          <React.Fragment key={post.id}>{renderPostCard(post)}</React.Fragment>
        ))}
      </ScrollView>
    </View>
  );

  const renderPostDetail = () => (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => setSelectedPost(null)}>
          <Text className="text-blue-500 font-rubik-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="font-rubik-bold text-black-300">Post Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text className="text-blue-500 font-rubik-bold">Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Image source={{ uri: selectedPost?.author.avatar }} className="w-12 h-12 rounded-full mr-3" />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-black-300">{selectedPost?.author.name}</Text>
                {selectedPost?.isExpert && (
                  <View className="bg-yellow-100 px-2 py-1 rounded-full ml-2">
                    <Text className="text-yellow-800 text-xs font-rubik-bold">Expert</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-sm">{selectedPost && formatTimeAgo(selectedPost.createdAt)}</Text>
            </View>
          </View>

          <Text className="font-rubik-bold text-xl text-black-300 mb-3">{selectedPost?.title}</Text>
          <Text className="text-gray-600 text-base leading-6 mb-4">{selectedPost?.content}</Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row space-x-4">
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-gray-500 mr-1">❤️</Text>
                <Text className="text-gray-600">{selectedPost?.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-gray-500 mr-1">💬</Text>
                <Text className="text-gray-600">{selectedPost?.replies}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-gray-500 mr-1">👁️</Text>
                <Text className="text-gray-600">{selectedPost?.views}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
              <Text className="text-white font-rubik-bold">Follow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reply Section */}
        <View className="bg-gray-50 rounded-xl p-4">
          <Text className="font-rubik-bold text-black-300 mb-3">Add Reply</Text>
          <TextInput
            value={newReply}
            onChangeText={setNewReply}
            placeholder="Share your thoughts..."
            multiline
            className="bg-white rounded-lg p-3 border border-gray-200 mb-3"
            style={{ minHeight: 80 }}
          />
          <TouchableOpacity
            onPress={handleAddReply}
            className="bg-blue-500 rounded-lg py-3"
          >
            <Text className="text-white font-rubik-bold text-center">Post Reply</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {
      setSelectedPost(null);
      onClose();
    }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-rubik-bold text-black-300">Community Forums</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-2xl text-gray-500">✕</Text>
          </TouchableOpacity>
        </View>

        {selectedPost ? (
          renderPostDetail()
        ) : (
          <>
            {/* Tabs */}
            <View className="flex-row bg-white border-b border-gray-200">
              <TouchableOpacity
                onPress={() => setActiveTab('forums')}
                className={`flex-1 py-3 px-4 ${activeTab === 'forums' ? 'border-b-2 border-blue-500' : ''}`}
              >
                <Text className={`text-center font-rubik-medium ${activeTab === 'forums' ? 'text-blue-500' : 'text-gray-500'}`}>
                  Forums
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('qa')}
                className={`flex-1 py-3 px-4 ${activeTab === 'qa' ? 'border-b-2 border-blue-500' : ''}`}
              >
                <Text className={`text-center font-rubik-medium ${activeTab === 'qa' ? 'text-blue-500' : 'text-gray-500'}`}>
                  Q&A
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('neighborhoods')}
                className={`flex-1 py-3 px-4 ${activeTab === 'neighborhoods' ? 'border-b-2 border-blue-500' : ''}`}
              >
                <Text className={`text-center font-rubik-medium ${activeTab === 'neighborhoods' ? 'text-blue-500' : 'text-gray-500'}`}>
                  Neighborhoods
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('trending')}
                className={`flex-1 py-3 px-4 ${activeTab === 'trending' ? 'border-b-2 border-blue-500' : ''}`}
              >
                <Text className={`text-center font-rubik-medium ${activeTab === 'trending' ? 'text-blue-500' : 'text-gray-500'}`}>
                  Trending
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'forums' && renderForumsTab()}
            {activeTab === 'qa' && renderQATab()}
            {activeTab === 'neighborhoods' && renderNeighborhoodsTab()}
            {activeTab === 'trending' && renderTrendingTab()}
          </>
        )}

        {/* New Post Modal */}
        <Modal visible={showNewPost} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl p-6 w-11/12 max-h-4/5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-rubik-bold text-black-300">Create New Post</Text>
                <TouchableOpacity onPress={() => setShowNewPost(false)}>
                  <Text className="text-2xl text-gray-500">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView>
                <TextInput
                  value={newPost.title}
                  onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                  placeholder="Post title..."
                  className="border border-gray-300 rounded-lg p-3 mb-4 font-rubik"
                />

                <TextInput
                  value={newPost.content}
                  onChangeText={(text) => setNewPost({ ...newPost, content: text })}
                  placeholder="Share your thoughts..."
                  multiline
                  className="border border-gray-300 rounded-lg p-3 mb-4 font-rubik"
                  style={{ minHeight: 120 }}
                />

                <View className="flex-row space-x-2 mb-4">
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setNewPost({ ...newPost, category: category.id as any })}
                      className={`px-3 py-2 rounded-full ${
                        newPost.category === category.id ? 'bg-blue-500' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`font-rubik-medium ${
                        newPost.category === category.id ? 'text-white' : 'text-gray-600'
                      }`}>
                        {category.icon} {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setShowNewPost(false)}
                    className="flex-1 bg-gray-200 rounded-lg py-3"
                  >
                    <Text className="text-center font-rubik-bold text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreatePost}
                    className="flex-1 bg-blue-500 rounded-lg py-3"
                  >
                    <Text className="text-center font-rubik-bold text-white">Create Post</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

export default CommunityForums; 