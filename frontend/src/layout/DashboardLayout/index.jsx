import useResponsive from '@/hooks/useResponsive';

export default function DashboardLayout({ children }) {
  const { isMobile } = useResponsive();
  return (
    <div
      style={{
        marginLeft: isMobile ? 0 : 140,
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#000000',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
}
