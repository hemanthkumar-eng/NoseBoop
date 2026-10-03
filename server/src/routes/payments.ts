import express, { Response } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { authenticate, AuthRequest } from '../middleware/auth'
import Payment from '../models/Payment'
import User from '../models/User'

const router = express.Router()

// Created on first use so the keys loaded by dotenv in index.ts are available
let razorpay: Razorpay | null = null
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    })
  }
  return razorpay
}

// Monthly prices in INR; the server is the source of truth for what is charged
const planDetails: Record<string, { name: string; price: number }> = {
  plus: { name: 'Plus', price: 0 },
  gold: { name: 'Gold', price: 899 },
  premium: { name: 'Premium', price: 1499 },
}

// Create order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body

    if (!planId || !planDetails[planId]) {
      return res.status(400).json({ message: 'Invalid plan ID' })
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const plan = planDetails[planId]

    if (plan.price === 0) {
      return res.status(400).json({ message: 'This plan does not require payment' })
    }

    // Razorpay amounts are in paise
    const amount = plan.price * 100

    const options = {
      amount,
      currency: 'INR',
      receipt: `order_${Date.now()}_${req.user._id}`,
      notes: {
        userId: req.user._id.toString(),
        planId: planId,
        planName: plan.name,
      },
    }

    const razorpayOrder = await getRazorpay().orders.create(options)

    // Save payment record
    const payment = new Payment({
      userId: req.user._id,
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: razorpayOrder.currency || 'INR',
      planId: planId,
      planName: plan.name,
      status: 'pending',
      razorpayOrderId: razorpayOrder.id,
    })

    await payment.save()

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      userEmail: req.user.email,
    })
  } catch (error: any) {
    console.error('Create order error:', error)
    res.status(500).json({ message: error.message || 'Failed to create order' })
  }
})

// Verify payment
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex')

    const expected = Buffer.from(generatedSignature)
    const received = Buffer.from(String(razorpay_signature || ''))
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user._id,
    })

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' })
    }

    // The plan comes from the stored order, not from the request
    const planId = payment.planId
    const plan = planDetails[planId]

    // Repeat calls for an already verified payment do not extend the subscription
    if (payment.status === 'completed') {
      const user = await User.findById(req.user._id)
      return res.json({
        message: 'Payment already verified',
        subscription: user?.subscription,
      })
    }

    // Update payment status
    payment.status = 'completed'
    payment.razorpayPaymentId = razorpay_payment_id
    payment.razorpaySignature = razorpay_signature
    payment.paymentId = razorpay_payment_id
    await payment.save()

    // Update user subscription
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    await User.findByIdAndUpdate(req.user._id, {
      subscription: {
        planId: planId,
        planName: plan.name,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      },
    })

    res.json({
      message: 'Payment verified and subscription activated',
      subscription: {
        planId: planId,
        planName: plan.name,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      },
    })
  } catch (error: any) {
    console.error('Verify payment error:', error)
    res.status(500).json({ message: error.message || 'Failed to verify payment' })
  }
})

export default router

