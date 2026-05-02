import api, { getApiErrorMessage } from "./api";

const DEBUG_PREFIX = "[ParkX FE][SlotsService]";

export const getAreas = async () => {
  try {
    console.log(`${DEBUG_PREFIX} getAreas called`);
    const res = await api.get("/slots/areas");
    console.log(`${DEBUG_PREFIX} getAreas success`, { count: Array.isArray(res?.data) ? res.data.length : 0 });
    return res.data || [];
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getAreas failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load parking areas"));
  }
};

export const getSlotsByArea = async (areaId) => {
  try {
    console.log(`${DEBUG_PREFIX} getSlotsByArea called`, { areaId });
    const res = await api.get(`/slots/area/${areaId}`);
    console.log(`${DEBUG_PREFIX} getSlotsByArea success`, {
      areaId,
      count: Array.isArray(res?.data) ? res.data.length : 0,
    });
    return res.data || [];
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getSlotsByArea failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load parking slots"));
  }
};
