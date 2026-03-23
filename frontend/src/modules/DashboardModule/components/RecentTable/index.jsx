import { useMemo, useCallback, memo } from 'react';
import { Dropdown, Table, Typography, Tag, Skeleton } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

import { request } from '@/request';
import { useQuery } from '@tanstack/react-query';

import { EllipsisOutlined, EyeOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import storePersist from '@/redux/storePersist';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

const { Text } = Typography;

const MotionRow = memo((props) => {
  const { children, ...rest } = props;
  return (
    <motion.tr
      {...rest}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.tr>
  );
});

export default function RecentTable({ ...props }) {
  const translate = useLanguage();
  let { entity, dataTableColumns } = props;
  const currentAdmin = useSelector(selectCurrentAdmin);
  const tenantId = currentAdmin?.tenantId || 'global';

  const items = useMemo(() => [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: translate('Download'),
      key: 'download',
      icon: <FilePdfOutlined />,
    },
  ], [translate]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRead = useCallback((record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  }, [dispatch, navigate, entity]);

  const handleEdit = useCallback((record) => {
    dispatch(erp.currentAction({ actionType: 'update', data: record }));
    navigate(`/${entity}/update/${record._id}`);
  }, [dispatch, navigate, entity]);

  const handleDownload = useCallback((record) => {
    const auth = storePersist.get('auth');
    const token = auth?.current?.token;
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf${token ? `?token=${token}` : ''}`, '_blank');
  }, [entity]);

  const updatedColumns = useMemo(() => [
    ...dataTableColumns.map(col => {
      if (col.dataIndex === 'status') {
        const colorMap = {
          paid: '#10B981', // Emerald
          unpaid: '#F59E0B', // Amber
          overdue: '#EF4444', // Red
          draft: '#94A3B8', // Muted
          pending: '#F59E0B', // Amber
          partially: '#6366F1', // Indigo/Electric Blue
        };
        return {
          ...col,
          render: (status) => {
             const color = colorMap[status?.toLowerCase()] || '#94A3B8';
             return (
              <Tag 
                color={color} 
                style={{ 
                  backgroundColor: `${color}15`, 
                  border: `1px solid ${color}30`, 
                  borderRadius: '100px', 
                  padding: '4px 16px', 
                  margin: 0,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: color,
                  boxShadow: `0 0 10px ${color}20`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                 {translate(status)}
              </Tag>
            );
          }
        };
      }
      if (col.dataIndex === 'client' || col.key === 'client') {
          return {
             ...col,
             render: (text, record) => <Text strong style={{ color: '#FFFFFF' }}>{record.client?.name || text}</Text>
          }
      }
      if (col.dataIndex === 'number' || col.key === 'number') {
        return {
           ...col,
           render: (text) => <Text strong style={{ color: '#3B82F6' }}>#{text}</Text>
        }
    }
      return {
          ...col,
          render: col.render ? col.render : (text) => <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</Text>
      };
    }),
    {
      title: '',
      key: 'action',
      width: '50px',
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
              switch (key) {
                case 'read':
                  handleRead(record);
                  break;
                case 'edit':
                  handleEdit(record);
                  break;
                case 'download':
                  handleDownload(record);
                  break;
                default:
                  break;
              }
            },
          }}
          trigger={['click']}
        >
          <span style={{ cursor: 'pointer' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              <EllipsisOutlined style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)' }} />
            </div>
          </span>
        </Dropdown>
      ),
    },
  ], [dataTableColumns, translate, items, handleRead, handleEdit, handleDownload, entity]);

  const finalColumns = useMemo(() => updatedColumns.map(col => ({
    ...col,
    render: (text, record) => {
      if (record.isSkeleton) {
        return <Skeleton.Button active size="small" style={{ width: '80%', height: 20, borderRadius: 4 }} />;
      }
      return col.render ? col.render(text, record) : text;
    }
  })), [updatedColumns]);

  const { data: result, isLoading, isSuccess } = useQuery({
    queryKey: ['table', tenantId, entity, 'list', props.refreshKey],
    queryFn: () => request.list({ entity }),
    select: (data) => data.result,
  });
  
  const dataItems = isSuccess && result ? result.slice(0, 6) : [];

  // Skeleton rows for "Perceived Performance"
  const skeletonData = Array(5).fill({}).map((_, i) => ({ _id: `skeleton-${i}`, isSkeleton: true }));

  return (
    <div style={{ position: 'relative' }}>
      <Table
        columns={finalColumns}
        rowKey={(item) => item._id}
        dataSource={isLoading ? skeletonData : dataItems}
        pagination={false}
        scroll={{ x: true }}
        className="white-table"
        style={{ marginTop: '8px' }}
        components={{
          body: {
            row: MotionRow,
          },
        }}
      />
    </div>
  );
}

