import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { runtimeConfig } from "@/lib/runtimeConfig";

let stompClient = null;
let subscription = null;

let isActivating = false;
let lastToken = null;
let currentOnNotification = null;

const WS_URL = runtimeConfig.wsUrl;
const DESTINATION = "/user/queue/notifications";

function safeUnsubscribe() {
  if (!subscription) return;
  try {
    subscription.unsubscribe();
  } 
  finally {
    subscription = null;
  }
}

function buildClient(token) {
  return new Client({
    webSocketFactory: () => new SockJS(WS_URL),

    // IMPORTANT: this header is read in your StompAuthChannelInterceptor on CONNECT
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    // If the socket drops, STOMP will reconnect automatically
    reconnectDelay: 5000,

    // Heartbeats can cause disconnect loops if server/client timing differs.
    // Keep them off unless you specifically need them.
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,

    debug: () => {},

    onConnect: () => {
      isActivating = false;

      safeUnsubscribe();
      subscription = stompClient.subscribe(DESTINATION, (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          currentOnNotification?.(payload);
        } catch (e) {
          console.error("Notification WS parse failed:", e, msg.body);
        }
      });
    },

    onWebSocketClose: () => {
      isActivating = false;
    },

    onDisconnect: () => {
      isActivating = false;
    },

    onStompError: (frame) => {
      // STOMP error frame from broker
      console.error("STOMP error:", frame.headers?.message, frame.body);
    },

    onWebSocketError: (evt) => {
      console.error("WebSocket error:", evt);
    },
  });
}

/**
 * Connect once and keep the connection alive.
 * Call this once (App root / Dashboard root) and DO NOT disconnect on component unmount.
 */
export function connectNotificationSocket({ token, onNotification }) {
  if (!token) return null;

  currentOnNotification = onNotification;

  // If already active or activating, do nothing.
  if (stompClient?.active || isActivating) return stompClient;

  // If token changed, fully recreate the client
  const tokenChanged = lastToken && lastToken !== token;
  if (tokenChanged) {
    disconnectNotificationSocket();
  }

  lastToken = token;

  // Create client if missing
  if (!stompClient) {
    stompClient = buildClient(token);
  }

  isActivating = true;
  stompClient.activate();

  return stompClient;
}

/**
 * Disconnect ONLY on logout (or when you intentionally want to stop WS).
 */
export function disconnectNotificationSocket() {
  currentOnNotification = null;
  lastToken = null;
  isActivating = false;

  safeUnsubscribe();

  if (stompClient) {
    // deactivate is async, but we can fire-and-forget
    stompClient.deactivate();
    stompClient = null;
  }
}
