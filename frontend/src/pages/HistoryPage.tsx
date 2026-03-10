import { Card, Col, Row, Select, Statistic, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { getStats, listRecords, type HistoryStats } from "../api/history";
import type { ModerationRecord, ModerationResultData } from "../types";

const verdictColor = { PASS: "green", FAIL: "red", REVIEW: "orange" } as const;

export default function HistoryPage() {
  const [records, setRecords] = useState<ModerationRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<string | undefined>();
  const [fileType, setFileType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        listRecords({ page, verdict, file_type: fileType }),
        getStats(),
      ]);
      setRecords(Array.isArray(r) ? r : []);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [page, verdict, fileType]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "文件名", dataIndex: "file_name", key: "file_name" },
    {
      title: "类型",
      dataIndex: "file_type",
      key: "file_type",
      width: 80,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: "判定",

      key: "verdict",
      width: 100,
      render: (_: unknown, r: ModerationRecord) => {
        const v = (r.result as ModerationResultData)?.verdict;
        return <Tag color={verdictColor[v] || "default"}>{v}</Tag>;
      },
    },
    {
      title: "置信度",
      key: "confidence",
      width: 80,
      render: (_: unknown, r: ModerationRecord) =>
        `${(((r.result as ModerationResultData)?.confidence ?? 0) * 100).toFixed(0)}%`,
    },
    {
      title: "摘要",
      key: "summary",
      ellipsis: true,
      render: (_: unknown, r: ModerationRecord) =>
        (r.result as ModerationResultData)?.summary || "-",
    },
    {
      title: "批次",
      dataIndex: "batch_id",
      key: "batch_id",
      width: 110,
      render: (b: string | null) => b || "-",
    },
    { title: "时间", dataIndex: "created_at", key: "created_at", width: 170 },
  ];

  return (
    <div className="page-container">
      <Typography.Title level={3}>审核历史</Typography.Title>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总计" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="PASS"
                value={stats.breakdown["PASS"] || 0}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="FAIL"
                value={stats.breakdown["FAIL"] || 0}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="REVIEW"
                value={stats.breakdown["REVIEW"] || 0}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
          <Select
            allowClear
            placeholder="判定筛选"
            style={{ width: 150 }}
            value={verdict}
            onChange={setVerdict}
            options={[
              { value: "PASS", label: "PASS" },
              { value: "FAIL", label: "FAIL" },
              { value: "REVIEW", label: "REVIEW" },
            ]}
          />
          <Select
            allowClear
            placeholder="类型筛选"
            style={{ width: 150 }}
            value={fileType}
            onChange={setFileType}
            options={[
              { value: "image", label: "图片" },
              { value: "video", label: "视频" },
            ]}
          />
        </div>

        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize: 20,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  );
}
