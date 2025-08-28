// services/ContactService.js

class ContactService {
  constructor({ Contact, User }) {
    this.Contact = Contact;
    this.User = User;
  }

  async createContact(userId, contactData) {
    const { email, customFields, ...standardFields } = contactData;

    const existingContact = await this.Contact.findOne({
      ownerId: userId,
      email,
    });
    if (existingContact) {
      throw new Error("A contact with this email already exists.");
    }

    const newContact = await this.Contact.create({
      ...standardFields,
      email,
      customFields: customFields || {}, // Ensure customFields is an object, not undefined
      ownerId: userId,
    });
    return newContact;
  }

  /**
   * Get all contacts for a user, with optional search.
   * @param {string} userId - The ID of the user.
   * @param {string} searchQuery - A search string to filter by name or email.
   * @returns {Promise<Array<object>>} - A list of the user's contacts.
   */
  async getContacts(userId, searchQuery) {
    const query = { ownerId: userId };

    if (searchQuery) {
      query.$or = [
        { firstName: { $regex: searchQuery, $options: "i" } },
        { lastName: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const contacts = await this.Contact.find(query).sort({
      firstName: 1,
      lastName: 1,
    });
    return contacts;
  }

  /**
   * Get a single contact by its ID.
   * @param {string} userId - The ID of the user requesting the contact.
   * @param {string} contactId - The ID of the contact.
   * @returns {Promise<object>} - The contact document.
   */
  async getContactById(userId, contactId) {
    const contact = await this.Contact.findOne({
      _id: contactId,
      ownerId: userId,
    });
    if (!contact) {
      throw new Error(
        "Contact not found or you do not have permission to view it."
      );
    }
    return contact;
  }

  async updateContact(userId, contactId, updateData) {
    // Check for email uniqueness if it's being changed
    if (updateData.email) {
      const existingContact = await this.Contact.findOne({
        ownerId: userId,
        email: updateData.email,
      });
      if (existingContact && existingContact._id.toString() !== contactId) {
        throw new Error("This email is already used by another contact.");
      }
    }

    const contact = await this.Contact.findOneAndUpdate(
      { _id: contactId, ownerId: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new Error(
        "Contact not found or you do not have permission to edit it."
      );
    }
    return contact;
  }

  /**
   * Delete a contact.
   * @param {string} userId - The ID of the user owning the contact.
   * @param {string} contactId - The ID of the contact to delete.
   * @returns {Promise<{message: string}>} - A confirmation message.
   */
  async deleteContact(userId, contactId) {
    const result = await this.Contact.deleteOne({
      _id: contactId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error(
        "Contact not found or you do not have permission to delete it."
      );
    }
    return { message: "Contact deleted successfully." };
  }
}

module.exports = ContactService;
