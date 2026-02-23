import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";

const API_KEY = "YOUR_API_KEY"; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * Helper: Fetches a file from a URL and converts it to Gemini's inlineData format.
 */
async function urlToGenerativePart(fileUrl, mimeType) {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType }
    };
}

/**
 * Validates the user's API limits against their pricing plan.
 */
async function checkApiLimits(estimatedTokens) {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    const limit = userData.planLimit || 50000; // E.g., from pricing-handler.js
    const used = userData.tokensUsed || 0;

    if (used + estimatedTokens > limit) {
        alert("API Limit Reached! Please upgrade your plan.");
        return false;
    }
    return true;
}

/**
 * Core AI Generation Engine
 */
export async function generateAIResponse(chatId, promptText, attachedFiles = []) {
    const user = auth.currentUser;
    
    // 1. Fetch Chat History from Firestore
    const messagesRef = collection(db, "ai_chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const historySnap = await getDocs(q);
    
    // Format history for Gemini API
    const history = historySnap.docs.map(doc => ({
        role: doc.data().role,
        parts: [{ text: doc.data().text }]
    }));

    // 2. Prepare the new message payload with specific files
    const newParts = [{ text: promptText }];
    for (let file of attachedFiles) {
        const filePart = await urlToGenerativePart(file.url, file.mimeType);
        newParts.push(filePart);
    }

    // 3. Track Tokens BEFORE sending
    const tokenCountReq = await model.countTokens({
        contents: [...history, { role: "user", parts: newParts }]
    });
    const estimatedTokens = tokenCountReq.totalTokens;

    const canProceed = await checkApiLimits(estimatedTokens);
    if (!canProceed) throw new Error("Limit Exceeded");

    // 4. Start Gemini Chat Session
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newParts);
    const responseText = result.response.text();

    // 5. Update Token Usage in Firestore
    const actualTokensUsed = result.response.usageMetadata.totalTokenCount;
    await updateDoc(doc(db, "users", user.uid), {
        tokensUsed: (actualTokensUsed || estimatedTokens) + (userSnap.data()?.tokensUsed || 0)
    });

    // 6. Save new messages to Firestore History
    await addDoc(messagesRef, { role: "user", text: promptText, timestamp: new Date() });
    await addDoc(messagesRef, { role: "model", text: responseText, timestamp: new Date() });

    return responseText;
}