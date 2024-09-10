// const connectToDatabase = require('../Models/dbconnect');
const { ObjectId } = require('mongodb');
const { getFormsCollection, getPricingsCollection, getFormStatusesCollection } = require("../models/forms");

exports.GetForms = async (req, res) => {
  try {
    const formsCollection = await getFormsCollection();
    const pricingsCollection = await getPricingsCollection();

    // Fetch all forms
    const forms = await formsCollection.find({}).toArray();
    
    // Extract price IDs from forms and convert to ObjectId instances
    const priceIds = forms.map(form => new ObjectId(form.price));

    // Fetch all pricing details matching the extracted price IDs
    const pricings = await pricingsCollection.find({
      _id: { $in: priceIds }
    }).toArray();

    // Map pricing details by their _id for quick lookup
    const pricingMap = pricings.reduce((acc, pricing) => {
      acc[pricing._id.toString()] = pricing;
      return acc;
    }, {});

    // Combine form data with pricing details
    const results = forms.map(form => {
      const pricingDetails = pricingMap[form.price];
      
      // Convert pricingDetails from object to array format if needed
      const formattedPricingDetails = pricingDetails ? {
        caste: pricingDetails.castes || [],
        charge: pricingDetails.charges || []
      } : { caste: [], charge: [] };

      return {
        ...form,
        pricingDetails: formattedPricingDetails
      };
    });

    res.send(results);
  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).send('Error fetching data');
  }
}

exports.GetBeforePayForms = async (req, res) => {
    const { id } = req.params;
    try {
      const formsCollection = await getFormsCollection();
      const pricingsCollection = await getPricingsCollection();
  
      // Fetch the form based on the provided ID
      const form = await formsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!form) {
        return res.status(404).send('Form not found');
      }
  
      // Fetch the pricing details using the price ID from the form
      const pricingDetails = await pricingsCollection.findOne({ _id: new ObjectId(form.price) });
  
      // Convert pricingDetails from object to array format if needed
      const formattedPricingDetails = pricingDetails ? {
        caste: pricingDetails.castes || [],
        charge: pricingDetails.charges || []
      } : { caste: [], charge: [] };
  
      // Combine form data with pricing details
      const result = {
        ...form,
        pricingDetails: formattedPricingDetails
      };
  
      res.send(result);
    } catch (error) {
      console.error('Error fetching form data', error);
      res.status(500).send('Error fetching form data');
    }
  }
  

exports.GetUserFormStatus = async(req, res)=>{
  const { formId, userId } = req.params;
  
  try {
    const collection = await getFormStatusesCollection();
    const formStatus = await collection.findOne({ formId, userId });
    
    if (!formStatus) {
      return res.status(404).send('Form status not found');
    }

    res.send(formStatus);
  } catch (error) {
    console.error('Error fetching form status:', error);
    res.status(500).send('Error fetching form status');
  }
}

exports.UpdateFormStatus = async(req, res)=>{
  const { formId, userId, status } = req.body;

  try {
    const collection = await getFormStatusesCollection();

    // Check if a form status entry already exists for the user and form ID
    const formStatus = await collection.findOne({ formId: formId, userId: userId });

    if (!formStatus) {
      // If not, create a new entry
      await collection.insertOne({
        formId: formId,
        userId: userId,
        status,
      });
    } else {
      // Update the existing form status entry with the new status
      await collection.updateOne(
        { formId: formId, userId: userId },
        { $set: { status } }
      );
    }

    res.status(200).send('Form status created/updated successfully');
  } catch (error) {
    console.error('Error creating/updating form status:', error);
    res.status(500).send('Error creating/updating form status');
  }
}