import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { getToken, setToken, removeToken } from '@/utils/token';

interface TokenSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const TokenSettings: React.FC<TokenSettingsProps> = ({ visible, onClose }) => {
  const [token, setTokenValue] = useState<string>('');

  useEffect(() => {
    if (visible) {
      const savedToken = getToken();
      setTokenValue(savedToken || '');
    }
  }, [visible]);

  const handleSave = () => {
    if (token.trim()) {
      setToken(token.trim());
      message.success('Token已保存');
      onClose();
    } else {
      removeToken();
      message.success('Token已清除');
      onClose();
    }
  };

  const handleClear = () => {
    setTokenValue('');
    removeToken();
    message.success('Token已清除');
  };

  return (
    <Modal
      title="Token设置"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>API Token:</div>
        <Input.Password
          placeholder="请输入API Token（留空则清除token）"
          value={token}
          onChange={(e) => setTokenValue(e.target.value)}
          onPressEnter={handleSave}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          配置后，所有API请求都会在请求头中携带此token
        </div>
      </div>
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleClear}>清除</Button>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Space>
    </Modal>
  );
};

export default TokenSettings;

