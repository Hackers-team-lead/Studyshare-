// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication state observer
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log("User is signed in:", user);
        updateUIForUser(user);
    } else {
        // User is signed out
        console.log("User is signed out");
        updateUIForGuest();
    }
});

// Update UI for authenticated user
function updateUIForUser(user) {
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.textContent = 'My Account';
        loginBtn.href = '#';
        loginBtn.addEventListener('click', () => {
            // Show user dropdown or account page
        });
    }
}

// Update UI for guest
function updateUIForGuest() {
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = 'login.html';
    }
}

// Login function
function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Logout function
function logout() {
    return auth.signOut();
}

// Get all study materials
function getStudyMaterials(limit = 10) {
    return db.collection('materials')
        .orderBy('uploadDate', 'desc')
        .limit(limit)
        .get()
        .then(querySnapshot => {
            const materials = [];
            querySnapshot.forEach(doc => {
                materials.push({ id: doc.id, ...doc.data() });
            });
            return materials;
        });
}

// Get materials by category
function getMaterialsByCategory(category, limit = 10) {
    return db.collection('materials')
        .where('category', '==', category)
        .orderBy('uploadDate', 'desc')
        .limit(limit)
        .get()
        .then(querySnapshot => {
            const materials = [];
            querySnapshot.forEach(doc => {
                materials.push({ id: doc.id, ...doc.data() });
            });
            return materials;
        });
}

// Search materials
function searchMaterials(query, limit = 10) {
    return db.collection('materials')
        .orderBy('title')
        .startAt(query)
        .endAt(query + '\uf8ff')
        .limit(limit)
        .get()
        .then(querySnapshot => {
            const materials = [];
            querySnapshot.forEach(doc => {
                materials.push({ id: doc.id, ...doc.data() });
            });
            return materials;
        });
}

// Upload material
function uploadMaterial(file, metadata) {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`materials/${file.name}`);
    const uploadTask = fileRef.put(file, metadata);
    
    return uploadTask;
}

// Add material to Firestore
function addMaterialToFirestore(materialData) {
    return db.collection('materials').add(materialData);
}

// Increment download count
function incrementDownloadCount(materialId) {
    return db.collection('materials').doc(materialId).update({
        downloads: firebase.firestore.FieldValue.increment(1)
    });
}

// Get file preview URL
function getFilePreviewURL(filePath) {
    return storage.ref().child(filePath).getDownloadURL();
}