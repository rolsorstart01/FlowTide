// api/create-order.js
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
    // Force JSON headers so the browser knows what to expect
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, planName } = req.body;

        // Vercel build command will replace this string with your actual secret
        const INJECTED_SECRET = "REPLACE_WITH_RZP_SECRET";

        const instance = new Razorpay({
            key_id: 'rzp_live_S61J7p7YKjOlxz',
            key_secret: INJECTED_SECRET,
        });

        const options = {
            amount: Math.round(Number(amount) * 100), // Convert to paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: { plan: planName }
        };

        const order = await instance.orders.create(options);
        return res.status(200).json(order);

    } catch (err) {
        console.error("RAZORPAY ERROR:", err);
        // We return JSON even on error to prevent the "Unexpected Token A" crash
        return res.status(500).json({
            error: "Razorpay order creation failed",
            details: err.message
        });
    }
};