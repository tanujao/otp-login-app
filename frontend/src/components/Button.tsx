import { type ButtonHTMLAttributes } from 'react';
import '../styles/Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className} ${isLoading ? 'btn-loading' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="loader-spinner" /> : null}
      {children}
    </button>
  );
}
