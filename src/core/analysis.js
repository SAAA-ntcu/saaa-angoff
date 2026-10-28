import { SAAAMath } from './math.js';
import { validateExpertData, validateThresholds } from './validation.js';

export function extractItemNumber(itemCol) {
  const match = String(itemCol).match(/\d+/);
  return match ? parseInt(match[0], 10) : NaN;
}

export function calcExpertStats(rows, headers, missingPolicy = 'error', itemCount = 'auto') {
  const validation = validateExpertData(rows, headers, missingPolicy, itemCount);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  const { scoreMatrix, itemCols, memberIds, numExperts, numItems } = validation;

  // Item statistics
  const itemStats = [];
  for (let c = 0; c < numItems; c++) {
    const colScores = [];
    for (let r = 0; r < numExperts; r++) {
      const val = scoreMatrix[r][c];
      if (!isNaN(val)) colScores.push(val);
    }

    const sd = SAAAMath.sampleSd(colScores);
    const validCount = colScores.length;
    // r-angoff's safe_sd() returns NA for fewer than two ratings and removes
    // those rows from item statistics and the variance sheet.
    if (isNaN(sd)) continue;

    const c1 = colScores.filter(v => v === 1).length;
    const c2 = colScores.filter(v => v === 2).length;
    const c3 = colScores.filter(v => v === 3).length;

    itemStats.push({
      題號: extractItemNumber(itemCols[c]),
      題目欄位: itemCols[c],
      標準差: sd,
      有效人數: validCount,
      待加強人數: c1,
      基礎人數: c2,
      精熟人數: c3,
      待加強: validCount > 0 ? c1 / validCount : 0,
      基礎: validCount > 0 ? c2 / validCount : 0,
      精熟: validCount > 0 ? c3 / validCount : 0
    });
  }

  // Sort item stats by item number
  itemStats.sort((a, b) => {
    if (Number.isNaN(a.題號) !== Number.isNaN(b.題號)) {
      return Number.isNaN(a.題號) ? 1 : -1;
    }
    return a.題號 - b.題號;
  });

  // Cut scores per expert
  const cutScoresRaw = [];
  const baseScores = [];
  const masteryScores = [];

  for (let r = 0; r < numExperts; r++) {
    const row = scoreMatrix[r];
    let baseCount = 0;
    let masteryCount = 0;

    for (let c = 0; c < numItems; c++) {
      const v = row[c];
      if (v === 1) baseCount++;
      if (v === 1 || v === 2) masteryCount++;
    }

    cutScoresRaw.push({
      成員代碼: memberIds[r],
      基礎切截分數: baseCount,
      精熟切截分數: masteryCount
    });

    baseScores.push(baseCount);
    masteryScores.push(masteryCount);
  }

  const rawBaseAvg = SAAAMath.mean(baseScores);
  const rawBaseSd = SAAAMath.sampleSd(baseScores);
  const rawMastAvg = SAAAMath.mean(masteryScores);
  const rawMastSd = SAAAMath.sampleSd(masteryScores);

  return {
    itemStats,
    cutScoresRaw,
    baseAvg: SAAAMath.roundToEven(rawBaseAvg),
    baseSd: SAAAMath.roundToEven(rawBaseSd),
    mastAvg: SAAAMath.roundToEven(rawMastAvg),
    mastSd: SAAAMath.roundToEven(rawMastSd),
    rawBaseAvg,
    rawBaseSd,
    rawMastAvg,
    rawMastSd,
    itemCols,
    scoreMatrix,
    memberIds,
    warnings: validation.warnings,
    missingPolicy
  };
}

export function generateCutScores(cutScoresRaw, baseAvg, baseSd, mastAvg, mastSd) {
  const numExperts = cutScoresRaw.length;
  const expertLabels = cutScoresRaw.map(e => `專家 ${e.成員代碼}`);

  const rows = [
    { 指標: '基礎切截分數', values: cutScoresRaw.map(e => e.基礎切截分數) },
    { 指標: '精熟切截分數', values: cutScoresRaw.map(e => e.精熟切截分數) },
    { 指標: '基礎+1', values: Array(numExperts).fill(baseAvg + baseSd) },
    { 指標: '基礎', values: Array(numExperts).fill(baseAvg) },
    { 指標: '基礎-1', values: Array(numExperts).fill(baseAvg - baseSd) },
    { 指標: '精熟+1', values: Array(numExperts).fill(mastAvg + mastSd) },
    { 指標: '精熟', values: Array(numExperts).fill(mastAvg) },
    { 指標: '精熟-1', values: Array(numExperts).fill(mastAvg - mastSd) }
  ];

  const cutScoreMatrix = rows.map(r => {
    const mean = SAAAMath.roundToEven(SAAAMath.mean(r.values));
    const sd = SAAAMath.roundToEven(SAAAMath.sampleSd(r.values));
    const obj = { 指標: r.指標 };
    r.values.forEach((v, idx) => {
      obj[expertLabels[idx]] = v;
    });
    obj['平均數'] = isNaN(mean) ? 0 : mean;
    obj['標準差'] = isNaN(sd) ? 0 : sd;
    return obj;
  });

  return { cutScoreMatrix, numExperts, expertLabels };
}

