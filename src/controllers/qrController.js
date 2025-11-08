import { getCurrentQR, validateQRData } from "../services/qrService.js";

export const getActiveQR = async (req, res) => {
  try {
    const { branchId } = req.query;
    
    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }
    
    console.log(`Generating QR for branch: ${branchId}`);
    const qrData = getCurrentQR(branchId);
    res.status(200).json(qrData);
  } catch (error) {
    console.error("Error generating QR:", error);
    res.status(500).json({ message: "Failed to generate QR code", error: error.message });
  }
};

export const validateQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ message: "qrData is required" });
    }
    
    const validation = validateQRData(qrData);
    res.status(200).json(validation);
  } catch (error) {
    console.error("Error validating QR:", error);
    res.status(500).json({ message: "Failed to validate QR code", error: error.message });
  }
};