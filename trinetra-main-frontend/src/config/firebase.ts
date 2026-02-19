import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDkiw8zZQLkyMWPywodiAUvpTV31muCYlw",
    authDomain: "trinetra-intel-v3.firebaseapp.com",
    projectId: "trinetra-intel-v3",
    storageBucket: "trinetra-intel-v3.firebasestorage.app",
    messagingSenderId: "522154835039",
    appId: "1:522154835039:web:09bd05ad4a882044746fea"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
