import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String }
  },
  { timestamps: true }
);

// One review per booking per user
reviewSchema.index({ booking: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);

