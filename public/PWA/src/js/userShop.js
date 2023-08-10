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
    signOut 
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
const functions = getFunctions(app, 'us-central1');
const db = getFirestore(app);
const storage = getStorage(app);

const showOwnerButtons = () => {
  document.querySelector('.change-profile-btn').classList.remove("button--hidden");
  document.querySelector('.change-btn').classList.remove("button--hidden");
}

const hideOwnerButtons = () => {
  document.querySelector('.change-profile-btn').classList.add("button--hidden");
  document.querySelector('.change-btn').classList.add("button--hidden");
}

const checkUserState = async () => {
    try {
        onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            onSnapshot(userRef, (doc1) => {
            const userData = doc1.data();
            if (userData && userData.isOwner) {
                document.querySelector('.profileName').textContent = userData.shopName;
                document.querySelector('.profileEmail').textContent = userData.email;
                document.querySelector('.profileLocation').textContent = userData.location;
                document.querySelector('.profileAbout').textContent = userData.aboutShop;
                document.querySelector('.profileImage').src = userData.pfp || '/public/PWA/Images/profile-user.png';
                showOwnerButtons();

                // Handle social media links for the owner
                document.querySelector('.bx.bxl-instagram-alt').href = userData.instagram;
                document.querySelector('.bx.bxl-facebook-circle').href = userData.facebook;
                document.querySelector('.bx.bxl-twitter').href = userData.twitter;
                document.querySelector('.bx.bxl-pinterest').href = userData.pinterest;
                
            } else if (userData && userData.code) {
                const shopUID = userData.code;
                const shopRef = doc(db, 'users', shopUID);
                onSnapshot(shopRef, (doc2) => {
                const shopData = doc2.data();
                if (shopData) {
                    // Display visitor's shop data
                    document.querySelector('.profileName').textContent = shopData.shopName;
                    document.querySelector('.profileEmail').textContent = shopData.email;
                    document.querySelector('.profileLocation').textContent = shopData.location;
                    document.querySelector('.profileAbout').textContent = shopData.aboutShop;
                    document.querySelector('.profileImage').src = shopData.pfp;
                    hideOwnerButtons();

                    // Handle social media links for the visitor's shop
                    document.querySelector('.bx.bxl-instagram-alt').href = shopData.instagram;
                    document.querySelector('.bx.bxl-facebook-circle').href = shopData.facebook;
                    document.querySelector('.bx.bxl-twitter').href = shopData.twitter;
                    document.querySelector('.bx.bxl-pinterest').href = shopData.pinterest;

                } else {
                    console.error('Shop data not found.');
                }
                });
            } else {
                console.error('User data not found or missing required fields.');
            }
            });

        } else {
            window.location.href = "index.html";
        }
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }
};
 
checkUserState();

const logOutButton = document.querySelector(".logout-btn");

logOutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('signed out');
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error('Sign out error:', error);
        });
});

// Profile

const changeProfileButton = document.querySelector('.change-profile-btn');
const changeProfile = document.querySelector('.change-shop-profile');
const closeMyProfile = document.querySelector('.save-button');
const xclose = document.querySelector('#close');
const myShop = document.querySelector(".shop");

const changeProfilePFP = async () => {
    onAuthStateChanged(auth, async (user) => {
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (doc1) => {
            const userData = doc1.data();
            document.querySelector('.input-profile-image .profile-image').src = userData.pfp;
        });
    });
}

var profilePictureInput = document.querySelector('#profile-picture-input');
var profileImage = document.querySelector('.input-profile-image .profile-image');

profilePictureInput.onchange = function() {
    if (profilePictureInput.files && profilePictureInput.files[0]) {
        profileImage.src = URL.createObjectURL(profilePictureInput.files[0]);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Construct the path
                const filePath = 'users/' + user.uid + '/Profile Images' + '/image.png';

                // Create a reference using the path
                var imageRef = ref(storage, filePath);

                // Upload the file
                var uploadTask = uploadBytesResumable(imageRef, profilePictureInput.files[0]);

                uploadTask.on('state_changed',
                    function (snapshot) {
                        // Optional: Track progress
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                    },
                    function (error) {
                        console.error('Error uploading image:', error);
                    },
                    async function () {
                        // Get the download URL
                        getDownloadURL(imageRef).then(async function (downloadURL) {
                            console.log('File available at', downloadURL);

                            // Update the Firestore document with the new image URL
                            const userRef = doc(db, 'users', user.uid);
                            try {
                                await updateDoc(userRef, {
                                    pfp: downloadURL
                                });
                                console.log("Profile picture URL updated in Firestore!");
                            } catch (error) {
                                console.error("Error updating document: ", error);
                            }
                        }).catch(error => {
                            console.error('Error getting download URL:', error);
                        });
                    }
                );
            }
        });
    }
}

