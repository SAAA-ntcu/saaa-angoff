import { ANGOFF_LEVELS } from './constants.js';
import { parseFiniteNumericValue, validateStudentData, validateThresholds } from './validation.js';

export function classifyStudents(rows, scoreCol, baseThreshold, masteryThreshold, maxScore) {
  const thresholdValidation = validateThresholds(baseThreshold, masteryThreshold, maxScore);
  if (!thresholdValidation.valid) {
    throw new Error(thresholdValidation.errors.join('\n'));
  }

  const studentValidation = validateStudentData(rows, scoreCol, maxScore);
  if (!studentValidation.valid) {
    throw new Error(studentValidation.errors.join('\n'));
  }

  const counts = { 待加強: 0, 基礎: 0, 精熟: 0 };
  const classified = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const score = parseFiniteNumericValue(row[scoreCol]);
    if (!Number.isFinite(score)) continue;

    let level;
    if (score < baseThreshold) {
      level = '待加強';
    } else if (score < masteryThreshold) {
      level = '基礎';
    } else {
      level = '精熟';
    }

    counts[level]++;
    classified.push({
      ...row,
      分析分數: score,
      等級: level
    });
  }

  const total = classified.length;
  const summary = ANGOFF_LEVELS.map(level => {
    const count = counts[level] || 0;
    return {
      等級: level,
      人數: count,
      百分比: total > 0 ? count / total : 0
    };
  });

  return {
    classified,
    summary,
    totalValid: total,
    warnings: studentValidation.warnings,
    thresholds: {
      基礎: Number(baseThreshold),
      精熟: Number(masteryThreshold)
    }
  };
}
