import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Navigate,Link,Outlet} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {AuthProvider,ToastProvider,CartProvider,WishProvider,useAuth} from './contexts/AppContext';
import {Layout} from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout,{Success} from './pages/Checkout';
import {Login,Register,Forgot,Reset} from './pages/AuthPages';
import Account from './pages/Account';
import {Orders,OrderDetail} from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Admin from './admin/Admin';
import SEO from './components/SEO';
import './index.css';
function Protected({children,admin=false}){
 const {user,loading}=useAuth();
 if(loading)return <div className="min-h-screen grid place-items-center text-orangeTech font-black">Đang xác thực tài khoản TECH...</div>;
 if(!user)return <Navigate replace to="/dang-nhap" state={{from:window.location.pathname}}/>;
 if(admin&&user.role!=='admin')return <Navigate to="/" replace/>;
 return children;
}
function ShopLayout(){return <Layout><Outlet/></Layout>}
function NotFound(){return <div className="container-tech text-center py-28"><SEO title="Không tìm thấy trang | TECH"/><p className="text-[110px] font-black leading-none text-orangeTech">404</p><h1 className="text-2xl font-black text-navy mt-4">Không tìm thấy trang</h1><p className="text-sm text-slate-500 mt-3">Địa chỉ bạn truy cập không tồn tại hoặc đã được thay đổi.</p><Link to="/" className="btn-primary mt-7">Về trang chủ</Link></div>}
function App(){return <Routes>
 <Route path="/admin/*" element={<Protected admin><Admin/></Protected>}/>
 <Route element={<ShopLayout/>}>
  <Route path="/" element={<Home/>}/>
  <Route path="/san-pham" element={<Catalog/>}/>
  <Route path="/san-pham/:slug" element={<ProductDetail/>}/>
  <Route path="/gio-hang" element={<Cart/>}/>
  <Route path="/yeu-thich" element={<Wishlist/>}/>
  <Route path="/dang-nhap" element={<Login/>}/>
  <Route path="/dang-ky" element={<Register/>}/>
  <Route path="/quen-mat-khau" element={<Forgot/>}/>
  <Route path="/dat-lai-mat-khau/:token" element={<Reset/>}/>
  <Route path="/thanh-toan" element={<Protected><Checkout/></Protected>}/>
  <Route path="/dat-hang-thanh-cong/:id" element={<Protected><Success/></Protected>}/>
  <Route path="/tai-khoan" element={<Protected><Account/></Protected>}/>
  <Route path="/don-hang" element={<Protected><Orders/></Protected>}/>
  <Route path="/don-hang/:id" element={<Protected><OrderDetail/></Protected>}/>
  <Route path="*" element={<NotFound/>}/>
 </Route>
 </Routes>}
createRoot(document.getElementById('root')).render(<React.StrictMode><HelmetProvider><BrowserRouter><ToastProvider><AuthProvider><WishProvider><CartProvider><App/></CartProvider></WishProvider></AuthProvider></ToastProvider></BrowserRouter></HelmetProvider></React.StrictMode>);
