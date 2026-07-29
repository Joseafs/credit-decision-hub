import { userRoleValues } from "@credit-decision-hub/contracts";
import { type InferSchemaType, model, Schema } from "mongoose";

const userModelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoleValues, required: true },
    active: { type: Boolean, required: true, default: true },
  },
  { collection: "users", timestamps: true, versionKey: false },
);

export type UserPersistence = InferSchemaType<typeof userModelSchema>;
export const UserModel = model<UserPersistence>("User", userModelSchema);
