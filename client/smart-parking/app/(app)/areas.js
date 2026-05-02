import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { getSlotsByArea } from "../../services/slotsService";
import { getVehicles } from "../../services/vehicleService";
import { bookSlot, getActiveBooking } from "../../services/bookingService";
import {
  calculateEstimatedAmount,
  calculateDurationMinutes,
  formatCurrency,
  formatDurationLabel,
  theme,
} from "../../theme";

const NUM_COLUMNS = 3;

export default function AreasPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const areaId = String(params.areaId || "a").toLowerCase();
  const [slots, setSlots] = React.useState([]);
  const [vehicles, setVehicles] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [activeBooking, setActiveBooking] = React.useState(null);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());

  const availableCount = slots.filter((slot) => !slot.is_occupied).length;
  const occupiedCount = slots.length - availableCount;

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [slotsData, vehiclesData, activeBookingData] = await Promise.all([
        getSlotsByArea(areaId),
        getVehicles(),
        getActiveBooking(),
      ]);
      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setActiveBooking(activeBookingData || null);

      if (Array.isArray(vehiclesData) && vehiclesData.length > 0) {
        setSelectedVehicle(vehiclesData[0].id);
      }
    } catch (err) {
      setError(err?.message || "Failed to load area data.");
    } finally {
      setIsLoading(false);
    }
  }, [areaId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!activeBooking) {
      return undefined;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBooking]);

  const handleSlotPress = (slot) => {
    if (slot.is_occupied) {
      Alert.alert("Slot Occupied", "This parking slot is already taken.");
      return;
    }

    if (!vehicles.length) {
      Alert.alert("No Vehicle Found", "Add a vehicle before booking a slot.", [
        { text: "Open Vehicles", onPress: () => router.push("/vehicles") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedVehicle) {
      setError("Please select a slot and a vehicle.");
      return;
    }

    if (Number(activeBooking?.vehicle_id) === Number(selectedVehicle)) {
      Alert.alert(
        "Vehicle Already Parked",
        "This vehicle already has an active parking session. End that session before booking another slot."
      );
      return;
    }

    try {
      const booking = await bookSlot({
        slot_id: selectedSlot.id,
        vehicle_id: selectedVehicle,
      });

      setModalVisible(false);
      await loadData();
      router.push(`/receipt/${booking.id}`);
    } catch (err) {
      Alert.alert("Booking Failed", err?.message || "Could not book the slot.");
    }
  };

  const renderSlot = ({ item }) => (
    <TouchableOpacity
      style={[styles.slot, item.is_occupied ? styles.occupiedSlot : styles.availableSlot]}
      onPress={() => handleSlotPress(item)}
      disabled={item.is_occupied}
    >
      <View style={styles.slotBadge}>
        <FontAwesome5
          name={item.is_occupied ? "lock" : "parking"}
          size={12}
          color={item.is_occupied ? "#f7c0a4" : theme.colors.primary}
        />
      </View>
      <Text style={styles.slotText}>{item.slot_number}</Text>
      <Text style={styles.slotStateText}>{item.is_occupied ? "Occupied" : "Tap To Reserve"}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[theme.screen, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const liveDuration = activeBooking
    ? formatDurationLabel(calculateDurationMinutes(activeBooking.entry_time, now))
    : "0 min";
  const liveEstimate = activeBooking
    ? formatCurrency(
        calculateEstimatedAmount(activeBooking.entry_time, activeBooking.pricing_rate_per_hour, now)
      )
    : formatCurrency(0);

  return (
    <View style={[theme.screen, styles.container]}>
      <View style={theme.heroCard}>
        <Text style={[theme.heading, styles.header]}>Area {areaId.toUpperCase()}</Text>
        <Text style={styles.subHeader}>Choose an open slot and assign a saved vehicle.</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{slots.length}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>{availableCount}</Text>
            <Text style={styles.metricLabel}>Available</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.accent }]}>{occupiedCount}</Text>
            <Text style={styles.metricLabel}>Occupied</Text>
          </View>
        </View>
      </View>

      {!vehicles.length ? (
        <View style={[theme.card, styles.noticeCard]}>
          <View style={styles.noticeBadge}>
            <FontAwesome5 name="info-circle" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Add a vehicle first</Text>
            <Text style={styles.noticeBody}>
              Save a vehicle to your garage before reserving a slot. Each vehicle can only hold one active booking at a time.
            </Text>
          </View>
          <TouchableOpacity style={styles.noticeButton} onPress={() => router.push("/vehicles")}>
            <Text style={styles.noticeButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {activeBooking ? (
        <TouchableOpacity
          style={[theme.card, styles.activeBookingBanner]}
          onPress={() => router.push(`/receipt/${activeBooking.id}`)}
        >
          <View style={styles.activeBannerIcon}>
            <FontAwesome5 name="clock" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.activeBannerCopy}>
            <Text style={styles.activeBannerTitle}>
              Active: {activeBooking.vehicle_number || "Vehicle"} in {String(activeBooking.area || "").toUpperCase()}-{activeBooking.slot_number}
            </Text>
            <Text style={styles.activeBannerMeta}>
              {liveDuration} · {liveEstimate}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={slots}
        renderItem={renderSlot}
        keyExtractor={(item) => item.id.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[theme.card, styles.modalView]}>
            <View style={styles.modalHeaderRow}>
              <FontAwesome5 name="car-side" size={18} color={theme.colors.accent} />
              <Text style={styles.modalTitle}>Confirm Booking</Text>
            </View>

            <Text style={styles.modalText}>Slot {selectedSlot?.slot_number} is ready to reserve. Select vehicle:</Text>

            <View style={styles.vehicleSelectionList}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.vehicleScrollContainer}
              >
                {vehicles.map((v) => {
                  const isActive = Number(activeBooking?.vehicle_id) === Number(v.id);
                  const isSelected = selectedVehicle === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.vehicleSelectCard,
                        isSelected && styles.vehicleSelectCardActive,
                        isActive && styles.vehicleSelectCardDisabled
                      ]}
                      onPress={() => !isActive && setSelectedVehicle(v.id)}
                      disabled={isActive}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.vehicleIconWrapper,
                        isSelected && styles.vehicleIconWrapperActive
                      ]}>
                        <FontAwesome5 
                          name="car-side" 
                          size={18} 
                          color={isSelected ? theme.colors.background : (isActive ? theme.colors.textMuted : theme.colors.primary)} 
                        />
                      </View>
                      <View style={styles.vehicleSelectInfo}>
                        <Text style={[
                          styles.vehicleSelectTitle,
                          isSelected && styles.vehicleSelectTextActive,
                          isActive && styles.vehicleSelectTextDisabled
                        ]}>
                          {v.vehicle_number}
                        </Text>
                        <Text style={[
                          styles.vehicleSelectSub,
                          isSelected && styles.vehicleSelectTextActive,
                          isActive && styles.vehicleSelectTextDisabled
                        ]} numberOfLines={1}>
                          {isActive ? "Parked" : v.model}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <FontAwesome5 name="check-circle" size={16} color={theme.colors.background} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {Number(activeBooking?.vehicle_id) === Number(selectedVehicle) ? (
              <Text style={styles.warningText}>
                This vehicle is already in an active booking. Choose another vehicle or end its current session.
              </Text>
            ) : null}

            <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
              <Text style={styles.bookButtonText}>Reserve Slot</Text>
            </TouchableOpacity>

            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 18,
  },
  header: {
    fontSize: 28,
  },
  subHeader: {
    marginTop: 8,
    color: theme.colors.textMuted,
  },
  metricsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0a1621",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  metricValue: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  metricLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
    marginTop: 3,
  },
  noticeCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  noticeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#10222f",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  noticeBody: {
    marginTop: 4,
    color: theme.colors.textSoft,
    lineHeight: 18,
    fontSize: 13,
  },
  noticeButton: {
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noticeButtonText: {
    color: "#092016",
    fontWeight: "800",
  },
  grid: {
    paddingTop: 18,
    paddingBottom: 24,
  },
  activeBookingBanner: {
    marginTop: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#112534",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBannerCopy: {
    flex: 1,
  },
  activeBannerTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  activeBannerMeta: {
    marginTop: 4,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  slot: {
    flex: 1,
    margin: 6,
    minHeight: 112,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    paddingVertical: 14,
    overflow: "hidden",
  },
  availableSlot: {
    backgroundColor: "#143426",
    borderColor: "#2b6b4f",
  },
  occupiedSlot: {
    backgroundColor: "#34261d",
    borderColor: "#73513d",
  },
  slotBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(7, 17, 26, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  slotText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 20,
  },
  slotStateText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: theme.colors.text,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  vehicleSelectionList: {
    marginVertical: 10,
    height: 100,
  },
  vehicleScrollContainer: {
    gap: 12,
    paddingRight: 10,
  },
  vehicleSelectCard: {
    width: 140,
    backgroundColor: "#0a1621",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
    position: "relative",
  },
  vehicleSelectCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  vehicleSelectCardDisabled: {
    opacity: 0.5,
  },
  vehicleIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(124, 224, 184, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  vehicleIconWrapperActive: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  vehicleSelectInfo: {
    gap: 2,
  },
  vehicleSelectTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "bold",
  },
  vehicleSelectSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  vehicleSelectTextActive: {
    color: theme.colors.background,
  },
  vehicleSelectTextDisabled: {
    color: theme.colors.textSoft,
  },
  checkIcon: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  bookButtonText: {
    color: "#092016",
    fontSize: 16,
    fontWeight: "800",
  },
  closeButton: {
    marginTop: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: theme.colors.textMuted,
  },
  warningText: {
    color: theme.colors.accent,
    marginTop: 12,
    lineHeight: 20,
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: 10,
  },
});