changeProfileButton.onclick = () => {
    changeProfile.classList.add("active");
    myShop.classList.add("form--hidden");
    changeProfilePFP();
};

closeMyProfile.onclick = () => {
    changeProfile.classList.remove("active");
    myShop.classList.remove("form--hidden");
};

xclose.onclick = () => {
    changeProfile.classList.remove("active");
    myShop.classList.remove("form--hidden");
};

document.querySelector('.save-button').addEventListener('click', async function() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get the values from the form
            var shopName = document.querySelector('#nameTitle').value;
            var emailAddress = document.querySelector('#emailTitle').value;
            var location = document.querySelector('#locationTitle').value;
            var about = document.querySelector('#aboutTitle').value;
            var instagramUrl = document.querySelector('#instaTitle').value;
            var facebookUrl = document.querySelector('#faceTitle').value;
            var twitterUrl = document.querySelector('#twitTitle').value;
            var pinterestUrl = document.querySelector('#pinTitle').value;

            const userRef = doc(db, 'users', user.uid);

            profilePictureInput.onchange = function() {
                profileImage.src = URL.createObjectURL(profilePictureInput.files[0]);
            }

            // Create a data object
            var data = {};

            // Check each field and add to the data object if not blank
            if(profileImage.src) data.pfp = profileImage.src;
            if(shopName) data.shopName = shopName;
            if(emailAddress) data.email = emailAddress;
            if(location) data.location = location;
            if(about) data.aboutShop = about;
            if(instagramUrl) data.instagram = instagramUrl;
            if(facebookUrl) data.facebook = facebookUrl;
            if(twitterUrl) data.twitter = twitterUrl;
            if(pinterestUrl) data.pinterest = pinterestUrl;

            // If data object is empty, return
            if(Object.keys(data).length === 0){
                console.log("No changes made as all input fields are blank.");
                return;
            }

            // Set the data
            try {
                await updateDoc(userRef, data);
                console.log("Document successfully updated!");

                // Reset the input fields after saving
                profilePictureInput.value = '';
                document.querySelector('#nameTitle').value = '';
                document.querySelector('#emailTitle').value = '';
                document.querySelector('#locationTitle').value = '';
                document.querySelector('#aboutTitle').value = '';
                document.querySelector('#instaTitle').value = '';
                document.querySelector('#faceTitle').value = '';
                document.querySelector('#twitTitle').value = '';
                document.querySelector('#pinTitle').value = '';
            } catch (error) {
                console.error("Error updating document: ", error);
            }
        } else {
            // User is signed out
            window.location.href = "index.html";
        }
    });
    checkUserState();
});

// section

let changeButton = document.querySelector('.change-btn');
let changeShop = document.querySelector('.input-box');
let closeMyShop = document.querySelector('#close-changes');

// open
changeButton.onclick = () => {
    changeShop.classList.add("active");
};

// close
closeMyShop.onclick = () => {
    changeShop.classList.remove("active");
};

let selectedCategory = 'Foods'; // Default category

const navLinks = document.querySelectorAll('.nav__link');

// Set the default category to active
navLinks.forEach(link => {
    if (link.innerText === selectedCategory) {
        link.classList.add('nav__link--active');
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        // Remove the active class from all nav links
        navLinks.forEach(innerLink => {
            innerLink.classList.remove('nav__link--active');
        });

        // Add the active class to the clicked link
        this.classList.add('nav__link--active');

        const category = this.innerText; // Fetching the category name from the link text
        selectedCategory = category; // Update the selectedCategory variable
        updateShopProducts(category);
    });
});

// add product box
const addProductBox = document.querySelector('.input-product-box')

