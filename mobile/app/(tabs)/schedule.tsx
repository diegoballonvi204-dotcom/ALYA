import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Appointment {
  id: string;
  lawyerName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
  meetingUrl?: string;
}

export default function MobileScheduleScreen() {
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      lawyerName: 'Dra. María Elena Ramos',
      specialty: 'Derecho Laboral',
      date: 'Mañana, 30 Sep 2026',
      time: '15:30 - 16:15',
      status: 'confirmed',
      meetingUrl: 'https://meet.google.com/xyz-legalmatch',
    },
    {
      id: '2',
      lawyerName: 'Dr. Carlos Mendoza',
      specialty: 'Derecho Corporativo',
      date: 'Viernes, 02 Oct 2026',
      time: '10:00 - 10:45',
      status: 'pending',
    }
  ]);

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'confirmed' ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.statusText}>
            {item.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
          </Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <Text style={styles.lawyerName}>{item.lawyerName}</Text>
      <Text style={styles.specialty}>{item.specialty}</Text>

      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={16} color="#D4AF37" />
        <Text style={styles.timeValue}>{item.time}</Text>
      </View>

      {item.status === 'confirmed' && (
        <TouchableOpacity style={styles.joinButton} activeOpacity={0.8}>
          <Ionicons name="videocam-outline" size={18} color="#070D1E" />
          <Text style={styles.joinButtonText}>Ingresar a Sala Virtual</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Agenda Legal</Text>
        <Text style={styles.subtitle}>Citas virtuales y consultas presenciales</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
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
    gap: 14,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f8fafc',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  lawyerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  specialty: {
    fontSize: 13,
    color: '#D4AF37',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  timeValue: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  joinButtonText: {
    color: '#070D1E',
    fontWeight: '700',
    fontSize: 13,
  },
});
