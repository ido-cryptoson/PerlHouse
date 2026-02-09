import axios from 'axios';

const BASE_URL = 'https://api.green-api.com';

function getInstanceId(): string {
  const id = process.env.GREEN_API_INSTANCE_ID;
  if (!id) throw new Error('GREEN_API_INSTANCE_ID not set');
  return id;
}

function getToken(): string {
  const token = process.env.GREEN_API_TOKEN;
  if (!token) throw new Error('GREEN_API_TOKEN not set');
  return token;
}

export async function downloadMedia(downloadUrl: string): Promise<Buffer> {
  const response = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 30_000 });
  return Buffer.from(response.data);
}

export async function sendMessage(chatId: string, message: string): Promise<void> {
  // Green API's delaySendMessagesMilliseconds handles anti-detection delay server-side
  const url = `${BASE_URL}/waInstance${getInstanceId()}/sendMessage/${getToken()}`;
  await axios.post(url, { chatId, message }, { timeout: 15_000 });
}

export async function readChat(chatId: string, idMessage: string): Promise<void> {
  const url = `${BASE_URL}/waInstance${getInstanceId()}/readChat/${getToken()}`;
  await axios.post(url, { chatId, idMessage }, { timeout: 10_000 });
}

export async function getState(): Promise<{ stateInstance: string }> {
  const url = `${BASE_URL}/waInstance${getInstanceId()}/getStateInstance/${getToken()}`;
  const response = await axios.get(url, { timeout: 10_000 });
  return response.data;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const url = `${BASE_URL}/waInstance${getInstanceId()}/getSettings/${getToken()}`;
  const response = await axios.get(url, { timeout: 10_000 });
  return response.data;
}

export async function setSettings(settings: Record<string, unknown>): Promise<{ saveSettings: boolean }> {
  const url = `${BASE_URL}/waInstance${getInstanceId()}/setSettings/${getToken()}`;
  const response = await axios.post(url, settings, { timeout: 10_000 });
  return response.data;
}

export async function getQR(): Promise<{ type: string; message: string }> {
  const url = `${BASE_URL}/waInstance${getInstanceId()}/qr/${getToken()}`;
  const response = await axios.get(url, { timeout: 10_000 });
  return response.data;
}
