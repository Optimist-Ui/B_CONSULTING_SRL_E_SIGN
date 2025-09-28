import React, { useCallback, useRef, useEffect, memo, useMemo, ComponentType } from 'react';
import { PackageField } from '../../store/slices/packageSlice';
import { useDraggableResizable } from '../../hooks/use-draggable-resizable'; // Reusing your existing hook
// Reusing and adding new icons
import { FaSignature, FaRegCalendarAlt, FaRegListAlt, FaTrash } from 'react-icons/fa';
import { BsTextareaResize, BsInputCursorText } from 'react-icons/bs';
import { IoIosCheckboxOutline, IoIosRadioButtonOn } from 'react-icons/io';
import { MdOutlinePeopleAlt } from 'react-icons/md'; // New icon for 'people/assigned'

const FaSignatureTyped = FaSignature as ComponentType<{ className?: string }>;
const FaRegCalendarAltTyped = FaRegCalendarAlt as ComponentType<{ className?: string }>;
const FaRegListAltTyped = FaRegListAlt as ComponentType<{ className?: string }>;
const FaTrashTyped = FaTrash as ComponentType<{ className?: string }>;
const BsTextareaResizeTyped = BsTextareaResize as ComponentType<{ className?: string }>;
const BsInputCursorTextTyped = BsInputCursorText as ComponentType<{ className?: string }>;
const IoIosRadioButtonOnTyped = IoIosRadioButtonOn as ComponentType<{ className?: string }>;
const IoIosCheckboxOutlineTyped = IoIosCheckboxOutline as ComponentType<{ className?: string }>;
const MdOutlinePeopleAltTyped = MdOutlinePeopleAlt as ComponentType<{ className?: string }>;

interface PackageFieldRendererProps {
    field: PackageField;
    isSelected: boolean;
    onUpdate: (fieldId: string, updates: Partial<PackageField>) => void; // Update includes assignedUsers now
    onDelete: (fieldId: string) => void;
    onSelect: (fieldId: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

const PackageFieldRenderer: React.FC<PackageFieldRendererProps> = ({ field, isSelected, onUpdate, onDelete, onSelect, containerRef }) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    
    // Initialize position and dimensions using memoized value to prevent re-renders of the hook
    const initialPosition = useMemo(
        () => ({
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
        }),
        [field.x, field.y, field.width, field.height]
    );

    // Reusing the draggable/resizable hook
    const { position, handleMouseDown, isDraggingOrResizing, setFieldId } = useDraggableResizable({
        initialPosition,
        onUpdate,
        containerRef,
        snapToGrid: 5,
    });

    // Update the hook's internal fieldId whenever the prop changes
    useEffect(() => {
        setFieldId(field.id);
    }, [field.id, setFieldId]);

    // Helper to get an icon based on field type (reused)
    const getIconForFieldType = useCallback((type: PackageField['type']) => {
        switch (type) {
            case 'text':       return <BsInputCursorTextTyped className="text-xl" />;
            case 'textarea':   return <BsTextareaResizeTyped className="text-xl" />;
            case 'signature':  return <FaSignatureTyped className="text-xl" />;
            case 'checkbox':   return <IoIosCheckboxOutlineTyped className="text-2xl" />;
            case 'radio':      return <IoIosRadioButtonOnTyped className="text-2xl" />;
            case 'date':       return <FaRegCalendarAltTyped className="text-xl" />;
            case 'dropdown':   return <FaRegListAltTyped className="text-xl" />;
            default: return null;
        }
    }, []);

    // Prevent propagation of click to the parent container when clicking on the field
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect(field.id);
        },
        [onSelect, field.id]
    );

    return (
        <div
            ref={fieldRef}
            className={`absolute z-10 flex flex-col bg-blue-100/90 border-2 rounded-md transition-all duration-150 ease-in-out cursor-move group ${
                isSelected ? 'border-blue-500 shadow-lg' : 'border-dashed border-gray-400/70 hover:border-blue-400/70'
            } ${isDraggingOrResizing ? 'bg-blue-200/95 opacity-100' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
            onClick={handleClick}
        >
            {/* Field Header: Label & Delete Button */}
            <div className="flex justify-between items-center px-2 py-1 bg-gray-800/10 dark:bg-gray-700/20 text-xs font-medium">
                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {isSelected && ( // Only show delete button when field is selected
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(field.id); }} // Prevent propagation
                        className="p-0.5 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-150"
                        title="Delete field"
                    >
                        <FaTrashTyped className="w-3 h-3" />
                    </button>
                )}
            </div>
            
            {/* Field Content / Icon Representation */}
            <div className="flex-grow flex items-center justify-center text-gray-600 dark:text-gray-300 italic text-sm p-2 overflow-hidden">
                {field.type === 'text' || field.type === 'textarea' ? (
                    <span className="truncate">{field.placeholder || 'Enter text...'}</span>
                ) : field.type === 'radio' ? (
                    <span className="flex items-center gap-1 text-xs">
                        {getIconForFieldType(field.type)} Group: {field.groupId}
                    </span>
                ) : field.type === 'dropdown' ? (
                    <span className="flex items-center gap-1 text-xs">{getIconForFieldType(field.type)} Select</span>
                ) : (
                    getIconForFieldType(field.type)
                )}
            </div>

            {/* Display Assigned Users at the bottom of the field */}
            {field.assignedUsers && field.assignedUsers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 bg-gray-700/50 p-1 rounded-b-md justify-center">
                    {field.assignedUsers.map((assignee) => (
                        
                        <span
                            key={assignee.id}
                            className={`badge text-white px-2 py-0.5 rounded-full text-xs font-semibold 
                                ${
                                    assignee.role === 'Signer' ? 'bg-indigo-600' :
                                    assignee.role === 'Approver' ? 'bg-teal-600' :
                                    assignee.role === 'FormFiller' ? 'bg-orange-600' :
                                    'bg-gray-600' // Default color for Receiver
                                }
                            `}
                            title={`${assignee.contactName} (${assignee.role})`}
                        >
                            <MdOutlinePeopleAltTyped className="inline-block mr-1 -mt-0.5" />
                            {assignee.role} - {assignee.contactName}
                        </span>
                    ))}
                </div>
            )}

            {/* Resizing handles (visible only when selected) */}
            {isSelected && (
                <>
                    <div className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-nwse-resize -top-1.5 -left-1.5" onMouseDown={(e) => handleMouseDown(e, 'top-left')} />
                    <div
                        className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ns-resize left-1/2 -top-1.5 transform -translate-x-1/2"
                        onMouseDown={(e) => handleMouseDown(e, 'top')}
                    />
                    <div className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-nesw-resize -top-1.5 -right-1.5" onMouseDown={(e) => handleMouseDown(e, 'top-right')} />
                    <div
                        className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ew-resize -left-1.5 top-1/2 transform -translate-y-1/2"
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                    />
                    <div
                        className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ew-resize -right-1.5 top-1/2 transform -translate-y-1/2"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                    />
                    <div className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-nesw-resize -bottom-1.5 -left-1.5" onMouseDown={(e) => handleMouseDown(e, 'bottom-left')} />
                    <div
                        className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ns-resize left-1/2 -bottom-1.5 transform -translate-x-1/2"
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                    />
                    <div className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full cursor-nwse-resize -bottom-1.5 -right-1.5" onMouseDown={(e) => handleMouseDown(e, 'bottom-right')} />
                </>
            )}
        </div>
    );
};

export default memo(PackageFieldRenderer); // Memoize for performance