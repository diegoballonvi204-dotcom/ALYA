import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

export default function MobileProfileScreen() {
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de LegalMatch?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://legalmatch.pe/privacidad');
  };

  const handleOpenArco = () => {
    Linking.openURL('https://legalmatch.pe/privacidad/arco');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.userName}>Usuario LegalMatch</Text>
        <Text style={styles.userRole}>Cliente Registrado • DNI Verificado</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta y Seguridad</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={20} color="#D4AF37" />
          <Text style={styles.menuLabel}>Editar Datos Personales</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#D4AF37" />
          <Text style={styles.menuLabel}>Seguridad y 2FA</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color="#D4AF37" />
          <Text style={styles.menuLabel}>Preferencias de Notificación</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidad y Derechos ARCO (Ley 29733)</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleOpenPrivacy}>
          <Ionicons name="document-text-outline" size={20} color="#38bdf8" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Política de Privacidad Perú</Text>
            <Text style={styles.menuSubLabel}>Banco de Datos RNPDP N.° 21894</Text>
          </View>
          <Ionicons name="open-outline" size={18} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleOpenArco}>
          <Ionicons name="key-outline" size={20} color="#38bdf8" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Ejercer Derechos ARCO</Text>
            <Text style={styles.menuSubLabel}>Acceso, Rectificación, Cancelación, Oposición</Text>
          </View>
          <Ionicons name="open-outline" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.complianceCard}>
        <Ionicons name="lock-closed" size={22} color="#D4AF37" />
        <Text style={styles.complianceText}>
          Tus datos se procesan con cifrado de grado bancario (AES-256) en cumplimiento estricto con la Ley N.° 29733 y D.S. 003-2013-JUS de la República del Perú.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>LegalMatch Mobile v1.0.0 • Build 2026.09</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1E',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#070D1E',
    fontWeight: '800',
    fontSize: 28,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#D4AF37',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    gap: 12,
  },
  complianceText: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748b',
    marginVertical: 20,
  },
});
