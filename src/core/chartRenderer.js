import * as echarts from 'echarts';
import { SAAAMath } from './math.js';

/**
 * Build ECharts option for Consistency Scatter Plot (matching R 04_plots.R with clean modern styling)
 */
export function buildConsistencyChartOption(levelName, expertScores, avg, sd) {
  const numExperts = expertScores.length;
  const xLabels = [];
  for (let i = 1; i <= numExperts; i++) {
    xLabels.push(`專家${i}`);
  }
  xLabels.push('平均');

  const high = avg + sd;
  const low = avg - sd;
  const pointsData = [...expertScores, avg];

  const allY = [...pointsData, high, avg, low];
  // The original reports use even-numbered ticks and leave a small, balanced
  // margin around the observed scores.
  const minY = Math.max(0, Math.floor((Math.min(...allY) - 2) / 2) * 2);
  const maxY = Math.ceil((Math.max(...allY) + 2) / 2) * 2;

  // Line segments that span experts 1~N and stop before '平均'
  const highLineData = Array(numExperts).fill(high).concat([null]);
  const avgLineData = Array(numExperts).fill(avg).concat([null]);
  const lowLineData = Array(numExperts).fill(low).concat([null]);

  const levelTag = `${levelName}+1`;
  const avgTag = levelName;
  const lowTag = `${levelName}-1`;
  const pointTag = `${levelName}最低`;

  return {
    // PPTX screenshots are captured immediately after setOption; disable
    // transitions so marks are present in the exported bitmap on first paint.
    animation: false,
    title: {
      text: `各委員預估達${levelName}最低題數`,
      left: 'center',
      top: 12,
      textStyle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1F1F1F',
        fontFamily: 'Microsoft JhengHei, sans-serif'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesType === 'scatter') {
          return `<strong>${params.name}</strong><br/>預估題數：${params.value} 題`;
        }
        return `<strong>${params.seriesName}</strong>：${params.value} 題`;
      }
    },
    legend: {
      // The reference deck places the legend just below the rotated labels,
      // leaving a clear gap before the threshold summary beneath the chart.
      bottom: 190,
      itemGap: 28,
      itemWidth: 36,
      itemHeight: 5,
      data: [
        { name: levelTag, icon: 'line', itemStyle: { color: '#ED7D31' } },
        { name: avgTag, icon: 'line', itemStyle: { color: '#A5A5A5' } },
        { name: lowTag, icon: 'line', itemStyle: { color: '#FFC000' } },
        { name: pointTag, icon: 'circle', itemStyle: { color: '#4472C4' } }
      ],
      textStyle: {
        fontSize: 30,
        fontFamily: 'Microsoft JhengHei, sans-serif',
        color: '#404040'
      }
    },
    grid: {
      top: 100,
      // Leave room for the original 45-degree expert labels.
      bottom: 390,
      left: 112,
      right: 58
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        interval: 0,
        rotate: numExperts > 10 ? 45 : 0,
        fontSize: numExperts > 10 ? 34 : 36,
        color: '#666666',
        margin: 18,
        fontFamily: 'Microsoft JhengHei, sans-serif'
      },
      axisTick: { alignWithLabel: true, lineStyle: { color: '#BFBFBF' } },
      axisLine: { lineStyle: { color: '#BFBFBF' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: minY,
      max: maxY,
      interval: 2,
      axisLabel: {
        fontSize: 30,
        color: '#404040',
        fontFamily: 'Microsoft JhengHei, sans-serif'
      },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: '#D9D9D9', type: 'solid', width: 1 }
      }
    },
    series: [
      // 1. +1 SD horizontal reference segment
      {
        name: levelTag,
        type: 'line',
        data: highLineData,
        symbol: 'none',
        lineStyle: { color: '#ED7D31', width: 4 },
        itemStyle: { color: '#ED7D31' },
        connectNulls: false,
        z: 2
      },
      // 2. Mean horizontal reference segment
      {
        name: avgTag,
        type: 'line',
        data: avgLineData,
        symbol: 'none',
        lineStyle: { color: '#A5A5A5', width: 4 },
        itemStyle: { color: '#A5A5A5' },
        connectNulls: false,
        z: 2
      },
      // 3. -1 SD horizontal reference segment
      {
        name: lowTag,
        type: 'line',
        data: lowLineData,
        symbol: 'none',
        lineStyle: { color: '#FFC000', width: 4 },
        itemStyle: { color: '#FFC000' },
        connectNulls: false,
        z: 2
      },
      // 4. Expert points (Scatter plot with labels on top)
      {
        name: pointTag,
        type: 'scatter',
        data: pointsData,
        symbolSize: numExperts > 10 ? 23 : 25,
        itemStyle: { color: '#4472C4' },
        label: {
          show: true,
          position: 'right',
          distance: 4,
          formatter: '{c}',
          fontSize: numExperts > 10 ? 36 : 38,
          fontWeight: 'bold',
          color: '#000000',
          fontFamily: 'Microsoft JhengHei, sans-serif'
        },
        z: 3
      }
    ]
  };
}

/**
 * Build ECharts option for Student Pie Chart
 */
export function buildPieChartOption(summary) {
  const pieData = [
    { value: summary.find(s => s.等級 === '待加強')?.人數 || 0, name: '待加強', itemStyle: { color: '#4472C4' } },
    { value: summary.find(s => s.等級 === '基礎')?.人數 || 0, name: '基礎', itemStyle: { color: '#ED7D31' } },
    { value: summary.find(s => s.等級 === '精熟')?.人數 || 0, name: '精熟', itemStyle: { color: '#A5A5A5' } }
  ];

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: (params) => `${params.name}：${params.value} 人 (${SAAAMath.roundToEven(params.percent)}%)`
    },
    series: [
      {
        name: '等級比例',
        type: 'pie',
        radius: ['0%', '72%'],
        center: ['50%', '50%'],
        startAngle: 90,
        clockwise: false,
        data: pieData,
        avoidLabelOverlap: false,
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 1 },
        label: {
          show: true,
          position: 'inside',
          formatter: (params) => `{name|${params.name}}\n{percent|${SAAAMath.roundToEven(params.percent)}%}`,
          backgroundColor: 'rgba(255,255,255,0.72)',
          padding: [5, 8],
          borderRadius: 3,
          rich: {
            name: {
              fontSize: 38,
              color: '#1F1F1F',
              fontFamily: 'Microsoft JhengHei, sans-serif',
              lineHeight: 46
            },
            percent: {
              fontSize: 44,
              fontWeight: 'bold',
              color: '#000000',
              fontFamily: 'Microsoft JhengHei, sans-serif',
              lineHeight: 50
            }
          }
        },
        labelLine: { show: false }
      }
    ]
  };
}

/**
 * Render any ECharts option to Base64 PNG using an off-screen container in browser
 */
export function renderChartToBase64(option, width = 1600, height = 900) {
  if (typeof document === 'undefined') return null;
  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.position = 'fixed';
  div.style.left = '-9999px';
  div.style.top = '-9999px';
  document.body.appendChild(div);

  try {
    const chart = echarts.init(div, null, { width, height });
    chart.setOption(option, true);
    const base64 = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
    chart.dispose();
    return base64;
  } catch (err) {
    console.error('renderChartToBase64 error:', err);
    return null;
  } finally {
    if (div.parentNode) {
      document.body.removeChild(div);
    }
  }
}
