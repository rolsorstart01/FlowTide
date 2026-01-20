// api/create-order.js
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
    // 1. Force JSON headers immediately
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { amount, planName } = req.body;

        // 2. Initializing inside the handler ensures env vars are ready
        const instance = new Razorpay({
            key_id: 'rzp_live_S61J7p7YKjOlxz',
            key_secret: process.env.RAZORPAY_SECRET
        });

        const options = {
            amount: Math.round(Number(amount) * 100), // Convert to paise
            currency: "INR",
            receipt: `order_${Date.now()}`,
            notes: { plan: planName }
        };

        const order = await instance.orders.create(options);
        return res.status(200).json(order);

    } catch (err) {
        console.error("RAZORPAY CRASH:", err.message);
        // We return a JSON error so the frontend catch block handles it gracefully
        return res.status(500).json({ error: err.message });
    }
};