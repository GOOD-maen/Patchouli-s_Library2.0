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

function AppBackground() {
  const location = useLocation();

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
    <video
      key={videoSrc}          // ⬅️ key 变化时重新加载视频
      autoPlay
      loop
      muted
      playsInline
      className="app-background-video"
    >
      <source src={videoSrc} type="video/mp4" />
    </video>
  );
}

export default AppBackground;