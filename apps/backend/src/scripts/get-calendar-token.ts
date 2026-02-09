import 'dotenv/config';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3333/oauth2callback';

async function main(): Promise<void> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('ERROR: Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET in .env');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });

  console.log('=== Google Calendar OAuth Setup ===\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(`   ${authorizeUrl}\n`);
  console.log('2. Sign in with idoperl@gmail.com and authorize.\n');
  console.log('3. Wait for the redirect...\n');

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url ?? '', true);
      if (parsedUrl.pathname !== '/oauth2callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = parsedUrl.query.code as string;
      if (!code) {
        res.writeHead(400);
        res.end('Missing code parameter');
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Error</h1><p>No refresh token received. Revoke access at https://myaccount.google.com/permissions and retry.</p>');
        console.error('\nERROR: No refresh token. Revoke access and retry.');
        process.exit(1);
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Success!</h1><p>You can close this tab. Check the terminal for your refresh token.</p>');

      console.log('=== SUCCESS ===\n');
      console.log('Add this to your .env file:\n');
      console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${refreshToken}\n`);

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Token exchange failed:', err);
      res.writeHead(500);
      res.end('Token exchange failed. See terminal.');
      process.exit(1);
    }
  });

  server.listen(3333, () => {
    console.log('Listening on http://localhost:3333 for OAuth callback...');
  });
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
