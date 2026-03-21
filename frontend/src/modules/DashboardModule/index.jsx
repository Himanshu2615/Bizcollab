import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Row, Col, Spin, Typography, Divider, Skeleton } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Filler,
  Legend as ChartLegend,
} from 'chart.js';
import { Line as LineChartJS } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Filler,
  ChartLegend
);

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { io } from 'socket.io-client';

import { request } from '@/request';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { selectCompanySettings } from '@/redux/settings/selectors';
import { API_BASE_URL } from '@/config/serverApiConfig';

import SummaryCard from './components/SummaryCard';
import RecentTable from './components/RecentTable';
import PreviewCard from './components/PreviewCard';
import CustomerPreviewCard from './components/CustomerPreviewCard';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;

// --- Elite Enterprise Design System Tokens ---
const PALETTE = {
  bg: '#090A0B',        // Deep, rich off-black
  card: '#1A1D21',      // Elevated secondary dark gray
  border: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#E5E7EB', // Soft off-white for headers
  textSecondary: '#A1A1AA', // Muted gray for labels
  blue: '#3B82F6',      // Primary Strategic Blue
  cyan: '#22D3EE',      // Analytical Cyan
  accent: '#1D4ED8'
};

const CHART_COLORS = [PALETTE.blue, PALETTE.cyan, '#6366F1', '#8B5CF6', '#EC4899'];


import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
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

export default function DashboardModule() {
  const translate = useLanguage();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const companySettings = useSelector(selectCompanySettings);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const socket = io(API_BASE_URL.replace('/api/', ''));
    socket.on('invoice_change', () => setRefreshKey(prev => prev + 1));
    return () => socket.disconnect();
  }, []);

  const tenantId = currentAdmin?.tenantId || 'global';

  const { data: invoiceSummary, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoices', tenantId, 'summary', refreshKey],
    queryFn: () => request.summary({ entity: 'invoice' }),
    select: (data) => data.result,
  });

  const { data: clientSummary, isLoading: clientLoading } = useQuery({
    queryKey: ['clients', tenantId, 'summary', refreshKey],
    queryFn: () => request.summary({ entity: 'client' }),
    select: (data) => data.result,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['invoices', tenantId, 'chart', refreshKey],
    queryFn: () => request.chart({ entity: 'invoice' }),
    select: (data) => data.result,
  });

  const performanceData = useMemo(() => {
    if (invoiceSummary?.performance?.length > 0) {
      return invoiceSummary.performance.map((item) => ({
        name: (item?.tag || item?.status || 'UNKNOWN').toUpperCase(),
        value: item.count,
        percentage: item.percentage,
      }));
    }
    return [];
  }, [invoiceSummary]);

  const activeMonthlyData = useMemo(() => {
    if (chartData?.length > 0) return chartData;
    return [
      { name: 'Jan', revenue: 0, expenses: 0 },
      { name: 'Feb', revenue: 0, expenses: 0 },
      { name: 'Mar', revenue: 0, expenses: 0 },
    ];
  }, [chartData]);

  const entity = 'invoice';
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
        padding: '0 40px 60px', 
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
    
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 1), 
                inset 0 1px 0 rgba(255, 255, 255, 0.04);
                
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                border-color 0.4s ease, 
                box-shadow 0.4s ease, 
                background 0.4s ease;
  }

  .bento-card:hover { 
    transform: translateY(-10px); 
    border-color: rgba(59, 130, 246, 0.8) !important; 
    background: linear-gradient(180deg, rgba(30, 58, 138, 0.2) 0%, rgba(5, 5, 5, 0.9) 100%) !important;
    box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 1), 
                0 0 60px -15px rgba(59, 130, 246, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  }

  /* RECHARTS: Ghost-level grid lines so your data is the only thing that pops */
  .recharts-cartesian-grid-horizontal line, 
  .recharts-cartesian-grid-vertical line { 
    stroke: rgba(255, 255, 255, 0.04) !important; 
  }

  /* ANT DESIGN TABLE: Stripped down to bare metal */
  .ant-table { 
    background: transparent !important; 
    color: ${PALETTE.textSecondary} !important; 
  }
  
  /* Table Header: Micro-typography, uppercase, high tracking */
  .ant-table-thead > tr > th { 
    background: rgba(255, 255, 255, 0.02) !important; 
    color: ${PALETTE.textPrimary} !important; 
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; 
    font-weight: 500 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
  }
  
  .ant-table-cell { 
    border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important; 
  }
  
  /* Table Row Hover: A very faint wash of blue */
  .ant-table-tbody > tr:hover > td {
    background: rgba(59, 130, 246, 0.04) !important; 
  }
