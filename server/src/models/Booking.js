import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" }, // not required
    jobName: { type: String, required: true },
    description: { type: String },
    scheduledAt: { type: Date, default: Date.now },
    scheduledTo: { type: Date }, // End time for the work
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending"
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    etaMinutes: { type: Number },
    clientDone: { type: Boolean, default: false },
    workerDone: { type: Boolean, default: false },
    clientReviewed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);

