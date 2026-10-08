import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './robot_button.css';

function RobotButton() {
  const [isLeft, setIsLeft] = useState(false);
  const clickTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickTimer.current !== null) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      return;
    }
    clickTimer.current = window.setTimeout(() => {
      setIsLeft(prev => !prev);
      clickTimer.current = null;
    }, 250);
  };

  const handleDoubleClick = () => {
    if (clickTimer.current !== null) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    navigate('/modelPage');
  };

  return (
    <div className={`robot-wrapper ${isLeft ? 'left' : 'right'}`}>
      <div
        className="bb8"
        title="双击进入对话页"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="antennas">
          <div className="antenna short"></div>
          <div className="antenna long"></div>
        </div>
        <div className="head">
          <div className="stripe one"></div>
          <div className="stripe two"></div>
          <div className="eyes">
            <div className="eye one"></div>
            <div className="eye two"></div>
          </div>
          <div className="stripe detail">
            <div className="detail zero"></div>
            <div className="detail zero"></div>
            <div className="detail one"></div>
            <div className="detail two"></div>
            <div className="detail three"></div>
            <div className="detail four"></div>
            <div className="detail five"></div>
            <div className="detail five"></div>
          </div>
          <div className="stripe three"></div>
        </div>
        <div className="ball">
          <div className="lines one"></div>
          <div className="lines two"></div>
          <div className="ring one"></div>
          <div className="ring two"></div>
          <div className="ring three"></div>
        </div>
      </div>
    </div>
  );
}

export default RobotButton;