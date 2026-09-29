import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ChatItem {
  id: string;
  recipientName: string;
  specialty: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

export default function MobileChatScreen() {
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production this queries conversations with realtime subscription
    const mockChats: ChatItem[] = [
      {
        id: '1',
        recipientName: 'Dra. María Elena Ramos',
        specialty: 'Derecho Laboral - CAL 45892',
        lastMessage: 'He revisado el contrato de locación de servicios adjunto...',
        updatedAt: '10:45 AM',
        unreadCount: 2,
      },
      {
        id: '2',
        recipientName: 'Dr. Carlos Mendoza',
        specialty: 'Derecho Corporativo - CAL 38120',
        lastMessage: 'Confirmada la sesión de asesoría virtual para mañana.',
        updatedAt: 'Ayer',
        unreadCount: 0,
      }
    ];

    const timer = setTimeout(() => {
      setConversations(mockChats);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={styles.chatCard} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.recipientName.charAt(0)}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.lawyerName} numberOfLines={1}>{item.recipientName}</Text>
          <Text style={styles.timestamp}>{item.updatedAt}</Text>
        </View>
        <Text style={styles.specialtyBadge}>{item.specialty}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Mensajes Legales</Text>
        <Text style={styles.subtitle}>Comunicaciones encriptadas y protegidas</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>Sin mensajes activos</Text>
          <Text style={styles.emptySubtitle}>
            Cuando hagas match bilateral con un abogado, tus conversaciones aparecerán aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1E',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#070D1E',
    fontWeight: '700',
    fontSize: 20,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lawyerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 8,
  },
  specialtyBadge: {
    fontSize: 11,
    color: '#D4AF37',
    marginVertical: 2,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 13,
    color: '#94a3b8',
  },
  unreadBadge: {
    backgroundColor: '#D4AF37',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#070D1E',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
