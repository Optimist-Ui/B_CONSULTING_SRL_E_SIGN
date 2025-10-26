import React, { useState, useMemo } from 'react';
// Make sure this import path is correct for your project
import { IconStar } from '../Icon/IconRocket';

interface StarRatingInputProps {
    count?: number;
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: number;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({ count = 5, rating, onRatingChange, size = 28 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const getColor = (index: number) => {
        if (hoverRating >= index) {
            return 'text-yellow-400';
        }
        if (!hoverRating && rating >= index) {
            return 'text-yellow-400';
        }
        return 'text-gray-600';
    };

    const starRating = useMemo(() => {
        return Array(count)
            .fill(0)
            .map((_, i) => i + 1)
            .map((index) => (
                // --- THIS IS THE FIX ---
                // We create a wrapper div to handle the events and size.
                // The IconStar component itself only receives the className for color.
                <div
                    key={index}
                    className="cursor-pointer"
                    style={{ width: size, height: size }}
                    onClick={() => onRatingChange(index)}
                    onMouseEnter={() => setHoverRating(index)}
                    onMouseLeave={() => setHoverRating(0)}
                >
                    <IconStar
                        // The className controls the color and transition.
                        // 'w-full h-full' makes the SVG fill the wrapper div.
                        className={`w-full h-full transition-colors duration-200 ${getColor(index)}`}
                    />
                </div>
            ));
    }, [count, rating, hoverRating, size]); // Added `size` to the dependency array for correctness

    return <div className="flex items-center space-x-1">{starRating}</div>;
};

export default StarRatingInput;
