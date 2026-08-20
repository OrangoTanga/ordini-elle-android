// Pure JS AES-256-GCM + PBKDF2 — works in Expo Go (no native crypto required)
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { gcm } from '@noble/ciphers/aes.js'

const ITERATIONS = 100000
const KEY_LEN = 32

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n)
  globalThis.crypto.getRandomValues(b)
  return b
}

function deriveKey(password: string, salt: string): Uint8Array {
  return pbkdf2(sha256, password, salt, { c: ITERATIONS, dkLen: KEY_LEN })
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function encryptData(plaintext: string, password: string, salt: string): Promise<string> {
  const key = deriveKey(password, salt)
  const nonce = randomBytes(12)
  const aes = gcm(key, nonce)
  const encrypted = aes.encrypt(new TextEncoder().encode(plaintext))
  const combined = new Uint8Array(nonce.length + encrypted.length)
  combined.set(nonce)
  combined.set(encrypted, nonce.length)
  return toBase64(combined)
}

export async function decryptData(ciphertext: string, password: string, salt: string): Promise<string> {
  const key = deriveKey(password, salt)
  const raw = fromBase64(ciphertext)
  const nonce = raw.slice(0, 12)
  const data = raw.slice(12)
  const aes = gcm(key, nonce)
  const decrypted = aes.decrypt(data)
  return new TextDecoder().decode(decrypted)
}
