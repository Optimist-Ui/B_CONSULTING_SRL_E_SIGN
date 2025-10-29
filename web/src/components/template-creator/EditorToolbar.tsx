import React, { ComponentType } from 'react';
import { DocumentField } from '../../store/slices/templateSlice';
import { FaSignature, FaRegCalendarAlt, FaRegListAlt } from 'react-icons/fa';
import { BsTextareaResize, BsInputCursorText } from 'react-icons/bs';
import { IoIosCheckboxOutline, IoIosRadioButtonOn } from 'react-icons/io';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className="flex flex-col items-center justify-center 
                       p-1.5 xs:p-2 sm:p-2.5 lg:p-3 
                       w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24
                       dark:bg-gray-900 bg-gray-100 rounded-md 
                       border border-gray-200 
                       cursor-grab active:cursor-grabbing 
                       hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300 
                       transition-all duration-150 
                       text-gray-600"
            draggable
            onDragStart={handleDragStart}
        >
            <div className="text-base xs:text-lg sm:text-2xl lg:text-3xl">{icon}</div>
            <span className="mt-0.5 xs:mt-1 sm:mt-1.5 lg:mt-2 text-[8px] xs:text-[9px] sm:text-xs lg:text-sm font-semibold text-center leading-tight whitespace-nowrap">
                {t(`editorToolbar.fieldTypes.${type}`)}
            </span>
        </div>
    );
};

const EditorToolbar: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div
            className="flex items-center justify-center 
                        gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4 
                        flex-wrap 
                        p-1.5 xs:p-2 
                        dark:bg-gray-900 bg-white 
                        rounded-md shadow-sm"
        >
            <FieldTool type="text" label={t('editorToolbar.fieldTypes.text')} icon={<BsInputCursorTextTyped />} />
            <FieldTool type="textarea" label={t('editorToolbar.fieldTypes.textarea')} icon={<BsTextareaResizeTyped />} />
            <FieldTool type="signature" label={t('editorToolbar.fieldTypes.signature')} icon={<FaSignatureTyped />} />
            <FieldTool type="checkbox" label={t('editorToolbar.fieldTypes.checkbox')} icon={<IoIosCheckboxOutlineTyped />} />
            <FieldTool type="date" label={t('editorToolbar.fieldTypes.date')} icon={<FaRegCalendarAltTyped />} />
        </div>
    );
};

export default EditorToolbar;
