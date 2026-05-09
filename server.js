const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    })
  : null;

app.post("/api/create-order", async (req, res) => {
  const amount = Number(req.body?.amount);
  const currency = req.body?.currency || "INR";
  const receipt = req.body?.receipt || `receipt_${Date.now()}`;

  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return res.status(400).json({ error: "Amount must be an integer in paise" });
  }

  if (amount < 100) {
    return res.status(400).json({ error: "Minimum amount is 100 paise" });
  }

  if (!razorpay) {
    return res.status(500).json({ error: "Razorpay credentials are not configured" });
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || error?.error?.statusCode || 0);

    if (statusCode === 401) {
      return res.status(401).json({ error: "Razorpay authentication failed" });
    }

    return res.status(500).json({
      error: "Failed to create Razorpay order",
      details: error?.error?.description || error?.message || "Unknown error"
    });
  }
});

app.post("/api/verify-payment", (req, res) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature
  } = req.body || {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "Missing required payment verification fields" });
  }

  if (!razorpayKeySecret) {
    return res.status(500).json({ error: "Razorpay secret is not configured" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    return res.status(400).json({ error: "Signature mismatch" });
  }

  return res.json({ success: true, message: "Payment verified successfully" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
