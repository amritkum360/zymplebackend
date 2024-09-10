const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { getUsersCollection } = require("../models/forms");

const DEMO_OTP = '766726'; // Demo OTP, replace with real OTP logic in production

exports.UserLogin = async (req, res) => {
  const { mobileNumber, otp } = req.body; // Expect mobile number and OTP in the request body

  if (!mobileNumber || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required' });
  }

  if (otp !== DEMO_OTP) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  try {
    const usersCollection = await getUsersCollection(); // Correctly await the function to get the collection

    if (!usersCollection) {
      throw new Error('Users collection not found');
    }

    // Check if the user already exists
    let user = await usersCollection.findOne({ mobileNumber });

    if (!user) {
      // If the user doesn't exist, create a new user
      const newUser = {
        mobileNumber,
        name: "", // Initialize name as empty
        // Add additional user fields here if needed
      };

      const result = await usersCollection.insertOne(newUser);
      user = result.insertedId ? { _id: result.insertedId, mobileNumber, name: "" } : null; // Get the newly created user
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create or retrieve user' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    // Return the token and user data, including the name
    res.json({ token, name: user.name });
  } catch (error) {
    console.error('Error during user login', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

