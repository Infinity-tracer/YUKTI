'use client'

import Header from '@/components/Header'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Award } from 'lucide-react'

const netlibResults = [
  { instance: 'adlittle', rows: 56, cols: 97, status: 'optimal', objective: '2.2549e+05', time: '0.01s', verified: true },
  { instance: 'afiro', rows: 27, cols: 32, status: 'optimal', objective: '-4.6475e+02', time: '0.01s', verified: true },
  { instance: 'blend', rows: 74, cols: 83, status: 'optimal', objective: '-3.0812e+01', time: '0.01s', verified: true },
  { instance: 'israel', rows: 174, cols: 142, status: 'optimal', objective: '-8.9664e+05', time: '0.01s', verified: true },
  { instance: 'sc105', rows: 105, cols: 103, status: 'optimal', objective: '-5.2202e+01', time: '0.01s', verified: true },
  { instance: 'sc50a', rows: 50, cols: 48, status: 'optimal', objective: '-6.4575e+01', time: '0.01s', verified: true },
  { instance: 'sc50b', rows: 50, cols: 48, status: 'optimal', objective: '-7.0000e+01', time: '0.01s', verified: true },
  { instance: 'share2b', rows: 96, cols: 79, status: 'optimal', objective: '-4.1573e+02', time: '0.01s', verified: true },
  { instance: 'stocfor1', rows: 117, cols: 111, status: 'optimal', objective: '-4.1132e+04', time: '0.01s', verified: true },
]

const benchmarkSets = [
  {
    name: 'Netlib Full',
    instances: 89,
    passed: 78,
    description: 'The standard LP benchmark suite',
    details: 'Matched to published optimum within 1e-6 AND independently verified',
  },
  {
    name: 'Netlib Medium',
    instances: 50,
    passed: 48,
    description: 'Instances under 500 rows',
    details: 'Higher pass rate by construction (smaller = easier)',
  },
  {
    name: 'MIPLIB 2017',
    instances: 30,
    passed: 13,
    description: 'Mixed-integer benchmark',
    details: '13 reach optimum, 9 prove it. Weakest results in the project.',
  },
  {
    name: 'Mittelmann LP',
    instances: 8,
    passed: 0,
    description: 'Large-scale LP instances',
    details: '0 of 8 in 300s. All time limits. Scale is the frontier.',
  },
]

export default function BenchmarksPage() {
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
            <p className="text-yukti-amber text-sm font-medium tracking-wider mb-3">BENCHMARK RESULTS</p>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Evidence, Not Claims
            </h1>
            <p className="text-xl text-yukti-text-secondary leading-relaxed">
              Every number here was produced by running a command in a terminal.
              The CSVs are committed. The document is generated from them.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benchmarkSets.map((set, idx) => (
              <motion.div
                key={set.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{set.name}</h3>
                  {set.passed > set.instances * 0.8 ? (
                    <Award className="w-5 h-5 text-yukti-teal" />
                  ) : set.passed > 0 ? (
                    <TrendingUp className="w-5 h-5 text-yukti-amber" />
                  ) : (
                    <Clock className="w-5 h-5 text-yukti-text-muted" />
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-3xl font-bold font-mono ${
                    set.passed > set.instances * 0.8 ? 'text-yukti-teal' :
                    set.passed > 0 ? 'text-yukti-amber' : 'text-yukti-text-muted'
                  }`}>
                    {set.passed}
                  </span>
                  <span className="text-yukti-text-muted">/ {set.instances}</span>
                </div>
                <p className="text-yukti-text-secondary text-sm mb-2">{set.description}</p>
                <p className="text-yukti-text-muted text-xs">{set.details}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Netlib Table */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">Netlib Small Set (Live Demo)</h2>
            <p className="text-yukti-text-secondary">
              These 9 instances are committed and solved by the demo. Every run regenerates the table.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-yukti-bg-card border border-yukti-border rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-yukti-bg border-b border-yukti-border">
                  <tr>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Instance</th>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Size</th>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Status</th>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Objective</th>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Time</th>
                    <th className="text-left p-4 font-medium text-yukti-text-muted">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {netlibResults.map((row) => (
                    <tr key={row.instance} className="border-b border-yukti-border last:border-0 hover:bg-yukti-bg-hover transition-colors">
                      <td className="p-4 font-mono font-medium">{row.instance}</td>
                      <td className="p-4 text-yukti-text-muted">{row.rows}×{row.cols}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-yukti-teal">
                          <CheckCircle className="w-4 h-4" />
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{row.objective}</td>
                      <td className="p-4 font-mono text-yukti-text-muted">{row.time}</td>
                      <td className="p-4">
                        {row.verified ? (
                          <span className="text-yukti-teal">✓</span>
                        ) : (
                          <span className="text-yukti-rose">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Don't Have */}
      <section className="py-12 px-6 bg-yukti-bg-elevated border-y border-yukti-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">What We Don&apos;t Have</h2>
            <p className="text-yukti-text-secondary">
              A solver that is vague about its limits is not one an industrial user can plan around.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yukti-amber" />
                <h3 className="font-semibold">GPU Acceleration</h3>
              </div>
              <p className="text-yukti-text-secondary text-sm">
                The first-order method exists on CPU. CUDA backend is unwritten (issues #16-19).
                <code className="mx-1 text-yukti-amber">--gpu</code> warns and falls back.
                No speed-up is claimed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yukti-amber" />
                <h3 className="font-semibold">Scale</h3>
              </div>
              <p className="text-yukti-text-secondary text-sm">
                Largest Netlib solved: fit2d (25×10500). 0 of 8 Mittelmann inside 300s.
                Nothing supports &quot;millions of variables&quot; yet. Issue #198.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-yukti-rose" />
                <h3 className="font-semibold">Non-Convex QP</h3>
              </div>
              <p className="text-yukti-text-secondary text-sm">
                Refused deliberately. LDL^T checks convexity first; a negative pivot returns a certificate.
                A local optimum reported as global is the failure mode we will not ship.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-yukti-bg-card border border-yukti-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yukti-amber" />
                <h3 className="font-semibold">Cutting Planes</h3>
              </div>
              <p className="text-yukti-text-secondary text-sm">
                Root Gomory and cover cuts exist but are OFF by default.
                They cut nodes but cost proofs on MIPLIB. No MIR, none below root.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reproduce */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-4">Reproduce Everything</h2>
            <p className="text-yukti-text-secondary mb-8">
              One command takes a fresh clone to every claim on this page.
            </p>
            <div className="bg-yukti-bg-card border border-yukti-border rounded-xl p-6 text-left">
              <pre className="font-mono text-sm text-yukti-text overflow-x-auto">
                <code>scripts/reproduce.sh</code>
              </pre>
            </div>
            <p className="text-yukti-text-muted text-sm mt-4">
              Runs offline with committed instances. Add --fetch-medium for the 50-instance tier.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
