// ../js/pricing-handler.js
export function initPricingSliders() {
    const plans = [
        { id: 'starter', margin: 500, storageRate: 10, apiRate: 50 },
        { id: 'pro', margin: 1500, storageRate: 8, apiRate: 40 },
        { id: 'ent', margin: 2500, storageRate: 5, apiRate: 30 }
    ];

    plans.forEach(plan => {
        const storageSlider = document.getElementById(`${plan.id}-storage`);
        const apiSlider = document.getElementById(`${plan.id}-api`);

        const update = () => {
            const sVal = parseInt(storageSlider.value);
            const aVal = parseInt(apiSlider.value);

            // Display values
            document.getElementById(`${plan.id}-storage-val`).innerText = sVal;
            document.getElementById(`${plan.id}-api-val`).innerText = aVal;

            // Calculate: Base Margin + (Storage * Rate) + (API * Rate)
            const total = plan.margin + (sVal * plan.storageRate) + (aVal * plan.apiRate);
            document.getElementById(`${plan.id}-price`).innerText = total.toLocaleString('en-IN');
        };

        if (storageSlider && apiSlider) {
            storageSlider.oninput = update;
            apiSlider.oninput = update;
            update(); // Initial calc
        }
    });
}