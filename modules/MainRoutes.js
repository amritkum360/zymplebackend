const express = require('express');

const FormsControllers = require('./Controllers/FormControllers');
const UsersControllers = require('./Controllers/UsersControllers');
const DocsControllers = require('./Controllers/DocumentControllers')


const formsRoutes = express.Router();
const usersRoutes = express.Router();
const DocsRoutes = express.Router()

// Define routes for forms
formsRoutes
    .get('/printforms', FormsControllers.GetForms)
    .get('/forms/:id', FormsControllers.GetBeforePayForms);

// Define routes for users
usersRoutes
    .get('/formstatus/:formId/:userId', FormsControllers.GetUserFormStatus)
    .post('/formstatus', FormsControllers.UpdateFormStatus)
    .post('/login', UsersControllers.UserLogin)
    // .post('/save-name', UsersControllers.saveUserName); 

DocsRoutes
    .get('/uploadedDocs/:formId/:userId', DocsControllers.GetUploadedDocs)
    .get('/uploadedDocsstatus/:formId/:userId', DocsControllers.GetUploadedDocsStatus)
    .get('/docsrequired/:id', DocsControllers.DocumentsRequired)


module.exports = { formsRoutes, usersRoutes, DocsRoutes };
