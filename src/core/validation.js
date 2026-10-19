import { SCORE_COLUMN_CANDIDATES } from './constants.js';

export function normalizeColumnName(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/\s+/g, '').trim();
}

export function selectItemColumns(headers, itemCount = 'auto') {
  if (!headers || !Array.isArray(headers)) return [];
  const itemCols = headers.filter(h => /^題號/i.test(String(h).trim()));
  if (itemCols.length === 0) return [];

  // Sort by the numeric value inside the column name
  itemCols.sort((a, b) => {
    const numA = parseInt(String(a).replace(/[^\d]/g, ''), 10) || 0;
    const numB = parseInt(String(b).replace(/[^\d]/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return String(a).localeCompare(String(b));
  });

  if (!itemCount || itemCount === 'auto') {
    return itemCols;
  }

  const count = parseInt(itemCount, 10);
  if (isNaN(count) || count < 1) {
    return itemCols;
  }

  return itemCols.slice(0, Math.min(count, itemCols.length));
}

export function findScoreColumnCandidates(headers) {
  if (!headers || !Array.isArray(headers)) return [];
  const normalizedHeaders = headers.map(h => ({ original: h, norm: normalizeColumnName(h) }));
  const preferred = [];

  for (const candidate of SCORE_COLUMN_CANDIDATES) {
    const normCand = normalizeColumnName(candidate);
    const match = normalizedHeaders.find(h => h.norm === normCand);
    if (match && !preferred.includes(match.original)) {
      preferred.push(match.original);
    }
  }

  return preferred;
}

export function validateExpertData(rows, headers, missingPolicy = 'error', itemCount = 'auto') {
  const errors = [];
  const warnings = [];

  if (!rows || rows.length === 0) {
    return { valid: false, errors: ['專家評分資料沒有任何資料列。'], warnings, data: null };
  }

  // Check duplicate headers
  const seenHeaders = new Set();
  for (const h of headers) {
    if (seenHeaders.has(h)) {
      return { valid: false, errors: ['資料含有重複欄名，請先重新命名後再分析。'], warnings, data: null };
    }
    seenHeaders.add(h);
  }

  if (!headers.includes('成員代碼')) {
    return { valid: false, errors: ['缺少必要欄位「成員代碼」。'], warnings, data: null };
  }

  const itemCols = selectItemColumns(headers, itemCount);
  if (itemCols.length === 0) {
    return { valid: false, errors: ['找不到以「題號」開頭的題目欄位。'], warnings, data: null };
  }

  const memberIds = [];
  let blankIdCount = 0;
  const duplicateIdCheck = new Map();

  for (let r = 0; r < rows.length; r++) {
    const rawId = rows[r]['成員代碼'];
    const id = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';
    if (!id) {
      blankIdCount++;
    } else {
      duplicateIdCheck.set(id, (duplicateIdCheck.get(id) || 0) + 1);
    }
    memberIds.push(id);
  }

  if (blankIdCount > 0) {
    errors.push(`有 ${blankIdCount} 筆資料缺少成員代碼。`);
  }

  const duplicatedIds = [];
  for (const [id, count] of duplicateIdCheck.entries()) {
    if (count > 1) duplicatedIds.push(id);
  }
  if (duplicatedIds.length > 0) {
    errors.push(`成員代碼不可重複：${duplicatedIds.join('、')}`);
  }

  const uniqueValidMembers = Array.from(duplicateIdCheck.keys());
  if (uniqueValidMembers.length < 2) {
    errors.push('至少需要兩位有效專家才能計算標準差。');
  }

  // Check score matrix
  const scoreMatrix = []; // [row][col]
  const invalidPositions = [];
  const missingPositions = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const memberId = memberIds[r] || `Row${r + 1}`;
    const rowScores = [];

    for (let c = 0; c < itemCols.length; c++) {
      const colName = itemCols[c];
      const rawVal = row[colName];
      const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

      const isBlankToken = strVal.toUpperCase() === 'BLANK' || strVal === '';

      if (isBlankToken) {
        missingPositions.push(`${memberId}／${colName}`);
        rowScores.push(NaN);
      } else {
        const numVal = Number(strVal);
        if (isNaN(numVal) || ![1, 2, 3].includes(numVal)) {
          invalidPositions.push(`${memberId}／${colName}`);
          rowScores.push(NaN);
        } else {
          rowScores.push(numVal);
        }
      }
    }
    scoreMatrix.push(rowScores);
  }

  if (invalidPositions.length > 0) {
    const displayPos = invalidPositions.slice(0, 12);
    const suffix = invalidPositions.length > 12 ? ` 另有 ${invalidPositions.length - 12} 處` : '';
    errors.push(`評分只能是 1、2、3；非法位置：${displayPos.join('、')}${suffix}`);
  }

  if (missingPositions.length > 0) {
    const displayPos = missingPositions.slice(0, 12);
    const suffix = missingPositions.length > 12 ? ` 另有 ${missingPositions.length - 12} 處` : '';
    const message = `發現缺答位置：${displayPos.join('、')}${suffix}`;
    if (missingPolicy === 'error') {
      errors.push(message);
    } else {
      warnings.push(`${message}；統計時將排除缺值。`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    memberIds,
    itemCols,
    scoreMatrix,
    numExperts: rows.length,
    numItems: itemCols.length
  };
}

export function validateStudentData(rows, scoreCol, maxScore = null) {
  const errors = [];
  const warnings = [];

  if (!rows || rows.length === 0) {
    return { valid: false, errors: ['學生資料沒有任何資料列。'], warnings, validScores: [] };
  }

  if (!scoreCol) {
    return { valid: false, errors: ['請明確選擇學生分數欄位。'], warnings, validScores: [] };
  }

  let invalidCount = 0;
  const validScores = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i][scoreCol];
    const num = Number(raw);
    if (raw === undefined || raw === null || raw === '' || isNaN(num) || !isFinite(num)) {
      invalidCount++;
    } else {
      validScores.push(num);
    }
  }

  if (invalidCount > 0) {
    warnings.push(`有 ${invalidCount} 筆分數無法轉為數值，將不納入分類。`);
  }

  if (validScores.length === 0) {
    errors.push('學生資料沒有可用的數值分數。');
  }

  if (validScores.some(s => s < 0)) {
    errors.push('學生分數不可小於 0。');
  }

  if (maxScore !== null && validScores.some(s => s > maxScore)) {
    errors.push(`學生分數不可高於題目總數 ${maxScore}。`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    scoreCol,
    validScores,
    totalCount: rows.length
  };
}

export function validateThresholds(baseThreshold, masteryThreshold, maxScore) {
  const errors = [];
  const base = Number(baseThreshold);
  const mastery = Number(masteryThreshold);

  if (isNaN(base) || !isFinite(base)) {
    errors.push('基礎門檻必須是有效數值。');
  }
  if (isNaN(mastery) || !isFinite(mastery)) {
    errors.push('精熟門檻必須是有效數值。');
  }

  if (errors.length === 0) {
    if (base < 0 || mastery > maxScore) {
      errors.push(`門檻必須介於 0 與 ${maxScore} 之間。`);
    }
    if (base >= mastery) {
      errors.push('基礎門檻必須低於精熟門檻。');
    }
  }

  return { valid: errors.length === 0, errors };
}
