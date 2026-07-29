import { type InferSchemaType, model, Schema } from "mongoose";

const customerModelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    document: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    occupation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    seedKey: {
      type: String,
      default: null,
      select: false,
      index: true,
    },
  },
  {
    collection: "customers",
    versionKey: false,
  },
);

export type CustomerPersistence = InferSchemaType<typeof customerModelSchema>;

export const CustomerModel = model<CustomerPersistence>(
  "Customer",
  customerModelSchema,
);
