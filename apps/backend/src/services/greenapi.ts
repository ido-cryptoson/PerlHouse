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
  const url = `${BASE_URL}/waInstance${getInstanceId()}/sendMessage/${getToken()}`;
  await axios.post(url, { chatId, message }, { timeout: 15_000 });
}
