const Razorpay = require("razorpay");

function parseJsonBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  if (typeof req.body === "object") {
    return req.body;
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(500).json({ error: "Razorpay credentials are not configured" });
  }

  const body = parseJsonBody(req);
  const amount = Number(body.amount);
  const currency = body.currency || "INR";
  const receipt = body.receipt || `receipt_${Date.now()}`;

  if (!Number.isInteger(amount)) {
    return res.status(400).json({ error: "Amount must be an integer in paise" });
  }

  if (amount < 100) {
    return res.status(400).json({ error: "Minimum amount is 100 paise" });
  }

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt
    });

    return res.status(200).json({
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
};
