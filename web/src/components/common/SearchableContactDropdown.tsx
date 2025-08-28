// src/components/common/SearchableContactDropdown.tsx
import React, { useState, useEffect, useRef, useCallback, ComponentType } from 'react';
import { Contact } from '../../store/slices/contactSlice'; // Import your Contact interface
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../../store';
import { fetchContacts } from '../../store/thunk/contactThunks'; // To fetch contacts if needed
import { FiPlusCircle } from 'react-icons/fi';

const FiPlusCircleTyped = FiPlusCircle as ComponentType<{ className?: string }>;

interface SearchableContactDropdownProps {
    contacts: Contact[]; // Full list of contacts
    selectedContact: Contact | null; // The currently selected contact
    onSelectContact: (contact: Contact | null) => void; // Callback when a contact is selected or cleared
    onAddNewContact: () => void;
}

const SearchableContactDropdown: React.FC<SearchableContactDropdownProps> = ({ contacts, selectedContact, onSelectContact, onAddNewContact }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading: contactsLoading, error: contactsError } = useSelector((state: IRootState) => state.contacts);

    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection

    // Fetch contacts when the component mounts if the contacts list is empty in Redux
    useEffect(() => {
        if (contacts.length === 0 && !contactsLoading && !contactsError) {
            dispatch(fetchContacts({})); // Fetch all contacts (or pass a search term if needed)
        }
    }, [dispatch, contacts.length, contactsLoading, contactsError]);

    // Update searchTerm if selectedContact changes from outside (e.g., initial load or parent clearing)
    useEffect(() => {
        if (selectedContact) {
            setSearchTerm(`${selectedContact.firstName} ${selectedContact.lastName}`);
        } else {
            setSearchTerm(''); // Clear search if no contact is selected
        }
    }, [selectedContact]);

    // Filter contacts based on search term
    const filteredContacts = searchTerm
        ? contacts.filter(
              (c) =>
                  c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : contacts; // Show all contacts if no search term

    // Handle selecting a contact from the dropdown list
    const handleSelect = (contact: Contact) => {
        onSelectContact(contact); // Inform parent about selected contact
        setSearchTerm(`${contact.firstName} ${contact.lastName}`); // Display selected contact's name in input
        setIsOpen(false); // Close dropdown
    };

    // Handle clicks outside the dropdown to close it
    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Re-set search term to selected contact's name if it was just selected but clicked outside
                // This prevents search term showing what user typed if they then selected and click outside.
                if (selectedContact && !searchTerm) {
                    // Only reset if empty and a contact IS selected
                    setSearchTerm(`${selectedContact.firstName} ${selectedContact.lastName}`);
                } else if (!selectedContact && searchTerm) {
                    // If there's search term but no contact selected
                    setSearchTerm(''); // Clear the term as nothing was chosen
                }
            }
        },
        [selectedContact, searchTerm]
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <input
                type="text"
                placeholder="Search or add a contact..."
                className="form-input w-full pr-8"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (selectedContact) onSelectContact(null);
                }}
                onFocus={() => setIsOpen(true)}
            />
            {selectedContact && (
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                    onClick={() => {
                        onSelectContact(null);
                        setSearchTerm('');
                    }}
                    title="Clear selected contact"
                >
                    &times;
                </button>
            )}

            {isOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 flex flex-col max-h-60">
                    <div className="overflow-y-auto">
                        {' '}
                        {/* Inner container for scrolling */}
                        {contactsLoading && <div className="p-3 text-center text-gray-500">Loading contacts...</div>}
                        {!contactsLoading && contactsError && <div className="p-3 text-center text-red-500">Error: {contactsError}</div>}
                        {!contactsLoading && !contactsError && filteredContacts.length === 0 && <div className="p-3 text-center text-gray-500">No contacts found.</div>}
                        {filteredContacts.map((contact) => (
                            <div key={contact._id} className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0" onClick={() => handleSelect(contact)}>
                                {/* The 'truncate' class prevents long text from causing horizontal overflow */}
                                <div className="font-semibold text-gray-800 truncate">
                                    {contact.firstName} {contact.lastName}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{contact.email}</div>
                            </div>
                        ))}
                    </div>

                    {/* "Add New" button is kept outside the scrollable area */}
                    <div
                        className="p-3 cursor-pointer hover:bg-gray-100 flex items-center gap-2 text-blue-600 border-t border-gray-200"
                        onClick={() => {
                            setIsOpen(false);
                            onAddNewContact();
                        }}
                    >
                        <FiPlusCircleTyped className="w-5 h-5 flex-shrink-0" />
                        <span>Add New Contact</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableContactDropdown;
