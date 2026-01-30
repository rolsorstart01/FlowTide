// ../js/team-handler.js
import { db, auth } from "./script.js";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function initTeamManagement() {
    const inviteForm = document.getElementById('invite-form');
    const teamList = document.getElementById('team-list');

    if (!auth.currentUser) return;

    // 1. Fetch Current User's Company Data
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userData = userDoc.data();
    const companyId = userData.companyId || auth.currentUser.uid; // Fallback to UID if no company set

    // 2. Load Team Members
    const loadTeam = async () => {
        const q = query(collection(db, "users"), where("companyId", "==", companyId));
        const snapshot = await getDocs(q);

        teamList.innerHTML = "";
        snapshot.forEach(memberDoc => {
            const member = memberDoc.data();
            teamList.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #222;">
                    <div>
                        <div style="font-weight: 600;">${member.displayName || 'Pending Member'}</div>
                        <div style="font-size: 0.8rem; color: #888;">${member.email}</div>
                    </div>
                    <span class="badge">${member.plan || 'Member'}</span>
                </div>
            `;
        });
    };

    // 3. Handle Invitation via EmailJS
    if (inviteForm) {
        inviteForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('invite-email').value;

            try {
                // In a real app, you'd check subscription seat limits here

                // EmailJS Integration
                // Note: Initialize emailjs in your HTML head first
                await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
                    to_email: email,
                    from_name: userData.displayName || "Your Founder",
                    invite_link: `${window.location.origin}/signup?companyId=${companyId}`,
                    company_name: companyId
                });

                alert("Invite sent successfully!");
                inviteForm.reset();
            } catch (err) {
                console.error("Invite failed", err);
                alert("Failed to send invite.");
            }
        };
    }

    loadTeam();
}