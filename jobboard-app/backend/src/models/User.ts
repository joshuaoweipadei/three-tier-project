import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["employer", "candidate", "admin"],
      default: "candidate",
    },
    avatar:     { type: String, default: null },
    company:    { type: String, trim: true, maxlength: 100 },
    bio:        { type: String, maxlength: 500 },
    resume:     { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before save
// Mongoose 9 + TypeScript 6: return a Promise instead of calling next().
// When an async pre-hook returns a rejected promise, Mongoose catches it
// automatically — no next() parameter needed at all.
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method — comparePassword
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Strip password from all JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
UserSchema.index({ role: 1, isActive: 1 });

// Safe model registration 
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;