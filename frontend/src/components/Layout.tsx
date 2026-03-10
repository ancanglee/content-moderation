import {
  AuditOutlined,
  CloudServerOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Layout as AntLayout, Menu } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Content, Sider } = AntLayout;

const menuItems = [
  {
    key: "/moderation",
    icon: <AuditOutlined />,
    label: "内容审核",
  },
  {
    key: "/batch",
    icon: <CloudServerOutlined />,
    label: "批量处理",
  },
  {
    key: "/policy",
    icon: <SafetyCertificateOutlined />,
    label: "策略管理",
  },
  {
    key: "/history",
    icon: <HistoryOutlined />,
    label: "审核历史",
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="80" theme="dark">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          日本内容审核
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 18,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          日本内容审核系统
        </Header>
        <Content style={{ margin: "24px 16px 0" }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
