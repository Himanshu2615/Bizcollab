import { useSelector } from 'react-redux';
import { useMemo, forwardRef, memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Badge, Button } from 'antd';

// import Notifications from '@/components/Notification';

import { LogoutOutlined, ToolOutlined, UserOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { selectCompanySettings } from '@/redux/settings/selectors';

import { FILE_BASE_URL } from '@/config/serverApiConfig';

import useLanguage from '@/locale/useLanguage';

import useResponsive from '@/hooks/useResponsive';
import Navigation from '@/apps/Navigation/NavigationContainer';

const HeaderContent = memo(forwardRef((props, ref) => {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const companySettings = useSelector(selectCompanySettings);
  const companyName = companySettings?.company_name || currentAdmin?.companyName || '';

  const { Header } = Layout;
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const translate = useLanguage();

  const [isSwitching, setIsSwitching] = useState(false);

  const handleCollabSwitch = () => {
    setIsSwitching(true);
    setTimeout(() => {
      window.location.href = 'https://bizcollab-chat.vercel.app/';
    }, 400);
  };

  const items = useMemo(() => [
    {
      label: (
        <div className="profileDropdown" onClick={() => navigate('/settings')}>
          <Avatar
            size="large"
            className="last"
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            style={{
              color: '#FFFFFF',
              backgroundColor: currentAdmin?.photo ? 'none' : '#232426',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
              border: '1px solid #232426'
            }}
          >
            {currentAdmin?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div className="profileDropdownInfo">
            <p>
              {currentAdmin?.name}
            </p>
            <p>{currentAdmin?.email}</p>
          </div>
        </div>
      ),
      key: 'ProfileDropdown',
    },
    { type: 'divider' },
    { icon: <SettingOutlined />, key: 'settingProfile', label: <Link to={'/settings'}><span>{translate('Settings')}</span></Link> },
    { type: 'divider' },
    { icon: <LogoutOutlined />, key: 'logout', label: <Link to={'/logout'}>{translate('logout')}</Link> },
  ], [currentAdmin, translate, navigate]);

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        padding: isMobile ? '0 16px' : '0 40px',
        background: 'rgba(9, 10, 11, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        lineHeight: 'normal',
        transition: 'all 0.4s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isMobile && <Navigation />}
        {!isMobile && companyName && (
          <span style={{ 
            color: '#FFFFFF', fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 
          }}>
            {companyName}
          </span>
        )}
      </div>

      {/* Subtle Top-Glow Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
        pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          style={{ position: 'relative' }}
        >
          <Button 
            type="primary"
            loading={isSwitching}
            onClick={handleCollabSwitch}
            className="next-level-button"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 235, 252, 0.25) 0%, rgba(21, 0, 248, 0.15) 100%)',
              border: '1px solid rgba(0, 235, 252, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: isMobile ? '10px' : '13px',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: '#00EBFC',
              height: isMobile ? '36px' : '42px',
              padding: isMobile ? '0 12px' : '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 235, 252, 0.2), inset 0 0 12px rgba(0, 235, 252, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated Shimmer Ray */}
            <motion.div 
               animate={{ left: ['-100%', '200%'] }}
               transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
               style={{
                 position: 'absolute',
                 top: 0,
                 width: '80px',
                 height: '100%',
                 background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)',
                 transform: 'skewX(-25deg)',
                 pointerEvents: 'none'
               }}
            />
            <span style={{ position: 'relative', zIndex: 1, textShadow: '0 0 15px rgba(0, 235, 252, 0.4)' }}>
               {translate('Collab')}
            </span>
          </Button>
        </motion.div>

        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Avatar
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            style={{
              cursor: 'pointer',
              color: '#FFFFFF',
              backgroundColor: currentAdmin?.photo ? 'none' : '#232426',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
              border: '1px solid #232426'
            }}
            size={isMobile ? "default" : "large"}
          >
            {currentAdmin?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Dropdown>
      </div>
      {/* <AppsButton /> */}
    </Header>
  );
}));

export default HeaderContent;
