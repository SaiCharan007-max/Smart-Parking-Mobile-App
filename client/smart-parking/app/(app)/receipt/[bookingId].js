import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { getBookingById, exitParking } from "../../../services/bookingService";
import { format } from "date-fns";
import {
  calculateEstimatedAmount,
  calculateDurationMinutes,
  formatCurrency,
  formatDurationLabel,
  getStatusTone,
  theme,
} from "../../../theme";

const DEBUG_PREFIX = "[ParkX FE][Receipt]";

export default function ReceiptPage() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const resolvedBookingId = Array.isArray(bookingId) ? bookingId[0] : bookingId;
  const [booking, setBooking] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEndingSession, setIsEndingSession] = React.useState(false);
  const [error, setError] = React.useState("");
  const [now, setNow] = React.useState(Date.now());

  const loadBooking = React.useCallback(async () => {
    if (!resolvedBookingId) return;

    try {
      console.log(`${DEBUG_PREFIX} loadBooking called`, { bookingId: resolvedBookingId });
      setIsLoading(true);
      setError("");
      const data = await getBookingById(resolvedBookingId);
      setBooking(data);
      console.log(`${DEBUG_PREFIX} loadBooking success`, {
        bookingId: data?.id,
        status: data?.status,
      });
    } catch (err) {
      console.error(`${DEBUG_PREFIX} loadBooking failed`, err?.message || err);
      setError(err?.message || "Could not load booking details.");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedBookingId]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  React.useEffect(() => {
    if (!booking || booking.status !== "active") {
      return undefined;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  const confirmEndParking = async () => {
    try {
      console.log(`${DEBUG_PREFIX} confirmEndParking called`, { bookingId: resolvedBookingId });
      setIsEndingSession(true);
      const updatedBooking = await exitParking(resolvedBookingId);
      setBooking(updatedBooking);
      console.log(`${DEBUG_PREFIX} confirmEndParking success`, {
        bookingId: updatedBooking?.id,
        status: updatedBooking?.status,
      });
    } catch (err) {
      console.error(`${DEBUG_PREFIX} confirmEndParking failed`, err?.message || err);
      Alert.alert("Error", err?.message || "Could not end the session.");
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleEndParking = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to end this session?");
      if (confirm) {
        confirmEndParking();
      }
      return;
    }

    Alert.alert("End Parking Session", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Session",
        style: "destructive",
        onPress: confirmEndParking,
      },
    ]);
  };

  const renderDetailRow = (icon, label, value) => (
    <View style={styles.detailRow}>
      <FontAwesome5 name={icon} size={16} color={theme.colors.primary} style={styles.icon} />
      <View style={styles.detailCopy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[theme.screen, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[theme.screen, styles.centered]}>
        <Text style={styles.errorText}>{error || "Booking not found."}</Text>
      </View>
    );
  }

  const liveDurationMinutes =
    booking.status === "active"
      ? calculateDurationMinutes(booking.entry_time, now)
      : booking.duration_minutes;
  const liveAmount =
    booking.status === "active"
      ? calculateEstimatedAmount(booking.entry_time, booking.pricing_rate_per_hour, now)
      : booking.total_amount;

  return (
    <ScrollView style={theme.screen} contentContainerStyle={styles.container}>
      <View style={theme.heroCard}>
        <Text style={[theme.heading, styles.header]}>Session Receipt</Text>
        <Text style={styles.heroText}>
          {booking.vehicle_number || "Vehicle"} in Area {String(booking.area || "").toUpperCase()}-{booking.slot_number}
        </Text>
        {booking.status === "active" ? (
          <View style={styles.liveStrip}>
            <View style={styles.liveChip}>
              <Text style={styles.liveChipLabel}>Live Timer</Text>
              <Text style={styles.liveChipValue}>{formatDurationLabel(liveDurationMinutes)}</Text>
            </View>
            <View style={styles.liveChip}>
              <Text style={styles.liveChipLabel}>Current Price</Text>
              <Text style={styles.liveChipValue}>{formatCurrency(liveAmount)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {booking.status === "completed" ? (
        <View style={styles.receiptBanner}>
          <Text style={styles.receiptBannerTitle}>Final Receipt Ready</Text>
          <Text style={styles.receiptBannerText}>
            Review your completed parking time, billing rate, payment status, and total amount below.
          </Text>
        </View>
      ) : null}

      <View style={[theme.card, styles.receiptCard]}>
        {renderDetailRow("hashtag", "Booking", `#${booking.id}`)}
        {renderDetailRow("car", "Vehicle", booking.vehicle_number || "Removed Vehicle")}
        {renderDetailRow("car-side", "Model", booking.vehicle_model || "Unknown")}
        {renderDetailRow("map-marker-alt", "Slot", `Area ${String(booking.area || "").toUpperCase()} - ${booking.slot_number}`)}
        {renderDetailRow("clock", "Entry Time", format(new Date(booking.entry_time), "PPpp"))}
        {booking.exit_time ? renderDetailRow("sign-out-alt", "Exit Time", format(new Date(booking.exit_time), "PPpp")) : null}
        {renderDetailRow(
          "hourglass-half",
          booking.status === "active" ? "Live Duration" : "Duration",
          formatDurationLabel(liveDurationMinutes)
        )}
        {renderDetailRow("rupee-sign", "Rate", `${formatCurrency(booking.pricing_rate_per_hour)}/hr`)}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {booking.status === "active" ? "Current Estimate" : "Total Amount"}
          </Text>
          <Text style={styles.totalValue}>{formatCurrency(liveAmount)}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.status, getStatusTone(booking.status)]}>{booking.status}</Text>
          <Text style={[styles.status, getStatusTone(booking.payment_status)]}>{booking.payment_status}</Text>
        </View>
      </View>

      {booking.status === "active" && (
        <TouchableOpacity
          style={[styles.endButton, isEndingSession && styles.endButtonDisabled]}
          onPress={handleEndParking}
          disabled={isEndingSession}
        >
          {isEndingSession ? (
            <ActivityIndicator color="#fff5f5" />
          ) : (
            <Text style={styles.endButtonText}>End Session And Generate Receipt</Text>
          )}
        </TouchableOpacity>
      )}

      {booking.status === "completed" ? (
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
          <Text style={styles.backButtonText}>Back To Dashboard</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  header: {
    fontSize: 28,
  },
  heroText: {
    marginTop: 8,
    color: theme.colors.textMuted,
  },
  liveStrip: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  liveChip: {
    flex: 1,
    backgroundColor: "#0a1621",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
  },
  liveChipLabel: {
    color: theme.colors.textSoft,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  liveChipValue: {
    marginTop: 4,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  receiptBanner: {
    backgroundColor: "#153126",
    borderWidth: 1,
    borderColor: "#27664b",
    borderRadius: 16,
    padding: 16,
  },
  receiptBannerTitle: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  receiptBannerText: {
    marginTop: 6,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  receiptCard: {
    padding: 20,
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icon: {
    marginTop: 3,
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: theme.colors.textSoft,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  value: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  totalValue: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "800",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  status: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    textTransform: "uppercase",
  },
  endButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
  },
  endButtonDisabled: {
    opacity: 0.65,
  },
  endButtonText: {
    color: "#fff5f5",
    fontWeight: "800",
  },
  backButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  backButtonText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: "center",
  },
});