`}</style>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '0px' }}>
        {/* Supreme Enterprise Atmospheric Glow */}
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '400px', background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.08), transparent 70%)', pointerEvents: 'none', zIndex: -1 }} />
        
        {/* Elite Header Context */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Title level={2} style={{ color: PALETTE.textPrimary, fontWeight: 800, margin: 0, letterSpacing: '-1.5px', fontSize: '36px' }}>
              {translate('Dashboard')}
            </Title>
            <Text style={{ color: PALETTE.textSecondary, fontSize: '14px', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </div>
        </motion.div>

        {/* Tier 1: The Pulse (Metrics) */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <Row gutter={[24, 24]}>
            <SummaryCard title={translate('Unpaid Balance')} tagColor="red" data={invoiceSummary?.total_undue || 0} isLoading={invoiceLoading} />
            <SummaryCard title={translate('Total Revenue')} tagColor="blue" data={invoiceSummary?.total || 0} isLoading={invoiceLoading} />
            <SummaryCard title={translate('Customer Base')} tagColor="cyan" data={clientSummary?.total || 0} isLoading={clientLoading} isMoney={false} />
            <SummaryCard title={translate('Total Invoices')} tagColor="green" data={invoiceSummary?.count || 0} isLoading={invoiceLoading} isMoney={false} />
          </Row>
        </motion.div>

        {/* Tier 2: The Trends (Spatial Hierarchy 60/40) */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={15}>
              <div className="bento-card">
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ color: PALETTE.textPrimary, marginBottom: 4, fontWeight: 700 }}>{translate('Revenue Flow Dynamics')}</Title>
                  <Text style={{ color: PALETTE.textSecondary, fontSize: 13 }}>{translate('Real-time economic velocity tracking')}</Text>
                </div>
                <div style={{ height: 320, width: '100%' }}>
                  <DashboardFlowChart data={activeMonthlyData} />
                </div>
              </div>
            </Col>
            <Col xs={24} lg={9}>
               <CustomerPreviewCard isLoading={clientLoading} activeCustomer={clientSummary?.activePercentage || 0} newCustomer={clientSummary?.newPercentage || 0} />
            </Col>
          </Row>
        </motion.div>

        {/* Tier 3: The Analysis */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
           <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <div className="bento-card">
                   <Title level={4} style={{ color: PALETTE.textPrimary, marginBottom: 24, fontWeight: 700 }}>{translate('Volume Analysis')}</Title>
                   <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activeMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: PALETTE.textSecondary, fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: PALETTE.textSecondary, fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '12px 16px' }}
                          itemStyle={{ color: PALETTE.textPrimary, fontWeight: 700, padding: 0, margin: 0 }}
                          labelStyle={{ color: PALETTE.textSecondary, marginBottom: '8px', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}
                          cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                        />
                        <Bar dataKey="revenue" fill={PALETTE.blue} radius={[6, 6, 0, 0]} barSize={24} animationDuration={1500} animationEasing="ease-in-out" />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className="bento-card">
                   <Title level={4} style={{ color: PALETTE.textPrimary, marginBottom: 24, fontWeight: 700 }}>{translate('Operational Composition')}</Title>
                   <div style={{ position: 'relative' }}>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie 
                            data={performanceData.length ? performanceData : [{value: 1}]} 
                            dataKey="value" 
                            innerRadius={85} 
                            outerRadius={105} 
                            paddingAngle={8}
                            stroke="none"
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                          >
                             {performanceData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '12px 16px' }}
                            itemStyle={{ color: PALETTE.textPrimary, fontWeight: 700, padding: 0, margin: 0 }}
                            labelStyle={{ display: 'none' }}
                          />
                        </PieChart>
                     </ResponsiveContainer>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <Text style={{ color: PALETTE.textSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Total Vol</Text>
                        <br />
                        <Text style={{ color: PALETTE.textPrimary, fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{invoiceSummary?.count || 0}</Text>
                     </div>
                   </div>
                </div>
              </Col>
           </Row>
        </motion.div>

      </div>
    </motion.div>

  );
}

function DashboardFlowChart({ data }) {
  const chartRef = React.useRef(null);
  
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: data.map(d => d.revenue),
        borderColor: '#3B82F6',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        tension: 0.4, // HIGH TENSION for organic, fluid curves
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#090A0B',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1D21',
        titleColor: '#A1A1AA',
        bodyColor: '#E5E7EB',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#A1A1AA', font: { size: 11, weight: '600' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
        ticks: { color: '#A1A1AA', font: { size: 11, weight: '600' } }
      }
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 1,
        to: 0.4,
        loop: true
      }
    }
  };

  return <LineChartJS ref={chartRef} data={chartData} options={options} />;
}
