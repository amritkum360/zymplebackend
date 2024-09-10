const { MongoClient, ObjectId } = require('mongodb');
const connectToDatabase = require('./dbconnect');

async function getFormsCollection() {
  const db = await connectToDatabase;
  return db.collection('forms');
}

async function getDocumentsCollection() {
  const db = await connectToDatabase;
  return db.collection('documents');
}

async function getFormStatusesCollection() {
  const db = await connectToDatabase;
  return db.collection('formstatuses');
}

async function getPricingsCollection() {
  const db = await connectToDatabase;
  return db.collection('pricings');
}
async function getUsersCollection() {
  const db = await connectToDatabase;
  return db.collection('users');
}
async function getRequestsCollection() {
  const db = await connectToDatabase;
  return db.collection('requests');
}

async function getPaidsCollection() {
  const db = await connectToDatabase;
  return db.collection('paids');
}async function getcatwiseformCollection() {
  const db = await connectToDatabase;
  return db.collection('catwiseforms');
}

module.exports = { getFormsCollection, getDocumentsCollection, getFormStatusesCollection, getPricingsCollection, getUsersCollection, getRequestsCollection, getPaidsCollection, getcatwiseformCollection };
