import express from "express";
import { Worker } from "../models/Worker.js";
import { Booking } from "../models/Booking.js";

const router = express.Router();

// Register worker profile (basic, no auth for demo)
router.post("/register", async (req, res) => {
  try {
    const { userId, skills, hourlyRate, location } = req.body;
    const worker = await Worker.create({
      user: userId,
      skills,
      hourlyRate,
      location
    });
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List approved/active workers sorted by rating, optional skill search
router.get("/", async (req, res) => {
  const { q } = req.query;
  const filter = { isApproved: true, isActive: true };
  if (q && q.trim()) {
    // match skill text against provided query
    filter.skills = { $regex: q.trim(), $options: "i" };
  }

  const workers = await Worker.find(filter).sort({
    averageRating: -1,
    reviewCount: -1
  });
  res.json(workers);
});

// Check availability for a given time window
router.get("/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const overlapping = await Booking.find({
    worker: id,
    scheduledAt: { $gte: fromDate, $lte: toDate },
    status: { $in: ["pending", "accepted"] }
  });
  const isAvailable = overlapping.length === 0;
  res.json({ isAvailable });
});

export default router;

