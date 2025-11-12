import express from "express";
import {
  applyLeave,
  getLeaveBalance,
  getLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  bulkApproveLeaves
} from "../controllers/leaveController.js";

const router = express.Router();

// Leave application
router.post("/apply", applyLeave);

// Leave balance
router.get("/balance/:employeeId", getLeaveBalance);

// Get leaves
router.get("/", getLeaves); // Supports ?status=PENDING&employeeId=xxx
router.get("/pending", getPendingLeaves);

// Approve/Reject
router.put("/approve/:id", approveLeave);
router.put("/reject/:id", rejectLeave);

// Bulk operations
router.post("/bulk-approve", bulkApproveLeaves);

export default router;
