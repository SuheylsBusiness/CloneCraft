const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer'); // Add multer for file handling

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }
  });

const app = express();
app.use(express.json());

// Serve HTML files
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get("/seeStatus", (req, res) => {
  res.sendFile(path.join(__dirname, 'seeStatus.html'));
});

// POST API to collect submissions
app.post('/api/submit', (req, res) => {
  const data = req.body;
  const ip = req.socket.remoteAddress;

  const newData = {
    ...data,
    timestamp: new Date().toISOString(),
    id: uuidv4(),
    isDone: false,
    status: "Waiting to start.",
    errors: "",
    downloadUrl: "", // empty downloadUrl field
    ipAddress: ip, // Include IP address here
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
    res.download(filePath, `${filename}.apk`);
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
    // Read query parameters
    const { id, isDone } = req.query;
  
    // Read the JSON file and parse it
    const data = JSON.parse(fs.readFileSync('requests.json', 'utf8'));
  
    // Initial filtered data will be all records
    let filteredData = data;
  
    // Filter by 'id' if present
    if (id) {
      filteredData = filteredData.filter(d => d.id === id);
    }
  
    // Filter by 'IsDone' if present
    if (isDone !== undefined) {
      // Convert IsDone to boolean since it comes as a string from query parameters
      const isDoneBool = isDone.toLowerCase() === 'true';
      filteredData = filteredData.filter(d => d.isDone === isDoneBool);
    }
  
    // Return filtered data
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
