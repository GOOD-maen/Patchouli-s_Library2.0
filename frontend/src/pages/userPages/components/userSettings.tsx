import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getFullImageUrl } from '../../../utils/imageUtils';
import './userSettings.css';
import ImageCropperModal from '../../components/imageCropperModal';
import { authFetch } from '../../../utils/request';

const uploadImage = async (file: File, type: 'avatar' | 'background', token: string): Promise<string> => {
  if (!token) throw new Error('未登录');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const res = await authFetch('/api/user/uploads', {
    method: 'POST',
    body: formData,
    autoJson: false, 
  });
  if (!res.ok) throw new Error('上传失败');
  const data = await res.json();
  return data.fileUrl;
};

function UserSettings() {
  const { user, accessToken, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    signature: user?.signature || '',
    avatar: user?.avatar || '',
    backgroundImage: user?.backgroundImage || '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bgPreview, setBgPreview] = useState<string>('');

  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showBgCropper, setShowBgCropper] = useState(false);
  const [avatarFileToCrop, setAvatarFileToCrop] = useState<File | null>(null);
  const [bgFileToCrop, setBgFileToCrop] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        signature: user.signature || '',
        avatar: user.avatar || '',
        backgroundImage: user.backgroundImage || '',
      });
      setAvatarPreview('');
      setBgPreview('');
    }
  }, [user]);

  const handleAvatarSelectClick = () => {
    if (!isEditing) return;
    avatarInputRef.current?.click();
  };

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFileToCrop(file);
      setShowAvatarCropper(true);
    }
    e.target.value = '';
  };

  const handleAvatarCropComplete = async (croppedFile: File, previewUrl: string) => {
    setAvatarPreview(previewUrl);
    setIsUploading(true);
    try {
      const url = await uploadImage(croppedFile, 'avatar', accessToken!);
      setForm(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('头像上传失败', err);
      alert('头像上传失败');
    } finally {
      setIsUploading(false);
      setShowAvatarCropper(false);
    }
  };

  const handleBgSelectClick = () => {
    if (!isEditing) return;
    bgInputRef.current?.click();
  };

  const onBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgFileToCrop(file);
      setShowBgCropper(true);
    }
    e.target.value = '';
  };

  const handleBgCropComplete = async (croppedFile: File, previewUrl: string) => {
    setBgPreview(previewUrl);
    setIsUploading(true);
    try {
      const url = await uploadImage(croppedFile, 'background', accessToken!);
      setForm(prev => ({ ...prev, backgroundImage: url }));
    } catch (err) {
      console.error('背景上传失败', err);
      alert('背景上传失败');
    } finally {
      setIsUploading(false);
      setShowBgCropper(false);
    }
  };

  const saveSettings = async () => {
    if (!accessToken) {
      alert('请先登录');
      return;
    }
    if (isUploading) {
      alert('请等待图片上传完成');
      return;
    }
    if (form.username.length > 20) {
      alert('昵称不能超过20个字符');
      return;
    }
    if (form.signature.length > 150) {
      alert('签名不能超过150个字符');
      return;
    }

    try {
    const response = await authFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        username: form.username,
        signature: form.signature,
        avatar: form.avatar,
        backgroundImage: form.backgroundImage,
      }),
    });
    if (!response.ok) throw new Error('保存失败');
    
    const result = await response.json(); 
    console.log('🔍 更新接口返回:', result);
    
    if (result.success && result.data) {
      updateUser(result.data);
      alert('保存成功');
      setIsEditing(false);
      setAvatarPreview('');
      setBgPreview('');
    } else {
      alert(result.message || '保存失败');
    }
  } catch (err) {
    console.error(err);
    alert('保存失败，请重试');
  }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      saveSettings();
    } else {
      setForm({
        username: user?.username || '',
        signature: user?.signature || '',
        avatar: user?.avatar || '',
        backgroundImage: user?.backgroundImage || '',
      });
      setAvatarPreview('');
      setBgPreview('');
      setIsEditing(true);
    }
  };

  const displayAvatar = avatarPreview || getFullImageUrl(form.avatar);
  const displayBg = bgPreview || getFullImageUrl(form.backgroundImage);

  return (
    <div className="user-info">
      <div className="paper-stack">
        <div className="paper paper-1" />
        <div className="paper paper-2" />
        <div className="paper paper-3" />
        <div className="form-container">
          <div className="inside-box">
            <div className="setting-panel">
              <div className="setting-header bottom_shadow">
                <div className="setting-title">————— Setting —————</div>
              </div>

              <div className="setting-content">
                <div className="user-card">
                  <div className="avatar-area">
                    <div
                      className={`avatar-wrapper classic_shadow ${isEditing ? 'cursor-pointer' : 'non-editable'}`}
                      onClick={handleAvatarSelectClick}
                    >
                      <div
                        className="avatar-img inset_shadow"
                        style={{
                          backgroundImage: `url(${displayAvatar})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      {isEditing && (
                        <div className="avatar-overlay">
                          <div className="edit-text">编辑头像</div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={onAvatarFileChange}
                      accept="image/*"
                      hidden
                    />
                  </div>

                  <div className="info-area">
                    <div className="nickname-row">
                      {isEditing ? (
                        <input
                          type="text"
                          className="nickname-input"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          maxLength={20}
                          placeholder="昵称"
                        />
                      ) : (
                        <div className="nickname-display">{form.username || '未知用户'}</div>
                      )}
                      <div className="uuid-text">UUID: {user?.uuid || '------'}</div>
                    </div>
                    <div className="signature-row">
                      {isEditing ? (
                        <textarea
                          className="signature-textarea"
                          value={form.signature}
                          onChange={(e) => setForm({ ...form, signature: e.target.value })}
                          maxLength={150}
                          rows={3}
                          placeholder="签名"
                        />
                      ) : (
                        <div className="signature-display">
                          {form.signature || '什么都没有啊。也就是说，很神秘呢...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-area">
                  <div className="bg-label">背景图片</div>
                  <div
                    className={`bg-wrapper classic_shadow ${isEditing ? 'cursor-pointer' : 'non-editable'}`}
                    onClick={handleBgSelectClick}
                    style={{
                      backgroundImage: `url(${displayBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {isEditing && (
                      <div className="bg-overlay">
                        <div className="edit-text">编辑背景</div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={bgInputRef}
                    onChange={onBgFileChange}
                    accept="image/*"
                    hidden
                  />
                </div>

                <div className="button-area">
                  <button className="action-btn" onClick={toggleEditMode} disabled={isUploading}>
                    {isEditing ? (isUploading ? '保存中...' : '保存信息') : '编辑信息'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageCropperModal
        visible={showAvatarCropper}
        imageFile={avatarFileToCrop}
        aspectRatio={1}
        mode="avatar"
        onCropComplete={handleAvatarCropComplete}
        onClose={() => setShowAvatarCropper(false)}
      />
      <ImageCropperModal
        visible={showBgCropper}
        imageFile={bgFileToCrop}
        aspectRatio={16 / 9}
        mode="background"
        onCropComplete={handleBgCropComplete}
        onClose={() => setShowBgCropper(false)}
      />
    </div>
  );
}

export default UserSettings;