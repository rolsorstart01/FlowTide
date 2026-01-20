// api/create-order.js
const Razorpay = require('razorpay');

/**
 * This file uses the CommonJS 'require' syntax to ensure maximum stability 
 * with Vercel's Node.js runtime and to avoid the "ESM to CommonJS" compilation warning.
 * * The RAZORPAY_SECRET is injected at build-time via the 'sed' command 
 * defined in your vercel.json.
 */

module.exports = async (req, res) => {
    // 1. Force JSON response headers
    res.setHeader('Content-Type', 'application/json');

    // 2. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { amount, planName } = req.body;

        // --- SECRET INJECTION POINT ---
        // Vercel's build command replaces the string below with your actual secret.
        const RZP_SECRET_INJECTED = "REPLACE_WITH_RZP_SECRET";

        // 3. Initialize Razorpay
        const instance = new Razorpay({
            key_id: 'rzp_live_S61J7p7YKjOlxz',
            key_secret: RZP_SECRET_INJECTED
        });

        // 4. Validate the amount
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "A valid amount is required" });
        }

        // 5. Create Order
        const options = {
            amount: Math.round(Number(amount) * 100), // Convert INR to Paise
            currency: "INR",
            receipt: `flowtide_rcpt_${Date.now()}`,
            notes: {
                plan: planName || "Premium Upgrade",
                environment: "production"
            }
        };

        const order = await instance.orders.create(options);

        // 6. Return the order object to the frontend
        return res.status(200).json(order);

    } catch (err) {
        console.error("RAZORPAY_ORDER_ERROR:", err.message);

        // Return JSON error so script.js doesn't fail with "Unexpected token A"
        return res.status(500).json({
            error: "Order creation failed",
            message: err.message
        });
    }
};