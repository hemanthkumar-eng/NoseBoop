import mongoose, { Document, Schema } from 'mongoose'

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId
  orderId: string
  paymentId?: string
  amount: number
  currency: string
  planId: string
  planName: string
  status: 'pending' | 'completed' | 'failed'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    planId: {
      type: String,
      required: true,
      enum: ['plus', 'gold', 'premium'],
    },
    planName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IPayment>('Payment', PaymentSchema)

