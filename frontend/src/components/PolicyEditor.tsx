import { BookOutlined } from "@ant-design/icons";
import { Button, Card, Collapse, Descriptions, Form, Input, List, Modal, Select, Space, Spin, Tag, Typography } from "antd";
import { useState } from "react";
import { createPolicy, generatePolicy } from "../api/policy";
import type { Policy } from "../types";

const { TextArea } = Input;

interface Props {
  onCreated: (p: Policy) => void;
}

const industryOptions = [
  { value: "通用", label: "通用" },
  { value: "电商", label: "电商" },
  { value: "社交媒体", label: "社交媒体" },
  { value: "游戏", label: "游戏" },
  { value: "教育", label: "教育" },
  { value: "媒体出版", label: "媒体出版" },
  { value: "医疗健康", label: "医疗健康" },
  { value: "广告", label: "广告" },
];

const contentTypeOptions = [
  { value: "图片", label: "图片" },
  { value: "视频", label: "视频" },
  { value: "文本", label: "文本" },
  { value: "广告", label: "广告" },
];

export default function PolicyEditor({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [customName, setCustomName] = useState("");
  const [form] = Form.useForm();

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const result = await generatePolicy({
        industry: values.industry,
        content_types: values.content_types,
        additional_requirements: values.additional_requirements || "",
      });
      setPreview(result);
      setCustomName((result as any).policy_name || "");
    } catch {
      Modal.error({ title: "生成失败", content: "策略生成失败，请重试。" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const name = customName.trim() || (preview as any).policy_name || `Policy ${new Date().toISOString().slice(0, 10)}`;
      const desc = (preview as any).description || "";
      const rules = { ...preview, policy_name: name };
      const policy = await createPolicy({ name, description: desc, rules });
      onCreated(policy);
      setPreview(null);
      setCustomName("");
      form.resetFields();
    } catch {
      Modal.error({ title: "保存失败", content: "策略保存失败，请重试。" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="策略生成" style={{ marginBottom: 24 }}>
      <Form form={form} layout="vertical" initialValues={{ industry: "通用", content_types: ["图片", "视频"] }}>
        <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
          <Select options={industryOptions} />
        </Form.Item>
        <Form.Item name="content_types" label="目标内容类型" rules={[{ required: true }]}>
          <Select mode="multiple" options={contentTypeOptions} />
        </Form.Item>
        <Form.Item name="additional_requirements" label="附加要求">
          <TextArea rows={3} placeholder="如有特殊要求请在此输入" />
        </Form.Item>
        <Space>
          <Button type="primary" onClick={handleGenerate} loading={loading}>
            AI 生成策略
          </Button>
        </Space>
      </Form>

      {loading && !preview && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Spin tip="正在生成策略..." />
        </div>
      )}

      {preview && (
        <Card
          type="inner"
          title="生成结果预览"
          style={{ marginTop: 24 }}
          extra={
            <Space>
              <Button onClick={() => { setPreview(null); setCustomName(""); }}>取消</Button>
              <Button type="primary" onClick={handleSave} loading={loading}>
                保存
              </Button>
            </Space>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <Typography.Text strong>策略名称:</Typography.Text>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="请输入策略名称"
              style={{ marginTop: 4 }}
            />
          </div>
          <Typography.Paragraph type="secondary">
            {(preview as any).description}
          </Typography.Paragraph>

          {/* 审核类别详情 */}
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
            审核类别 ({((preview as any).categories || []).length} 项)
          </Typography.Text>
          <Collapse
            accordion
            items={((preview as any).categories || []).map((cat: any, i: number) => ({
              key: String(i),
              label: (
                <Space>
                  <span>{cat.name}</span>
                  <Tag color={cat.action === "FAIL" ? "red" : cat.action === "REVIEW" ? "orange" : "green"}>
                    {cat.action}
                  </Tag>
                </Space>
              ),
              children: (
                <>
                  <Typography.Paragraph>{cat.description}</Typography.Paragraph>
                  {cat.severity_levels && (
                    <Descriptions column={1} size="small" bordered style={{ marginBottom: 12 }}>
                      <Descriptions.Item label={<Tag color="blue">轻微 (low)</Tag>}>
                        {cat.severity_levels.low}
                      </Descriptions.Item>
                      <Descriptions.Item label={<Tag color="orange">中度 (medium)</Tag>}>
                        {cat.severity_levels.medium}
                      </Descriptions.Item>
                      <Descriptions.Item label={<Tag color="red">严重 (high)</Tag>}>
                        {cat.severity_levels.high}
                      </Descriptions.Item>
                      <Descriptions.Item label={<Tag color="volcano">致命 (critical)</Tag>}>
                        {cat.severity_levels.critical}
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                  {cat.examples?.length > 0 && (
                    <>
                      <Typography.Text strong>具体示例:</Typography.Text>
                      <List
                        size="small"
                        dataSource={cat.examples}
                        renderItem={(ex: string) => <List.Item>{ex}</List.Item>}
                        style={{ marginTop: 4 }}
                      />
                    </>
                  )}
                </>
              ),
            }))}
          />

          {/* 通用指南 */}
          {(preview as any).general_guidelines?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>通用指南:</Typography.Text>
              <List
                size="small"
                dataSource={(preview as any).general_guidelines}
                renderItem={(g: string, i: number) => (
                  <List.Item>
                    <Typography.Text>{i + 1}. {g}</Typography.Text>
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 数据来源 */}
          {(preview as any).data_sources?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                <BookOutlined style={{ marginRight: 4 }} />
                数据来源 ({(preview as any).data_sources.length} 项)
              </Typography.Text>
              <Collapse
                size="small"
                items={(preview as any).data_sources.map((src: any, i: number) => ({
                  key: String(i),
                  label: (
                    <Space>
                      <Tag color={
                        src.type === "法律" ? "red" :
                        src.type === "行业法规" ? "orange" :
                        src.type === "行政指南" ? "blue" :
                        src.type === "行业标准" ? "cyan" :
                        src.type === "文化习俗" ? "purple" : "default"
                      }>
                        {src.type}
                      </Tag>
                      <span>{src.name}</span>
                    </Space>
                  ),
                  children: (
                    <>
                      <Typography.Paragraph>{src.description}</Typography.Paragraph>
                      {src.related_categories?.length > 0 && (
                        <div>
                          <Typography.Text type="secondary">关联类别: </Typography.Text>
                          {src.related_categories.map((c: string, j: number) => (
                            <Tag key={j}>{c}</Tag>
                          ))}
                        </div>
                      )}
                    </>
                  ),
                }))}
              />
            </div>
          )}
        </Card>
      )}
    </Card>
  );
}
