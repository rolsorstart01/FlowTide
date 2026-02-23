1 - Do Firebase storage setup : 
    Rules : 
        service firebase.storage {
        match /b/{bucket}/o {
            match /uploads/{userId}/{allPaths=**} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
            }
        }
        }
2 - Team Manager : 
    1. API Limits
    2. File Access
    3. Chat Access
    4. Role Managment
    5. Add workers
3 - Pricing Payments Database upload