'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Play,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Layers,
  ArrowLeft,
  Download,
  RotateCcw,
  ChevronRight,
  Loader2,
  XCircle,
} from 'lucide-react'

interface SolveResult {
  status: string
  objective: number | null
  iterations: number
  time: string
  dualValues?: { name: string; value: number }[]
  verified: boolean
  stdout?: string
}

interface BackendStatus {
  status: 'online' | 'offline' | 'checking'
  version?: string
  error?: string
}

const DEMO_MODELS = [
  { id: 'crude_blend', name: 'Crude Blending', description: 'LP: Refinery crude mix optimization', file: 'crude_blend.mps' },
  { id: 'blend_milp', name: 'Refinery Schedule', description: 'MILP: Integer unit scheduling', file: 'blend_milp.mps' },
  { id: 'qp_blend', name: 'QP Blending', description: 'Quadratic: Risk-aware blending', file: 'qp_blend.mps' },
  { id: 'afiro', name: 'Netlib: afiro', description: 'Classic LP benchmark (27×32)', file: '../data/netlib/afiro.mps' },
  { id: 'blend', name: 'Netlib: blend', description: 'Classic LP benchmark (74×83)', file: '../data/netlib/blend.mps' },
]

const DEMO_BASE_PATH = 'D:/SIH/sih26/demo'

