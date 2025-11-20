import crypto from 'crypto'

/**
 * Encryption utility for securing deployment tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64 // 512 bits

/**
 * Get the encryption key from environment variable
 * In production, this should be a strong random key stored securely
 */
function getEncryptionKey(): Buffer {
  const key = process.env.DEPLOYMENT_TOKEN_ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'DEPLOYMENT_TOKEN_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: node -e "console.log(crypto.randomBytes(32).toString(\'base64\'))"'
    )
  }

  // Convert base64 key to buffer
  return Buffer.from(key, 'base64')
}

/**
 * Encrypt a token using AES-256-GCM
 * Returns a base64 string in format: salt:iv:authTag:encryptedData
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey()

    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Generate random salt for additional security
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Combine all parts: salt:iv:authTag:encryptedData
    const combined = [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted,
    ].join(':')

    return combined
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypt a token encrypted with encryptToken
 * Expects format: salt:iv:authTag:encryptedData
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey()

    // Split the combined string
    const parts = encryptedToken.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted token format')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_saltBase64, ivBase64, authTagBase64, encryptedData] = parts

    // Convert from base64 to buffers
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Generate a secure encryption key for use in environment variables
 * This should be run once and the output stored in DEPLOYMENT_TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64')
}

/**
 * Validate that the encryption key is properly configured
 */
export function validateEncryptionSetup(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}
