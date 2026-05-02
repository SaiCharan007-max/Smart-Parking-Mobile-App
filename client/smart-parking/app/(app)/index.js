import React from "react";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import useSession from "../../hooks/useSession";
import { getActiveBooking, getActiveBookings } from "../../services/bookingService";
import { getAreas } from "../../services/slotsService";
import {
  calculateEstimatedAmount,
  calculateDurationMinutes,
  formatCurrency,
  formatDurationLabel,
} from "../../theme";
import { useThemeMode } from "../../hooks/useThemeMode";

export default function Dashboard() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useSession();
  const { theme } = useThemeMode();
  const [loading, setLoading] = React.useState(true);
  const [areas, setAreas] = React.useState([]);
  const [activeBookings, setActiveBookings] = React.useState([]);
  const [error, setError] = React.useState("");
  const [now, setNow] = React.useState(Date.now());
  const [searchPlate, setSearchPlate] = React.useState("");
  const [reminder, setReminder] = React.useState(null);
  const reminderTimeout = React.useRef(null);
  const reminderInterval = React.useRef(null);

  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const searchResult = React.useMemo(() => {
    const query = searchPlate.trim().toLowerCase();
    if (!query) return null;
    return activeBookings.find((b) => String(b.vehicle_number || "").toLowerCase().includes(query));
  }, [searchPlate, activeBookings]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [active, activeList, areaList] = await Promise.all([
        getActiveBooking(),
        getActiveBookings(),
        getAreas(),
      ]);
      setActiveBookings(Array.isArray(activeList) ? activeList : active ? [active] : []);
      setAreas(Array.isArray(areaList) ? areaList : []);
    } catch (err) {
      setError(err?.message || "Unable to load dashboard data right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadData();
      }
    }, [isAuthenticated, loadData])
  );

  React.useEffect(() => {
    if (!activeBookings.length) {
      return undefined;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBookings]);

  React.useEffect(() => {
    if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
    if (reminderInterval.current) clearInterval(reminderInterval.current);

    if (!activeBookings.length) {
      setReminder(null);
      return undefined;
    }

    const primary = activeBookings[0];
    const entryTime = new Date(primary.entry_time).getTime();
    const elapsed = Date.now() - entryTime;
    const initialDelay = Math.max(0, 60000 - elapsed);

    reminderTimeout.current = setTimeout(() => {
      setReminder(
        `It has been a minute since you parked ${primary.vehicle_number || "your vehicle"} in Area ${String(primary.area || "").toUpperCase()}-${primary.slot_number}.`
      );
    }, initialDelay);

    reminderInterval.current = setInterval(() => {
      setReminder(
        `Hourly reminder: ${primary.vehicle_number || "vehicle"} is in Area ${String(primary.area || "").toUpperCase()}-${primary.slot_number}.`
      );
    }, 60 * 60 * 1000);

    return () => {
      if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
      if (reminderInterval.current) clearInterval(reminderInterval.current);
    };
  }, [activeBookings]);

  if (!isReady) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  const totalAvailable = areas.reduce((sum, area) => sum + Number(area.available_slots || 0), 0);

  return (
    <ScrollView
      style={theme.screen}
      contentContainerStyle={[theme.content, styles.container]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[theme.heroCard, theme.shadow, styles.heroCard]}>
        <Text style={[theme.heading, styles.kicker]}>PARKING OPERATIONS</Text>
        <Text style={[theme.heading, styles.title]}>Smart parking, without the clutter.</Text>
        <Text style={styles.subtitle}>
          Monitor live capacity, continue active sessions, and move from entry to billing in one flow.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{areas.length}</Text>
            <Text style={styles.statLabel}>Zones</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{totalAvailable}</Text>
            <Text style={styles.statLabel}>Open Slots</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{activeBookings.length}</Text>
            <Text style={styles.statLabel}>Live Sessions</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Session</Text>
        {reminder ? (
          <View style={[theme.card, styles.reminderCard]}>
            <View style={styles.reminderDot} />
            <Text style={styles.reminderText}>{reminder}</Text>
            <TouchableOpacity onPress={() => setReminder(null)} style={styles.reminderClose}>
              <Text style={styles.reminderCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search active session by plate"
            placeholderTextColor={theme.colors.textSoft}
            value={searchPlate}
            onChangeText={setSearchPlate}
            autoCapitalize="characters"
          />
        </View>
        {searchPlate.trim().length ? (
          searchResult ? (
            <View style={[theme.card, styles.searchResultCard]}>
              <Text style={styles.searchResultTitle}>{searchResult.vehicle_number}</Text>
              <Text style={styles.searchResultMeta}>
                Area {String(searchResult.area || "").toUpperCase()}-{searchResult.slot_number} · Started {new Date(searchResult.entry_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ) : (
            <Text style={styles.searchResultEmpty}>No active booking found for that plate.</Text>
          )
        ) : null}

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : activeBookings.length ? (
          activeBookings.map((active) => {
            const durationLabel = formatDurationLabel(
              calculateDurationMinutes(active.entry_time, now)
            );
            const estimate = formatCurrency(
              calculateEstimatedAmount(active.entry_time, active.pricing_rate_per_hour, now)
            );
            return (
              <TouchableOpacity
                key={active.id}
                style={[theme.card, styles.activeCard]}
                onPress={() => router.push(`/receipt/${active.id}`)}
              >
                <View style={styles.badgeIcon}>
                  <FontAwesome5 name="parking" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.activeContent}>
                  <Text style={styles.activeTitle}>
                    {active.vehicle_number || "Vehicle"} in {String(active.area || "").toUpperCase()}-{active.slot_number}
                  </Text>
                  <Text style={styles.activeMeta}>
                    Started at {new Date(active.entry_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text style={styles.activeLiveMeta}>Live duration: {durationLabel}</Text>
                </View>
                <Text style={styles.activeAmount}>{estimate}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={[theme.card, styles.emptyState]}>
            <Text style={styles.emptyTitle}>No active parking session</Text>
            <Text style={styles.emptyText}>Pick a zone and reserve an open slot when you are ready.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/areas")}>
              <Text style={styles.primaryButtonText}>Browse Areas</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Area Overview</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          areas.map((area) => (
            <TouchableOpacity
              key={String(area.area)}
              style={[theme.card, styles.areaCard]}
              onPress={() => router.push(`/areas?areaId=${area.area}`)}
            >
              <View>
                <Text style={styles.areaName}>Area {String(area.area).toUpperCase()}</Text>
                <Text style={styles.areaMeta}>
                  {area.available_slots} available of {area.total_slots}
                </Text>
              </View>
              <View style={styles.capacityPill}>
                <Text style={styles.capacityText}>{area.occupied_slots} occupied</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shortcuts</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={[theme.card, styles.quickCard]} onPress={() => router.push("/vehicles")}>
            <FontAwesome5 name="car-side" size={18} color={theme.colors.accent} />
            <Text style={styles.quickTitle}>Vehicles</Text>
            <Text style={styles.quickMeta}>Manage saved plates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[theme.card, styles.quickCard]} onPress={() => router.push("/history")}>
            <FontAwesome5 name="receipt" size={18} color={theme.colors.info} />
            <Text style={styles.quickTitle}>History</Text>
            <Text style={styles.quickMeta}>View completed sessions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    paddingBottom: 30,
  },
  heroCard: {
    overflow: "hidden",
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 2,
    color: theme.colors.primary,
  },
  title: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    marginTop: 10,
    color: theme.colors.textMuted,
    lineHeight: 21,
  },
  heroStats: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  statBlock: {
    flex: 1,
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 4,
    color: theme.colors.textSoft,
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  reminderCard: {
    marginTop: 4,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reminderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  reminderText: {
    flex: 1,
    color: theme.colors.text,
  },
  reminderClose: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceStrong,
  },
  reminderCloseText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  searchRow: {
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
  },
  searchResultCard: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchResultTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  searchResultMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  searchResultEmpty: {
    marginTop: 6,
    color: theme.colors.textMuted,
  },
  activeCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  activeContent: {
    flex: 1,
    gap: 4,
  },
  activeTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  activeMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  activeLiveMeta: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  activeAmount: {
    color: theme.colors.accent,
    fontWeight: "800",
  },
  emptyState: {
    padding: 18,
    gap: 10,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#092016",
    fontWeight: "800",
  },
  areaCard: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  areaMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  capacityPill: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  capacityText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    padding: 18,
    gap: 8,
  },
  quickTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  quickMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.danger,
  },
});
