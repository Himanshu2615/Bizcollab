import { ErpContextProvider } from '@/context/erp';
import { Layout } from 'antd';
import { useSelector } from 'react-redux';
import useResponsive from '@/hooks/useResponsive';

const { Content } = Layout;

export default function ErpLayout({ children }) {
  const { isMobile } = useResponsive();
  return (
    <ErpContextProvider>
      <Content
        className="whiteBox shadow layoutPadding"
        style={{
          margin: isMobile ? '0' : '12px auto',
          width: '100%',
          maxWidth: isMobile ? '100%' : '1100px',
          minHeight: '600px',
          padding: isMobile ? '16px' : '24px',
          background: '#000000',
          border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {children}
      </Content>
    </ErpContextProvider>
  );
}
