import express from "express";
import { Worker } from "../models/Worker.js";
import { User } from "../models/User.js";

const router = express.Router();

// List all workers (for admin dashboard)
router.get("/workers", async (_req, res) => {
  const workers = await Worker.find().populate("user");
  res.json(workers);
});

// Approve worker registration
router.post("/workers/:id/approve", async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { isApproved: true },
    { new: true }
  );
  res.json(worker);
});

// Fire / deactivate worker
router.post("/workers/:id/fire", async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  res.json(worker);
});

// List users
router.get("/users", async (_req, res) => {
  const users = await User.find();
  res.json(users);
});

export default router;

