import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ["user", "worker", "admin"], default: "user" },
    workerJobs: [{ type: String }],
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

