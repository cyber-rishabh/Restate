import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import icons from "@/constants/icons";
import images from '@/constants/images';

import Search from "@/components/Search";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import { Card, FeaturedCard } from "@/components/Cards";
import SaveSearchModal from "@/components/SaveSearchModal";
import MortgageCalculator from "@/components/MortgageCalculator";

import { useGlobalContext } from "@/lib/global-provider";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestProperties, getProperties } from "@/lib/firebase";
import type { Property } from '@/lib/firebase';
import NotificationCenter from "@/components/NotificationCenter";
import { notificationService } from "@/lib/notifications";

const { width: screenWidth } = Dimensions.get('window');

// Default newsletter data
const defaultNews = [
  {
    id: 1,
    title: "Real Estate Market Trends for 2025",
    summary: "Discover the latest trends shaping the property market this year",
    image: "📈",
    date: "2 days ago",
    content: `# Real Estate Market Trends for 2025

The real estate market in 2025 is experiencing unprecedented changes driven by technology, changing lifestyle preferences, and economic factors.

## Key Trends to Watch

### 1. Smart Home Technology Integration
Modern buyers are increasingly looking for properties equipped with smart home features. From automated lighting systems to AI-powered security, these technologies are becoming standard expectations rather than luxury additions.

### 2. Sustainable Living Focus
Environmental consciousness is driving demand for eco-friendly properties. Solar panels, energy-efficient appliances, and sustainable building materials are top priorities for today's buyers.

### 3. Remote Work Spaces
The hybrid work model has created demand for properties with dedicated office spaces. Home offices, co-working areas, and flexible room designs are highly sought after.

### 4. Urban vs Suburban Shift
There's a noticeable trend toward suburban living as people seek more space and better value for money while maintaining connectivity to urban centers.

## Investment Opportunities

The current market presents unique opportunities for both first-time buyers and seasoned investors. With interest rates stabilizing and inventory levels adjusting, strategic timing can yield significant returns.

*Stay tuned for more market insights and analysis.*`
  },
  {
    id: 2,
    title: "Top 10 Home Buying Tips for First-Time Buyers",
    summary: "Essential advice for making your first property purchase successful",
    image: "🏠",
    date: "1 week ago",
    content: `# Top 10 Home Buying Tips for First-Time Buyers

Buying your first home is an exciting milestone, but it can also feel overwhelming. Here are essential tips to help you navigate the process successfully.

## Before You Start Looking

### 1. Check Your Credit Score
Your credit score significantly impacts your mortgage rates. Aim for a score of 620 or higher for better loan terms.

### 2. Save for Down Payment
While some programs offer low down payment options, having 10-20% saved can provide better rates and terms.

### 3. Get Pre-Approved
Pre-approval gives you a clear budget and shows sellers you're a serious buyer.

## During Your Search

### 4. Location is Everything
Research neighborhoods thoroughly. Consider commute times, schools, amenities, and future development plans.

### 5. Don't Skip the Inspection
A professional home inspection can reveal costly issues before you commit to the purchase.

### 6. Consider Future Needs
Think about your 5-10 year plans. Will you need more space? Different location?

## Making the Offer

### 7. Research Comparable Sales
Understanding recent sales in the area helps you make competitive offers.

### 8. Negotiate Wisely
Everything is potentially negotiable - price, repairs, closing costs, and move-in dates.

### 9. Understand All Costs
Beyond the mortgage, factor in insurance, taxes, maintenance, and utilities.

### 10. Stay Patient
The right home is worth waiting for. Don't rush into a decision you might regret.

*Remember, buying a home is a marathon, not a sprint. Take your time and make informed decisions.*`
  },
  {
    id: 3,
    title: "Investment Properties: What You Need to Know",
    summary: "A comprehensive guide to building wealth through real estate",
    image: "💰",
    date: "3 days ago",
    content: `# Investment Properties: What You Need to Know

Real estate investment can be a powerful wealth-building strategy when approached with knowledge and preparation.

## Types of Investment Properties

### Rental Properties
Traditional buy-and-hold strategy where you purchase properties to rent out for steady cash flow.

**Pros:**
- Steady monthly income
- Property appreciation over time
- Tax benefits and deductions

**Cons:**
- Property management responsibilities
- Vacancy risks
- Maintenance costs

### Fix and Flip
Purchase undervalued properties, renovate them, and sell for profit.

**Pros:**
- Potential for quick profits
- Active involvement in value creation
- Shorter investment timeline

**Cons:**
- Higher risk and capital requirements
- Market timing sensitivity
- Renovation expertise needed

## Key Metrics to Consider

### Cash-on-Cash Return
Measures annual cash flow relative to cash invested. Aim for 8-12% or higher.

### Cap Rate
Net operating income divided by property value. Helps compare different properties.

### 1% Rule
Monthly rent should be at least 1% of purchase price for positive cash flow.

## Getting Started

1. **Educate Yourself**: Understand local markets and investment strategies
2. **Build Your Team**: Real estate agent, accountant, attorney, contractors
3. **Start Small**: Consider house hacking or single-family rentals
4. **Plan for Expenses**: Budget for repairs, vacancies, and management
5. **Scale Gradually**: Reinvest profits to grow your portfolio

## Common Mistakes to Avoid

- Underestimating expenses
- Overleveraging
- Ignoring location fundamentals
- Lack of proper insurance
- Poor tenant screening

*Success in real estate investment requires patience, education, and strategic planning.*`
  },
  {
    id: 4,
    title: "Smart Home Features That Add Value",
    summary: "Technology upgrades that increase your property's worth",
    image: "🏡",
    date: "5 days ago",
    content: `# Smart Home Features That Add Value

In today's market, smart home technology isn't just a convenience—it's becoming an expectation that can significantly impact your property's value.

## High-Impact Smart Upgrades

### Smart Thermostats
**ROI: 85-100%**
- Energy savings of 10-15%
- Remote temperature control
- Learning capabilities for optimal efficiency
- Popular brands: Nest, Ecobee, Honeywell

### Smart Security Systems
**ROI: 75-90%**
- Doorbell cameras and smart locks
- Motion sensors and window/door monitors
- Smartphone alerts and remote monitoring
- Insurance premium discounts

### Smart Lighting
**ROI: 70-85%**
- Automated scheduling and dimming
- Color-changing capabilities
- Energy-efficient LED integration
- Voice and app control

## Moderate-Impact Features

### Smart Appliances
Kitchen appliances with WiFi connectivity and app control add modern appeal:
- Refrigerators with inventory management
- Ovens with remote preheating
- Dishwashers with cycle notifications

### Smart Water Management
- Leak detection systems
- Smart sprinkler systems
- Water usage monitoring
- Automatic shutoff valves

### Voice Assistants Integration
- Amazon Alexa or Google Home compatibility
- Whole-home audio systems
- Centralized smart home control

## Installation Considerations

### Professional vs DIY
- Simple devices: Smart bulbs, plugs, cameras (DIY-friendly)
- Complex systems: Wiring, HVAC integration (Professional recommended)

### Compatibility
Ensure all devices work together through common platforms like:
- Amazon Alexa
- Google Assistant
- Apple HomeKit
- Samsung SmartThings

### Future-Proofing
Choose systems that can be easily updated and expanded as technology evolves.

## Market Appeal

**Millennial Buyers**: 71% willing to pay more for smart home features
**Gen X Buyers**: 58% consider smart features important
**Baby Boomers**: 44% interested in security and convenience features

## Best Practices

1. **Start with essentials**: Security and energy management
2. **Choose reputable brands**: Better reliability and resale value
3. **Keep it simple**: Overly complex systems can deter buyers
4. **Document everything**: Manuals and warranties transfer value
5. **Professional setup**: Ensure proper installation and configuration

*Smart home technology is an investment in both lifestyle and property value. Choose upgrades that align with your needs and local market preferences.*`
  },
  {
    id: 5,
    title: "Understanding Property Taxes and How to Save",
    summary: "Navigate property taxes effectively and discover potential savings",
    image: "📊",
    date: "1 week ago",
    content: `# Understanding Property Taxes and How to Save

Property taxes are one of the largest ongoing expenses of homeownership. Understanding how they work and how to potentially reduce them can save thousands annually.

## How Property Taxes Work

### Assessment Process
Property taxes are based on your home's assessed value, determined by local tax assessors who consider:
- Recent comparable sales
- Property size and features
- Local market conditions
- Improvement and renovations

### Tax Rate Calculation
**Property Tax = Assessed Value × Tax Rate**

Tax rates vary by location and are set by local governments to fund:
- Schools and education
- Police and fire services
- Roads and infrastructure
- Parks and recreation
- Local government operations

## Potential Tax Savings Strategies

### 1. Challenge Your Assessment
If you believe your assessment is too high:
- Research comparable properties
- Document any property issues or defects
- File an appeal within the deadline
- Consider hiring a professional appraiser

### 2. Homestead Exemptions
Many states offer exemptions for primary residences:
- Reduces taxable assessed value
- Significant annual savings
- Must apply and maintain eligibility
- Caps on assessment increases

### 3. Senior and Disability Exemptions
Special programs for qualified homeowners:
- Age-based reductions
- Disability accommodations
- Income-based relief programs
- Veteran exemptions

### 4. Agricultural or Forestry Use
If applicable:
- Significant tax reductions
- Must meet usage requirements
- Long-term commitments may apply

## State-by-State Variations

### High Property Tax States
- New Jersey: 2.49% average rate
- Illinois: 2.27% average rate
- New Hampshire: 2.20% average rate

### Low Property Tax States
- Hawaii: 0.31% average rate
- Alabama: 0.41% average rate
- Louisiana: 0.55% average rate

## Planning and Budgeting

### Escrow Accounts
Most mortgages include property taxes in monthly payments:
- Lender pays taxes on your behalf
- Spreads cost over 12 months
- May require annual payment adjustments

### Direct Payment Benefits
- Potential payment discounts
- Better cash flow control
- Investment opportunity for tax funds

## Important Dates and Deadlines

- **Assessment notices**: Typically January-March
- **Appeal deadlines**: Usually 30-90 days from notice
- **Payment due dates**: Vary by location
- **Penalty dates**: Late fees can be substantial

## Professional Help

Consider professional assistance for:
- Complex appeals processes
- High-value properties
- Commercial properties
- Tax law changes

*Property taxes are inevitable, but with knowledge and action, you can ensure you're paying a fair amount while taking advantage of all available savings opportunities.*`
  }
];

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
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [showMortgageCalculator, setShowMortgageCalculator] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const newsScrollRef = useRef(null);

  // Fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    console.log('📋 Fetching properties with filter:', filter, 'search:', search);
    const props = await getProperties(filter, search, 6);
    const unsoldProps = props.filter(p => !p.sold);
    console.log('📊 Fetched properties:', unsoldProps.length, 'unsold properties');
    console.log('📋 Properties data:', JSON.stringify(unsoldProps, null, 2));
    setProperties(unsoldProps);
    setLoading(false);
  };

  // Fetch latest properties
  const fetchLatest = async () => {
    setLatestLoading(true);
    const latest = await getLatestProperties();
    const unsoldLatest = latest.filter((p) => !p.sold);
    setLatestProperties(unsoldLatest);
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
  }, [params]);

  // Check for new properties since last login
  useEffect(() => {
    const checkNewProperties = async () => {
      if (lastLogin) {
        const latest = await getLatestProperties();
        const newProps = latest.filter(p => {
          const propertyDate = new Date(p.createdAt || Date.now());
          return propertyDate.getTime() > lastLogin && !p.sold;
        });
        setNewPropertyCount(newProps.length);
        
        if (newProps.length > 0) {
          setShowNewPropModal(true);
        }
      }
    };
    
    checkNewProperties();
  }, [lastLogin]);

  const handleCardPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
    fetchLatest();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNotificationPress = () => {
    setShowNotificationCenter(true);
  };

  const loadUnreadCount = async () => {
    try {
      if (user?.id) {
        const notifications = await notificationService.getUserNotifications(user.id);
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Don't show error to user, just set count to 0
      setUnreadNotifications(0);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSearchCriteria = () => {
    const criteria: any = {};
    if (search) criteria.search = search;
    if (filter && filter !== 'All') criteria.filter = filter;
    return criteria;
  };

  const handleSaveSearch = () => {
    setShowSaveSearchModal(true);
  };

  // Auto-rotate news
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % defaultNews.length);
    }, 4000); // Rotate every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle news article click
  const handleNewsClick = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* New Properties Modal */}
      <Modal
        visible={showNewPropModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewPropModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl p-6 mx-5 max-w-sm">
            <View className="items-center mb-4">
              <View className="bg-green-100 p-3 rounded-full mb-3">
                <Text className="text-2xl">🎉</Text>
              </View>
              <Text className="text-xl font-rubik-bold text-black-300 text-center">
                New Properties Available!
              </Text>
              <Text className="text-sm font-rubik text-black-100 text-center mt-2">
                {newPropertyCount} new properties have been added since your last visit.
              </Text>
            </View>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowNewPropModal(false)}
                className="flex-1 bg-gray-100 py-3 px-4 rounded-xl"
              >
                <Text className="text-center font-rubik-medium text-black-300">
                  Dismiss
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowNewPropModal(false);
                  router.push('/explore');
                }}
                className="flex-1 bg-primary-300 py-3 px-4 rounded-xl"
              >
                <Text className="text-center font-rubik-medium text-white">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Notification Center */}
      <NotificationCenter
        visible={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          loadUnreadCount(); // Refresh count when closing
        }}
      />

      {/* News Article Modal */}
      <Modal
        visible={showArticleModal}
        animationType="slide"
        onRequestClose={() => setShowArticleModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowArticleModal(false)}>
              <Text className="text-primary-300 font-rubik-medium text-lg">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-rubik-bold text-black-300">News Article</Text>
            <View style={{ width: 60 }} />
          </View>
          {selectedArticle && (
            <ScrollView className="flex-1 px-5 py-4">
              <View className="mb-4">
                <Text className="text-4xl mb-4">{selectedArticle.image}</Text>
                <Text className="text-2xl font-rubik-bold text-black-300 mb-2">
                  {selectedArticle.title}
                </Text>
                <Text className="text-sm font-rubik text-gray-500 mb-4">
                  {selectedArticle.date}
                </Text>
              </View>
              <View className="mb-6">
                {selectedArticle.content.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('# ')) {
                    return (
                      <Text key={index} className="text-2xl font-rubik-bold text-black-300 mb-4 mt-6">
                        {paragraph.replace('# ', '')}
                      </Text>
                    );
                  } else if (paragraph.startsWith('## ')) {
                    return (
                      <Text key={index} className="text-xl font-rubik-bold text-black-300 mb-3 mt-4">
                        {paragraph.replace('## ', '')}
                      </Text>
                    );
                  } else if (paragraph.startsWith('### ')) {
                    return (
                      <Text key={index} className="text-lg font-rubik-bold text-black-300 mb-2 mt-3">
                        {paragraph.replace('### ', '')}
                      </Text>
                    );
                  } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <Text key={index} className="text-base font-rubik-bold text-black-300 mb-2">
                        {paragraph.replace(/\*\*/g, '')}
                      </Text>
                    );
                  } else if (paragraph.startsWith('*') && paragraph.endsWith('*')) {
                    return (
                      <Text key={index} className="text-base font-rubik italic text-gray-600 mb-4 mt-4">
                        {paragraph.replace(/\*/g, '')}
                      </Text>
                    );
                  } else if (paragraph.startsWith('- ')) {
                    return (
                      <Text key={index} className="text-base font-rubik text-black-200 mb-1 ml-4">
                        • {paragraph.replace('- ', '')}
                      </Text>
                    );
                  } else if (paragraph.trim() !== '') {
                    return (
                      <Text key={index} className="text-base font-rubik text-black-200 mb-3 leading-6">
                        {paragraph}
                      </Text>
                    );
                  }
                  return null;
                })}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
      
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item, index }) => (
          <Card item={item} onPress={() => handleCardPress(item.id ?? '')} index={index} />
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
            <View className="px-5 mt-5">
              <ActivityIndicator size="large" color="#0061FF" />
            </View>
          ) : (
            <NoResults />
          )
        }
        ListHeaderComponent={() => (
          <View className="px-5">
            {/* Simple Header */}
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row">
                <Image source={images.avatar} className="size-12 rounded-full" />
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">Good Morning</Text>
                  <Text className="text-base font-rubik-medium text-black-300">{user?.name || 'User'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleNotificationPress} className="relative">
                <Image source={icons.bell} className="size-6" />
                {unreadNotifications > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadNotifications}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <Search />
            {/* Quick Actions Row - Calculator Button Removed */}
            {(search || (filter && filter !== 'All')) && (
              <View className="mt-4">
                <TouchableOpacity
                  onPress={handleSaveSearch}
                  className="bg-primary-300 py-3 px-4 rounded-lg flex-row items-center justify-center"
                >
                  <Image source={icons.heart} className="w-5 h-5 mr-2" style={{ tintColor: '#fff' }} />
                  <Text className="text-white font-rubik-bold text-base">Save Search</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Featured Section */}
            <View className="my-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">Featured Properties</Text>
                <TouchableOpacity onPress={() => router.push('/explore')}>
                  <Text className="text-primary-300 font-rubik-medium">View All</Text>
                </TouchableOpacity>
              </View>
              {latestLoading ? (
                <View className="mt-4"><ActivityIndicator size="large" color="#0061FF" /></View>
              ) : !latestProperties || latestProperties.length === 0 ? (
                <NoResults />
              ) : (
                <FlatList
                  data={latestProperties}
                  renderItem={({ item, index }) => (
                    <FeaturedCard item={item} onPress={() => handleCardPress(item.id ?? '')} index={index} />
                  )}
                  keyExtractor={(item) => item.id ?? ''}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex gap-5 mt-2"
                />
              )}
            </View>
            {/* Recommendations Section */}
            <View className="mt-5">
              <Text className="text-xl font-rubik-bold text-black-300">Our Recommendations</Text>
              <Filters />
            </View>

            {/* Newsletter Section */}
            <View className="mt-8 mb-8">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="text-xl font-rubik-bold text-black-300">Latest News</Text>
                <View className="flex-row">
                  {defaultNews.map((_, index) => (
                    <View
                      key={index}
                      className={`w-2 h-2 rounded-full mx-1 ${
                        index === currentNewsIndex ? 'bg-primary-300' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </View>
              </View>
              <FlatList
                ref={newsScrollRef}
                data={defaultNews}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleNewsClick(item)}
                    activeOpacity={0.7}
                    style={{ width: screenWidth - 40 }}
                    className="mr-5"
                  >
                    <View className="bg-white rounded-2xl shadow-lg shadow-black-100/70 overflow-hidden">
                      <View className="p-5">
                        <View className="flex-row items-start">
                          <Text className="text-3xl mr-3">{item.image}</Text>
                          <View className="flex-1">
                            <Text className="text-lg font-rubik-bold text-black-300 mb-2">
                              {item.title}
                            </Text>
                            <Text className="text-sm font-rubik text-black-200 mb-3 leading-5">
                              {item.summary}
                            </Text>
                            <Text className="text-xs font-rubik text-gray-500">
                              {item.date}
                            </Text>
                          </View>
                        </View>
                        <View className="mt-4 pt-4 border-t border-gray-100">
                          <Text className="text-primary-300 font-rubik-medium text-center">
                            Read More →
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40));
                  setCurrentNewsIndex(index);
                }}
                getItemLayout={(data, index) => ({
                  length: screenWidth - 40,
                  offset: (screenWidth - 40) * index,
                  index,
                })}
              />
            </View>
          </View>
        )}
      />

      {/* Save Search Modal */}
      <SaveSearchModal
        visible={showSaveSearchModal}
        onClose={() => setShowSaveSearchModal(false)}
        searchCriteria={getSearchCriteria()}
      />

      {/* Mortgage Calculator Modal */}
      <MortgageCalculator
        visible={showMortgageCalculator}
        onClose={() => setShowMortgageCalculator(false)}
      />

      {/* Floating Action Button for Quick Actions */}
      <TouchableOpacity
        onPress={() => router.push('/explore')}
        style={{ position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0061FF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8, zIndex: 1000 }}
        activeOpacity={0.8}
      >
        <Image source={icons.search} className="size-6" style={{ tintColor: '#fff' }} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;