import React, { useCallback, useRef, useEffect, memo, useMemo, ComponentType, useState } from 'react';
import { PackageField, AssignedUser, FieldRole, ConcreteSignatureMethod } from '../../store/slices/packageSlice';
import { useDraggableResizable } from '../../hooks/use-draggable-resizable';
import AddEditContactModal from '../common/AddEditContactModal';
import { Contact } from '../../store/slices/contactSlice';
import { FaSignature, FaRegCalendarAlt, FaRegListAlt, FaTrash, FaUserPlus } from 'react-icons/fa';
import { BsTextareaResize, BsInputCursorText } from 'react-icons/bs';
import { IoIosCheckboxOutline, IoIosRadioButtonOn } from 'react-icons/io';
import { MdOutlinePeopleAlt } from 'react-icons/md';
import { FiX, FiCheck, FiAlertCircle, FiPlusCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { toast } from 'react-toastify';

const FaSignatureTyped = FaSignature as ComponentType<{ className?: string }>;
const FaRegCalendarAltTyped = FaRegCalendarAlt as ComponentType<{ className?: string }>;
const FaRegListAltTyped = FaRegListAlt as ComponentType<{ className?: string }>;
const FaTrashTyped = FaTrash as ComponentType<{ className?: string }>;
const BsTextareaResizeTyped = BsTextareaResize as ComponentType<{ className?: string }>;
const BsInputCursorTextTyped = BsInputCursorText as ComponentType<{ className?: string }>;
const IoIosRadioButtonOnTyped = IoIosRadioButtonOn as ComponentType<{ className?: string }>;
const IoIosCheckboxOutlineTyped = IoIosCheckboxOutline as ComponentType<{ className?: string }>;
const MdOutlinePeopleAltTyped = MdOutlinePeopleAlt as ComponentType<{ className?: string }>;
const FaUserPlusTyped = FaUserPlus as ComponentType<{ className?: string }>;
const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiCheckTyped = FiCheck as ComponentType<{ className?: string }>;
const FiAlertCircleTyped = FiAlertCircle as ComponentType<{ className?: string }>;
const FiPlusCircleTyped = FiPlusCircle as ComponentType<{ className?: string }>;

interface PackageFieldRendererProps {
    field: PackageField;
    isSelected: boolean;
    onUpdate: (fieldId: string, updates: Partial<PackageField>) => void;
    onDelete: (fieldId: string) => void;
    onSelect: (fieldId: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    onAssignUser?: (fieldId: string, user: Omit<AssignedUser, 'id'>) => void;
    onRemoveUser?: (fieldId: string, assignmentId: string) => void;
}

const PackageFieldRenderer: React.FC<PackageFieldRendererProps> = ({ field, isSelected, onUpdate, onDelete, onSelect, containerRef, onResizeStart, onResizeEnd, onAssignUser, onRemoveUser }) => {
    const fieldRef = useRef<HTMLDivElement>(null);
    const quickAssignRef = useRef<HTMLDivElement>(null);
    const [showQuickAssign, setShowQuickAssign] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<FieldRole>('Signer');
    const [signatureMethods, setSignatureMethods] = useState<ConcreteSignatureMethod[]>(['Email OTP']);
    const [labelInput, setLabelInput] = useState(field.label);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);

    const { contacts } = useSelector((state: IRootState) => state.contacts);

    // Determine if this is a signature field - signature fields can only have Signer role
    const isSignatureField = field.type === 'signature';

    // Get available roles based on field type
    const availableRoles: FieldRole[] = useMemo(() => {
        if (isSignatureField) {
            return ['Signer']; // Only Signer for signature fields
        }
        return ['FormFiller', 'Approver']; // No Signer for other fields
    }, [isSignatureField]);

    // Check if signature field already has a signer assigned
    const hasSignerAssigned = field.assignedUsers?.some((u) => u.role === 'Signer');

    const initialPosition = useMemo(
        () => ({
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
        }),
        [field.x, field.y, field.width, field.height]
    );

    const { position, handleMouseDown, isDraggingOrResizing, setFieldId } = useDraggableResizable({
        initialPosition,
        onUpdate,
        containerRef,
        snapToGrid: 5,
        onResizeStart,
        onResizeEnd,
    });

    useEffect(() => {
        setFieldId(field.id);
    }, [field.id, setFieldId]);

    // Update label input when field changes
    useEffect(() => {
        setLabelInput(field.label);
    }, [field.label]);

    // Set default role based on field type
    useEffect(() => {
        if (isSignatureField) {
            setSelectedRole('Signer');
        } else {
            setSelectedRole('FormFiller'); // Default to FormFiller for non-signature fields
        }
    }, [isSignatureField]);

    // Close quick assign panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quickAssignRef.current && !quickAssignRef.current.contains(event.target as Node)) {
                setShowQuickAssign(false);
            }
        };

        if (showQuickAssign) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showQuickAssign]);

    const getIconForFieldType = useCallback((type: PackageField['type']) => {
        switch (type) {
            case 'text':
                return <BsInputCursorTextTyped className="text-base" />;
            case 'textarea':
                return <BsTextareaResizeTyped className="text-base" />;
            case 'signature':
                return <FaSignatureTyped className="text-base" />;
            case 'checkbox':
                return <IoIosCheckboxOutlineTyped className="text-lg" />;
            case 'radio':
                return <IoIosRadioButtonOnTyped className="text-lg" />;
            case 'date':
                return <FaRegCalendarAltTyped className="text-base" />;
            case 'dropdown':
                return <FaRegListAltTyped className="text-base" />;
            default:
                return null;
        }
    }, []);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect(field.id);
        },
        [onSelect, field.id]
    );

    const handleQuickAssign = useCallback(() => {
        if (!selectedContactId || !onAssignUser) return;

        // Validation for signature fields
        if (isSignatureField && hasSignerAssigned) {
            toast.error('Signature fields can only have one signer assigned.');
            return;
        }

        const contact = contacts.find((c) => c._id === selectedContactId);
        if (!contact) return;

        const newAssignment: Omit<AssignedUser, 'id'> = {
            contactId: contact._id,
            contactName: `${contact.firstName} ${contact.lastName}`,
            contactEmail: contact.email,
            role: selectedRole,
            ...(selectedRole === 'Signer' && { signatureMethods }),
        };

        onAssignUser(field.id, newAssignment);
        toast.success(`${contact.firstName} ${contact.lastName} assigned as ${selectedRole}`);

        // Reset form
        setSelectedContactId('');
        setShowQuickAssign(false);
        setSignatureMethods(['Email OTP']);
    }, [selectedContactId, selectedRole, signatureMethods, contacts, field.id, onAssignUser, isSignatureField, hasSignerAssigned]);

    const toggleSignatureMethod = (method: ConcreteSignatureMethod) => {
        setSignatureMethods((prev) => {
            if (prev.includes(method)) {
                const newMethods = prev.filter((m) => m !== method);
                return newMethods.length > 0 ? newMethods : prev;
            }
            return [...prev, method];
        });
    };

    const handleLabelUpdate = useCallback(() => {
        if (labelInput.trim() && labelInput !== field.label) {
            onUpdate(field.id, { label: labelInput.trim() });
            toast.success('Label updated');
        }
        setIsEditingLabel(false);
    }, [labelInput, field.label, field.id, onUpdate]);

    const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLabelUpdate();
        } else if (e.key === 'Escape') {
            setLabelInput(field.label);
            setIsEditingLabel(false);
        }
    };

    return (
        <>
            {/* Main Field Box */}
            <div
                ref={fieldRef}
                className={`absolute z-10 flex items-center justify-center rounded-lg transition-all duration-200 ease-out cursor-move ${
                    isSelected
                        ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50/90 to-blue-100/70 dark:from-blue-900/40 dark:to-blue-800/30 shadow-xl ring-2 ring-blue-500/20'
                        : 'border-2 border-dashed border-gray-400/70 bg-white/80 dark:bg-gray-800/60 hover:border-blue-400/80 hover:bg-blue-50/50 hover:shadow-md dark:hover:bg-blue-900/30'
                } ${isDraggingOrResizing ? 'bg-blue-100/90 dark:bg-blue-900/60 opacity-95 scale-[1.02] shadow-2xl' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${position.width}px`,
                    height: `${position.height}px`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                onClick={handleClick}
            >
                {/* Field Content / Icon */}
                <div className={`flex items-center justify-center gap-2 text-xs font-medium transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {getIconForFieldType(field.type)}
                    {field.type === 'text' || field.type === 'textarea' ? (
                        <span className="italic truncate max-w-[140px] font-normal">{field.placeholder || 'Text'}</span>
                    ) : field.type === 'radio' ? (
                        <span className="truncate">Radio</span>
                    ) : field.type === 'dropdown' ? (
                        <span className="truncate">Select</span>
                    ) : (
                        <span className="capitalize">{field.type}</span>
                    )}
                </div>

                {/* Resizing handles */}
                {isSelected && (
                    <>
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize -top-1.5 -left-1.5 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-ns-resize left-1/2 -top-1.5 -translate-x-1/2 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'top')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize -top-1.5 -right-1.5 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-ew-resize -left-1.5 top-1/2 -translate-y-1/2 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'left')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-ew-resize -right-1.5 top-1/2 -translate-y-1/2 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'right')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize -bottom-1.5 -left-1.5 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-ns-resize left-1/2 -bottom-1.5 -translate-x-1/2 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        />
                        <div
                            className="absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize -bottom-1.5 -right-1.5 hover:scale-150 hover:bg-blue-700 transition-all duration-150 shadow-lg"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                        />
                    </>
                )}
            </div>

            {/* Metadata Overlay */}
            {isSelected && (
                <>
                    {/* Label, Required, Delete, and Quick Assign Button */}
                    <div
                        className="absolute z-20 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-lg shadow-xl border border-blue-500/50 backdrop-blur-sm"
                        style={{
                            left: `${position.x}px`,
                            top: `${position.y - 36}px`,
                            maxWidth: `${Math.max(position.width, 200)}px`,
                        }}
                    >
                        {isEditingLabel && field.type !== 'signature' ? (
                            <input
                                type="text"
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                onBlur={handleLabelUpdate}
                                onKeyDown={handleLabelKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-white/20 border border-white/30 rounded px-2 py-0.5 text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 min-w-0"
                                placeholder="Field label"
                                autoFocus
                            />
                        ) : (
                            <span
                                className="truncate flex items-center gap-1 cursor-text hover:text-blue-100 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (field.type !== 'signature') {
                                        setIsEditingLabel(true);
                                    }
                                }}
                                title={field.type === 'signature' ? 'Signature field label cannot be edited' : 'Click to edit label'}
                            >
                                {field.label}
                                {field.required && <span className="text-yellow-300 text-sm font-bold">*</span>}
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Required Toggle Checkbox */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(field.id, { required: !field.required });
                                    toast.success(field.required ? 'Field marked as optional' : 'Field marked as required');
                                }}
                                className={`p-1 rounded-md hover:scale-110 transition-all duration-150 active:scale-95 ${
                                    field.required ? 'bg-yellow-500/80 hover:bg-yellow-600' : 'hover:bg-gray-500/50'
                                }`}
                                title={field.required ? 'Mark as optional' : 'Mark as required'}
                            >
                                <span className="text-base font-bold leading-none">{field.required ? '*' : '○'}</span>
                            </button>
                            {onAssignUser && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSignatureField && hasSignerAssigned) {
                                            toast.info('Signature field already has a signer assigned');
                                        } else {
                                            setShowQuickAssign(!showQuickAssign);
                                        }
                                    }}
                                    className={`p-1 rounded-md hover:scale-110 transition-all duration-150 active:scale-95 ${
                                        isSignatureField && hasSignerAssigned ? 'hover:bg-yellow-500 opacity-60' : 'hover:bg-green-500'
                                    }`}
                                    title={isSignatureField && hasSignerAssigned ? 'Signature field already has a signer' : 'Quick assign user'}
                                >
                                    <FaUserPlusTyped className="w-3 h-3" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(field.id);
                                }}
                                className="p-1 rounded-md hover:bg-red-500 hover:scale-110 transition-all duration-150 active:scale-95"
                                title="Delete field"
                            >
                                <FaTrashTyped className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Assign Panel - High z-index to stay above toolbar */}
                    {showQuickAssign && (
                        <div
                            ref={quickAssignRef}
                            className="absolute z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-500 p-4 min-w-[300px] max-w-[320px]"
                            style={{
                                left: `${Math.max(0, position.x)}px`,
                                top: `${Math.max(10, position.y - 220)}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaUserPlusTyped className="text-blue-600" />
                                    Quick Assign
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowQuickAssign(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <FiXTyped className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Warning for signature field */}
                            {isSignatureField && (
                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-start gap-2">
                                    <FiAlertCircleTyped className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">Signature fields can only have one Signer assigned.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Select Contact</label>
                                    <select
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        value={selectedContactId}
                                        onChange={(e) => setSelectedContactId(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="">Choose a contact...</option>
                                        {contacts.map((contact) => (
                                            <option key={contact._id} value={contact._id}>
                                                {contact.firstName} {contact.lastName} ({contact.email})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowQuickAssign(false); // Close the quick assign panel first
                                            setAddContactModalOpen(true);
                                        }}
                                        className="mt-2 w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600"
                                    >
                                        <FiPlusCircleTyped className="w-3 h-3" />
                                        Add New Contact
                                    </button>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Role</label>
                                    <select
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value as FieldRole)}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={isSignatureField}
                                    >
                                        {availableRoles.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                    {isSignatureField ? (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Signature fields require Signer role</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Signers can only be assigned to signature fields</p>
                                    )}
                                </div>

                                {selectedRole === 'Signer' && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">Authentication Methods</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    checked={signatureMethods.includes('Email OTP')}
                                                    onChange={() => toggleSignatureMethod('Email OTP')}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Email OTP Verification</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-xs cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    checked={signatureMethods.includes('SMS OTP')}
                                                    onChange={() => toggleSignatureMethod('SMS OTP')}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">SMS OTP Verification</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAssign();
                                    }}
                                    disabled={!selectedContactId}
                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <FiCheckTyped className="w-4 h-4" />
                                    Assign to Field
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Assigned Users */}
                    {field.assignedUsers && field.assignedUsers.length > 0 && (
                        <div
                            className="absolute z-20 flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/95 dark:bg-gray-800/95 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700/50"
                            style={{
                                left: `${position.x}px`,
                                top: `${position.y + position.height + 8}px`,
                                maxWidth: `${Math.max(position.width, 220)}px`,
                            }}
                        >
                            {field.assignedUsers.map((assignee) => (
                                <span
                                    key={assignee.id}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-[10px] font-bold whitespace-nowrap shadow-md transition-all hover:scale-105 cursor-pointer group relative ${
                                        assignee.role === 'Signer'
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
                                            : assignee.role === 'Approver'
                                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800'
                                            : assignee.role === 'FormFiller'
                                            ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                                            : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                                    }`}
                                    title={`${assignee.contactName} (${assignee.role})${assignee.signatureMethods ? '\n' + assignee.signatureMethods.join(', ') : ''}`}
                                >
                                    <MdOutlinePeopleAltTyped className="w-3 h-3" />
                                    <span>{assignee.contactName}</span>
                                    {onRemoveUser && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveUser(field.id, assignee.id);
                                            }}
                                            className="transition-opacity ml-1 hover:text-red-300 hover:scale-125"
                                        >
                                            <FiXTyped className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
            {/* Add Contact Modal */}
            <AddEditContactModal
                isOpen={isAddContactModalOpen}
                onClose={() => setAddContactModalOpen(false)}
                onSaveSuccess={(newContact: Contact) => {
                    setSelectedContactId(newContact._id);
                    setAddContactModalOpen(false);
                    toast.success(`${newContact.firstName} ${newContact.lastName} added successfully`);
                }}
            />
        </>
    );
};

export default memo(PackageFieldRenderer);
