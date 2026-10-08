import { useEffect, useRef } from 'react';
import { Live2DViewer } from '@seayoo-web/pixi-live2d';
import './live2dStage.css';

interface Live2dStageProps {
  onModelReady?: (model: any) => void;   
}

function Live2dStage({ onModelReady }: Live2dStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const viewer = new Live2DViewer(canvasRef.current, {
      modelPath: '/live2d/Hiyori/runtime/hiyori_pro_t11.model3.json',
      scale: 1.7,
      x: -11000,
      y: -2500,
      // ⬇️ 新增：模型加载完成后，把模型实例传出去
      onModelLoaded: (model: any) => {
        console.log('✅ Live2D 模型已加载', model);
        console.log('📋 模型所有 key:', Object.keys(model));
        console.log('📋 internalModel:', model?.internalModel);
        console.log('📋 coreModel:', model?.internalModel?.coreModel);
        
        if (model?.internalModel?.coreModel?._parameterIds) {
          console.log('📋 模型参数列表:', model.internalModel.coreModel._parameterIds);
        }


        if (onModelReady) onModelReady(model);
      },
      onModelError: (err: any) => console.error('❌ Live2D 加载失败:', err),
    });

    return () => viewer.destroy();
  }, [onModelReady]);

  return (
    <div className="live2dStage">
      {/* 背景层 */}
      <div className="bg-layer">
        <div className="bg-white" />
        <div className="bg-ellipse ellipse-1" />
        <div className="bg-ellipse ellipse-2" />
        <div className="bg-ellipse ellipse-3" />
        <div className="bg-blur" />
      </div>

      {/* Live2D 渲染层 */}
      <canvas ref={canvasRef} />
    </div>
  );
}

export default Live2dStage;