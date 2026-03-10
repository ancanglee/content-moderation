import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 120_000,
  headers: { Accept: "application/json" },
});

// 响应拦截：如果后端未启动，proxy 可能返回 HTML，此处统一拦截
apiClient.interceptors.response.use(
  (resp) => {
    if (
      typeof resp.data === "string" &&
      resp.data.trimStart().startsWith("<")
    ) {
      return Promise.reject(new Error("后端服务未响应，请确认后端已启动"));
    }
    return resp;
  },
  (err) => Promise.reject(err)
);

export default apiClient;
