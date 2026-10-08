import { Outlet } from 'react-router-dom';
import Loge from '../components/loge';
import './Auth.css';

const AuthLayout = () => {
  return (
    <div className="AuthMainPage">
      {/* 底部背景层 */}
      <div className="bottomFloor">
        <div className="image inset_shadow">
          <div className="paster1"></div>
          <div className="paster2"></div>
        </div>
        <div className="blank">
          <div className="w-[17px] border-r-2 border-slate-600/60"></div>
          <div className="paper"></div>
        </div>
      </div>

      {/* 内容层 */}
      <div className="contentBox">
        <div className="top bottom_shadow">
          <div className="left-content">
            <Loge shouldTurnBlack={true} />
          </div>
          <div className="right-content">
            <div className="text">关于我们</div>
          </div>
        </div>

        <div className="bottom">
          <div className="left"></div>
          <div className="right">
            <div className="paper-stack">
              <div className="paper paper-1" />
              <div className="paper paper-2" />
              <div className="paper paper-3" />
              <div className="form-container">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;