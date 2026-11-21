import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import snowVideo from '@/assets/videos/background/snow.mp4';
import redCloudVideo from '@/assets/videos/background/redCloud.mp4';
import './AppBackground.css';

// 路由 → 视频映射
const VIDEO_MAP: Record<string, string> = {
  '/userCenter': redCloudVideo,
  '/': snowVideo,
};

// 默认视频
const DEFAULT_VIDEO = snowVideo;

/**
 * 首屏不加载视频：
 * 1. 先渲染纯 CSS 渐变占位（0 字节）
 * 2. 延迟 800ms 再挂载 <video>，避免和首屏关键资源抢带宽
 * 3. 能播放后再淡入，避免黑屏闪烁
 * 4. 尊重系统「减少动效」设置；小屏直接不加载视频
 */
const MOUNT_DELAY_MS = 800;
const MIN_WIDTH_FOR_VIDEO = 1024;

function AppBackground() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wideEnough = window.innerWidth >= MIN_WIDTH_FOR_VIDEO;
    if (reduceMotion || !wideEnough) return;

    const timer = window.setTimeout(() => setMounted(true), MOUNT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // 根据当前路径找匹配的视频
  const getVideoSrc = () => {
    // 精确匹配
    if (VIDEO_MAP[location.pathname]) {
      return VIDEO_MAP[location.pathname];
    }

    // 前缀匹配（如 /userCenter/userInformation）
    for (const [prefix, video] of Object.entries(VIDEO_MAP)) {
      if (prefix !== '/' && location.pathname.startsWith(prefix)) {
        return video;
      }
    }

    return DEFAULT_VIDEO;
  };

  const videoSrc = getVideoSrc();

  return (
    <>
      <div className="app-background-placeholder" aria-hidden="true" />
      {mounted && (
        <video
          key={videoSrc}          // ⬅️ key 变化时重新加载视频
          autoPlay
          loop
          muted
          playsInline
          preload="none"          // ⬅️ 不让浏览器抢在首屏前拉视频
          className={`app-background-video${visible ? ' is-visible' : ''}`}
          onCanPlay={() => setVisible(true)}
          onPlaying={() => setVisible(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </>
  );
}

export default AppBackground;
