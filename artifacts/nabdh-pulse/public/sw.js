/**
 * Nabdh Pulse — Savings Reminder Service Worker
 *
 * Stores reminder preferences (written by the main thread via postMessage)
 * in the Cache API, then fires a notification at the configured day+hour.
 *
 * Wake-up strategies (best-effort, browser-dependent):
 *  1. Periodic Background Sync  (Chrome/Edge — requires site engagement)
 *  2. Push event placeholder     (future: can be wired to a push server)
 *  3. Main-thread heartbeat      (tab open: main thread sends CHECK_REMINDER
 *                                 every minute, keeping the fallback alive)
 */

const REMINDER_CACHE = "nabdh-reminder-v1";
const REMINDER_DATA_URL = "/nabdh-reminder-data.json";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getReminderData() {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    const resp = await cache.match(REMINDER_DATA_URL);
    if (!resp) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function setReminderData(data) {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    await cache.put(
      REMINDER_DATA_URL,
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch { /* ignore */ }
}

async function checkAndFireReminder() {
  const data = await getReminderData();
  if (!data || !data.enabled) return;

  const now = new Date();
  const { dayOfWeek, hour, balance, goal, lastFired } = data;

  if (now.getDay() !== dayOfWeek || now.getHours() !== hour) return;

  // Dedup: one notification per hour slot
  const slotKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  if (lastFired === slotKey) return;

  // Persist the fired slot before showing the notification
  await setReminderData({ ...data, lastFired: slotKey });

  const goalPct =
    goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
  const fmt = (n) =>
    new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);

  const bodyLines = [
    `رصيدك الحالي: ${fmt(balance)} ر.س`,
    goalPct > 0
      ? `أنجزت ${goalPct}% من هدفك — استمر!`
      : "ابدأ بإضافة مبلغ صغير إلى محفظتك 🪙",
  ];

  await self.registration.showNotification("نبض | تذكير الادخار 🪙", {
    body: bodyLines.join("\n"),
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    dir: "rtl",
    lang: "ar",
    tag: "nabdh-savings-reminder",  // collapses duplicate notifications
    renotify: false,
    data: { url: "/savings" },
  });
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Periodic Background Sync (Chrome/Edge with site engagement) ───────────────

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "nabdh-savings-reminder") {
    e.waitUntil(checkAndFireReminder());
  }
});

// ── Push (placeholder — ready to wire to a push server) ──────────────────────

self.addEventListener("push", (e) => {
  // If a server pushes a payload with { type: "savings-reminder" }, fire it.
  let payload = null;
  try { payload = e.data?.json(); } catch { /* ignore */ }

  if (payload?.type === "savings-reminder") {
    e.waitUntil(checkAndFireReminder());
  }
});

// ── Messages from the main thread ─────────────────────────────────────────────

self.addEventListener("message", async (e) => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === "SCHEDULE_REMINDER") {
    // Store updated prefs + balance/goal for use in background checks
    await setReminderData(msg.payload);
  }

  if (msg.type === "CHECK_REMINDER") {
    // Heartbeat from the main thread (fires every minute while tab is open)
    await checkAndFireReminder();
  }
});

// ── Notification click — open the savings page ────────────────────────────────

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url ?? "/savings";
  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
