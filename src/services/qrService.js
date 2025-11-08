import crypto from 'crypto';

const QR_EXPIRY_MINUTES = 5;
const SECRET_KEY = "ATTENDANCE_SECRET_KEY_2025";

export const generateQRData = (branchId) => {
  const timestamp = new Date().toISOString();
  const expiryTime = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);
  const qrCodeId = `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Create hash for security
  const hashInput = `${branchId}${timestamp}${SECRET_KEY}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  
  return {
    qrCodeId,
    branchId,
    timestamp,
    expiresAt: expiryTime.toISOString(),
    hash
  };
};

export const validateQRData = (qrData) => {
  // Check if expired
  const now = new Date();
  const expiresAt = new Date(qrData.expiresAt);
  
  if (now > expiresAt) {
    return { valid: false, reason: "QR code expired" };
  }
  
  // Validate hash
  const hashInput = `${qrData.branchId}${qrData.timestamp}${SECRET_KEY}`;
  const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
  
  if (calculatedHash !== qrData.hash) {
    return { valid: false, reason: "Invalid QR code" };
  }
  
  return { valid: true };
};

export const getCurrentQR = (branchId) => {
  return generateQRData(branchId);
};