import { 
    getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { 
    collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";

const storage = getStorage();

export async function triggerUpload() {
    if (!auth.currentUser) return alert("Please login first.");

    const input = document.createElement('input');
    input.type = 'file';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const container = document.querySelector('.page-animate section.container');
        const progressWrapper = document.createElement('div');
        progressWrapper.id = "active-upload";
        progressWrapper.style = "margin-bottom: 20px; background: #111; padding: 15px; border-radius: 8px; border: 1px solid #222;";
        progressWrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 0.85rem; color: #eee;">Uploading ${file.name}...</span>
                <span id="upload-perc" style="font-size: 0.85rem; color: #00d2ff;">0%</span>
            </div>
            <div style="width: 100%; height: 4px; background: #222; border-radius: 10px; overflow: hidden;">
                <div id="upload-bar" style="width: 0%; height: 100%; background: #00d2ff; transition: width 0.3s ease;"></div>
            </div>`;
        container.prepend(progressWrapper);

        const fileRef = ref(storage, `uploads/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
            (snap) => {
                const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
                document.getElementById('upload-bar').style.width = prog + '%';
                document.getElementById('upload-perc').innerText = Math.round(prog) + '%';
            }, 
            (err) => { alert(err.message); progressWrapper.remove(); }, 
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, "files"), {
                    name: file.name,
                    url: url,
                    storagePath: uploadTask.snapshot.ref.fullPath,
                    size: file.size,
                    owner: auth.currentUser.uid,
                    sharedWithAI: false, // Default: AI cannot see it
                    createdAt: serverTimestamp()
                });
                setTimeout(() => progressWrapper.remove(), 1000);
            }
        );
    };
    input.click();
}

export function initFileListing() {
    const user = auth.currentUser;
    const container = document.querySelector('.page-animate section.container');
    if (!user || !container) return;

    const q = query(collection(db, "files"), where("owner", "==", user.uid), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const emptyState = container.querySelector('div[style*="dashed"]');
        let listHTML = `<div style="margin-top: 30px; display: grid; gap: 12px;">`;
        
        snapshot.forEach(fileDoc => {
            const file = fileDoc.data();
            const id = fileDoc.id;
            listHTML += `
                <div class="file-card" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="ph ph-file-spreadsheet" style="font-size: 1.4rem; color: #00d2ff;"></i>
                        <div>
                            <p style="margin:0; font-weight: 600; font-size: 0.9rem;">${file.name}</p>
                            <label style="font-size: 0.7rem; color: ${file.sharedWithAI ? '#00ff88' : '#666'}; cursor: pointer;">
                                <input type="checkbox" ${file.sharedWithAI ? 'checked' : ''} onchange="window.toggleAISharing('${id}', this.checked)"> 
                                Allow AI Analysis
                            </label>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="${file.url}" target="_blank" class="btn-icon"><i class="ph ph-download-simple"></i></a>
                        <button onclick="window.deleteUserFile('${id}', '${file.storagePath}')" class="btn-icon" style="color: #ff4444;"><i class="ph ph-trash"></i></button>
                    </div>
                </div>`;
        });
        listHTML += `</div>`;
        if (!snapshot.empty && emptyState) emptyState.outerHTML = listHTML;
    });
}

// Global Actions
window.toggleAISharing = async (id, status) => {
    await updateDoc(doc(db, "files", id), { sharedWithAI: status });
};

window.deleteUserFile = async (id, path) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
        await deleteObject(ref(storage, path));
        await deleteDoc(doc(db, "files", id));
    } catch (err) { alert("Delete failed: " + err.message); }
};

window.triggerUpload = triggerUpload;
window.openFileSelector = async () => {
    // 1. Fetch user's uploaded files from Firestore
    const q = query(collection(db, "files"), where("owner", "==", auth.currentUser.uid));
    const snap = await getDocs(q);
    
    // 2. Simple Modal/Overlay to select
    let fileHtml = snap.docs.map(d => `
        <div onclick="window.selectFileForAI('${d.data().url}', '${d.data().type}', '${d.data().name}')" 
             style="padding:10px; border-bottom:1px solid #222; cursor:pointer;">
            ${d.data().name}
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = "file-selector-modal";
    modal.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#181818; padding:20px; border-radius:12px; border:1px solid #333; z-index:2000; width:300px;";
    modal.innerHTML = `<h3>Select File for AI</h3>${fileHtml}<button onclick="this.parentElement.remove()" style="margin-top:10px;">Close</button>`;
    document.body.appendChild(modal);
};

window.selectFileForAI = (url, mimeType, name) => {
    selectedFilesForChat.push({ url, mimeType, name });
    document.getElementById('file-selector-modal').remove();
    updateAttachmentUI();
};

function updateAttachmentUI() {
    const div = document.getElementById('attachment-preview');
    div.innerHTML = selectedFilesForChat.map(f => `
        <span style="background: #00d2ff22; color: #00d2ff; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; border: 1px solid #00d2ff44;">
            ${f.name}
        </span>
    `).join('');
}