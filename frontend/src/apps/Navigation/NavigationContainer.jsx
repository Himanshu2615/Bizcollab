import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu, Typography } from 'antd';

const { Text } = Typography;

import { useAppContext } from '@/context/appContext';

import useLanguage from '@/locale/useLanguage';
// import logoText from '@/style/images/logo.svg';
import bizLogo from '@/style/images/brand-logo.png';

import useResponsive from '@/hooks/useResponsive';

import {
    SettingOutlined,
    TeamOutlined,
    ContainerOutlined,
    FileSyncOutlined,
    AreaChartOutlined,
  CommentOutlined,
    TagOutlined,
    TagsOutlined,
    UserOutlined,
    CreditCardOutlined,
    MenuOutlined,
    FileOutlined,
    ShopOutlined,
    FilterOutlined,
    WalletOutlined,
    ReconciliationOutlined,
    HomeOutlined,
    SearchOutlined,
    DesktopOutlined,
    PlaySquareOutlined,
    ThunderboltOutlined,
    VideoCameraOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
    const { isMobile } = useResponsive();

    return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));
  const [isHovered, setIsHovered] = useState(false);

  const translate = useLanguage();
  const navigate = useNavigate();

  const items = [
    {
      key: 'dashboard',
      icon: <AreaChartOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('dashboard')}</span>,
      onClick: () => navigate('/'),
    },
    {
      key: 'business-insights',
      icon: <CommentOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('business insights')}</span>,
      onClick: () => navigate('/business-insights'),
    },
    {
      key: 'customer',
      icon: <TeamOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('customers')}</span>,
      onClick: () => navigate('/customer'),
    },

    {
      key: 'transaction',
      icon: <FileSyncOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('transaction')}</span>,
      onClick: () => navigate('/transaction'),
    },
    {
      key: 'invoice',
      icon: <ContainerOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('invoices')}</span>,
      onClick: () => navigate('/invoice'),
    },
    {
      key: 'quote',
      icon: <FileSyncOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('quote')}</span>,
      onClick: () => navigate('/quote'),
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('payments')}</span>,
      onClick: () => navigate('/payment'),
    },
    {
      key: 'paymentMode',
      icon: <WalletOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('payments_mode')}</span>,
      onClick: () => navigate('/payment/mode'),
    },
    {
      key: 'taxes',
      icon: <ShopOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('taxes')}</span>,
      onClick: () => navigate('/taxes'),
    },
    {
      key: 'generalSettings',
      icon: <SettingOutlined style={{ fontSize: '22px' }} />,
      label: <span style={{ fontWeight: 600 }}>{translate('settings')}</span>,
      onClick: () => navigate('/settings'),
    },
    {
        key: 'about',
        icon: <ReconciliationOutlined style={{ fontSize: '22px' }} />,
        label: <span style={{ fontWeight: 600 }}>{translate('about')}</span>,
        onClick: () => navigate('/about'),
    },
  ];

  useEffect(() => {
    if (location) {
      if (location.pathname === '/') setCurrentPath('dashboard');
      else setCurrentPath(location.pathname.slice(1).split('/')[0]);
    }
  }, [location]);

  return (
    <Sider
      collapsible={false}
      collapsed={isMobile ? false : !isHovered}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className="navigation-sidebar jio-hotstar-sidebar"
      width={260}
      collapsedWidth={80}
      style={{
        height: isMobile ? '100%' : '100vh',
        position: isMobile ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        zIndex: 1001,
        backgroundColor: 'rgba(9, 10, 11, 1)', 
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderRight: isMobile ? 'none' : '1px solid rgba(59, 130, 246, 0.1)',
        boxShadow: isMobile ? 'none' : '4px 0 24px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden' 
      }}
      theme="dark"
    >
      {/* Sidebar Edge Accent */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: '10%',
        bottom: '10%',
        width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.4), transparent)',
        pointerEvents: 'none'
      }} />
      <div
        className="sidebar-logo"
        onClick={() => navigate('/')}
        style={{
          padding: isHovered ? '0 24px' : '0 18px',
          marginBottom: '40px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s'
        }}
      >
        <img 
           src={bizLogo.src || bizLogo} 
           alt="Biz Logo" 
           style={{ 
             width: isHovered ? '120px' : '44px', 
             height: 'auto',
             transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
             margin: '0 auto',
             display: 'block'
           }} 
        />
      </div>
      
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[currentPath]}
        items={items}
        className="sidebar-menu-hotstar"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          padding: isHovered ? '0 12px' : '0 8px',
        }}
      />


    </Sider>
  );
}

function MobileSidebar() {
    const [visible, setVisible] = useState(false);
    const showDrawer = () => setVisible(true);
    const onClose = () => setVisible(false);

    return (
        <>
            <Button
                type="text"
                size="large"
                onClick={showDrawer}
                className="mobile-sidebar-btn"
                style={{ 
                  color: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: 0
                }}
            >
                <MenuOutlined style={{ fontSize: 22 }} />
            </Button>
            <Drawer
                width={280}
                placement={'left'}
                closable={false}
                onClose={onClose}
                open={visible}
                styles={{ body: { padding: 0, background: '#000000' } }}
            >
                <Sidebar collapsible={false} isMobile={true} />
            </Drawer>
        </>
    );
}
