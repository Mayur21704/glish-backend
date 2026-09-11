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
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

// Seed initial default data if brand new database
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count
if (sessionCount === 0) {
  // Check if legacy store.json exists to migrate
  const legacyStorePath = path.join(DATA_DIR, 'store.json')
  let migrated = false

  if (fs.existsSync(legacyStorePath)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyStorePath, 'utf8'))
      if (Array.isArray(legacy.sessions) && legacy.sessions.length > 0) {
        const insertSession = db.prepare(`
          INSERT INTO sessions (scenario, started_at, duration_seconds, words_spoken, cefr_level, accuracy_percent, transcript)
          VALUES (@scenario, @started_at, @duration_seconds, @words_spoken, @cefr_level, @accuracy_percent, @transcript)
        `)
        for (const s of legacy.sessions) {
          insertSession.run({
            scenario: s.scenario || 'Free Spoken Discussion',
            started_at: s.started_at || 'Recently',
            duration_seconds: s.duration_seconds || 300,
            words_spoken: s.words_spoken || 250,
            cefr_level: s.cefr_level || 'B2',
            accuracy_percent: s.accuracy_percent || 92,
            transcript: JSON.stringify(s.transcript || []),
          })
        }
        migrated = true
        console.log(`[SQLite] Migrated ${legacy.sessions.length} sessions from store.json`)
      }
    } catch (e) {
      console.warn('[SQLite] Failed to migrate store.json:', e.message)
    }
  }

  if (!migrated) {
    const insertSession = db.prepare(`
      INSERT INTO sessions (scenario, started_at, duration_seconds, words_spoken, cefr_level, accuracy_percent, transcript)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertSession.run(
      'System Design & Scalability',
      'Today, 2:30 PM',
      492,
      412,
      'B2',
      94,
      JSON.stringify([
        { role: 'tutor', text: "Hello! Let's debate distributed caching architectures. When would you reach for Redis over local in-memory caching?" },
        { role: 'user', text: "I would use Redis when we need shared state across multiple distributed container instances." },
        { role: 'tutor', text: "Exactly! And how do you handle cache invalidation and stampede issues under high peak traffic?" }
      ])
    )
    insertSession.run(
      'Tech Job Interview (Lead Engineer)',
      'Yesterday, 5:15 PM',
      765,
      680,
      'C1',
      96,
      JSON.stringify([
        { role: 'tutor', text: "Tell me about a time you resolved a critical production latency spike." },
        { role: 'user', text: "Last quarter our database had high CPU usage due to unindexed queries under peak traffic." },
        { role: 'tutor', text: "Great context. What telemetry metrics did you monitor to verify the resolution?" }
      ])
    )
    console.log('[SQLite] Seeded initial sample sessions.')
  }
}

const vocabCount = db.prepare('SELECT COUNT(*) as count FROM vocab').get().count
if (vocabCount === 0) {
  const insertVocab = db.prepare(`
    INSERT INTO vocab (type, original, corrected, explanation, mastered)
    VALUES (?, ?, ?, ?, ?)
  `)
  insertVocab.run(
    'grammar',
    'I go to office yesterday',
    'I went to the office yesterday',
    'Use past tense "went" and the definite article "the office".',
    0
  )
  insertVocab.run(
    'vocab',
    'very good architecture',
    'resilient / decoupled architecture',
    'Sounds significantly more native and authoritative in tech leadership reviews.',
    1
  )
  insertVocab.run(
    'pronunciation',
    'asynchronous',
    'ey-sing-kruh-nuhs (4 syllables)',
    'Stress the 2nd syllable "sing". Avoid saying "a-sync-ro-nius".',
    0
  )
  console.log('[SQLite] Seeded initial vocabulary items.')
}

module.exports = {
  getSessions: () => {
    const rows = db.prepare('SELECT * FROM sessions ORDER BY id DESC').all()
    return rows.map(r => ({
      ...r,
      transcript: typeof r.transcript === 'string' ? JSON.parse(r.transcript || '[]') : r.transcript
    }))
  },

  saveSession: (session) => {
    const stmt = db.prepare(`
      INSERT INTO sessions (scenario, started_at, duration_seconds, words_spoken, cefr_level, accuracy_percent, transcript)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      session.scenario || 'General Discussion',
      session.started_at || 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      session.duration_seconds || 0,
      session.words_spoken || 0,
      session.cefr_level || 'B2',
      session.accuracy_percent || 90,
      JSON.stringify(session.transcript || [])
    )
    return { ...session, id: result.lastInsertRowid }
  },

  getVocab: () => {
    return db.prepare('SELECT * FROM vocab ORDER BY id DESC').all().map(r => ({
      ...r,
      mastered: Boolean(r.mastered)
    }))
  },

  saveVocab: (item) => {
    const stmt = db.prepare(`
      INSERT INTO vocab (type, original, corrected, explanation, mastered)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      item.type || 'vocab',
      item.original || item.original_phrase || '',
      item.corrected || item.upgraded_phrase || item.correction || '',
      item.explanation || item.native_alternative || '',
      item.mastered ? 1 : 0
    )
    return { ...item, id: result.lastInsertRowid, mastered: Boolean(item.mastered) }
  },

  toggleVocab: (id) => {
    db.prepare('UPDATE vocab SET mastered = 1 - mastered WHERE id = ?').run(id)
    return db.prepare('SELECT * FROM vocab WHERE id = ?').get(id)
  },

  deleteVocab: (id) => {
    db.prepare('DELETE FROM vocab WHERE id = ?').run(id)
    return { success: true, id }
  },

  getStats: () => {
    const row = db.prepare(`
      SELECT 
        COALESCE(SUM(words_spoken), 0) as totalWords,
        COUNT(id) as totalSessions,
        COALESCE(AVG(accuracy_percent), 92) as avgAccuracy
      FROM sessions
    `).get()
    return {
      totalWords: row.totalWords,
      totalSessions: row.totalSessions,
      avgAccuracy: Math.round(row.avgAccuracy),
      streakDays: 3,
    }
  },
}
