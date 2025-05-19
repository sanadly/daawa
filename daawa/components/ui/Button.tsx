import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  isLoading?: boolean;
  // Add other DaisyUI variants as needed
};

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const loadingClass = isLoading ? 'loading' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClass} ${loadingClass} ${className || ''}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 