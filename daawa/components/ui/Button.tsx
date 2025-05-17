import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  // Add other DaisyUI variants as needed
};

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;

  return (
    <button className={`${baseClasses} ${variantClass} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

export default Button; 