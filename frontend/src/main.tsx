import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import HomeShowPage from './pages/homePages/homeShowPage';

/**
 * 代码分割原则：
 * - 首屏路由（首页 + 布局）保持静态导入，避免「先下入口 → 再下首屏 chunk」的瀑布
 * - 其余路由用 lazy() 动态导入，进到那个页面才下载对应代码
 */
const AuthLayout = lazy(() => import('./pages/auth/AuthLayout'));
const Login = lazy(() => import('./pages/auth/LoginForm'));
const Register = lazy(() => import('./pages/auth/RegisterForm'));
const ForgetPassword = lazy(() => import('./pages/auth/ForgetPasswordForm'));
const UserCenter = lazy(() => import('./pages/userPages/userCenter'));
const UserSettings = lazy(() => import('./pages/userPages/components/userSettings'));
const UserWorks = lazy(() => import('./pages/userPages/components/userWorks'));
const UserHome = lazy(() => import('./pages/userPages/components/userHome'));
const ManagePage = lazy(() => import('./pages/managePages/managePage'));
const EssayDetailPage = lazy(() => import('./pages/essayPages/essayDetailPage'));
const ModelPage = lazy(() => import('./pages/modelPages/modelPage'));

import './index.css';

// 路由切换时的占位：保持背景不变，只留一点空白，避免白屏闪烁
function RouteFallback() {
  return <div style={{ minHeight: '100vh' }} aria-busy="true" />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomeShowPage />} />
            <Route path="userCenter" element={<UserCenter />} >
              <Route path="userSettings" element={<UserSettings/>}/>
              <Route path="userWorks" element={<UserWorks/>}/>
              <Route path="userHome" element={<UserHome/>}/>
            </Route>
            <Route path='/managePage' element={<ManagePage />}>
            </Route>
            <Route path="/essay/:id" element={<EssayDetailPage />} />
          </Route>
          <Route path="/modelPage" element={<ModelPage />} />
          <Route path="/auth" element={<AuthLayout/>}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forget-password" element={<ForgetPassword />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
