import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jobsApi } from "../api";
import { notifyLocal } from "../services/localNotify";

const JobAlertsContext = createContext(null);
const KEY = "jobAlerts";

/**
 * Saved searches that act as job alerts. Each alert: { id, label, params, lastCount }.
 * On checkAlerts(), we re-query each alert and notify if new matching jobs appeared.
 */
export function JobAlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  // Latest alerts, readable from stable callbacks without re-creating them.
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) { try { setAlerts(JSON.parse(raw)); } catch (e) { /* ignore */ } }
    })();
  }, []);

  const persist = useCallback((next) => {
    setAlerts(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const hasAlert = useCallback((params) => {
    const key = JSON.stringify(params);
    return alertsRef.current.some((a) => JSON.stringify(a.params) === key);
  }, []);

  const addAlert = useCallback(async (label, params) => {
    if (hasAlert(params)) return;
    // record current count as the baseline so only future jobs trigger alerts
    let baseline = 0;
    try { baseline = (await jobsApi.list({ ...params, limit: 1 })).total || 0; } catch (e) {}
    // Collision-proof id: params hash + label, independent of array length so a
    // remove-then-re-add can never reuse an existing id.
    const id = "alert_" + hashKey(JSON.stringify(params) + "|" + label);
    persist([...alertsRef.current, { id, label, params, lastCount: baseline }]);
  }, [hasAlert, persist]);

  const removeAlert = useCallback((id) => {
    persist(alertsRef.current.filter((a) => a.id !== id));
  }, [persist]);

  // Check all alerts for new matches; notify and update baselines.
  const checkAlerts = useCallback(async () => {
    const cur = alertsRef.current;
    if (!cur.length) return;
    // Query all alerts concurrently instead of sequentially.
    const totals = await Promise.all(
      cur.map((a) =>
        jobsApi.list({ ...a.params, limit: 1 }).then((r) => r.total || 0).catch(() => null)
      )
    );
    let changed = false;
    const next = cur.map((a, i) => {
      const total = totals[i];
      if (total != null && total > a.lastCount) {
        const newCount = total - a.lastCount;
        notifyLocal(
          "New jobs for you 🔔",
          `${newCount} new job${newCount !== 1 ? "s" : ""} matching "${a.label}".`
        );
        changed = true;
        return { ...a, lastCount: total };
      }
      return a;
    });
    if (changed) persist(next);
  }, [persist]);

  const value = useMemo(
    () => ({ alerts, addAlert, removeAlert, hasAlert, checkAlerts }),
    [alerts, addAlert, removeAlert, hasAlert, checkAlerts]
  );

  return (
    <JobAlertsContext.Provider value={value}>
      {children}
    </JobAlertsContext.Provider>
  );
}

// Small deterministic string hash (djb2) — for stable local ids only.
function hashKey(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export const useJobAlerts = () => useContext(JobAlertsContext);
