const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { getFormsCollection, getDocumentsCollection, getFormStatusesCollection, getRequestsCollection, getPaidsCollection, getcatwiseformCollection } = require('./modules/models/forms');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const { formsRoutes, usersRoutes, DocsRoutes } = require('./modules/MainRoutes');

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use('/api/forms', formsRoutes)
app.use('/api/auth', usersRoutes)
app.use('/api/status', usersRoutes)
app.use('/api/docs', DocsRoutes)


// Middleware to log IP address on root route
app.get("/", function (req, res) {
  console.log(req.socket.remoteAddress);
  console.log(req.ip);
  res.send("Your IP is: " + req.ip);
});

app.post('/myorders', async (req, res) => {
  try {
    const { userid } = req.body;
    console.log(userid);

    // Fetch the user's orders
    const paidCollection = await getPaidsCollection(); // Ensure this returns the collection
    const myforms = await paidCollection.find({ user: userid }).toArray();

    // If no orders found
    if (!myforms.length) {
      return res.status(404).json({ message: 'No forms found for this user.' });
    }

    // Extract form IDs from the orders
    const formIds = myforms.map(order => new ObjectId(order.formId));

    // Fetch all forms that match the form IDs
    const formCollection = await getFormsCollection(); // Ensure this returns the collection
    const forms = await formCollection.find({ _id: { $in: formIds } }).toArray();

    // Send the forms data as the response
    res.json(forms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching forms.' });
  }
});



// Endpoint to handle payment processing
app.post('/api/paidamount', async (req, res) => {
  const { formId, user, caste, paidAmount } = req.body;

  if (!formId || !user || !caste || !paidAmount) {
    console.error('Missing required fields:', { formId, user, caste, paidAmount });
    return res.status(400).send('Missing required fields');
  }

  try {
    const collection = await getPaidsCollection();

    const paymentData = {
      formId,
      user,
      caste,
      paidAmount,
      date: new Date(),
    };

    const result = await collection.insertOne(paymentData);

    if (result.insertedId) {
      console.log('Payment recorded successfully:', paymentData);
      res.status(200).send('Payment recorded successfully');
    } else {
      console.error('Failed to insert payment data:', paymentData);
      res.status(500).send('Failed to record payment');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).send('Error processing payment');
  }
});


// Endpoint to check if payment has been made
app.get('/api/paidamount', async (req, res) => {
  const { formId, user } = req.query;

  if (!formId || !user) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    const collection = await getPaidsCollection();
    const payments = await collection.find({ formId, user }).toArray();

    if (payments.length > 0) {
      res.status(200).json(payments);
    } else {
      res.status(404).send('No payment record found');
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).send('Error checking payment status');
  }
});




// Endpoint to fetch document requirements by form ID
app.get('/docsrequired/:id', async (req, res) => {
  const id = req.params.id; // Get ID from request params
  try {
    const collection = await getFormsCollection();

    // Fetch specific document requirements based on ID
    const projection = {
      _id: 0,
      formname: 1,
      requireddocs: 1,
    };

    const docsRequired = await collection.findOne({ _id: new ObjectId(id) }, { projection }); // Use new ObjectId(id)
    if (!docsRequired) {
      return res.status(404).send('Document requirements not found for the provided ID');
    }

    res.send(docsRequired.requireddocs);
  } catch (error) {
    console.error('Error fetching document requirements', error);
    res.status(500).send('Error fetching document requirements');
  }
});

// Route to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  const { doc, formId, userId } = req.body; // Make sure to get formId and userId from the request body
  const filePath = req.file.path;

  try {
    const collection = await getDocumentsCollection();
    
    // Check if a document entry exists for the user and form ID
    let documentEntry = await collection.findOne({ formid: formId, user: userId });
    
    if (!documentEntry) {
      // If not, create a new entry
      const newDocument = {
        formid: formId,
        user: userId,
      };
      await collection.insertOne(newDocument);
      documentEntry = newDocument;
    }

    // Update the document entry with the uploaded file URL
    const updateResult = await collection.updateOne(
      { formid: formId, user: userId },
      { $set: { [doc]: filePath } }
    );

    if (updateResult.modifiedCount === 1) {
      res.status(200).send('File uploaded successfully');
    } else {
      res.status(500).send('Failed to update document status');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Search endpoint to search forms by title or description
app.get('/search', async (req, res) => {
  const { query } = req.query; // Get query parameter from the request

  console.log(query)
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  try {
    const collection = await getFormsCollection();

    // Perform a text search on the title and description fields
    const results = await collection.find({
      $or: [
        { formname: { $regex: query, $options: 'i' } }, // Case-insensitive search
        { description: { $regex: query, $options: 'i' } }
      ]
    }).toArray();

    res.send(results);
  } catch (error) {
    console.error('Error searching forms', error);
    res.status(500).send('Error searching forms');
  }
});

// Search endpoint to search forms by title or description
app.get('/cat/exams', async (req, res) => {
    //const { query } = req.query; // Get query parameter from the request

  

    try {
        const collection = await getcatwiseformCollection();

        // Perform a text search on the title and description fields
        const results = await collection.find({"category": "exam"}).toArray();

        res.send(results);
    } catch (error) {
        console.error('Error searching forms', error);
        res.status(500).send('Error searching forms');
    }
});




// Listen on all network interfaces (0.0.0.0) on port 3003
app.listen(3003, '0.0.0.0', () => {
  console.log('Server is running on port 3003');
});
