import express from "express";
import { Booking } from "../models/Booking.js";
import { Worker } from "../models/Worker.js";

const router = express.Router();

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create a booking and compute ETA (simple approximation)
router.post("/", async (req, res) => {
  try {
    const { userId, jobName, description, scheduledAt, scheduledTo, location } = req.body;

    const booking = await Booking.create({
      user: userId,
      jobName,
      description: description || "",
      scheduledAt: scheduledAt || new Date(),
      scheduledTo: scheduledTo || null,
      location: location || {},
      status: "pending"
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// List bookings for a user (client)
router.get("/user/:userId", async (req, res) => {
  const bookings = await Booking.find({ user: req.params.userId })
    .populate({
      path: "worker",
      populate: { path: "user", select: "name phone email" }
    })
    .populate("user", "name email phone")
    .sort({ scheduledAt: -1 });
  res.json(bookings);
});

// List bookings for a worker
router.get("/worker/:workerId", async (req, res) => {
  const bookings = await Booking.find({ worker: req.params.workerId })
    .populate("user")
    .sort({ scheduledAt: -1 });
  res.json(bookings);
});
// Open pending jobs matching this worker's jobs
router.get("/open-for-worker/:workerId", async (req, res) => {
  const worker = await Worker.findById(req.params.workerId);
  if (!worker) return res.status(404).json({ message: "Worker not found" });

  // Fired/inactive or unapproved workers should not receive broadcast requests
  if (!worker.isActive || !worker.isApproved) return res.json([]);

  const jobNames = (worker.jobs || []).map((j) => j.name);
  if (!jobNames.length) return res.json([]);

  const bookings = await Booking.find({
    status: "pending",
    worker: { $exists: false },
    jobName: { $in: jobNames }
  })
    .populate("user")
    .sort({ createdAt: 1 });

  // For now, send all pending matching jobs to this worker (no distance filter)
  res.json(bookings);
});

// Worker accepts (claims) a job - first accept wins
router.patch("/:id/accept", async (req, res) => {
  try {
    const { workerId } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (!worker.isActive) return res.status(403).json({ message: "Worker is not active." });
    if (!worker.isApproved) return res.status(403).json({ message: "Worker is not approved." });

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: "pending", worker: { $exists: false } },
      { $set: { worker: workerId, status: "accepted" } },
      { new: true }
    );

    if (!booking) {
      return res
        .status(409)
        .json({ message: "This job was already taken by another worker." });
    }

    await Worker.findByIdAndUpdate(workerId, { isBusy: true });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Client or worker marks job as done
router.patch("/:id/mark-done", async (req, res) => {
  try {
    const { by } = req.body; // "client" or "worker"
    const updates = {};
    if (by === "client") updates.clientDone = true;
    if (by === "worker") updates.workerDone = true;

    let booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
      new: true
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.clientDone && booking.workerDone && booking.status !== "completed") {
      booking.status = "completed";
      await booking.save();
    }

    // free worker if no other active (pending/accepted) bookings
    const activeCount = await Booking.countDocuments({
      worker: booking.worker,
      status: { $in: ["pending", "accepted"] }
    });
    if (activeCount === 0) {
      await Worker.findByIdAndUpdate(booking.worker, { isBusy: false });
    }

    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Worker cancels an accepted booking
router.patch("/:id/cancel-worker", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled", workerDone: false },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const activeCount = await Booking.countDocuments({
      worker: booking.worker,
      status: { $in: ["pending", "accepted"] }
    });
    if (activeCount === 0) {
      await Worker.findByIdAndUpdate(booking.worker, { isBusy: false });
    }
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Client cancels a booking (pending or accepted)
router.patch("/:id/cancel-client", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required." });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.user) !== String(userId)) {
      return res.status(403).json({ message: "You can only cancel your own booking." });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: "This booking cannot be cancelled." });
    }

    booking.status = "cancelled";
    booking.clientDone = false;
    booking.workerDone = false;
    await booking.save();

    // if a worker was assigned, free them if no other active bookings
    if (booking.worker) {
      const activeCount = await Booking.countDocuments({
        worker: booking.worker,
        status: { $in: ["pending", "accepted"] }
      });
      if (activeCount === 0) {
        await Worker.findByIdAndUpdate(booking.worker, { isBusy: false });
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

