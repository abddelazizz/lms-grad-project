let cryptoKey = null;

const getMasterKey = async () => {
  if (cryptoKey) return cryptoKey;

  const keyHex = import.meta.env.VITE_SOCKET_ENCRYPTION_KEY;
  if (!keyHex) {
    console.warn("VITE_SOCKET_ENCRYPTION_KEY not set, encryption disabled");
    return null;
  }

  const keyBuffer = new Uint8Array(keyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "HKDF" }, false, [
    "deriveKey",
  ]);
  return cryptoKey;
};

const deriveConversationKey = async (conversationId) => {
  const masterKey = await getMasterKey();
  if (!masterKey) return null;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(String(conversationId)),
      info: encoder.encode("recode-socket"),
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return keyMaterial;
};

const encryptMessage = async (plaintext, conversationId) => {
  const key = await deriveConversationKey(conversationId);
  if (!key) return plaintext;

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  const toHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return `${toHex(iv)}:${toHex(ciphertext)}:${toHex(authTag)}`;
};

const decryptMessage = async (encrypted, conversationId) => {
  const key = await deriveConversationKey(conversationId);
  if (!key) return encrypted;

  const parts = encrypted.split(":");
  if (parts.length !== 3) return encrypted;

  const fromHex = (hex) => {
    const bytes = hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16));
    return new Uint8Array(bytes);
  };

  const iv = fromHex(parts[0]);
  const ciphertext = fromHex(parts[1]);
  const authTag = fromHex(parts[2]);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return encrypted;
  }
};

export { encryptMessage, decryptMessage };