// Add Product Form
document.querySelector('.input-product-box').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = this; // Capture the reference to the form

    onAuthStateChanged(auth, async function(user) {
        if (user) {
            const imageFile = document.getElementById('productImage').files[0];

            if (!imageFile) {
                console.error("No file selected");
                return;
            }

            const uniqueName = `${Date.now()}-${imageFile.name}`;
            const filePath = 'users/' + user.uid + '/Product Images/' + uniqueName;
            const imageRef = ref(storage, filePath);

            try {
                const uploadTask = uploadBytesResumable(imageRef, imageFile);
                await uploadTask;
                const downloadURL = await getDownloadURL(imageRef);

                const addProduct = httpsCallable(functions, 'addProduct');
                await addProduct({
                    name: form.name.value,
                    price: form.price.value,
                    src: downloadURL,
                    category: form.category.value, // Fetching the category value from the dropdown
                });
                

                console.log('Product added successfully');
                document.getElementById('errorMessage').innerText = "";
                form.reset(); // Use form reference to reset the form
                document.querySelector('[name="image"]').src = "PWA/Images/coke.png";
            } catch (error) {
                console.error("Error uploading image:", error);
                document.getElementById('errorMessage').innerText = "Error uploading image: " + error.message;
            }
        } else {
            // User is not authenticated
            window.location.href = "index.html";
        }
    });
});

// Image Preview
document.getElementById('productImage').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('[name="image"]').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Shop Products
const productsContainer = document.getElementById('productsContainer');

function updateShopProducts(category = null) {
    onAuthStateChanged(auth, async function(user) {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            onSnapshot(userRef, async (doc1) => {
                const userData = doc1.data();
                let targetUID;  // This will store the UID of the products we want to fetch

                if (userData && userData.isOwner) {
                    targetUID = user.uid;
                } else if (userData && userData.code) {
                    targetUID = userData.code;
                } else {
                    console.error('User data not found or missing required fields.');
                    return;
                }

                const productsRef = collection(db, 'users', targetUID, 'Products');
                
                let finalQuery;
                if (category) {
                    finalQuery = query(productsRef, where("category", "==", category));
                } else {
                    finalQuery = productsRef;
                }

                onSnapshot(finalQuery, function(snapshot) {
                    productsContainer.innerHTML = ''; // Clear previous content
                    snapshot.forEach(function(doc) {
                        const productData = doc.data();
                        const productElement = document.createElement('div');
                        productElement.classList.add('product-box'); // Add class for styling
                        productElement.innerHTML = `
                            <img src="${productData.src}" alt="" class="product-image">
                            <h2 class="product-title">${productData.name}</h2>
                            <span class="price">R ${productData.price}</span>
                            <i class='bx bxs-shopping-bags add-cart'></i>
                        `;
                        productsContainer.appendChild(productElement);
                    });
                });
            });

        } else {
            // User is signed out
            window.location.href = "index.html";
        }
    });
}

updateShopProducts(selectedCategory); // Initial call

// Cart

let cartIcon = document.querySelector('#cart-icon');
let cart = document.querySelector('.cart');
let closeCart = document.querySelector('#close-cart');

// Cart open
cartIcon.onclick = () => {
    cart.classList.add("active");
};

// Cart close
closeCart.onclick = () => {
    cart.classList.remove("active");
};

// Invite

let sendIcon = document.querySelector("#send-icon");
let invite = document.querySelector('.invitation');
let closeInvite = document.querySelector('#close-invite');
const myprofile = document.querySelector(".shop-profile");

// Invite open
sendIcon.onclick = () => {
    invite.classList.remove("form--hidden");
    myShop.classList.add("form--hidden");
    myprofile.classList.add("form--hidden");
};

// Invite close
closeInvite.onclick = () => {
    invite.classList.add("form--hidden");
    myShop.classList.remove("form--hidden");
    myprofile.classList.remove("form--hidden");
};

const inviteInput = document.querySelector("#invite");
const inviteButton = document.querySelector("#inviteButton");

inviteButton.addEventListener("click", (e) => {
    const user = auth.currentUser;
    if(user) {
        const inviteCode = inviteInput.value;
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
        });
    };
});

onAuthStateChanged(auth, user => {
    const userRef = doc(db, 'users', user.uid);
    onSnapshot(userRef, (doc1) => {
        const userData = doc1.data();
        if (!userData.isOwner && userData.code === "") {
            invite.classList.remove("form--hidden");
            myShop.classList.add("form--hidden");
            myprofile.classList.add("form--hidden");
        }
        else {
            invite.classList.add("form--hidden");
            myShop.classList.remove("form--hidden");
            myprofile.classList.remove("form--hidden");
        }
    });
});

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

// Cart Working JS

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

