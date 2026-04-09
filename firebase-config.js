// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLMERKeQ9AnU4uRc2XRcWja7ZRqi7arNE",
    authDomain: "app-evaluation-candidats.firebaseapp.com",
    projectId: "app-evaluation-candidats",
    storageBucket: "app-evaluation-candidats.firebasestorage.app",
    messagingSenderId: "521001892400",
    appId: "1:521001892400:web:YOUR_APP_ID",
    measurementId: "G-XXXXXXXXXX"
};

// Initialisation de Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialisation de Firestore
const db = firebase.firestore();

// Initialisation de Firebase Storage (si le SDK est chargé)
let storage = null;
if (typeof firebase.storage === "function") {
    storage = firebase.storage();
}

// Initialisation d'Analytics (optionnel)
if (typeof firebase.analytics === "function") {
    firebase.analytics();
}
