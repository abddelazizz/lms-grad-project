import http from "./http";

export const sendMessage = async (message) => {
  const response = await http.post(`/assistant/messages`, { message });
  return response.data;
};

export const clearHistory = async () => {
  const response = await http.delete(`/assistant/history`);
  return response.data;
};
