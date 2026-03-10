import { Alert, Button, Card, Col, Row, Select, Spin, Typography, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { uploadAndModerate, type ModerationResponse } from "../api/moderation";
import { listPolicies } from "../api/policy";
import FileUploader from "../components/FileUploader";
import MediaPreview from "../components/MediaPreview";
import ModerationResult from "../components/ModerationResult";
import type { ModerationResultData, Policy } from "../types";

export default function ModerationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ModerationResultData | null>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    listPolicies()
      .then((data) => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleModerate = useCallback(async () => {
    if (!file) {
      message.warning("请选择文件");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await uploadAndModerate(file, policyId);
      setResult(resp.result);
      setFileName(resp.file_name);
      message.success("审核完成");
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "审核失败");
    } finally {
      setLoading(false);
    }
  }, [file, policyId]);

  return (
    <div className="page-container">
      <Typography.Title level={3}>内容审核</Typography.Title>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="文件上传" style={{ marginBottom: 16 }}>
            <FileUploader onFileSelected={setFile} disabled={loading} />

            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>应用策略: </Typography.Text>
              <Select
                style={{ width: 300 }}
                allowClear
                placeholder={policies.length === 0 ? "暂无策略，请先创建" : "默认策略"}
                value={policyId}
                onChange={setPolicyId}
                options={policies.map((p) => ({ value: p.id, label: p.name }))}
              />
              {policies.length === 0 && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                  message="暂无审核策略，请先前往「策略管理」页面创建策略，或直接使用默认策略进行审核。"
                />
              )}
            </div>

            <Button
              type="primary"
              size="large"
              style={{ marginTop: 16, width: "100%" }}
              onClick={handleModerate}
              loading={loading}
              disabled={!file}
            >
              开始审核
            </Button>
          </Card>

          <MediaPreview file={file} />
        </Col>

        <Col xs={24} lg={12}>
          {loading && (
            <Card>
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin size="large" tip="正在审核内容..." />
              </div>
            </Card>
          )}
          <ModerationResult result={result} fileName={fileName} />
        </Col>
      </Row>
    </div>
  );
}
