import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getInformes } from "@/services/informes";
import { colors } from "@/components/ui/colors";
import { InformeWithPatient } from "@/types/database";

const statusConfig = {
  recording: {
    label: "Grabando",
    color: colors.warning,
    bg: colors.warningLight,
    icon: "🎙",
  },
  processing: {
    label: "Procesando",
    color: colors.blue,
    bg: colors.blueLight,
    icon: "⏳",
  },
  completed: {
    label: "Completado",
    color: colors.emerald,
    bg: colors.emeraldLight,
    icon: "✓",
  },
  error: {
    label: "Error",
    color: colors.destructive,
    bg: colors.destructiveLight,
    icon: "⚠",
  },
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [informes, setInformes] = useState<InformeWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInformes = useCallback(async () => {
    const result = await getInformes();
    if (result.data) {
      setInformes(result.data as InformeWithPatient[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInformes();
    }, [fetchInformes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInformes();
  };

  const completedCount = informes.filter((i) => i.status === "completed").length;
  const processingCount = informes.filter((i) => i.status === "processing").length;
  const errorCount = informes.filter((i) => i.status === "error").length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>IMI</Text>
          <Text style={styles.headerSub}>Panel principal</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.emailText} numberOfLines={1}>
            {user?.email}
          </Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.flex1]}>
            <Text style={styles.statNumber}>{informes.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.flex1]}>
            <Text style={[styles.statNumber, { color: colors.emerald }]}>
              {completedCount}
            </Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
          <View style={[styles.statCard, styles.flex1]}>
            <Text
              style={[
                styles.statNumber,
                {
                  color: errorCount > 0 ? colors.destructive : colors.warning,
                },
              ]}
            >
              {errorCount > 0 ? errorCount : processingCount}
            </Text>
            <Text style={styles.statLabel}>
              {errorCount > 0 ? "Errores" : "En proceso"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informes recientes</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push("/nuevo-informe")}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : informes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin informes aún</Text>
            <Text style={styles.emptyText}>
              Creá un nuevo informe para comenzar una consulta.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/nuevo-informe")}
            >
              <Text style={styles.emptyBtnText}>+ Nuevo Informe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {informes.map((informe) => {
              const status =
                statusConfig[informe.status as keyof typeof statusConfig] ??
                statusConfig.error;
              const href =
                informe.status === "recording"
                  ? `/grabar/${informe.id}`
                  : `/informe/${informe.id}`;

              return (
                <TouchableOpacity
                  key={informe.id}
                  style={styles.informeCard}
                  onPress={() => router.push(href as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.informeAvatar}>
                    <Text style={styles.informeAvatarText}>
                      {informe.patients?.name?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.informeInfo}>
                    <View style={styles.informeRow}>
                      <Text style={styles.informeName} numberOfLines={1}>
                        {informe.patients?.name ?? "Paciente desconocido"}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.bg },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.icon} {status.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.informeMeta}>
                      {informe.patients?.phone && (
                        <Text style={styles.metaText}>
                          📞 {informe.patients.phone}
                        </Text>
                      )}
                      <Text style={styles.metaText}>
                        🕐 {formatDate(informe.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: "55%",
  },
  emailText: {
    fontSize: 11,
    color: colors.muted,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingCenter: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    gap: 10,
  },
  informeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  informeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  informeAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  informeInfo: {
    flex: 1,
    gap: 4,
  },
  informeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  informeName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  informeMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted,
  },
  chevron: {
    fontSize: 22,
    color: colors.muted,
    flexShrink: 0,
  },
});
