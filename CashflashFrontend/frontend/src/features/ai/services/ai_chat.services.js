import { runtimeConfig } from "@/lib/runtimeConfig";
import { appConfig } from "@/config/appConfig";

const AI_BASE_URL = runtimeConfig.aiOrigin;

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function normalizeChatResponse(data) {
  return {
    answer:
      typeof data?.answer === "string" && data.answer.trim()
        ? data.answer
        : "I couldn’t generate a response just now.",
    responseType: data?.response_type === "table" ? "table" : "text",
    columns: Array.isArray(data?.columns) ? data.columns : [],
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
}

function normalizeRecommendationResponse(data) {
  return {
    title:
      typeof data?.title === "string" && data.title.trim()
        ? data.title.trim()
        : "Payment Recommendation",
    message:
      typeof data?.message === "string" && data.message.trim()
        ? data.message.trim()
        : "Keep your payment setup updated for smoother transactions.",
  };
}

function normalizeVoiceSendMoneyResponse(data) {
  const payload = data?.payload || {};

  return {
    transcript:
      typeof data?.transcript === "string" && data.transcript.trim()
        ? data.transcript.trim()
        : "",
    payload: {
      identifier:
        typeof payload?.identifier === "string" && payload.identifier.trim()
          ? payload.identifier.trim()
          : null,
      amount:
        payload?.amount !== null &&
        payload?.amount !== undefined &&
        Number.isFinite(Number(payload.amount))
          ? Number(payload.amount)
          : null,
      paymentMethod:
        payload?.paymentMethod === "WALLET" ||
        payload?.paymentMethod === "BANK" ||
        payload?.paymentMethod === "CARD"
          ? payload.paymentMethod
          : null,
    },
  };
}

export async function askAiChat(message, signal) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("Please enter a question first.");
  }

  let res;

  try {
    res = await fetch(`${AI_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: cleanMessage }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "AI service is unreachable right now. Please make sure the AI server is running.",
    );
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Failed to get AI response. Please try again.",
    );
  }

  return normalizeChatResponse(data);
}

export async function getAiRecommendation(signal) {
  let res;

  try {
    res = await fetch(`${AI_BASE_URL}/api/ai/recommendation`, {
      method: "GET",
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "Recommendation service is unreachable right now. Please make sure the AI server is running.",
    );
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Failed to get recommendation. Please try again.",
    );
  }

  return normalizeRecommendationResponse(data);
}

export async function warmAiChat() {
  try {
    await fetch(`${AI_BASE_URL}/api/ai/warmup`, {
      method: "POST",
    });
  } catch {
    // keep silent
  }
}

export async function parseVoiceSendMoney(audioBlob, signal) {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
    throw new Error("Please record a short voice command first.");
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "send-money.webm");

  let res;

  try {
    res = await fetch(
      `${AI_BASE_URL}${appConfig.ai.endpoints.voiceSendMoneyParse}`,
      {
        method: "POST",
        body: formData,
        signal,
      },
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "Voice service is unreachable right now. Please make sure the AI server is running.",
    );
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Failed to process the voice command. Please try again.",
    );
  }

  return normalizeVoiceSendMoneyResponse(data);
}
