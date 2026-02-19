// api/create-order.js
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
    // Force JSON headers to prevent "Unexpected token A" on the frontend
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { amount, planName } = req.body;

        // Vercel build will replace this placeholder with your actual secret
        const SECRET = "";

        const instance = new Razorpay({
            key_id: 'rzp_live_S61J7p7YKjOlxz',
            key_secret: SECRET
        });

        const options = {
            amount: Math.round(Number(amount) * 100), // Convert to paise
            currency: "INR",
            receipt: `flow_${Date.now()}`,
            notes: { plan: planName }
        };

        const order = await instance.orders.create(options);
        return res.status(200).json(order);

    } catch (err) {
        console.error("RAZORPAY_CRASH:", err.message);
        // We return JSON even on error so your frontend catch block works
        return res.status(500).json({
            error: "Internal Server Error",
            details: err.message
        });
    }
};