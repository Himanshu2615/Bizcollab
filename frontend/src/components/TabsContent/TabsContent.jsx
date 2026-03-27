import React, { useState, useEffect } from 'react';
import { Tabs, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const TopCard = ({ pageTitle }) => {
  return (
    <div
      className="whiteBox shadow"
      style={{
        color: '#64748B',
        fontSize: 13,
        height: '70px',
        minHeight: 'auto',
        marginBottom: '24px',
      }}
    >
      <div className="pad20 strong" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#1e293b', marginBottom: 0, marginTop: 0, fontWeight: 700 }}>{pageTitle}</h2>
      </div>
    </div>
  );
};

export default function TabsContent({ content, defaultActiveKey, pageTitle }) {
  const navigate = useNavigate();
  const { settingsKey } = useParams();
  const [activeKey, setActiveKey] = useState(settingsKey || defaultActiveKey || (content[0] && content[0].key));

  useEffect(() => {
    if (settingsKey) {
      setActiveKey(settingsKey);
    }
  }, [settingsKey]);

  const onTabChange = (key) => {
    setActiveKey(key);
    // Option to update URL if needed:
    // navigate(`/settings/${key}`);
  };

  const activeItem = content.find((item) => item.key === activeKey) || content[0];

  return (
    <Row gutter={[24, 24]}>
      <Col
        xs={{ span: 24, order: 2 }}
        sm={{ span: 24, order: 2 }}
        md={{ span: 17, order: 1 }}
        lg={{ span: 18, order: 1 }}
      >
        <div className="whiteBox shadow" style={{ minHeight: '480px' }}>
          <div className="pad40">{activeItem?.children}</div>
        </div>
      </Col>
      <Col
        xs={{ span: 24, order: 1 }}
        sm={{ span: 24, order: 1 }}
        md={{ span: 7, order: 2 }}
        lg={{ span: 6, order: 2 }}
      >
        <TopCard pageTitle={pageTitle} />
        <div className="whiteBox shadow" style={{ padding: '10px 0' }}>
          <Tabs
            tabPosition="right"
            activeKey={activeKey}
            onChange={onTabChange}
            className="settings-tabs"
            items={content.map((item) => ({
              key: item.key,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 16px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ),
            }))}
            style={{ width: '100%' }}
          />
        </div>
      </Col>
    </Row>
  );
}
