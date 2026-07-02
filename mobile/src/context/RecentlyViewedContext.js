import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RecentlyViewedContext = createContext(null);
const KEY = "recentlyViewed";
const MAX = 10;

export function RecentlyViewedProvider({ children }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        try { setRecent(JSON.parse(raw)); } catch (e) { /* ignore */ }
      }
    })();
  }, []);

  const addRecent = useCallback((job) => {
    if (!job?._id) return;
    setRecent((prev) => {
      const next = [job, ...prev.filter((j) => j._id !== job._id)].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ recent, addRecent }), [recent, addRecent]);

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
