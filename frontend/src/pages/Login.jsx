import { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';

import { Form, Button, Space, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

import { login, verifyOTP, resendOTP } from '@/redux/auth/actions';
import { selectAuth } from '@/redux/auth/selectors';
import LoginForm from '@/forms/LoginForm';
import Loading from '@/components/Loading';
import AuthModule from '@/modules/AuthModule';
import OTPInput from '@/components/OTPInput';

const { Text, Title } = Typography;

const LoginPage = () => {
  const translate = useLanguage();
  const { isLoading, isSuccess, current } = useSelector(selectAuth);
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);
  const [userData, setUserData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();

  const onFinish = (values) => {
    dispatch(login({ loginData: values }));
  };

  const handleOtpComplete = (otp) => {
    dispatch(verifyOTP({ userId: userData?._id || userData?.userId, otp }));
  };

  const handleResendOtp = () => {
    const userId = userData?._id || userData?.userId;
    if (userId && countdown === 0) {
       dispatch(resendOTP({ userId }));
       setCountdown(180);
    }
  };

  useEffect(() => {
    if (isSuccess && current) {
      if (current.isVerified) {
        navigate('/');
      } else if (!showOtp) {
        setUserData(current);
        setShowOtp(true);
        setCountdown(180);
      }
    }
  }, [isSuccess, current, navigate, showOtp]);

  useEffect(() => {
    let timer;
    if (showOtp && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtp, countdown]);

  return (
    <AuthModule 
      AUTH_TITLE={showOtp ? "Verify Email" : "Sign in"} 
      authContent={
        <Loading isLoading={isLoading}>
          {!showOtp ? (
            <Form
              layout="vertical"
              name="normal_login"
              className="login-form"
              initialValues={{
                remember: true,
                email:'admin@admin.com',
                password:'admin123',
              }}
              onFinish={onFinish}
            >
              <LoginForm />
              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="login-form-button auth-btn-shiny"
                  loading={isLoading}
                  size="large"
                  icon={<LoginOutlined />}
                  style={{
                    width: '100%',
                    height: 54,
                    fontSize: 17,
                    fontWeight: 700,
                    borderRadius: 14,
                    background: '#7C3AED',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                    transition: 'all 0.3s ease',
                    marginTop: 10
                  }}
                >
                  {translate('Log in')}
                </Button>
              </Form.Item>
              <Form.Item style={{ textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.45)' }}>
                    {translate("Don't have an account?")} 
                    <a 
                      href="/register" 
                      style={{ 
                        fontWeight: 700, 
                        marginLeft: 8,
                        color: '#7C3AED'
                      }}
                    >
                      {translate('Create account')}
                    </a>
                  </Text>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>
                Verification required
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: 32 }}>
                Please enter the 6-digit code sent to your email.
              </Text>
              
              <OTPInput length={6} onComplete={handleOtpComplete} />

              <div style={{ marginTop: 40 }}>
                <span style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.45)' }}>
                  Didn't receive code?{' '}
                  <Button 
                    type="link" 
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    style={{ 
                      fontWeight: 700, 
                      color: countdown > 0 ? 'rgba(255, 255, 255, 0.3)' : '#7C3AED',
                      padding: 0
                    }}
                  >
                    {countdown > 0 
                      ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                      : 'Resend'}
                  </Button>
                </span>
              </div>
              
              <Button 
                type="link" 
                onClick={() => setShowOtp(false)}
                style={{ 
                  marginTop: 24,
                  color: 'rgba(255, 255, 255, 0.3)'
                }}
              >
                ← Back to login
              </Button>
            </div>
          )}
        </Loading>
      } 
    />
  );
};

export default LoginPage;
