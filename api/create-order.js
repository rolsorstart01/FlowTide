// api/create-order.js
const Razorpay = require('razorpay');

const instance = new Razorpay({
    key_id: 'rzp_live_S61J7p7YKjOlxz',
    key_secret: process.env.RAZORPAY_SECRET, // Add Bvjdgd4hvF6snLUu6ERJid9R to Vercel Env Vars
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Use POST');

    const { amount, planName } = req.body;
    const options = {
        amount: amount * 100, // Razorpay uses paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { plan: planName }
    };

    try {
        const order = await instance.orders.create(options);
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}