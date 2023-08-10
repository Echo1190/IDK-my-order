if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                // Service worker registration was successful
                console.log('Service worker registered:', registration);
            })
            .catch(error => {
                // Service worker registration failed
                console.error('Service worker registration failed:', error);
            });
    });
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,  
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
    getFirestore, collection, 
    doc, getDoc, onSnapshot,
    query, where, updateDoc,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { 
    getFunctions, httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js";
import { 
    getStorage, ref, 
    uploadBytesResumable, 
    getDownloadURL, 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";



const firebaseConfig = {
  apiKey: "AIzaSyCmC2GvtljTybk0IoDRDSuc6mqi7KcgjFc",
  authDomain: "idk-my-order-1bc02.firebaseapp.com",
  projectId: "idk-my-order-1bc02",
  storageBucket: "idk-my-order-1bc02.appspot.com",
  messagingSenderId: "651331036753",
  appId: "1:651331036753:web:b177e760723b6eda947a70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Initialise Firestore
const db = getFirestore(app);

const createAccountForm = document.querySelector("#createAccount");
const loginForm = document.querySelector("#login");
const popUp = document.querySelector("#pop-up");
const invite = document.querySelector("#invite");
const inviteButton = document.querySelector("#inviteButton");
const signUpButton = document.querySelector("#signUpButton");
const logInButton = document.querySelector("#logInButton");
const container = document.querySelector(".container");

createAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const signUpEmail = document.querySelector("#userEmail").value;
    const signUpPassword = document.querySelector("#userPassword").value;
    const signUpConfirmPassword = document.querySelector("#userConfirmPassword").value;
    resetFormMessage();

    if (signUpPassword !== signUpConfirmPassword) {
        // Passwords don't match, show an error message
        const errorMessage = "Passwords do not match.";
        createAccountForm.querySelector('.form__input-error-message').textContent = errorMessage;
    } else {
        // Passwords match, proceed with account creation
        createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('signed in', user);
                createAccountForm.reset();
                
                window.location.href ="userShop.html";
            })
            .catch((error) => {
                createAccountForm.querySelector('.form__input-error-message').textContent = error.message;
            });
    }
});


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const loginEmail = document.querySelector("#userAuthEmail").value;
    const loginPassword = document.querySelector("#userAuthPassword").value;
    resetFormMessage();

    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
        .then((user) => {
            console.log('logged in', user);
            loginForm.reset();

            window.location.href ="userShop.html";

        })
        .catch((error) => {
            setFormMessage(loginForm, "error", "Invalid username / password");
        });
    });

inviteButton.addEventListener("click", (e) => {
    onAuthStateChanged(auth, user => {
    if(user) {
        const inviteCode = invite.value; // Get the value from the "invite" input field
        const userRef = doc(db, 'users', user.uid);
        resetFormMessage();

        updateDoc(userRef, {
            code: inviteCode,
        })
        .then(() => {
            window.location.href = "userShop.html";
        })
        .catch((error) => {
            console.log(error);
            setFormMessage(popUp, "error", "Error updating user data");
        })};
    });
});

document.getElementById("skip").addEventListener("click", function() {
    window.location.href = "userShop.html";
  });

const checkAuthState = async() => {
    container.classList.add("form--hidden");
    onAuthStateChanged(auth, user => {
        if (user) {
            window.location.href = "userShop.html";
        } 
        else {
            container.classList.remove("form--hidden")
        };    
    });
};

checkAuthState();

function setFormMessage(formElement, type, message) {
    const messageElement = document.querySelector('.form__input-error-message');
    messageElement.textContent = message;
    messageElement.classList.add(`form__input-error-message--${type}`);
    messageElement.classList.remove(`form__input-error-message--hidden`);
}

function resetFormMessage(formElement) {
    const messageElement = document.querySelector('.form__input-error-message');
    messageElement.textContent = '';
    messageElement.classList.remove('form__input-error-message--error');
    messageElement.classList.add('form__input-error-message--hidden');
}

// switch between Login and Sign up
document.addEventListener("DOMContentLoaded", () => {

    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        createAccountForm.classList.remove("form--hidden");
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        e.preventDefault();
        createAccountForm.classList.add("form--hidden");
        loginForm.classList.remove("form--hidden");
    });

    loginForm.addEventListener("button", e => {
        e.preventDefault();

        //perform your AJAX/fetch Login

        setFormMessage(loginForm, "error", "Invalid username / password");
    });

});