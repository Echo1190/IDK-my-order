const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require("server/idk-my-order-firebase-adminsdk-tfgrn-75bc60f782.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://idk-my-order-default-rtdb.europe-west1.firebasedatabase.app",
});

// Define your API routes here
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  admin
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      res.status(200).json({ message: "Login successful", user: userCredential.user });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

// Add more routes for sign-up, log-out, and other functionalities as needed

// Start the server
const port = 5000; // Choose any port number you like
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
