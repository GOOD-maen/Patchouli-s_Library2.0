import './createPage.css';
import redCloudVideo from '@/assets/videos/background/redCloud.mp4';
import { getFullImageUrl } from '../../utils/imageUtils';
import { useAuthStore } from '../../stores/useAuthStore';
import { useState, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { customImageCommand } from '../components/customImageCommand';
import { getCommands, getExtraCommands } from '@uiw/react-md-editor/commands-cn';
import ImageCropperModal from '../components/imageCropperModal';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../utils/request';

function createPage() {
  const [searchParams] = useSearchParams();
  const essayId = searchParams.get('id');
  const { user, accessToken } = useAuthStore();
  const avatarUrl = getFullImageUrl(user?.avatar);
  const backgroundUrl = getFullImageUrl(user?.backgroundImage);

  const [title, setTitle] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [selected, setSelected] = useState({ article: false, video: false, css: false });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载已有文章数据（编辑模式）
  useEffect(() => {
    if (!essayId || !accessToken) return;

    const fetchEssay = async () => {
      try {
        const response = await authFetch(`/api/essay/${essayId}`);
        if (!response.ok) throw new Error('加载文章失败');
        const data = await response.json();
        setTitle(data.title || '');
        setMarkdownContent(data.content || '');
        setSummary(data.summary || '');
        const fullCover = getFullImageUrl(data.coverUrl);
        setCoverPreview(fullCover);
        setCoverUrl(data.coverUrl);
        const cat = data.category;
        setSelected({
          article: cat === 'article',
          video: cat === 'video',
          css: cat === 'css',
        });
      } catch (err) {
        console.error(err);
        alert('加载文章失败，请刷新重试');
      }
    };
    fetchEssay();
  }, [essayId, accessToken]);

  const handleCoverClick = () => coverInputRef.current?.click();

  const onCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const targetRatio = 16 / 9;
      const tolerance = 0.1;
      if (Math.abs(ratio - targetRatio) < tolerance) {
        uploadCoverImage(file);
      } else {
        setCoverFile(file);
        setShowCoverCropper(true);
      }
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);

    e.target.value = '';
  };

  const uploadCoverImage = async (file: File) => {
    setIsUploadingCover(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await authFetch('/api/upload/temp-image', {
        method: 'POST',
        body: formData,
        autoJson: false,
      });
      if (!res.ok) throw new Error('上传失败');
      const data = await res.json();
      setCoverUrl(data.url);
    } catch (err) {
      console.error('封面上传失败', err);
      alert('封面上传失败，请重试');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCoverCropComplete = async (croppedFile: File, previewUrl: string) => {
    setCoverPreview(previewUrl);
    await uploadCoverImage(croppedFile);
    setShowCoverCropper(false);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setCoverUrl('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const originalCommands = getCommands();
  const customCommands = originalCommands.map((cmd) =>
    cmd.keyCommand === 'image' ? customImageCommand : cmd
  );

  const toggleType = (type: 'article' | 'video' | 'css') => {
    setSelected((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const getSelectedCategory = () => {
    if (selected.article) return 'article';
    if (selected.video) return 'video';
    if (selected.css) return 'css';
    return '';
  };

  // 通用的保存方法（草稿或发布）
  const saveArticle = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('请填写标题');
      return;
    }
    if (!markdownContent.trim()) {
      alert('请填写正文');
      return;
    }
    if (!summary.trim()) {
      alert('请填写描述');
      return;
    }
    const category = getSelectedCategory();
    if (!category) {
      alert('请选择文章分类');
      return;
    }
    if (!coverUrl) {
      alert('请上传封面图片');
      return;
    }

    setIsSubmitting(true);
    const contentForBackend = markdownContent.replace(
    /!\[.*?\]\(http:\/\/localhost:8080(\/uploads\/temp\/[^)]+)\)/g,
    '![图片]($1)'
    );
    try {
      const payload = {
        title: title.trim(),
        content: contentForBackend,
        summary: summary.trim(),
        coverUrl: coverUrl,
        category: category,
        status: status,
      };

      let url = '/api/essay';
      let method = 'POST';
      if (essayId) {
        url = `/api/essay/${essayId}`;
        method = 'PUT';
      }

      const response = await authFetch(url, {
  method: method,
  body: JSON.stringify(payload),
});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '操作失败');
      }

      alert(status === 'published' ? '发布成功！' : '草稿已保存');
      if (!essayId) {
        const newEssay = await response.json();
        window.location.href = `/createPage?id=${newEssay.id}`;
      } else {

        window.location.reload();
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = () => saveArticle('published');
  const handleSaveDraft = () => saveArticle('draft');

  return (
    <div className="createPage">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={redCloudVideo} type="video/mp4" />
      </video>

      <div className="content-box">
        <div className="inside-content">
          <div className="main-box">
            <div className="create-box">
              <div className="paper-box inset_shadow">
                <div className="title-outside-box">
                  <div className="title-inside-box">
                    <input
                      type="text"
                      className="title-input"
                      placeholder="输入文章标题..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={80}
                    />
                  </div>
                </div>
                <div className="markdown-outside-box">
                  <div className="markdown-inside-box">
                    <MDEditor
                      value={markdownContent}
                      onChange={(val) => setMarkdownContent(val || '')}
                      height="100%"
                      preview="live"
                      visibleDragbar={false}
                      commands={customCommands}
                      extraCommands={getExtraCommands()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="classify-description">
              <div className="cover-card">
                <div className="title">作品封面</div>
                <div className="cover-box">
                  <div
                    className="cover inset_shadow"
                    onClick={handleCoverClick}
                    style={{
                      backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={onCoverFileChange}
                      accept="image/*"
                      hidden
                    />
                    {!coverPreview && (
                      <div className="cover-placeholder">
                        <div className="icon-box">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p>点击上传封面</p>
                        <span>此处使用 16:9 比例</span>
                      </div>
                    )}
                    {coverPreview && (
                      <button
                        className="cover-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCover();
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="classify-title">
                <div className="rod"></div>OPERATING MODE<div className="rod"></div>
              </div>

              <div className="classify-list border-slate-400/30 border-1">
                <div className="option border-b-1 border-slate-400/40">
                  <div className="text border-l-1 border-slate-400/40">文 章</div>
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" checked={selected.article} onChange={() => toggleType('article')} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="option border-b-1 border-slate-400/40">
                  <div className="text border-l-1 border-slate-400/40">视 频</div>
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" checked={selected.video} onChange={() => toggleType('video')} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
                <div className="option border-b-1 border-slate-400/40">
                  <div className="text border-l-1 border-slate-400/40">CSS</div>
                  <div className="choose-box-outside">
                    <label className="custom-checkbox">
                      <input type="checkbox" checked={selected.css} onChange={() => toggleType('css')} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="description-title">
                <div className="rod"></div>DESCRIPTION<div className="rod"></div>
              </div>

              <div className="description-outside-box">
                <div className="paper-card">
                  <textarea
                    className="input-area"
                    placeholder="输入描述..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
              </div>

              <div className="button-outside">
                <div className="post-button" onClick={handlePublish} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? '处理中...' : '发 布 作 品'}
                </div>
                <div className="draft-button" onClick={handleSaveDraft} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                  保 存 草 稿
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageCropperModal
        visible={showCoverCropper}
        imageFile={coverFile}
        aspectRatio={16 / 9}
        mode="cover"
        onCropComplete={handleCoverCropComplete}
        onClose={() => setShowCoverCropper(false)}
      />
    </div>
  );
}

export default createPage;