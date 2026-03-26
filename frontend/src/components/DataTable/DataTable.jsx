import { useCallback, useEffect, useMemo, useState } from 'react';
import useDebounce from '@/hooks/useDebounce';

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  RedoOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  LoadingOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button, Input } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import { useSelector, useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { selectListItems } from '@/redux/crud/selectors';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import useLanguage from '@/locale/useLanguage';
import { dataForTable } from '@/utils/dataStructure';
import { useMoney, useDate } from '@/settings';

import { generate as uniqueId } from 'shortid';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

import { useCrudContext } from '@/context/crud';

function AddNewItem({ config }) {
  const { crudContextAction } = useCrudContext();
  const { collapsedBox, panel } = crudContextAction;
  const { ADD_NEW_ENTITY } = config;

  const handelClick = () => {
    panel.open();
    collapsedBox.close();
  };

  return (
    <Button onClick={handelClick} type="primary">
      {ADD_NEW_ENTITY}
    </Button>
  );
}
export default function DataTable({ config, extra = [] }) {
  let { entity, dataTableColumns, DATATABLE_TITLE, fields, searchConfig } = config;
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, modal, readBox, editBox, advancedBox } = crudContextAction;
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);

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
    ...extra,
    {
      type: 'divider',
    },

    {
      label: translate('Delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
    },
  ], [translate, extra]);

  const dispatch = useDispatch();
  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);
  const { pagination, items: dataSource } = listResult;
  const currentAdmin = useSelector(selectCurrentAdmin);

  const handleExport = useCallback(() => {
    const token = currentAdmin?.token;
    window.open(`${DOWNLOAD_BASE_URL}export/${entity}${token ? `?token=${token}` : ''}`, '_blank');
  }, [entity, currentAdmin]);

  const handleRead = useCallback((record) => {
    dispatch(crud.currentItem({ data: record }));
    panel.open();
    collapsedBox.open();
    readBox.open();
  }, [dispatch, panel, collapsedBox, readBox]);

  const handleEdit = useCallback((record) => {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    editBox.open();
    panel.open();
    collapsedBox.open();
  }, [dispatch, editBox, panel, collapsedBox]);

  const handleDelete = useCallback((record) => {
    dispatch(crud.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  }, [dispatch, modal]);

  const handleUpdatePassword = useCallback((record) => {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    advancedBox.open();
    panel.open();
    collapsedBox.open();
  }, [dispatch, advancedBox, panel, collapsedBox]);

  const memoColumns = useMemo(() => {
    let dispatchColumns = [];
    if (fields) {
      dispatchColumns = [...dataForTable({ fields, translate, moneyFormatter, dateFormat })];
    } else {
      dispatchColumns = [...dataTableColumns];
    }
    return [
      ...dispatchColumns,
      {
        title: '',
        key: 'action',
        fixed: 'right',
        render: (_, record) => {
          if (entity === 'taxes' || entity === 'paymentMode') {
            return (
              <span 
                onClick={() => handleEdit(record)} 
                style={{ color: '#1890ff', cursor: 'pointer' }}
              >
                {translate('Edit')}
              </span>
            );
          }
          return (
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
                    case 'delete':
                      handleDelete(record);
                      break;
                    case 'updatePassword':
                      handleUpdatePassword(record);
                      break;
                    default:
                      break;
                  }
                },
              }}
              trigger={['click']}
            >
              <span style={{ cursor: 'pointer' }}>
                <EllipsisOutlined
                  style={{ fontSize: '24px' }}
                  onClick={(e) => e.preventDefault()}
                />
              </span>
            </Dropdown>
          );
        },
      },
    ];
  }, [fields, translate, moneyFormatter, dateFormat, dataTableColumns, entity, handleEdit, items, handleRead, handleDelete, handleUpdatePassword]);

  const handelDataTableLoad = useCallback((pagination) => {
    const options = { page: pagination.current || 1, items: pagination.pageSize || 10 };
    dispatch(crud.list({ entity, options }));
  }, [entity, dispatch]);

  const filterTable = (e) => {
    setSearchText(e.target.value);
  };

  const onAutoCompleteChange = (value) => {
    const options = { equal: value, filter: searchConfig?.entity };
    dispatch(crud.list({ entity, options }));
  };

  useEffect(() => {
    const options = { 
      q: debouncedSearchText, 
      fields: (searchConfig && searchConfig.searchFields) ? searchConfig.searchFields : '' 
    };
    dispatch(crud.list({ entity, options }));
  }, [debouncedSearchText, entity, searchConfig, dispatch]);

  return (
    <>
      <PageHeader
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        title={DATATABLE_TITLE}
        ghost={false}
        extra={[
          searchConfig?.entity ? (
            <AutoCompleteAsync
              key={`${uniqueId()}`}
              entity={searchConfig?.entity}
              displayLabels={searchConfig?.displayLabels || ['name']}
              searchFields={searchConfig?.searchFields || 'name'}
              onChange={onAutoCompleteChange}
            />
          ) : (
            <Input
              key="searchFilterDataTable"
              onChange={filterTable}
              placeholder={translate('search')}
              allowClear
              value={searchText}
              prefix={
                listIsLoading ? (
                  <LoadingOutlined style={{ color: '#FFFFFF' }} />
                ) : (
                  <SearchOutlined style={{ color: '#FFFFFF' }} />
                )
              }
              className="search-input midnight-input"
              style={{ width: '250px' }}
            />
          ),
          <Button onClick={handelDataTableLoad} key={`${uniqueId()}`} icon={<RedoOutlined />}>
            {translate('Refresh')}
          </Button>,
          <Button onClick={handleExport} key={`${uniqueId()}`} icon={<FileExcelOutlined />}>
            {translate('Export CSV')}
          </Button>,

          <AddNewItem key={`${uniqueId()}`} config={config} />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>

      <Table
        columns={memoColumns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={pagination}
        loading={listIsLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: true }}
        className="dark-table"
      />
    </>
  );
}
