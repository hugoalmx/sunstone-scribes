import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Se quiser restringir a origem, use: cors({ origin: 'http://localhost:8080' })

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://sunstone-scribes.vercel.app", // <-- seu domínio no Vercel
];
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: (origin, cb) => {
      // permite ferramentas sem origin (ex: curl/health)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // deixe false se você NÃO usa cookies/autenticação
  })
);

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
    content: { type: String, required: true},
    tags: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    // 👇 Enum PT-BR + default corrigido
    mood: { type: String, enum: ['feliz','neutro','triste','animado','deboa'], default: 'neutro' },
    progress: { type: Number, enum: [0, 25, 50, 75, 100], default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
  

);

// util pra transformar HTML do Quill em texto "real"
function stripHtmlToText(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')   // remove tags
    .replace(/&nbsp;/g, ' ')    // nbsp
    .replace(/\s+/g, ' ')
    .trim();
}

// valida conteúdo não-vazio (considera <p><br></p>)
NoteSchema.path('content').validate(function (v) {
  return stripHtmlToText(v).length > 0;
}, 'Conteúdo não pode ser vazio');

// se não vier título, gera a partir do conteúdo
NoteSchema.pre('save', function(next) {
  if (!this.title?.trim()) {
    const text = stripHtmlToText(this.content);
    this.title = text.slice(0, 60) || 'Sem título';
  }
  next();
});

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


app.options("*", cors());

// --- Rotas ---
app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Not found' })
    res.json(note)
  } catch (e) {
    res.status(400).json({ message: 'ID inválido' })
  }
})

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
    const msg = e?.name === 'ValidationError' ? e.message : 'Erro ao criar nota';
    res.status(400).json({ error: msg });
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

app.patch('/notes/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    // valida valores permitidos
    if (![0, 25, 50, 75, 100].includes(progress)) {
      return res.status(400).json({ message: 'Valor inválido de progress' });
    }

    const updated = await Note.findByIdAndUpdate(
      id,
      { progress },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Erro no PATCH /notes/:id/progress', err);
    res.status(500).json({ message: 'Erro ao atualizar progresso' });
  }
});

// Excluir
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const deleted = await Note.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Nota não encontrada' });
    // 204 = sucesso sem body
    return res.status(204).send();
  } catch (e) {
    console.error('DELETE /notes/:id', e);
    return res.status(500).json({ error: 'Erro ao excluir nota' });
  }
});

// Tags agregadas
app.get('/tags', async (_req, res) => {
  try {
    const tags = await Note.aggregate([
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { id: '$tags', count: { $sum: 1 } } },
      { $sort: { id: 1 } }
    ]);
    res.json(tags.map(t => t.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`🚀 API em http://localhost:${PORT}`));

fetch("https://ifconfig.me/ip").then(r => r.text()).then(ip => {
  console.log("Egress IP (Render):", ip.trim());
}).catch(()=>{});
