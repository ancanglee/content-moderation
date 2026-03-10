import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { updatePolicy } from "../api/policy";
import type { Policy, PolicyCategory, PolicyRules } from "../types";

const { TextArea } = Input;

interface Props {
  policy: Policy | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const emptyCategory: PolicyCategory = {
  name: "",
  description: "",
  severity_levels: { low: "", medium: "", high: "", critical: "" },
  examples: [""],
  action: "REVIEW",
};

export default function PolicyRulesEditor({ policy, open, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [guidelines, setGuidelines] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 打开时用策略数据填充表单
  useEffect(() => {
    if (policy && open) {
      const rules = policy.rules as Partial<PolicyRules>;
      form.setFieldsValue({
        name: policy.name,
        description: policy.description,
      });
      setCategories(rules.categories || []);
      setGuidelines(rules.general_guidelines || []);
    }
  }, [policy, open, form]);

  const handleCategoryChange = (
    index: number,
    field: string,
    value: unknown
  ) => {
    setCategories((prev) => {
      const next = [...prev];
      const cat = { ...next[index] } as any;
      if (field.startsWith("severity_levels.")) {
        const level = field.split(".")[1];
        cat.severity_levels = { ...cat.severity_levels, [level]: value };
      } else {
        cat[field] = value;
      }
      next[index] = cat;
      return next;
    });
  };

  const handleExampleChange = (catIdx: number, exIdx: number, value: string) => {
    setCategories((prev) => {
      const next = [...prev];
      const examples = [...next[catIdx].examples];
      examples[exIdx] = value;
      next[catIdx] = { ...next[catIdx], examples };
      return next;
    });
  };

  const addExample = (catIdx: number) => {
    setCategories((prev) => {
      const next = [...prev];
      next[catIdx] = { ...next[catIdx], examples: [...next[catIdx].examples, ""] };
      return next;
    });
  };

  const removeExample = (catIdx: number, exIdx: number) => {
    setCategories((prev) => {
      const next = [...prev];
      const examples = next[catIdx].examples.filter((_, i) => i !== exIdx);
      next[catIdx] = { ...next[catIdx], examples };
      return next;
    });
  };

  const addCategory = () => {
    setCategories((prev) => [...prev, { ...emptyCategory, examples: [""] }]);
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuidelineChange = (index: number, value: string) => {
    setGuidelines((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addGuideline = () => setGuidelines((prev) => [...prev, ""]);
  const removeGuideline = (index: number) =>
    setGuidelines((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!policy) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const rules: PolicyRules = {
        policy_name: values.name,
        description: values.description || "",
        categories: categories.filter((c) => c.name.trim()),
        general_guidelines: guidelines.filter((g) => g.trim()),
      };
      await updatePolicy(policy.id, {
        name: values.name,
        description: values.description,
        rules: rules as unknown as Record<string, unknown>,
      });
      message.success("策略已更新");
      onSaved();
      onClose();
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="编辑审核标准"
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存修改
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="策略描述">
          <TextArea rows={2} />
        </Form.Item>
      </Form>

      {/* 审核类别编辑 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>审核类别</strong>
          <Button icon={<PlusOutlined />} size="small" onClick={addCategory}>
            添加类别
          </Button>
        </div>

        <Collapse
          accordion
          items={categories.map((cat, ci) => ({
            key: String(ci),
            label: cat.name || `类别 ${ci + 1}`,
            extra: (
              <DeleteOutlined
                style={{ color: "#ff4d4f" }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeCategory(ci);
                }}
              />
            ),
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  addonBefore="名称"
                  value={cat.name}
                  onChange={(e) => handleCategoryChange(ci, "name", e.target.value)}
                />
                <TextArea
                  placeholder="类别描述"
                  rows={2}
                  value={cat.description}
                  onChange={(e) => handleCategoryChange(ci, "description", e.target.value)}
                />
                <Select
                  style={{ width: 200 }}
                  value={cat.action}
                  onChange={(v) => handleCategoryChange(ci, "action", v)}
                  options={[
                    { value: "PASS", label: "PASS（通过）" },
                    { value: "REVIEW", label: "REVIEW（需复核）" },
                    { value: "FAIL", label: "FAIL（不通过）" },
                  ]}
                />

                <Card size="small" title="严重度定义">
                  <Input
                    addonBefore="轻微 (low)"
                    value={cat.severity_levels.low}
                    onChange={(e) =>
                      handleCategoryChange(ci, "severity_levels.low", e.target.value)
                    }
                    style={{ marginBottom: 4 }}
                  />
                  <Input
                    addonBefore="中度 (medium)"
                    value={cat.severity_levels.medium}
                    onChange={(e) =>
                      handleCategoryChange(ci, "severity_levels.medium", e.target.value)
                    }
                    style={{ marginBottom: 4 }}
                  />
                  <Input
                    addonBefore="严重 (high)"
                    value={cat.severity_levels.high}
                    onChange={(e) =>
                      handleCategoryChange(ci, "severity_levels.high", e.target.value)
                    }
                    style={{ marginBottom: 4 }}
                  />
                  <Input
                    addonBefore="致命 (critical)"
                    value={cat.severity_levels.critical}
                    onChange={(e) =>
                      handleCategoryChange(ci, "severity_levels.critical", e.target.value)
                    }
                  />
                </Card>

                <Card size="small" title="示例">
                  {cat.examples.map((ex, ei) => (
                    <Space key={ei} style={{ width: "100%", marginBottom: 4 }}>
                      <Input
                        value={ex}
                        placeholder={`示例 ${ei + 1}`}
                        onChange={(e) => handleExampleChange(ci, ei, e.target.value)}
                        style={{ width: 500 }}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => removeExample(ci, ei)}
                      />
                    </Space>
                  ))}
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => addExample(ci)}
                  >
                    添加示例
                  </Button>
                </Card>
              </Space>
            ),
          }))}
        />
      </div>

      {/* 通用指南编辑 */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>通用指南</strong>
          <Button icon={<PlusOutlined />} size="small" onClick={addGuideline}>
            添加
          </Button>
        </div>
        {guidelines.map((g, gi) => (
          <Space key={gi} style={{ width: "100%", marginBottom: 4 }}>
            <Input
              value={g}
              onChange={(e) => handleGuidelineChange(gi, e.target.value)}
              style={{ width: 700 }}
            />
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => removeGuideline(gi)}
            />
          </Space>
        ))}
      </div>
    </Modal>
  );
}
