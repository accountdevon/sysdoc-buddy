// Secure password hashing using Web Crypto API

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;

// Generate a random salt
export const generateSalt = (): string => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Convert hex string to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

// Hash password with salt using PBKDF2
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexToBytes(salt);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

// Verify password against stored hash
export const verifyPassword = async (
  password: string, 
  storedHash: string, 
  salt: string
): Promise<boolean> => {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
};
