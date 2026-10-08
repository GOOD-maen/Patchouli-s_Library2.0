import { useEffect, useState, useRef } from 'react';
import './Toast.css';

export interface ToastItem {
  id: number;
  message: string;
  kaomoji: string;
}

// 全局队列
let toastQueue: ToastItem[] = [];
let toastListeners: ((queue: ToastItem[]) => void)[] = [];

function notifyListeners() {
  toastListeners.forEach(fn => fn([...toastQueue]));
}

/**
 * 全局调用函数
 * @param message 提示文字
 * @param kaomoji 颜文字（可选）
 */
export function showToast(message: string, kaomoji: string = '(・_・;)') {
  const id = Date.now() + Math.random();
  toastQueue.push({ id, message, kaomoji });
  notifyListeners();
}

/**
 * Toast 容器组件
 * 放在 App.tsx 最外层
 */
function Toast() {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | null>(null);

  // 注册监听
  useEffect(() => {
    const listener = (newQueue: ToastItem[]) => setQueue(newQueue);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== listener);
    };
  }, []);

  // 处理队列
  useEffect(() => {
    if (current || queue.length === 0) return;

    const [first, ...rest] = queue;
    setCurrent(first);
    setQueue(rest);

    // 从全局队列移除
    toastQueue = toastQueue.filter(item => item.id !== first.id);
    notifyListeners();

    // 2 秒后自动消失
    timerRef.current = window.setTimeout(() => {
      setCurrent(null);
    }, 2000);
  }, [queue, current]);

  // 点击提前渐出
  const handleClick = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  };

  // 组件卸载清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!current) return null;

  return (
    <div className="toast-container">
      <div
        key={current.id}
        className="toast-item"
        onClick={handleClick}
      >
        <span className="toast-kaomoji">{current.kaomoji}</span>
        <span className="toast-message">{current.message}</span>
      </div>
    </div>
  );
}

export default Toast;