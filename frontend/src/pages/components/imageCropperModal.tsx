import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.min.css';
import './ImageCropperModal.css';

interface ImageCropperModalProps {
  visible: boolean;
  imageFile: File | null;
  aspectRatio?: number;         // 裁剪比例，如 1 或 16/9
  mode?: 'avatar' | 'cover' | 'background';  // 新增模式，用于区分标题
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  onClose: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  visible,
  imageFile,
  aspectRatio = 16 / 9,
  mode,
  onCropComplete,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [croppedPreview, setCroppedPreview] = useState<string>('');
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const cropperRef = useRef<ReactCropperElement>(null);

  // 根据 mode 或比例生成标题
  const getTitleText = () => {
    if (mode) {
      switch (mode) {
        case 'avatar': return '裁剪头像';
        case 'cover': return '裁剪封面';
        case 'background': return '裁剪背景';
        default: return '裁剪图片';
      }
    }
    // 兼容无 mode 的情况（根据比例判断）
    if (aspectRatio === 1) return '裁剪头像';
    if (Math.abs(aspectRatio - 16 / 9) < 0.01) return '裁剪封面';
    return '裁剪图片';
  };

  const getSubtitleText = () => {
    const ratioText = (() => {
      if (aspectRatio === 1) return '1:1';
      if (Math.abs(aspectRatio - 16 / 9) < 0.01) return '16:9';
      return `${aspectRatio.toFixed(2)}:1`;
    })();
    return `请确保重要内容在 ${ratioText} 比例框内`;
  };

  const titleText = getTitleText();
  const subtitleText = getSubtitleText();

  // 更新预览（右侧小图）
  const updatePreview = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    try {
      const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400 / aspectRatio,
        fillColor: '#ffffff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      setCroppedPreview(canvas.toDataURL('image/jpeg', 0.9));
    } catch (error) {
      console.error('预览生成失败', error);
    }
  }, [aspectRatio]);

  // 加载图片
  useEffect(() => {
    if (visible && imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageSrc(src);
        const img = new Image();
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.src = src;
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImageSrc('');
      setCroppedPreview('');
      setOriginalSize({ width: 0, height: 0 });
    }
  }, [visible, imageFile]);

  const onReady = () => {
    updatePreview();
  };

  const onCrop = () => {
    updatePreview();
  };

  const zoomIn = () => {
    const cropper = cropperRef.current?.cropper;
    cropper?.zoom(0.1);
  };
  const zoomOut = () => {
    const cropper = cropperRef.current?.cropper;
    cropper?.zoom(-0.1);
  };
  const rotateLeft = () => {
    const cropper = cropperRef.current?.cropper;
    cropper?.rotate(-90);
    setTimeout(updatePreview, 100);
  };
  const rotateRight = () => {
    const cropper = cropperRef.current?.cropper;
    cropper?.rotate(90);
    setTimeout(updatePreview, 100);
  };
  const resetCrop = () => {
    const cropper = cropperRef.current?.cropper;
    cropper?.reset();
    setTimeout(updatePreview, 100);
  };

  const confirmCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper || !croppedPreview || isProcessing) return;
    setIsProcessing(true);
    try {
      const canvas = cropper.getCroppedCanvas({
        width: 1600,
        height: 1600 / aspectRatio,
        fillColor: '#ffffff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = Date.now();
            const originalName = imageFile?.name || 'image';
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            const croppedFileName = `${nameWithoutExt}_cropped_${timestamp}.jpg`;
            const croppedFile = new File([blob], croppedFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            onCropComplete(croppedFile, croppedPreview);
            onClose();
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('裁剪失败', error);
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="cropper-modal-overlay" onClick={onClose}>
      <div className="cropper-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <div>
            <h3 className="cropper-title">{titleText}</h3>
            <p className="cropper-subtitle">{subtitleText}</p>
          </div>
          <button className="cropper-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="cropper-body">
          <div className="cropper-left">
            <div className="cropper-crop-area">
              <Cropper
                ref={cropperRef}
                src={imageSrc}
                style={{ width: '100%', height: '100%' }}
                aspectRatio={aspectRatio}
                viewMode={1}
                dragMode="move"
                guides={true}
                center={true}
                highlight={true}
                cropBoxMovable={true}
                cropBoxResizable={true}
                toggleDragModeOnDblclick={false}
                ready={onReady}
                crop={onCrop}
              />
            </div>
            <div className="cropper-toolbar">
              <button onClick={resetCrop}>重置</button>
              <button onClick={zoomIn}>放大</button>
              <button onClick={zoomOut}>缩小</button>
              <button onClick={rotateLeft}>左旋</button>
              <button onClick={rotateRight}>右旋</button>
            </div>
          </div>

          <div className="cropper-right">
            <div className="cropper-preview">
              <h4>预览效果</h4>
              <div
                className="cropper-preview-box"
                style={{ aspectRatio: `${aspectRatio}` }}
              >
                {croppedPreview ? (
                  <div
                    style={{
                      backgroundImage: `url(${croppedPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                ) : (
                  <div className="cropper-preview-placeholder">
                    <span>调整图片后显示预览</span>
                  </div>
                )}
              </div>
            </div>

            <div className="cropper-info">
              <h4>图片信息</h4>
              {originalSize.width > 0 && (
                <>
                  <p>原始尺寸: {originalSize.width} × {originalSize.height}</p>
                  <p>原始比例: {(originalSize.width / originalSize.height).toFixed(2)} : 1</p>
                  <p>目标比例: {aspectRatio === 1 ? '1:1' : '16:9'}</p>
                </>
              )}
            </div>

            <div className="cropper-actions">
              <button className="cropper-btn-cancel" onClick={onClose}>
                取消
              </button>
              <button
                className="cropper-btn-confirm"
                onClick={confirmCrop}
                disabled={!croppedPreview || isProcessing}
              >
                {isProcessing ? '处理中...' : '确认裁剪'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;