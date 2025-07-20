import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AddPropertyModal from '@/components/AddPropertyModal';
import { Card } from '@/components/Cards';
import { getProperties, deleteProperty as deletePropertyFromDb, Property } from '@/lib/firebase';
import icons from '@/constants/icons';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}> 
        </TouchableOpacity>
      </View>
      <View style={styles.modeSwitchContainer}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'add' && styles.modeBtnActive]}
          onPress={() => setMode('add')}
        >
          <Text style={[styles.modeBtnText, mode === 'add' && styles.modeBtnTextActive]}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'delete' && styles.modeBtnActive]}
          onPress={() => setMode('delete')}
        >
          <Text style={[styles.modeBtnText, mode === 'delete' && styles.modeBtnTextActive]}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Manage all properties below</Text>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderProperty}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchProperties}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No properties found.</Text>
            </View>
          ) : null
        }
      />
      {mode === 'add' && (
        <TouchableOpacity style={styles.fab} onPress={handleAddProperty}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
      <AddPropertyModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </SafeAreaView>
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