import { useEffect } from 'react';
import { Divider, Button, Row, Col, Descriptions, Statistic, Card, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
} from '@ant-design/icons';

import { useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { generate as uniqueId } from 'shortid';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney } from '@/settings';
import useMail from '@/hooks/useMail';
import { useNavigate } from 'react-router-dom';

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const moneySettings = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });

  // Safe money formatter that handles undefined settings
  const formatMoney = (amount) => {
    const numAmount = Number(amount) || 0;
    if (!moneySettings || !moneySettings.currency_symbol) {
      return numAmount.toFixed(2);
    }
    
    try {
      return moneySettings.moneyFormatter({ 
        amount: numAmount, 
        currency_code: invoiceData.currency 
      });
    } catch (error) {
      console.error('Money formatter error:', error);
      return numAmount.toFixed(2);
    }
  };

  // Debug: Log the incoming data
  useEffect(() => {
    console.log('=== ReadItem Debug ===');
    console.log('selectedItem:', JSON.stringify(selectedItem, null, 2));
    if (selectedItem) {
      console.log('selectedItem.subTotal:', selectedItem.subTotal, 'type:', typeof selectedItem.subTotal);
      console.log('selectedItem.total:', selectedItem.total, 'type:', typeof selectedItem.total);
      console.log('selectedItem.items:', selectedItem.items);
      if (selectedItem.items && selectedItem.items.length > 0) {
        console.log('First item:', JSON.stringify(selectedItem.items[0], null, 2));
      }
    }
  }, [selectedItem]);

  // Return early if no data
  if (!selectedItem || Object.keys(selectedItem).length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>No data available</p>
      </div>
    );
  }

  // Extract and ensure numeric values
  const invoiceData = {
    _id: selectedItem._id || '',
    number: Number(selectedItem.number) || 0,
    year: Number(selectedItem.year) || new Date().getFullYear(),
    status: selectedItem.status || 'draft',
    paymentStatus: selectedItem.paymentStatus || 'unpaid',
    subTotal: Number(selectedItem.subTotal) || 0,
    taxTotal: Number(selectedItem.taxTotal) || 0,
    taxRate: Number(selectedItem.taxRate) || 0,
    total: Number(selectedItem.total) || 0,
    credit: Number(selectedItem.credit) || 0,
    currency: selectedItem.currency || moneySettings?.currency_code || 'USD',
    notes: selectedItem.notes || '',
    date: selectedItem.date || '',
    expiredDate: selectedItem.expiredDate || '',
  };

  const items = Array.isArray(selectedItem.items) ? selectedItem.items : [];
  const client = selectedItem.client || {};

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/${entity.toLowerCase()}`)}
        title={`${ENTITY_NAME} # ${invoiceData.number}/${invoiceData.year}`}
        ghost={false}
        tags={[
          <Tag key="status" color="blue">
            {translate(invoiceData.status)}
          </Tag>,
          <Tag key="paymentStatus" color={invoiceData.paymentStatus === 'paid' ? 'green' : 'orange'}>
            {translate(invoiceData.paymentStatus)}
          </Tag>,
        ]}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${invoiceData._id}.pdf`, '_blank');
            }}
            icon={<FilePdfOutlined />}
          >
            {translate('Download PDF')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            loading={mailInProgress}
            onClick={() => send(invoiceData._id)}
            icon={<MailOutlined />}
          >
            {translate('Send by Email')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => dispatch(erp.convert({ entity, id: invoiceData._id }))}
            icon={<RetweetOutlined />}
            style={{ display: entity === 'quote' ? 'inline-block' : 'none' }}
          >
            {translate('Convert to Invoice')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(erp.currentAction({ actionType: 'update', data: selectedItem }));
              navigate(`/${entity.toLowerCase()}/update/${invoiceData._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
            style={{ background: '#3B82F6', borderColor: '#3B82F6' }}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title={translate('Status')} 
              value={translate(invoiceData.status)} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={translate('SubTotal')}
              value={formatMoney(invoiceData.subTotal)}
              prefix={moneySettings?.currency_symbol}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={translate('Total')}
              value={formatMoney(invoiceData.total)}
              prefix={moneySettings?.currency_symbol}
              styles={{ content: { color: '#3B82F6', fontWeight: 'bold' } }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={translate('Paid')}
              value={formatMoney(invoiceData.credit)}
              prefix={moneySettings?.currency_symbol}
            />
          </Col>
        </Row>
      </PageHeader>

      <Divider dashed />

      {/* Client Information Card */}
      <Card 
        title={translate('Client Information')}
        style={{ marginBottom: 24 }}
        styles={{ header: { backgroundColor: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' } }}
      >
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label={translate('Name')}>
            <strong>{client.name || 'N/A'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label={translate('Email')}>
            {client.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Phone')}>
            {client.phone || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Address')} span={3}>
            {client.address || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Items Card */}
      <Card 
        title={translate('Items')} 
        style={{ marginBottom: 24 }}
        styles={{ header: { backgroundColor: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' } }}
      >
        {/* Header Row */}
        <Row 
          gutter={[16, 16]} 
          style={{ 
            padding: '12px 0',
            marginBottom: 16,
            borderBottom: '2px solid rgba(255,255,255,0.08)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <Col xs={24} md={10}>
            {translate('Item')}
          </Col>
          <Col xs={8} md={4} style={{ textAlign: 'right' }}>
            {translate('Price')}
          </Col>
          <Col xs={8} md={4} style={{ textAlign: 'center' }}>
            {translate('Quantity')}
          </Col>
          <Col xs={8} md={6} style={{ textAlign: 'right' }}>
            {translate('Total')}
          </Col>
        </Row>

        {/* Items List */}
        {items && items.length > 0 ? (
          items.map((item, index) => {
            // Ensure numeric values with explicit conversion
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseFloat(item.quantity) || 0;
            const itemTotal = parseFloat(item.total) || 0;

            console.log(`Item ${index}:`, { 
              raw: { price: item.price, quantity: item.quantity, total: item.total },
              parsed: { itemPrice, itemQuantity, itemTotal },
              currency: invoiceData.currency
            });

            return (
              <Row 
                key={item._id || index} 
                gutter={[16, 16]} 
                style={{ 
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Col xs={24} md={10}>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 15 }}>{item.itemName || 'Unnamed Item'}</strong>
                  </div>
                  {item.description && (
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      {item.description}
                    </div>
                  )}
                </Col>
                <Col xs={8} md={4} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14 }}>
                    {moneySettings?.currency_symbol} {itemPrice.toFixed(2)}
                  </div>
                </Col>
                <Col xs={8} md={4} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14 }}>
                    {itemQuantity}
                  </div>
                </Col>
                <Col xs={8} md={6} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {moneySettings?.currency_symbol} {itemTotal.toFixed(2)}
                  </div>
                </Col>
              </Row>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)' }}>
            <p style={{ fontSize: 16 }}>{translate('No items found')}</p>
          </div>
        )}

        {/* Totals Summary Section */}
        {items && items.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid rgba(255,255,255,0.08)' }}>
            <Row justify="end">
              <Col xs={24} sm={16} md={12} lg={8}>
                {/* SubTotal Row */}
                <Row style={{ marginBottom: 12 }}>
                  <Col span={14} style={{ textAlign: 'right', fontSize: 15, fontWeight: 500 }}>
                    {translate('Sub Total')}:
                  </Col>
                  <Col span={10} style={{ textAlign: 'right', fontSize: 15, fontWeight: 500, paddingLeft: 16 }}>
                    {moneySettings?.currency_symbol} {invoiceData.subTotal.toFixed(2)}
                  </Col>
                </Row>

                {/* Tax Row */}
                <Row style={{ marginBottom: 12 }}>
                  <Col span={14} style={{ textAlign: 'right', fontSize: 15, fontWeight: 500 }}>
                    {translate('Tax')} ({invoiceData.taxRate}%):
                  </Col>
                  <Col span={10} style={{ textAlign: 'right', fontSize: 15, fontWeight: 500, paddingLeft: 16 }}>
                    {moneySettings?.currency_symbol} {invoiceData.taxTotal.toFixed(2)}
                  </Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                {/* Total Row */}
                <Row>
                  <Col span={14} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>
                    {translate('Total')}:
                  </Col>
                  <Col span={10} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, color: '#3B82F6', paddingLeft: 16 }}>
                    {moneySettings?.currency_symbol} {invoiceData.total.toFixed(2)}
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Notes Card */}
      {invoiceData.notes && (
        <Card 
          title={translate('Notes')} 
          style={{ marginBottom: 24 }}
          styles={{ header: { backgroundColor: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' } }}
        >
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{invoiceData.notes}</p>
        </Card>
      )}
    </>
  );
}
