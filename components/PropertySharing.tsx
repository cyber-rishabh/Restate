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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { Property } from '@/lib/firebase';
import icons from '@/constants/icons';

interface PropertySharingProps {
  visible: boolean;
  onClose: () => void;
  property?: Property;
}

interface SharedProperty {
  id: string;
  property: Property;
  sharedBy: {
    name: string;
    avatar: string;
    email: string;
  };
  sharedWith: {
    name: string;
    avatar: string;
    email: string;
  };
  message?: string;
  createdAt: Date;
  status: 'pending' | 'viewed' | 'interested' | 'not-interested';
}

interface CollaborationGroup {
  id: string;
  name: string;
  members: {
    name: string;
    avatar: string;
    email: string;
    role: 'owner' | 'member';
  }[];
  properties: Property[];
  budget: {
    min: number;
    max: number;
  };
  preferences: {
    neighborhoods: string[];
    propertyTypes: string[];
    bedrooms: number;
  };
  createdAt: Date;
}

const PropertySharing = ({ visible, onClose, property }: PropertySharingProps) => {
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'share' | 'collaborate' | 'groups'>('share');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    budget: { min: 300000, max: 600000 },
    neighborhoods: [] as string[],
    propertyTypes: [] as string[],
    bedrooms: 3,
  });

  // Demo data
  const demoContacts = [
    { id: '1', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', email: 'sarah@email.com' },
    { id: '2', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', email: 'mike@email.com' },
    { id: '3', name: 'Emily Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', email: 'emily@email.com' },
    { id: '4', name: 'David Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', email: 'david@email.com' },
  ];

  const demoSharedProperties: SharedProperty[] = [
    {
      id: '1',
      property: {
        id: '1',
        name: 'Downtown Luxury Apartment',
        address: '123 Main St, Downtown',
        price: '$450,000',
        type: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        agent: { name: 'John Smith', email: 'john@email.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' },
        facilities: ['Gym', 'Pool', 'Parking'],
        description: 'Beautiful downtown apartment with amazing city views.',
        reviews: [],
        gallery: [],
      },
      sharedBy: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        email: 'sarah@email.com',
      },
      sharedWith: {
        name: user?.name || 'You',
        avatar: user?.avatar || '',
        email: user?.email || '',
      },
      message: 'Check out this amazing apartment! Perfect for your budget.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'viewed',
    },
  ];

  const demoCollaborationGroups: CollaborationGroup[] = [
    {
      id: '1',
      name: 'Downtown Dream Team',
      members: [
        { name: user?.name || 'You', avatar: user?.avatar || '', email: user?.email || '', role: 'owner' },
        { name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', email: 'sarah@email.com', role: 'member' },
        { name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', email: 'mike@email.com', role: 'member' },
      ],
      properties: [],
      budget: { min: 400000, max: 700000 },
      preferences: {
        neighborhoods: ['Downtown', 'Midtown'],
        propertyTypes: ['Apartment', 'Condos'],
        bedrooms: 2,
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const neighborhoods = ['Downtown', 'Westside', 'Midtown', 'Eastside', 'Northside'];
  const propertyTypes = ['Apartment', 'House', 'Condos', 'Townhouse', 'Villa'];

  const handleShareProperty = () => {
    if (!property || selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    // In a real app, this would save to Firebase
    Alert.alert('Success', `Property shared with ${selectedContacts.length} contact(s)!`);
    setSelectedContacts([]);
    setShareMessage('');
    setShowShareModal(false);
  };

  const handleCreateCollaboration = () => {
    if (!newGroup.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    // In a real app, this would save to Firebase
    Alert.alert('Success', 'Collaboration group created successfully!');
    setNewGroup({ name: '', budget: { min: 300000, max: 600000 }, neighborhoods: [], propertyTypes: [], bedrooms: 3 });
    setShowCollaborationModal(false);
  };

  const toggleContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const toggleNeighborhood = (neighborhood: string) => {
    if (newGroup.neighborhoods.includes(neighborhood)) {
      setNewGroup({
        ...newGroup,
        neighborhoods: newGroup.neighborhoods.filter(n => n !== neighborhood)
      });
    } else {
      setNewGroup({
        ...newGroup,
        neighborhoods: [...newGroup.neighborhoods, neighborhood]
      });
    }
  };

  const togglePropertyType = (type: string) => {
    if (newGroup.propertyTypes.includes(type)) {
      setNewGroup({
        ...newGroup,
        propertyTypes: newGroup.propertyTypes.filter(t => t !== type)
      });
    } else {
      setNewGroup({
        ...newGroup,
        propertyTypes: [...newGroup.propertyTypes, type]
      });
    }
  };

  const renderShareTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Share Property Section */}
        {property && (
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-rubik-bold text-black-300 mb-3">Share This Property</Text>
            <View className="flex-row items-center mb-3">
              <Image source={{ uri: property.image }} className="w-16 h-16 rounded-lg mr-3" />
              <View className="flex-1">
                <Text className="font-rubik-medium text-black-300">{property.name}</Text>
                <Text className="text-gray-600">{property.address}</Text>
                <Text className="text-blue-600 font-rubik-medium">{property.price}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowShareModal(true)}
              className="bg-blue-500 py-3 rounded-lg"
            >
              <Text className="text-white font-rubik-medium text-center">Share with Contacts</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shared Properties */}
        <View>
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">Shared with You</Text>
          <View className="space-y-3">
            {demoSharedProperties.map((shared) => (
              <View key={shared.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center">
                    <Image 
                      source={{ uri: shared.sharedBy.avatar }} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <View>
                      <Text className="font-rubik-medium text-black-300">
                        {shared.sharedBy.name} shared with you
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {new Date(shared.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded ${
                    shared.status === 'interested' ? 'bg-green-100' :
                    shared.status === 'not-interested' ? 'bg-red-100' :
                    shared.status === 'viewed' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-rubik-medium ${
                      shared.status === 'interested' ? 'text-green-600' :
                      shared.status === 'not-interested' ? 'text-red-600' :
                      shared.status === 'viewed' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {shared.status.charAt(0).toUpperCase() + shared.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-3">
                  <Image source={{ uri: shared.property.image }} className="w-16 h-16 rounded-lg mr-3" />
                  <View className="flex-1">
                    <Text className="font-rubik-medium text-black-300">{shared.property.name}</Text>
                    <Text className="text-gray-600">{shared.property.address}</Text>
                    <Text className="text-blue-600 font-rubik-medium">{shared.property.price}</Text>
                  </View>
                </View>

                {shared.message && (
                  <Text className="text-gray-700 mb-3 italic">"{shared.message}"</Text>
                )}

                <View className="flex-row space-x-2">
                  <TouchableOpacity className="flex-1 bg-green-500 py-2 rounded">
                    <Text className="text-white text-sm font-rubik-medium text-center">Interested</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-red-500 py-2 rounded">
                    <Text className="text-white text-sm font-rubik-medium text-center">Not Interested</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCollaborateTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Create Collaboration */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">Create Collaboration</Text>
          <Text className="text-gray-600 mb-4">
            Start a collaborative property hunt with friends, family, or partners
          </Text>
          <TouchableOpacity
            onPress={() => setShowCollaborationModal(true)}
            className="bg-blue-500 py-3 rounded-lg"
          >
            <Text className="text-white font-rubik-medium text-center">Create New Group</Text>
          </TouchableOpacity>
        </View>

        {/* Your Collaborations */}
        <View>
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">Your Collaborations</Text>
          <View className="space-y-3">
            {demoCollaborationGroups.map((group) => (
              <View key={group.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-rubik-medium text-black-300">{group.name}</Text>
                  <View className="bg-blue-100 px-2 py-1 rounded">
                    <Text className="text-xs text-blue-600 font-rubik-medium">
                      {group.members.length} members
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-3">
                  <View className="flex-row -space-x-2">
                    {group.members.slice(0, 3).map((member, index) => (
                      <Image 
                        key={index}
                        source={{ uri: member.avatar }} 
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                    ))}
                    {group.members.length > 3 && (
                      <View className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white items-center justify-center">
                        <Text className="text-xs text-gray-600">+{group.members.length - 3}</Text>
                      </View>
                    )}
                  </View>
                  <View className="ml-3">
                    <Text className="text-sm text-gray-600">
                      Budget: ${group.budget.min.toLocaleString()} - ${group.budget.max.toLocaleString()}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {group.preferences.neighborhoods.join(', ')} • {group.preferences.bedrooms} beds
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-2">
                  <TouchableOpacity className="flex-1 bg-blue-500 py-2 rounded">
                    <Text className="text-white text-sm font-rubik-medium text-center">View Properties</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-gray-300 py-2 rounded">
                    <Text className="text-gray-700 text-sm font-rubik-medium text-center">Manage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGroupsTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="space-y-6">
        {/* Group Buying Opportunities */}
        <View className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4">
          <Text className="text-xl font-rubik-bold text-white mb-2">Group Buying Opportunities</Text>
          <Text className="text-green-100">
            Join forces with other buyers to get better deals and more options
          </Text>
        </View>

        {/* Available Groups */}
        <View>
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">Available Groups</Text>
          <View className="space-y-3">
            {[
              {
                name: 'First-Time Buyers Club',
                members: 12,
                budget: '300k-500k',
                focus: 'Downtown apartments',
                savings: '5-10%',
              },
              {
                name: 'Investment Syndicate',
                members: 8,
                budget: '500k-1M',
                focus: 'Multi-family properties',
                savings: '15-20%',
              },
              {
                name: 'Luxury Home Buyers',
                members: 5,
                budget: '1M+',
                focus: 'Premium properties',
                savings: '10-15%',
              },
            ].map((group, index) => (
              <View key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-rubik-medium text-black-300">{group.name}</Text>
                  <View className="bg-green-100 px-2 py-1 rounded">
                    <Text className="text-xs text-green-600 font-rubik-medium">
                      Save {group.savings}
                    </Text>
                  </View>
                </View>

                <View className="space-y-2 mb-3">
                  <Text className="text-sm text-gray-600">👥 {group.members} members</Text>
                  <Text className="text-sm text-gray-600">💰 Budget: {group.budget}</Text>
                  <Text className="text-sm text-gray-600">🎯 Focus: {group.focus}</Text>
                </View>

                <TouchableOpacity className="bg-green-500 py-2 rounded">
                  <Text className="text-white text-sm font-rubik-medium text-center">Join Group</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View className="bg-blue-50 rounded-lg p-4">
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">Benefits of Group Buying</Text>
          <View className="space-y-2">
            <Text className="text-sm text-gray-700">• Better negotiating power with sellers</Text>
            <Text className="text-sm text-gray-700">• Access to exclusive properties</Text>
            <Text className="text-sm text-gray-700">• Shared costs for inspections and legal fees</Text>
            <Text className="text-sm text-gray-700">• Pooled resources for larger investments</Text>
            <Text className="text-sm text-gray-700">• Collective expertise and insights</Text>
          </View>
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
            <Text className="text-xl font-rubik-bold text-white">Share & Collaborate</Text>
            <View className="w-6" />
          </LinearGradient>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200">
            {[
              { id: 'share', label: 'Share', icon: '📤' },
              { id: 'collaborate', label: 'Collaborate', icon: '🤝' },
              { id: 'groups', label: 'Group Buy', icon: '👥' }
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
          {activeTab === 'share' && renderShareTab()}
          {activeTab === 'collaborate' && renderCollaborateTab()}
          {activeTab === 'groups' && renderGroupsTab()}
        </SafeAreaView>
      </Modal>

      {/* Share Property Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-6 w-11/12 max-h-96">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">Share Property</Text>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Select Contacts</Text>
              <ScrollView className="max-h-32">
                <View className="space-y-2">
                  {demoContacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      onPress={() => toggleContact(contact.id)}
                      className={`flex-row items-center p-2 rounded-lg border ${
                        selectedContacts.includes(contact.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Image source={{ uri: contact.avatar }} className="w-8 h-8 rounded-full mr-3" />
                      <Text className="flex-1 font-rubik-medium text-black-300">{contact.name}</Text>
                      {selectedContacts.includes(contact.id) && (
                        <Text className="text-blue-500">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            <View className="mb-6">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Message (Optional)</Text>
              <TextInput
                value={shareMessage}
                onChangeText={setShareMessage}
                placeholder="Add a personal message..."
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
                textAlignVertical="top"
              />
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                className="flex-1 bg-gray-300 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareProperty}
                className="flex-1 bg-blue-500 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-white">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Collaboration Modal */}
      <Modal
        visible={showCollaborationModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <ScrollView className="bg-white rounded-lg p-6 w-11/12 max-h-96">
            <Text className="text-xl font-rubik-bold text-black-300 mb-4">Create Collaboration</Text>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Group Name</Text>
              <TextInput
                value={newGroup.name}
                onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
                placeholder="e.g., Downtown Dream Team"
                className="border border-gray-300 rounded-lg p-3 text-base font-rubik"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Budget Range</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  value={newGroup.budget.min.toString()}
                  onChangeText={(text) => setNewGroup({ 
                    ...newGroup, 
                    budget: { ...newGroup.budget, min: parseInt(text) || 0 }
                  })}
                  placeholder="Min"
                  keyboardType="numeric"
                  className="flex-1 border border-gray-300 rounded-lg p-3 text-base font-rubik"
                />
                <TextInput
                  value={newGroup.budget.max.toString()}
                  onChangeText={(text) => setNewGroup({ 
                    ...newGroup, 
                    budget: { ...newGroup.budget, max: parseInt(text) || 0 }
                  })}
                  placeholder="Max"
                  keyboardType="numeric"
                  className="flex-1 border border-gray-300 rounded-lg p-3 text-base font-rubik"
                />
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Preferred Neighborhoods</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {neighborhoods.map((neighborhood) => (
                    <TouchableOpacity
                      key={neighborhood}
                      onPress={() => toggleNeighborhood(neighborhood)}
                      className={`px-3 py-2 rounded-lg border ${
                        newGroup.neighborhoods.includes(neighborhood) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Text className={`text-sm ${
                        newGroup.neighborhoods.includes(neighborhood) ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {neighborhood}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Property Types</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {propertyTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => togglePropertyType(type)}
                      className={`px-3 py-2 rounded-lg border ${
                        newGroup.propertyTypes.includes(type) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Text className={`text-sm ${
                        newGroup.propertyTypes.includes(type) ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            <View className="mb-6">
              <Text className="text-base font-rubik-medium text-black-300 mb-2">Minimum Bedrooms</Text>
              <View className="flex-row space-x-2">
                {[1, 2, 3, 4, 5].map((bedrooms) => (
                  <TouchableOpacity
                    key={bedrooms}
                    onPress={() => setNewGroup({ ...newGroup, bedrooms })}
                    className={`w-12 h-12 rounded-lg border items-center justify-center ${
                      newGroup.bedrooms === bedrooms 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300'
                    }`}
                  >
                    <Text className={`font-rubik-medium ${
                      newGroup.bedrooms === bedrooms ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {bedrooms}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowCollaborationModal(false)}
                className="flex-1 bg-gray-300 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCollaboration}
                className="flex-1 bg-blue-500 py-3 rounded-lg"
              >
                <Text className="text-center font-rubik-medium text-white">Create</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default PropertySharing; 