import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Row, Col, Button } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import RecentTable from '@/modules/DashboardModule/components/RecentTable';
import useLanguage from '@/locale/useLanguage';
import { API_BASE_URL } from '@/config/serverApiConfig';

import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

const { Title, Text } = Typography;

const PALETTE = {
  bg: '#090A0B',
  card: '#1A1D21',
  border: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#E5E7EB',
  textSecondary: '#A1A1AA',
  blue: '#0700d2ff',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

export default function Transaction() {
  const translate = useLanguage();
  const entity = 'invoice';
  const [refreshKey, setRefreshKey] = useState(0);
  const currentAdmin = useSelector(selectCurrentAdmin);

  const handleExport = () => {
    const token = currentAdmin?.token;
    const exportUrl = `${DOWNLOAD_BASE_URL}export/${entity}${token ? `?token=${token}` : ''}`;
    window.open(exportUrl, '_blank');
  };

  useEffect(() => {
    const socket = io(API_BASE_URL.replace('/api/', ''));
    
    // Listen to changes in invoices, clients, and payments to keep the transaction log live
    const refresh = () => setRefreshKey(prev => prev + 1);
    
    socket.on('invoice_change', refresh);
    socket.on('client_change', refresh);
    socket.on('payment_change', refresh);

    return () => socket.disconnect();
  }, []);

  const dataTableColumns = useMemo(() => [
    { title: translate('Number'), dataIndex: 'number', render: (n) => <Text strong style={{ color: PALETTE.blue, fontVariantNumeric: 'tabular-nums' }}>#{n}</Text> },
    { title: translate('Client'), dataIndex: ['client', 'name'], render: (name) => <Text style={{ color: PALETTE.textPrimary, fontWeight: 600 }}>{name}</Text> },
    { title: translate('Total'), dataIndex: 'total', render: (t) => <Text style={{ color: PALETTE.textPrimary, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>₹ {t?.toLocaleString()}</Text> },
    { title: translate('Status'), dataIndex: 'status' },
  ], [translate]);

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      style={{ 
        padding: '40px', 
        background: 'radial-gradient(circle at 50% 0%, rgba(0, 1, 3, 1) 0%, rgba(9, 10, 11, 1) 100%)',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{`
        .bento-card { 
          background: linear-gradient(180deg, rgba(20, 20, 25, 0.6) 0%, rgba(5, 5, 5, 0.8) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 1), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .ant-table { background: transparent !important; color: ${PALETTE.textSecondary} !important; }
        .ant-table-thead > tr > th { 
          background: rgba(255, 255, 255, 0.02) !important; 
          color: ${PALETTE.textPrimary} !important; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
        }
        .ant-table-cell { border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important; }
      `}</style>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ color: PALETTE.textPrimary, fontWeight: 800, margin: 0, letterSpacing: '-1.5px', fontSize: '36px' }}>
            {translate('Transactions')}
          </Title>
          <Text style={{ color: PALETTE.textSecondary, fontSize: '14px', fontWeight: 500 }}>
            {translate('Live economic activity monitoring')}
          </Text>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="bento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={4} style={{ color: PALETTE.textPrimary, margin: 0, fontWeight: 700 }}>{translate('Transaction Log')}</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
                  <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>LIVE SYNC</Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Text style={{ color: PALETTE.textSecondary, fontSize: 13, marginRight: 8 }}>{translate('Real-time ledger updates')}</Text>
                <Button 
                  type="primary" 
                  icon={<FileExcelOutlined />} 
                  onClick={handleExport}
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderColor: 'rgba(16, 185, 129, 0.2)', 
                    color: '#10B981',
                    borderRadius: '8px',
                    height: '40px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  className="export-btn"
                >
                  {translate('Export CSV')}
                </Button>
              </div>
            </div>
            <RecentTable entity={entity} dataTableColumns={dataTableColumns} refreshKey={refreshKey} />
          </div>
        </motion.div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .pulse-dot { animation: pulse 2s infinite; }
        .export-btn:hover {
          background: rgba(16, 185, 129, 0.2) !important;
          color: #10B981 !important;
          border-color: #10B981 !important;
        }
      `}</style>
    </motion.div>
  );
}
