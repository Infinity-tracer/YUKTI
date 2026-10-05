'use client'

import Header from '@/components/Header'
import OptimizationVisual from '@/components/OptimizationVisual'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Boxes,
  Cpu,
  Shield,
  Zap,
  Factory,
  Droplets,
  Network,
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Sovereign Stack',
    description: 'Zero external solver dependencies. Every algorithm built from mathematical foundations.',
  },
  {
    icon: Cpu,
    title: 'GPU Ready',
    description: 'CUDA-accelerated first-order methods. Falls back gracefully when hardware unavailable.',
  },
  {
    icon: Zap,
    title: 'Industrial Grade',
    description: 'Handles degeneracy, ill-conditioning, and weak LP relaxations that break naive solvers.',
  },
  {
    icon: CheckCircle2,
    title: 'Certified Output',
    description: 'Every solution verified against KKT conditions. Farkas certificates for infeasibility.',
  },
]

const capabilities = [
  { label: 'Linear Programming', status: 'stable', icon: Target },
  { label: 'Mixed-Integer LP', status: 'stable', icon: Boxes },
  { label: 'Convex QP', status: 'stable', icon: BarChart3 },
  { label: 'Interior Point', status: 'opt-in', icon: Network },
]

const industries = [
  {
    icon: Factory,
    title: 'Refinery Operations',
    description: 'Crude blending, unit scheduling, and quality management with shadow price analysis.',
  },
  {
    icon: Zap,
    title: 'Power Systems',
    description: 'Economic dispatch, unit commitment, and grid optimization under operational constraints.',
  },
  {
    icon: Network,
    title: 'Supply Chain',
    description: 'Multi-echelon inventory, transportation routing, and production planning.',
  },
  {
    icon: Droplets,
    title: 'Process Industries',
    description: 'Batch scheduling, resource allocation, and process optimization.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-yukti-bg">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 mesh-gradient min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yukti-amber/10 border border-yukti-amber/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-yukti-amber status-pulse" />
                <span className="text-yukti-amber text-xs font-medium tracking-wide">SIH 2026 • PS26119 • MRPL</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                <span className="text-gradient">Mathematical</span>
                <br />
                <span className="text-yukti-text">Optimization</span>
                <br />
                <span className="text-yukti-text-secondary">from First Principles</span>
              </h1>

              <p className="text-xl text-yukti-text-secondary mb-8 max-w-lg leading-relaxed">
                Indigenous LP/MILP/QP solver for mission-critical industrial systems.
                No external solver libraries. Every algorithm derived and implemented in-house.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  href="/console"
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yukti-amber to-yukti-amber-dark text-yukti-bg font-semibold rounded-xl hover:shadow-glow-amber transition-all"
                >
                  Open Console
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/architecture"
                  className="flex items-center gap-2 px-6 py-3 bg-yukti-bg-card border border-yukti-border text-yukti-text font-medium rounded-xl hover:border-yukti-border-light hover:bg-yukti-bg-hover transition-all"
                >
                  View Architecture
                </Link>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yukti-text-muted" />
                  <span className="text-yukti-text-muted">Netlib</span>
                  <span className="font-mono font-bold text-yukti-teal">78/89</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-yukti-text-muted" />
                  <span className="text-yukti-text-muted">MIPLIB</span>
                  <span className="font-mono font-bold text-yukti-amber">13/30</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:pl-8"
            >
              <OptimizationVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-yukti-bg-elevated border-y border-yukti-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Built Different</h2>
            <p className="text-yukti-text-secondary max-w-2xl mx-auto">
              Not a wrapper around an existing solver. A complete optimization stack written from mathematical foundations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border hover:border-yukti-amber/30 transition-all hover:shadow-inner-glow"
              >
                <div className="w-12 h-12 rounded-xl bg-yukti-amber/10 flex items-center justify-center mb-4 group-hover:bg-yukti-amber/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-yukti-amber" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-yukti-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-yukti-amber text-sm font-medium tracking-wider mb-3">SOLVER ENGINES</p>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">Multiple Problem Classes</h2>
                <p className="text-yukti-text-secondary mb-8 leading-relaxed">
                  From continuous linear programs to mixed-integer problems with quadratic objectives.
                  Each engine optimized for its problem structure.
                </p>
              </motion.div>

              <div className="space-y-4">
                {capabilities.map((cap, idx) => (
                  <motion.div
                    key={cap.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-yukti-bg-card border border-yukti-border"
                  >
                    <div className="flex items-center gap-3">
                      <cap.icon className="w-5 h-5 text-yukti-amber" />
                      <span className="font-medium">{cap.label}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      cap.status === 'stable'
                        ? 'bg-yukti-teal/20 text-yukti-teal'
                        : 'bg-yukti-indigo/20 text-yukti-indigo'
                    }`}>
                      {cap.status.toUpperCase()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-yukti-bg-card border border-yukti-border rounded-2xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-yukti-border">
                  <div className="w-3 h-3 rounded-full bg-yukti-rose/60" />
                  <div className="w-3 h-3 rounded-full bg-yukti-amber/60" />
                  <div className="w-3 h-3 rounded-full bg-yukti-teal/60" />
                  <span className="ml-2 text-yukti-text-muted text-xs">terminal</span>
                </div>
                <pre className="text-yukti-text-secondary overflow-x-auto">
                  <code>{`$ yukti solve crude_blend.mps --stats

YUKTI 0.1.0 (359afb9)
Reading crude_blend.mps... 3 rows, 3 cols
Presolve: 3 rows, 3 cols, 9 nonzeros

Dual simplex:
  Iteration 0: objective = 0.000000
  Iteration 7: objective = 214.145946

Status:      `}<span className="text-yukti-teal">OPTIMAL</span>{`
Objective:   214.145946
Iterations:  7
Time:        0.001s

Shadow prices:
  THRUPUT   0.000000
  DIESEL    4.972973
  SULPHUR   1.135135

✓ KKT conditions verified`}</code>
                </pre>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-radial from-yukti-amber/5 to-transparent rounded-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 px-6 bg-yukti-bg-elevated border-y border-yukti-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-yukti-amber text-sm font-medium tracking-wider mb-3">APPLICATIONS</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Industrial Domains</h2>
            <p className="text-yukti-text-secondary max-w-2xl mx-auto">
              Designed for the constrained, high-stakes optimization problems that define industrial operations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {industries.map((industry, idx) => (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border hover:border-yukti-amber/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yukti-amber/20 to-yukti-amber/5 flex items-center justify-center flex-shrink-0">
                    <industry.icon className="w-6 h-6 text-yukti-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-yukti-amber transition-colors">{industry.title}</h3>
                    <p className="text-yukti-text-secondary text-sm leading-relaxed">{industry.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Optimize?</h2>
            <p className="text-yukti-text-secondary mb-8 text-lg">
              Upload your MPS file and get a verified optimal solution. No setup required.
            </p>
            <Link
              href="/console"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yukti-amber to-yukti-amber-dark text-yukti-bg font-semibold rounded-xl hover:shadow-glow-amber transition-all text-lg"
            >
              Launch Console
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-yukti-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yukti-amber to-yukti-amber-dark flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yukti-bg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold">YUKTI</span>
          </div>
          <p className="text-yukti-text-muted text-sm">
            Smart India Hackathon 2026 · PS26119 · Mangalore Refinery and Petrochemicals Limited
          </p>
        </div>
      </footer>
    </main>
  )
}
