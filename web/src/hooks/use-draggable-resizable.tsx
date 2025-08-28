import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

type DragOrResizeType = 'drag' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

interface UseDraggableResizableProps {
    initialPosition: Position;
    onUpdate: (fieldId: string, newPosition: Position) => void;
    containerRef: React.RefObject<HTMLElement>;
    snapToGrid?: number;
}

export const useDraggableResizable = ({ initialPosition, onUpdate, containerRef, snapToGrid = 1 }: UseDraggableResizableProps) => {
    const [isDraggingOrResizing, setIsDraggingOrResizing] = useState<DragOrResizeType>(null);
    const [position, setPosition] = useState<Position>(initialPosition);
    const startState = useRef<{ x: number; y: number; width: number; height: number; mouseX: number; mouseY: number } | null>(null);
    const fieldIdRef = useRef<string>('');

    const setFieldId = useCallback((fieldId: string) => {
        fieldIdRef.current = fieldId;
    }, []);

    // Effect to sync local state with parent props, but only when not actively dragging.
    useEffect(() => {
        if (!isDraggingOrResizing) {
            setPosition(initialPosition);
        }
    }, [initialPosition, isDraggingOrResizing]);

    // Utility to snap values to a grid and constrain them within the container
    const normalizePosition = useCallback(
        (p: Position): Position => {
            if (!containerRef.current) return p;

            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

            // Ensure width/height don't become negative or too small
            const newWidthUnsnapped = Math.max(20, p.width);
            const newHeightUnsnapped = Math.max(20, p.height);

            // Constrain position within the container bounds
            const x = Math.max(0, Math.min(p.x, containerWidth - newWidthUnsnapped));
            const y = Math.max(0, Math.min(p.y, containerHeight - newHeightUnsnapped));

            // Snap all values to the grid
            const newX = Math.round(x / snapToGrid) * snapToGrid;
            const newY = Math.round(y / snapToGrid) * snapToGrid;
            const newWidth = Math.round(newWidthUnsnapped / snapToGrid) * snapToGrid;
            const newHeight = Math.round(newHeightUnsnapped / snapToGrid) * snapToGrid;

            // Final check to ensure the element doesn't go out of bounds after snapping
            return {
                x: Math.min(newX, containerWidth - newWidth),
                y: Math.min(newY, containerHeight - newHeight),
                width: newWidth,
                height: newHeight,
            };
        },
        [containerRef, snapToGrid]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, type: DragOrResizeType = 'drag') => {
            e.stopPropagation();
            e.preventDefault();
            setIsDraggingOrResizing(type);
            startState.current = { ...position, mouseX: e.clientX, mouseY: e.clientY };
        },
        [position]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDraggingOrResizing || !startState.current) return;
            e.preventDefault();

            const { mouseX, mouseY, ...startPos } = startState.current;
            const dx = e.clientX - mouseX;
            const dy = e.clientY - mouseY;

            let newPos: Position = { ...position }; // Start with current position

            switch (isDraggingOrResizing) {
                case 'drag':
                    newPos.x = startPos.x + dx;
                    newPos.y = startPos.y + dy;
                    break;
                case 'top':
                    newPos.height = startPos.height - dy;
                    newPos.y = startPos.y + dy;
                    break;
                case 'bottom':
                    newPos.height = startPos.height + dy;
                    break;
                case 'left':
                    newPos.width = startPos.width - dx;
                    newPos.x = startPos.x + dx;
                    break;
                case 'right':
                    newPos.width = startPos.width + dx;
                    break;
                case 'top-left':
                    newPos.height = startPos.height - dy;
                    newPos.y = startPos.y + dy;
                    newPos.width = startPos.width - dx;
                    newPos.x = startPos.x + dx;
                    break;
                case 'top-right':
                    newPos.height = startPos.height - dy;
                    newPos.y = startPos.y + dy;
                    newPos.width = startPos.width + dx;
                    break;
                case 'bottom-left':
                    newPos.height = startPos.height + dy;
                    newPos.width = startPos.width - dx;
                    newPos.x = startPos.x + dx;
                    break;
                case 'bottom-right':
                    newPos.height = startPos.height + dy;
                    newPos.width = startPos.width + dx;
                    break;
            }

            // Update the local state for immediate visual feedback. No Redux update here.
            setPosition(newPos);
        },
        [isDraggingOrResizing, position]
    );

    const handleMouseUp = useCallback(() => {
        if (isDraggingOrResizing) {
            // Apply final snapping and constraints to the current position
            const finalPosition = normalizePosition(position);

            // Sync local state to the final snapped/constrained values
            setPosition(finalPosition);

            // Dispatch ONE update to Redux with the final position
            onUpdate(fieldIdRef.current, finalPosition);

            // Reset dragging state
            setIsDraggingOrResizing(null);
            startState.current = null;
        }
    }, [isDraggingOrResizing, position, onUpdate, normalizePosition]);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return { position, handleMouseDown, isDraggingOrResizing, setFieldId };
};
