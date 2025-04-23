import React from 'react';

const LogoBetween = () => {
  return (
    <div style={{ margin: 0, padding: 0, lineHeight: 0 }}>
      <img
        src="/ee.png" // Ensure this image exists in the public folder
        alt="Middle Logo"
        style={{
          height: '100px',
          display: 'block',
          margin: 0,
          padding: 0,
          lineHeight: 0,
        }}
      />
    </div>
  );
};

export default LogoBetween;