export default function ConsolePage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SolveResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'demo' | 'upload'>('demo')
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ status: 'checking' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus()
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const checkBackendStatus = async () => {
    try {
      const res = await fetch('/api/solve')
      const data = await res.json()
      setBackendStatus({
        status: data.status === 'online' ? 'online' : 'offline',
        version: data.version,
        error: data.error,
      })
    } catch {
      setBackendStatus({ status: 'offline', error: 'Cannot connect to API' })
    }
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runOptimization = async () => {
    setIsRunning(true)
    setResult(null)
    setLogs([])

    addLog('Connecting to SANKHYA solver...')

    try {
      let mpsContent: string | null = null
      let mpsFile: string | null = null

      if (customFile) {
        addLog(`Reading uploaded file: ${customFile.name}`)
        mpsContent = await customFile.text()
      } else if (selectedModel) {
        const model = DEMO_MODELS.find(m => m.id === selectedModel)
        if (model) {
          addLog(`Loading demo model: ${model.name}`)
          mpsFile = `${DEMO_BASE_PATH}/${model.file}`
        }
      }

      addLog('Sending to solver backend...')

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpsContent,
          mpsFile,
          options: {},
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        addLog(`ERROR: ${data.error || 'Unknown error'}`)
        if (data.stderr) {
          addLog(`stderr: ${data.stderr}`)
        }
        setIsRunning(false)
        return
      }

      // Parse solver output and add to logs
      if (data.stdout) {
        const lines = data.stdout.split('\n').filter((l: string) => l.trim())
        for (const line of lines) {
          addLog(line)
        }
      }

      // Parse dual values from solution if available
      let dualValues: { name: string; value: number }[] = []
      if (data.stats?.duals) {
        dualValues = Object.entries(data.stats.duals).map(([name, value]) => ({
          name,
          value: value as number,
        }))
      }

      const isOptimal = data.status?.toLowerCase() === 'optimal'
      addLog(isOptimal ? 'Solution verified ✓' : `Solver status: ${data.status}`)

      setResult({
        status: data.status || 'unknown',
        objective: data.objective ?? data.stats?.objective ?? null,
        iterations: data.iterations ?? data.stats?.iterations ?? 0,
        time: data.solveTimeMs ? `${(data.solveTimeMs / 1000).toFixed(3)}s` : 'N/A',
        dualValues: dualValues.length > 0 ? dualValues : undefined,
        verified: isOptimal,
        stdout: data.stdout,
      })
    } catch (error: any) {
      addLog(`ERROR: ${error.message || 'Failed to connect to solver'}`)
    }

    setIsRunning(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomFile(file)
      setSelectedModel(null)
    }
  }

  const canRun = selectedModel || customFile

  return (
    <div className="min-h-screen bg-yukti-bg">
      {/* Header */}
      <header className="border-b border-yukti-border bg-yukti-bg-elevated">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-yukti-text-secondary hover:text-yukti-text transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="w-px h-6 bg-yukti-border" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yukti-amber to-yukti-amber-dark flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yukti-bg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold leading-none">Solver Console</h1>
                <p className="text-xs text-yukti-text-muted">YUKTI Optimization Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkBackendStatus}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yukti-bg-card border border-yukti-border hover:bg-yukti-bg-hover transition-colors"
            >
              {backendStatus.status === 'checking' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-yukti-text-muted" />
                  <span className="text-xs font-medium text-yukti-text-muted">CHECKING...</span>
                </>
              ) : backendStatus.status === 'online' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-yukti-teal status-pulse" />
                  <span className="text-xs font-medium text-yukti-teal">ENGINE ONLINE</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-yukti-rose" />
                  <span className="text-xs font-medium text-yukti-rose">ENGINE OFFLINE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Model Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-yukti-bg-card rounded-xl border border-yukti-border">
              <button
                onClick={() => setActiveTab('demo')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'demo'
                    ? 'bg-yukti-amber text-yukti-bg'
                    : 'text-yukti-text-secondary hover:text-yukti-text'
                }`}
              >
                Demo Models
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-yukti-amber text-yukti-bg'
                    : 'text-yukti-text-secondary hover:text-yukti-text'
                }`}
              >
                Upload MPS
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'demo' ? (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {DEMO_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setCustomFile(null)
                        setResult(null)
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedModel === model.id
                          ? 'bg-yukti-amber/10 border-yukti-amber'
                          : 'bg-yukti-bg-card border-yukti-border hover:border-yukti-border-light'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${selectedModel === model.id ? 'text-yukti-amber' : 'text-yukti-text-muted'}`} />
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-yukti-text-muted">{model.description}</p>
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <CheckCircle className="w-5 h-5 text-yukti-amber" />
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".mps,.lp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 rounded-xl border-2 border-dashed border-yukti-border hover:border-yukti-amber/50 bg-yukti-bg-card transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8 text-yukti-text-muted" />
                      <div className="text-center">
                        <p className="font-medium">Drop MPS file here</p>
                        <p className="text-sm text-yukti-text-muted">or click to browse</p>
                      </div>
                    </div>
                  </button>

                  {customFile && (
                    <div className="mt-4 p-4 rounded-xl bg-yukti-bg-card border border-yukti-amber">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-yukti-amber" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customFile.name}</p>
                          <p className="text-xs text-yukti-text-muted">{(customFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-yukti-amber flex-shrink-0" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Run Button */}
            <button
              onClick={runOptimization}
              disabled={!canRun || isRunning}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                canRun && !isRunning
                  ? 'bg-gradient-to-r from-yukti-amber to-yukti-amber-dark text-yukti-bg hover:shadow-glow-amber'
                  : 'bg-yukti-bg-card border border-yukti-border text-yukti-text-muted cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Solving...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Optimization
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Log Output */}
            <div className="bg-yukti-bg-card border border-yukti-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-yukti-border flex items-center justify-between">
                <span className="text-sm font-medium">Solver Output</span>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-yukti-text-muted hover:text-yukti-text flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="p-4 h-64 overflow-y-auto font-mono text-sm bg-yukti-bg">
                {logs.length === 0 ? (
                  <p className="text-yukti-text-muted">
                    {backendStatus.status === 'offline'
                      ? 'Backend offline. Build the solver first: cmake --build build -j'
                      : 'Select a model and click Run to start...'}
                  </p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="text-yukti-text-secondary">
                      {log.includes('✓') || log.toLowerCase().includes('optimal') ? (
                        <span className="text-yukti-teal">{log}</span>
                      ) : log.includes('ERROR') || log.includes('error') ? (
                        <span className="text-yukti-rose">{log}</span>
                      ) : log.includes('Iteration') ? (
                        <span className="text-yukti-text-muted">{log}</span>
                      ) : (
                        log
                      )}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-yukti-bg-card border border-yukti-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-yukti-text-muted" />
                        <span className="text-xs text-yukti-text-muted uppercase tracking-wider">Status</span>
                      </div>
                      <p className={`text-xl font-bold ${
                        result.status === 'optimal' ? 'text-yukti-teal' : 'text-yukti-amber'
                      }`}>
                        {result.status.toUpperCase()}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-yukti-bg-card border border-yukti-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-yukti-text-muted" />
                        <span className="text-xs text-yukti-text-muted uppercase tracking-wider">Objective</span>
                      </div>
                      <p className="text-xl font-bold font-mono">{result.objective?.toFixed(6)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-yukti-bg-card border border-yukti-border">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="w-4 h-4 text-yukti-text-muted" />
                        <span className="text-xs text-yukti-text-muted uppercase tracking-wider">Iterations</span>
                      </div>
                      <p className="text-xl font-bold font-mono">{result.iterations}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-yukti-bg-card border border-yukti-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yukti-text-muted" />
                        <span className="text-xs text-yukti-text-muted uppercase tracking-wider">Time</span>
                      </div>
                      <p className="text-xl font-bold font-mono">{result.time}</p>
                    </div>
                  </div>

                  {/* Dual Values */}
                  {result.dualValues && (
                    <div className="p-6 rounded-xl bg-yukti-bg-card border border-yukti-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Shadow Prices
                        <span className="text-xs text-yukti-text-muted font-normal">(Dual Values)</span>
                      </h3>
                      <div className="space-y-3">
                        {result.dualValues.map((dv) => (
                          <div key={dv.name} className="flex items-center justify-between py-2 border-b border-yukti-border last:border-0">
                            <span className="font-mono text-sm text-yukti-text-secondary">{dv.name}</span>
                            <span className="font-mono font-bold">{dv.value.toFixed(6)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Badge */}
                  {result.verified && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-yukti-teal/10 border border-yukti-teal/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-yukti-teal" />
                        <div>
                          <p className="font-semibold text-yukti-teal">Solution Verified</p>
                          <p className="text-sm text-yukti-text-secondary">KKT conditions satisfied to 1e-7 tolerance</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-yukti-bg-card border border-yukti-border rounded-lg text-sm hover:bg-yukti-bg-hover transition-colors">
                        <Download className="w-4 h-4" />
                        Export Solution
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
