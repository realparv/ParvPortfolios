import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Title } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './styles.css'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Title)

const defaultColors = [
  '#22C55E', // green (equity top)
  '#2563EB', // blue (benchmark)
  '#0EA5E9', // cyan
  '#F59E0B', // amber
]

function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="dot" />
        <span className="title">Parv Portfolios</span>
      </div>
      <div className="spacer" />
      <a className="link" href="/data-sheet.csv" download>Download CSV</a>
      <a className="link" href="/data-sheet.json" download>Download JSON</a>
    </header>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <div className="nav-group">Overview</div>
        <a className="nav-item">Home</a>
        <a className="nav-item active">Portfolios</a>
        <a className="nav-item">Experimental</a>
        <a className="nav-item">Stack Archives</a>
        <a className="nav-item">Refer a friend</a>
        <a className="nav-item">Account</a>
      </nav>
    </aside>
  )
}

function useSortableData(items, config = null) {
  const [sortConfig, setSortConfig] = useState(config)

  const sortedItems = useMemo(() => {
    if (!items) return items
    const sortable = [...items]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        const { key, direction } = sortConfig
        const va = a[key]
        const vb = b[key]
        const na = typeof va === 'number' ? va : parseFloat(va)
        const nb = typeof vb === 'number' ? vb : parseFloat(vb)
        if (!isNaN(na) && !isNaN(nb)) {
          return direction === 'ascending' ? na - nb : nb - na
        }
        const sa = String(va)
        const sb = String(vb)
        if (sa < sb) return direction === 'ascending' ? -1 : 1
        if (sa > sb) return direction === 'ascending' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [items, sortConfig])

  const requestSort = (key) => {
    let direction = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  return { items: sortedItems, requestSort, sortConfig }
}

function DataTable({ tableData, setTableData }) {
  // tableData shape: { labels: string[], series: [{ name, color, data:number[] }] }
  const rows = useMemo(() => {
    if (!tableData) return []
    const { labels, series } = tableData
    return labels.map((label, idx) => {
      const row = { __idx: idx, label }
      series.forEach((s) => {
        row[s.name] = s.data[idx]
      })
      return row
    })
  }, [tableData])

  const { items, requestSort, sortConfig } = useSortableData(rows)

  const seriesHeaders = tableData?.series?.map((s) => s.name) || []

  const updateCell = (rowIndex, key, value) => {
    if (key === 'label') {
      const newLabels = [...tableData.labels]
      newLabels[rowIndex] = value
      setTableData({ ...tableData, labels: newLabels })
    } else {
      const seriesIndex = tableData.series.findIndex((s) => s.name === key)
      if (seriesIndex === -1) return
      const newSeries = tableData.series.map((s, i) =>
        i === seriesIndex ? { ...s, data: s.data.map((v, vi) => (vi === rowIndex ? Number(value) || 0 : v)) } : s
      )
      setTableData({ ...tableData, series: newSeries })
    }
  }

  const addRow = () => {
    const newLabels = [...tableData.labels, `Label ${tableData.labels.length + 1}`]
    const newSeries = tableData.series.map((s) => ({ ...s, data: [...s.data, 0] }))
    setTableData({ ...tableData, labels: newLabels, series: newSeries })
  }

  const removeRow = (idx) => {
    if (tableData.labels.length <= 1) return
    const newLabels = tableData.labels.filter((_, i) => i !== idx)
    const newSeries = tableData.series.map((s) => ({ ...s, data: s.data.filter((_, i) => i !== idx) }))
    setTableData({ ...tableData, labels: newLabels, series: newSeries })
  }

  const downloadCSV = () => {
    const headers = ['Label', ...seriesHeaders]
    const lines = [headers.join(',')]
    items.forEach((row) => {
      lines.push([row.label, ...seriesHeaders.map((h) => row[h])].join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data-sheet.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyJSON = async () => {
    const json = JSON.stringify(tableData, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      alert('JSON copied to clipboard')
    } catch (e) {
      console.error(e)
      alert('Failed to copy JSON')
    }
  }

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div>
          <button className="btn" onClick={addRow}>Add Row</button>
        </div>
        <div className="toolbar-actions">
          <button className="btn" onClick={downloadCSV}>Download CSV</button>
          <button className="btn" onClick={copyJSON}>Copy JSON</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('label')}>
                Label {sortConfig?.key === 'label' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              {seriesHeaders.map((name) => (
                <th key={name} onClick={() => requestSort(name)}>
                  {name} {sortConfig?.key === name ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, rIdx) => (
              <tr key={row.__idx}>
                <td>
                  <input
                    className="cell-input"
                    value={row.label}
                    onChange={(e) => updateCell(row.__idx, 'label', e.target.value)}
                  />
                </td>
                {seriesHeaders.map((name) => (
                  <td key={name}>
                    <input
                      className="cell-input number"
                      type="number"
                      value={row[name]}
                      onChange={(e) => updateCell(row.__idx, name, e.target.value)}
                    />
                  </td>
                ))}
                <td className="row-actions">
                  <button className="icon-btn" title="Remove row" onClick={() => removeRow(row.__idx)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChartCard({ title, tableData, seriesVisible, setSeriesVisible, height = 360, yTickCallback, lineColorScale = defaultColors, fillArea = false }) {
  const chartRef = useRef(null)

  const data = useMemo(() => {
    if (!tableData) return { labels: [], datasets: [] }
    const { labels, series } = tableData
    return {
      labels,
      datasets: series.map((s, i) => ({
        label: s.name,
        data: s.data,
        borderColor: s.color || lineColorScale[i % lineColorScale.length],
        backgroundColor: (s.color || lineColorScale[i % lineColorScale.length]) + '20',
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 2,
        hidden: !seriesVisible[s.name],
        fill: fillArea,
      })),
    }
  }, [tableData, seriesVisible, lineColorScale, fillArea])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true },
        onClick: (e, legendItem, legend) => {
          const name = legendItem.text
          setSeriesVisible((prev) => ({ ...prev, [name]: !prev[name] }))
        },
      },
      title: { display: !!title, text: title || '' },
      tooltip: { intersect: false, mode: 'index' },
    },
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: {
        title: { display: false },
        grid: { color: '#f1f5f9', borderColor: '#e5e7eb' },
        ticks: { color: '#6b7280' },
      },
      y: {
        title: { display: false },
        beginAtZero: false,
        ticks: { color: '#6b7280', callback: yTickCallback },
        grid: { color: '#f1f5f9', borderColor: '#e5e7eb' },
      },
    },
  }), [setSeriesVisible, title, yTickCallback])

  const exportPNG = () => {
    const chart = chartRef.current
    if (chart) {
      const url = chart.toBase64Image('image/png', 1)
      const link = document.createElement('a')
      link.href = url
      link.download = 'chart.png'
      link.click()
    }
  }

  return (
    <div className="chart-card">
      <div className="card-toolbar">
        <div className="legend-toggles">
          {tableData?.series?.map((s, i) => (
            <label key={s.name} className="toggle">
              <input
                type="checkbox"
                checked={!!seriesVisible[s.name]}
                onChange={() => setSeriesVisible((prev) => ({ ...prev, [s.name]: !prev[s.name] }))}
              />
              <span className="swatch" style={{ backgroundColor: s.color || lineColorScale[i % lineColorScale.length] }} />
              {s.name}
            </label>
          ))}
        </div>
        <button className="btn" onClick={exportPNG}>Export PNG</button>
      </div>
      <div className="chart-wrap" style={{ height }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  )
}

export default function App() {
  const [tableData, setTableData] = useState(null)
  const [seriesVisible, setSeriesVisible] = useState({})
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/data-sheet.json')
        const json = await res.json()
        // ensure defaults
        const series = json.series.map((s, i) => ({
          color: defaultColors[i % defaultColors.length],
          ...s,
        }))
        setTableData({ labels: json.labels, series })
        setSeriesVisible(series.reduce((acc, s) => ({ ...acc, [s.name]: true }), {}))
      } catch (e) {
        console.error('Failed to load data-sheet.json, using fallback', e)
        const fallback = {
          labels: ['2019-01-01','2019-02-01','2019-03-01','2019-04-01','2019-05-01','2019-06-01'],
          series: [
            { name: 'Revenue', color: defaultColors[0], data: [12, 19, 3, 5, 2, 3] },
            { name: 'Expenses', color: defaultColors[1], data: [2, 3, 20, 5, 1, 4] },
          ],
        }
        setTableData(fallback)
        setSeriesVisible(fallback.series.reduce((acc, s) => ({ ...acc, [s.name]: true }), {}))
      }
    }
    load()
  }, [])

  // helper: detect date labels
  const labelsAreDates = useMemo(() => tableData?.labels?.every?.(l => /^\d{4}-\d{2}-\d{2}$/.test(l)), [tableData])

  // filtered view by date range if dates
  const filteredData = useMemo(() => {
    if (!tableData) return tableData
    if (!labelsAreDates || (!fromDate && !toDate)) return tableData
    const start = fromDate ? new Date(fromDate) : null
    const end = toDate ? new Date(toDate) : null
    const idxs = tableData.labels
      .map((d, i) => ({ d: new Date(d), i }))
      .filter(({ d }) => (!start || d >= start) && (!end || d <= end))
      .map(x => x.i)
    const labels = idxs.map(i => tableData.labels[i])
    const series = tableData.series.map(s => ({ ...s, data: idxs.map(i => s.data[i]) }))
    return { labels, series }
  }, [tableData, labelsAreDates, fromDate, toDate])

  const resetRange = () => { setFromDate(''); setToDate('') }

  // Trailing Returns summary (very simple: change over last N points)
  const summary = useMemo(() => {
    if (!filteredData) return []
    const periods = [
      { key: 'YTD', n: Math.min(12, filteredData.labels.length - 1) },
      { key: '1Y', n: 12 },
      { key: '3Y', n: 36 },
      { key: '5Y', n: 60 },
    ]
    return filteredData.series.map(s => {
      const row = { name: s.name }
      periods.forEach(p => {
        const n = p.n
        if (filteredData.labels.length > n) {
          const end = s.data[s.data.length - 1]
          const start = s.data[s.data.length - 1 - n]
          const pct = start !== 0 ? ((end - start) / Math.abs(start)) * 100 : 0
          row[p.key] = pct
        } else {
          row[p.key] = null
        }
      })
      return row
    })
  }, [filteredData])

  // Drawdown for the first visible series
  const drawdownData = useMemo(() => {
    if (!filteredData) return null
    const active = filteredData.series.find(s => seriesVisible[s.name]) || filteredData.series[0]
    if (!active) return null
    let max = -Infinity
    const dd = active.data.map(v => { max = Math.max(max, v); return ((v - max) / max) * 100 || 0 })
    return { labels: filteredData.labels, series: [{ name: 'Drawdown', color: '#f472b6', data: dd }] }
  }, [filteredData, seriesVisible])

  return (
    <div className="app-root">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="content">
          <div className="container">
            <div className="grid">
              <section className="section">
                <div className="section-header">
                  <h2>Trailing Returns</h2>
                  <button className="icon-btn" title="Download summary">⬇</button>
                </div>
                <div className="summary">
                  <table>
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>YTD</th>
                        <th>1Y</th>
                        <th>3Y</th>
                        <th>5Y</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((r) => (
                        <tr key={r.name}>
                          <td>{r.name}</td>
                          <td>{r.YTD != null ? r.YTD.toFixed(1) + '%' : '-'}</td>
                          <td>{r['1Y'] != null ? r['1Y'].toFixed(1) + '%' : '-'}</td>
                          <td>{r['3Y'] != null ? r['3Y'].toFixed(1) + '%' : '-'}</td>
                          <td>{r['5Y'] != null ? r['5Y'].toFixed(1) + '%' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="note">Note: Returns are simple over-the-period changes for demo purposes.</div>
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>Equity curve</h2>
                  <div className="equity-controls">
                    <span>From date</span>
                    <div className="inputs">
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} disabled={!labelsAreDates} />
                      <span>To date</span>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} disabled={!labelsAreDates} />
                    </div>
                    <button className="btn" onClick={resetRange}>Reset</button>
                  </div>
                </div>
                <ChartCard title="" tableData={filteredData || tableData} seriesVisible={seriesVisible} setSeriesVisible={setSeriesVisible} height={380} />
              </section>

              {drawdownData && (
                <section className="section">
                  <div className="section-header">
                    <h2>Drawdown</h2>
                  </div>
                  <ChartCard
                    title=""
                    tableData={drawdownData}
                    seriesVisible={{ Drawdown: true }}
                    setSeriesVisible={() => {}}
                    height={180}
                    lineColorScale={["#fda4af"]}
                    yTickCallback={(v) => `${v.toFixed(0)}%`}
                    fillArea
                  />
                </section>
              )}

              <div className="table-card">
                <div className="table-toolbar"><strong>Data sheet</strong></div>
                <DataTable tableData={tableData} setTableData={setTableData} />
              </div>
            </div>
          </div>
        </main>
      </div>
      <footer className="app-footer">Built with React + Vite + Chart.js</footer>
    </div>
  )
}
