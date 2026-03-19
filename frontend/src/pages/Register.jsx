import { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';

import { Form, Button, Typography } from 'antd';
import antdApp from '@/utils/antdApp';

import { register, verifyOTP, resendOTP } from '@/redux/auth/actions';
import { selectAuth } from '@/redux/auth/selectors';
import RegisterForm from '@/forms/RegisterForm';
import Loading from '@/components/Loading';
import AuthModule from '@/modules/AuthModule';
import OTPInput from '@/components/OTPInput';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const translate = useLanguage();
  const { isLoading, isSuccess, current } = useSelector(selectAuth);
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);
  const [userData, setUserData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();

  const onFinish = (values) => {
    dispatch(register({ registerData: values }));
  };

  const handleOtpComplete = (otp) => {
    dispatch(verifyOTP({ userId: userData?._id, otp }));
  };

  const handleResendOtp = () => {
    if (userData?._id && countdown === 0) {
       dispatch(resendOTP({ userId: userData?._id }));
       setCountdown(180);
    }
  };

  useEffect(() => {
    if (isSuccess && current) {
      if (current.isVerified) {
        antdApp.notification.success({
          message: translate('Account Created'),
          description: translate('Welcome! Your account has been created successfully.'),
        });
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else if (!showOtp) {
        setUserData(current);
        setShowOtp(true);
        setCountdown(180);
      }
    }
  }, [isSuccess, current, navigate, translate, showOtp]);

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
      AUTH_TITLE={showOtp ? "Verify Email" : "Sign up"} 
      authContent={
        <Loading isLoading={isLoading}>
          {!showOtp ? (
            <Form
              layout="vertical"
              name="register_form"
              className="register-form"
              initialValues={{}}
              onFinish={onFinish}
            >
              <RegisterForm />
              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="register-form-button auth-btn-shiny"
                  loading={isLoading}
                  size="large"
                  style={{
                    width: '100%',
                    height: 54,
                    fontSize: 17,
                    fontWeight: 700,
                    borderRadius: 14,
                    background: '#7C3AED',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {translate('Create Account')}
                </Button>
              </Form.Item>
              <Form.Item style={{ textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
                <span style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.45)' }}>
                  {translate('Already have an account?')}{' '}
                  <a 
                    href="/login" 
                    style={{ 
                      fontWeight: 700, 
                      marginLeft: 8,
                      color: '#7C3AED' 
                    }}
                  >
                    {translate('Log in')}
                  </a>
                </span>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>
                Check your inbox
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: 32 }}>
                We've sent a code to <span style={{ color: '#fff', fontWeight: 600 }}>{userData?.email}</span>
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
                ← Back to registration
              </Button>
            </div>
          )}
        </Loading>
      } 
    />
  );
};

export default RegisterPage;
