import express from "express";
import { 
  applyLeave, getLeaves, getLeaveBalance, 
  approveLeave, rejectLeave, bulkApproveLeaves 
} from "../controllers/leave.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/apply", requireRole("EMPLOYEE"), applyLeave);
router.get("/", requireRole("EMPLOYEE"), getLeaves);
router.get("/balance/:employeeId", requireRole("EMPLOYEE"), getLeaveBalance);
router.put("/approve/:id", requireRole("MANAGER"), approveLeave);
router.put("/reject/:id", requireRole("MANAGER"), rejectLeave);
router.post("/bulk-approve", requireRole("MANAGER"), bulkApproveLeaves);

export default router;
