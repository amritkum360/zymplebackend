const { ObjectId } = require('mongodb');
const { getFormsCollection, getPricingsCollection, getDocumentsCollection, getFormStatusesCollection } = require("../models/forms");


exports.GetUploadedDocs = async (req, res) => {
    const { formId, userId } = req.params;
    try {
        const collection = await getDocumentsCollection();
        const documentEntry = await collection.findOne({ formid: formId, user: userId });

        if (documentEntry) {
            res.send(documentEntry);
        } else {
            res.status(404).send('No documents found for the provided form and user ID');
        }
    } catch (error) {
        console.error('Error fetching uploaded documents:', error);
        res.status(500).send('Error fetching uploaded documents');
    }
}


//to check and navigate the user to the form status 
exports.GetUploadedDocsStatus = async (req, res) => {
    const { formId, userId } = req.params;
    try {
        // const collection = await getDocumentsCollection();
        const collection = await getFormStatusesCollection();

        const documentEntry = await collection.findOne({ formId: formId, userId: userId });

        if (documentEntry && ["Document Uploaded", "Form Filling Started", "Form Filled", "Sent"].includes(documentEntry.status)) {
            res.send(documentEntry.status);
        } else {
            res.status(404).send('No documents found for the provided form and user ID');
        }
    } catch (error) {
        console.error('Error fetching uploaded documents:', error);
        res.status(500).send('Error fetching uploaded documents');
    }
};


exports.UploadDocs = async(req, res) =>{

}

exports.DocumentsRequired = async(req, res)=>{
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
}