import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skills: [{ type: String }],
    hourlyRate: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // availability slots could be extended later
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);

