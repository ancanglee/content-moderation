import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import BatchPage from "./pages/BatchPage";
import HistoryPage from "./pages/HistoryPage";
import ModerationPage from "./pages/ModerationPage";
import PolicyPage from "./pages/PolicyPage";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/batch" element={<BatchPage />} />
              <Route path="/policy" element={<PolicyPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/moderation" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
