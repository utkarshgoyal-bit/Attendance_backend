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

  const qrData = {
    qrCodeId,
    branchId,
    timestamp,
    expiresAt: expiryTime.toISOString(),
    hash
  };

  // Create URL with encoded QR data
  // This URL will open on employee's phone when they scan
  const baseURL = 'http://localhost:3000/attendance/checkin'; // Change to your domain in production
  const encodedData = encodeURIComponent(JSON.stringify(qrData));
  const qrURL = `${baseURL}?qr=${encodedData}`;

  return {
    ...qrData,
    qrURL  // Add the URL
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