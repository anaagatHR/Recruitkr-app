import { useEffect, useState } from "react";
import { aiApi } from "../api";

/**
 * Checks once (per app session) whether the server has AI configured, so screens
 * can show/hide AI features without every component probing the API. The result
 * is cached in-module so repeated mounts don't re-request.
 */
let cached = null;
let inflight = null;

export function useAIEnabled() {
  const [enabled, setEnabled] = useState(cached ?? false);

  useEffect(() => {
    let alive = true;
    if (cached !== null) return;
    if (!inflight) {
      inflight = aiApi
        .status()
        .then((r) => { cached = Boolean(r.enabled); return cached; })
        .catch(() => { cached = false; return false; })
        .finally(() => { inflight = null; });
    }
    inflight.then((val) => { if (alive) setEnabled(val); });
    return () => { alive = false; };
  }, []);

  return enabled;
}
