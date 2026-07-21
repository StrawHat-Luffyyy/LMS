import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded"],
        message: "Status must be either pending, completed, failed or refunded",
      },
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    paymentId: {
      type: String,
      required: [true, "Payment ID is required"],
    },
    refundId: {
      type: String,
    },
    refundedAmount: {
      type: Number,
      min: [0, "Refunded amount must be a positive number"],
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

coursePurchaseSchema.index({ user: 1, course: 1 }, { unique: true });
coursePurchaseSchema.index({ status: 1 });
coursePurchaseSchema.index({ createdAt: -1 });

coursePurchaseSchema.virtual("isRefundable").get(function () {
  if (this.status !== "completed") return false;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.createdAt >= thirtyDaysAgo;
});

coursePurchaseSchema.methods.processRefund = function (reason, amount) {
  this.status = "refunded";
  this.reason = reason;
  this.refundedAmount = amount;
  return this.save({ validateBeforeSave: false });
};

export const CoursePurchase = mongoose.model(
  "CoursePurchase",
  coursePurchaseSchema,
);
