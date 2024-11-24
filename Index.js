const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const VALID_API_KEY = 'Celestial-Apikey';

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['authorization'];
  if (!apiKey || apiKey !== `Bearer ${VALID_API_KEY}`) {
    return res.status(403).send('Access denied: Invalid API Key');
  }
  next();
};

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
}).single('uploader');

app.use('/upload', checkApiKey);

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).send('Error uploading file.' + err);
    }
    if (req.file == undefined) {
      return res.status(400).send('No file selected.');
    }

    const expirationTime = 60 * 60 * 1000;
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const deleteAfter = req.body.deleteAfter || true;

    if (deleteAfter) {
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) {
            throw new Error('Failed to delete file');
          }
        });
      }, expirationTime);
    }

    const fileUrl = `https://you-cdn.vercel.app/uploads/${req.file.filename}`;
    res.send(`File uploaded: ${fileUrl}`);
  });
});

app.get('/uploads', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
