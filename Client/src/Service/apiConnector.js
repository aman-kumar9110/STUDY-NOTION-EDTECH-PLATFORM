import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://study-notion-edtech-platform-server.onrender.com/", // ✅ add baseURL if all APIs use same base
  withCredentials: true, // ✅ if your backend uses cookies or secure headers
});

export const apiConnector = (method, url, bodyData = null, headers = {}, params = {}) => {
  return axiosInstance({
    method,
    url,
    data: bodyData,
    headers,
    params,
  });
};
