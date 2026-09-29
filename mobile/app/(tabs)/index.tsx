import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Star, Award, ShieldCheck, Heart, X, MapPin } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function MobileMatchingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sampleLawyers = [
    {
      id: "1",
      name: "Dr. Carlos Mendoza",
      bar: "CAL 45892",
      specialty: "Derecho Laboral y Seguridad Social",
      rating: 4.9,
      reviews: 42,
      price: 150,
      city: "Lima (San Isidro / Miraflores)",
      experience: 12,
      score: 96,
      bio: "Especialista en despidos arbitrarios, reclamo de beneficios sociales y litigios ante la SUNAFIL.",
    },
    {
      id: "2",
      name: "Dra. Patricia Alva",
      bar: "CAL 51204",
      specialty: "Derecho de Familia y Sucesiones",
      rating: 4.8,
      reviews: 38,
      price: 180,
      city: "Lima (Surco / San Borja)",
      experience: 9,
      score: 94,
      bio: "Atención personalizada en pensiones de alimentos, divorcios por mutuo acuerdo y régimen de visitas.",
    },
  ];

  const current = sampleLawyers[currentIndex];

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < sampleLawyers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {current ? (
        <View style={styles.cardContainer}>
          {/* Card Frame */}
          <View style={styles.card}>
            {/* Top Match Score */}
            <View style={styles.headerRow}>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>★ {current.score}% Match</Text>
              </View>

              <View style={styles.verifiedBadge}>
                <ShieldCheck color="#10B981" size={14} />
                <Text style={styles.verifiedText}>Colegiatura Habilitada</Text>
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileSection}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {current.name.split(" ")[1]?.charAt(0) || "A"}
                </Text>
              </View>

              <Text style={styles.lawyerName}>{current.name}</Text>

              <View style={styles.barRow}>
                <Award color="#D4AF37" size={13} />
                <Text style={styles.barText}>{current.bar}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.expText}>{current.experience} años exp.</Text>
              </View>
            </View>

            {/* Specialty & Bio */}
            <View style={styles.infoBox}>
              <Text style={styles.specialtyTitle}>{current.specialty}</Text>
              <Text style={styles.bioText}>{current.bio}</Text>
            </View>

            {/* Location & Fee */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin color="#94A3B8" size={13} />
                <Text style={styles.metaText}>{current.city}</Text>
              </View>

              <Text style={styles.priceText}>
                S/ {current.price} <Text style={styles.priceSub}>/ consulta</Text>
              </Text>
            </View>
          </View>

          {/* Swipe Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => handleSwipe("left")}
              style={[styles.actionBtn, styles.passBtn]}
              activeOpacity={0.7}
            >
              <X color="#F43F5E" size={28} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSwipe("right")}
              style={[styles.actionBtn, styles.likeBtn]}
              activeOpacity={0.7}
            >
              <Heart color="#070D1E" size={28} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text style={styles.emptyDesc}>
            No hay más perfiles pendientes en este momento.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070D1E",
  },
  cardContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#0D1527",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  scoreText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  verifiedText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "600",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  lawyerName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    color: "#64748B",
    fontSize: 12,
  },
  expText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: "#070D1E",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 16,
  },
  specialtyTitle: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bioText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  priceText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
  },
  priceSub: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "normal",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    paddingVertical: 14,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  passBtn: {
    backgroundColor: "#1E1B2E",
    borderWidth: 1,
    borderColor: "#F43F5E",
  },
  likeBtn: {
    backgroundColor: "#D4AF37",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyDesc: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
  },
});
