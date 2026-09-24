import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../utils/apiClient';
import LoadingState from '../components/LoadingState';

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState('');
    const reference = searchParams.get('reference');
    const missingReferenceError = reference ? '' : 'The payment reference is missing.';

    useEffect(() => {
        if (!reference) return undefined;

        let active = true;
        const checkPayment = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/payments/paystack/${encodeURIComponent(reference)}`);
                if (!active) return;
                setPayment(data);
                if (data.status === 'SUCCESS') sessionStorage.removeItem('paystackPendingOrderId');
            } catch (requestError) {
                if (!active) return;
                setError(requestError instanceof ApiError ? requestError.message : 'Unable to confirm your payment.');
            }
        };

        checkPayment();
        return () => { active = false; };
    }, [reference]);

    const displayError = missingReferenceError || error;
    if (!payment && !displayError) return <LoadingState message="Confirming your payment..." />;

    const isSuccess = payment?.status === 'SUCCESS';
    const orderPath = payment?.orderId ? `/order/${payment.orderId}` : '/orders';
    const message = isSuccess
        ? 'Payment confirmed. Your order is now being processed.'
        : payment?.status === 'FAILED'
            ? 'Your payment was not completed. Your order remains unpaid.'
            : 'Your payment is still processing. Refresh this page shortly to check again.';

    return (
        <div className="container" style={{ maxWidth: '620px', padding: '64px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>{isSuccess ? 'Payment confirmed' : 'Payment status'}</h1>
            <p style={{ color: displayError ? '#b91c1c' : '#374151', marginBottom: '24px' }}>{displayError || message}</p>
            <Link to={orderPath} className="checkout-place-order-btn" style={{ display: 'inline-block', padding: '12px 20px', textDecoration: 'none' }}>
                View order
            </Link>
        </div>
    );
};

export default PaymentCallback;