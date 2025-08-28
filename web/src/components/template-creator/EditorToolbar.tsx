import React, { ComponentType } from 'react';
import { DocumentField } from '../../store/slices/templateSlice';
import { FaSignature, FaRegCalendarAlt, FaRegListAlt } from 'react-icons/fa';
import { BsTextareaResize, BsInputCursorText } from 'react-icons/bs';
import { IoIosCheckboxOutline, IoIosRadioButtonOn } from 'react-icons/io';

const FaSignatureTyped = FaSignature as ComponentType<{ className?: string }>;
const FaRegCalendarAltTyped = FaRegCalendarAlt as ComponentType<{ className?: string }>;
const FaRegListAltTyped = FaRegListAlt as ComponentType<{ className?: string }>;
const BsInputCursorTextTyped = BsInputCursorText as ComponentType<{ className?: string }>;
const IoIosCheckboxOutlineTyped = IoIosCheckboxOutline as ComponentType<{ className?: string }>;
const IoIosRadioButtonOnTyped = IoIosRadioButtonOn as ComponentType<{ className?: string }>;
const BsTextareaResizeTyped = BsTextareaResize as ComponentType<{ className?: string }>;

interface FieldToolProps {
    type: DocumentField['type'];
    label: string;
    icon: React.ReactNode;
}

const FieldTool: React.FC<FieldToolProps> = ({ type, label, icon }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className="flex flex-col items-center p-3 w-24 h-24 justify-center bg-gray-100 rounded-md border border-gray-200 cursor-grab active:cursor-grabbing hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300 transition-all duration-150 text-gray-600 text-nowrap"
            draggable
            onDragStart={handleDragStart}
        >
            {icon}
            <span className="mt-2 text-sm font-semibold text-center">{label}</span>
        </div>
    );
};

const EditorToolbar: React.FC = () => {
    return (
        <div className="flex items-center justify-center gap-4 flex-wrap p-2 bg-white rounded-md shadow-sm">
            <FieldTool type="text" label="Text" icon={<BsInputCursorTextTyped className="text-3xl" />} />
            <FieldTool type="textarea" label="Text Area" icon={<BsTextareaResizeTyped className="text-3xl" />} />
            <FieldTool type="signature" label="Signature" icon={<FaSignatureTyped className="text-3xl" />} />
            <FieldTool type="checkbox" label="Checkbox" icon={<IoIosCheckboxOutlineTyped className="text-3xl" />} />
            {/* <FieldTool type="radio" label="Radio Group" icon={<IoIosRadioButtonOnTyped className="text-3xl" />} /> */}
            {/* <FieldTool type="dropdown" label="Dropdown" icon={<FaRegListAltTyped className="text-3xl" />} /> */}
            <FieldTool type="date" label="Date" icon={<FaRegCalendarAltTyped className="text-3xl" />} />
        </div>
    );
};

export default EditorToolbar;
