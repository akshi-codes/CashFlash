function createFallbackUuid() {
  const timestamp = Date.now().toString(16);
  const randomPart = Math.random().toString(16).slice(2);
  return `${timestamp}-${randomPart}`;
}

export function generateClientUuid() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return createFallbackUuid();
}
