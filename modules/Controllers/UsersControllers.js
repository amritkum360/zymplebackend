// const { ObjectId } = require('mongodb');
// const jwt = require('jsonwebtoken');
// const { getUsersCollection } = require("../models/forms");

// const DEMO_OTP = '766726'; // Demo OTP, replace with real OTP logic in production

// exports.UserLogin = async (req, res) => {
//   const { mobileNumber, otp } = req.body; // Expect mobile number and OTP in the request body

//   if (!mobileNumber || !otp) {
//     return res.status(400).json({ error: 'Mobile number and OTP are required' });
//   }

//   if (otp !== DEMO_OTP) {
//     return res.status(401).json({ error: 'Invalid OTP' });
//   }

//   try {
//     const usersCollection = await getUsersCollection(); // Correctly await the function to get the collection

//     if (!usersCollection) {
//       throw new Error('Users collection not found');
//     }

//     // Check if the user already exists
//     let user = await usersCollection.findOne({ mobileNumber });

//     if (!user) {
//       // If the user doesn't exist, create a new user
//       const newUser = {
//         mobileNumber,
//         name: "", // Initialize name as empty
//         // Add additional user fields here if needed
//       };

//       const result = await usersCollection.insertOne(newUser);
//       user = result.insertedId ? { _id: result.insertedId, mobileNumber, name: "" } : null; // Get the newly created user
//     }

//     if (!user) {
//       return res.status(500).json({ error: 'Failed to create or retrieve user' });
//     }

//     // Generate a JWT token
//     const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

//     // Return the token and user data, including the name
//     res.json({ token, name: user.name });
//   } catch (error) {
//     console.error('Error during user login', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getUsersCollection } = require("../models/forms");

// OTPless Login Route
exports.UserLogin = async (req, res) => {
    const { userId, token, phone_number } = req.body; // Add phone_number from OTPless response

    if (!userId || !token || !phone_number) {
        return res.status(400).json({ error: 'User ID, token, and phone number are required' });
    }

    try {
        const usersCollection = await getUsersCollection();

        // Check if the user already exists using OTPless userId
        let user = await usersCollection.findOne({ userId: userId });

        if (!user) {
            // If user doesn't exist, create a new ObjectId and store the user details
            const newObjectId = new ObjectId(); // Generate a new ObjectId
            const newUser = {
                _id: newObjectId, // New ObjectId for MongoDB
                userId: userId,   // OTPless userId as a string
                // Name can be empty or updated later
                mobileNumber: phone_number // Use phone_number for mobileNumber
            };

            const result = await usersCollection.insertOne(newUser);
            user = result.insertedId ? newUser : null;
        }

        if (!user) {
            return res.status(500).json({ error: 'Failed to create or retrieve user' });
        }

        // Generate a JWT token for authentication
        const newToken = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

        res.json({ token: newToken, name: user.name, phone_number: user.phone_number });
    } catch (error) {
        console.error('Error during OTPless login', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
