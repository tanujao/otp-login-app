import React, { type InputHTMLAttributes } from 'react';
import '../styles/Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: React.ReactNode;
}

export default function Input({ label, error, helperText, id, ...props }: InputProps) {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="input-container">
      <label htmlFor={inputId} className="input-label">
        {label}
      </label>
      <input
        id={inputId}
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <div className="input-error-message">{error}</div>}
      {helperText && !error && <div className="input-helper-text">{helperText}</div>}
    </div>
  );
}
