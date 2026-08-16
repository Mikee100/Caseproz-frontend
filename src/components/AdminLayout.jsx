import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
    { to: '/admin/dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
    { to: '/admin/health', icon: 'fas fa-heartbeat', label: 'System Health' },
    { to: '/admin/productlist', icon: 'fas fa-box', label: 'Products' },
    { to: '/admin/orderlist', icon: 'fas fa-shopping-cart', label: 'Orders' },
    { to: '/admin/userlist', icon: 'fas fa-users', label: 'Users' },
    { to: '/admin/discounts', icon: 'fas fa-tags', label: 'Discounts' },
    { to: '/admin/categories-brands', icon: 'fas fa-layer-group', label: 'Categories & Brands' },
    { to: '/admin/home-sections', icon: 'fas fa-th-large', label: 'Home Sections' },
    { to: '/admin/merchandising-diagnostics', icon: 'fas fa-magnifying-glass-chart', label: 'Merchandising Diagnostics' },
    { to: '/admin/delivery-routes', icon: 'fas fa-route', label: 'Delivery Routes' },
    { to: '/admin/settings', icon: 'fas fa-cog', label: 'Site Settings' },
];

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Remove the storefront header gap for admin routes
    useEffect(() => {
        const prevPaddingTop = document.body.style.paddingTop;
        const prevBg = document.body.style.backgroundColor;

        document.body.style.paddingTop = '0px';
        document.body.style.backgroundColor = '#f4f7f6';

        return () => {
            document.body.style.paddingTop = prevPaddingTop;
            document.body.style.backgroundColor = prevBg;
        };
    }, []);


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarWidth = isCollapsed ? '70px' : '232px';

    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarWidth,
                backgroundColor: '#161618',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 1000,
                transition: 'width 0.3s ease',
                boxShadow: '6px 0 20px rgba(0,0,0,0.12)'
            }}>
                <div style={{ 
                    padding: isCollapsed ? '20px 8px' : '20px 14px', 
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between'
                }}>
                    {!isCollapsed && (
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.04em', color: '#E41E26', margin: 0, lineHeight: 1.1 }}>
                                CASEPROZ
                            </h2>
                            <p style={{ margin: '3px 0 0 0', color: '#9ca3af', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Admin Panel
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{
                            background: '#232328',
                            border: '1px solid #323238',
                            color: '#d1d5db',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className={`fas fa-${isCollapsed ? 'indent' : 'outdent'}`}></i>
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '12px 8px', overflowX: 'hidden', overflowY: 'auto' }}>
                    {adminLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            title={link.label}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                gap: '10px',
                                padding: isCollapsed ? '12px 10px' : '12px 14px',
                                marginBottom: '6px',
                                color: isActive ? 'white' : '#b5b7bd',
                                textDecoration: 'none',
                                backgroundColor: isActive ? '#E41E26' : 'transparent',
                                border: isActive ? '1px solid #ee4c54' : '1px solid transparent',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: isActive ? 700 : 600,
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            })}
                        >
                            <i className={link.icon} style={{ minWidth: '18px', textAlign: 'center', fontSize: '14px' }}></i>
                            {!isCollapsed && (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {link.label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: isCollapsed ? '12px 8px 14px' : '14px', borderTop: '1px solid #333' }}>
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? "Logout" : ""}
                        style={{
                            width: '100%',
                            padding: isCollapsed ? '10px' : '10px 12px',
                            backgroundColor: '#222226',
                            color: '#d1d5db',
                            border: '1px solid #333943',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            gap: '8px',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                    {!isCollapsed && (
                        <NavLink to="/" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#9ca3af', fontSize: '12px', textDecoration: 'none' }}>
                            Back to Store
                        </NavLink>
                    )}
                    {isCollapsed && (
                         <NavLink to="/" title="Back to Store" style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: '#9ca3af', fontSize: '16px', textDecoration: 'none' }}>
                             <i className="fas fa-store"></i>
                         </NavLink>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                padding: '32px', 
                marginLeft: sidebarWidth,
                transition: 'margin-left 0.3s ease'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
