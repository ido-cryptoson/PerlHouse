import 'dotenv/config';
import { getState, getSettings, setSettings, getQR } from '../services/greenapi';

async function main() {
  console.log('=== Green API Setup ===\n');

  // Verify credentials are configured
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || instanceId === 'your-green-api-instance-id') {
    console.error('ERROR: GREEN_API_INSTANCE_ID not set in .env');
    process.exit(1);
  }
  if (!token || token === 'your-green-api-token') {
    console.error('ERROR: GREEN_API_TOKEN not set in .env');
    process.exit(1);
  }

  console.log(`Instance ID: ${instanceId}`);

  // 1. Check instance state
  console.log('\n--- Checking instance state ---');
  const state = await getState();
  console.log(`State: ${state.stateInstance}`);

  // 2. If not authorized, show QR
  if (state.stateInstance !== 'authorized') {
    console.log('\n--- WhatsApp not linked. Fetching QR code ---');
    const qr = await getQR();
    if (qr.type === 'qrCode') {
      console.log('QR code available. Open the /api/setup/qr endpoint or scan from Green API dashboard.');
      console.log(`QR data: ${qr.message.slice(0, 100)}...`);
    } else if (qr.type === 'alreadyLogged') {
      console.log('Already logged in (may need a moment to sync).');
    } else {
      console.log(`QR response: ${qr.type} — ${qr.message}`);
    }
    console.log('\nLink WhatsApp first, then re-run this script to configure the webhook.');
    process.exit(0);
  }

  // 3. Configure webhook URL
  const webhookUrl = process.argv[2];
  if (webhookUrl) {
    console.log(`\n--- Configuring webhook URL: ${webhookUrl} ---`);
    const result = await setSettings({
      webhookUrl,
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'no',
      outgoingAPIMessageWebhook: 'no',
      stateWebhook: 'yes',
    });
    console.log(`Settings saved: ${result.saveSettings}`);
  } else {
    console.log('\nNo webhook URL provided. Pass it as a CLI argument:');
    console.log('  npm run setup:greenapi -- https://xxxx.ngrok.io/api/webhook/greenapi');
  }

  // 4. Verify current settings
  console.log('\n--- Current settings ---');
  const settings = await getSettings();
  const { webhookUrl: currentUrl, incomingWebhook, stateWebhook } = settings as Record<string, string>;
  console.log(`Webhook URL:       ${currentUrl || '(not set)'}`);
  console.log(`Incoming webhook:  ${incomingWebhook}`);
  console.log(`State webhook:     ${stateWebhook}`);

  console.log('\n=== Setup complete ===');
}

main().catch((error) => {
  console.error('Setup failed:', error.message ?? error);
  process.exit(1);
});
