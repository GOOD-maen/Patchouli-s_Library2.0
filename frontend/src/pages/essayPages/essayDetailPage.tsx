// src/pages/essayPages/essayDetailPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getFullImageUrl } from '../../utils/imageUtils';
import { Calendar, Eye, Heart,  Star, BookOpen, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { showToast } from '../components/Toast';
import './essayDetailPage.css';

interface EssayDetail {
  id: string;
  title: string;
  content: string;
  summary: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  authorId: number;
  author?: { id: number; username: string; avatar: string };
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  username: string;
  userAvatar: string;
  parentId: number | null;
  createdAt: string;
}

function EssayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, accessToken: token } = useAuthStore();
  const currentUserId = currentUser?.id;
  const currentUserAvatar = currentUser?.avatar;

  const [essay, setEssay] = useState<EssayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorInfo, setAuthorInfo] = useState<any>(null);


  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 增加浏览量
  useEffect(() => {
    if (!id) return;
    const storageKey = `viewed_${id}`;
    if (sessionStorage.getItem(storageKey)) return;
    const increaseView = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/essay/${id}/view`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setViewsCount(data.views);
          sessionStorage.setItem(storageKey, 'true');
        }
      } catch (err) {
        console.error('增加浏览量失败', err);
      }
    };
    increaseView();
  }, [id]);

  const fetchLikeStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/essay/${id}/like-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes);
      }
    } catch (err) {
      console.error('获取点赞状态失败', err);
    }
  };

  const toggleLike = async () => {
    if (!token) {
      showToast('请先登录才能点赞哦~', '(・_・;)');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/essay/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes);
      } else if (res.status === 401) {
        showToast('登录已过期，请重新登录', '(・_・;)');
      }
    } catch (err) {
      console.error('点赞请求失败', err);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchEssay = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/essay/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEssay(data);
        setViewsCount(data.views);
        setLikesCount(data.likes);
        if (data.authorId) {
          const authorRes = await fetch(`http://localhost:8080/api/user/${data.authorId}`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            setAuthorInfo(authorData);
          }
        }
        await fetchLikeStatus();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEssay();
  }, [id]);

  const baseUrl = 'http://localhost:8080';
  const processImageUrls = (content: string) => {
    if (!content) return '';
    return content.replace(
      /!\[.*?\]\(\/uploads\/images\/markdownImages\/[^)]+\)/g,
      (match) => {
        const urlMatch = match.match(/\(\/uploads\/images\/markdownImages\/[^)]+\)/);
        if (urlMatch) {
          const relativePath = urlMatch[0].slice(1, -1);
          const absoluteUrl = `${baseUrl}${relativePath}`;
          return match.replace(/\(\/uploads\/images\/markdownImages\/[^)]+\)/, `(${absoluteUrl})`);
        }
        return match;
      }
    );
  };

  const fetchComments = async () => {
    if (!essay) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`http://localhost:8080/api/comments?targetType=essay&targetId=${essay.id}`);
      if (!res.ok) throw new Error('加载评论失败');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (essay) fetchComments();
  }, [essay]);

  const publishComment = async () => {
    const content = commentContent.trim();
    if (!content) return;
    if (!token) {
      navigate('/auth/login');
      return;
    }
    const payload = {
      content,
      targetType: 'essay',
      targetId: essay!.id,
      parentId: replyTo?.id || null,
    };
    try {
      const res = await fetch('http://localhost:8080/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('发布失败');
      await fetchComments();
      setCommentContent('');
      setReplyTo(null);
      setIsFocused(false);
      if (commentTextareaRef.current) commentTextareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error(err);
      alert('发布失败，请重试');
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('确定删除这条评论吗？')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('删除失败');
      await fetchComments();
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  const setReplyToComment = (comment: Comment) => {
    if (!token) {
      navigate('/auth/login');
      return;
    }
    setReplyTo({ id: comment.id, username: comment.username });
    setCommentContent(`@${comment.username} `);
    setIsFocused(true);
    setTimeout(() => {
      commentTextareaRef.current?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentContent('');
    setIsFocused(false);
  };

  const buildCommentTree = (flatComments: Comment[]) => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    flatComments.forEach(comment => {
      map.set(comment.id, { ...comment, children: [] });
    });
    flatComments.forEach(comment => {
      const node = map.get(comment.id);
      if (comment.parentId === null) roots.push(node);
      else {
        const parent = map.get(comment.parentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
    });
    const sortByCreated = (arr: any[]) => arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    sortByCreated(roots);
    roots.forEach(root => sortByCreated(root.children));
    roots.forEach(root => {
      const descendants: any[] = [];
      const collect = (node: any) => {
        node.children.forEach((child: any) => {
          descendants.push(child);
          collect(child);
        });
      };
      collect(root);
      root.allDescendants = descendants;
    });
    return roots;
  };

  const commentTree = buildCommentTree(comments);
  const [expandState, setExpandState] = useState<Map<number, boolean>>(new Map());
  const toggleExpand = (commentId: number) => {
    setExpandState(prev => {
      const newMap = new Map(prev);
      newMap.set(commentId, !newMap.get(commentId));
      return newMap;
    });
  };
  const isExpanded = (commentId: number) => expandState.get(commentId) || false;

  const formatCommentTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  };

  const getParentUsername = (parentId: number) => {
    const parent = comments.find(c => c.id === parentId);
    return parent ? parent.username : '';
  };

  const adjustTextareaHeight = () => {
    const textarea = commentTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 100;
    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [commentContent]);

  if (loading) return <div className="essay-detail-loading">加载中...</div>;
  if (error) return <div className="essay-detail-error">加载失败: {error}</div>;
  if (!essay) return <div className="essay-detail-notfound">文章不存在</div>;
  const processedContent = processImageUrls(essay.content);

  return (
    <div className="essay-detail-container">
      <div className="total-box">
        <div className="main-box">
          <div className="left-part"></div>
          <div className="main-part">
            <div className="article-container">
              <h1 className="article-title">{essay.title}</h1>
              <div className="article-meta">
                <span><Calendar size={14} /> 发布于 {new Date(essay.createdAt).toLocaleDateString()}</span>
                <span><Eye size={14} /> {viewsCount} 次阅读</span>
                <span><Heart size={14} /> {likesCount} 点赞</span>
              </div>
              {essay.coverUrl && (
                <div className="article-cover">
                  <img src={getFullImageUrl(essay.coverUrl)} alt="封面" />
                </div>
              )}
              {essay.summary && (
                <div className="article-summary">
                  <strong>摘要：</strong>{essay.summary}
                </div>
              )}
              <div className="article-content markdown-body">
                <ReactMarkdown>{processedContent}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="right-part">
            {/* 作者卡片 */}
            <div className="auth-card">
              <div className="background-picture" style={{
                backgroundImage: `url(${getFullImageUrl(authorInfo?.backgroundImage) || '/default-bg.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
              <div className="information">
                <div className="header-name-uuid border-slate-400/30 border-1">
                  <div className="header border-slate-400/30 border-r-1">
                    <div className="inside-content">
                      <div className="avatar-img" style={{
                        backgroundImage: `url(${getFullImageUrl(authorInfo?.avatar) || '/default-avatar.png'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }} />
                    </div>
                  </div>
                  <div className="information">
                    <div className="name-buton">
                      <div className="name border-slate-400/30 border-1">{authorInfo?.username || '佚名'}</div>
                      <button className="button">关注</button>
                    </div>
                    <div className="uuid-age">
                      <div className="uuid">ID: {authorInfo?.uuid || '啊啊，很神秘呢。'}</div>
                      <div className="age">吧龄: {authorInfo?.accountAge !== undefined ? `${authorInfo.accountAge}天` : '---'}</div>
                    </div>                
                  </div>
                </div>
              </div>
              <div className="function-part">
                <div className="stat-row">
                  <motion.div
                    className="stat-item like-btn"
                    whileTap={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    onClick={toggleLike}
                  >
                    <ThumbsUp className="icon" size={20} fill={isLiked ? '#0062ff' : 'none'}  />
                    <span>{likesCount}</span>
                  </motion.div>
                  <div className="stat-item">
                    <Star size={20} /> <span>{comments.length}</span>
                  </div>
                  <div className="stat-item ">
                    浏览量<BookOpen size={20} /><span>{viewsCount}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 评论区 */}
            <div className="comments-part">
              <div className="comments-header">评论 {comments.length}</div>
              <div className="comment-input-area">
  {token ? (
    <div className="comment-input-wrapper">
      <div className="comment-input-row">
        <div
          className="comment-avatar"
          style={{
            backgroundImage: `url(${getFullImageUrl(currentUserAvatar) || '/default-avatar.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="comment-textarea-wrapper">
          <textarea
            value={commentContent}
            onChange={(e) => {
              setCommentContent(e.target.value);
              adjustTextareaHeight();
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') publishComment(); }}
            className="commentInput"
            placeholder="来说两句吧..."
            ref={commentTextareaRef}
          />
          <AnimatePresence>
            {replyTo && (
              <motion.div
                className="reply-tip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                回复 @{replyTo.username}
                <button onClick={cancelReply} className="cancel-reply">取消</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {commentContent.trim() && (
          <motion.div
            className="publish-btn-wrapper"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button className="publish-btn" onClick={publishComment}>发布</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <div className="comment-login-tip">
      <span onClick={() => navigate('/auth/login')}>登录</span>
      后再发表高见吧~
    </div>
  )}
</div>
              <div className="comments-list">
                {loadingComments && <div className="loading-comments">加载评论中...</div>}
                {!loadingComments && commentTree.length === 0 && (
                  <div className="no-comments">暂无评论，来抢沙发吧~</div>
                )}
                {commentTree.map(top => (
                  <div key={top.id} className="comment-item">
                    <div className="comment-avatar">
                      <img src={getFullImageUrl(top.userAvatar) || '/default-avatar.png'} alt="avatar" />
                    </div>
                    <div className="comment-content">
                      <div className="comment-author">{top.username}</div>
                      <div className="comment-text">{top.content}</div>
                      <div className="comment-meta">
                        <span>{formatCommentTime(top.createdAt)}</span>
                        <button className="reply-btn" onClick={() => setReplyToComment(top)}>回复</button>
                        {token && (currentUserId === essay.authorId || top.userId === currentUserId) && (
                          <button className="delete-btn" onClick={() => deleteComment(top.id)}>删除</button>
                        )}
                      </div>
                      {top.children.length > 0 && (
                        <div className="sub-comments">
                          {!isExpanded(top.id) ? (
                            <>
                              {top.allDescendants.slice(0, 1).map((child: any) => (
                                <div key={child.id} className="sub-comment-item">
                                  <div className="comment-avatar">
                                    <img src={getFullImageUrl(child.userAvatar) || '/default-avatar.png'} alt="avatar" />
                                  </div>
                                  <div className="comment-content">
                                    <div className="comment-author">{child.username}</div>
                                    <div className="comment-text">
                                      {child.parentId !== top.id && <span className="reply-to">@{getParentUsername(child.parentId)} </span>}
                                      {child.content}
                                    </div>
                                    <div className="comment-meta">
                                      <span>{formatCommentTime(child.createdAt)}</span>
                                      <button className="reply-btn" onClick={() => setReplyToComment(child)}>回复</button>
                                      {token && (currentUserId === essay.authorId || child.userId === currentUserId) && (
                                        <button className="delete-btn" onClick={() => deleteComment(child.id)}>删除</button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {top.allDescendants.length > 1 && (
                                <div className="expand-btn" onClick={() => toggleExpand(top.id)}>
                                  共 {top.allDescendants.length} 条回复，展开全部
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {top.allDescendants.map((child: any) => (
                                <div key={child.id} className="sub-comment-item">
                                  <div className="comment-avatar">
                                    <img src={getFullImageUrl(child.userAvatar) || '/default-avatar.png'} alt="avatar" />
                                  </div>
                                  <div className="comment-content">
                                    <div className="comment-author">{child.username}</div>
                                    <div className="comment-text">
                                      {child.parentId !== top.id && <span className="reply-to">@{getParentUsername(child.parentId)} </span>}
                                      {child.content}
                                    </div>
                                    <div className="comment-meta">
                                      <span>{formatCommentTime(child.createdAt)}</span>
                                      <button className="reply-btn" onClick={() => setReplyToComment(child)}>回复</button>
                                      {token && (currentUserId === essay.authorId || child.userId === currentUserId) && (
                                        <button className="delete-btn" onClick={() => deleteComment(child.id)}>删除</button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="expand-btn" onClick={() => toggleExpand(top.id)}>收起</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!loadingComments && commentTree.length > 0 && (
                <div className="button-text">
                  再怎么翻也没有了哦
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EssayDetailPage;