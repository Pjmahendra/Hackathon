import express from "express";
import { Worker } from "../models/Worker.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

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

// Rehire / reactivate worker
router.post("/workers/:id/rehire", async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );
  res.json(worker);
});

// List users
router.get("/users", async (_req, res) => {
  const users = await User.find();
  res.json(users);
});

// Worker visited locations (based on assigned bookings)
router.get("/workers/:id/visits", async (req, res) => {
  try {
    const workerId = req.params.id;

    const visits = await Booking.find({
      worker: workerId,
      "location.lat": { $type: "number" },
      "location.lng": { $type: "number" }
    })
      .select("jobName description status scheduledAt scheduledTo location createdAt updatedAt")
      .sort({ scheduledAt: -1 });

    res.json(visits);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Client visits (which workers visited this client) based on bookings
router.get("/users/:id/visits", async (req, res) => {
  try {
    const userId = req.params.id;

    const visits = await Booking.find({
      user: userId,
      worker: { $exists: true, $ne: null }
    })
      .populate({
        path: "worker",
        populate: { path: "user" }
      })
      .select("jobName description status scheduledAt scheduledTo location worker createdAt updatedAt")
      .sort({ scheduledAt: -1 });

    res.json(visits);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

