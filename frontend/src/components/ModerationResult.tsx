import { Card, Collapse, Descriptions, Table, Tag, Typography } from "antd";
import type { ModerationResultData } from "../types";

interface Props {
  result: ModerationResultData | null;
  fileName?: string;
}

const verdictColor = {
  PASS: "green",
  FAIL: "red",
  REVIEW: "orange",
} as const;

const severityColor: Record<string, string> = {
  none: "default",
  low: "blue",
  medium: "orange",
  high: "red",
  critical: "volcano",
};

const columns = [
  { title: "类别", dataIndex: "category", key: "category" },
  {
    title: "严重度",
    dataIndex: "severity",
    key: "severity",
    render: (s: string) => <Tag color={severityColor[s] || "default"}>{s}</Tag>,
  },
  { title: "详情", dataIndex: "detail", key: "detail" },
];

export default function ModerationResult({ result, fileName }: Props) {
  if (!result) return null;

  return (
    <Card title="审核结果" style={{ marginTop: 16 }}>
      <Descriptions column={2} bordered size="small">
        {fileName && (
          <Descriptions.Item label="文件名">{fileName}</Descriptions.Item>
        )}
        <Descriptions.Item label="判定">
          <Tag color={verdictColor[result.verdict]} style={{ fontSize: 14 }}>
            {result.verdict}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="置信度">
          {(result.confidence * 100).toFixed(1)}%
        </Descriptions.Item>
      </Descriptions>

      <Typography.Paragraph style={{ margin: "16px 0 8px" }}>
        <strong>摘要:</strong> {result.summary}
      </Typography.Paragraph>

      <Table
        dataSource={result.categories}
        columns={columns}
        rowKey="category"
        pagination={false}
        size="small"
      />

      {result.raw_response && (
        <Collapse
          style={{ marginTop: 16 }}
          items={[
            {
              key: "1",
              label: "LLM 原始响应",
              children: (
                <Typography.Paragraph
                  style={{ whiteSpace: "pre-wrap", fontSize: 12 }}
                >
                  {result.raw_response}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
