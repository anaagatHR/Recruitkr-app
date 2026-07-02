import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SavedJobsContext = createContext(null);
const STORAGE_KEY = "savedJobs";

export function SavedJobsProvider({ children }) {
  // Map of jobId -> job object (so the Saved screen can render without a fetch)
  const [saved, setSaved] = useState({});

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { setSaved(JSON.parse(raw)); } catch (e) { /* ignore */ }
      }
    })();
  }, []);

  // Keep a ref of the latest map so callbacks stay stable (don't change identity
  // on every toggle) while still reading fresh state.
  const savedRef = useRef(saved);
  savedRef.current = saved;

  const persist = useCallback((next) => {
    setSaved(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const isSaved = useCallback((jobId) => Boolean(saved[jobId]), [saved]);

  const toggleSave = useCallback((job) => {
    const cur = savedRef.current;
    const next = { ...cur };
    if (next[job._id]) delete next[job._id];
    else next[job._id] = job;
    persist(next);
  }, [persist]);

  const savedList = useMemo(() => Object.values(saved), [saved]);

  const value = useMemo(
    () => ({ saved, savedList, isSaved, toggleSave }),
    [saved, savedList, isSaved, toggleSave]
  );

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export const useSavedJobs = () => useContext(SavedJobsContext);
