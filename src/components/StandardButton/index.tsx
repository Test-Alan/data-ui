import React from 'react';
import { Button, ButtonProps } from 'antd';

interface StandardButtonProps extends ButtonProps {
  variant?: 'primary' | 'danger' | 'default';
}

const StandardButton: React.FC<StandardButtonProps> = ({ 
  variant = 'default', 
  style, 
  children, 
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      height: '32px',
      fontSize: '14px',
      borderRadius: '4px',
      fontWeight: 'normal',
      border: 'none',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: '#1677ff',
          color: '#ffffff',
        };
      case 'danger':
        return {
          ...baseStyle,
          background: '#ff4d4f',
          color: '#ffffff',
        };
      default:
        return baseStyle;
    }
  };

  const buttonProps = {
    ...props,
    type: variant === 'primary' ? 'primary' : variant === 'danger' ? 'primary' : 'default',
    danger: variant === 'danger',
    size: 'small' as const,
    style: { ...getButtonStyle(), ...style },
  };

  return <Button {...buttonProps}>{children}</Button>;
};

export default StandardButton; 