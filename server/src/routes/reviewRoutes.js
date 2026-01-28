import express from "express";
import { Review } from "../models/Review.js";
import { Worker } from "../models/Worker.js";

const router = express.Router();

// Add review and update worker rating
router.post("/", async (req, res) => {
  try {
    const { bookingId, workerId, userId, rating, comment } = req.body;
    const review = await Review.create({
      booking: bookingId,
      worker: workerId,
      user: userId,
      rating,
      comment
    });

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
    res.status(400).json({ message: err.message });
  }
});

export default router;

