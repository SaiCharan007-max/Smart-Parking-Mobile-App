import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Redirect } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import useSession from "../../hooks/useSession";
import { addVehicle, deleteVehicle, getVehicles } from "../../services/vehicleService";
import { getActiveBooking } from "../../services/bookingService";
import { theme } from "../../theme";

const DEBUG_PREFIX = "[ParkX FE][Vehicles]";

export default function VehiclesPage() {
  const { isReady, isAuthenticated } = useSession();
  const [vehicles, setVehicles] = React.useState([]);
  const [activeBooking, setActiveBooking] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingVehicleId, setDeletingVehicleId] = React.useState(null);
  const [error, setError] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = React.useState("");
  const [newVehicleModel, setNewVehicleModel] = React.useState("");

  const loadVehicles = React.useCallback(async () => {
    try {
      console.log(`${DEBUG_PREFIX} loadVehicles called`);
      setIsLoading(true);
      setError("");
      const [vehicleData, activeBookingData] = await Promise.all([
        getVehicles(),
        getActiveBooking(),
      ]);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setActiveBooking(activeBookingData || null);
      console.log(`${DEBUG_PREFIX} loadVehicles success`, {
        vehicleCount: Array.isArray(vehicleData) ? vehicleData.length : 0,
        activeBookingVehicleId: activeBookingData?.vehicle_id || null,
      });
    } catch (err) {
      console.error(`${DEBUG_PREFIX} loadVehicles failed`, err?.message || err);
      setError(err?.message || "Failed to load vehicles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadVehicles();
    }
  }, [isAuthenticated, loadVehicles]);

  const onAddVehicle = async () => {
    if (!newVehicleNumber.trim() || !newVehicleModel.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      console.log(`${DEBUG_PREFIX} onAddVehicle called`, {
        vehicle_number: newVehicleNumber.trim(),
        model: newVehicleModel.trim(),
      });
      setError("");
      await addVehicle({
        vehicle_number: newVehicleNumber.trim(),
        model: newVehicleModel.trim(),
      });
      setNewVehicleNumber("");
      setNewVehicleModel("");
      setModalVisible(false);
      await loadVehicles();
      console.log(`${DEBUG_PREFIX} onAddVehicle success`);
    } catch (err) {
      console.error(`${DEBUG_PREFIX} onAddVehicle failed`, err?.message || err);
      setError(err?.message || "Could not add vehicle.");
    }
  };

  const confirmDeleteVehicle = async (vehicleId) => {
    try {
      console.log(`${DEBUG_PREFIX} confirmDeleteVehicle called`, { vehicleId });
      setDeletingVehicleId(vehicleId);
      setError("");
      const result = await deleteVehicle(vehicleId);
      await loadVehicles();
      console.log(`${DEBUG_PREFIX} confirmDeleteVehicle success`, { vehicleId, message: result?.message });
      Alert.alert("Vehicle Updated", result?.message || "Vehicle removed successfully.");
    } catch (err) {
      console.error(`${DEBUG_PREFIX} confirmDeleteVehicle failed`, err?.message || err);
      const message = err?.message || "Could not delete vehicle.";
      setError(message);
      Alert.alert("Remove Vehicle Failed", message);
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const onDeleteVehicle = async (vehicleId) => {
    if (Number(activeBooking?.vehicle_id) === Number(vehicleId)) {
      if (Platform.OS === 'web') {
        window.alert("This vehicle is currently parked. End the active parking session before removing the vehicle.");
      } else {
        Alert.alert(
          "Vehicle In Active Session",
          "This vehicle is currently parked. End the active parking session before removing the vehicle."
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      const confirm = window.confirm("Do you want to remove this vehicle?");
      if (confirm) {
        confirmDeleteVehicle(vehicleId);
      }
      return;
    }

    Alert.alert("Remove Vehicle", "Do you want to remove this vehicle?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => confirmDeleteVehicle(vehicleId),
      },
    ]);
  };

  if (!isReady) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <View style={[theme.screen, styles.container]}>
      <View style={theme.heroCard}>
        <Text style={[theme.heading, styles.header]}>Fleet Manager</Text>
        <Text style={styles.heroSub}>Manage registered vehicles for faster reservations and cleaner receipts.</Text>
      </View>

      {isLoading && !vehicles.length ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadVehicles} tintColor={theme.colors.primary} />}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {vehicles.length === 0 ? (
            <View style={[theme.card, styles.emptyBox]}>
              <FontAwesome5 name="car-alt" size={26} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles added yet.</Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={[theme.card, styles.vehicleCard]}>
                <View style={styles.vehicleIconWrap}>
                  <FontAwesome5 name="car-alt" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
                  {Number(activeBooking?.vehicle_id) === Number(vehicle.id) ? (
                    <View style={styles.activeVehiclePill}>
                      <Text style={styles.activeVehiclePillText}>Currently Parked</Text>
                    </View>
                  ) : null}
                  <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deletingVehicleId === vehicle.id && styles.deleteButtonDisabled
                  ]}
                  onPress={() => onDeleteVehicle(vehicle.id)}
                  disabled={deletingVehicleId === vehicle.id}
                >
                  {deletingVehicleId === vehicle.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <FontAwesome5 name="trash" size={16} color={theme.colors.danger} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <FontAwesome5 name="plus" size={18} color="#092016" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[theme.card, styles.modalView]}>
            <Text style={styles.modalTitle}>Add New Vehicle</Text>
            <TextInput
              style={styles.input}
              placeholder="License Plate"
              placeholderTextColor={theme.colors.textSoft}
              value={newVehicleNumber}
              onChangeText={setNewVehicleNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Model"
              placeholderTextColor={theme.colors.textSoft}
              value={newVehicleModel}
              onChangeText={setNewVehicleModel}
            />
            <TouchableOpacity style={styles.saveButton} onPress={onAddVehicle}>
              <Text style={styles.saveButtonText}>Save Vehicle</Text>
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
  container: {
    padding: 18,
  },
  header: {
    fontSize: 30,
  },
  heroSub: {
    marginTop: 8,
    color: theme.colors.textMuted,
  },
  vehicleCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  vehicleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0b1a26",
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleNumber: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  vehicleModel: {
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  activeVehiclePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#18394f",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeVehiclePillText: {
    color: theme.colors.info,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#291d1d",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  addButton: {
    position: "absolute",
    bottom: 26,
    right: 26,
    backgroundColor: theme.colors.primary,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  modalView: {
    width: "90%",
    padding: 24,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#0a1621",
    color: theme.colors.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#092016",
    fontWeight: "800",
  },
  closeButton: {
    marginTop: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: theme.colors.textMuted,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: "center",
    marginTop: 12,
  },
  emptyBox: {
    marginTop: 14,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
