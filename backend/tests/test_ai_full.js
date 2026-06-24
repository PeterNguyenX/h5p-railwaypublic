#!/usr/bin/env node
/**
 * AI functioning test — English and Vietnamese
 * Tests: topic/subtopic generation, question generation, language support
 */
require('dotenv').config();
const { analyzeTranscriptStreamGroq, analyzeTranscriptStreamOllama } = require('./services/aiService');

const EN_SEGMENTS = [
  { start: 0,   end: 20,  text: "Welcome to Introduction to Machine Learning." },
  { start: 20,  end: 60,  text: "Supervised learning uses labeled training data to make predictions." },
  { start: 60,  end: 100, text: "Common supervised algorithms include linear regression and decision trees." },
  { start: 100, end: 160, text: "Unsupervised learning finds hidden patterns in unlabeled data." },
  { start: 160, end: 220, text: "Clustering and dimensionality reduction are key unsupervised techniques." },
  { start: 220, end: 280, text: "Neural networks mimic the human brain with interconnected layers of nodes." },
  { start: 280, end: 340, text: "Deep learning uses many hidden layers to learn complex representations." },
  { start: 340, end: 400, text: "Overfitting occurs when a model learns noise rather than the true signal." },
  { start: 400, end: 439, text: "Summary: ML enables computers to learn from data without explicit programming." },
];

const VI_SEGMENTS = [
  { start: 0,   end: 20,  text: "Chào mừng đến với bài học về Trí tuệ nhân tạo và học máy." },
  { start: 20,  end: 60,  text: "Học có giám sát sử dụng dữ liệu được gán nhãn để dự đoán kết quả." },
  { start: 60,  end: 100, text: "Hồi quy tuyến tính và cây quyết định là các thuật toán phổ biến." },
  { start: 100, end: 160, text: "Học không có giám sát tìm kiếm các mẫu ẩn trong dữ liệu không nhãn." },
  { start: 160, end: 220, text: "Phân cụm và giảm chiều là các kỹ thuật quan trọng trong học không giám sát." },
  { start: 220, end: 280, text: "Mạng nơ-ron nhân tạo mô phỏng bộ não con người với các lớp nút kết nối." },
  { start: 280, end: 340, text: "Học sâu sử dụng nhiều lớp ẩn để học các biểu diễn phức tạp." },
  { start: 340, end: 400, text: "Overfitting xảy ra khi mô hình học nhiễu thay vì tín hiệu thực." },
  { start: 400, end: 439, text: "Tóm tắt: học máy cho phép máy tính học từ dữ liệu mà không cần lập trình rõ ràng." },
];

function collectStream(segments, language) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let ended = false;
    const fakeRes = {
      writeHead: () => {},
      write: (data) => {
        const lines = data.split('\n');
        for (const line of lines) {
          const trimmed = line.replace(/^data: /, '').trim();
          if (!trimmed || trimmed === '[DONE]') continue;
          try {
            const e = JSON.parse(trimmed);
            if (e.type === 'chunk') raw += e.text || '';
            if (e.type === 'done' && !ended) { ended = true; resolve(raw); }
            if (e.type === 'error') reject(new Error(e.message));
          } catch {}
        }
      },
      end: () => { if (!ended) { ended = true; resolve(raw); } }
    };
    // Prefer Groq if key present, else fall back to Ollama
    const groqKey = process.env.GROQ_API_KEY;
    const fn = groqKey ? analyzeTranscriptStreamGroq : analyzeTranscriptStreamOllama;
    fn(segments, fakeRes, null, null, language).catch(reject);
  });
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

async function runTest(label, segments, language) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${label} (lang=${language})`);
  console.log('='.repeat(60));
  const start = Date.now();
  let raw;
  try {
    raw = await collectStream(segments, language);
  } catch (err) {
    console.error(`FAIL: Stream error — ${err.message}`);
    return false;
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const result = extractJson(raw);
  if (!result || !result.topics) {
    console.error('FAIL: Could not parse JSON or missing topics');
    console.log('Raw output preview:', raw.slice(0, 500));
    return false;
  }

  const topics = result.topics;
  console.log(`✅ Topics found: ${topics.length} (${elapsed}s)`);
  let totalQuestions = 0;
  let issues = [];

  for (const topic of topics) {
    const subtopics = topic.subtopics || [];
    const hasTQ = !!topic.question;
    if (!hasTQ) issues.push(`Topic "${topic.title}" missing question`);
    if (hasTQ) totalQuestions++;
    console.log(`  📌 ${topic.title} [${topic.start}s–${topic.end}s] Q:${hasTQ ? topic.question.type : 'MISSING'} subtopics:${subtopics.length}`);
    for (const sub of subtopics) {
      const hasSQ = !!sub.question;
      if (!hasSQ) issues.push(`Subtopic "${sub.title}" missing question`);
      if (hasSQ) totalQuestions++;
      console.log(`     └ ${sub.title} [${sub.start}s] Q:${hasSQ ? sub.question.type : 'MISSING'}`);
    }
  }

  console.log(`\n  Total questions generated: ${totalQuestions}`);
  if (issues.length) {
    console.warn(`  ⚠️  Issues: ${issues.join('; ')}`);
  }

  // Language check for Vietnamese
  if (language === 'vi') {
    const sampleQ = topics[0]?.question;
    const questionText = sampleQ?.question || sampleQ?.fillText || sampleQ?.statement || '';
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(questionText);
    console.log(`  Vietnamese text detected in questions: ${hasVietnamese ? '✅ YES' : '⚠️  NO (may still be OK for technical terms)'}`);
  }

  console.log(issues.length === 0 ? '\n✅ PASS' : '\n⚠️  PASS WITH WARNINGS');
  return true;
}

(async () => {
  let passed = 0;
  if (await runTest('English audio transcript', EN_SEGMENTS, 'en')) passed++;
  if (await runTest('Vietnamese audio transcript', VI_SEGMENTS, 'vi')) passed++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${passed}/2 tests passed`);
  process.exit(passed === 2 ? 0 : 1);
})();
