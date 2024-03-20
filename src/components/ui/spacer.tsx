import React from 'react';

interface SpacerProps {
    size: number;
}

const Spacer: React.FC<SpacerProps> = ({ size }) => {
    return <div style={{ height: `${size}px` }} />;
};

export { Spacer }