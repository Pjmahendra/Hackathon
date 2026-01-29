import express from "express";
import { Review } from "../models/Review.js";
import { Worker } from "../models/Worker.js";
import { Booking } from "../models/Booking.js";

const router = express.Router();

// Add review and update worker rating
router.post("/", async (req, res) => {
  try {
    const { bookingId, userId, rating, comment } = req.body;

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be a number from 1 to 5." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (String(booking.user) !== String(userId)) {
      return res.status(403).json({ message: "You can only review your own booking." });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only review after the job is completed." });
    }
    if (!booking.worker) {
      return res.status(400).json({ message: "This booking has no assigned worker to review." });
    }
    if (booking.clientReviewed) {
      return res.status(409).json({ message: "You already reviewed this booking." });
    }

    const review = await Review.create({
      booking: bookingId,
      worker: booking.worker,
      user: userId,
      rating: numericRating,
      comment
    });

    await Booking.findByIdAndUpdate(bookingId, { clientReviewed: true });

    // recompute worker rating
    const agg = await Review.aggregate([
      { $match: { worker: review.worker } },
      {
        $group: {
          _id: "$worker",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    if (agg.length) {
      await Worker.findByIdAndUpdate(review.worker, {
        averageRating: agg[0].averageRating,
        reviewCount: agg[0].reviewCount
      });
    }

    res.status(201).json(review);
  } catch (err) {
    // Duplicate key (unique index) -> already reviewed
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this booking." });
    }
    res.status(400).json({ message: err.message });
  }
});

export default router;

