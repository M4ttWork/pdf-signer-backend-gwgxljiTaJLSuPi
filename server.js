import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

app.get('/files', async (req, res) => {
  const client = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: client });

  try {
    const folderId = '1CKoN6ukMU73S5wHmyQYqjKpFPN_jDKv2'; // ← ZMIEŃ NA SWOJE FOLDER ID
    const result = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed = false`,
      fields: 'files(id, name)'
    });
    res.json(result.data.files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
