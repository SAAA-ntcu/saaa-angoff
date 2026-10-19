/**
 * SAAA 心理計量數學核心與高精度算術
 */
export class SAAAMath {
  /**
   * 純整數算術四捨五入 (BigInt)
   * 公式：(2 * 10^digits * |k| + |n|) // (2 * |n|)
   */
  static roundHalfUpRatio(k, n, digits = 2) {
    if (n === 0) return 0.0;
    const sign = (k >= 0) === (n >= 0) ? 1 : -1;
    const kAbs = BigInt(Math.abs(Math.round(k)));
    const nAbs = BigInt(Math.abs(Math.round(n)));
    const factor = BigInt(10 ** digits);
    const roundedInt = (2n * factor * kAbs + nAbs) / (2n * nAbs);
    return sign * (Number(roundedInt) / (10 ** digits));
  }

  /**
   * 浮點數四捨五入 (含 1e-12 精度微擾，消除 0.425 * 100 = 42.49999999999999 誤差)
   */
  static roundHalfUpFloat(val, digits = 2) {
    if (val === null || val === undefined || isNaN(val)) return NaN;
    const factor = 10 ** digits;
    const sign = val >= 0 ? 1 : -1;
    return sign * (Math.floor(Math.abs(val) * factor + 0.5 + 1e-12) / factor);
  }

  /**
   * 切截分數取整演算法 (對齊 r-angoff 02_analysis.R round_cut_score)
   * @param {number} x 
   * @param {'half_up' | 'ceiling' | 'floor' | 'bankers'} method 
   */
  static roundCutScore(x, method = 'half_up') {
    if (x === null || x === undefined || isNaN(x)) return NaN;
    switch (method) {
      case 'half_up':
        return Math.floor(x + 0.5);
      case 'ceiling':
        return Math.ceil(x);
      case 'floor':
        return Math.floor(x);
      case 'bankers': {
        const i = Math.floor(x);
        const f = x - i;
        if (Math.abs(f - 0.5) < 1e-12) {
          return i % 2 === 0 ? i : i + 1;
        }
        return Math.round(x);
      }
      default:
        return Math.floor(x + 0.5);
    }
  }

  /**
   * 樣本無偏標準差 (ddof = 1, 與 R sd() 完全一致)
   * @param {number[]} arr 
   */
  static sampleSd(arr) {
    const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
    const n = valid.length;
    if (n < 2) return NaN;
    const mean = valid.reduce((a, b) => a + b, 0) / n;
    const sumSq = valid.reduce((acc, v) => acc + (v - mean) ** 2, 0);
    return Math.sqrt(sumSq / (n - 1));
  }

  /**
   * 算術平均數 (與 R mean() 一致)
   * @param {number[]} arr 
   */
  static mean(arr) {
    const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
    if (valid.length === 0) return NaN;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }
}
