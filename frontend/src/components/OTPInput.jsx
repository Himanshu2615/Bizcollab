import React, { useRef, useState, useEffect } from 'react';
import { Input } from 'antd';

const OTPInput = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check if OTP is complete
    if (newOtp.every((val) => val !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otp];
    pasteData.split('').forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus either the next empty box or the last box
    const nextIdx = Math.min(pasteData.length, length - 1);
    inputRefs.current[nextIdx].focus();

    if (newOtp.every((val) => val !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
      {otp.map((value, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          value={value}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="otp-segment-input"
          maxLength={1}
          autoComplete="one-time-code"
          style={{
            width: '48px',
            height: '64px',
            textAlign: 'center',
            fontSize: '28px',
            fontFamily: "'Geist Mono', 'Courier New', monospace",
            fontWeight: '700',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      ))}
      <style jsx>{`
        .otp-segment-input:focus {
          border-color: #7C3AED !important;
          background-color: rgba(124, 58, 237, 0.05) !important;
          box-shadow: 0 0 0 1px #7C3AED, 
                      0 0 20px rgba(124, 58, 237, 0.3),
                      inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-2px);
        }
        .otp-segment-input::selection {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default OTPInput;
