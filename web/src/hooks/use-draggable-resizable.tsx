import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

type DragOrResizeType = 'drag' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

// Step 1: Update the interface to accept the new optional props
interface UseDraggableResizableProps {
    initialPosition: Position;
    onUpdate: (fieldId: string, newPosition: Position) => void;
    containerRef: React.RefObject<HTMLElement>;
    snapToGrid?: number;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
}

export const useDraggableResizable = ({
    initialPosition,
    onUpdate,
    containerRef,
    snapToGrid = 1,
    // Step 2: Destructure the new props
    onResizeStart,
    onResizeEnd,
}: UseDraggableResizableProps) => {
    const [isDraggingOrResizing, setIsDraggingOrResizing] = useState<DragOrResizeType>(null);
    const [position, setPosition] = useState<Position>(initialPosition);
    const startState = useRef<{ x: number; y: number; width: number; height: number; mouseX: number; mouseY: number } | null>(null);
    const fieldIdRef = useRef<string>('');

    const setFieldId = useCallback((fieldId: string) => {
        fieldIdRef.current = fieldId;
    }, []);

    useEffect(() => {
        if (!isDraggingOrResizing) {
            setPosition(initialPosition);
        }
    }, [initialPosition, isDraggingOrResizing]);

    const normalizePosition = useCallback(
        (p: Position): Position => {
            if (!containerRef.current) return p;

            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

            const newWidthUnsnapped = Math.max(20, p.width);
            const newHeightUnsnapped = Math.max(20, p.height);

            const x = Math.max(0, Math.min(p.x, containerWidth - newWidthUnsnapped));
            const y = Math.max(0, Math.min(p.y, containerHeight - newHeightUnsnapped));

            const newX = Math.round(x / snapToGrid) * snapToGrid;
            const newY = Math.round(y / snapToGrid) * snapToGrid;
            const newWidth = Math.round(newWidthUnsnapped / snapToGrid) * snapToGrid;
            const newHeight = Math.round(newHeightUnsnapped / snapToGrid) * snapToGrid;

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

            // Step 3: Call onResizeStart if the action is a resize
            if (type !== 'drag') {
                onResizeStart?.(); // Use optional chaining
            }
        },
        [position, onResizeStart] // Add onResizeStart to dependency array
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDraggingOrResizing || !startState.current) return;
            e.preventDefault();

            const { mouseX, mouseY, ...startPos } = startState.current;
            const dx = e.clientX - mouseX;
            const dy = e.clientY - mouseY;

            let newPos: Position = { ...position };

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
            setPosition(newPos);
        },
        [isDraggingOrResizing, position]
    );

    const handleMouseUp = useCallback(() => {
        if (isDraggingOrResizing) {
            const wasResizing = isDraggingOrResizing !== 'drag';
            const finalPosition = normalizePosition(position);

            setPosition(finalPosition);
            onUpdate(fieldIdRef.current, finalPosition);

            setIsDraggingOrResizing(null);
            startState.current = null;

            // Step 4: Call onResizeEnd if the action was a resize
            if (wasResizing) {
                onResizeEnd?.(); // Use optional chaining
            }
        }
    }, [isDraggingOrResizing, position, onUpdate, normalizePosition, onResizeEnd]); // Add onResizeEnd to dependency array

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
