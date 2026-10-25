// Send a finished room clip to the Mac voice daemon (bin/voice-daemon), which converts it to
// H.264/AAC MP4 and files it in the Video Studio. Uses the voice pairing exactly as push-to-talk
// does: the paired bearer token plus a signature from this headset's non-extractable key over
// the method, route, time and the clip's hash. Nothing is sent unless the headset is paired.
import { MAX_UPLOAD, uploadNote } from "./record-core.cjs";

const TOKEN_KEY = "lounge-voice-controller-v1";
const ROUTE = "/lounge-voice/v1/clip";

function headsetKey() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("lounge-voice", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("keys");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction("keys", "readonly");
      const request = tx.objectStore("keys").get("headset");
      tx.oncomplete = () => {
        open.result.close();
        resolve(request.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}

const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
const base64 = buffer => {
  let s = "";
  for (const b of new Uint8Array(buffer)) s += String.fromCharCode(b);
  return btoa(s);
};

// Resolves { ok: true, name } or { ok: false, why }. Never throws.
export async function uploadClip(file) {
  try {
    if (!file || !file.size) return { ok: false, why: "empty clip" };
    if (file.size > MAX_UPLOAD) return { ok: false, why: "too big to send" };
    let token = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      /* no storage */
    }
    if (!token) return { ok: false, why: "voice not paired" };
    const key = await headsetKey();
    if (!key) return { ok: false, why: "voice key missing" };
    const time = String(Date.now());
    const bytes = await file.arrayBuffer();
    const text = `${time}\nPOST\n${ROUTE}\n${hex(await crypto.subtle.digest("SHA-256", bytes))}`;
    const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(text));
    const response = await fetch(ROUTE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream",
        "X-Voice-Time": time,
        "X-Voice-Signature": base64(signature)
      },
      body: new Blob([bytes], { type: file.type }),
      signal: AbortSignal.timeout(98000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, why: uploadNote.refusal(response.status, data.error) };
    return { ok: true, name: String(data.name || "") };
  } catch (error) {
    return { ok: false, why: error && error.name === "TimeoutError" ? "Mac took too long" : "Mac not reachable" };
  }
}
