import * as echarts from 'echarts';

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
  const minY = Math.max(0, Math.floor(Math.min(...allY) - 2));
  const maxY = Math.ceil(Math.max(...allY) + 3);

  // Line segments that span experts 1~N and stop before '平均'
  const highLineData = Array(numExperts).fill(high).concat([null]);
  const avgLineData = Array(numExperts).fill(avg).concat([null]);
  const lowLineData = Array(numExperts).fill(low).concat([null]);

  const levelTag = `${levelName}+1`;
  const avgTag = levelName;
  const lowTag = `${levelName}-1`;
  const pointTag = `${levelName}最低`;

  // Dynamic y-axis split calculation so 35 items doesn't produce 35 dense grid lines
  const ySpan = maxY - minY;
  let splitNum = 6;
  if (ySpan > 25) splitNum = 7;
  else if (ySpan > 15) splitNum = 6;
  else splitNum = Math.max(3, Math.min(ySpan, 5));

  return {
    title: {
      text: `各委員預估達${levelName}最低題數`,
      left: 'center',
      top: 12,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
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
      bottom: 8,
      itemGap: 24,
      data: [
        { name: levelTag, icon: 'line', itemStyle: { color: '#ED7D31' } },
        { name: avgTag, icon: 'line', itemStyle: { color: '#A5A5A5' } },
        { name: lowTag, icon: 'line', itemStyle: { color: '#FFC000' } },
        { name: pointTag, icon: 'circle', itemStyle: { color: '#4472C4' } }
      ],
      textStyle: {
        fontSize: 12,
        fontFamily: 'Microsoft JhengHei, sans-serif',
        color: '#475569'
      }
    },
    grid: {
      top: 52,
      bottom: 65,
      left: 55,
      right: 45
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        interval: 0,
        rotate: numExperts > 10 ? 35 : 0,
        fontSize: numExperts > 10 ? 11 : 12,
        fontWeight: 'bold',
        color: '#475569',
        margin: 12,
        fontFamily: 'Microsoft JhengHei, sans-serif'
      },
      axisTick: { alignWithLabel: true, lineStyle: { color: '#CBD5E1' } },
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: minY,
      max: maxY,
      minInterval: 1,
      splitNumber: splitNum,
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        fontFamily: 'Microsoft JhengHei, sans-serif'
      },
      axisTick: { show: true, lineStyle: { color: '#CBD5E1' } },
      axisLine: { show: true, lineStyle: { color: '#CBD5E1' } },
      splitLine: {
        show: true,
        lineStyle: { color: '#F1F5F9', type: 'solid' }
      }
    },
    series: [
      // 1. +1 SD horizontal reference segment
      {
        name: levelTag,
        type: 'line',
        data: highLineData,
        symbol: 'none',
        lineStyle: { color: '#ED7D31', width: 2.2 },
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
        lineStyle: { color: '#A5A5A5', width: 2.2 },
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
        lineStyle: { color: '#FFC000', width: 2.2 },
        itemStyle: { color: '#FFC000' },
        connectNulls: false,
        z: 2
      },
      // 4. Expert points (Scatter plot with labels on top)
      {
        name: pointTag,
        type: 'scatter',
        data: pointsData,
        symbolSize: numExperts > 10 ? 11 : 13,
        itemStyle: { color: '#4472C4' },
        label: {
          show: true,
          position: 'top',
          distance: 5,
          formatter: '{c}',
          fontSize: numExperts > 10 ? 11 : 12,
          fontWeight: 'bold',
          color: '#1E293B',
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
    title: {
      text: '學生等級比例分布',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', fontFamily: 'Microsoft JhengHei, sans-serif' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c} 人 ({d}%)'
    },
    legend: {
      bottom: 8,
      data: ['待加強', '基礎', '精熟'],
      textStyle: { fontSize: 12, fontFamily: 'Microsoft JhengHei, sans-serif' }
    },
    series: [
      {
        name: '等級比例',
        type: 'pie',
        radius: ['0%', '72%'],
        center: ['50%', '50%'],
        data: pieData,
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#1E293B',
          fontFamily: 'Microsoft JhengHei, sans-serif'
        },
        labelLine: { show: true, length: 15, length2: 12 }
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
