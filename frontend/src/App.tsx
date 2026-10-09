import './App.css'
import { useState } from 'react';
import { motion , AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import Loge from './pages/components/loge.tsx'
import { Search , Bell ,User, Sun ,UserRoundPlus ,KeyRound ,LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { getFullImageUrl } from './utils/imageUtils';
import Toast from './pages/components/Toast.tsx';
import AppBackground from './pages/components/AppBackground';

function ChangeShowPageButton({ 
  target, 
  goTo, 
  shouldTurnBlack = false
}: { 
  target: string; 
  goTo: () => void; 
  shouldTurnBlack?: boolean;
}) {
  return (
    <button 
      className={`change-showPage-button ${shouldTurnBlack ? 'text-black' : 'text-white'}`}
      onClick={goTo}
    >
      {target}
    </button>
  );
}

function UserCardButton({ onLoginClick }: { onLoginClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const token = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const isLogin = !!token;


return (
    <div
      className="little-button-SAU"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <User className="icon" />

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -15 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
          >
            <UserCard shouldShow={true} isLogin={isLogin} user = {user} onLoginClick={onLoginClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchButton({
  search,
}: {
  search: () => void;
}) {
    return (
      <button  className='little-button-SAU' onClick={search} >
        <Search className="icon"></Search>
      </button>
    )
}

function MessageButton({
  message,
}:{
  message: () => void;
}) {
      return (
      <button className='little-button-MAS' onClick={message}>
        <Bell className="icon"></Bell>
      </button>
    )
}

function SunnyButton({
  changeTheme,
}:{
  changeTheme: () => void
}) {
      return (
      <button className='little-button-MAS' onClick={changeTheme}>
        <Sun className="icon"></Sun>
      </button>
    )
}

function GoToManagePageButton({ }: { goTo: () => void }) {
  const navigate = useNavigate();

  const goToCreatePage = () => {
    navigate('/createPage');
  };

  return (
    <button className="goto-manage-btn" onClick={goToCreatePage}>
      <div className="btn-inner">
        <div className="btn-text text-publish">发 布</div>
        <div className="btn-text text-omg">OMG!</div>
      </div>
    </button>
  );
}

/* 顶部小图标按钮组件(ED) */

/* 用户卡片 */
function UserCard({
  shouldShow = true,
  isLogin = false,
  user,
  onLoginClick,
}: {
  shouldShow?: boolean;
  isLogin?: boolean;
  user?: any;
  onLoginClick?: () => void;
}) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);

  if (!shouldShow) return null;

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  // 用户中心（暂时仅控制台输出）
  const handleUserCenter = () => {
    navigate('/userCenter');
  };

  // 获取完整的图片 URL
  const avatarUrl = getFullImageUrl(user?.avatar);
  const backgroundUrl = getFullImageUrl(user?.backgroundImage);

  return (
    <div className='user-card floating-user-card'>
      {isLogin && user ? (
        <div className='isLogin'>
          {/* 背景图区域 */}
          <div
            className="user-card-bg"
            style={{
              backgroundImage: `url(${backgroundUrl || '/default-bg.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='contentBox'>
            {/* 头像 */}
            <div className="avatar-wrapper">
              <div
                className="avatar"
                style={{
                  backgroundImage: `url(${avatarUrl || '/default-avatar.png'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            {/* 用户名 */}
            <div className="username">{user.username || '未知用户'}</div>
            {/* UUID */}
            <div className="uuid">ID: {user.uuid || '无'}</div>
            {/* 签名 */}
            <div className="signature">{user.signature || '什么都没有啊。也就是说，很神秘呢...'}</div>
            {/* 操作按钮 */}
            <div className="action-buttons">
              <button className="user-center-btn" onClick={handleUserCenter}>
                用户中心
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} /> 退出登录
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className='isNotLogin'>
          <div className='contentBox'>
            <div className='flex justify-center items-center w-full'>
              <ShowLoginButton showButton={onLoginClick || (() => {})} />
              <ShowRegisterButton showButton={() => {}} />
              <ShowForgetPasswordButton showButton={() => {}} />
            </div>
            <div className='w-full h-[30px] mt-[5px] flex items-center justify-center'></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 离线用户按钮 */

function ShowLoginButton(
  {
    showButton,
  }:{
    showButton:() => void;
  }
) {

  const navigate = useNavigate();
return(
  <div>
  <button className='OffLineButton ShowLoginButton' onClick={() => navigate('/auth/login')}>
    <div className='insideBox'>
      <User className='icon'></User>
    </div>
  <div className='text'>登录</div>
  </button>
  </div>
)
}

function ShowRegisterButton(
  {
    showButton,
  }:{
    showButton:() => void;
  }
) {

  const navigate = useNavigate();


return(
  <div>
  <button className='OffLineButton ShowRegisterButton'  onClick={() => navigate('/auth/register')}>
    <div className='insideBox'>
      <UserRoundPlus className='icon'></UserRoundPlus>
    </div>
    <div className='text'>注册</div>
  </button>
  </div>
)
}

function ShowForgetPasswordButton(
  {
    showButton,
  }:{
    showButton:() => void;
  }
) {

  const navigate = useNavigate();

return(
  <div>
  <button className='OffLineButton ShowForgetPasswordButton'  onClick={() => navigate('/auth/forget-password')}>
    <div className='insideBox'>
      <KeyRound className='icon'></KeyRound>
    </div>
      <div className='text'>忘记密码</div>
  </button>
  </div>
)
}
/* 离线用户按钮(ED) */


/* 用户卡片(ED) */




function App() {
  return (
    <div className="all">
      {/* 背景 */}
      <AppBackground />
      {/* 背景(ED) */}

      {/* 提示框 */}
      <Toast />
      {/* 提示框(ED) */}

      {/* 总框 */}
      <div className="content bg-slate-700/10">
        {/* 顶部浮框sticky */}
        <div className="top bottom_shadow">
          {/* 顶部左边*/}
          <div className='left'>
          <div className='logo-wrapper'>
            <Loge/>
          </div>
          <ChangeShowPageButton 
            target="ESSAY" 
            goTo={() => {}} 
            shouldTurnBlack={false} 
          />
          <ChangeShowPageButton 
            target="VIDEO" 
            goTo={() => {}} 
            shouldTurnBlack={false} 
          />
          <ChangeShowPageButton 
            target="CSS" 
            goTo={() => {}} 
            shouldTurnBlack={false} 
          />
          </div>
          {/* 顶部左边(ED)*/}

          {/* 顶部右边*/}
          <div className='right'>
          {/* 搜索按钮*/}
            <SearchButton search={() => {}} />
          {/* 搜索按钮(ED)*/}

            <div className='text-white/70 mr-2.5'>|</div>
          {/* 用户卡片按钮*/}
            <UserCardButton onLoginClick={()  => {}} />
          {/* 用户卡片按钮(ED)*/}

            <div className='w-5'></div>
          
          {/* 消息按钮*/}
            <MessageButton message={() => {}}/>
          {/* 消息按钮(ED)*/}

          {/* 主题切换按钮*/}
            <SunnyButton changeTheme={() => {}}/>
          {/* 主题切换按钮(ED)*/}

          {/* 前往编辑页按钮*/}
            <GoToManagePageButton goTo={() => {}}/>
          {/* 前往编辑页按钮(ED)*/}
          
          </div>
          {/* 顶部右边(ED)*/}


        </div>
        {/* 顶部浮框sticky(ED) */}
        {/* 切换内容Show */}
        <div className="ChangeContent">

          <Outlet />
        </div>
        {/* 切换内容Show(ED) */}
        {/* 底部框 */}
        <div className="bottom top_shadow">
          {/* 底部顶部*/}  
          <div className='bottom-top'>
            <div className='loge-box'>
              <Loge shouldTurnBlack={true} />
            </div>
          </div>
          {/* 底部顶部(ED)*/}  
        
        </div>
        {/* 底部框(ED) */}
      </div>
      {/* 总框(ED) */}

    </div>
  )
}

export default App