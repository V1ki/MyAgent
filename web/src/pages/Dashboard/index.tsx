import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const Dashboard: React.FC = () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4" data-testid="page-title">数据统计面板</h1>
      <div className="dashboard mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={1128}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总访问量"
                value={93659}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="转化率"
                value={88}
                suffix="%"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="日环比增长"
                value={11.28}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Dashboard;