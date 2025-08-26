import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Se quiser restringir a origem, use: cors({ origin: 'http://localhost:8080' })
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// --- Conexão MongoDB ---
const { MONGODB_URI, PORT = 4000 } = process.env;
mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB conectado');
}).catch(err => {
  console.error('❌ Erro ao conectar no MongoDB:', err.message);
});

// --- Schema/Model ---
const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    // 👇 Enum PT-BR + default corrigido
    mood: { type: String, enum: ['feliz','neutro','triste','animado','deboa'], default: 'neutro' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Note = mongoose.model('Note', NoteSchema);

// --- Helpers ---
const buildQuery = (q, tags, archived, mood) => {
  const query = {};
  if (archived !== undefined) query.archived = archived === 'true';

  if (q) {
    const rx = new RegExp(q, 'i');
    query.$or = [{ title: rx }, { content: rx }];
  }

  if (tags) {
    const arr = String(tags).split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length) query.tags = { $all: arr };
  }

 if (mood) {
    // aceita PT-BR e possíveis valores antigos em EN
    const map = {
      feliz:   ['feliz', 'happy'],
      neutro:  ['neutro', 'neutral'],
      triste:  ['triste', 'sad'],
      animado: ['animado', 'excited'],
      deboa:   ['deboa', 'calm'],
    };
    const list = map[mood] || [mood];
    query.mood = { $in: list };
  }

  return query;
};

// --- Rotas ---
app.get('/health', (_, res) => res.json({ ok: true }));

// Listar (suporta ?q=&tags=a,b&archived=true/false&mood=feliz|neutro|...)
app.get('/notes', async (req, res) => {
  try {
    const { q, tags, archived, mood } = req.query;
    const query = buildQuery(q, tags, archived, mood);
    const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Criar
app.post('/notes', async (req, res) => {
  try {
    const { title = "", content = "", tags = [], mood } = req.body ?? {};
    const note = await Note.create({ title, content, tags, mood });
    res.status(201).json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Atualizar (edição geral)
app.put('/notes/:id', async (req, res) => {
  try {
    const patch = req.body ?? {};
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { ...patch, updatedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Ações rápidas
app.patch('/notes/:id/pin', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
    note.pinned = !note.pinned;
    note.updatedAt = new Date();
    await note.save();
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.patch('/notes/:id/archive', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });
    note.archived = !note.archived;
    note.updatedAt = new Date();
    await note.save();
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Tags agregadas
app.get('/tags', async (_req, res) => {
  try {
    const tags = await Note.aggregate([
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(tags.map(t => t._id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`🚀 API em http://localhost:${PORT}`));
