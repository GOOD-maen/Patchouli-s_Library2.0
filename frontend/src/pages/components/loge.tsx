import './loge.css';
import { useNavigate } from 'react-router-dom';
import React from 'react';

interface LogeProps {
  shouldTurnBlack?: boolean;
  toHome?: () => void;
  size?: 'normal' | 'small';   // ⬅️ 新增：尺寸控制
}

const Loge: React.FC<LogeProps> = ({
  shouldTurnBlack = false,
  toHome,
  size = 'normal',
}) => {
  const navigate = useNavigate();

  const dynamicStyles: React.CSSProperties = {
    fontFamily: 'connectionEnglish',
    fontWeight: 300,
    transform: size === 'small'
        ? 'scaleX(0.95) scaleY(1.2)'
        : 'scaleX(0.7) scaleY(1)',
    
    borderColor: shouldTurnBlack ? '#000000' : '#ffffff',
    background: shouldTurnBlack
      ? 'linear-gradient(to right, #000000, #666666, #000000)'
      : 'linear-gradient(to right, #FFFFFF, #979797, #FFFFFF)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    transition: 'background 0.5s ease, border-color 0.5s ease',
  };

  const handleClick = () => {
    if (toHome) {
      toHome();
    } else {
      navigate('/');
    }
  };

  const buttonClasses = [
    'inline-block',
    size === 'small' ? 'text-sm' : 'text-2xl',                
    size === 'small' ? 'px-[8px]' : 'pl-[15px] pr-[15px]',    
    'border-3',
    size === 'small' ? 'h-[32px]' : 'h-[44px]',               
    size === 'small' ? 'mt-[4px]' : 'mt-[8px]',
    'transition-all',
    'duration-500',
    'special-loge',
    shouldTurnBlack ? 'black-title-style' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClasses} style={dynamicStyles} onClick={handleClick}>
      Patchouli's Library
    </button>
  );
};

export default Loge;