// src/components/Calendar.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './calendar.css'
interface CalendarProps {
  onDateChange?: (date: Date) => void; // 可选：点击日期回调
}

function Calendar({ onDateChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Date[]>([]);
  const [direction, setDirection] = useState<'prev' | 'next'>('next'); // 动画方向

  // 生成某个月的所有日期（6周）
  const generateDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay(); // 0 周日
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray: Date[] = [];
    // 添加上月末尾
    for (let i = startDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      daysArray.push(prevDate);
    }
    // 添加本月
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }
    // 添加下月开头（凑够42天）
    const remaining = 42 - daysArray.length;
    for (let i = 1; i <= remaining; i++) {
      daysArray.push(new Date(year, month + 1, i));
    }
    return daysArray;
  };

  useEffect(() => {
    setDays(generateDays(currentDate));
  }, [currentDate]);

  const goPrevMonth = () => {
    setDirection('prev');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setDirection('next');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 判断是否为今天
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // 动画变体
  const variants = {
    initial: (direction: 'prev' | 'next') => ({
      x: direction === 'next' ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'prev' | 'next') => ({
      x: direction === 'next' ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className="calendar-component">
      <div className="calendar-header">
        <button className="month-nav" onClick={goPrevMonth}>◀</button>
        <span className="month-year">{year}年 {month}月</span>
        <button className="month-nav" onClick={goNextMonth}>▶</button>
      </div>
      <div className="calendar-weekdays">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="calendar-days-wrapper">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            className="calendar-days"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {days.map((date, idx) => (
              <div
                key={idx}
                className={`calendar-day ${date.getMonth() === currentDate.getMonth() ? 'current-month' : 'other-month'} ${isToday(date) ? 'today' : ''}`}
                onClick={() => onDateChange?.(date)}
              >
                {date.getDate()}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Calendar;