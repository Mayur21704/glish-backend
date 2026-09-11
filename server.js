const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const https = require('https');
const cors = require('cors');
const db = require('./lib/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/sessions', (req, res) => {
  res.json(db.getSessions());
});

app.post('/api/sessions', (req, res) => {
  const session = db.saveSession(req.body);
  res.json(session);
});

app.get('/api/vocab', (req, res) => {
  res.json(db.getVocab());
});

app.post('/api/vocab', (req, res) => {
  const item = db.saveVocab(req.body);
  res.json(item);
});

app.patch('/api/vocab/:id/toggle', (req, res) => {
  const updated = db.toggleVocab(req.params.id);
  res.json(updated);
});

app.delete('/api/vocab/:id', (req, res) => {
  const result = db.deleteVocab(req.params.id);
  res.json(result);
});

app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

const PRESET_BOOK_LIBRARY = {
  systemdesign: {
    bookTitle: "System Design Interview: An Insider's Guide",
    author: "Alex Xu",
    topic: "System Design & Distributed Scalability",
    pages: [
      {
        pageNumber: 1,
        page: "Page 18",
        chapter: "Chapter 1: Scale from Zero to Millions of Users",
        passage: "Vertical scaling means adding more processing power and memory to a single server, whereas horizontal scaling allows scaling by adding more servers into your resource pool. When traffic grows, a load balancer distributes incoming network requests evenly across healthy web servers, eliminating single points of failure and dramatically improving system availability.",
        keyTerms: ["vertical scaling", "horizontal scaling", "load balancer", "availability", "resource pool"],
      },
      {
        pageNumber: 2,
        page: "Page 42",
        chapter: "Chapter 2: Caching Strategy and Eviction Policies",
        passage: "A cache is a temporary storage area that stores the results of expensive database queries in memory so that subsequent requests are served much faster. Employing an in-memory datastore like Redis reduces the primary database load significantly. However, cache invalidation and eviction policies such as Least Recently Used must be carefully configured to prevent serving stale data.",
        keyTerms: ["in-memory datastore", "cache invalidation", "eviction policies", "stale data", "subsequent"],
      },
      {
        pageNumber: 3,
        page: "Page 85",
        chapter: "Chapter 5: Consistent Hashing for Distributed Nodes",
        passage: "In a distributed system, consistent hashing maps both data keys and server nodes onto a virtual logical ring. When a new cache server is added or an existing node crashes, only a small fraction of keys need to be remapped to different servers. Virtual nodes help distribute data uniformly across physical servers, mitigating hot spot bottlenecks.",
        keyTerms: ["consistent hashing", "virtual ring", "remapped", "virtual nodes", "hot spot bottlenecks"],
      },
      {
        pageNumber: 4,
        page: "Page 114",
        chapter: "Chapter 7: Asynchronous Message Queues",
        passage: "Message queues provide asynchronous decoupling between components in a distributed architecture. Web servers publish tasks into Kafka or RabbitMQ topics, and background worker consumers process them at their own pace. If traffic spikes unpredictably, the queue safely buffers incoming requests, preventing downstream database saturation and cascading service failures.",
        keyTerms: ["asynchronous decoupling", "publish tasks", "consumers", "buffers", "cascading failures"],
      },
      {
        pageNumber: 5,
        page: "Page 168",
        chapter: "Chapter 11: Rate Limiting and Fault Tolerance",
        passage: "A rate limiter controls the rate of traffic sent by a client or service, shielding downstream APIs from abuse, denial of service attacks, and resource starvation. Using the Token Bucket algorithm, incoming requests consume tokens from a finite bucket refreshed at a fixed rate. When the bucket is empty, requests are dropped with HTTP status code 429 Too Many Requests.",
        keyTerms: ["rate limiter", "Token Bucket", "starvation", "HTTP 429", "downstream APIs"],
      },
    ],
  },
  linux: {
    bookTitle: "The Linux Command Line: A Complete Introduction",
    author: "William Shotts",
    topic: "Linux CLI, Shell & Systems",
    pages: [
      {
        pageNumber: 1,
        page: "Page 74",
        chapter: "Chapter 6: Redirection, Pipelines, and Standard Streams",
        passage: "The pipeline is perhaps the most powerful feature of the Linux command line. Using the pipe operator, standard output from one command can be redirected directly into the standard input of another. This allows us to combine simple, single-purpose utilities like grep, sort, and uniq into sophisticated data processing workflows without creating temporary files on the filesystem.",
        keyTerms: ["pipeline", "standard output", "redirection", "single-purpose", "workflows"],
      },
      {
        pageNumber: 2,
        page: "Page 108",
        chapter: "Chapter 10: Process Management and System Signals",
        passage: "Every program running on a Linux system is represented as a process with a unique process identifier. When a command runs in the background using an ampersand, the shell immediately returns a command prompt. Signals like SIGTERM and SIGKILL allow the operating system and administrators to request graceful shutdowns or forcibly terminate unresponsive processes.",
        keyTerms: ["process identifier", "background execution", "SIGTERM", "graceful shutdown", "unresponsive"],
      },
      {
        pageNumber: 3,
        page: "Page 142",
        chapter: "Chapter 13: File Permissions and Access Control",
        passage: "The Linux security model is fundamentally anchored in file permissions divided into read, write, and execute bits across owner, group, and world. The chmod command modifies these permissions using octal notation or symbolic modes, ensuring that sensitive configuration files and private cryptographic keys remain inaccessible to unauthorized system users.",
        keyTerms: ["file permissions", "read write execute", "octal notation", "cryptographic keys", "unauthorized"],
      },
      {
        pageNumber: 4,
        page: "Page 210",
        chapter: "Chapter 18: Archiving, Compression, and Remote Transfer",
        passage: "The tar utility bundles directory trees into a continuous archive stream, while gzip and bzip2 apply compression algorithms to minimize disk consumption and network bandwidth. Combined with secure shell utilities like scp and rsync, system administrators can synchronize production code and database backups efficiently across remote geographic clusters.",
        keyTerms: ["archive stream", "compression algorithms", "bandwidth", "synchronize", "remote clusters"],
      },
      {
        pageNumber: 5,
        page: "Page 288",
        chapter: "Chapter 24: Shell Scripting and Automation Best Practices",
        passage: "Writing robust shell scripts requires strict error handling from the outset. Using set -euo pipefail ensures that scripts immediately terminate if an unbound variable is referenced or if any piped command encounters an error. Defensive scripting practices prevent unintended data corruption and make automated deployment workflows predictable and maintainable.",
        keyTerms: ["shell scripts", "pipefail", "unbound variable", "defensive scripting", "predictable"],
      },
    ],
  },
  ddia: {
    bookTitle: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    topic: "Distributed Systems & Data Architecture",
    pages: [
      {
        pageNumber: 1,
        page: "Page 152",
        chapter: "Chapter 5: Leaders, Followers, and Replication Strategies",
        passage: "In a leader-based replication system, every write to the database must be processed by the leader before being propagated to followers. When network partitions occur, determining whether a node has failed or is merely unreachable presents a fundamental challenge. Asynchronous replication provides high write availability and low latency, but sacrifices strong consistency during failover scenarios.",
        keyTerms: ["replication", "partitions", "unreachable", "asynchronous", "consistency"],
      },
      {
        pageNumber: 2,
        page: "Page 198",
        chapter: "Chapter 6: Partitioning and Secondary Indexes",
        passage: "Partitioning divides a huge dataset into smaller subsets to scale read and write throughput across multiple independent machines. However, secondary indexes complicate partitioning because a single query might need to scatter across all partitions and gather results. Designing partition keys that evenly balance queries is essential to prevent hot spot nodes.",
        keyTerms: ["partitioning", "throughput", "secondary indexes", "scatter gather", "balance queries"],
      },
      {
        pageNumber: 3,
        page: "Page 224",
        chapter: "Chapter 7: Transactions and Isolation Levels",
        passage: "ACID transactions provide safety guarantees that allow application code to treat a sequence of database operations as an indivisible atomic unit. Weaker isolation levels like Read Committed protect against dirty reads, but Snapshot Isolation is required to eliminate non-repeatable read anomalies in high-concurrency banking and inventory databases.",
        keyTerms: ["atomic unit", "Read Committed", "dirty reads", "Snapshot Isolation", "concurrency"],
      },
      {
        pageNumber: 4,
        page: "Page 348",
        chapter: "Chapter 9: Consistency and Consensus in Raft",
        passage: "Reaching consensus among distributed nodes is one of the most celebrated problems in computer science. Algorithms like Raft and Paxos ensure that even in the presence of node crashes and unreliable network delays, a cluster of machines can agree on an ordered sequence of state machine transitions without creating split-brain divergence.",
        keyTerms: ["consensus", "Raft Paxos", "unreliable delays", "state machine", "split-brain"],
      },
      {
        pageNumber: 5,
        page: "Page 412",
        chapter: "Chapter 11: Stream Processing and Event Sourcing",
        passage: "In event-driven architectures, state is not stored as a static snapshot, but as an append-only log of immutable historical facts. Stream processing frameworks ingest these event streams in real time, computing continuous aggregations, detecting anomalous transactions, and materializing read-optimized views with sub-second latency.",
        keyTerms: ["append-only log", "immutable facts", "stream processing", "aggregations", "materializing"],
      },
    ],
  },
  cleancode: {
    bookTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    topic: "Software Craftsmanship & Refactoring",
    pages: [
      {
        pageNumber: 1,
        page: "Page 34",
        chapter: "Chapter 3: Functions and the Single Responsibility Principle",
        passage: "Functions should do one thing. They should do it well, and they should do it only. When a function attempts to mix business logic with input validation and database persistence, it becomes brittle and difficult to test. By extracting smaller, descriptive helper functions with singular responsibilities, the code reads naturally like a well-crafted prose narrative.",
        keyTerms: ["responsibility", "persistence", "brittle", "extracting", "narrative"],
      },
      {
        pageNumber: 2,
        page: "Page 56",
        chapter: "Chapter 4: Meaningful Names and Ubiquitous Language",
        passage: "The name of a variable, function, or class should answer all the big questions. It should tell you why it exists, what it does, and how it is used. If a name requires a comment to explain its purpose, then the name has failed. Choosing clear, intention-revealing names saves countless hours of debugging for future teammates.",
        keyTerms: ["intention-revealing", "ubiquitous language", "refactoring", "clarity", "teammates"],
      },
      {
        pageNumber: 3,
        page: "Page 88",
        chapter: "Chapter 6: Objects and Data Structures",
        passage: "Objects hide their data behind abstractions and expose functions that operate on that data. Data structures, conversely, expose their raw data and have no meaningful functions. Conflating the two creates awkward hybrid designs that are difficult to modify. Good object-oriented design adheres strictly to the Law of Demeter.",
        keyTerms: ["abstractions", "data structures", "hybrid designs", "Law of Demeter", "object-oriented"],
      },
      {
        pageNumber: 4,
        page: "Page 104",
        chapter: "Chapter 7: Robust Error Handling and Exceptions",
        passage: "Error handling is important, but if it obscures logic, it is wrong. Clean code isolates error checking from happy-path business logic by using structured exceptions rather than return codes. Never return or pass null values across public API boundaries, as defensive null checks clutter every layer of the codebase.",
        keyTerms: ["happy-path", "structured exceptions", "null checks", "defensive", "clutter"],
      },
      {
        pageNumber: 5,
        page: "Page 122",
        chapter: "Chapter 9: Unit Tests and the Three Laws of TDD",
        passage: "Clean unit tests must be readable, fast, independent, repeatable, and timely. Test code is just as important as production code; it requires the same care, clean naming, and refactoring discipline. Well-written automated tests give engineers the courage and safety net to continuously refactor architecture without fear of regression.",
        keyTerms: ["unit tests", "refactoring discipline", "safety net", "courage", "regression"],
      },
    ],
  },
  aws: {
    bookTitle: "AWS Well-Architected Framework: Reliability Pillar",
    author: "Amazon Web Services",
    topic: "Cloud Architecture & Event-Driven Systems",
    pages: [
      {
        pageNumber: 1,
        page: "Page 28",
        chapter: "Section 4: Fault Tolerance and Event-Driven Microservices",
        passage: "Building resilient cloud architectures requires designing for failure as a constant rather than an exception. In an event-driven architecture using Amazon SQS and Lambda, decoupling producers from consumers allows asynchronous processing and automatic retry mechanisms with exponential backoff. Idempotent request handling ensures that duplicate message deliveries do not corrupt the underlying datastore.",
        keyTerms: ["resilient", "decoupling", "asynchronous", "exponential", "idempotent"],
      },
      {
        pageNumber: 2,
        page: "Page 54",
        chapter: "Section 6: Multi-AZ Redundancy and Self-Healing",
        passage: "Deploying applications across multiple Availability Zones protects workloads against isolated data center outages. Amazon Aurora automatically replicates database storage across three zones, performing transparent sub-minute failover if the primary instance degrades. Health checks allow application load balancers to divert traffic automatically away from unhealthy container instances.",
        keyTerms: ["Availability Zones", "Aurora", "sub-minute failover", "health checks", "divert traffic"],
      },
      {
        pageNumber: 3,
        page: "Page 76",
        chapter: "Section 8: Elasticity and Auto Scaling Policies",
        passage: "Elasticity is the ability to acquire resources as you need them and release them when you do not. Modern architectures employ target tracking scaling policies that adjust container tasks based on real-time request counts and CPU utilization. This dynamic provisioning minimizes infrastructure costs during off-peak hours while guaranteeing burst capacity.",
        keyTerms: ["elasticity", "target tracking", "provisioning", "off-peak", "burst capacity"],
      },
      {
        pageNumber: 4,
        page: "Page 98",
        chapter: "Section 10: Security and Principle of Least Privilege",
        passage: "Security in the cloud begins with identity and access management. Granting only the minimum permissions necessary to perform a task prevents accidental data exposure and lateral privilege escalation. IAM roles with temporary credentials replace long-lived access keys, while KMS customer master keys encrypt sensitive data at rest.",
        keyTerms: ["least privilege", "lateral escalation", "temporary credentials", "KMS encryption", "data at rest"],
      },
      {
        pageNumber: 5,
        page: "Page 130",
        chapter: "Section 12: Disaster Recovery Strategies",
        passage: "Disaster recovery planning balances business recovery objectives against financial expenditure. Strategies range from low-cost Backup and Restore to Pilot Light, Warm Standby, and multi-region Active-Active configurations. Continuous automated disaster simulations validate that failover routing mechanisms execute reliably when catastrophic regional failures occur.",
        keyTerms: ["recovery objectives", "Warm Standby", "Active-Active", "disaster simulations", "catastrophic"],
      },
    ],
  },
  sre: {
    bookTitle: "Site Reliability Engineering: How Google Runs Production Systems",
    author: "Betsy Beyer, Chris Jones, Jennifer Petoff & Niall Richard Murphy",
    topic: "Site Reliability & Production Engineering",
    pages: [
      {
        pageNumber: 1,
        page: "Page 41",
        chapter: "Chapter 4: Service Level Objectives and Error Budgets",
        passage: "Hope is not a strategy in production operations. By establishing rigorous Service Level Indicators and Service Level Objectives, engineering teams create a quantifiable boundary between system reliability and feature velocity. The error budget acts as a shared metric that aligns the incentives of product developers with the operational demands of system availability.",
        keyTerms: ["reliability", "quantifiable", "velocity", "incentives", "operational"],
      },
      {
        pageNumber: 2,
        page: "Page 72",
        chapter: "Chapter 5: Eliminating Toil with Software Engineering",
        passage: "Toil is the kind of work tied to running a production service that tends to be manual, repetitive, and devoid of enduring value. SRE teams deliberately cap operational toil at fifty percent of their time, dedicating the remaining engineering effort to automating deployments, building self-healing infrastructure, and addressing root systemic problems.",
        keyTerms: ["toil", "repetitive", "enduring value", "self-healing", "systemic"],
      },
      {
        pageNumber: 3,
        page: "Page 110",
        chapter: "Chapter 6: The Four Golden Signals of Monitoring",
        passage: "Effective production telemetry focuses on latency, traffic, errors, and saturation. Latency measures the time it takes to service a request, distinguishing between successful responses and failed requests. Saturation provides a preview of impending performance degradation by measuring memory and CPU capacity constrained by resource limits.",
        keyTerms: ["telemetry", "golden signals", "latency", "saturation", "degradation"],
      },
      {
        pageNumber: 4,
        page: "Page 180",
        chapter: "Chapter 15: Blameless Postmortems and Incident Culture",
        passage: "When production outages inevitably occur, conducting a blameless postmortem assumes that everyone involved had good intentions and acted on the best information available at the time. Shifting the focus from human blame to architectural resilience and systemic safeguards fosters psychological safety and transparent institutional learning.",
        keyTerms: ["postmortem", "blameless", "intentions", "systemic safeguards", "psychological safety"],
      },
      {
        pageNumber: 5,
        page: "Page 246",
        chapter: "Chapter 21: Handling Cascading Failures and Overload",
        passage: "A cascading failure is a failure that enlarges over time as a result of positive feedback loops. When one service instance fails, remaining instances receive higher traffic, triggering resource exhaustion and widespread outage. Implementing client-side rate limits, deadline propagation, and aggressive circuit breakers shields core services under severe overload.",
        keyTerms: ["cascading failure", "feedback loops", "resource exhaustion", "deadline propagation", "circuit breakers"],
      },
    ],
  },
};

