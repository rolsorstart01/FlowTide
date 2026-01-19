/**
 * FlowTide Cookie Consent Handler
 * Manages the visibility and state of the legal consent banner.
 */

export function initCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');

    if (!banner) return;

    // Check LocalStorage to see if user has already dismissed it
    const hasConsented = localStorage.getItem('cookieConsent');

    if (!hasConsented) {
        banner.style.display = 'block';
    }

    if (acceptBtn) {
        acceptBtn.onclick = () => {
            localStorage.setItem('cookieConsent', 'true');
            banner.style.display = 'none';
        };
    }
}