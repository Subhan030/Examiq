import { Request, Response } from 'express';
import { Result } from '../models/Result';

// Jaccard Similarity: |A ∩ B| / |A ∪ B|
function jaccardSimilarity(text1: string, text2: string): number {
  const tokenize = (t: string) => new Set(
    t.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  set1.forEach(word => { if (set2.has(word)) intersection++; });

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

export const checkPlagiarism = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const threshold = parseFloat(req.query.threshold as string) || 0.75;

    const results = await Result.find({ examId }).populate('studentId', 'fullName email');

    if (results.length < 2) {
      return res.json({ flags: [], message: 'Need at least 2 submissions to check.' });
    }

    const flags: any[] = [];
    const answerMap: Record<string, { student: string; answer: string }[]> = {};

    for (const result of results) {
      const studentName = (result as any).studentId?.fullName || (result as any).studentId?.email || 'Unknown';
      for (const detail of result.answersDetail || []) {
        if (typeof detail.userAnswer === 'string' && detail.userAnswer.length > 20) {
          const qId = detail.questionId?.toString();
          if (!qId) continue;
          if (!answerMap[qId]) answerMap[qId] = [];
          answerMap[qId].push({ student: studentName, answer: detail.userAnswer });
        }
      }
    }

    for (const [questionId, submissions] of Object.entries(answerMap)) {
      for (let i = 0; i < submissions.length; i++) {
        for (let j = i + 1; j < submissions.length; j++) {
          const sim = jaccardSimilarity(submissions[i].answer, submissions[j].answer);
          if (sim >= threshold) {
            const questionContent = results[0]?.answersDetail?.find(
              (d: any) => d.questionId?.toString() === questionId
            )?.content || 'Unknown Question';

            flags.push({
              questionContent,
              student1: submissions[i].student,
              student2: submissions[j].student,
              similarity: Math.round(sim * 100),
              answer1: submissions[i].answer,
              answer2: submissions[j].answer,
            });
          }
        }
      }
    }

    flags.sort((a, b) => b.similarity - a.similarity);
    res.json({ flags, totalComparisons: Object.values(answerMap).reduce((acc, arr) => acc + (arr.length * (arr.length - 1)) / 2, 0) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
