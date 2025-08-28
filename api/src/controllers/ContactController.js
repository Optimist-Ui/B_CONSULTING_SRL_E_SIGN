// controllers/ContactController.js
const { successResponse, errorResponse } = require("../utils/responseHandler");

class ContactController {
  constructor({ contactService }) {
    this.contactService = contactService;
  }

  async createContact(req, res) {
    try {
      // req.user is attached by your authentication middleware
      const userId = req.user.id; 
      const contact = await this.contactService.createContact(userId, req.body);
      successResponse(res, contact, "Contact created successfully", 201);
    } catch (error) {
      errorResponse(res, error, "Failed to create contact");
    }
  }

  async getContacts(req, res) {
    try {
      const userId = req.user.id;
      const { search } = req.query; // e.g., /api/contacts?search=john
      const contacts = await this.contactService.getContacts(userId, search);
      successResponse(res, contacts, "Contacts fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch contacts");
    }
  }
  
  async getContactById(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      const contact = await this.contactService.getContactById(userId, contactId);
      successResponse(res, contact, "Contact fetched successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to fetch contact");
    }
  }


  async updateContact(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      const contact = await this.contactService.updateContact(userId, contactId, req.body);
      successResponse(res, contact, "Contact updated successfully");
    } catch (error) {
      errorResponse(res, error, "Failed to update contact");
    }
  }

  async deleteContact(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      const result = await this.contactService.deleteContact(userId, contactId);
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error, "Failed to delete contact");
    }
  }
}

module.exports = ContactController;