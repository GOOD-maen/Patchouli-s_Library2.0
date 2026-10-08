import './homeShowPage.css';
import { motion } from 'framer-motion';
import Calendar from '../components/calendar';
import PostCard from '../components/postCard';
import { useEffect, useState } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import BackgroundVideo from '@/assets/videos/background/snow.mp4';


// 后端返回的文章结构（包含作者对象）
interface Essay {
  id: string;
  title: string;
  content: string;
  summary: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
}

function BlankFillingLayer() {
  return (
    <motion.div
      className="blankFillingOutside"
      initial={{ height: '750px' }}
      animate={{ height: '600px' }}
      transition={{
        delay: 1.5,
        duration: 0.5,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className="welcome"
        initial={{ height: '60px' }}
        animate={{ height: '0' }}
        transition={{
          delay: 1.5,
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        Welcome
      </motion.div>
    </motion.div>
  );
}

function homeShowPage() {
  const navigate = useNavigate();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 从 Markdown 正文中提取图片链接
  const extractImages = (markdown: string): string[] => {
    const regex = /!\[.*?\]\((.*?)\)/g;
    const urls: string[] = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  };

  useEffect(() => {
    const fetchEssays = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8080/api/essay');
        if (!res.ok) throw new Error('获取文章列表失败');
        const data: Essay[] = await res.json();
        setEssays(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();
  }, []);

  const renderContent = () => {
    if (loading) {
      return  <div className="status-message loading">   
      <div className="loading-word">                   
        <div className='word'>不要心急，也就是说...</div>
        <div className='word'>正在加载呢。</div>
      </div>
    </div>;
    }
    if (error) {
      return <div className="status-message">{error}</div>;
    }
    if (essays.length === 0) {
      return (
        <div className="status-message empty">
          <div className="empty-word">
            <div className='word'>没有意义的,也就是说...</div>
            <div className='word'>这里什么都没有哦。</div>
          </div>
          
        </div>
      );
    }
    return (
      <div className="content-part" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', overflowY: 'auto', height: '100%' }}>
        {essays.map((essay) => {
          const images = extractImages(essay.content);
          return (
            <PostCard
              key={essay.id}
              author={{
                avatar: essay.author?.avatar ? getFullImageUrl(essay.author.avatar) : '',
                nickname: essay.author?.username || '未知用户',
                publishTime: new Date(essay.createdAt).toLocaleDateString(),
              }}
              summary={essay.summary || '暂无简介'}
              coverUrl={essay.coverUrl ? getFullImageUrl(essay.coverUrl) : undefined}
              images={images.map(img => getFullImageUrl(img))}
              onDetailClick={() => navigate(`/essay/${essay.id}`)}
              onFollow={() => console.log('关注', essay.author?.id)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="homeShowPage inset_shadow">
      <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover z-0">
        <source src={BackgroundVideo} type="video/mp4" />
      </video>
      <div className="content w-full relative z-2">
        <BlankFillingLayer />
        <div className="main-outside-box">
          <div className="special-border">
            <div className="inset-rod"></div>
          </div>
          <div className="inset-box">
            <div className="left-part">
              <div className="calendar">
                <Calendar />
              </div>
              <div className="clock"></div>
              <div className="box"></div>
            </div>
            <div className="center-part">
              <div className="functions-part"></div>
              {renderContent()}
            </div>
            <div className="right-part"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default homeShowPage;