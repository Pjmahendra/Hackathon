import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skills: [{ type: String }],
    hourlyRate: { type: Number, default: 0 },
    jobs: [
      {
        name: { type: String, required: true },
        pricePerHour: { type: Number } // Optional - can be set from fixed pricing
      }
    ],
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // availability slots could be extended later
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    isBusy: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sunday, 6=Saturday
        startTime: { type: String, required: true }, // "HH:mm" format (e.g., "09:00")
        endTime: { type: String, required: true } // "HH:mm" format (e.g., "17:00")
      }
    ],
    profilePhoto: { type: String } // Base64 encoded image or URL
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);

