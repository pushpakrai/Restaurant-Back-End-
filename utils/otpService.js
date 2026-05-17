/**
 * In-memory OTP storage for rapid verification.
 * In production, use Redis or a Short-lived MongoDB collection.
 */
const otps = new Map(); // email -> { code, expiresAt }

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates and stores a 6-digit OTP.
 * @param {string} email
 * @returns {string} 6-digit numeric string
 */
function generateOtp(email) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otps.set(email.toLowerCase(), { code, expiresAt });
  return code;
}

/**
 * Verifies the OTP.
 * @param {string} email
 * @param {string} code
 * @returns {boolean}
 */
function verifyOtp(email, code) {
  const entry = otps.get(email.toLowerCase());
  if (!entry) return false;

  const { code: storedCode, expiresAt } = entry;
  if (Date.now() > expiresAt) {
    otps.delete(email.toLowerCase());
    return false;
  }

  const isValid = storedCode === code.trim();
  if (isValid) {
    otps.delete(email.toLowerCase()); // code is single-use
  }
  return isValid;
}

module.exports = { generateOtp, verifyOtp };
