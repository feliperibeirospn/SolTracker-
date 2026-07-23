import React from 'react';
import '@/styles/skeleton.css';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, width, height, borderRadius, style }) => {
  const combinedStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: borderRadius || '4px',
    ...style
  };

  return <div className={`skeleton ${className || ''}`} style={combinedStyle} />;
};

export default Skeleton;
