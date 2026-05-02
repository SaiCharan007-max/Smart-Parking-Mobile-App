import api, { getApiErrorMessage } from "./api";

const DEBUG_PREFIX = "[ParkX FE][BookingService]";

export const getActiveBooking = async () => {
  try {
    console.log(`${DEBUG_PREFIX} getActiveBooking called`);
    const res = await api.get("/bookings/active");
    console.log(`${DEBUG_PREFIX} getActiveBooking success`, { bookingId: res?.data?.id || null });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getActiveBooking failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load active booking"));
  }
};

export const getBookingHistory = async () => {
  try {
    console.log(`${DEBUG_PREFIX} getBookingHistory called`);
    const res = await api.get("/bookings/history");
    console.log(`${DEBUG_PREFIX} getBookingHistory success`, { count: Array.isArray(res?.data) ? res.data.length : 0 });
    return res.data || [];
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getBookingHistory failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load booking history"));
  }
};

export const getActiveBookings = async () => {
  try {
    console.log(`${DEBUG_PREFIX} getActiveBookings called`);
    const res = await api.get("/bookings/active/all");
    console.log(`${DEBUG_PREFIX} getActiveBookings success`, { count: Array.isArray(res?.data) ? res.data.length : 0 });
    return res.data || [];
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getActiveBookings failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load active bookings"));
  }
};

export const getBookingById = async (bookingId) => {
  try {
    console.log(`${DEBUG_PREFIX} getBookingById called`, { bookingId });
    const res = await api.get(`/bookings/${bookingId}`);
    console.log(`${DEBUG_PREFIX} getBookingById success`, { bookingId: res?.data?.id || bookingId });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} getBookingById failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to load booking details"));
  }
};

export const bookSlot = async (payload) => {
  try {
    console.log(`${DEBUG_PREFIX} bookSlot called`, payload);
    const res = await api.post("/bookings", payload);
    console.log(`${DEBUG_PREFIX} bookSlot success`, { bookingId: res?.data?.id || null });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} bookSlot failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to book slot"));
  }
};

export const exitParking = async (bookingId) => {
  try {
    const bookingIdValue = Array.isArray(bookingId) ? bookingId[0] : bookingId;
    const payload = bookingIdValue ? { booking_id: Number(bookingIdValue) } : {};
    console.log(`${DEBUG_PREFIX} exitParking called`, payload);
    const res = await api.post("/bookings/exit", payload);
    console.log(`${DEBUG_PREFIX} exitParking success`, {
      bookingId: res?.data?.id || bookingIdValue || null,
      status: res?.data?.status,
    });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} exitParking failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Failed to end parking session"));
  }
};

