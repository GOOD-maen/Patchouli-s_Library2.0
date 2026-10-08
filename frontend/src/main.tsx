import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import HomeShowPage from './pages/homePages/homeShowPage';
import AuthLayout from './pages/auth/AuthLayout';
import Login from './pages/auth/LoginForm';
import Register from './pages/auth/RegisterForm'
import ForgetPassword from './pages/auth/ForgetPasswordForm'
import UserCenter from './pages/userPages/userCenter';
import UserInformation from './pages/userPages/components/userInformation';
import UserWorks from './pages/userPages/components/userWorks';
import UserStars from './pages/userPages/components/userStars';
import CreatePage from './pages/createPages/createPage';
import EssayDetailPage from './pages/essayPages/essayDetailPage'
import ModelPage from './pages/modelPages/modelPage';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomeShowPage />} />  
          <Route path="userCenter" element={<UserCenter />} >
            <Route path="userInformation" element={<UserInformation/>}/>
            <Route path="userWorks" element={<UserWorks/>}/>
            <Route path="userStars" element={<UserStars/>}/>
          </Route>
          <Route path='/createPage' element={<CreatePage />}>
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
    </BrowserRouter>
  </React.StrictMode>
);