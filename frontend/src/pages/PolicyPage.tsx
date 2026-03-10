import { DeleteOutlined, EditOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, List, Modal, Select, Space, Tag, Typography, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { deletePolicy, listPolicies, regeneratePolicy } from "../api/policy";
import PolicyEditor from "../components/PolicyEditor";
import PolicyRulesEditor from "../components/PolicyRulesEditor";
import type { Policy } from "../types";

export default function PolicyPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);

  // 编辑弹窗状态
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // 重新生成弹窗状态
  const [regenPolicy, setRegenPolicy] = useState<Policy | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deletePolicy(id);
      message.success("策略已删除");
      await load();
    } catch {
      message.error("删除失败");
    }
  };

  const handleEdit = (p: Policy) => {
    setEditingPolicy(p);
    setEditOpen(true);
  };

  const handleRegenOpen = (p: Policy) => {
    setRegenPolicy(p);
    regenForm.setFieldsValue({
      industry: "通用",
      content_types: ["图片", "视频"],
      additional_requirements: "",
    });
    setRegenOpen(true);
  };

  const handleRegenConfirm = async () => {
    if (!regenPolicy) return;
    const values = await regenForm.validateFields();
    setRegenLoading(true);
    try {
      await regeneratePolicy(regenPolicy.id, {
        industry: values.industry,
        content_types: values.content_types,
        additional_requirements: values.additional_requirements || "",
      });
      message.success("策略已重新生成并更新");
      setRegenOpen(false);
      await load();
    } catch {
      message.error("重新生成失败");
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Typography.Title level={3}>策略管理</Typography.Title>

      <PolicyEditor onCreated={() => load()} />

      <Card title="已保存的策略">
        <List
          loading={loading}
          dataSource={policies}
          locale={{ emptyText: "暂无策略" }}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(p)}
                >
                  编辑
                </Button>,
                <Button
                  icon={<SyncOutlined />}
                  size="small"
                  onClick={() => handleRegenOpen(p)}
                >
                  重新生成
                </Button>,
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleDelete(p.id)}
                />,
              ]}
            >
              <List.Item.Meta
                title={p.name}
                description={
                  <>
                    {p.description}
                    <div style={{ marginTop: 4 }}>
                      {((p.rules as any)?.categories || []).map((c: any, i: number) => (
                        <Tag key={i}>{c.name}</Tag>
                      ))}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#999" }}>
                      更新时间: {p.updated_at}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 编辑审核标准弹窗 */}
      <PolicyRulesEditor
        policy={editingPolicy}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => load()}
      />

      {/* 重新生成弹窗 */}
      <Modal
        title={`重新生成策略 — ${regenPolicy?.name || ""}`}
        open={regenOpen}
        onCancel={() => setRegenOpen(false)}
        confirmLoading={regenLoading}
        okText="开始重新生成"
        cancelText="取消"
        onOk={handleRegenConfirm}
      >
        <Typography.Paragraph type="secondary">
          将调用 AI Agent 重新调研日本法规和市场规范，生成全新的审核标准并覆盖当前策略。
        </Typography.Paragraph>
        <Form form={regenForm} layout="vertical">
          <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "通用", label: "通用" },
                { value: "电商", label: "电商" },
                { value: "社交媒体", label: "社交媒体" },
                { value: "游戏", label: "游戏" },
                { value: "教育", label: "教育" },
                { value: "媒体出版", label: "媒体出版" },
                { value: "医疗健康", label: "医疗健康" },
                { value: "广告", label: "广告" },
              ]}
            />
          </Form.Item>
          <Form.Item name="content_types" label="目标内容类型" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={[
                { value: "图片", label: "图片" },
                { value: "视频", label: "视频" },
                { value: "文本", label: "文本" },
                { value: "广告", label: "广告" },
              ]}
            />
          </Form.Item>
          <Form.Item name="additional_requirements" label="附加要求">
            <Input.TextArea rows={3} placeholder="如有特殊要求请在此输入" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
