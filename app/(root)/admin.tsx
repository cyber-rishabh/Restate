import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AddPropertyModal from '@/components/AddPropertyModal';
import { Card } from '@/components/Cards';
import { getProperties, deleteProperty as deletePropertyFromDb, Property } from '@/lib/firebase';
import icons from '@/constants/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';

function AdminPanel() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'add' | 'delete'>('add');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const props = await getProperties();
      setProperties(props);
    } catch (e) {
      Alert.alert('Error', 'Failed to load properties');
    }
    setLoading(false);
  };

  const handleAddProperty = () => {
    setShowAddModal(true);
  };

  const handlePropertyAdded = () => {
    setShowAddModal(false);
    fetchProperties();
  };

  const handleDeleteProperty = (id: string | undefined) => {
    if (!id) return;
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProperty(id) },
      ]
    );
  };

  const deleteProperty = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePropertyFromDb(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      Alert.alert('Deleted', 'Property has been deleted.');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete property.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <View style={styles.cardContainer}>
      <Card item={item} />
      {mode === 'delete' && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteProperty(item.id)}
          disabled={deletingId === item.id}
        >
          <Text style={styles.deleteText}>
            {deletingId === item.id ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#e0e7ff", "#f0f4ff", "#ffffff"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient colors={["#0061FF", "#4F8CFF"]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}> 
            <Image source={icons.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>
        {/* Mode Switch with Icons */}
        <View style={styles.modeSwitchContainer}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'add' && styles.modeBtnActive]}
            onPress={() => setMode('add')}
            activeOpacity={0.8}
          >
            <Image source={icons.edit} style={{ width: 18, height: 18, marginRight: 6, tintColor: mode === 'add' ? '#fff' : '#191D31' }} />
            <Text style={[styles.modeBtnText, mode === 'add' && styles.modeBtnTextActive]}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'delete' && styles.modeBtnActive]}
            onPress={() => setMode('delete')}
            activeOpacity={0.8}
          >
            <Image source={icons.edit} style={{ width: 18, height: 18, marginRight: 6, tintColor: mode === 'delete' ? '#fff' : '#191D31' }} />
            <Text style={[styles.modeBtnText, mode === 'delete' && styles.modeBtnTextActive]}>Delete</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Manage all properties below</Text>
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id ?? ''}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              {/* Property Image */}
              {item.image && (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: 140, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
              )}
              {/* Property Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#191D31' }}>{item.name || 'No Name'}</Text>
                {item.sold && <Text style={{ backgroundColor: '#FF3B30', color: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, fontWeight: 'bold' }}>SOLD</Text>}
              </View>
              <Text style={{ color: '#0061FF', fontWeight: 'bold', fontSize: 16, marginTop: 2 }}>{item.price ? `$${item.price}` : ''}</Text>
              {/* Card Actions */}
              {mode === 'delete' && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProperty(item.id)}
                  disabled={deletingId === item.id}
                  activeOpacity={0.7}
                >
                  <Image source={icons.edit} style={{ width: 16, height: 16, marginRight: 4, tintColor: '#fff' }} />
                  <Text style={styles.deleteText}>
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchProperties}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Image source={require('@/assets/images/no-result.png')} style={{ width: 120, height: 120, marginBottom: 16, opacity: 0.7 }} />
                <Text style={styles.emptyText}>No properties found.</Text>
              </View>
            ) : null
          }
        />
        {mode === 'add' && (
          <TouchableOpacity style={styles.fab} onPress={handleAddProperty} activeOpacity={0.85}>
            <Image source={icons.edit} style={{ width: 28, height: 28, tintColor: '#fff' }} />
          </TouchableOpacity>
        )}
        <AddPropertyModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPropertyAdded={handlePropertyAdded}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
export default AdminPanel;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#191D31',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#191D31',
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#0061FF',
  },
  modeBtnText: {
    fontSize: 16,
    color: '#191D31',
    fontWeight: 'bold',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 10,
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#0061FF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 18,
  },
}); 