// Book Passage Generation / Discovery Endpoint (Supports 5-Page Navigation)
app.post('/api/book-passage', async (req, res) => {
  const { query, preset, page = 1 } = req.body || {};
  const requestedPage = Math.max(1, Math.min(5, parseInt(page, 10) || 1));

  // Check preset library first if provided
  if (preset && PRESET_BOOK_LIBRARY[preset]) {
    const book = PRESET_BOOK_LIBRARY[preset];
    const pageIndex = requestedPage - 1;
    const pageData = book.pages[pageIndex] || book.pages[0];

    return res.json({
      success: true,
      bookTitle: book.bookTitle,
      author: book.author,
      topic: book.topic,
      presetKey: preset,
      currentPage: pageData.pageNumber,
      totalPages: book.pages.length,
      page: pageData.page,
      chapter: pageData.chapter,
      passage: pageData.passage,
      keyTerms: pageData.keyTerms,
    });
  }

  // If query is provided, check if it directly matches a preset keyword
  const lowerQuery = (query || '').toLowerCase().trim();
  for (const [key, book] of Object.entries(PRESET_BOOK_LIBRARY)) {
    if (lowerQuery.includes(key) || lowerQuery.includes(book.topic.toLowerCase()) || lowerQuery.includes('system design')) {
      const pageIndex = requestedPage - 1;
      const pageData = book.pages[pageIndex] || book.pages[0];
      return res.json({
        success: true,
        bookTitle: book.bookTitle,
        author: book.author,
        topic: book.topic,
        presetKey: key,
        currentPage: pageData.pageNumber,
        totalPages: book.pages.length,
        page: pageData.page,
        chapter: pageData.chapter,
        passage: pageData.passage,
        keyTerms: pageData.keyTerms,
      });
    }
  }

  // Attempt dynamic generation with Gemini if API key available
  if (GEMINI_API_KEY && query && query.trim()) {
    try {
      const prompt = `You are a developer education assistant. A software developer wants to practice spoken English by reading excerpt (Page ${requestedPage} of 5) about: "${query}".
Identify an authoritative, famous technical engineering book (e.g. O'Reilly, Addison-Wesley, No Starch Press, or official cloud guides).
Generate a realistic, high-impact paragraph (55 to 80 words) for reading aloud to practice natural technical English cadence.
Return strictly valid JSON without markdown:
{
  "bookTitle": "Name of the famous book",
  "author": "Author name",
  "chapter": "Chapter name or section",
  "page": "Page ${requestedPage * 25 + 10}",
  "topic": "Brief topic summary",
  "passage": "The educational paragraph for reading aloud.",
  "keyTerms": ["3-5", "key", "architectural", "words"]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
          return res.json({
            success: true,
            currentPage: requestedPage,
            totalPages: 5,
            ...parsed,
          });
        }
      }
    } catch (err) {
      console.warn('Gemini book generation error, using fallback:', err.message);
    }
  }

  // Default fallback: return System Design or DDIA
  const fallbackKey = lowerQuery.includes('linux') || lowerQuery.includes('command') ? 'linux' :
                      lowerQuery.includes('cloud') || lowerQuery.includes('aws') ? 'aws' :
                      lowerQuery.includes('code') || lowerQuery.includes('clean') ? 'cleancode' : 'systemdesign';

  const defaultBook = PRESET_BOOK_LIBRARY[fallbackKey];
  const pageIndex = requestedPage - 1;
  const pageData = defaultBook.pages[pageIndex] || defaultBook.pages[0];

  return res.json({
    success: true,
    bookTitle: defaultBook.bookTitle,
    author: defaultBook.author,
    topic: defaultBook.topic,
    presetKey: fallbackKey,
    currentPage: pageData.pageNumber,
    totalPages: defaultBook.pages.length,
    page: pageData.page,
    chapter: pageData.chapter,
    passage: pageData.passage,
    keyTerms: pageData.keyTerms,
  });
});

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1alpha';
const GEMINI_LIVE_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.0-flash-exp';
const GEMINI_FALLBACK_MODEL = 'models/gemini-3.1-flash-lite';
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${GEMINI_API_VERSION}.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

const CONVERSATION_BASE_INSTRUCTION = `
You are having an authentic, spoken English voice conversation with a software developer who wants to sharpen their technical communication, architectural knowledge, and conversational English fluency.

CORE CONVERSATION DIRECTIVES:
1. TALK LIKE A REAL SENIOR TECH PEER: Speak like a warm, supportive Staff Engineer or tech lead colleague. Use natural conversational markers and verbal backchanneling ("Oh nice!", "Yeah, totally", "I hear you", "Honestly, in my experience...", "That makes a lot of sense", "So basically...").
2. SUBSTANTIVE & DETAILED EXPLANATIONS: When the user asks about an architecture, concept, or technical comparison (like Kubernetes, Docker, microservices, system design, or caching), NEVER give a shallow 1-sentence brush-off. Give a clear, rich, substantive explanation (3 to 5 well-crafted spoken sentences, around 60-90 words). Break down the core architecture clearly, connect it to what they already know (e.g. bridging Docker containers to Kubernetes Pods, Control Plane, and Worker Nodes), and explain the "why" with real technical depth!
3. NATURAL SPOKEN FLOW: Talk naturally in paragraphs. Avoid reading robotic numbered lists or bullet points aloud, but explain the key components clearly with conversational pacing. After explaining, bounce back with a natural thought or engaging question to keep the developer chatting.
4. DEVELOPER JARGON & ACCENT TOLERANCE: The user speaks with an Indian-English developer accent, and speech recognition frequently mishears technical terms. ALWAYS infer the true developer intent:
   - "coconut" / "Uber net" / "cuberneties" / "burns" / "cubes" = Kubernetes (K8s)
   - "Joker" / "darker" / "doctor" = Docker
   - "what praise" / "poultry" = WordPress
   - "dragon rope" = drag-and-drop
   - "read is" / "radish" = Redis
   - "cafca" = Kafka
   - "engine X" / "engine x" = Nginx
   Never say "I don't understand" or get confused by these transcription slips—seamlessly address the actual technology (e.g. "Ah, if you know Docker, Kubernetes is going to make total sense! Think of Docker as managing single containers, while Kubernetes...").
5. SILENT BACKGROUND COACHING: If the user makes a grammar error, mispronounces a word, or could use a more native expression, DO NOT correct them in your spoken voice. Instead, emit a silent background tool call (report_grammar_correction, suggest_vocabulary_upgrade, or report_pronunciation_tip) so coaching cards appear in the UI while your spoken technical dialogue flows uninterrupted.
`.trim();

const SCENARIO_PROMPTS = {
  systemdesign: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are a friendly Staff Distributed Systems Architect. Debate system design concepts like distributed caching (Redis), database sharding, message queues (Kafka), horizontal scaling, rate limiting, and CAP theorem tradeoffs while chatting in warm, natural English.`,
  devops: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are a friendly Senior Full-Stack & DevOps Lead. Chat about software engineering, Docker, Kubernetes, CI/CD pipelines, Node.js, React, and cloud architecture while chatting in warm, natural English.`,
  free: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are a warm, casual English conversation partner. Talk like a friendly colleague over coffee about daily life, tech news, books, and hobbies.`,
  interview: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are an empathetic tech hiring manager conducting a mock interview. Ask insightful behavioral and technical questions in a supportive, natural conversational tone.`,
  business: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are an engineering manager in a team roadmap and architecture sync. Practice presenting ideas, discussing tradeoffs, and professional communication.`,
  cafe: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are a friendly, sociable coworker hanging out at a café, having lighthearted and engaging small talk.`,
  ielts: `${CONVERSATION_BASE_INSTRUCTION} Persona: You are a supportive English coach helping with fluency, lexical diversity, and smooth articulation.`
};

const ALL_TOOLS_DECLARATION = {
  functionDeclarations: [
    {
      name: 'report_grammar_correction',
      description: 'Call this tool IMMEDIATELY when the user makes a grammatical mistake in their spoken English.',
      parameters: {
        type: 'OBJECT',
        properties: {
          original_phrase: { type: 'STRING', description: 'The exact incorrect phrase the user said.' },
          corrected_phrase: { type: 'STRING', description: 'How the user should have said it.' },
          explanation: { type: 'STRING', description: 'A short, 1-sentence explanation of the grammar rule.' }
        },
        required: ['original_phrase', 'corrected_phrase', 'explanation']
      }
    },
    {
      name: 'suggest_vocabulary_upgrade',
      description: 'Call this tool when the user uses basic or repetitive words, to suggest a more advanced, native, or elegant expression.',
      parameters: {
        type: 'OBJECT',
        properties: {
          original_phrase: { type: 'STRING', description: 'The basic or plain expression the user said.' },
          upgraded_phrase: { type: 'STRING', description: 'The native, advanced, or idiomatic alternative.' },
          explanation: { type: 'STRING', description: 'Why this upgraded phrase sounds more natural or impressive.' }
        },
        required: ['original_phrase', 'upgraded_phrase', 'explanation']
      }
    },
    {
      name: 'report_pronunciation_tip',
      description: 'Call this tool when the user mispronounces a word or needs phonetic articulation guidance.',
      parameters: {
        type: 'OBJECT',
        properties: {
          word: { type: 'STRING', description: 'The word mispronounced.' },
          phonetic: { type: 'STRING', description: 'Simplified phonetic spelling (e.g. TH-ink).' },
          tip: { type: 'STRING', description: 'Mouth/tongue placement tip to pronounce it correctly.' }
        },
        required: ['word', 'phonetic', 'tip']
      }
    }
  ]
};

function callGeminiFallback(promptText, history = [], scenarioKey = 'free') {
  return new Promise((resolve, reject) => {
    const scenarioPrompt = SCENARIO_PROMPTS[scenarioKey] || SCENARIO_PROMPTS.free;
    const trimmedHistory = history.length > 10 ? history.slice(-10) : history;

    const contents = [
      ...trimmedHistory,
      { role: 'user', parts: [{ text: promptText }] }
    ];

    const postData = JSON.stringify({
      systemInstruction: { parts: [{ text: scenarioPrompt }] },
      contents: contents,
      tools: [ALL_TOOLS_DECLARATION],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            reject(new Error(data.error.message));
            return;
          }

          let resultText = '';
          let toolResults = [];
          const candidateContent = data.candidates && data.candidates[0]?.content;

          if (candidateContent && candidateContent.parts) {
            for (const part of candidateContent.parts) {
              if (part.text) resultText += part.text;
              if (part.functionCall) {
                toolResults.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args
                });
              }
            }
          }

          if (resultText || toolResults.length > 0) {
            resolve({ text: resultText, toolResults, modelTurn: candidateContent });
          } else {
            reject(new Error('No response content returned from Gemini'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

wss.on('connection', (clientWs, req) => {
  console.log('[Server] Client connected to proxy WebSocket');
  const urlParts = (req.url || '').split('?');
  const urlParams = new URLSearchParams(urlParts[1] || '');
  const chosenVoice = urlParams.get('voice') || 'Aoede';
  const chosenScenario = urlParams.get('scenario') || 'free';
  const scenarioInstruction = SCENARIO_PROMPTS[chosenScenario] || SCENARIO_PROMPTS.free;

  let geminiWs = null;
  let isFallbackMode = false;
  let conversationHistory = [];

  function activateFallback(reason) {
    console.log(`[Server] Activating Fallback Engine (${GEMINI_FALLBACK_MODEL}). Reason: ${reason}`);
    isFallbackMode = true;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'fallback_activated',
        engine: GEMINI_FALLBACK_MODEL,
        message: `Connected via ${GEMINI_FALLBACK_MODEL} Fallback Engine`
      }));
    }
  }

  try {
    geminiWs = new WebSocket(GEMINI_WS_URL);
  } catch (err) {
    activateFallback('Failed to init Gemini Live WS');
  }

  if (geminiWs) {
    geminiWs.on('open', () => {
      console.log('[Server] Connected to Gemini Multimodal Live API');
      const setupMessage = {
        setup: {
          model: GEMINI_LIVE_MODEL,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: chosenVoice } }
            }
          },
          systemInstruction: { parts: [{ text: scenarioInstruction }] },
          tools: [ALL_TOOLS_DECLARATION]
        }
      };
      geminiWs.send(JSON.stringify(setupMessage));
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'status', message: 'Connected to Gemini Live' }));
      }
    });

    geminiWs.on('message', (data) => {
      try {
        if (clientWs.readyState === WebSocket.OPEN && !isFallbackMode) {
          const msgString = data.toString();
          const parsed = JSON.parse(msgString);

          if (parsed.toolCall && parsed.toolCall.functionCalls) {
            const responses = parsed.toolCall.functionCalls.map(fc => ({
              id: fc.id,
              name: fc.name,
              response: { output: { success: true } }
            }));
            geminiWs.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
          }
          clientWs.send(msgString);
        }
      } catch (err) {
        console.error('[Server] Relay error:', err);
      }
    });

    geminiWs.on('close', (code, reason) => {
      if (!isFallbackMode) activateFallback(`Live closed code ${code}`);
    });

    geminiWs.on('error', (err) => {
      if (!isFallbackMode) activateFallback(`Live error: ${err.message}`);
    });
  }

  clientWs.on('message', async (data) => {
    try {
      const msgString = data.toString();
      const parsed = JSON.parse(msgString);

      // Support restoring conversation history when resuming past sessions
      if (parsed.type === 'restore_history' && Array.isArray(parsed.history)) {
        conversationHistory = parsed.history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        console.log(`[Server] Restored ${conversationHistory.length} turns of conversation history for scenario "${chosenScenario}".`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'history_restored',
            count: conversationHistory.length,
            message: `Restored ${conversationHistory.length} prior conversation turns.`
          }));
        }
        return;
      }

      if (isFallbackMode) {
        if (parsed.transcript || parsed.textInput) {
          const userPrompt = parsed.transcript || parsed.textInput;
          console.log(`[Fallback Prompt] "${userPrompt}"`);

          const fallbackRes = await callGeminiFallback(userPrompt, conversationHistory, chosenScenario);

          // 1. Tool result cards
          if (fallbackRes.toolResults.length > 0) {
            clientWs.send(JSON.stringify({
              type: 'fallback_response',
              text: fallbackRes.text || null,
              toolResults: fallbackRes.toolResults
            }));
          }

          // 2. 2nd pass for conversational answer if only tools returned
          if (fallbackRes.toolResults.length > 0 && (!fallbackRes.text || !fallbackRes.text.trim())) {
            const fnResponseParts = fallbackRes.toolResults.map(tr => ({
              functionResponse: { name: tr.name, response: { status: 'logged' } }
            }));
            const toolHistory = [
              ...conversationHistory,
              { role: 'user', parts: [{ text: userPrompt }] },
              fallbackRes.modelTurn,
              { role: 'user', parts: fnResponseParts }
            ];
            const secondRes = await callGeminiFallback("Now directly answer the user's question or continue the conversation in under 25 words.", toolHistory, chosenScenario);
            if (secondRes.text) {
              fallbackRes.text = secondRes.text;
              clientWs.send(JSON.stringify({
                type: 'fallback_response',
                text: secondRes.text,
                toolResults: []
              }));
            }
          } else if (fallbackRes.text && fallbackRes.toolResults.length === 0) {
            clientWs.send(JSON.stringify({
              type: 'fallback_response',
              text: fallbackRes.text,
              toolResults: []
            }));
          }

          conversationHistory.push({ role: 'user', parts: [{ text: userPrompt }] });
          conversationHistory.push({ role: 'model', parts: [{ text: fallbackRes.text || "Got it!" }] });
          if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
        }
      } else {
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.send(msgString);
        }
      }
    } catch (err) {
      console.error('[Server] Message handling error:', err);
    }
  });

  clientWs.on('close', () => {
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` zoro AI v2 Backend running on http://localhost:${PORT}`);
  console.log(` WebSocket Proxy listening on ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
