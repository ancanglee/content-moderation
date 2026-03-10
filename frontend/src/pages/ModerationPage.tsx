import { Alert, Button, Card, Col, Row, Select, Steps, Typography, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { pollModerationResult, uploadFile } from "../api/moderation";
import { listPolicies } from "../api/policy";
import FileUploader from "../components/FileUploader";
import MediaPreview from "../components/MediaPreview";
import ModerationResult from "../components/ModerationResult";
import type { ModerationResultData, Policy } from "../types";

type Phase = "idle" | "uploading" | "processing" | "completed" | "failed";

const phaseStep: Record<Phase, number> = {
  idle: 0,
  uploading: 0,
  processing: 1,
  completed: 2,
  failed: 2,
};

export default function ModerationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ModerationResultData | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    listPolicies()
      .then((data) => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => {});
    return () => { cancelRef.current?.(); };
  }, []);

  const handleModerate = useCallback(async () => {
    if (!file) {
      message.warning("请选择文件");
      return;
    }

    cancelRef.current?.();
    setPhase("uploading");
    setResult(null);
    setErrorMsg("");

    try {
      // 1) 上传文件，立即返回
      const resp = await uploadFile(file, policyId);
      setFileName(resp.file_name);
      setPhase("processing");

      // 2) 轮询获取结果
      const { promise, cancel } = pollModerationResult(resp.record_id);
      cancelRef.current = cancel;

      const record = await promise;
      cancelRef.current = null;

      if (record.status === "completed" && record.result) {
        setResult(record.result as ModerationResultData);
        setPhase("completed");
        message.success("审核完成");
      } else {
        const err = (record.result as any)?.error || "审核失败";
        setErrorMsg(err);
        setPhase("failed");
        message.error("审核失败");
      }
    } catch (err: any) {
      if (err?.message === "已取消") return;
      setErrorMsg(err?.response?.data?.detail || err?.message || "审核失败");
      setPhase("failed");
      message.error(err?.response?.data?.detail || "审核失败");
    }
  }, [file, policyId]);

  const isProcessing = phase === "uploading" || phase === "processing";

  return (
    <div className="page-container">
      <Typography.Title level={3}>内容审核</Typography.Title>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="文件上传" style={{ marginBottom: 16 }}>
            <FileUploader onFileSelected={setFile} disabled={isProcessing} />

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
              loading={isProcessing}
              disabled={!file}
            >
              {isProcessing ? "审核中..." : "开始审核"}
            </Button>
          </Card>

          <MediaPreview file={file} />
        </Col>

        <Col xs={24} lg={12}>
          {/* 进度指示 */}
          {phase !== "idle" && (
            <Card style={{ marginBottom: 16 }}>
              <Steps
                current={phaseStep[phase]}
                status={phase === "failed" ? "error" : undefined}
                items={[
                  { title: "上传", description: phase === "uploading" ? "上传中..." : "已完成" },
                  { title: "AI 审核", description: phase === "processing" ? "后台处理中..." : phase === "uploading" ? "等待中" : "已完成" },
                  { title: "结果", description: phase === "completed" ? "审核完成" : phase === "failed" ? "审核失败" : "等待中" },
                ]}
              />
            </Card>
          )}

          {/* 错误信息 */}
          {phase === "failed" && errorMsg && (
            <Alert
              type="error"
              showIcon
              message="审核失败"
              description={errorMsg}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 审核结果 */}
          <ModerationResult result={result} fileName={fileName} />
        </Col>
      </Row>
    </div>
  );
}
