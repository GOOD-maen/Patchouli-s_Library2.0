import './userCenter.css'
import { useAuthStore } from '../../stores/useAuthStore';
import { getFullImageUrl } from '../../utils/imageUtils';
import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { authFetch } from '../../utils/request';

import RobotButton from './components/robot_button';

function UserCenter() {
  const user = useAuthStore(state => state.user);
  const avatarUrl = getFullImageUrl(user?.avatar);
  const backgroundUrl = getFullImageUrl(user?.backgroundImage);
  const navigate = useNavigate();
  const location = useLocation();
  const showSweepButton = user?.uuid === '2871521632043014';

  // 定义清理函数
const handleSweep = async () => {
  if (!confirm('确定要执行清理操作吗？这将删除未使用的图片文件，不可恢复。')) return;
  try {
      const response = await authFetch('/api/admin/clean-unused-images', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert('⪩. .⪨清理好了喵，删除了 ' + data.deletedCount + ' 个文件喵');
      } else {
        alert('清理失败: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('请求失败');
    }
};

  const getActiveFromPath = (pathname: string) => {
    if (pathname.includes('/userworks')) return 'works';
    if (pathname.includes('/userstars')) return 'stars';
    if (pathname.includes('/userInformation')) return 'info';
    return 'info';
  };

  const [activeButton, setActiveButton] = useState<'info' | 'works' | 'stars' >(
    () => getActiveFromPath(location.pathname)
  );

  useEffect(() => {
    let targetPath = '';
    if (activeButton === 'info') targetPath = '/userCenter/userInformation';
    else if (activeButton === 'works') targetPath = '/userCenter/userworks';
    else if (activeButton === 'stars') targetPath = '/userCenter/userstars';
    else if (activeButton === 'sweep') console.log("111");

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [activeButton, navigate, location.pathname]);

  useEffect(() => {
    const buttonFromPath = getActiveFromPath(location.pathname);
    if (buttonFromPath !== activeButton) {
      setActiveButton(buttonFromPath);
    }
  }, [location.pathname]);

  const handleButtonClick = (button: 'info' | 'works' | 'stars' ) => {
    setActiveButton(button);
  };

    return (
        <div className='userCenter'>

            <div className='w-full contentBox'>
                <div className='insideContent'>
                        <div className='mainBox'>

                        <div className='userCardAndMenu'>

                          <div className='userCard'>

                            <div style={{
                              backgroundImage: `url(${backgroundUrl || '/default-bg.jpg'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}  className='background-picture'>

                            </div>

                            
                            <div className='information'>

                              <div className='header-name-uuid border-slate-400/30 border-1'>
                                <div className='header border-slate-400/30 border-r-1'>

                                    <div className='inside-content '>
                                        <div  style={{
                                          backgroundImage: `url(${avatarUrl || '/default-bg.jpg'})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          }} className='w-full h-full inset_shadow'></div>
                                    </div>

                                </div>

                                <div className='name-uuid'>        
                                    <div className='name border-slate-400/30 border-1'>
                                          {user?.username || '未知用户'}
                                    </div>
                                    <div className='uuid'>
                                      ID: {user?.uuid || '暂无信息哦~'}
                                    </div>
                                </div>                              
                              </div>

                                <div className='signature'> 
                                  <div className='paper-card'>
                                    <div className='inside-box'>
                                      <div className='signature-content'>
                                        {user?.signature || '什么都没有啊。也就是说，很神秘呢...'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                            </div>

                          </div>
                          {/* 功能选项 */}

                          <div className='function-menu'>

                              <div className='button-box'>

                                <div className='rope'></div>

                                <div  className={`user-information ${activeButton === 'info' ? 'active' : ''}`}
              onClick={() => handleButtonClick('info')}>

                                          <div className='text'>
                                            我
                                          </div>
                                          <div className='text'>
                                            的 
                                          </div>
                                          <div className='text'>
                                            信 
                                          </div>
                                          <div className='text'>
                                            息
                                          </div>                                          
                                </div>
                                
                              </div>

                              <div className='button-box'>
                                <div className='rope'></div>

                                <div  className={`user-works ${activeButton === 'works' ? 'active' : ''} `}
              onClick={() => handleButtonClick('works')}>
                                          <div className='text'>
                                            我
                                          </div>   
                                          <div className='text'>
                                            的
                                          </div> 
                                          <div className='text'>
                                            作
                                          </div> 
                                          <div className='text'>
                                            品
                                          </div> 
                                </div>

                              </div>  

                              <div className='button-box'>
                                <div className='rope'></div>
                                
                                <div className={`user-stars ${activeButton === 'stars' ? 'active' : ''} `}
              onClick={() => handleButtonClick('stars')}>
                                          <div className='text '>
                                            收
                                          </div> 
                                          <div className='text'>
                                            藏
                                          </div> 
                                </div>
                              </div>

                              <div className='content-box'>
                                <div className='robot-box'>
                                    <RobotButton />
                                </div>
                              </div>

                              {showSweepButton && (
                                <div className='button-box sweep'>
                                  <div className='rope'></div>
                                  <div className='user-sweep' onClick={handleSweep}>
                                  <div className='text'>打</div>
                                  <div className='text'>扫</div>
                                  <div className='text'>站</div>
                                  <div className='text'>点</div>
                                </div>
                            </div>
                                )}


                          </div>

                          {/* 功能选项(ED) */}
                          
                          {/* 书架 */}
                          <div className='bookshelf'>
                              <div className=' h4 '></div>
                              <div className='h2'>
                              </div>
                              <div className=' h1 '></div>
                              <div className=' h3 '>

                                <div className='inside-box '>
                                      <div className='h6'>
                                          <div className='h7  inset_shadow'></div>
                                          <div className='h8'></div>

                                      </div>
                                      <div className='h6'>
                                          <div className='h7  inset_shadow'></div>
                                          <div className='h8'></div>

                                      </div>
                                      <div className='h6'>
                                          <div className='h7  inset_shadow'></div>
                                          <div className='h8'></div>

                                      </div>
                                      <div className='h6'>
                                          <div className='h7  inset_shadow'></div>
                                          <div className='h8'></div>

                                      </div>
                                      <div className='h6  inset_shadow'>
                                      </div>
                                </div>

                              </div>
                              <div className=' h5 '></div>
                              
                            
                          </div>
                          {/* 书架(ED) */}

                        </div>

                        <div className='outside-showBox'>
                            <div className='border-box'>
                                <div className='inside-showBox inset_shadow'>

                                  <div className={`label ${activeButton === 'works' ? 'works' : ''}  ${activeButton === 'info' ? 'info' : ''} ${activeButton === 'stars' ? 'stars' : ''}`}>
                                          {activeButton === 'works' && 
                                          <div className="works-label">
                                            <div className='text'>WORKS</div>

                                          </div>}

                                          {activeButton === 'info' && 
                                          <div className="info-label">
                                            <div className='text'>INFO</div>

                                          </div>}

                                          {activeButton === 'stars' && 
                                          <div className="stars-label">
                                            <div className='text'>STARS</div>

                                          </div>}
                                  </div>
                                  <Outlet />


                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}


export default UserCenter;