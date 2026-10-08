// src/components/PostCard.tsx
import { Heart, MessageCircle, Star } from 'lucide-react';
import './postCard.css'

interface PostCardProps {
  author: {
    avatar: string;
    nickname: string;
    publishTime: string;
  };
  summary: string;           // 简介（最多显示 5 行）
  coverUrl?: string;         // 封面图（无正文图片时使用）
  images?: string[];         // 正文中的图片列表（后端解析返回）
  onDetailClick?: () => void;
  onFollow?: () => void;
}

function PostCard({ author, summary, coverUrl, images = [], onDetailClick, onFollow }: PostCardProps) {
  // 如果后端没提供 images 且没有 coverUrl，可以留空
  const hasImages = images.length > 0;
  const displayImages = hasImages ? images : (coverUrl ? [coverUrl] : []);
  const imageCount = displayImages.length;
  const isSingle = imageCount === 1;
  const isMultiple = imageCount >= 2;

  // 如果没有 summary，可以显示备用文本（但后端最好保证有值）
  const displaySummary = summary.trim() || '暂无简介';

  return (
    <div className="post-card">
      {/* 作者信息区 */}
      <div className="author-info">
        <img src={author.avatar} alt="avatar" className="avatar" />
        <div className="author-meta">
          <span className="nickname">{author.nickname}</span>
          <span className="publish-time">{author.publishTime}</span>
        </div>
        <button className="follow-btn" onClick={onFollow}>关注</button>
      </div>

      {/* 文字区：展示 summary，最多 5 行 */}
      <div className="text-area">
        <div className="content-preview">{displaySummary}</div>
        <span className="detail-link" onClick={onDetailClick}>查看详情</span>
      </div>

      {/* 图片区 */}
      {displayImages.length > 0 && (
        <div className={`image-area ${isSingle ? 'single' : 'grid'}`}>
          {isSingle && (
            <img src={displayImages[0]} alt="post" className="single-img" />
          )}
          {isMultiple && (
            displayImages.slice(0, 9).map((url, idx) => (
              <div key={idx} className={`grid-item ${idx === 8 && imageCount > 9 ? 'overlay' : ''}`}>
                <img src={url} alt={`post-${idx}`} />
                {idx === 8 && imageCount > 9 && <div className="more-mask">...</div>}
              </div>
            ))
          )}
        </div>
      )}

      {/* 功能区 */}
      <div className="action-bar">
        <button className="action-btn"><Heart size={18} /> 点赞</button>
        <button className="action-btn"><MessageCircle size={18} /> 评论</button>
        <button className="action-btn"><Star size={18} /> 收藏</button>
      </div>
    </div>
  );
}

export default PostCard;