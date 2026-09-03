import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [newsletterOptIn, setNewsletterOptIn] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');

    const { register, user, googleLogin } = useAuth();
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
            maxWidth: '520px',
            backgroundColor: '#fff',
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
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await register({
                name,
                email,
                password,
                phone,
                city,
                address,
                newsletterOptIn,
            });
            
            // Check if register returned a success without token (Email verification needed)
            if (data && data.success) {
                setSuccessMsg(data.message);
            }
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
            setError(err.message || 'Google Sign Up Failed');
        }
    };

    if (successMsg) {
        return (
            <div className="register-container" style={ui.page}>
                <div className="register-card" style={{ ...ui.card, textAlign: 'center', maxWidth: '440px' }}>
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
                    <Link to="/login" style={{ ...ui.button, display: 'block', textDecoration: 'none' }}>
                        Go to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container" style={ui.page}>
            <div className="register-card" style={ui.card}>
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
                    <h1 style={ui.heading}>Create account</h1>
                    <p style={ui.subheading}>Register with your details to continue.</p>
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

                <div style={{ width: '100%', marginBottom: '14px' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign Up Failed')}
                        useOneTap
                        width="100%"
                        shape="rectangular"
                        theme="outline"
                        text="signup_with"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 14px', color: '#9ca3af' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={ui.fieldLabel}>Full name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={ui.input}
                                className="auth-input"
                                required
                            />
                        </div>

                        <div>
                            <label style={ui.fieldLabel}>Email address</label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={ui.input}
                                className="auth-input"
                                required
                            />
                        </div>

                        <div>
                            <label style={ui.fieldLabel}>Mobile number</label>
                            <input
                                type="tel"
                                placeholder="e.g. 0712 345 678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={ui.input}
                                className="auth-input"
                                required
                            />
                        </div>

                        <div>
                            <label style={ui.fieldLabel}>City or town</label>
                            <input
                                type="text"
                                placeholder="Nairobi"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                style={ui.input}
                                className="auth-input"
                                required
                            />
                        </div>

                        <div>
                            <label style={ui.fieldLabel}>Password</label>
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

                        <div>
                            <label style={ui.fieldLabel}>Confirm password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={ui.input}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={ui.fieldLabel}>Delivery address (optional)</label>
                        <textarea
                            placeholder="Estate, Street, House No."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ ...ui.input, minHeight: '80px', resize: 'vertical' }}
                            className="auth-input"
                        />
                    </div>

                    <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            id="newsletter"
                            type="checkbox"
                            checked={newsletterOptIn}
                            onChange={(e) => setNewsletterOptIn(e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                        />
                        <label htmlFor="newsletter" style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>
                            Send me updates and offers.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...ui.button, opacity: loading ? 0.75 : 1 }}
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                    Already have an account?{' '}
                    <Link
                        to={`/login?redirect=${redirect}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}
                    >
                        Sign in
                    </Link>
                </div>
            </div>

            <style>{`
                .auth-input:focus {
                    border-color: #111827 !important;
                    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default Register;
