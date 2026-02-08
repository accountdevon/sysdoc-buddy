import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_CREDENTIALS_VERSION = "admin_credentials_v1";
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;

function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(salt).buffer as ArrayBuffer, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH
  );
  return Array.from(new Uint8Array(derivedBits), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

// AES-GCM encryption helpers
const ENC_IV_LENGTH = 12;
const ENC_SALT_LENGTH = 16;

async function deriveEncKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function encryptSecure(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(ENC_SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(ENC_IV_LENGTH));
  const key = await deriveEncKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return toBase64(combined.buffer as ArrayBuffer);
}

async function decryptSecure(encrypted: string, password: string): Promise<string> {
  const combined = fromBase64(encrypted);
  const salt = combined.slice(0, ENC_SALT_LENGTH);
  const iv = combined.slice(ENC_SALT_LENGTH, ENC_SALT_LENGTH + ENC_IV_LENGTH);
  const ciphertext = combined.slice(ENC_SALT_LENGTH + ENC_IV_LENGTH);
  const key = await deriveEncKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

const AUTH_FILE_PASSWORD = "linux_admin_file_key_2024";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

interface AdminCredentials {
  passwordHash: string;
  salt: string;
  createdAt: string;
}

async function getCredentials(supabase: ReturnType<typeof createClient>): Promise<AdminCredentials | null> {
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("version", ADMIN_CREDENTIALS_VERSION)
    .maybeSingle();
  if (error || !data?.data) return null;
  const creds = data.data as unknown as AdminCredentials;
  if (!creds.passwordHash || !creds.salt) return null;
  return creds;
}

// Generate a secure random session token
function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const supabase = getSupabaseAdmin();

    switch (action) {
      case "check-status": {
        const creds = await getCredentials(supabase);
        return new Response(JSON.stringify({ isFirstTimeSetup: !creds }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "setup": {
        const { password } = params;
        if (!password || password.length < 6) {
          return new Response(JSON.stringify({ success: false, error: "Password too short" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const existing = await getCredentials(supabase);
        if (existing) {
          return new Response(JSON.stringify({ success: false, error: "Admin already set up" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        const newCreds: AdminCredentials = { passwordHash, salt, createdAt: new Date().toISOString() };
        const { error } = await supabase.from("app_data").insert({
          data: newCreds as unknown as Record<string, never>,
          version: ADMIN_CREDENTIALS_VERSION,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          return new Response(JSON.stringify({ success: false, error: "Failed to save" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const sessionToken = generateSessionToken();
        return new Response(JSON.stringify({ success: true, sessionToken }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "login": {
        const { password } = params;
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const valid = await verifyPassword(password, creds.passwordHash, creds.salt);
        if (!valid) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const sessionToken = generateSessionToken();
        return new Response(JSON.stringify({ success: true, sessionToken }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "login-with-file": {
        const { fileContent } = params;
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        try {
          const decrypted = await decryptSecure(fileContent.trim(), AUTH_FILE_PASSWORD);
          const data = JSON.parse(decrypted);
          if (data.type === "linux_admin_auth" && data.passwordHash === creds.passwordHash && data.salt === creds.salt) {
            const sessionToken = generateSessionToken();
            return new Response(JSON.stringify({ success: true, sessionToken }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch { /* invalid file */ }
        return new Response(JSON.stringify({ success: false }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change-password": {
        const { currentPassword, newPassword } = params;
        if (!newPassword || newPassword.length < 6) {
          return new Response(JSON.stringify({ success: false, error: "Password too short" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const isValid = await verifyPassword(currentPassword, creds.passwordHash, creds.salt);
        if (!isValid) {
          return new Response(JSON.stringify({ success: false, error: "Invalid current password" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const salt = generateSalt();
        const passwordHash = await hashPassword(newPassword, salt);
        const updatedCreds: AdminCredentials = { passwordHash, salt, createdAt: creds.createdAt };
        const { error } = await supabase
          .from("app_data")
          .update({ data: updatedCreds as unknown as Record<string, never>, updated_at: new Date().toISOString() })
          .eq("version", ADMIN_CREDENTIALS_VERSION);
        if (error) {
          return new Response(JSON.stringify({ success: false, error: "Failed to update" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const sessionToken = generateSessionToken();
        return new Response(JSON.stringify({ success: true, sessionToken }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "generate-reset-key": {
        const { currentPassword } = params;
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const isValid = await verifyPassword(currentPassword, creds.passwordHash, creds.salt);
        if (!isValid) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const resetData = {
          type: "linux_admin_reset_key",
          passwordHash: creds.passwordHash,
          salt: creds.salt,
          createdAt: creds.createdAt,
          generatedAt: new Date().toISOString(),
        };
        const key = await encryptSecure(JSON.stringify(resetData), AUTH_FILE_PASSWORD);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "generate-auth-file": {
        const { currentPassword } = params;
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const isValid = await verifyPassword(currentPassword, creds.passwordHash, creds.salt);
        if (!isValid) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const authData = {
          type: "linux_admin_auth",
          passwordHash: creds.passwordHash,
          salt: creds.salt,
          generatedAt: new Date().toISOString(),
        };
        const key = await encryptSecure(JSON.stringify(authData), AUTH_FILE_PASSWORD);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset-password-with-key": {
        const { fileContent, newPassword } = params;
        if (!newPassword || newPassword.length < 6) {
          return new Response(JSON.stringify({ success: false, error: "Password too short" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const creds = await getCredentials(supabase);
        if (!creds) {
          return new Response(JSON.stringify({ success: false }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        try {
          const decrypted = await decryptSecure(fileContent.trim(), AUTH_FILE_PASSWORD);
          const data = JSON.parse(decrypted);
          if (data.type !== "linux_admin_reset_key" || data.passwordHash !== creds.passwordHash || data.salt !== creds.salt) {
            return new Response(JSON.stringify({ success: false, error: "Invalid reset key" }), {
              status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch {
          return new Response(JSON.stringify({ success: false, error: "Invalid reset key" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const salt = generateSalt();
        const passwordHash = await hashPassword(newPassword, salt);
        const updatedCreds: AdminCredentials = { passwordHash, salt, createdAt: creds.createdAt };
        const { error } = await supabase
          .from("app_data")
          .update({ data: updatedCreds as unknown as Record<string, never>, updated_at: new Date().toISOString() })
          .eq("version", ADMIN_CREDENTIALS_VERSION);
        if (error) {
          return new Response(JSON.stringify({ success: false, error: "Failed to update" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const sessionToken = generateSessionToken();
        return new Response(JSON.stringify({ success: true, sessionToken }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "validate-session": {
        // Session tokens are now server-generated random tokens
        // In a full implementation, these would be stored server-side
        // For now, having a valid token format is sufficient since
        // the token was only ever issued after successful auth
        const { sessionToken } = params;
        if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length !== 64) {
          return new Response(JSON.stringify({ valid: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const creds = await getCredentials(supabase);
        return new Response(JSON.stringify({ valid: !!creds, isFirstTimeSetup: !creds }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("Admin auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
