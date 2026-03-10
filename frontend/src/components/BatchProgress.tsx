import { Card, List, Progress, Tag, Typography } from "antd";
import type { BatchProgressMessage, ModerationResultData } from "../types";

interface Props {
  messages: BatchProgressMessage[];
  connected: boolean;
}

const verdictColor = { PASS: "green", FAIL: "red", REVIEW: "orange" } as const;

export default function BatchProgress({ messages, connected }: Props) {
  const latest = [...messages].reverse().find((m) => m.total > 0);
  const processed = latest?.processed ?? 0;
  const total = latest?.total ?? 0;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isComplete = messages.some((m) => m.type === "complete");

  // 收集结果
  const results = messages.filter((m) => m.type === "result" || m.type === "error");

  return (
    <>
      <Card
        title="批量处理进度"
        extra={
          <Tag color={connected ? "green" : "default"}>
            {connected ? "已连接" : "已断开"}
          </Tag>
        }
        style={{ marginBottom: 16 }}
      >
        <Progress
          percent={pct}
          status={isComplete ? "success" : "active"}
          format={() => `${processed}/${total}`}
        />
        {isComplete && (
          <Typography.Text type="success" style={{ marginTop: 8, display: "block" }}>
            批量处理完成
          </Typography.Text>
        )}
      </Card>

      {results.length > 0 && (
        <Card title="结果列表" size="small">
          <List
            size="small"
            dataSource={results}
            renderItem={(msg) => (
              <List.Item>
                <List.Item.Meta
                  title={msg.file_name || "unknown"}
                  description={
                    msg.type === "error" ? (
                      <Tag color="red">错误: {msg.error}</Tag>
                    ) : (
                      <>
                        <Tag color={verdictColor[(msg.result as ModerationResultData)?.verdict] || "default"}>
                          {(msg.result as ModerationResultData)?.verdict}
                        </Tag>
                        <span style={{ marginLeft: 8, fontSize: 12 }}>
                          {(msg.result as ModerationResultData)?.summary}
                        </span>
                      </>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </>
  );
}
