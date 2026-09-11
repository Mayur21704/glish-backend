const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Store database file in backend/data/glish.db
const DATA_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'glish.db')
const db = new Database(DB_PATH)

// Enable Write-Ahead Logging (WAL) for high concurrency and performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Learner',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    started_at TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    words_spoken INTEGER DEFAULT 0,
    cefr_level TEXT DEFAULT 'B2',
    accuracy_percent INTEGER DEFAULT 90,
    transcript TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'vocab',
    original TEXT NOT NULL,
    corrected TEXT NOT NULL,
    explanation TEXT DEFAULT '',
    mastered INTEGER DEFAULT 0,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`)

// Safe schema migrations for existing SQLite databases
try {
  const sessionCols = db.pragma('table_info(sessions)').map(c => c.name)
  if (!sessionCols.includes('user_id')) {
    db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 1')
  }
} catch (e) {
  console.warn('[DB Migration Error sessions]:', e.message)
}

try {
  const vocabCols = db.pragma('table_info(vocab)').map(c => c.name)
  if (!vocabCols.includes('user_id')) {
    db.exec('ALTER TABLE vocab ADD COLUMN user_id INTEGER DEFAULT 1')
  }
} catch (e) {
  console.warn('[DB Migration Error vocab]:', e.message)
}

// Clean up any legacy demo accounts
try {
  db.exec(`
    DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email IN ('alex@glish.ai', 'sarah@glish.ai'));
    DELETE FROM vocab WHERE user_id IN (SELECT id FROM users WHERE email IN ('alex@glish.ai', 'sarah@glish.ai'));
    DELETE FROM users WHERE email IN ('alex@glish.ai', 'sarah@glish.ai');
  `)
} catch (e) {
  // ignore if already clean
}

module.exports = {
  // User Authentication Queries
  getUserByEmail: (email) => {
    if (!email) return null
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email)
  },

  getUserById: (id) => {
    if (!id) return null
    const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(id)
    return user || null
  },

  createUser: ({ name, email, passwordHash, role = 'Learner', avatar = '' }) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'GL'

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, avatar)
      VALUES (?, ?, ?, ?, ?)
    `)
    const res = stmt.run(email.toLowerCase(), passwordHash, name, role, avatar || initials)
    const newUserId = res.lastInsertRowid

    return {
      id: newUserId,
      email: email.toLowerCase(),
      name,
      role,
      avatar: avatar || initials
    }
  },

  // User-scoped Sessions
  getSessions: (userId) => {
    if (!userId) return []
    const rows = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY id DESC').all(userId)
    return rows.map(r => ({
      ...r,
      transcript: typeof r.transcript === 'string' ? JSON.parse(r.transcript || '[]') : r.transcript
    }))
  },

  saveSession: (session, userId) => {
    if (!userId) throw new Error('User ID is required to save session')
    const stmt = db.prepare(`
      INSERT INTO sessions (user_id, scenario, started_at, duration_seconds, words_spoken, cefr_level, accuracy_percent, transcript)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      userId,
      session.scenario || 'General Discussion',
      session.started_at || 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      session.duration_seconds || 0,
      session.words_spoken || 0,
      session.cefr_level || 'B2',
      session.accuracy_percent || 90,
      JSON.stringify(session.transcript || [])
    )
    return { ...session, id: result.lastInsertRowid, user_id: userId }
  },

  // User-scoped Vocab
  getVocab: (userId) => {
    if (!userId) return []
    return db.prepare('SELECT * FROM vocab WHERE user_id = ? ORDER BY id DESC').all(userId).map(r => ({
      ...r,
      mastered: Boolean(r.mastered)
    }))
  },

  saveVocab: (item, userId) => {
    if (!userId) throw new Error('User ID is required to save vocab')
    const stmt = db.prepare(`
      INSERT INTO vocab (user_id, type, original, corrected, explanation, mastered)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      userId,
      item.type || 'vocab',
      item.original || item.original_phrase || '',
      item.corrected || item.upgraded_phrase || item.correction || '',
      item.explanation || item.native_alternative || '',
      item.mastered ? 1 : 0
    )
    return { ...item, id: result.lastInsertRowid, user_id: userId, mastered: Boolean(item.mastered) }
  },

  toggleVocab: (id, userId) => {
    if (!userId) return null
    db.prepare('UPDATE vocab SET mastered = 1 - mastered WHERE id = ? AND user_id = ?').run(id, userId)
    return db.prepare('SELECT * FROM vocab WHERE id = ? AND user_id = ?').get(id, userId)
  },

  deleteVocab: (id, userId) => {
    if (!userId) return { success: false }
    db.prepare('DELETE FROM vocab WHERE id = ? AND user_id = ?').run(id, userId)
    return { success: true, id }
  },

  // User-scoped Stats
  getStats: (userId) => {
    if (!userId) {
      return {
        totalWords: 0,
        totalSessions: 0,
        avgAccuracy: 90,
        streakDays: 0,
        role: 'Learner'
      }
    }

    const row = db.prepare(`
      SELECT 
        COALESCE(SUM(words_spoken), 0) as totalWords,
        COUNT(id) as totalSessions,
        COALESCE(AVG(accuracy_percent), 90) as avgAccuracy
      FROM sessions
      WHERE user_id = ?
    `).get(userId)

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)

    return {
      totalWords: row.totalWords,
      totalSessions: row.totalSessions,
      avgAccuracy: Math.round(row.avgAccuracy),
      streakDays: row.totalSessions > 0 ? 1 : 0,
      role: user ? user.role : 'Learner'
    }
  },
}