export function generateVarSheet(itemStats) {
  const sorted = [...itemStats].sort((a, b) => {
    if (b.標準差 !== a.標準差) {
      return b.標準差 - a.標準差;
    }
    return a.題號 - b.題號;
  });

  return sorted.map(it => ({
    題號: it.題號,
    標準差: it.標準差 === 0 ? '0' : SAAAMath.formatFixed(it.標準差, 2),
    A: SAAAMath.formatPercent(it.待加強, 0),
    B: SAAAMath.formatPercent(it.基礎, 0),
    C: SAAAMath.formatPercent(it.精熟, 0)
  }));
}

export function buildThresholdComparison(analysis) {
  const legacy = analysis.legacyThresholds;
  return [
    {
      等級: '基礎',
      指標: '-1 SD',
      分數: legacy.基礎 - legacy.基礎標準差,
      說明: '基礎 - 1個標準差（寬鬆門檻）'
    },
    {
      等級: '基礎',
      指標: '平均門檻',
      分數: legacy.基礎,
      說明: '基礎等級平均門檻值'
    },
    {
      等級: '基礎',
      指標: '+1 SD',
      分數: legacy.基礎 + legacy.基礎標準差,
      說明: '基礎 + 1個標準差（嚴格門檻）'
    },
    {
      等級: '精熟',
      指標: '-1 SD',
      分數: legacy.精熟 - legacy.精熟標準差,
      說明: '精熟 - 1個標準差（寬鬆門檻）'
    },
    {
      等級: '精熟',
      指標: '平均門檻',
      分數: legacy.精熟,
      說明: '精熟等級平均門檻值'
    },
    {
      等級: '精熟',
      指標: '+1 SD',
      分數: legacy.精熟 + legacy.精熟標準差,
      說明: '精熟 + 1個標準差（嚴格門檻）'
    }
  ];
}

export function calculateAngoff(rows, headers, missingPolicy = 'error', roundingMethod = 'half_up', itemCount = 'auto') {
  const stats = calcExpertStats(rows, headers, missingPolicy, itemCount);

  const { cutScoreMatrix, numExperts, expertLabels } = generateCutScores(
    stats.cutScoresRaw,
    stats.baseAvg,
    stats.baseSd,
    stats.mastAvg,
    stats.mastSd
  );

  const varianceSheet = generateVarSheet(stats.itemStats);

  const currentBase = SAAAMath.roundCutScore(stats.rawBaseAvg, roundingMethod);
  const currentMastery = SAAAMath.roundCutScore(stats.rawMastAvg, roundingMethod);

  const thresholds = {
    raw: { 基礎: stats.rawBaseAvg, 精熟: stats.rawMastAvg },
    current: { 基礎: currentBase, 精熟: currentMastery },
    standardDeviation: { 基礎: stats.rawBaseSd, 精熟: stats.rawMastSd }
  };

  const legacyThresholds = {
    基礎: stats.baseAvg,
    基礎標準差: stats.baseSd,
    精熟: stats.mastAvg,
    精熟標準差: stats.mastSd
  };

  const validation = validateThresholds(currentBase, currentMastery, stats.itemCols.length);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return {
    expertStats: stats.cutScoresRaw,
    itemStats: stats.itemStats,
    varianceSheet,
    cutScoreMatrix,
    thresholds,
    legacyThresholds,
    nExperts: numExperts,
    nItems: stats.itemCols.length,
    itemCols: stats.itemCols,
    expertLabels,
    requestedItemCount: itemCount || 'auto',
    missingPolicy,
    roundingMethod,
    warnings: stats.warnings,
    originalCore: stats
  };
}
