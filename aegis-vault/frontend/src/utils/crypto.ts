async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFile(file: File, password: string): Promise<Blob> {
  const fileData = await file.arrayBuffer();
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileData
  );

  return new Blob([salt, iv, encryptedContent], { type: "application/octet-stream" });
}

export async function decryptFile(encryptedBlob: Blob, password: string): Promise<ArrayBuffer> {
  const buffer = await encryptedBlob.arrayBuffer();
  const salt = buffer.slice(0, 16);
  const iv = buffer.slice(16, 28);
  const data = buffer.slice(28);

  const key = await deriveKey(password, new Uint8Array(salt));

  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      data
    );
    return decryptedContent;
  } catch (e) {
    throw new Error("Decryption failed. Wrong password?");
  }
}

export async function encryptText(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptText(encryptedBase64: string, password: string): Promise<string> {
  const binaryString = atob(encryptedBase64);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  const salt = buffer.slice(0, 16);
  const iv = buffer.slice(16, 28);
  const data = buffer.slice(28);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (e) {
    throw new Error("Decryption failed");
  }
}