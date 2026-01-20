// api/create-order.js
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
    // 1. Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // 2. Initialize Razorpay inside the function
        const instance = new Razorpay({
            key_id: 'rzp_live_S61J7p7YKjOlxz',
            key_secret: process.env.RAZORPAY_SECRET // This must be in Vercel Settings
        });

        const { amount, planName } = req.body;

        // 3. Create the order
        const options = {
            amount: Math.round(Number(amount) * 100), // Convert INR to Paise
            currency: "INR",
            receipt: `order_${Date.now()}`,
            notes: { plan: planName }
        };

        const order = await instance.orders.create(options);

        // 4. Send back JSON (The frontend is waiting for this!)
        return res.status(200).json(order);

    } catch (err) {
        console.error("Backend Error:", err.message);
        // If it fails, we still send JSON so the frontend doesn't crash
        return res.status(500).json({ error: err.message });
    }
};
export async function processPayment(planName, amount) {
    try {
        // Strip commas from slider values (e.g., "1,500" -> 1500)
        const cleanAmount = parseInt(amount.toString().replace(/,/g, ''));

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cleanAmount, planName })
        });

        // SAFETY CHECK: If Vercel sends HTML instead of JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            console.error("Server Error HTML:", errorText);
            throw new Error("Backend crashed. Check Vercel Logs for 'RAZORPAY_SECRET' errors.");
        }

        const order = await response.json();

        // ... Launch Razorpay Modal ...
        const options = {
            key: "rzp_live_S61J7p7YKjOlxz",
            amount: order.amount,
            order_id: order.id,
            // ... rest of options
        };
        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (err) {
        alert("Error: " + err.message);
    }
}