import './style.css'
import * as echarts from 'echarts'

document.querySelector('#app').innerHTML = `
  <div class="dashboard">
    <!-- 顶部统一控制栏 -->
    <div class="dashboard-controls">
      <div class="time-range">
        <button class="active" data-range="today">今天</button>
        <button data-range="yesterday">昨天</button>
        <button data-range="7day">最近7天</button>
        <button data-range="30day">最近30天</button>
        <button data-range="60day">最近60天</button>
        <button data-range="90day">最近90天</button>
      </div>
      <div class="metric-tabs">
        <button data-metric="pv" class="active">浏览量(PV)</button>
        <button data-metric="uv">访客数(UV)</button>
        <button data-metric="ip">IP数</button>
      </div>
      <div class="comparison">
        <span>对比：</span>
        <label><input type="checkbox" checked id="compare-prev-day"> 前一日</label>
        <label><input type="checkbox" id="compare-prev-week"> 上周同期</label>
      </div>
      <div class="language-switch">
        <button data-lang="zh">中文</button>
        <button class="active" data-lang="en">English</button>
      </div>
    </div>

    <!-- 统计表格 -->
    <div class="stats-table-container">
      <h3 id="stats-title">今日流量</h3>
      <div class="stats-table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th></th>
              <th id="table-pv">浏览量(PV)</th>
              <th id="table-uv">访客数(UV)</th>
              <th id="table-ip">IP数</th>
              <th>跳出率</th>
              <th>平均访问时长</th>
              <th>转化次数</th>
            </tr>
          </thead>
          <tbody id="stats-table-body">
            <tr>
              <td>今日</td>
              <td>761,119</td>
              <td>425,916</td>
              <td>411,328</td>
              <td>81.27%</td>
              <td>00:02:15</td>
              <td>1,151</td>
            </tr>
            <tr>
              <td>昨日</td>
              <td>1,439,533</td>
              <td>705,201</td>
              <td>684,336</td>
              <td>80.78%</td>
              <td>00:02:41</td>
              <td>3,062</td>
            </tr>
            <tr>
              <td>预计今日</td>
              <td class="green">1,210,284 ↑</td>
              <td class="green">682,635 ↑</td>
              <td class="green">671,885 ↑</td>
              <td>-</td>
              <td>-</td>
              <td class="green">1,850 ↑</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 趋势图 -->
      <div class="chart-item">
        <div class="chart-header">
          <h3>趋势图</h3>
          <span class="chart-action">›</span>
        </div>
        <div id="trend-chart" class="chart"></div>
      </div>

      <!-- 地域分布 -->
      <div class="chart-item">
        <div class="chart-header">
          <h3>地域分布</h3>
          <span class="chart-action">›</span>
        </div>
        <div class="map-container">
          <div class="map-tabs">
            <button>按省</button>
            <button class="active">按国家</button>
          </div>
          <div class="map-content">
            <div class="map-left">
              <div id="map-chart" class="chart"></div>
            </div>
            <div class="map-right">
              <div class="map-right-header">
                <span>国家/省份</span>
                <span id="ranking-metric">浏览量(PV)</span>
                <span>占比</span>
              </div>
              <div id="map-ranking" class="map-ranking"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`

