import api, { getApiErrorMessage } from "./api";

const DEBUG_PREFIX = "[ParkX FE][VehicleService]";

export const getVehicles = async () => {
  try {
    console.log(`${DEBUG_PREFIX} getVehicles called`);
    const res = await api.get("/vehicles");
    console.log(`${DEBUG_PREFIX} getVehicles success`, { count: Array.isArray(res?.data) ? res.data.length : 0 });
    return res.data || [];
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getVehicles failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load vehicles"));
  }
};

export const addVehicle = async (payload) => {
  try {
    console.log(`${DEBUG_PREFIX} addVehicle called`, payload);
    const res = await api.post("/vehicles", payload);
    console.log(`${DEBUG_PREFIX} addVehicle success`, { vehicleId: res?.data?.id || null });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} addVehicle failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Could not add vehicle"));
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    console.log(`${DEBUG_PREFIX} deleteVehicle called`, { vehicleId });
    const res = await api.delete(`/vehicles/${vehicleId}`);
    console.log(`${DEBUG_PREFIX} deleteVehicle success`, { vehicleId });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} deleteVehicle failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Could not remove vehicle"));
  }
};
