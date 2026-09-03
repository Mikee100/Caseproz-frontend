import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const { login, user, googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect') || '/';

    const ui = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '22px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        },
        card: {
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
            padding: '28px 24px',
        },
        heading: {
            fontSize: '24px',
            fontWeight: 800,
            color: '#111827',
            margin: 0,
            lineHeight: 1.2,
        },
        subheading: {
            fontSize: '13px',
            color: '#6b7280',
            margin: '6px 0 0',
        },
        fieldLabel: {
            display: 'block',
            marginBottom: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
        },
        input: {
            width: '100%',
            padding: '10px 11px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: '#fff',
        },
        button: {
            width: '100%',
            padding: '11px 12px',
            backgroundColor: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
        },
    };

    useEffect(() => {
        if (user) {
            navigate(redirect);
        }
    }, [navigate, user, redirect]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const data = await googleLogin(credentialResponse.credential);
            if (data && data.success) {
                setSuccessMsg(data.message);
            } else if (data.isNewUser) {
                navigate(`/complete-profile?redirect=${redirect}`);
            } else {
                navigate(redirect);
            }
        } catch (err) {
            setError(err.message || 'Google login failed');
        }
    };

    if (successMsg) {
        return (
            <div className="login-container" style={ui.page}>
                <div className="login-card" style={{ ...ui.card, textAlign: 'center', maxWidth: '440px' }}>
                    <div
                        style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '999px',
                            backgroundColor: '#ecfdf3',
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px',
                            color: '#166534',
                            fontSize: '20px',
                        }}
                    >
                        <i className="far fa-envelope"></i>
                    </div>
                    <h1 style={ui.heading}>Check your email</h1>
                    <p style={{ ...ui.subheading, marginTop: '10px', marginBottom: '16px', lineHeight: 1.5 }}>{successMsg}</p>
                    <button onClick={() => setSuccessMsg('')} style={ui.button}>
                        Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container" style={ui.page}>
            <div className="login-card" style={ui.card}>
                <div style={{ textAlign: 'left', marginBottom: '18px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <Link
                            to="/"
                            style={{
                                fontSize: '18px',
                                fontWeight: 800,
                                color: '#111827',
                                textDecoration: 'none',
                            }}
                        >
                            CASEPROZ
                        </Link>
                    </div>
                    <h1 style={ui.heading}>Login</h1>
                    <p style={ui.subheading}>Sign in to continue to your account.</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        marginBottom: '14px',
                        fontSize: '12px',
                        border: '1px solid #fee2e2',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={ui.fieldLabel}>Email address</label>
                        <input
                            type="email"
                            placeholder="mail@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={ui.input}
                            className="auth-input"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={ui.fieldLabel}>Password</label>
                            <Link
                                to="/forgot-password"
                                style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                            >
                                Forgot?
                            </Link>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={ui.input}
                            className="auth-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...ui.button, marginTop: '10px', marginBottom: '16px', opacity: loading ? 0.75 : 1 }}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 14px', color: '#9ca3af' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                </div>

                <div style={{ width: '100%' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Authentication Failed')}
                        useOneTap
                        width="100%"
                        shape="rectangular"
                        theme="outline"
                        text="signin_with"
                    />
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                    New here?{' '}
                    <Link
                        to={`/register?redirect=${redirect}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}
                    >
                        Create an account
                    </Link>
                </div>
            </div>

            <style>{`
                .auth-input:focus {
                    border-color: #111827 !important;
                    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
                }
            `}</style>
        </div>
    );
};

export default Login;
