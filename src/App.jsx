import React, { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ErrorBoundary from './components/ErrorBoundary'
import AdminRoute from './components/AdminRoute'
import RouteSeo from './components/RouteSeo'
import LoadingState from './components/LoadingState'

const Home = lazy(() => import('./pages/Home'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Category = lazy(() => import('./pages/Category'));
const Brand = lazy(() => import('./pages/Brand'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Favourites = lazy(() => import('./pages/Favourites'));
const Contact = lazy(() => import('./pages/Contact'));
const Delivery = lazy(() => import('./pages/Delivery'));
const Returns = lazy(() => import('./pages/Returns'));
const Faq = lazy(() => import('./pages/Faq'));
const CustomerSupport = lazy(() => import('./pages/CustomerSupport'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const AdminLayout = lazy(() => import('./components/AdminLayout'));
const ProductList = lazy(() => import('./pages/Admin/ProductList'));
const ProductEdit = lazy(() => import('./pages/Admin/ProductEdit'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const Health = lazy(() => import('./pages/Admin/Health'));
const OrderList = lazy(() => import('./pages/Admin/OrderList'));
const UserList = lazy(() => import('./pages/Admin/UserList'));
const UserEdit = lazy(() => import('./pages/Admin/UserEdit'));
const SiteSettings = lazy(() => import('./pages/Admin/SiteSettings'));
const Discounts = lazy(() => import('./pages/Admin/Discounts'));
const OrderDetailsAdmin = lazy(() => import('./pages/Admin/OrderDetailsAdmin'));
const AdminCategoriesBrands = lazy(() => import('./pages/Admin/AdminCategoriesBrands'));
const HomeSections = lazy(() => import('./pages/Admin/HomeSections'));
const DeliveryRoutes = lazy(() => import('./pages/Admin/DeliveryRoutes'));
const MerchandisingDiagnostics = lazy(() => import('./pages/Admin/MerchandisingDiagnostics'));
const AuditLog = lazy(() => import('./pages/Admin/AuditLog'));

function RouteFallback() {
  return <LoadingState message="Loading page..." compact />;
}

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
        <RouteSeo />
        {!isAdminRoute && !isAuthRoute && (
          <Header isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
        )}
        <main>
          <Suspense fallback={<RouteFallback />}>
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
              <Route path="/brand/:brandName" element={<Brand />} />
              <Route path="/search" element={<Search />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/customer-support" element={<CustomerSupport />} />

              <Route path="/admin" element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="health" element={<Health />} />
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
                  <Route path="merchandising-diagnostics" element={<MerchandisingDiagnostics />} />
                  <Route path="audit-log" element={<AuditLog />} />
                  <Route path="delivery-routes" element={<DeliveryRoutes />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
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
