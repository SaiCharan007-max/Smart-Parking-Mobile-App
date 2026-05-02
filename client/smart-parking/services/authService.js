import api, { getApiErrorMessage } from "./api";

const DEBUG_PREFIX = "[ParkX FE][AuthService]";

// REGISTER
export const registerUser = async (data) => {
  try {
    console.log(`${DEBUG_PREFIX} registerUser called`, {
      username: data?.username,
      email: data?.email,
    });
    const res = await api.post("/auth/register", data);
    console.log(`${DEBUG_PREFIX} registerUser success`, {
      hasToken: Boolean(res?.data?.data?.token),
      userId: res?.data?.data?.userId,
    });
    return res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} registerUser failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Registration failed"));
  }
};

// LOGIN
export const loginUser = async (data) => {
  try {
    console.log(`${DEBUG_PREFIX} loginUser called`, { email: data?.email });
    const res = await api.post("/auth/login", data);
    console.log(`${DEBUG_PREFIX} loginUser success`, {
      hasToken: Boolean(res?.data?.data?.token || res?.data?.token),
      userId: res?.data?.data?.userId || res?.data?.userId,
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error(`${DEBUG_PREFIX} loginUser failed`, error?.response?.data || error?.message);
    throw new Error(getApiErrorMessage(error, "Login failed"));
  }
};
