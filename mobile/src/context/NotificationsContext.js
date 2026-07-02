import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applicationsApi } from "../api";

const NotificationsContext = createContext(null);

/**
 * Builds an in-app notification feed from the candidate's applications
 * (e.g. "You applied to X", "X shortlisted you"). Tracks which have been seen.
 */
export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem("notif_last_seen");
      if (v) setLastSeen(Number(v));
    })();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { applications } = await applicationsApi.mine();
      const notifs = [];
      for (const a of applications || []) {
        const job = a.job?.title || "a job";
        const company = a.job?.company || "";
        const when = new Date(a.updatedAt || a.createdAt).getTime();
        if (a.status === "applied") {
          notifs.push({ id: a._id + "-applied", icon: "paper-plane", color: "info", title: "Application sent", body: `You applied to ${job} at ${company}.`, time: new Date(a.createdAt).getTime() });
        } else {
          const map = {
            shortlisted: { icon: "star", color: "warning", title: "You've been shortlisted! ⭐", body: `${company} shortlisted you for ${job}.` },
            hired: { icon: "checkmark-circle", color: "success", title: "Congratulations, you're hired! 🎉", body: `${company} hired you for ${job}.` },
            rejected: { icon: "close-circle", color: "danger", title: "Application update", body: `Your application for ${job} was not selected.` },
          };
          const m = map[a.status];
          if (m) notifs.push({ id: a._id + "-" + a.status, ...m, time: when });
        }
      }
      notifs.sort((x, y) => y.time - x.time);
      setItems(notifs);
    } catch (e) {
      // keep whatever we had
    } finally {
      setLoading(false);
    }
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => n.time > lastSeen).length,
    [items, lastSeen]
  );

  const markAllSeen = useCallback(async () => {
    const now = Date.now();
    setLastSeen(now);
    await AsyncStorage.setItem("notif_last_seen", String(now));
  }, []);

  const value = useMemo(
    () => ({ items, loading, unreadCount, refresh, markAllSeen }),
    [items, loading, unreadCount, refresh, markAllSeen]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
