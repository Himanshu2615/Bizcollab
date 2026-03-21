import React from 'react';

const SkeletonBox = ({ height = '100px', width = '100%', style = {} }) => {
  return (
    <div 
      style={{
        height,
        width,
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <div className="skeleton-shimmer" />
      <style>{`
        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
          animation: shimmer 1.8s infinite;
          transform: translateX(-100%);
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default SkeletonBox;
