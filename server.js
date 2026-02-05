const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const docsDir = path.join(process.cwd(), 'data', 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

// Get all docs
app.get('/api/docs', (req, res) => {
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.json'));
  const docs = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(docsDir, f), 'utf-8'));
    return { id: f.replace('.json', ''), ...data };
  });
  res.json(docs);
});

// Get single doc
app.get('/api/docs/:id', (req, res) => {
  const filePath = path.join(docsDir, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
});

// Create doc
app.post('/api/docs', (req, res) => {
  const { title, content = '', tags = [] } = req.body;
  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const doc = { title, content, tags, createdAt: new Date(), updatedAt: new Date() };
  fs.writeFileSync(path.join(docsDir, `${id}.json`), JSON.stringify(doc, null, 2));
  res.json({ id, ...doc });
});

// Update doc
app.put('/api/docs/:id', (req, res) => {
  const filePath = path.join(docsDir, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const doc = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const updated = { ...doc, ...req.body, updatedAt: new Date() };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  res.json(updated);
});

// Delete doc
app.delete('/api/docs/:id', (req, res) => {
  const filePath = path.join(docsDir, `${req.params.id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

// Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.json'));
  const results = files
    .map(f => ({ id: f.replace('.json', ''), ...JSON.parse(fs.readFileSync(path.join(docsDir, f), 'utf-8')) }))
    .filter(doc => doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q));
  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AFFiNE Free running on http://localhost:${PORT}`));
