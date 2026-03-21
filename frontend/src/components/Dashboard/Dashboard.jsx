import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

import { request } from '@/request';
import { useDashboardSocket } from '@/hooks/useDashboardSocket';
import SkeletonBox from './SkeletonBox';
import styles from './Dashboard.module.css';
import { fmtL } from '@/utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

/**
 * Animated Counter Component
 */
const AnimatedCounter = ({ value, prefix = '₹', suffix = 'L', isCurrency = true }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200;
    const startValue = displayValue;
    const endValue = isCurrency ? value / 100000 : value;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (endValue - startValue) + startValue;
      setDisplayValue(current);
      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{displayValue.toFixed(isCurrency ? 1 : 0)}{suffix}</span>;
};

/**
 * Mini Sparkline
 */
const Sparkline = ({ data, color }) => {
  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [{
      data: data,
      borderColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.45,
      fill: true,
      backgroundColor: `${color}10`
    }]
  };
  return (
    <div style={{ height: '32px', width: '80px' }}>
      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} />
    </div>
  );
};

/**
 * Real-time Clock Component
 */
const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em' }}>
      {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
      <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
      {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()}
    </div>
  );
};

const Dashboard = () => {
  const { isConnected, lastRefreshed } = useDashboardSocket();

  const { data: chartData, isLoading: chartLoading } = useQuery({ queryKey: ['dashboard', 'invoice', 'chart'], queryFn: () => request.get({ entity: 'invoice/chart' }), select: (res) => res.result });
  const { data: summaryData, isLoading: summaryLoading } = useQuery({ queryKey: ['dashboard', 'invoice', 'summary'], queryFn: () => request.get({ entity: 'invoice/summary' }), select: (res) => res.result });
  const { data: clientData, isLoading: clientLoading } = useQuery({ queryKey: ['dashboard', 'client', 'summary'], queryFn: () => request.get({ entity: 'client/summary' }), select: (res) => res.result });

  const COLORS = { revenue: '#1500f8ff', collections: '#10B981', gap: '#F59E0B', bar: '#6366F1', paid: '#00ff66ff', partial: '#6366F1', pending: '#F59E0B', overdue: '#ff00d9ff', unpaid: '#00ebfcff', draft: '#94A3B8' };

  const sharedTooltipOptions = {
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    cornerRadius: 10,
    titleFont: { family: 'Syne, sans-serif', size: 12, weight: '700' },
    bodyFont: { family: 'DM Sans, sans-serif', size: 12 },
    padding: 12,
    displayColors: true,
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { 
        ...sharedTooltipOptions,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtL(ctx.raw)}` } 
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { size: 11 }, color: 'rgba(255, 255, 255, 0.4)' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { size: 11 }, color: 'rgba(255, 255, 255, 0.4)', callback: (v) => fmtL(v) } }
    }
  };

  const lineChartData = useMemo(() => {
    if (!chartData) return { labels: [], datasets: [] };
    return {
      labels: chartData.map(d => d.name),
      datasets: [
        { 
          label: 'Revenue', 
          data: chartData.map(d => d.revenue), 
          borderColor: '#00ff66ff', 
          backgroundColor: (context) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const rg = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            rg.addColorStop(0, 'rgba(0, 255, 102, 0.5)');
            rg.addColorStop(1, 'rgba(0, 255, 102, 0.05)');
            return rg;
          },
          borderWidth: 2, tension: 0.42, pointRadius: 0, pointHoverRadius: 6, pointHoverBorderColor: '#000', pointHoverBorderWidth: 2, fill: true
        },
        { 
          label: 'Collections', 
          data: chartData.map(d => d.expenses), 
          borderColor: '#1500f8ff', 
          backgroundColor: (context) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const rg = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            rg.addColorStop(0, 'rgba(21, 0, 248, 0.3)');
            rg.addColorStop(1, 'rgba(21, 0, 248, 0)');
            return rg;
          },
          borderWidth: 2, tension: 0.42, pointRadius: 0, pointHoverRadius: 6, pointHoverBorderColor: '#000', pointHoverBorderWidth: 2, fill: true
        }
      ]
    };
  }, [chartData]);

  const barChartData = useMemo(() => {
    if (!chartData) return { labels: [], datasets: [] };
    return {
      labels: chartData.map(d => d.name),
      datasets: [{ 
        label: 'Revenue', 
        data: chartData.map(d => d.revenue), 
        backgroundColor: (context) => {
          const chartArea = context.chart.chartArea;
          if (!chartArea) return null;
          const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
          bg.addColorStop(0, 'rgba(21, 0, 248, 0.9)');
          bg.addColorStop(1, 'rgba(21, 0, 248, 0.3)');
          return bg;
        },
        borderRadius: 7, borderSkipped: false
      }]
    };
  }, [chartData]);

  const totalRevenueValue = chartData?.reduce((a, b) => a + b.revenue, 0) || 0;
  const totalCollectionsValue = chartData?.reduce((a, b) => a + b.expenses, 0) || 0;
  const outstandingValue = totalRevenueValue - totalCollectionsValue;

  return (
    <div className={styles.dbWrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className={styles.dbTitle}>Business Analytics Dashboard</h1>
          <LiveClock />
        </div>
        {isConnected && (
          <div className={styles.liveBar} style={{ margin: 0 }}>
            <span className={`${styles.liveDot} ${styles.dotLive}`} />
            <span className={styles.liveText}>GLOBAL REAL-TIME FEED ACTIVE</span>
            {lastRefreshed && <span className={styles.lastUpdated}>· {lastRefreshed}</span>}
          </div>
        )}
      </div>

      <div className={styles.kpiGrid}>
        {chartLoading || summaryLoading ? (
            <><SkeletonBox height="140px" /><SkeletonBox height="140px" /><SkeletonBox height="140px" /><SkeletonBox height="140px" /></>
        ) : (
          <>
            <div className={`${styles.kpi} ${styles.kpiRevenue}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p className={styles.kpiLabel}>TOTAL REVENUE</p><Sparkline data={summaryData?.sparkline?.map(s => s.value) || []} color={'#1500f8ff'} /></div><p className={styles.kpiVal}><AnimatedCounter value={totalRevenueValue} /></p><span className={`${styles.kpiBadge} ${styles.badgeUp}`}>↑ 12.4% yield</span></div>
            <div className={`${styles.kpi} ${styles.kpiCollections}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p className={styles.kpiLabel}>TOTAL COLLECTIONS</p><Sparkline data={chartData?.map(d => d.expenses) || []} color={'#10B981'} /></div><p className={styles.kpiVal}><AnimatedCounter value={totalCollectionsValue} /></p><span className={`${styles.kpiBadge} ${styles.badgeUp}`}>↑ 8.1% vs prev</span></div>
            <div className={`${styles.kpi} ${styles.kpiOutstanding}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p className={styles.kpiLabel}>OUTSTANDING</p><Sparkline data={chartData?.map(d => d.revenue - d.expenses) || []} color={'#F59E0B'} /></div><p className={styles.kpiVal}><AnimatedCounter value={outstandingValue} /></p><span className={`${styles.kpiBadge} ${styles.badgeDown}`}>{totalRevenueValue > 0 ? ((outstandingValue / totalRevenueValue) * 100).toFixed(1) : 0}% gap</span></div>
            <div className={`${styles.kpi} ${styles.kpiCustomers}`}><p className={styles.kpiLabel}>ACTIVE CUSTOMERS</p><p className={styles.kpiVal}><AnimatedCounter value={clientData?.active || 0} prefix="" suffix="" isCurrency={false} /></p><span className={`${styles.kpiBadge} ${styles.badgeNeu}`}>+{clientData?.new || 0} growth</span></div>
          </>
        )}
      </div>

      <div className={styles.chartGrid}>
        <div className={`${styles.chartCard} ${styles.cardWide}`}>
          <p className={styles.chartHead}>REVENUE FLOW</p>
          <div style={{ height: '260px' }}>{chartLoading ? <SkeletonBox height="260px" /> : <Line data={lineChartData} options={lineOptions} />}</div>
        </div>

        <div className={styles.chartCard}>
          <p className={styles.chartHead}>Monthly volume analysis</p>
          <div style={{ height: '240px' }}>{chartLoading ? <SkeletonBox height="240px" /> : <Bar data={barChartData} options={{ ...lineOptions, plugins: { ...lineOptions.plugins, tooltip: sharedTooltipOptions }, scales: { ...lineOptions.scales, x: { ...lineOptions.scales.x, grid: { display: false } } } }} />}</div>
        </div>

        <div className={styles.chartCard}>
          <p className={styles.chartHead}>Operational composition</p>
          <div className={styles.doughnutLayout}>
            <div className={styles.doughnutWrap}>
              <Doughnut 
                data={{
                  labels: ['Paid', 'Partially', 'Pending', 'Overdue', 'Unpaid', 'Draft'],
                  datasets: [{
                    data: ['paid', 'partially', 'pending', 'overdue', 'unpaid', 'draft'].map(k => summaryData?.performance?.find(p => p.status === k)?.count || 0),
                    backgroundColor: [COLORS.paid, COLORS.partial, COLORS.pending, COLORS.overdue, COLORS.unpaid, COLORS.draft],
                    borderWidth: 0, spacing: 3, hoverBorderWidth: 3, hoverBorderColor: 'rgba(255, 255, 255, 1)'
                  }]
                }} 
                options={{ responsive: true, maintainAspectRatio: false, cutout: '78%', plugins: { legend: { display: false }, tooltip: sharedTooltipOptions } }} 
              />
              <div className={styles.doughnutCenter}>
                <span className={styles.doughnutTotal}>
                  <AnimatedCounter value={summaryData?.count || 0} prefix="" suffix="" isCurrency={false} />
                </span>
                <span className={styles.doughnutLbl}>invoices</span>
              </div>
            </div>
            <div className={styles.statusList}>
              {['Paid', 'Partially', 'Pending', 'Overdue', 'Unpaid', 'Draft'].map((k, i) => {
                const statusData = summaryData?.performance?.find(p => p.status === k.toLowerCase());
                const pct = statusData?.percentage || 0;
                const statusColor = [COLORS.paid, COLORS.partial, COLORS.pending, COLORS.overdue, COLORS.unpaid, COLORS.draft][i];
                return (
                  <div className={styles.statusCard} key={k}>
                    <div className={styles.statusTop}>
                      <span className={styles.statusLeft}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></span>
                        {k}
                      </span>
                      <span className={styles.statusPct}>
                        <AnimatedCounter value={pct} prefix="" suffix="%" isCurrency={false} />
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pct}%`, backgroundColor: statusColor }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.cardWide}`} style={{ padding: '32px' }}>
           <div className={styles.dynamicsHead}>
             <div className={styles.dynamicsTitleWrap}>
               <h3>Customer dynamics</h3>
               <p>Growth velocity · retention · active base metrics</p>
             </div>
             <div className={styles.dynamicsBadge}>Last 30 days</div>
           </div>

           {clientLoading ? <SkeletonBox height="300px" /> : (
             <div className={styles.dynamicsBody}>
               <div className={styles.dynamicsCards}>
                 <div className={styles.dynCard}>
                   <span className={`${styles.dynCount} ${styles.white}`}>
                     <AnimatedCounter value={clientData?.total || 0} prefix="" suffix="" isCurrency={false} />
                   </span>
                   <span className={styles.dynLabel}>TOTAL CLIENTS</span>
                 </div>
                 <div className={styles.dynCard}>
                   <span className={`${styles.dynCount} ${styles.blue}`}>
                     <AnimatedCounter value={clientData?.active || 0} prefix="" suffix="" isCurrency={false} />
                   </span>
                   <span className={styles.dynLabel}>ACTIVE CLIENTS</span>
                 </div>
                 <div className={styles.dynCard}>
                   <span className={`${styles.dynCount} ${styles.green}`}>
                     <AnimatedCounter value={clientData?.new || 0} prefix="" suffix="" isCurrency={false} />
                   </span>
                   <span className={styles.dynLabel}>NEW THIS MONTH</span>
                 </div>
               </div>

               <div className={styles.dynamicsStats}>
                 <div className={styles.dynStatRow}>
                   <div className={styles.dynStatTop}>
                     <span className={styles.dynStatLabel}>Active rate</span>
                     <span className={styles.dynStatPct}><AnimatedCounter value={clientData?.activePercentage || 0} prefix="" suffix="%" isCurrency={false} /></span>
                   </div>
                   <div className={styles.dynBarTrack}>
                     <div className={styles.dynBarFill} style={{ width: `${clientData?.activePercentage}%`, background: '#10B981' }}></div>
                   </div>
                 </div>

                 <div className={styles.dynStatRow}>
                   <div className={styles.dynStatTop}>
                     <span className={styles.dynStatLabel}>30-day growth</span>
                     <span className={styles.dynStatPct}><AnimatedCounter value={clientData?.newPercentage || 0} prefix="+" suffix="%" isCurrency={false} /></span>
                   </div>
                   <div className={styles.dynBarTrack}>
                     <div className={styles.dynBarFill} style={{ width: `${clientData?.newPercentage}%`, background: '#3B82F6' }}></div>
                   </div>
                 </div>

                 <div className={styles.dynStatRow}>
                   <div className={styles.dynStatTop}>
                     <span className={styles.dynStatLabel}>Retention rate</span>
                     <span className={styles.dynStatPct}><AnimatedCounter value={100 - (clientData?.newPercentage || 0)} prefix="" suffix="%" isCurrency={false} /></span>
                   </div>
                   <div className={styles.dynBarTrack}>
                     <div className={styles.dynBarFill} style={{ width: `${100 - (clientData?.newPercentage || 0)}%`, background: '#8B5CF6' }}></div>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
