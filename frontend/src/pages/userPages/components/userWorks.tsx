import './userWorks.css';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getFullImageUrl } from '../../../utils/imageUtils';
import { EllipsisVertical , Trash2 , FilePenLine , ListFilter ,Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { authFetch } from '../../../utils/request';


// 确定性随机函数
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

interface Essay {
  id: string;
  title: string;
  coverUrl: string;
  updatedAt: string;
  createdAt: string;
  views: number;
  likes: number;
  status: 'draft' | 'published';
}

// 筛选组件
function FilterAndSearch({ 
  filterDraft, setFilterDraft, 
  filterPublished, setFilterPublished 
}: { 
  filterDraft: boolean; setFilterDraft: (v: boolean) => void;
  filterPublished: boolean; setFilterPublished: (v: boolean) => void;
}) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const toggleFilterMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFilterMenuOpen(prev => !prev);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-button')) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="top-part">
      <div className="inset-box">
        <div className="search-box">
          <input type="text" placeholder="搜索作品..." />
          <div className="button-rod"></div>
          <Search className="search-button" />
        </div>
        <div className="rod"></div>
        <div className="filter-button" onClick={toggleFilterMenu}>
           <ListFilter className="icon" /> 筛选
          <div className={`filter-menu ${isFilterMenuOpen ? 'show' : ''}`}>
            <div className="menu-inset-box">
              <div className="draft-and-published">
                <div className="checkbox-outside">
                  草稿
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" checked={filterDraft} onChange={(e) => setFilterDraft(e.target.checked)} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="checkbox-outside border-b-[1px]">
                  已发布
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" checked={filterPublished} onChange={(e) => setFilterPublished(e.target.checked)} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
              </div>
              {/* 文件类型部分暂不实现功能，保留结构 */}
              <div className="file-type-outside">
                <div className="checkbox-outside">
                  文章
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="checkbox-outside">
                  视频
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="checkbox-outside">
                  CSS
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="checkbox-outside">
                  其他
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function userWorks() {
  const ROTATION_ANGLES = [-1, -2, 0, 2, 2];
  const { accessToken, user } = useAuthStore();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // 筛选状态
  const [filterDraft, setFilterDraft] = useState(true);
  const [filterPublished, setFilterPublished] = useState(true);

  // 删除文章
const handleDelete = async (essayId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这篇文章吗？删除后无法恢复。')) return;
    try {
      const response = await authFetch(`/api/essay/${essayId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除失败');
      }
      setEssays(prev => prev.filter(essay => essay.id !== essayId));
      if (activeMenuId === essayId) setActiveMenuId(null);
      alert('删除成功');
    } catch (err: any) {
      console.error(err);
      alert(err.message || '删除失败，请重试');
    }
  };
  // 全局点击关闭菜单（卡片内的菜单）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.edit-button')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!accessToken || !user?.id) {
      setLoading(false);
      setError('请先登录后查看作品');
      return;
    }

    const fetchEssays = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await authFetch(`/api/essay/user/${user.id}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const data = await response.json();
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEssays(sorted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();
  }, [accessToken, user]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleCardClick = (essayId: string) => {
    console.log("跳转页面");
  };

  const handleEdit = (essayId: string) => {
    window.location.href = `/createPage?id=${essayId}`;
  };

  const toggleMenu = (e: React.MouseEvent, essayId: string) => {
    e.stopPropagation();
    setActiveMenuId(prev => (prev === essayId ? null : essayId));
  };

  // 过滤后的文章列表
  const filteredEssays = essays.filter(essay => {
    if (essay.status === 'draft' && filterDraft) return true;
    if (essay.status === 'published' && filterPublished) return true;
    return false;
  });

  const renderContent = () => {
    if (loading) return <div className="status-message">加载作品中...</div>;
    if (error) return <div className="status-message">{error}</div>;
    if (filteredEssays.length === 0) {
      return (
        <AnimatePresence>
        <motion.div 
        className="status-message empty"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: 0.3 }}>
          
          <div className="empty-icon">
            <BookOpen className="icon"></BookOpen>
          </div>
          <p>暂无符合条件的作品</p>
        </motion.div>
        </AnimatePresence>

      );
    }
    return (
      <div className="works-outside">
        <AnimatePresence>
        {filteredEssays.map((essay) => {
          const seed = seededRandom(essay.id);
          const angleIndex = Math.floor(seed * ROTATION_ANGLES.length);
          const rotateAngle = ROTATION_ANGLES[angleIndex];
          const isMenuOpen = activeMenuId === essay.id;
          return (
            <motion.div
              key={essay.id}
              className="essay-card classic_shadow"
              style={{ transform: `rotate(${rotateAngle}deg)` }}
              onClick={() => handleCardClick(essay.id)}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.2 }}
              transition={{ duration: 0.1, layout: { duration: 0.1 } }}
              layout
            >
              <div className="inset-card">
                <div className="cover-outside">
                  <div
                    className="cover inset_shadow"
                    style={{
                      backgroundImage: `url(${getFullImageUrl(essay.coverUrl)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                </div>
                <div className="title-time">
                  <div className="title" title={essay.title}>{essay.title}</div>
                  <div className="time">更新: {formatDate(essay.updatedAt)}</div>
                </div>
                <div className="stats">
                  <div className="stat-item">
                    <span className="stat-icon">浏览量:</span> {essay.views}
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">点赞量:</span> {essay.likes}
                  </div>
                  <div className="right-part">
                    <div className={`status ${essay.status === 'draft' ? 'draft-status' : 'published-status'}`}>
                      {essay.status === 'draft' ? '草稿' : '已发布'}
                    </div>
                    <div className="edit-button" onClick={(e) => toggleMenu(e, essay.id)}>
                      <div className="icon-box">
                        <EllipsisVertical className="icon" />
                      </div>
                      <div className={`menu-popup ${isMenuOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="menu-item">
                          <div className="menu-popup-inset-box">
                            <div className="button" onClick={(e) => { e.stopPropagation(); handleEdit(essay.id); }}>
                              <FilePenLine className="icon" /> 编辑
                            </div>
                            <div className="rod"></div>
                            <div className="button" onClick={(e) => handleDelete(essay.id, e)}>
                              <Trash2 className="icon" /> 删除
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="user-works-outside">
      <FilterAndSearch 
        filterDraft={filterDraft}
        setFilterDraft={setFilterDraft}
        filterPublished={filterPublished}
        setFilterPublished={setFilterPublished}
      />
      <div className="user-works">
        {renderContent()}
        <div className="bottom-box top_shadow"></div>
      </div>
    </div>
  );
}

export default userWorks;