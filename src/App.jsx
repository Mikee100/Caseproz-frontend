import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Cart from './pages/Cart'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import OrderDetails from './pages/OrderDetails'
import Category from './pages/Category'
import Search from './pages/Search'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Favourites from './pages/Favourites'
import Contact from './pages/Contact'
import Delivery from './pages/Delivery'
import Returns from './pages/Returns'
import Faq from './pages/Faq'
import CustomerSupport from './pages/CustomerSupport'
import CompleteProfile from './pages/CompleteProfile'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ErrorBoundary from './components/ErrorBoundary'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/AdminLayout'
import ProductList from './pages/Admin/ProductList'
import ProductEdit from './pages/Admin/ProductEdit'
import Dashboard from './pages/Admin/Dashboard'
import OrderList from './pages/Admin/OrderList'
import UserList from './pages/Admin/UserList'
import UserEdit from './pages/Admin/UserEdit'
import SiteSettings from './pages/Admin/SiteSettings'
import Discounts from './pages/Admin/Discounts'
import OrderDetailsAdmin from './pages/Admin/OrderDetailsAdmin'
import AdminCategoriesBrands from './pages/Admin/AdminCategoriesBrands'
import HomeSections from './pages/Admin/HomeSections'
import DeliveryRoutes from './pages/Admin/DeliveryRoutes'
import RouteSeo from './components/RouteSeo'

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/complete-profile' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/verify');

  // Always reset scroll position to top when navigating to a new route
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <ErrorBoundary>
      <div className={`app ${isAuthRoute ? 'auth-layout' : ''} ${isAdminRoute ? 'admin-layout' : ''}`}>
        {!isAdminRoute && <RouteSeo />}
        {!isAdminRoute && !isAuthRoute && (
          <Header isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
        )}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/category/:categoryName" element={<Category />} />
            <Route path="/search" element={<Search />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/customer-support" element={<CustomerSupport />} />

            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orderlist" element={<OrderList />} />
                <Route path="order/:id" element={<OrderDetailsAdmin />} />
                <Route path="userlist" element={<UserList />} />
                <Route path="user/:id/edit" element={<UserEdit />} />
                <Route path="productlist" element={<ProductList />} />
                <Route path="product/create" element={<ProductEdit />} />
                <Route path="product/:id/edit" element={<ProductEdit />} />
                <Route path="settings" element={<SiteSettings />} />
                <Route path="discounts" element={<Discounts />} />
                <Route path="categories-brands" element={<AdminCategoriesBrands />} />
                <Route path="home-sections" element={<HomeSections />} />
                <Route path="delivery-routes" element={<DeliveryRoutes />} />
              </Route>
            </Route>
          </Routes>
        </main>
        {!isAdminRoute && !isAuthRoute && <Footer />}
        {!isAdminRoute && !isAuthRoute && (
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
