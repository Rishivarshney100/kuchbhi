// src/components/LogoBetween.js

import React from 'react';

const LogoBetween = () => {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <img
        src="/ee.png"  // Make sure glb.jpg is inside public folder
        alt="Middle Logo"
        style={{ height: '120px' }}
      />
    </div>
  );
};

export default LogoBetween;