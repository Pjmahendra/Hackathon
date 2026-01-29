import express from "express";
import { Worker } from "../models/Worker.js";
import { Booking } from "../models/Booking.js";

const router = express.Router();

// Helper: Check if worker is available at a given date/time
function isWorkerAvailableAt(worker, scheduledAt) {
  if (!worker.availability || worker.availability.length === 0) {
    // No availability set = always available (backward compatible)
    return true;
  }

  const date = new Date(scheduledAt);
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeMinutes = hour * 60 + minute; // Convert to minutes since midnight

  // Check if any availability slot matches this day and time
  return worker.availability.some((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false;

    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  });
}

// Register worker profile (create or update by user)
router.post("/register", async (req, res) => {
  try {
    const { userId, jobs = [], location, availability = [], profilePhoto } = req.body;
    const skills = jobs.map((j) => j.name);
    const hourlyRate = jobs.length ? jobs[0].pricePerHour : 0;
    let worker = await Worker.findOne({ user: userId });
    if (worker) {
      worker.skills = skills;
      worker.hourlyRate = hourlyRate;
      worker.location = location;
      worker.jobs = jobs;
      worker.availability = availability;
      if (profilePhoto !== undefined) {
        worker.profilePhoto = profilePhoto;
      }
      await worker.save();
    } else {
      worker = await Worker.create({
        user: userId,
        skills,
        hourlyRate,
        location,
        jobs,
        availability,
        profilePhoto: profilePhoto || null
      });
    }
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List approved/active workers sorted by rating, optional skill search or by user
router.get("/", async (req, res) => {
  const { q, byUser } = req.query;
  const filter = {};

  if (byUser) {
    filter.user = byUser;
  } else {
    filter.isApproved = true;
    filter.isActive = true;
    filter.isBusy = false;
    if (q && q.trim()) {
      // match job/skill text against provided query
      // (some older records may have `jobs` populated but `skills` missing/outdated)
      const rx = { $regex: q.trim(), $options: "i" };
      filter.$or = [{ skills: rx }, { "jobs.name": rx }];
    }
  }

  const workers = await Worker.find(filter)
    .populate("user")
    .sort({
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

