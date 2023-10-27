const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer'); // Add multer for file handling

const upload = multer({ dest: 'uploads/' }); // configure multer

const app = express();
app.use(express.json());

// Serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get("/seeStatus", (req, res) => {
  res.sendFile(path.join(__dirname, 'seeStatus.html'));
});

// POST API to collect submissions
app.post('/api/submit', (req, res) => {
  const data = req.body;
  const newData = {
    ...data,
    timestamp: new Date().toISOString(),
    id: uuidv4(),
    isDone: false,
    downloadUrl: "", // empty downloadUrl field
  };

  const existingData = JSON.parse(fs.readFileSync('requests.json', 'utf8'));
  existingData.push(newData);
  fs.writeFileSync('requests.json', JSON.stringify(existingData, null, 2));

  res.status(201).json(newData);
});

// POST API to upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  const filePath = path.join(__dirname, req.file.path);
  res.status(201).json({ downloadUrl: `/api/download/${req.file.filename}` });
});

// GET API to download file
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath);
});

// PUT API to update by ID
app.put('/api/update/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const data = JSON.parse(fs.readFileSync('requests.json', 'utf8'));
  
  const index = data.findIndex(d => d.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updateData };
    fs.writeFileSync('requests.json', JSON.stringify(data, null, 2));
    res.status(200).json(data[index]);
  } else {
    res.status(404).json({ message: 'Record not found' });
  }
});

// GET API to query requests
app.get('/api/requests', (req, res) => {
  const { id } = req.query;
  const data = JSON.parse(fs.readFileSync('requests.json', 'utf8'));
  
  const filteredData = id ? data.filter(d => d.id === id) : data;
  res.status(200).json(filteredData);
});

// DELETE API to remove all entries
app.delete('/api/requests', (req, res) => {
  fs.writeFileSync('requests.json', JSON.stringify([], null, 2));
  res.status(204).send();
});

// DELETE API to remove a specific entry
app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const data = JSON.parse(fs.readFileSync('requests.json', 'utf8'));

  const filteredData = data.filter(d => d.id !== id);
  fs.writeFileSync('requests.json', JSON.stringify(filteredData, null, 2));
  
  res.status(204).send();
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
