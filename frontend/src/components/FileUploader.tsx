import { CheckCircleOutlined, InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import { useState } from "react";

const { Dragger } = Upload;

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFileSelected, disabled }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <Dragger
      accept={ACCEPT}
      maxCount={1}
      showUploadList={false}
      disabled={disabled}
      beforeUpload={(file) => {
        setFileName(file.name);
        onFileSelected(file);
        return false;
      }}
    >
      {fileName ? (
        <>
          <p className="ant-upload-drag-icon">
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          </p>
          <p className="ant-upload-text">已选择: {fileName}</p>
          <p className="ant-upload-hint">点击或拖拽可重新选择文件</p>
        </>
      ) : (
        <>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件上传</p>
          <p className="ant-upload-hint">
            支持格式: JPEG, PNG, GIF, WebP, MP4, MOV
          </p>
        </>
      )}
    </Dragger>
  );
}
