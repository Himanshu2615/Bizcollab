import { useEffect } from 'react';
import { BASE_URL } from '@/config/serverApiConfig';

import { useDispatch, useSelector } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';

import { Button, Form } from 'antd';
import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';

export default function UpdateSettingForm({ config, children, withUpload, uploadSettingKey }) {
  let { entity, settingsCategory } = config;
  const dispatch = useDispatch();
  const { result, isLoading } = useSelector(selectSettings);
  const translate = useLanguage();
  const [form] = Form.useForm();

  const onSubmit = (fieldsValue) => {
    console.log('🚀 ~ onSubmit ~ fieldsValue:', fieldsValue);
    if (withUpload) {
      if (fieldsValue.file && fieldsValue.file.length > 0 && fieldsValue.file[0].originFileObj) {
        fieldsValue.file = fieldsValue.file[0].originFileObj;
      }
      dispatch(
        settingsAction.upload({
          entity,
          settingKey: uploadSettingKey,
          jsonData: { ...fieldsValue, settingCategory: settingsCategory },
        })
      );
    } else {
      const settings = [];

      for (const [key, value] of Object.entries(fieldsValue)) {
        settings.push({ settingKey: key, settingValue: value });
      }

      dispatch(
        settingsAction.updateMany({ entity, jsonData: { settings, settingCategory: settingsCategory } })
      );
    }
  };


  useEffect(() => {
    if (result) {
      const current = result[settingsCategory];
      if (withUpload && uploadSettingKey && current && current[uploadSettingKey]) {
        const fileList = [
          {
            uid: '-1',
            name: uploadSettingKey,
            status: 'done',
            url: BASE_URL + current[uploadSettingKey],
          },
        ];
        form.setFieldsValue({
          ...current,
          file: fileList,
        });
      } else {
        form.setFieldsValue(current);
      }
    }
  }, [result, settingsCategory]);

  return (
    <div>
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          onFinish={onSubmit}
          // onValuesChange={handleValuesChange}
          labelCol={{ span: 10 }}
          labelAlign="left"
          wrapperCol={{ span: 16 }}
        >
          {children}
          <Form.Item
            style={{
              display: 'inline-block',
              paddingRight: '5px',
            }}
          >
            <Button type="primary" htmlType="submit">
              {translate('Save')}
            </Button>
          </Form.Item>
          <Form.Item
            style={{
              display: 'inline-block',
              paddingLeft: '5px',
            }}
          >
            {/* <Button onClick={() => console.log('Cancel clicked')}>{translate('Cancel')}</Button> */}
          </Form.Item>
        </Form>
      </Loading>
    </div>
  );
}