// 生成模拟数据的函数
function generateChartData(range, metric, comparePrevDay = true, comparePrevWeek = false) {
  let xAxisData = []
  let primaryData = []
  let secondaryData = []
  let tertiaryData = []
  let maxValue = 50000
  let seriesNames = []

  // 基础数据生成函数
  function generateBaseData(length, baseValue, variance) {
    return Array.from({ length }, () => Math.floor(Math.random() * variance) + baseValue)
  }

  // PV数据通常是UV的2-3倍
  function getMetricMultiplier(metric) {
    switch (metric) {
      case 'pv': return 2.5
      case 'ip': return 0.95
      default: return 1 // uv
    }
  }

  const multiplier = getMetricMultiplier(metric)

  // 获取当前语言设置下的指标名称
  const getMetricName = (metricType) => {
    if (metricType === 'pv') return t('浏览量(PV)')
    if (metricType === 'uv') return t('访客数(UV)')
    if (metricType === 'ip') return t('IP数')
    return metricType
  }

  switch (range) {
    case 'today':
      // 今天数据（24小时）
      xAxisData = Array.from({ length: 24 }, (_, i) => i)

      // 基础UV数据
      const uvToday = [48000, 35000, 28000, 12000, 11000, 15000, 18000, 25000, 28000, 26000, 25000, 28000, 30000, 35000, 37000, 36000, 15000, 5000, 3000, 2000, 1500, 1200, 1000, 900]
      const uvYesterday = [45000, 42000, 38000, 20000, 16000, 14000, 17000, 22000, 25000, 28000, 29000, 30000, 32000, 34000, 36000, 38000, 30000, 25000, 22000, 35000, 42000, 45000, 48000, 49000]
      const uvLastWeek = [40000, 38000, 35000, 18000, 14000, 12000, 15000, 20000, 23000, 26000, 27000, 28000, 30000, 32000, 34000, 36000, 28000, 23000, 20000, 32000, 39000, 42000, 45000, 46000]

      // 转换为对应指标数据
      primaryData = uvToday.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvYesterday.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvLastWeek.map(val => Math.floor(val * multiplier)) : []

      maxValue = 50000 * multiplier
      seriesNames = [
        `2025/12/27 ${getMetricName(metric)}`,
        `2025/12/26 ${getMetricName(metric)}`,
        `2025/12/20 ${getMetricName(metric)} ${t('（上周同期）')}`
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break

    case 'yesterday':
      // 昨天数据（24小时）
      xAxisData = Array.from({ length: 24 }, (_, i) => i)

      const uvYesterdayData = [45000, 42000, 38000, 20000, 16000, 14000, 17000, 22000, 25000, 28000, 29000, 30000, 32000, 34000, 36000, 38000, 30000, 25000, 22000, 35000, 42000, 45000, 48000, 49000]
      const uvDayBeforeYesterday = [42000, 39000, 35000, 18000, 15000, 13000, 16000, 21000, 24000, 27000, 28000, 29000, 31000, 33000, 35000, 37000, 29000, 24000, 21000, 34000, 41000, 44000, 47000, 48000]
      const uvLastWeekYesterday = [38000, 36000, 33000, 16000, 13000, 11000, 14000, 19000, 22000, 25000, 26000, 27000, 29000, 31000, 33000, 35000, 27000, 22000, 19000, 31000, 38000, 41000, 44000, 45000]

      primaryData = uvYesterdayData.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvDayBeforeYesterday.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvLastWeekYesterday.map(val => Math.floor(val * multiplier)) : []

      maxValue = 50000 * multiplier
      seriesNames = [
        `2025/12/26 ${getMetricName(metric)}`,
        `2025/12/25 ${getMetricName(metric)}`,
        `2025/12/19 ${getMetricName(metric)} ${t('（上周同期）')}`
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break

    case '7day':
      // 最近7天数据
      xAxisData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - 6 + i)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const uv7Day = [120000, 135000, 142000, 138000, 145000, 152000, 148000]
      const uvPrev7Day = [110000, 125000, 132000, 128000, 135000, 142000, 138000]
      const uvPrevWeekSame = [105000, 120000, 128000, 124000, 130000, 138000, 134000]

      primaryData = uv7Day.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvPrev7Day.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvPrevWeekSame.map(val => Math.floor(val * multiplier)) : []

      maxValue = 160000 * multiplier
      seriesNames = [
        `${t('最近7天')} ${getMetricName(metric)}`,
        `${t('上7天')} ${getMetricName(metric)}`,
        `${t('上周同期')} ${getMetricName(metric)}`,
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break

    case '30day':
      // 最近30天数据
      xAxisData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - 29 + i)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const baseUv30 = 100000
      const uv30Day = generateBaseData(30, baseUv30, 50000)
      const uvPrev30Day = generateBaseData(30, baseUv30 - 5000, 45000)
      const uvPrevWeek30 = generateBaseData(30, baseUv30 - 8000, 40000)

      primaryData = uv30Day.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvPrev30Day.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvPrevWeek30.map(val => Math.floor(val * multiplier)) : []

      maxValue = 160000 * multiplier
      seriesNames = [
        `${t('最近30天')} ${getMetricName(metric)}`,
        `${t('上30天')} ${getMetricName(metric)}`,
        `${t('上周同期')} ${getMetricName(metric)}`,
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break

    case '60day':
      // 最近60天数据
      xAxisData = Array.from({ length: 60 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - 59 + i)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const baseUv60 = 120000
      const uv60Day = generateBaseData(60, baseUv60, 60000)
      const uvPrev60Day = generateBaseData(60, baseUv60 - 5000, 55000)
      const uvPrevWeek60 = generateBaseData(60, baseUv60 - 8000, 50000)

      primaryData = uv60Day.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvPrev60Day.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvPrevWeek60.map(val => Math.floor(val * multiplier)) : []

      maxValue = 190000 * multiplier
      seriesNames = [
        `${t('最近60天')} ${getMetricName(metric)}`,
        `${t('上60天')} ${getMetricName(metric)}`,
        `${t('上周同期')} ${getMetricName(metric)}`,
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break

    case '90day':
      // 最近90天数据
      xAxisData = Array.from({ length: 90 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - 89 + i)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const baseUv90 = 140000
      const uv90Day = generateBaseData(90, baseUv90, 70000)
      const uvPrev90Day = generateBaseData(90, baseUv90 - 5000, 65000)
      const uvPrevWeek90 = generateBaseData(90, baseUv90 - 8000, 60000)

      primaryData = uv90Day.map(val => Math.floor(val * multiplier))
      secondaryData = comparePrevDay ? uvPrev90Day.map(val => Math.floor(val * multiplier)) : []
      tertiaryData = comparePrevWeek ? uvPrevWeek90.map(val => Math.floor(val * multiplier)) : []

      maxValue = 220000 * multiplier
      seriesNames = [
        `${t('最近90天')} ${getMetricName(metric)}`,
        `${t('上90天')} ${getMetricName(metric)}`,
        `${t('上周同期')} ${getMetricName(metric)}`,
      ].filter((_, i) => i === 0 || (i === 1 && comparePrevDay) || (i === 2 && comparePrevWeek))
      break
  }

  return {
    xAxisData,
    primaryData,
    secondaryData,
    tertiaryData,
    maxValue,
    seriesNames
  }
}



// 翻译映射
const translations = {
  // 控制面板
  '今天': 'Today',
  'Yesterday': '昨天',
  '昨天': 'Yesterday',
  'Last 7 days': '最近7天',
  '最近7天': 'Last 7 days',
  'Last 30 days': '最近30天',
  '最近30天': 'Last 30 days',
  'Last 60 days': '最近60天',
  '最近60天': 'Last 60 days',
  'Last 90 days': '最近90天',
  '最近90天': 'Last 90 days',
  'Previous 7 days': '上7天',
  '上7天': 'Previous 7 days',
  'Previous 30 days': '上30天',
  '上30天': 'Previous 30 days',
  'Previous 60 days': '上60天',
  '上60天': 'Previous 60 days',
  'Previous 90 days': '上90天',
  '上90天': 'Previous 90 days',
  'Page Views(PV)': '浏览量(PV)',
  '浏览量(PV)': 'Page Views(PV)',
  'Unique Visitors(UV)': '访客数(UV)',
  '访客数(UV)': 'Unique Visitors(UV)',
  'IP Count': 'IP数',
  'IP数': 'IP Count',
  'Compare:': '对比：',
  '对比：': 'Compare:',
  'Previous Day': '前一日',
  '前一日': 'Previous Day',
  'Same Period Last Week': '上周同期',
  '上周同期': 'Same Period Last Week',
  '(Same Period Last Week)': '（上周同期）',
  '（上周同期）': '(Same Period Last Week)',
  '中文': '中文',
  'English': 'English',
  'Chinese': '中文',

  // 统计表格
  'Today\'s Traffic': '今日流量',
  '今日流量': 'Today\'s Traffic',
  'Yesterday\'s Traffic': '昨日流量',
  '昨日流量': 'Yesterday\'s Traffic',
  'Last 7 Days Traffic': '最近7天流量',
  '最近7天流量': 'Last 7 Days Traffic',
  'Last 30 Days Traffic': '最近30天流量',
  '最近30天流量': 'Last 30 Days Traffic',
  'Last 60 Days Traffic': '最近60天流量',
  '最近60天流量': 'Last 60 Days Traffic',
  'Last 90 Days Traffic': '最近90天流量',
  '最近90天流量': 'Last 90 Days Traffic',
  'Bounce Rate': '跳出率',
  '跳出率': 'Bounce Rate',
  'Avg. Visit Duration': '平均访问时长',
  '平均访问时长': 'Avg. Visit Duration',
  'Conversions': '转化次数',
  '转化次数': 'Conversions',
  'Today': '今日',
  '今日': 'Today',
  'Yesterday': '昨日',
  '昨日': 'Yesterday',
  'Estimated Today': '预计今日',
  '预计今日': 'Estimated Today',

  // 图表标题
  'Trend Chart': '趋势图',
  '趋势图': 'Trend Chart',
  'Geographic Distribution': '地域分布',
  '地域分布': 'Geographic Distribution',

  // 图表单位
  'h': '时',
  '时': 'h',
  'High': '高',
  '高': 'High',
  'Low': '低',
  '低': 'Low',

  // 地图相关
  'By Province': '按省',
  '按省': 'By Province',
  'By Country': '按国家',
  '按国家': 'By Country',
  'Country/Province': '国家/省份',
  '国家/省份': 'Country/Province',
  'Percentage': '占比',
  '占比': 'Percentage',
  '地图数据加载失败': 'Map data loading failed',
  '请稍后重试': 'Please try again later',

  // 国家名称
  'China': '中国',
  '中国': 'China',
  'United States': '美国',
  '美国': 'United States',
  'Japan': '日本',
  '日本': 'Japan',
  'South Korea': '韩国',
  '韩国': 'South Korea',
  'India': '印度',
  '印度': 'India',
  'Germany': '德国',
  '德国': 'Germany',
  'United Kingdom': '英国',
  '英国': 'United Kingdom',
  'France': '法国',
  '法国': 'France',
  'Russia': '俄罗斯',
  '俄罗斯': 'Russia',
  'Canada': '加拿大',
  '加拿大': 'Canada',
  'Italy': '意大利',
  '意大利': 'Italy',
  'Brazil': '巴西',
  '巴西': 'Brazil',
  'Australia': '澳大利亚',
  '澳大利亚': 'Australia',
  'Spain': '西班牙',
  '西班牙': 'Spain',
  'Mexico': '墨西哥',
  '墨西哥': 'Mexico',
  'Indonesia': '印度尼西亚',
  '印度尼西亚': 'Indonesia',
  'Turkey': '土耳其',
  '土耳其': 'Turkey',
  'Netherlands': '荷兰',
  '荷兰': 'Netherlands',
  'Switzerland': '瑞士',
  '瑞士': 'Switzerland',
  'Sweden': '瑞典',
  '瑞典': 'Sweden'
};

// 全局状态管理
let globalState = {
  range: 'today',
  metric: 'pv',
  comparePrevDay: true,
  comparePrevWeek: false,
  language: 'en' // 'zh' 中文, 'en' 英文
};

// 翻译函数
function t(text) {
  if (globalState.language === 'en') {
    return translations[text] || text;
  }
  return text;
}

// 更新所有文本内容
function updateAllText() {
  // 确保使用当前语言设置
  const currentLang = globalState.language;

  // 1. 更新时间范围按钮
  const timeRangeMap = {
    'today': '今天',
    'yesterday': '昨天',
    '7day': '最近7天',
    '30day': '最近30天',
    '60day': '最近60天',
    '90day': '最近90天'
  };
  document.querySelectorAll('.time-range button').forEach(button => {
    const range = button.dataset.range;
    const originalText = timeRangeMap[range];
    if (originalText) {
      button.textContent = t(originalText);
    }
  });

  // 2. 更新指标标签按钮
  const metricTexts = {
    pv: t('浏览量(PV)'),
    uv: t('访客数(UV)'),
    ip: t('IP数')
  };
  document.querySelectorAll('.metric-tabs button').forEach(button => {
    const metric = button.dataset.metric;
    button.textContent = metricTexts[metric] || button.textContent;
  });

  // 3. 更新对比选项
  document.querySelector('.comparison span').textContent = t('对比：');
  const prevDayLabel = document.querySelector('#compare-prev-day').nextSibling;
  if (prevDayLabel) prevDayLabel.textContent = ' ' + t('前一日');
  const prevWeekLabel = document.querySelector('#compare-prev-week').nextSibling;
  if (prevWeekLabel) prevWeekLabel.textContent = ' ' + t('上周同期');

  // 4. 更新统计表格
  updateStatsTable();

  // 5. 更新表格表头
  const tableHeaders = document.querySelectorAll('.stats-table th');
  if (tableHeaders[1]) tableHeaders[1].textContent = t('浏览量(PV)');
  if (tableHeaders[2]) tableHeaders[2].textContent = t('访客数(UV)');
  if (tableHeaders[3]) tableHeaders[3].textContent = t('IP数');
  if (tableHeaders[4]) tableHeaders[4].textContent = t('跳出率');
  if (tableHeaders[5]) tableHeaders[5].textContent = t('平均访问时长');
  if (tableHeaders[6]) tableHeaders[6].textContent = t('转化次数');

  // 6. 更新图表标题
  const chartTitles = document.querySelectorAll('.chart-header h3');
  if (chartTitles[0]) chartTitles[0].textContent = t('趋势图');
  if (chartTitles[1]) chartTitles[1].textContent = t('地域分布');

  // 7. 更新地图标签页文本
  const mapTabs = document.querySelectorAll('.map-tabs button');
  if (mapTabs[0]) mapTabs[0].textContent = t('按省');
  if (mapTabs[1]) mapTabs[1].textContent = t('按国家');

  // 确保地图标签有一个被激活（默认激活"按国家"，即世界地图）
  if (!document.querySelector('.map-tabs button.active')) {
    mapTabs[1].classList.add('active');
  }

  // 8. 更新地图右侧列标题
  const mapHeaders = document.querySelectorAll('.map-right-header span');
  if (mapHeaders[0]) mapHeaders[0].textContent = t('国家/省份');
  if (mapHeaders[1]) {
    // 中间标题是指标名称，需要根据当前指标重新生成
    const metricText = globalState.metric === 'pv' ? '浏览量(PV)' :
      globalState.metric === 'uv' ? '访客数(UV)' : 'IP数';
    mapHeaders[1].textContent = t(metricText);
  }
  if (mapHeaders[2]) mapHeaders[2].textContent = t('占比');

  // 9. 更新排名指标
  const rankingMetric = document.getElementById('ranking-metric');
  if (rankingMetric) {
    const metricText = globalState.metric === 'pv' ? '浏览量(PV)' :
      globalState.metric === 'uv' ? '访客数(UV)' : 'IP数';
    rankingMetric.textContent = t(metricText);
  }

  // 10. 更新地图
  updateMapChart();

  // 11. 重新初始化趋势图，确保系列名称使用当前语言
  const existingTrendChart = echarts.getInstanceByDom(document.getElementById('trend-chart'));
  if (existingTrendChart) {
    existingTrendChart.dispose();
  }
  initTrendChart();
}

// 更新统计表格数据
function updateStatsTable() {
  const titleElement = document.getElementById('stats-title')
  const tableBody = document.getElementById('stats-table-body')
  const tablePv = document.getElementById('table-pv')
  const tableUv = document.getElementById('table-uv')
  const tableIp = document.getElementById('table-ip')

  // 根据当前状态生成标题
  let title = ''
  switch (globalState.range) {
    case 'today': title = t('今日流量'); break
    case 'yesterday': title = t('昨日流量'); break
    case '7day': title = t('最近7天流量'); break
    case '30day': title = t('最近30天流量'); break
    case '60day': title = t('最近60天流量'); break
    case '90day': title = t('最近90天流量'); break
  }
  titleElement.textContent = title

  // 生成模拟数据
  const currentData = generateChartData(globalState.range, globalState.metric, globalState.comparePrevDay, globalState.comparePrevWeek)

  // 计算总计数据
  const currentTotal = currentData.primaryData.reduce((sum, val) => sum + val, 0)
  const prevTotal = currentData.secondaryData.length > 0 ? currentData.secondaryData.reduce((sum, val) => sum + val, 0) : 0

  // 生成表格行
  const todayRow = tableBody.children[0]
  const yesterdayRow = tableBody.children[1]
  const predictRow = tableBody.children[2]

  // 更新表头显示
  tablePv.textContent = t('浏览量(PV)')
  tableUv.textContent = t('访客数(UV)')
  tableIp.textContent = t('IP数')

  // 更新表格行文本
  if (todayRow) {
    todayRow.children[0].textContent = t('今日')
    todayRow.children[4].textContent = '81.27%'
    todayRow.children[5].textContent = '00:02:15'
    todayRow.children[6].textContent = '1,151'
    todayRow.children[1].textContent = currentTotal.toLocaleString()
  }

  if (yesterdayRow) {
    yesterdayRow.children[0].textContent = t('昨日')
    yesterdayRow.children[4].textContent = '80.78%'
    yesterdayRow.children[5].textContent = '00:02:41'
    yesterdayRow.children[6].textContent = '3,062'
    if (prevTotal > 0) {
      yesterdayRow.children[1].textContent = prevTotal.toLocaleString()
    }
  }

  if (predictRow) {
    predictRow.children[0].textContent = t('预计今日')
    predictRow.children[4].textContent = '-'
    predictRow.children[5].textContent = '-'
    predictRow.children[6].textContent = '1,850 ↑'
    predictRow.children[1].textContent = currentTotal > prevTotal ? `${Math.floor(currentTotal * 1.6).toLocaleString()} ↑` : `${Math.floor(currentTotal * 1.6).toLocaleString()} ↓`
  }
}

// 更新地图数据
function updateMapChart() {
  // 重新初始化地图图表以更新数据
  initMapChart()
}

// 统一更新所有组件
function updateAllComponents() {
  // 更新所有文本内容
  updateAllText()

  // 更新统计表格
  updateStatsTable()

  // 更新地图图表
  updateMapChart()

  // 完全重新初始化趋势图，确保系列名称使用当前语言
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.dispose()
  initTrendChart()
}

// 初始化趋势图
function initTrendChart() {
  // 确保每次初始化都重新生成数据，使用当前语言
  const chartData = generateChartData(globalState.range, globalState.metric, globalState.comparePrevDay, globalState.comparePrevWeek)

  // 创建新图表实例
  const trendChart = echarts.init(document.getElementById('trend-chart'))

  // 创建图表配置
  function createChartOption(data) {
    const series = [
      {
        name: data.seriesNames[0],
        type: 'line',
        data: data.primaryData,
        lineStyle: {
          color: '#0066cc',
          width: 3,
          shadowColor: 'rgba(0, 102, 204, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        itemStyle: {
          color: '#0066cc',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(0, 102, 204, 0.5)',
          shadowBlur: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(0, 102, 204, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(0, 102, 204, 0.05)'
            }
          ])
        },
        symbol: (globalState.range === '30day' || globalState.range === '60day' || globalState.range === '90day') ? 'none' : 'circle',
        symbolSize: 6,
        emphasis: {
          symbolSize: 8,
          focus: 'series'
        },
        smooth: true,
        animationDuration: 1500,
        animationEasing: 'cubicOut'
      }
    ]

    // 添加前一日对比数据
    if (data.secondaryData.length > 0) {
      series.push({
        name: data.seriesNames[1],
        type: 'line',
        data: data.secondaryData,
        lineStyle: {
          color: '#99ccff',
          width: 3,
          shadowColor: 'rgba(153, 204, 255, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        itemStyle: {
          color: '#99ccff',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(153, 204, 255, 0.5)',
          shadowBlur: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(153, 204, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(153, 204, 255, 0.05)'
            }
          ])
        },
        symbol: (globalState.range === '30day' || globalState.range === '60day' || globalState.range === '90day') ? 'none' : 'circle',
        symbolSize: 6,
        emphasis: {
          symbolSize: 8,
          focus: 'series'
        },
        smooth: true,
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        animationDelay: 300
      })
    }

    // 添加上周同期对比数据
    if (data.tertiaryData.length > 0) {
      series.push({
        name: data.seriesNames[2],
        type: 'line',
        data: data.tertiaryData,
        lineStyle: {
          color: '#ff9900',
          width: 3,
          shadowColor: 'rgba(255, 153, 0, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        itemStyle: {
          color: '#ff9900',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(255, 153, 0, 0.5)',
          shadowBlur: 8
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(255, 153, 0, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(255, 153, 0, 0.05)'
            }
          ])
        },
        symbol: (globalState.range === '30day' || globalState.range === '60day' || globalState.range === '90day') ? 'none' : 'circle',
        symbolSize: 6,
        emphasis: {
          symbolSize: 8,
          focus: 'series'
        },
        smooth: true,
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        animationDelay: 600
      })
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function (params) {
          let result = params[0].name
          if (globalState.range === 'today' || globalState.range === 'yesterday') {
            result += t('时')
          }
          result += '<br/>'
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()}<br/>`
          })
          return result
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      legend: {
        data: data.seriesNames,
        bottom: 0,
        left: 'center',
        textStyle: {
          color: '#666',
          fontSize: 12
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.xAxisData,
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          rotate: (globalState.range === '30day' || globalState.range === '60day' || globalState.range === '90day') ? 45 : 0
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f5f5f5',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        max: data.maxValue,
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          formatter: '{value}'
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f5f5f5',
            type: 'dashed'
          }
        }
      },
      series: series
    }
  }

  // 初始渲染图表
  trendChart.setOption(createChartOption(chartData))

  // 更新图表数据 - 这个函数可能不再需要，因为我们现在在updateAllComponents中完全重新初始化图表
  // 但保留以便其他地方可能调用
  function updateChart() {
    // 重新生成数据，确保系列名称使用当前语言
    const newChartData = generateChartData(globalState.range, globalState.metric, globalState.comparePrevDay, globalState.comparePrevWeek)
    // 更新图表选项
    trendChart.setOption(createChartOption(newChartData))
  }

  // 移除旧的事件监听器（如果存在），避免重复添加
  window.removeEventListener('updateTrendChart', updateChart)
  // 监听全局更新事件
  window.addEventListener('updateTrendChart', updateChart)
}

// 初始化地域分布图表
function initMapChart() {
  const mapChart = echarts.init(document.getElementById('map-chart'))
  const rankingContainer = document.getElementById('map-ranking')
  const rankingMetric = document.getElementById('ranking-metric')

  // 根据当前指标更新排名标题
  const metricText = globalState.metric === 'pv' ? t('浏览量(PV)') :
    globalState.metric === 'uv' ? t('访客数(UV)') : t('IP数')
  rankingMetric.textContent = metricText

  // 模拟中国各省份数据
  const chinaProvinceData = [
    { name: '北京', value: 188800, cnName: '北京' },
    { name: '上海', value: 168800, cnName: '上海' },
    { name: '广东', value: 148800, cnName: '广东' },
    { name: '浙江', value: 138800, cnName: '浙江' },
    { name: '江苏', value: 128800, cnName: '江苏' },
    { name: '山东', value: 118800, cnName: '山东' },
    { name: '四川', value: 108800, cnName: '四川' },
    { name: '河南', value: 98800, cnName: '河南' },
    { name: '湖北', value: 88800, cnName: '湖北' },
    { name: '湖南', value: 78800, cnName: '湖南' },
    { name: '福建', value: 68800, cnName: '福建' },
    { name: '安徽', value: 58800, cnName: '安徽' },
    { name: '河北', value: 48800, cnName: '河北' },
    { name: '陕西', value: 38800, cnName: '陕西' },
    { name: '辽宁', value: 28800, cnName: '辽宁' },
    { name: '重庆', value: 18800, cnName: '重庆' },
    { name: '江西', value: 15800, cnName: '江西' },
    { name: '黑龙江', value: 12800, cnName: '黑龙江' },
    { name: '吉林', value: 10800, cnName: '吉林' },
    { name: '山西', value: 8800, cnName: '山西' }
  ]

  // 模拟全球主要国家数据，使用完整国家名称和经纬度坐标
  // 主要用户是英语国家和发达国家，按重要性排序
  const countryData = [
    { name: 'United States', value: 988830, cnName: '美国', lon: -95.713, lat: 37.090 }, // 美国 - 主要英语国家
    { name: 'United Kingdom', value: 859680, cnName: '英国', lon: -3.436, lat: 55.378 }, // 英国 - 主要英语国家
    { name: 'Canada', value: 781200, cnName: '加拿大', lon: -106.346, lat: 56.130 }, // 加拿大 - 主要英语国家
    { name: 'Australia', value: 746230, cnName: '澳大利亚', lon: 133.775, lat: -25.274 }, // 澳大利亚 - 主要英语国家
    { name: 'New Zealand', value: 651680, cnName: '新西兰', lon: 174.886, lat: -40.900 }, // 新西兰 - 主要英语国家
    { name: 'South Africa', value: 597400, cnName: '南非', lon: 25.000, lat: -29.000 }, // 南非 - 主要英语国家
    { name: 'Japan', value: 561680, cnName: '日本', lon: 138.252, lat: 36.204 }, // 日本 - 发达国家
    { name: 'China', value: 498830, cnName: '中国', lon: 104.195, lat: 35.862 }, // 中国
    { name: 'India', value: 481700, cnName: '印度', lon: 78.962, lat: 20.593 }, // 印度
    { name: 'Germany', value: 530550, cnName: '德国', lon: 10.451, lat: 51.165 }, // 德国 - 发达国家
    { name: 'France', value: 514200, cnName: '法国', lon: 2.213, lat: 46.227 }, // 法国 - 发达国家
    { name: 'Italy', value: 459560, cnName: '意大利', lon: 12.567, lat: 41.871 }, // 意大利 - 发达国家
    { name: 'South Korea', value: 447400, cnName: '韩国', lon: 127.767, lat: 35.907 }, // 韩国 - 发达国家
    { name: 'Spain', value: 424560, cnName: '西班牙', lon: -3.749, lat: 40.463 }, // 西班牙 - 发达国家
    { name: 'Netherlands', value: 407890, cnName: '荷兰', lon: 5.291, lat: 52.132 }, // 荷兰 - 发达国家
    { name: 'Switzerland', value: 396230, cnName: '瑞士', lon: 8.227, lat: 46.818 }, // 瑞士 - 发达国家
    { name: 'Sweden', value: 384560, cnName: '瑞典', lon: 18.068, lat: 60.128 }, // 瑞典 - 发达国家
    { name: 'Norway', value: 378900, cnName: '挪威', lon: 8.468, lat: 60.472 }, // 挪威 - 发达国家
    { name: 'Denmark', value: 367600, cnName: '丹麦', lon: 9.501, lat: 56.263 }, // 丹麦 - 发达国家
    { name: 'Russia', value: 355450, cnName: '俄罗斯', lon: 37.617, lat: 55.755 }, // 俄罗斯
    { name: 'Brazil', value: 347890, cnName: '巴西', lon: -51.925, lat: -14.235 }, // 巴西
    { name: 'Mexico', value: 332890, cnName: '墨西哥', lon: -99.133, lat: 19.432 }, // 墨西哥
    { name: 'Indonesia', value: 321230, cnName: '印度尼西亚', lon: 113.921, lat: -0.789 }, // 印度尼西亚
    { name: 'Turkey', value: 309560, cnName: '土耳其', lon: 35.243, lat: 38.963 }, // 土耳其
    { name: 'Iceland', value: 295600, cnName: '冰岛', lon: -21.895, lat: 64.984 }, // 冰岛 - 发达国家
    { name: 'North Korea', value: 283400, cnName: '朝鲜', lon: 125.738, lat: 40.339 } // 朝鲜
  ]

  // 根据当前指标调整数据
  const metricMultiplier = globalState.metric === 'pv' ? 1 :
    globalState.metric === 'uv' ? 0.45 : 0.42

  // 根据激活的地图标签选择显示的地图类型
  const activeMapTab = document.querySelector('.map-tabs button.active');
  const currentMapType = activeMapTab ? activeMapTab.textContent === t('按省') ? 'china' : 'world' : 'world'; // 默认显示世界地图

  // 创建中英文国家/省份名称映射
  const countryNameMap = {
    // 中国省份中英文映射
    '北京': 'Beijing',
    '上海': 'Shanghai',
    '广东': 'Guangdong',
    '浙江': 'Zhejiang',
    '江苏': 'Jiangsu',
    '山东': 'Shandong',
    '四川': 'Sichuan',
    '河南': 'Henan',
    '湖北': 'Hubei',
    '湖南': 'Hunan',
    '福建': 'Fujian',
    '安徽': 'Anhui',
    '河北': 'Hebei',
    '陕西': 'Shaanxi',
    '辽宁': 'Liaoning',
    '重庆': 'Chongqing',
    '江西': 'Jiangxi',
    '黑龙江': 'Heilongjiang',
    '吉林': 'Jilin',
    '山西': 'Shanxi',
    '天津': 'Tianjin',
    '云南': 'Yunnan',
    '广西': 'Guangxi',
    '内蒙古': 'Inner Mongolia',
    '贵州': 'Guizhou',
    '甘肃': 'Gansu',
    '海南': 'Hainan',
    '宁夏': 'Ningxia',
    '青海': 'Qinghai',
    '新疆': 'Xinjiang',
    '西藏': 'Tibet',
    '香港': 'Hong Kong',
    '澳门': 'Macau',
    '台湾': 'Taiwan',
    '南海诸岛': 'South China Sea Islands',
    // 从截图中发现的缺失国家名称映射
    'Central African Rep.': '中非共和国',
    'S. Sudan': '南苏丹',
    'Eq. Guinea': '赤道几内亚',
    'São Tomé and Principe': '圣多美和普林西比',
    'Sao Tome and Principe': '圣多美和普林西比',
    'Congo': '刚果共和国',
    'Dem. Rep. Congo': '刚果民主共和国',
    'Seychelles': '塞舌尔',
    'Czech Rep.': '捷克共和国',
    'Slovakia': '斯洛伐克',
    'Hungary': '匈牙利',
    'Romania': '罗马尼亚',
    'Bosnia and Herz.': '波斯尼亚和黑塞哥维那',
    'Serbia': '塞尔维亚',
    'Macedonia': '北马其顿',
    'Faroe Is.': '法罗群岛',
    'Faeroe Is.': '法罗群岛',
    'Aland': '奥兰群岛',
    'Isle of Man': '马恩岛',
    'Turks and Caicos Is.': '特克斯和凯科斯群岛',
    'Saint Lucia': '圣卢西亚',
    'Guam': '关岛',
    'Fr. Polynesia': '法属波利尼西亚',
    'Comoros': '科摩罗',
    'Madagascar': '马达加斯加',
    'Mauritius': '毛里求斯',
    'Fr. S. Antarctic Lands': '法属南部和南极领地',
    'N. Mariana Is.': '北马里亚纳群岛',
    'Timor-Leste': '东帝汶',
    'Cayman Is.': '开曼群岛',
    'Dominican Rep.': '多米尼加共和国',
    'Antigua and Barb.': '安提瓜和巴布达',
    'Montserrat': '蒙特塞拉特',
    'St. Lucia': '圣卢西亚',
    'St. Vin. and Gren.': '圣文森特和格林纳丁斯',
    'Curaçao': '库拉索',
    '英属': '英属',
    'British': '英属',

    // 北极地区
    'Greenland': '格陵兰',
    'Svalbard and Jan Mayen': '斯瓦尔巴群岛和扬马延岛',

    // 北美洲
    'St. Pierre and Miquelon': '圣皮埃尔和密克隆',
    'Bermuda': '百慕大',
    'Bahamas': '巴哈马',
    'Barbados': '巴巴多斯',
    'Cuba': '古巴',
    'Haiti': '海地',
    'Dominican Republic': '多米尼加共和国',
    'Jamaica': '牙买加',
    'Puerto Rico': '波多黎各',
    'Virgin Is.': '维尔京群岛',
    'U.S. Virgin Islands': '美属维尔京群岛',
    'British Virgin Islands': '英属维尔京群岛',
    'Guadeloupe': '瓜德罗普',
    'Martinique': '马提尼克',
    'St. Lucia': '圣卢西亚',
    'St. Vincent and the Grenadines': '圣文森特和格林纳丁斯',
    'Grenada': '格林纳达',
    'Trinidad and Tobago': '特立尼达和多巴哥',
    'Cayman Islands': '开曼群岛',
    'Turks and Caicos Islands': '特克斯和凯科斯群岛',
    'Dominica': '多米尼克',
    'Antigua and Barbuda': '安提瓜和巴布达',
    'St. Kitts and Nevis': '圣基茨和尼维斯',

    // 南美洲
    'Venezuela': '委内瑞拉',
    'Colombia': '哥伦比亚',
    'Ecuador': '厄瓜多尔',
    'Peru': '秘鲁',
    'Bolivia': '玻利维亚',
    'Chile': '智利',
    'Paraguay': '巴拉圭',
    'Uruguay': '乌拉圭',
    'Argentina': '阿根廷',
    'Guyana': '圭亚那',
    'Suriname': '苏里南',
    'French Guiana': '法属圭亚那',
    'Falkland Is.': '福克兰群岛',
    'S. Geo. and S. Sandw. Is.': '南乔治亚和南桑威奇群岛',

    // 大洋洲
    'Kiribati': '基里巴斯',
    'American Samoa': '美属萨摩亚',
    'Samoa': '萨摩亚',
    'Tonga': '汤加',
    'French Polynesia': '法属波利尼西亚',
    'New Caledonia': '新喀里多尼亚',
    'Vanuatu': '瓦努阿图',
    'Solomon Is.': '所罗门群岛',
    'Papua New Guinea': '巴布亚新几内亚',
    'Fiji': '斐济',
    'Palau': '帕劳',
    'Micronesia': '密克罗尼西亚联邦',
    'Marshall Is.': '马绍尔群岛',
    'Nauru': '瑙鲁',
    'Tuvalu': '图瓦卢',
    'Wallis and Futuna': '瓦利斯和富图纳',
    'Niue': '纽埃',
    'Cook Is.': '库克群岛',
    'Tokelau': '托克劳',
    'French Southern and Antarctic Lands': '法属南部和南极领地',
    'Heard I. and McDonald Is.': '赫德岛和麦克唐纳群岛',
    'Norfolk Island': '诺福克岛',
    'Christmas Island': '圣诞岛',
    'Cocos (Keeling) Islands': '科科斯（基林）群岛',
    'Pitcairn Islands': '皮特凯恩群岛',

    // 欧洲
    'Faroe Is.': '法罗群岛',
    'Iceland': '冰岛',

    // 非洲
    'W. Sahara': '西撒哈拉',
    'Western Sahara': '西撒哈拉',
    'Siachen Glacier': '锡亚琴冰川',
    'Lao PDR': '老挝',
    'Dem. Rep. Congo': '刚果民主共和国',
    'São Tomé and Príncipe': '圣多美和普林西比',
    'Br. Indian Ocean Ter.': '英属印度洋领地',
    'Saint Helena': '圣赫勒拿',
    'Côte d\'Ivoire': '科特迪瓦',
    'Mauritania': '毛里塔尼亚',
    'Mali': '马里',
    'Niger': '尼日尔',
    'Chad': '乍得',
    'Sudan': '苏丹',
    'Eritrea': '厄立特里亚',
    'Djibouti': '吉布提',
    'Somalia': '索马里',
    'South Sudan': '南苏丹',
    'Ethiopia': '埃塞俄比亚',
    'Kenya': '肯尼亚',
    'Uganda': '乌干达',
    'Rwanda': '卢旺达',
    'Burundi': '布隆迪',
    'Tanzania': '坦桑尼亚',
    'Zambia': '赞比亚',
    'Malawi': '马拉维',
    'Mozambique': '莫桑比克',
    'Zimbabwe': '津巴布韦',
    'Botswana': '博茨瓦纳',
    'Namibia': '纳米比亚',
    'South Africa': '南非',
    'Lesotho': '莱索托',
    'Eswatini': '斯威士兰',
    'Angola': '安哥拉',
    'Central African Republic': '中非共和国',
    'Cameroon': '喀麦隆',
    'Equatorial Guinea': '赤道几内亚',
    'Gabon': '加蓬',
    'Sao Tome and Principe': '圣多美和普林西比',
    'Guinea': '几内亚',
    'Guinea-Bissau': '几内亚比绍',
    'Sierra Leone': '塞拉利昂',
    'Liberia': '利比里亚',
    'Ghana': '加纳',
    'Togo': '多哥',
    'Benin': '贝宁',
    'Nigeria': '尼日利亚',
    'Libya': '利比亚',
    'Egypt': '埃及',
    'Tunisia': '突尼斯',
    'Algeria': '阿尔及利亚',
    'Morocco': '摩洛哥',
    'Cape Verde': '佛得角',
    'Senegal': '塞内加尔',
    'Gambia': '冈比亚',
    'Burkina Faso': '布基纳法索',

    // 亚洲
    'China': '中国',
    'People\'s Republic of China': '中国',
    'Japan': '日本',
    'South Korea': '韩国',
    'Korea, South': '韩国',
    'Republic of Korea': '韩国',
    'Korea': '韩国',
    'North Korea': '朝鲜',
    'Korea, North': '朝鲜',
    'Democratic People\'s Republic of Korea': '朝鲜',
    'D.P.R. Korea': '朝鲜',
    'Dem. Rep. Korea': '朝鲜',
    'Mongolia': '蒙古',
    'India': '印度',
    'Pakistan': '巴基斯坦',
    'Bangladesh': '孟加拉国',
    'Vietnam': '越南',
    'Malaysia': '马来西亚',
    'Thailand': '泰国',
    'Philippines': '菲律宾',
    'Indonesia': '印度尼西亚',
    'Singapore': '新加坡',
    'Myanmar': '缅甸',
    'Burma': '缅甸',
    'Cambodia': '柬埔寨',
    'Laos': '老挝',
    'Brunei': '文莱',
    'Kazakhstan': '哈萨克斯坦',
    'Uzbekistan': '乌兹别克斯坦',
    'Turkmenistan': '土库曼斯坦',
    'Tajikistan': '塔吉克斯坦',
    'Kyrgyzstan': '吉尔吉斯斯坦',
    'Afghanistan': '阿富汗',
    'Iran': '伊朗',
    'Iraq': '伊拉克',
    'Saudi Arabia': '沙特阿拉伯',
    'Yemen': '也门',
    'Oman': '阿曼',
    'United Arab Emirates': '阿联酋',
    'U.A.E.': '阿联酋',
    'Qatar': '卡塔尔',
    'Bahrain': '巴林',
    'Kuwait': '科威特',
    'Jordan': '约旦',
    'Lebanon': '黎巴嫩',
    'Syria': '叙利亚',
    'Palestine': '巴勒斯坦',
    'Israel': '以色列',
    'Turkey': '土耳其',
    'Cyprus': '塞浦路斯',
    'Georgia': '格鲁吉亚',
    'Armenia': '亚美尼亚',
    'Azerbaijan': '阿塞拜疆',
    'Nepal': '尼泊尔',
    'Bhutan': '不丹',
    'Sri Lanka': '斯里兰卡',
    'Maldives': '马尔代夫',

    // 欧洲
    'Russia': '俄罗斯',
    'Russian Federation': '俄罗斯',
    'Germany': '德国',
    'United Kingdom': '英国',
    'UK': '英国',
    'France': '法国',
    'Italy': '意大利',
    'Spain': '西班牙',
    'Ukraine': '乌克兰',
    'Poland': '波兰',
    'Romania': '罗马尼亚',
    'Netherlands': '荷兰',
    'Belgium': '比利时',
    'Czechia': '捷克',
    'Czech Republic': '捷克',
    'Greece': '希腊',
    'Portugal': '葡萄牙',
    'Sweden': '瑞典',
    'Hungary': '匈牙利',
    'Belarus': '白俄罗斯',
    'Austria': '奥地利',
    'Switzerland': '瑞士',
    'Bulgaria': '保加利亚',
    'Serbia': '塞尔维亚',
    'Denmark': '丹麦',
    'Finland': '芬兰',
    'Slovakia': '斯洛伐克',
    'Norway': '挪威',
    'Ireland': '爱尔兰',
    'Croatia': '克罗地亚',
    'Moldova': '摩尔多瓦',
    'Bosnia and Herzegovina': '波斯尼亚和黑塞哥维那',
    'Albania': '阿尔巴尼亚',
    'Lithuania': '立陶宛',
    'Slovenia': '斯洛文尼亚',
    'Latvia': '拉脱维亚',
    'North Macedonia': '北马其顿',
    'Estonia': '爱沙尼亚',
    'Montenegro': '黑山',
    'Luxembourg': '卢森堡',
    'Malta': '马耳他',
    'Iceland': '冰岛',
    'Andorra': '安道尔',
    'Monaco': '摩纳哥',
    'Liechtenstein': '列支敦士登',
    'San Marino': '圣马力诺',
    'Vatican City': '梵蒂冈',
    'Vatican': '梵蒂冈',

    // 非洲
    'Egypt': '埃及',
    'Nigeria': '尼日利亚',
    'South Africa': '南非',
    'Algeria': '阿尔及利亚',
    'Morocco': '摩洛哥',
    'Tunisia': '突尼斯',
    'Libya': '利比亚',
    'Sudan': '苏丹',
    'South Sudan': '南苏丹',
    'Ethiopia': '埃塞俄比亚',
    'Somalia': '索马里',
    'Kenya': '肯尼亚',
    'Tanzania': '坦桑尼亚',
    'Uganda': '乌干达',
    'Rwanda': '卢旺达',
    'Burundi': '布隆迪',
    'Democratic Republic of the Congo': '刚果民主共和国',
    'Congo, Dem. Rep.': '刚果民主共和国',
    'Republic of the Congo': '刚果共和国',
    'Congo, Rep.': '刚果共和国',
    'Cameroon': '喀麦隆',
    'Gabon': '加蓬',
    'Angola': '安哥拉',
    'Zambia': '赞比亚',
    'Malawi': '马拉维',
    'Mozambique': '莫桑比克',
    'Namibia': '纳米比亚',
    'Botswana': '博茨瓦纳',
    'Zimbabwe': '津巴布韦',
    'Lesotho': '莱索托',
    'Eswatini': '斯威士兰',
    'Swaziland': '斯威士兰',

    // 北美洲
    'United States': '美国',
    'USA': '美国',
    'Canada': '加拿大',
    'Mexico': '墨西哥',
    'Guatemala': '危地马拉',
    'Belize': '伯利兹',
    'El Salvador': '萨尔瓦多',
    'Honduras': '洪都拉斯',
    'Nicaragua': '尼加拉瓜',
    'Costa Rica': '哥斯达黎加',
    'Panama': '巴拿马',
    'Cuba': '古巴',
    'Haiti': '海地',
    'Dominican Republic': '多米尼加共和国',
    'Jamaica': '牙买加',
    'Trinidad and Tobago': '特立尼达和多巴哥',

    // 南美洲
    'Brazil': '巴西',
    'Argentina': '阿根廷',
    'Colombia': '哥伦比亚',
    'Peru': '秘鲁',
    'Venezuela': '委内瑞拉',
    'Chile': '智利',
    'Ecuador': '厄瓜多尔',
    'Bolivia': '玻利维亚',
    'Paraguay': '巴拉圭',
    'Uruguay': '乌拉圭',
    'Guyana': '圭亚那',
    'Suriname': '苏里南',

    // 大洋洲
    'Australia': '澳大利亚',
    'New Zealand': '新西兰',
    'Papua New Guinea': '巴布亚新几内亚',
    'Solomon Islands': '所罗门群岛',
    'Fiji': '斐济',
    'Vanuatu': '瓦努阿图',

    // 小岛屿和领地补充
    'St. Kitts and Nevis': '圣基茨和尼维斯',
    'St. Vincent and the Grenadines': '圣文森特和格林纳丁斯',
    'Antigua and Barbuda': '安提瓜和巴布达',
    'Dominica': '多米尼克',
    'Grenada': '格林纳达',
    'St. Lucia': '圣卢西亚',
    'Barbados': '巴巴多斯',
    'Trinidad and Tobago': '特立尼达和多巴哥',
    'Jamaica': '牙买加',
    'Haiti': '海地',
    'Cuba': '古巴',
    'Dominican Republic': '多米尼加共和国',
    'Bahamas': '巴哈马',
    'Turks and Caicos Islands': '特克斯和凯科斯群岛',
    'Cayman Islands': '开曼群岛',
    'British Virgin Islands': '英属维尔京群岛',
    'U.S. Virgin Islands': '美属维尔京群岛',
    'Puerto Rico': '波多黎各',
    'Guadeloupe': '瓜德罗普',
    'Martinique': '马提尼克',
    'St. Martin': '圣马丁',
    'Sint Maarten': '荷属圣马丁',
    'Curacao': '库拉索',
    'Aruba': '阿鲁巴',
    'Bonaire, Sint Eustatius and Saba': '博奈尔、圣尤斯特歇斯和萨巴',
    'Sint Eustatius': '圣尤斯特歇斯',
    'Saba': '萨巴',
    'Caribbean Netherlands': '加勒比荷兰',
    'Anguilla': '安圭拉',
    'Montserrat': '蒙特塞拉特',
    'British Antarctic Territory': '英属南极领地',
    'South Georgia and the South Sandwich Islands': '南乔治亚和南桑威奇群岛',
    'Falkland Islands': '福克兰群岛',
    'South Sandwich Islands': '南桑威奇群岛',
    'South Georgia Island': '南乔治亚岛',
    'French Guiana': '法属圭亚那',
    'Saint Pierre and Miquelon': '圣皮埃尔和密克隆',
    'Bermuda': '百慕大',
    'Gibraltar': '直布罗陀',
    'Madeira': '马德拉群岛',
    'Canary Islands': '加那利群岛',
    'Azores': '亚速尔群岛',
    'Cape Verde': '佛得角',
    'São Tomé and Príncipe': '圣多美和普林西比',
    'Equatorial Guinea': '赤道几内亚',
    'Bioko': '比奥科岛',
    'Annobón': '安诺本岛',
    'São Tomé': '圣多美岛',
    'Príncipe': '普林西比岛',
    'Comoros': '科摩罗',
    'Mayotte': '马约特岛',
    'Réunion': '留尼汪岛',
    'Mauritius': '毛里求斯',
    'Rodrigues': '罗德里格斯岛',
    'Seychelles': '塞舌尔',
    'Madagascar': '马达加斯加',
    'Maldives': '马尔代夫',
    'British Indian Ocean Territory': '英属印度洋领地',
    'Diego Garcia': '迪戈加西亚岛',
    'Christmas Island': '圣诞岛',
    'Cocos (Keeling) Islands': '科科斯（基林）群岛',
    'Norfolk Island': '诺福克岛',
    'Lord Howe Island': '豪勋爵岛',
    'Macquarie Island': '麦夸里岛',
    'Heard Island and McDonald Islands': '赫德岛和麦克唐纳群岛',
    'French Southern and Antarctic Lands': '法属南部和南极领地',
    'Kerguelen Islands': '凯尔盖朗群岛',
    'Crozet Islands': '克罗泽群岛',
    'St. Paul Island': '圣保罗岛',
    'Amsterdam Island': '阿姆斯特丹岛',
    'Adélie Land': '阿黛利地',
    'New Caledonia': '新喀里多尼亚',
    'French Polynesia': '法属波利尼西亚',
    'Tahiti': '塔希提岛',
    'Bora Bora': '博拉博拉岛',
    'Marquesas Islands': '马克萨斯群岛',
    'Society Islands': '社会群岛',
    'Tuamotu Archipelago': '土阿莫土群岛',
    'Gambier Islands': '甘比尔群岛',
    'Austral Islands': '南方群岛',
    'Wallis and Futuna': '瓦利斯和富图纳',
    'New Zealand': '新西兰',
    'Cook Islands': '库克群岛',
    'Niue': '纽埃',
    'Tokelau': '托克劳',
    'Samoa': '萨摩亚',
    'American Samoa': '美属萨摩亚',
    'Tonga': '汤加',
    'Fiji': '斐济',
    'Vanuatu': '瓦努阿图',
    'Solomon Islands': '所罗门群岛',
    'Papua New Guinea': '巴布亚新几内亚',
    'Guam': '关岛',
    'Northern Mariana Islands': '北马里亚纳群岛',
    'Commonwealth of the Northern Mariana Islands': '北马里亚纳群岛联邦',
    'Saipan': '塞班岛',
    'Tinian': '天宁岛',
    'Rota': '罗塔岛',
    'Federated States of Micronesia': '密克罗尼西亚联邦',
    'Yap': '雅浦岛',
    'Chuuk': '丘克群岛',
    'Pohnpei': '波纳佩岛',
    'Kosrae': '科斯雷岛',
    'Palau': '帕劳',
    'Marshall Islands': '马绍尔群岛',
    'Majuro': '马朱罗环礁',
    'Ebeye': '埃贝耶岛',
    'Kwajalein Atoll': '夸贾林环礁',
    'Nauru': '瑙鲁',
    'Kiribati': '基里巴斯',
    'Tarawa': '塔拉瓦环礁',
    'Tuvalu': '图瓦卢',
    'Funafuti': '富纳富提环礁',
    'Tokelau': '托克劳',
    'Pitcairn Islands': '皮特凯恩群岛',
    'Hawaii': '夏威夷',
    'Alaska': '阿拉斯加',
    'Aleutian Islands': '阿留申群岛',
    'Greenland': '格陵兰',
    'Svalbard': '斯瓦尔巴群岛',
    'Jan Mayen': '扬马延岛',
    'Faroe Islands': '法罗群岛',
    'Iceland': '冰岛',
    'Azores': '亚速尔群岛',
    'Madeira': '马德拉群岛',
    'Canary Islands': '加那利群岛',
    'Cape Verde': '佛得角',
    'São Tomé and Príncipe': '圣多美和普林西比',
    'Equatorial Guinea': '赤道几内亚',
    'Comoros': '科摩罗',
    'Madagascar': '马达加斯加',
    'Mauritius': '毛里求斯',
    'Réunion': '留尼汪岛',
    'Seychelles': '塞舌尔',
    'Maldives': '马尔代夫',
    'Sri Lanka': '斯里兰卡',
    'Andaman Islands': '安达曼群岛',
    'Nicobar Islands': '尼科巴群岛',
    'Lakshadweep': '拉克沙群岛',
    'Maldives': '马尔代夫',
    'Chagos Archipelago': '查戈斯群岛',
    'Diego Garcia': '迪戈加西亚岛',
    'Christmas Island': '圣诞岛',
    'Cocos (Keeling) Islands': '科科斯（基林）群岛',
    'Norfolk Island': '诺福克岛',
    'Lord Howe Island': '豪勋爵岛',
    'Macquarie Island': '麦夸里岛',
    'Heard Island and McDonald Islands': '赫德岛和麦克唐纳群岛',
    'New Caledonia': '新喀里多尼亚',
    'French Polynesia': '法属波利尼西亚',
    'Wallis and Futuna': '瓦利斯和富图纳',
    'Samoa': '萨摩亚',
    'American Samoa': '美属萨摩亚',
    'Tonga': '汤加',
    'Fiji': '斐济',
    'Vanuatu': '瓦努阿图',
    'Solomon Islands': '所罗门群岛',
    'Papua New Guinea': '巴布亚新几内亚',
    'Guam': '关岛',
    'Northern Mariana Islands': '北马里亚纳群岛',
    'Micronesia': '密克罗尼西亚联邦',
    'Palau': '帕劳',
    'Marshall Islands': '马绍尔群岛',
    'Nauru': '瑙鲁',
    'Kiribati': '基里巴斯',
    'Tuvalu': '图瓦卢',
    'Tokelau': '托克劳',
    'Pitcairn Islands': '皮特凯恩群岛',
    'Cook Islands': '库克群岛',
    'Niue': '纽埃',
    'St. Pierre and Miquelon': '圣皮埃尔和密克隆',
    'Bermuda': '百慕大',
    'Gibraltar': '直布罗陀',
    'Isle of Man': '马恩岛',
    'Channel Islands': '海峡群岛',
    'Guernsey': '根西岛',
    'Jersey': '泽西岛',
    'Alderney': '奥尔德尼岛',
    'Sark': '萨克岛',
    'Herm': '赫姆岛',
    'Faroe Islands': '法罗群岛',
    'Åland Islands': '奥兰群岛',
    'Jan Mayen': '扬马延岛',
    'Svalbard': '斯瓦尔巴群岛',
    'Greenland': '格陵兰',
    'Saint Helena, Ascension and Tristan da Cunha': '圣赫勒拿、阿森松和特里斯坦-达库尼亚',
    'Saint Helena': '圣赫勒拿岛',
    'Ascension Island': '阿森松岛',
    'Tristan da Cunha': '特里斯坦-达库尼亚群岛',
    'Gough Island': '戈夫岛',
    'Inaccessible Island': '伊纳克塞瑟布尔岛',
    'Nightingale Islands': '夜莺群岛',
    'South Georgia and the South Sandwich Islands': '南乔治亚和南桑威奇群岛',
    'Falkland Islands': '福克兰群岛',
    'South Georgia Island': '南乔治亚岛',
    'South Sandwich Islands': '南桑威奇群岛',
    'British Antarctic Territory': '英属南极领地',
    'Ross Dependency': '罗斯属地',
    'Adélie Land': '阿黛利地',
    'Australian Antarctic Territory': '澳大利亚南极领地',
    'Antarctic Peninsula': '南极半岛',
    'Graham Land': '格拉汉姆地',
    'Palmer Land': '帕尔默地',
    'Ellsworth Land': '埃尔斯沃思地',
    'Marie Byrd Land': '玛丽·伯德地',
    'Wilkes Land': '威尔克斯地',
    'Victoria Land': '维多利亚地',
    'Oates Land': '奥茨地',
    'George V Land': '乔治五世地',
    'Queen Mary Land': '玛丽皇后地',
    'Kemp Land': '肯普地',
    'Mac. Robertson Land': '麦克罗伯特森地',
    'Princess Elizabeth Land': '伊丽莎白公主地',
    'Enderby Land': '恩德比地',
    'Kerguelen Islands': '凯尔盖朗群岛',
    'Crozet Islands': '克罗泽群岛',
    'St. Paul Island': '圣保罗岛',
    'Amsterdam Island': '阿姆斯特丹岛',
    'Heard Island': '赫德岛',
    'McDonald Islands': '麦克唐纳群岛',
    'Prince Edward Islands': '爱德华王子群岛',
    'Marion Island': '马里恩岛',
    'Prince Edward Island': '爱德华王子岛',
    'Bouvet Island': '布韦岛',
    'Peter I Island': '彼得一世岛',
    'Scott Island': '斯科特岛',
    'Balleny Islands': '巴勒尼群岛',
    'South Orkney Islands': '南奥克尼群岛',
    'South Shetland Islands': '南设得兰群岛',
    'Elephant Island': '象岛',
    'King George Island': '乔治王岛',
    'Deception Island': '欺骗岛',
    'Livingston Island': '利文斯顿岛',
    'Snow Island': '斯诺岛',
    'Smith Island': '史密斯岛',
    'Low Island': '洛岛',
    'King George Island': '乔治王岛',
    'Penguin Island': '企鹅岛',
    'Half Moon Island': '半月岛',
    'Greenwich Island': '格林威治岛',
    'Robert Island': '罗伯特岛',
    'Nelson Island': '纳尔逊岛',
    'Paulet Island': '波利特岛',
    'Joinville Island': '茹安维尔岛',
    'James Ross Island': '詹姆斯罗斯岛',
    'Anvers Island': '安沃尔岛',
    'Alexander Island': '亚历山大岛',
    'Charcot Island': '沙尔科岛',
    'Ronne Ice Shelf': '龙尼冰架',
    'Filchner-Ronne Ice Shelf': '菲尔希纳-龙尼冰架',
    'Ross Ice Shelf': '罗斯冰架',
    'Amery Ice Shelf': '埃默里冰架',
    'Larsen Ice Shelf': '拉森冰架',
    'Wilkins Ice Shelf': '威尔金斯冰架',
    'George VI Ice Shelf': '乔治六世冰架',
    'Floating Ice Shelf': '浮动冰架',
    'Antarctic Ice Sheet': '南极冰盖',
    'East Antarctic Ice Sheet': '东南极冰盖',
    'West Antarctic Ice Sheet': '西南极冰盖',
    'Transantarctic Mountains': '横贯南极山脉',
    'Vinson Massif': '文森山',
    'Mount Erebus': '埃里伯斯火山',
    'Mount Terror': '恐怖山',
    'South Pole': '南极点',
    'North Pole': '北极点',
    'Arctic Ocean': '北冰洋',
    'Arctic': '北极',
    'Antarctica': '南极洲',
    'Southern Ocean': '南冰洋',
    'Pacific Ocean': '太平洋',
    'Atlantic Ocean': '大西洋',
    'Indian Ocean': '印度洋',
    'Mediterranean Sea': '地中海',
    'Black Sea': '黑海',
    'Caspian Sea': '里海',
    'Red Sea': '红海',
    'Persian Gulf': '波斯湾',
    'Gulf of Oman': '阿曼湾',
    'Arabian Sea': '阿拉伯海',
    'Bay of Bengal': '孟加拉湾',
    'South China Sea': '南海',
    'East China Sea': '东海',
    'Yellow Sea': '黄海',
    'Bohai Sea': '渤海',
    'Sea of Japan': '日本海',
    'Sea of Okhotsk': '鄂霍次克海',
    'Bering Sea': '白令海',
    'Gulf of Mexico': '墨西哥湾',
    'Caribbean Sea': '加勒比海',
    'Gulf of Guinea': '几内亚湾',
    'North Sea': '北海',
    'Baltic Sea': '波罗的海',
    'North Atlantic Ocean': '北大西洋',
    'South Atlantic Ocean': '南大西洋',
    'North Pacific Ocean': '北太平洋',
    'South Pacific Ocean': '南太平洋',
    'North Indian Ocean': '北印度洋',
    'South Indian Ocean': '南印度洋',
    'Central Pacific Ocean': '中太平洋',
    'Eastern Pacific Ocean': '东太平洋',
    'Western Pacific Ocean': '西太平洋',
    'Eastern Atlantic Ocean': '东大西洋',
    'Western Atlantic Ocean': '西大西洋',
    'Eastern Indian Ocean': '东印度洋',
    'Western Indian Ocean': '西印度洋',
    'Central Atlantic Ocean': '中大西洋',
    'Central Indian Ocean': '中印度洋',
    'Arctic Circle': '北极圈',
    'Antarctic Circle': '南极圈',
    'Tropic of Cancer': '北回归线',
    'Tropic of Capricorn': '南回归线',
    'Equator': '赤道'
  };

  // 准备地图数据
  let mapData, mapUrl, mapName;

  if (currentMapType === 'china') {
    // 显示中国地图
    mapUrl = '/china.json';
    mapName = 'china';
    mapData = chinaProvinceData.map(item => ({
      ...item,
      value: Math.floor(item.value * metricMultiplier)
    }));
  } else {
    // 显示世界地图
    mapUrl = '/world.json';
    mapName = 'world';
    mapData = countryData.map(item => ({
      ...item,
      value: Math.floor(item.value * metricMultiplier)
    }));
  }

  // 计算总流量和占比
  const totalPV = mapData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = mapData.map(item => ({
    ...item,
    percentage: ((item.value / totalPV * 100)).toFixed(1) + '%'
  }));

  // 生成排名列表
  function generateRanking(data) {
    rankingContainer.innerHTML = ''

    data.forEach((item, index) => {
      let displayName;

      // 根据当前语言选择合适的名称
      if (globalState.language === 'en') {
        // 英文界面下显示英文名称
        displayName = item.name;
      } else {
        // 中文界面下显示中文名称
        displayName = item.cnName || countryNameMap[item.name] || item.name;
      }

      const rankingItem = document.createElement('div')
      rankingItem.className = 'ranking-item'
      rankingItem.innerHTML = `
        <span class="province">${index + 1} ${displayName}</span>
        <span class="pv">${item.value.toLocaleString()}</span>
        <span class="percentage">${item.percentage}</span>
      `
      rankingContainer.appendChild(rankingItem)
    })
  }

  // 加载地图数据
  fetch(mapUrl)
    .then(response => response.json())
    .then(mapGeoJson => {
      // 注册地图
      echarts.registerMap(mapName, mapGeoJson)

      // 生成地图配置，添加缩放和定位功能
      const option = {
        // 缩放控制
        roamController: {
          show: true,
          left: 'right',
          top: 'top',
          mapTypeControl: {
            [mapName]: true
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            let countryName = params.name;

            // 确保所有国家名称都能正确转换为中文
            if (globalState.language === 'zh') {
              // 中文界面，强制使用中文国家名称
              // 尝试直接匹配
              let translated = countryNameMap[countryName];

              // 如果直接匹配失败，尝试去除空格和特殊字符后匹配
              if (!translated) {
                const normalizedName = countryName.replace(/[\s\-\.]+/g, '').toLowerCase();
                for (const [key, value] of Object.entries(countryNameMap)) {
                  if (key.replace(/[\s\-\.]+/g, '').toLowerCase() === normalizedName) {
                    translated = value;
                    break;
                  }
                }
              }

              countryName = translated || countryName;
            }

            // 查找数据
            const data = dataWithPercentage.find(item =>
              item.name === params.name
            );

            if (data) {
              return `${countryName}<br/>${metricText}: ${data.value.toLocaleString()}<br/>${t('占比')}: ${data.percentage}`
            }
            return `${countryName}<br/>${metricText}: 0<br/>${t('占比')}: 0%`
          }
        },
        visualMap: {
          type: 'continuous',
          min: 0,
          max: Math.max(...mapData.map(item => item.value)),
          left: 'left',
          bottom: 'bottom',
          text: [t('高'), t('低')],
          textStyle: {
            fontSize: 12,
            color: '#666'
          },
          calculable: true,
          inRange: {
            color: ['#e0f3ff', '#0066cc']
          }
        },
        // 地图配置
        series: [
          {
            name: metricText,
            type: 'map',
            map: mapName,
            roam: true, // 启用缩放和平移
            zoom: currentMapType === 'china' ? 1.5 : 1.2, // 中国地图放大一些
            center: currentMapType === 'china' ? [104.195, 35.862] : [0, 20], // 中国显示中国中心，世界地图显示世界中心
            label: {
              show: false,
              fontSize: 10,
              color: '#333',
              emphasis: {
                show: true
              },
              formatter: function (params) {
                // 中国地图根据语言显示对应省份名称，世界地图根据语言显示对应国家名称
                if (currentMapType === 'china') {
                  // 中国地图，根据语言显示省份名称
                  if (globalState.language === 'en') {
                    // 英文界面，显示英文省份名称
                    return countryNameMap[params.name] || params.name;
                  } else {
                    // 中文界面，显示中文省份名称
                    return params.name;
                  }
                } else {
                  // 世界地图，根据当前语言显示国家名称
                  if (globalState.language === 'zh') {
                    // 中文界面，显示中文国家名称
                    // 尝试多种匹配方式
                    let translated = countryNameMap[params.name];

                    // 如果直接匹配失败，尝试去除空格和特殊字符后匹配
                    if (!translated) {
                      const normalizedName = params.name.replace(/[\s\-\.]+/g, '').toLowerCase();
                      for (const [key, value] of Object.entries(countryNameMap)) {
                        if (key.replace(/[\s\-\.]+/g, '').toLowerCase() === normalizedName) {
                          translated = value;
                          break;
                        }
                      }
                    }

                    // 处理特殊格式的国家名称
                    if (!translated) {
                      // 处理缩写格式，如S. Sudan -> 南苏丹
                      const abbreviations = {
                        'S.': 'South',
                        'N.': 'North',
                        'Eq.': 'Equatorial',
                        'Dem.': 'Democratic',
                        'Rep.': 'Republic',
                        'Fed.': 'Federal',
                        'Is.': 'Islands',
                        'St.': 'Saint',
                        'Ste.': 'Sainte',
                        'Côte': 'Ivory',
                        'd\'Ivoire': 'Coast',
                        'and': '&',
                        'the': ''
                      };

                      let expandedName = params.name;
                      for (const [abbr, full] of Object.entries(abbreviations)) {
                        expandedName = expandedName.replace(new RegExp(abbr, 'g'), full);
                      }

                      // 再次尝试匹配
                      translated = countryNameMap[expandedName.trim()];
                    }

                    // 作为最后的尝试，检查映射表中是否有中文到英文的映射，然后反转
                    if (!translated) {
                      for (const [key, value] of Object.entries(countryNameMap)) {
                        if (value === params.name) {
                          translated = key;
                          break;
                        }
                      }
                    }

                    return translated || params.name;
                  } else {
                    // 英文界面，显示英文国家名称
                    return params.name
                  }
                }
              }
            },
            data: mapData.map(item => ({
              name: item.name,
              value: item.value
            })),
            emphasis: {
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 'bold',
                formatter: function (params) {
                  // 高亮状态下的名称也需要根据语言和地图类型调整
                  if (currentMapType === 'china') {
                    return params.name
                  } else {
                    // 世界地图，根据当前语言显示国家名称
                    if (globalState.language === 'zh') {
                      // 中文界面，显示中文国家名称
                      // 尝试直接匹配
                      let translated = countryNameMap[params.name];

                      // 如果直接匹配失败，尝试去除空格和特殊字符后匹配
                      if (!translated) {
                        const normalizedName = params.name.replace(/[\s\-\.]+/g, '').toLowerCase();
                        for (const [key, value] of Object.entries(countryNameMap)) {
                          if (key.replace(/[\s\-\.]+/g, '').toLowerCase() === normalizedName) {
                            translated = value;
                            break;
                          }
                        }
                      }

                      return translated || params.name;
                    } else {
                      // 英文界面，显示英文国家名称
                      return params.name
                    }
                  }
                }
              },
              itemStyle: {
                areaColor: '#ffcc00'
              }
            }
          }
        ]
      }

      // 设置图表选项
      mapChart.setOption(option)
      // 确保地图正确适应容器大小
      mapChart.resize()
    })
    .catch(error => {
      console.error(`Failed to load ${mapName} map data:`, error)
      // 如果地图数据加载失败，显示错误信息
      const option = {
        title: {
          text: t('地图数据加载失败'),
          subtext: t('请稍后重试'),
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#ff0000'
          }
        }
      }
      mapChart.setOption(option)
      mapChart.resize()
    })

  // 生成排名
  generateRanking(dataWithPercentage)

  // 添加标签页切换事件
  const mapTabs = document.querySelectorAll('.map-tabs button')

  mapTabs.forEach(button => {
    button.addEventListener('click', () => {
      // 更新按钮状态
      mapTabs.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')

      // 重新初始化地图，确保显示正确的地图类型
      initMapChart()
    })
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    mapChart.resize()
  })
}

// 初始化控制面板事件监听
function initControlPanel() {
  // 添加时间范围切换事件
  const timeRangeButtons = document.querySelectorAll('.time-range button')
  timeRangeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 更新按钮状态
      timeRangeButtons.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')

      // 更新全局状态
      globalState.range = button.dataset.range

      // 更新所有组件
      updateAllComponents()
    })
  })

  // 添加指标切换事件
  const metricButtons = document.querySelectorAll('.metric-tabs button')
  metricButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 更新按钮状态
      metricButtons.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')

      // 更新全局状态
      globalState.metric = button.dataset.metric

      // 更新所有组件
      updateAllComponents()
    })
  })

  // 添加对比选项切换事件
  const comparePrevDayCheckbox = document.getElementById('compare-prev-day')
  const comparePrevWeekCheckbox = document.getElementById('compare-prev-week')

  comparePrevDayCheckbox.addEventListener('change', () => {
    globalState.comparePrevDay = comparePrevDayCheckbox.checked
    updateAllComponents()
  })

  comparePrevWeekCheckbox.addEventListener('change', () => {
    globalState.comparePrevWeek = comparePrevWeekCheckbox.checked
    updateAllComponents()
  })

  // 添加语言切换事件
  const languageButtons = document.querySelectorAll('.language-switch button')
  languageButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 更新按钮状态
      languageButtons.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')

      // 更新全局状态
      globalState.language = button.dataset.lang

      // 更新所有文本内容
      updateAllText()

      // 重新初始化地图，确保地图类型根据语言变化
      initMapChart()
    })
  })
}

// 初始化所有组件
function initAllComponents() {
  initControlPanel()
  initMapChart()
  initTrendChart()
  updateStatsTable()
  // 初始化时更新所有文本，确保使用正确的初始语言
  updateAllText()
}

// 启动应用
initAllComponents()