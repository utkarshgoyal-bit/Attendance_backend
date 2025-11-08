import { getCurrentQR, validateQRData } from "../services/qrService.js";

// FUNCTION 1: Get Active QR Code
// Route: GET /api/attendance/qr/active?branchId=JAIPUR
export const getActiveQR = async (req, res) => {
  try {
    const { branchId } = req.query;

    // Validate branchId parameter
    if (!branchId) {
      return res.status(400).json({
        message: "Branch ID is required"
      });
    }

    // Get current QR code for the branch
    const qrData = getCurrentQR(branchId);

    console.log(`Active QR code retrieved for branch ${branchId}`);

    res.status(200).json({
      message: "QR code generated successfully",
      qrData
    });
  } catch (error) {
    console.error("Error getting active QR code:", error);
    res.status(500).json({
      message: "Failed to generate QR code",
      error: error.message
    });
  }
};

// FUNCTION 2: Validate QR Code
// Route: POST /api/attendance/qr/validate
export const validateQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    // Validate request body
    if (!qrData) {
      return res.status(400).json({
        message: "QR data is required"
      });
    }

    // Validate the QR code
    const validationResult = validateQRData(qrData);

    console.log(`QR code validation result: ${validationResult.valid}`);

    if (validationResult.valid) {
      res.status(200).json({
        message: "QR code is valid",
        ...validationResult
      });
    } else {
      res.status(400).json({
        message: "QR code validation failed",
        ...validationResult
      });
    }
  } catch (error) {
    console.error("Error validating QR code:", error);
    res.status(500).json({
      message: "Failed to validate QR code",
      error: error.message
    });
  }
};
