const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

// Multer em memória (max 10MB, só imagens/vídeos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^(image|video)\//.test(file.mimetype);
    cb(ok ? null : new Error('Apenas imagens ou vídeos'), ok);
  }
});

// Cloudinary é opcional: se CLOUDINARY_URL estiver configurado, usa; senão salva local
let cloudinary = null;
if (process.env.CLOUDINARY_URL) {
  try {
    cloudinary = require('cloudinary').v2;
    console.log('☁️  Cloudinary configurado');
  } catch (e) {
    console.log('⚠️  Pacote cloudinary não instalado, usando armazenamento local');
  }
} else {
  console.log('⚠️  CLOUDINARY_URL não definido, uploads salvos localmente em /public/uploads');
}

function uploadToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('video/') ? 'video' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vivaris-care/momentos', resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

function saveLocal(buffer, originalName) {
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

// POST /api/upload — recebe multipart "file", retorna { url, media_type }
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'photo';
    let url;

    if (cloudinary) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      url = result.secure_url;
    } else {
      // Fallback local — ATENÇÃO: no Railway o filesystem é efêmero,
      // arquivos somem no redeploy. Configure CLOUDINARY_URL em produção!
      url = saveLocal(req.file.buffer, req.file.originalname);
    }

    res.json({ success: true, url, media_type: mediaType, storage: cloudinary ? 'cloudinary' : 'local' });
  } catch (err) {
    console.error('Erro no upload:', err.message);
    res.status(500).json({ error: 'Erro ao fazer upload', details: err.message });
  }
});

module.exports = router;
