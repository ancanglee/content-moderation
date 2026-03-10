import { Button, Card, Col, Form, Input, Row, Select, Table, Tag, Typography, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { listBatches, startBatch } from "../api/batch";
import { listPolicies } from "../api/policy";
import BatchProgress from "../components/BatchProgress";
import { useWebSocket } from "../hooks/useWebSocket";
import type { BatchStatus, Policy } from "../types";

export default function BatchPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [batches, setBatches] = useState<BatchStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const { messages, connected, clear } = useWebSocket(activeBatchId);
  const [form] = Form.useForm();

  const loadBatches = useCallback(async () => {
    try {
      const data = await listBatches();
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    listPolicies()
      .then((data) => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => {});
    loadBatches();
  }, [loadBatches]);

  const handleStart = async () => {
    const values = await form.validateFields();
    setLoading(true);
    clear();
    try {
      const { batch_id } = await startBatch({
        s3_bucket: values.s3_bucket,
        s3_prefix: values.s3_prefix,
        policy_id: values.policy_id || null,
      });
      setActiveBatchId(batch_id);
      message.success(`批量任务已启动: ${batch_id}`);
      await loadBatches();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "批量任务启动失败");
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "default",
    processing: "processing",
    completed: "success",
    failed: "error",
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 120 },
    { title: "S3 路径", dataIndex: "s3_prefix", key: "s3_prefix" },
    {
      title: "进度",
      key: "progress",
      render: (_: unknown, r: BatchStatus) => `${r.processed_files}/${r.total_files}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    { title: "创建时间", dataIndex: "created_at", key: "created_at", width: 180 },
  ];

  return (
    <div className="page-container">
      <Typography.Title level={3}>批量处理</Typography.Title>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="新建批量任务" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical">
              <Form.Item name="s3_bucket" label="S3 桶名称" rules={[{ required: true }]}>
                <Input placeholder="my-content-bucket" />
              </Form.Item>
              <Form.Item name="s3_prefix" label="S3 前缀" rules={[{ required: true }]}>
                <Input placeholder="uploads/2024/" />
              </Form.Item>
              <Form.Item name="policy_id" label="应用策略">
                <Select
                  allowClear
                  placeholder="默认策略"
                  options={policies.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>
              <Button type="primary" onClick={handleStart} loading={loading} block>
                启动批量任务
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          {activeBatchId && (
            <BatchProgress messages={messages} connected={connected} />
          )}
        </Col>
      </Row>

      <Card title="批量任务历史" style={{ marginTop: 24 }}>
        <Table
          dataSource={batches}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
