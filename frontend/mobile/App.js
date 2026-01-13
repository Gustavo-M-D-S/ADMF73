import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const App = () => {
  const [closet, setCloset] = useState([]);
  const [activeTab, setActiveTab] = useState('closet');

  const mockData = {
    closet: [
      { id: '1', name: 'Camiseta branca', category: 'top', color: '#FFFFFF', image: null },
      { id: '2', name: 'Jeans azul', category: 'bottom', color: '#1E40AF', image: null },
      { id: '3', name: 'Vestido floral', category: 'dress', color: '#EC4899', image: null },
      { id: '4', name: 'Blazer preto', category: 'outerwear', color: '#000000', image: null },
      { id: '5', name: 'Tênis branco', category: 'shoes', color: '#F3F4F6', image: null },
    ],
    recommendations: [
      { id: '1', items: ['1', '2'], confidence: 0.85, occasion: 'casual' },
      { id: '2', items: ['3'], confidence: 0.92, occasion: 'date' },
    ]
  };

  const renderClosetItem = ({ item }) => (
    <TouchableOpacity style={styles.closetItem}>
      <View style={[styles.itemImage, { backgroundColor: item.color }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <Icon name="hanger" size={30} color="#666" />
        )}
      </View>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  const renderRecommendation = ({ item }) => (
    <View style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationTitle}>Look {item.id}</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{Math.round(item.confidence * 100)}%</Text>
        </View>
      </View>
      <Text style={styles.recommendationOccasion}>{item.occasion}</Text>
      <TouchableOpacity style={styles.tryButton}>
        <Text style={styles.tryButtonText}>Experimentar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Closset.IA</Text>
        <TouchableOpacity>
          <Icon name="account-circle" size={32} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockData.closet.length}</Text>
          <Text style={styles.statLabel}>Peças</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockData.recommendations.length}</Text>
          <Text style={styles.statLabel}>Looks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'closet' && styles.activeTab]}
          onPress={() => setActiveTab('closet')}
        >
          <Icon name="wardrobe" size={24} color={activeTab === 'closet' ? '#7C3AED' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'closet' && styles.activeTabText]}>
            Guarda-Roupa
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Icon name="lightbulb" size={24} color={activeTab === 'recommendations' ? '#7C3AED' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Sugestões
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => setActiveTab('add')}
        >
          <Icon name="plus-circle" size={24} color={activeTab === 'add' ? '#7C3AED' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
            Adicionar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'closet' && (
          <FlatList
            data={mockData.closet}
            renderItem={renderClosetItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.closetGrid}
          />
        )}
        
        {activeTab === 'recommendations' && (
          <FlatList
            data={mockData.recommendations}
            renderItem={renderRecommendation}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.recommendationsList}
          />
        )}
        
        {activeTab === 'add' && (
          <View style={styles.addContainer}>
            <TouchableOpacity style={styles.uploadButton}>
              <Icon name="camera" size={48} color="#7C3AED" />
              <Text style={styles.uploadText}>Tirar foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton}>
              <Icon name="image" size={48} color="#7C3AED" />
              <Text style={styles.uploadText}>Escolher da galeria</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Icon name="robot" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  closetGrid: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closetItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recommendationsList: {
    paddingBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationOccasion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  tryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: '80%',
    height: 150,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default App;