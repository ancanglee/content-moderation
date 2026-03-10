import { Card } from "antd";

interface Props {
  file: File | null;
}

export default function MediaPreview({ file }: Props) {
  if (!file) return null;

  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  return (
    <Card title="预览" size="small" style={{ marginBottom: 16 }}>
      {isVideo ? (
        <video
          src={url}
          controls
          style={{ maxWidth: "100%", maxHeight: 400 }}
        />
      ) : (
        <img
          src={url}
          alt="preview"
          style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }}
        />
      )}
      <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>
        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
      </div>
    </Card>
  );
}
