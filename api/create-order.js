const Razorpay = require('razorpay');

const instance = new Razorpay({
    key_id: 'rzp_live_S61J7p7YKjOlxz',
    key_secret: process.env.RAZORPAY_SECRET,
});

module.exports = async (req, res) => {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, planName } = req.body;

        // 2. Validate input - Razorpay will fail if amount is not a clean integer
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: 'Invalid amount provided' });
        }

        const options = {
            amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                plan: planName || "FlowTide Upgrade"
            }
        };

        const order = await instance.orders.create(options);

        // 3. Return the order object to the frontend
        res.status(200).json(order);

    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        res.status(500).json({
            error: "Failed to create order",
            details: err.message
        });
    }
};