import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc   Create a Stripe Payment Intent
 * @route  POST /api/payments/create-intent
 * @access Authenticated / Public (depending on your setup)
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd", description } = req.body;

    // 🧾 Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    // 💳 Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer (in cents)
      currency,
      description: description || "Website Payment",
      automatic_payment_methods: { enabled: true },
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      message: "Payment intent created successfully",
    });
  } catch (error) {
    console.error("Stripe error:", error.message);

    // Differentiate Stripe errors for cleaner feedback
    res.status(error.statusCode || 500).json({
      message: error.raw?.message || error.message || "Stripe payment error",
    });
  }
};
