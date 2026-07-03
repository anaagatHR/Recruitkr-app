import Constants from "expo-constants";

/**
 * Uploads an image to Cloudinary using an UNSIGNED upload preset.
 *
 * Cloudinary config lives in app.json -> expo.extra.cloudinary:
 *   { cloudName: "your-cloud", uploadPreset: "your-unsigned-preset" }
 *
 * These two values are NOT secrets (they're safe to ship in the app) — the
 * unsigned preset only allows uploads, nothing else. Create a free account at
 * cloudinary.com, then Settings → Upload → add an unsigned upload preset.
 */
const cfg = Constants.expoConfig?.extra?.cloudinary || {};
export const CLOUDINARY_READY =
  Boolean(cfg.cloudName) && Boolean(cfg.uploadPreset);

export async function uploadImageAsync(localUri) {
  if (!CLOUDINARY_READY) {
    throw new Error("Photo upload is not configured yet.");
  }

  const form = new FormData();
  form.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: `photo_${Date.now()}.jpg`,
  });
  form.append("upload_preset", cfg.uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Upload failed. Please try again.");
  }
  return data.secure_url; // permanent HTTPS URL to store on the user profile
}
