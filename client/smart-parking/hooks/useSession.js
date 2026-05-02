import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SessionContext = React.createContext(null);
const DEBUG_PREFIX = "[ParkX FE][Session]";

export function SessionProvider({ children }) {
  const [token, setToken] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshSession = React.useCallback(async () => {
    try {
      console.log(`${DEBUG_PREFIX} Refreshing session from storage`);
      const [nextToken, nextUserId] = await AsyncStorage.multiGet(["token", "userId"]);
      const tokenValue = nextToken?.[1] || null;
      const userValue = nextUserId?.[1] ? Number(nextUserId[1]) : null;

      setToken(tokenValue);
      setUserId(userValue);
      console.log(`${DEBUG_PREFIX} Session refreshed`, {
        hasToken: Boolean(tokenValue),
        userId: userValue,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = React.useCallback(async (nextToken, nextUserId = null) => {
    const normalizedUserId = nextUserId ? Number(nextUserId) : null;
    console.log(`${DEBUG_PREFIX} login called`, {
      hasToken: Boolean(nextToken),
      userId: normalizedUserId,
    });
    await AsyncStorage.setItem("token", String(nextToken));
    if (normalizedUserId) {
      await AsyncStorage.setItem("userId", String(normalizedUserId));
    }
    setToken(String(nextToken));
    setUserId(normalizedUserId);
  }, []);

  const logout = React.useCallback(async () => {
    console.log(`${DEBUG_PREFIX} logout called`);
    await AsyncStorage.multiRemove(["token", "userId"]);
    setToken(null);
    setUserId(null);
  }, []);

  const value = React.useMemo(
    () => ({
      token,
      userId,
      session: token,
      isLoading,
      isReady: !isLoading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      clearSession: logout,
      refreshSession,
    }),
    [token, userId, isLoading, login, logout, refreshSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
