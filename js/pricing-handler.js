// ../js/pricing-handler.js
export function initPricingSliders() {
    // These IDs now match your HTML (s, p, e)
    const plans = [
        { id: 's', margin: 500, storageRate: 10, apiRate: 50 },
        { id: 'p', margin: 1500, storageRate: 8, apiRate: 40 },
        { id: 'e', margin: 2500, storageRate: 5, apiRate: 30 }
    ];

    plans.forEach(plan => {
        const storageSlider = document.getElementById(`${plan.id}-storage`);
        const apiSlider = document.getElementById(`${plan.id}-api`);
        const storageVal = document.getElementById(`${plan.id}-storage-val`);
        const apiVal = document.getElementById(`${plan.id}-api-val`);
        const priceDisplay = document.getElementById(`${plan.id}-price`);

        const update = () => {
            const sVal = parseInt(storageSlider.value);
            const aVal = parseInt(apiSlider.value);

            // Update the text labels
            if (storageVal) storageVal.innerText = sVal;
            if (apiVal) apiVal.innerText = aVal;

            // Calculate: Base Margin + (Storage * Rate) + (API * Rate)
            const total = plan.margin + (sVal * plan.storageRate) + (aVal * plan.apiRate);

            // Update the price display
            if (priceDisplay) {
                priceDisplay.innerText = total.toLocaleString('en-IN');
            }
        };

        if (storageSlider && apiSlider) {
            storageSlider.oninput = update;
            apiSlider.oninput = update;
            update(); // Initial calculation on load
        }
    });
}