//Making Function
function ready() {
    // Remove Items from cart
    var removeCartButtons = document.getElementsByClassName('cart-remove')
    console.log(removeCartButtons)
    for (var i = 0; i < removeCartButtons.length; i++) {
        var button = removeCartButtons[i];
        button.addEventListener('click', removeCartItem);
    }
    // Quantity Changes
    var quantityInputs = document.getElementsByClassName("cart-quantity");
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i];
        input.addEventListener("change", quantityChanged)
    }
    // Add to Cart (using event delegation)
    document.addEventListener("click", function(event) {
        if (event.target.classList.contains("add-cart")) {
            const productBox = event.target.closest(".product-box");
            if (productBox) {
                addCartClicked(event, productBox);
            }
        }
    });
    // Buy Button Work
    document.getElementsByClassName("btn-buy")[0]
    .addEventListener("click", buyButtonClicked);
    updateTotal();
}

// Update Total
function updateTotal() {
    var cartBoxes = document.getElementsByClassName('cart-box');
    var total = 0;

    for (var i = 0; i < cartBoxes.length; i++) {
        var cartBox = cartBoxes[i];
        var priceElement = cartBox.getElementsByClassName('cart-price')[0];
        var quantityElement = cartBox.getElementsByClassName('cart-quantity')[0];
        var price = parseFloat(priceElement.innerText.replace("R", ""));
        var quantity = quantityElement.value;
        total += price * quantity;
    }

    // If price contains some cents
    total = Math.round(total * 100) / 100;
    
    document.getElementsByClassName("total-price")[0].innerText = "R" + total;
}

// Buy Button
function buyButtonClicked() {
    alert("Your order is placed...");
    var cartContent = document.getElementsByClassName("cart-content")[0];
    while (cartContent.hasChildNodes()) {
        cartContent.removeChild(cartContent.firstChild);
    }
    updateTotal();
}

// Remove items from cart
function removeCartItem (event) {
    var buttonClicked = event.target;
    buttonClicked.parentElement.remove();
    updateTotal();
}

// Quantity Changes
function quantityChanged(event) {
    var input = event.target;
    if (isNaN(input.value) || input.value <= 0 || input.value === "") {
        input.value = 1;
    }
    updateTotal();
}

function findClosestProductBox(element) {
    while (element && !element.classList.contains('product-box')) {
        element = element.parentElement;
    }
    return element;
}

function addCartClicked(event, productBox) {
    var title = productBox.querySelector(".product-title").innerText;
    var price = productBox.querySelector(".price").innerText;
    var productImg = productBox.querySelector(".product-image").src;

    addProductToCart(title, price, productImg);
    updateTotal();
}

function addProductToCart(title, price, productImg) {
    var cartShopBox = document.createElement("div");
    cartShopBox.classList.add('cart-box');
    var cartItems = document.getElementsByClassName("cart-content")[0];
    var cartItemsNames = cartItems.getElementsByClassName("cart-product-title");
    for (var i = 0; i < cartItemsNames.length; i++) {
        if (cartItemsNames[i].innerText == title) {
            alert("You have already added this item to cart...");
            return; // Return early if the item is already in the cart
        }
    }

    var cartBoxContent = `
        <img src="${productImg}" alt="" class="cart-img">
        <div class="detail-box">
            <div class="cart-product-title">${title}</div>
            <div class="cart-price">${price}</div>
            <input type="number" class="cart-quantity" value="1"> <!-- Set default value to 1 -->
        </div>
        <!-- Remove Cart -->
        <i class='bx bxs-trash' id="cart-remove"></i>`;
    
    cartShopBox.innerHTML = cartBoxContent;
    cartItems.append(cartShopBox);
    cartShopBox.getElementsByClassName("cart-remove")[0]
        .addEventListener("click", removeCartItem);
    cartShopBox.getElementsByClassName("cart-quantity")[0]
        .addEventListener("change", quantityChanged);

    updateTotal(); // Update the total after adding the product
}


const yoco = new window.YocoSDK({
    publicKey: 'pk_test_99bf83e5R4nVGD83f054'
});  

document.getElementById('btn-buy').addEventListener('click', function() {
  yoco.showCheckout({
    amountInCents: 10000, // for ZAR 100.00
    currency: 'ZAR',
    name: 'Your Store Name',
    description: 'Order #12345',
    callback: function(result) {
        if (result.error) {
            console.error('Payment error:', result.error);
            return;
        }
            
        const processPayment = httpsCallable(functions, 'processPayment');
        const token = result.token; // Replace with the token from Yoco's JS SDK
        const amount = 10000; // Replace with the desired amount in cents

        processPayment({ token: token, amount: amount })
        .then(result => {
            console.log('Payment successful:', result.data);
        })
        .catch(error => {
            console.error('Payment error:', error);
        });
    }
  });
});
