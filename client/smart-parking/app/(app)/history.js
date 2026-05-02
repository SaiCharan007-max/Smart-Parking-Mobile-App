import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { getBookingHistory } from "../../services/bookingService";
import { format } from "date-fns";
import { formatCurrency, getStatusTone, theme } from "../../theme";

const DEBUG_PREFIX = "[ParkX FE][History]";

export default function HistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadHistory = React.useCallback(async () => {
    try {
      console.log(`${DEBUG_PREFIX} loadHistory called`);
      setIsLoading(true);
      setError("");
      const data = await getBookingHistory();
      setBookings(Array.isArray(data) ? data : []);
      console.log(`${DEBUG_PREFIX} loadHistory success`, {
        count: Array.isArray(data) ? data.length : 0,
      });
    } catch (err) {
      console.error(`${DEBUG_PREFIX} loadHistory failed`, err?.message || err);
      setError(err?.message || "Failed to load booking history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderBookingItem = ({ item }) => {
    const statusTone = getStatusTone(item.status);
    return (
      <TouchableOpacity style={[theme.card, styles.card]} onPress={() => router.push(`/receipt/${item.id}`)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.bookingId}>Booking #{item.id}</Text>
            <Text style={styles.metaText}>
              {item.vehicle_number || "Vehicle removed"} | Area {String(item.area || "").toUpperCase()}-{item.slot_number}
            </Text>
          </View>
          <Text style={[styles.status, statusTone]}>{item.status}</Text>
        </View>

        <View style={styles.detailRow}>
          <FontAwesome5 name="clock" size={14} color={theme.colors.textSoft} />
          <Text style={styles.detailText}>{format(new Date(item.entry_time), "MMM d, yyyy 'at' h:mm a")}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
          <Text style={styles.duration}>{item.duration_minutes || 0} min</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !bookings.length) {
    return (
      <View style={[theme.screen, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={theme.screen}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={theme.heroCard}>
            <Text style={[theme.heading, styles.header]}>Session History</Text>
            <Text style={styles.headerSub}>Completed and active parking sessions in one timeline.</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No bookings found yet.</Text> : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadHistory} tintColor={theme.colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  header: {
    fontSize: 28,
  },
  headerSub: {
    marginTop: 8,
    color: theme.colors.textMuted,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  bookingId: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  metaText: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  status: {
    alignSelf: "flex-start",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    color: theme.colors.textMuted,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  amount: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  duration: {
    color: theme.colors.textSoft,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 36,
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.danger,
  },
});
