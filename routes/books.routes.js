const express = require('express');
const config = require('../config');

const router = express.Router();

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
router.post('/book-passage', async (req, res) => {
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
  if (config.GEMINI_API_KEY && query && query.trim()) {
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`,
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

module.exports = router;
