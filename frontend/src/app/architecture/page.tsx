'use client'

import Header from '@/components/Header'
import { motion } from 'framer-motion'
import {
  FileInput,
  Sparkles,
  Binary,
  Cpu,
  GitBranch,
  CheckCircle,
  ArrowRight,
  Database,
  Layers,
  Gauge,
  Shield,
} from 'lucide-react'

const pipeline = [
  {
    id: 1,
    icon: FileInput,
    title: 'Input',
    description: 'MPS/LP file parsing with QUADOBJ support for quadratic objectives.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    icon: Sparkles,
    title: 'Presolve',
    description: 'Bound tightening, redundancy removal, and free column elimination.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 3,
    icon: Cpu,
    title: 'Solve',
    description: 'Dual simplex, PDHG first-order, or Mehrotra interior point.',
    color: 'from-yukti-amber to-yukti-amber-dark',
  },
  {
    id: 4,
    icon: GitBranch,
    title: 'Branch & Bound',
    description: 'For integer variables: reliability branching with warm-started nodes.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 5,
    icon: CheckCircle,
    title: 'Verify',
    description: 'KKT residuals checked. Farkas certificates for infeasibility.',
    color: 'from-yukti-teal to-teal-600',
  },
]

const engines = [
  {
    name: 'Revised Simplex',
    type: 'LP Engine',
    status: 'DEFAULT',
    description: 'Primal and dual revised simplex with devex pricing and sparse Markowitz LU factorization.',
    features: ['Devex pricing', 'Bland anti-cycling', 'Sparse LU', 'Basis recovery'],
    file: 'src/simplex/',
  },
  {
    name: 'Restarted PDHG',
    type: 'First-Order LP',
    status: 'GPU-READY',
    description: 'Chambolle-Pock primal-dual with adaptive restarts. The path for GPU acceleration.',
    features: ['Adaptive restarts', 'Matrix-free', 'GPU-ready', 'IPM polish'],
    file: 'src/pdhg/',
  },
  {
    name: 'Mehrotra IPM',
    type: 'Interior Point',
    status: 'OPT-IN',
    description: 'Predictor-corrector over sparse LDL^T. Best for dense problems at scale.',
    features: ['Sparse LDL^T', 'AMD ordering', 'Regularization', 'Crossover'],
    file: 'src/ipm/',
  },
  {
    name: 'Condat-Vu QP',
    type: 'Convex QP',
    status: 'STABLE',
    description: 'First-order primal-dual method for convex quadratic programs.',
    features: ['QUADOBJ support', 'Convexity check', 'MIQP via B&B', 'Certificate'],
    file: 'src/qp/',
  },
]

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-yukti-bg">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 mesh-gradient">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-yukti-amber text-sm font-medium tracking-wider mb-3">SYSTEM ARCHITECTURE</p>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              From Input to Certified Solution
            </h1>
            <p className="text-xl text-yukti-text-secondary leading-relaxed">
              Every component built from mathematical foundations. Zero external solver dependencies.
              Full control over the entire optimization pipeline.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">Computational Pipeline</h2>
            <p className="text-yukti-text-secondary">
              The path a problem takes from file to verified solution.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yukti-border to-transparent hidden lg:block" />

            <div className="grid lg:grid-cols-5 gap-6">
              {pipeline.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border hover:border-yukti-amber/30 transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-yukti-text-muted font-mono mb-2">STEP {step.id}</div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-yukti-amber transition-colors">{step.title}</h3>
                    <p className="text-yukti-text-secondary text-sm">{step.description}</p>
                  </div>
                  {idx < pipeline.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-yukti-border" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Engines */}
      <section className="py-20 px-6 bg-yukti-bg-elevated border-y border-yukti-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">Solver Engines</h2>
            <p className="text-yukti-text-secondary">
              Multiple algorithms optimized for different problem structures.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {engines.map((engine, idx) => (
              <motion.div
                key={engine.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border hover:border-yukti-amber/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{engine.name}</h3>
                    <p className="text-yukti-text-muted text-sm">{engine.type}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    engine.status === 'DEFAULT'
                      ? 'bg-yukti-amber/20 text-yukti-amber'
                      : engine.status === 'GPU-READY'
                      ? 'bg-yukti-cyan/20 text-yukti-cyan'
                      : engine.status === 'OPT-IN'
                      ? 'bg-yukti-indigo/20 text-yukti-indigo'
                      : 'bg-yukti-teal/20 text-yukti-teal'
                  }`}>
                    {engine.status}
                  </span>
                </div>

                <p className="text-yukti-text-secondary text-sm mb-4">{engine.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {engine.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-1 rounded bg-yukti-bg border border-yukti-border text-yukti-text-muted"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-yukti-border">
                  <code className="text-xs text-yukti-text-muted font-mono">{engine.file}</code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">Data Flow</h2>
            <p className="text-yukti-text-secondary">
              How information moves through the system.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-yukti-bg-card border border-yukti-border rounded-2xl p-8 overflow-x-auto"
          >
            <pre className="text-sm text-yukti-text-secondary font-mono whitespace-pre">
{`┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  MPS / LP   │────▶│   Model     │────▶│  Presolved  │────▶│  Solution   │
│    File     │     │   Object    │     │   System    │     │   Point     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│   Audit     │◀────│  Solution   │◀────│  Postsolve  │◀────│    KKT      │
│   Export    │     │    File     │     │  Recovery   │     │  Verified   │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Design Principles */}
      <section className="py-20 px-6 bg-yukti-bg-elevated border-t border-yukti-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">Design Principles</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-yukti-amber/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-yukti-amber" />
              </div>
              <h3 className="font-semibold mb-2">Sovereignty</h3>
              <p className="text-yukti-text-secondary text-sm">
                No code from any existing solver library. Complete independence and auditability.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-yukti-teal/10 flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-6 h-6 text-yukti-teal" />
              </div>
              <h3 className="font-semibold mb-2">Correctness First</h3>
              <p className="text-yukti-text-secondary text-sm">
                A wrong answer scores zero. Every solution verified before reporting.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-yukti-indigo/10 flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-yukti-indigo" />
              </div>
              <h3 className="font-semibold mb-2">Evidence-Based</h3>
              <p className="text-yukti-text-secondary text-sm">
                Every claim backed by benchmark results. CSVs committed, document generated.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
