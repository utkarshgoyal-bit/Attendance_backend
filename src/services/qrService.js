import crypto from 'crypto';

const QR_EXPIRY_MINUTES = 5;
const SECRET_KEY = "ATTENDANCE_SECRET_KEY_2025";

// FUNCTION 1: Generate QR Code Data
// Purpose: Generate dynamic QR code data that expires in 5 minutes
export const generateQRData = (branchId) => {
  try {
    // Generate unique QR code ID using timestamp + random string
    const timestamp = new Date();
    const randomString = crypto.randomBytes(8).toString('hex');
    const qrCodeId = `${timestamp.getTime()}-${randomString}`;

    // Calculate expiry time (current time + 5 minutes)
    const expiresAt = new Date(timestamp.getTime() + QR_EXPIRY_MINUTES * 60 * 1000);

    // Create cryptographic hash for validation
    const hashInput = `${branchId}${timestamp.toISOString()}${SECRET_KEY}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // Return QR data object
    const qrData = {
      qrCodeId,
      branchId,
      timestamp: timestamp.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hash
    };

    console.log(`Generated QR code for branch ${branchId}, expires at ${expiresAt.toISOString()}`);

    return qrData;
  } catch (error) {
    console.error('Error generating QR data:', error);
    throw error;
  }
};

// FUNCTION 2: Validate QR Code Data
// Purpose: Validate scanned QR code
export const validateQRData = (qrData) => {
  try {
    // Check if required fields exist
    if (!qrData || !qrData.branchId || !qrData.timestamp || !qrData.expiresAt || !qrData.hash) {
      return {
        valid: false,
        reason: "Invalid QR code format"
      };
    }

    // Check if QR code has expired
    const currentTime = new Date();
    const expiryTime = new Date(qrData.expiresAt);

    if (currentTime > expiryTime) {
      console.log(`QR code expired. Current: ${currentTime.toISOString()}, Expiry: ${expiryTime.toISOString()}`);
      return {
        valid: false,
        reason: "QR code expired"
      };
    }

    // Recreate hash using same logic as generation
    const hashInput = `${qrData.branchId}${qrData.timestamp}${SECRET_KEY}`;
    const recreatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // Compare hashes
    if (recreatedHash !== qrData.hash) {
      console.log('QR code hash mismatch - possible tampering');
      return {
        valid: false,
        reason: "Invalid QR code"
      };
    }

    // All checks passed
    console.log(`QR code validated successfully for branch ${qrData.branchId}`);
    return {
      valid: true
    };
  } catch (error) {
    console.error('Error validating QR data:', error);
    return {
      valid: false,
      reason: "Validation error"
    };
  }
};

// FUNCTION 3: Get Current Active QR Code
// Purpose: Get currently active QR code for a branch (for display)
export const getCurrentQR = (branchId) => {
  try {
    // Generate new QR data
    const qrData = generateQRData(branchId);

    console.log(`Retrieved current QR code for branch ${branchId}`);

    return qrData;
  } catch (error) {
    console.error('Error getting current QR:', error);
    throw error;
  }
};
