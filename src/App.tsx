import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppData, ExpenseRecord } from './types'
import { effectiveBudget, loadData, saveData, validateData } from './storage'
import { hasSeenIntro, markIntroSeen } from './intro'
import articleMarkdown from './content/why-consumption-training.md?raw'

type Tab = 'record' | 'view'
type Notice = { type: 'success' | 'error'; text: string } | null
type IntroMode = 'welcome' | 'article' | null

const today = () => new Date().toLocaleDateString('sv-SE')
const currentMonth = () => today().slice(0, 7)
const yuan = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 })
const formatMoney = (amount: number) => yuan.format(amount).replace('CN¥', '¥')
const monthLabel = (month: string) => {
  const [year, value] = month.split('-')
  return `${year}年${Number(value)}月`
}
const moveMonth = (month: string, offset: number) => {
  const [year, value] = month.split('-').map(Number)
  const date = new Date(year, value - 1 + offset, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [tab, setTab] = useState<Tab>('record')
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [notice, setNotice] = useState<Notice>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [introMode, setIntroMode] = useState<IntroMode>(() => hasSeenIntro() ? null : 'welcome')
  const [budgetOpen, setBudgetOpen] = useState(() => effectiveBudget(loadData().budgets, currentMonth()).amount === null)
  const [editing, setEditing] = useState<ExpenseRecord | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => saveData(data), [data])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [notice])

  const selectedBudget = effectiveBudget(data.budgets, viewMonth)
  const monthRecords = useMemo(
    () => data.records.filter((record) => record.date.startsWith(viewMonth)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [data.records, viewMonth],
  )
  const spent = monthRecords.reduce((sum, record) => sum + record.amount, 0)
  const remaining = (selectedBudget.amount ?? 0) - spent
  const percent = selectedBudget.amount ? (spent / selectedBudget.amount) * 100 : 0

  const upsertBudget = (amount: number) => {
    setData((previous) => ({
      ...previous,
      budgets: [...previous.budgets.filter((item) => item.month !== viewMonth), { month: viewMonth, amount }],
    }))
    setBudgetOpen(false)
    setNotice({ type: 'success', text: `${monthLabel(viewMonth)}额度已保存` })
  }

  const addRecord = (input: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>) => {
    const timestamp = new Date().toISOString()
    setData((previous) => ({ ...previous, records: [...previous.records, { ...input, id: newId(), createdAt: timestamp, updatedAt: timestamp }] }))
    setViewMonth(input.date.slice(0, 7))
    setNotice({ type: 'success', text: '记录已保存' })
  }

  const updateRecord = (input: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>) => {
    if (!editing) return
    setData((previous) => ({
      ...previous,
      records: previous.records.map((record) => record.id === editing.id ? { ...record, ...input, updatedAt: new Date().toISOString() } : record),
    }))
    setEditing(null)
    setViewMonth(input.date.slice(0, 7))
    setNotice({ type: 'success', text: '记录已更新' })
  }

  const deleteRecord = (record: ExpenseRecord) => {
    if (!window.confirm(`确定删除“${record.purpose}”这笔 ${formatMoney(record.amount)} 的记录吗？删除后无法撤销。`)) return
    setData((previous) => ({ ...previous, records: previous.records.filter((item) => item.id !== record.id) }))
    setNotice({ type: 'success', text: '记录已删除' })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `消费训练备份-${today()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice({ type: 'success', text: '备份文件已导出' })
  }

  const importData = async (file: File) => {
    try {
      const restored = validateData(JSON.parse(await file.text()))
      if (!window.confirm(`恢复后将覆盖当前设备中的 ${data.records.length} 条记录和 ${data.budgets.length} 个月度额度，改为备份中的 ${restored.records.length} 条记录和 ${restored.budgets.length} 个月度额度。是否继续？`)) return
      setData(restored)
      setViewMonth(currentMonth())
      setSettingsOpen(false)
      setBudgetOpen(effectiveBudget(restored.budgets, currentMonth()).amount === null)
      setNotice({ type: 'success', text: '数据已恢复' })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? `恢复失败：${error.message}` : '恢复失败：文件内容不正确' })
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  const chooseIntro = (mode: IntroMode) => {
    markIntroSeen()
    setIntroMode(mode)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img src="./pwa-192x192.png" alt="" />
          <div>
          <p className="eyebrow">个人单机记录</p>
          <h1>消费训练</h1>
          </div>
        </div>
        <button className="icon-button" type="button" aria-label="打开数据设置" onClick={() => setSettingsOpen(true)}>⋯</button>
      </header>

      <main>
        {tab === 'record' ? (
          <RecordPage data={data} onSave={addRecord} onShowView={() => setTab('view')} />
        ) : (
          <ViewPage
            month={viewMonth}
            budget={selectedBudget.amount}
            inherited={selectedBudget.inherited}
            spent={spent}
            remaining={remaining}
            percent={percent}
            records={monthRecords}
            onMonthChange={setViewMonth}
            onBudget={() => setBudgetOpen(true)}
            onEdit={setEditing}
            onDelete={deleteRecord}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="主要页面">
        <button className={tab === 'record' ? 'active' : ''} onClick={() => setTab('record')}><span>＋</span>记录</button>
        <button className={tab === 'view' ? 'active' : ''} onClick={() => setTab('view')}><span>≡</span>查看</button>
      </nav>

      {notice && <div className={`toast ${notice.type}`} role="status">{notice.text}</div>}
      {budgetOpen && <BudgetDialog month={viewMonth} initial={selectedBudget.amount} required={data.budgets.length === 0} onSave={upsertBudget} onClose={() => data.budgets.length > 0 && setBudgetOpen(false)} />}
      {editing && <RecordDialog record={editing} onSave={updateRecord} onClose={() => setEditing(null)} />}
      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
          <section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="modal-heading"><h2 id="settings-title">数据管理</h2><button className="close-button" onClick={() => setSettingsOpen(false)} aria-label="关闭">×</button></div>
            <p className="muted">数据只保存在当前设备。建议定期导出备份。</p>
            <button className="secondary-button full" onClick={() => { setSettingsOpen(false); setIntroMode('article') }}>关于消费训练</button>
            <button className="secondary-button full" onClick={exportData}>导出全部数据</button>
            <button className="secondary-button full" onClick={() => importRef.current?.click()}>从备份文件恢复</button>
            <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && void importData(event.target.files[0])} />
            <p className="warning-copy">恢复会先校验文件，并在确认后覆盖当前设备中的全部记录和额度。</p>
          </section>
        </div>
      )}
      {introMode === 'welcome' && <WelcomeIntro onLearn={() => chooseIntro('article')} onStart={() => chooseIntro(null)} />}
      {introMode === 'article' && <ArticleReader markdown={articleMarkdown} onClose={() => setIntroMode(null)} />}
    </div>
  )
}

function WelcomeIntro({ onLearn, onStart }: { onLearn: () => void; onStart: () => void }) {
  return <section className="intro-screen" role="dialog" aria-modal="true" aria-labelledby="intro-title">
    <div className="intro-content">
      <p className="eyebrow">把钱变成更好的状态</p>
      <h2 id="intro-title">为什么我们需要<br />训练消费能力</h2>
      <p>消费不是简单地少花钱或多买东西，而是学习让有限的金钱真正改善身体、状态、效率与生活。</p>
      <div className="intro-actions">
        <button className="primary-button" onClick={onLearn}>了解消费训练</button>
        <button className="text-button" onClick={onStart}>直接开始</button>
      </div>
    </div>
  </section>
}

function ArticleReader({ markdown, onClose }: { markdown: string; onClose: () => void }) {
  const blocks = parseMarkdown(markdown)
  return <section className="article-screen" role="dialog" aria-modal="true" aria-labelledby="article-title">
    <header className="article-topbar"><button onClick={onClose} aria-label="关闭文章">‹</button><span>关于消费训练</span><i /></header>
    <article className="article-body">
      {blocks.map((block, index) => {
        if (block.type === 'h1') return <h1 id="article-title" key={index}>{block.text}</h1>
        if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>
        if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>
        if (block.type === 'list') return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
        if (block.type === 'rule') return <hr key={index} />
        return <p key={index}>{block.text}</p>
      })}
      <button className="primary-button article-finish" onClick={onClose}>开始记录</button>
    </article>
  </section>
}

type MarkdownBlock = { type: 'h1' | 'h2' | 'quote' | 'paragraph' | 'rule'; text: string } | { type: 'list'; items: string[] }

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = markdown.replace(/\r/g, '').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) continue
    if (line === '---') { blocks.push({ type: 'rule', text: '' }); continue }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.slice(2) }); continue }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); continue }
    if (line.startsWith('> ')) { blocks.push({ type: 'quote', text: line.slice(2) }); continue }
    if (line.startsWith('* ')) {
      const items = [line.slice(2)]
      while (lines[index + 1]?.trim().startsWith('* ')) items.push(lines[++index].trim().slice(2))
      blocks.push({ type: 'list', items })
      continue
    }
    blocks.push({ type: 'paragraph', text: line })
  }
  return blocks
}

function RecordPage({ data, onSave, onShowView }: { data: AppData; onSave: (input: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>) => void; onShowView: () => void }) {
  const month = currentMonth()
  const budget = effectiveBudget(data.budgets, month).amount
  const spent = data.records.filter((record) => record.date.startsWith(month)).reduce((sum, record) => sum + record.amount, 0)
  const [form, setForm] = useState({ date: today(), amount: '', purpose: '', feedback: '' })
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return setError('请输入大于 0 的金额')
    if (!form.purpose.trim()) return setError('请填写这笔消费的用途')
    onSave({ date: form.date, amount, purpose: form.purpose.trim(), feedback: form.feedback.trim() })
    setForm({ date: today(), amount: '', purpose: '', feedback: '' })
    setError('')
  }

  return (
    <div className="page-stack">
      <button className="summary-card" onClick={onShowView} aria-label="查看本月详情">
        <span><small>本月额度</small><strong>{budget === null ? '未设置' : formatMoney(budget)}</strong></span>
        <span><small>已消费</small><strong>{formatMoney(spent)}</strong></span>
        <span className={(budget ?? 0) - spent < 0 ? 'negative' : ''}><small>{budget !== null && spent > budget ? '已超额' : '还剩'}</small><strong>{budget === null ? '—' : formatMoney(budget - spent)}</strong></span>
      </button>

      <section className="form-card">
        <div className="section-heading"><p className="eyebrow">新增一笔</p><h2>记录这次消费</h2></div>
        <form onSubmit={submit} noValidate>
          <label>日期<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>金额（元）<input inputMode="decimal" type="number" min="0.01" step="0.01" required placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
          <label>用途<input type="text" required maxLength={60} placeholder="例如：购买剃须刀" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></label>
          <label>反馈 <em>选填</em><textarea maxLength={300} rows={3} placeholder="实际作用或后续感受" value={form.feedback} onChange={(event) => setForm({ ...form, feedback: event.target.value })} /></label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit">保存记录</button>
        </form>
      </section>
    </div>
  )
}

function ViewPage({ month, budget, inherited, spent, remaining, percent, records, onMonthChange, onBudget, onEdit, onDelete }: { month: string; budget: number | null; inherited: boolean; spent: number; remaining: number; percent: number; records: ExpenseRecord[]; onMonthChange: (month: string) => void; onBudget: () => void; onEdit: (record: ExpenseRecord) => void; onDelete: (record: ExpenseRecord) => void }) {
  return (
    <div className="page-stack">
      <section className="month-header">
        <button aria-label="上个月" onClick={() => onMonthChange(moveMonth(month, -1))}>‹</button>
        <div><p>{monthLabel(month)}</p>{inherited && <small>额度沿用上月</small>}</div>
        <button aria-label="下个月" onClick={() => onMonthChange(moveMonth(month, 1))}>›</button>
      </section>

      <section className={`stats-card ${remaining < 0 ? 'over' : ''}`}>
        <div className="budget-row"><span>本月设定额度</span><button onClick={onBudget}>{budget === null ? '设置额度' : `${formatMoney(budget)} · 修改`}</button></div>
        <div className="hero-stat"><small>{remaining < 0 ? '本月剩余额度' : '本月还剩'}</small><strong>{budget === null ? '—' : formatMoney(remaining)}</strong>{remaining < 0 && <p>已超额 {formatMoney(Math.abs(remaining))}</p>}</div>
        <div className="stats-grid"><span><small>本月已消费</small><strong>{formatMoney(spent)}</strong></span><span><small>完成比例</small><strong>{budget === null ? '—' : `${percent.toFixed(percent >= 100 ? 0 : 1)}%`}</strong></span></div>
        {budget !== null && <div className="progress" aria-label={`完成比例 ${percent.toFixed(0)}%`}><span style={{ width: `${Math.min(percent, 100)}%` }} /></div>}
      </section>

      <section className="records-section">
        <div className="records-heading"><div><p className="eyebrow">消费明细</p><h2>{records.length} 笔记录</h2></div></div>
        {records.length === 0 ? <div className="empty-state"><strong>这个月还没有记录</strong><p>记录消费后，会按日期显示在这里。</p></div> : (
          <div className="record-list">{records.map((record) => <article className="record-item" key={record.id}>
            <div className="record-date"><strong>{Number(record.date.slice(8))}</strong><span>{Number(record.date.slice(5, 7))}月</span></div>
            <div className="record-content"><div><h3>{record.purpose}</h3><strong>{formatMoney(record.amount)}</strong></div>{record.feedback && <p>{record.feedback}</p>}<div className="record-actions"><button onClick={() => onEdit(record)}>编辑</button><button className="danger" onClick={() => onDelete(record)}>删除</button></div></div>
          </article>)}</div>
        )}
      </section>
    </div>
  )
}

function RecordForm({ initial, submitLabel, onSave }: { initial: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>; submitLabel: string; onSave: (input: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>) => void }) {
  const [form, setForm] = useState({ ...initial, amount: String(initial.amount) })
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0 || !form.purpose.trim()) return setError('请填写正确的金额和用途')
    onSave({ ...form, amount, purpose: form.purpose.trim(), feedback: form.feedback.trim() })
  }
  return <form onSubmit={submit} className="compact-form"><label>日期<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>金额（元）<input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>用途<input maxLength={60} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></label><label>反馈 <em>选填</em><textarea rows={3} maxLength={300} value={form.feedback} onChange={(event) => setForm({ ...form, feedback: event.target.value })} /></label>{error && <p className="field-error">{error}</p>}<button className="primary-button">{submitLabel}</button></form>
}

function RecordDialog({ record, onSave, onClose }: { record: ExpenseRecord; onSave: (input: Pick<ExpenseRecord, 'date' | 'amount' | 'purpose' | 'feedback'>) => void; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-heading"><h2 id="edit-title">编辑记录</h2><button className="close-button" onClick={onClose} aria-label="关闭">×</button></div><RecordForm initial={record} submitLabel="保存修改" onSave={onSave} /></section></div>
}

function BudgetDialog({ month, initial, required, onSave, onClose }: { month: string; initial: number | null; required: boolean; onSave: (amount: number) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(initial ? String(initial) : '')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('请输入大于 0 的额度')
    onSave(value)
  }
  return <div className="modal-backdrop"><section className="modal budget-modal" role="dialog" aria-modal="true" aria-labelledby="budget-title"><div className="modal-heading"><div><p className="eyebrow">{monthLabel(month)}</p><h2 id="budget-title">{required ? '先设置训练额度' : '修改月度额度'}</h2></div>{!required && <button className="close-button" onClick={onClose} aria-label="关闭">×</button>}</div><p className="muted">只记录你想训练和观察的消费，不必把日常生活费放进来。</p><form onSubmit={submit}><label>本月额度（元）<input autoFocus type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="例如：2000" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>{error && <p className="field-error">{error}</p>}<button className="primary-button">保存额度</button></form></section></div>
}

export default App
