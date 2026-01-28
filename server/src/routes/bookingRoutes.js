import express from "express";
import { Booking } from "../models/Booking.js";

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
    const { userId, workerId, description, scheduledAt, location, workerLocation } =
      req.body;

    let etaMinutes = null;
    if (
      location?.lat != null &&
      location?.lng != null &&
      workerLocation?.lat != null &&
      workerLocation?.lng != null
    ) {
      const distanceKm = haversineKm(
        workerLocation.lat,
        workerLocation.lng,
        location.lat,
        location.lng
      );
      const speedKmH = 30; // assume average city speed
      etaMinutes = Math.round((distanceKm / speedKmH) * 60);
    }

    const booking = await Booking.create({
      user: userId,
      worker: workerId,
      description,
      scheduledAt,
      location,
      etaMinutes
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List bookings for a user
router.get("/user/:userId", async (req, res) => {
  const bookings = await Booking.find({ user: req.params.userId })
    .populate("worker")
    .sort({ scheduledAt: -1 });
  res.json(bookings);
});

export default router;

