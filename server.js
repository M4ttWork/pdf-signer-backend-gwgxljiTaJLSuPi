const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

app.use(express.json());

// Zmieniono 'frontend' na 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.get('/files', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: await auth.getClient() });
    const folderId = '1CKoN6ukMU73S5wHmyQYqjKpFPN_jDKv2';

    const result = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
      fields: 'files(id, name)',
    });

    res.json(result.data.files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd podczas pobierania plików' });
  }
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
  const { fullName, email } = req.body;
  const filePath = req.file.path;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Potwierdzenie" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Podpisany dokument',
      text: `Cześć ${fullName}, w załączniku znajduje się podpisany dokument.`,
      attachments: [
        {
          filename: 'podpisany_dokument.pdf',
          path: filePath,
        },
      ],
    });

    fs.unlinkSync(filePath);
    res.json({ message: 'E-mail został wysłany.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd podczas wysyłania e-maila' });
  }
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Aplikacja działa 🎉');
});

// Zmieniono 'frontend' na 'public'
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
