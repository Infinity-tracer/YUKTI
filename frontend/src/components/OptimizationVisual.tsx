'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  connections: number[]
}

export default function OptimizationVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const nodes: Node[] = []
    const nodeCount = 25
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
      })
    }

    // Create sparse connections
    nodes.forEach((node, i) => {
      const numConnections = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < numConnections; j++) {
        const target = Math.floor(Math.random() * nodeCount)
        if (target !== i && !node.connections.includes(target)) {
          node.connections.push(target)
        }
      }
    })

    let animationId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.01

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1

        node.x = Math.max(0, Math.min(width, node.x))
        node.y = Math.max(0, Math.min(height, node.y))
      })

      // Draw connections
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)'
      ctx.lineWidth = 1
      nodes.forEach((node, i) => {
        node.connections.forEach((targetIdx) => {
          const target = nodes[targetIdx]
          const dist = Math.hypot(target.x - node.x, target.y - node.y)
          if (dist < 200) {
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(target.x, target.y)
            ctx.stroke()
          }
        })
      })

      // Draw nodes
      nodes.forEach((node, i) => {
        const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7
        const radius = 3 + pulse * 2

        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 3)
        gradient.addColorStop(0, `rgba(245, 158, 11, ${0.4 * pulse})`)
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = `rgba(245, 158, 11, ${0.8 + pulse * 0.2})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw optimal path highlight
      const pathNodes = [0, 3, 7, 12, 18, 24].filter(i => i < nodes.length)
      if (pathNodes.length > 1) {
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 + Math.sin(time * 3) * 0.2})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(nodes[pathNodes[0]].x, nodes[pathNodes[0]].y)
        for (let i = 1; i < pathNodes.length; i++) {
          ctx.lineTo(nodes[pathNodes[i]].x, nodes[pathNodes[i]].y)
        }
        ctx.stroke()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [isClient])

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-yukti-bg-elevated border border-yukti-border">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Overlay stats */}
      <div className="absolute top-4 left-4 space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass px-3 py-2 rounded-lg"
        >
          <p className="text-[10px] text-yukti-text-muted uppercase tracking-wider">Variables</p>
          <p className="text-lg font-bold font-mono text-yukti-amber">25</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass px-3 py-2 rounded-lg"
        >
          <p className="text-[10px] text-yukti-text-muted uppercase tracking-wider">Constraints</p>
          <p className="text-lg font-bold font-mono text-yukti-cyan">48</p>
        </motion.div>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 right-4 flex items-center gap-2 glass px-3 py-2 rounded-lg"
      >
        <span className="w-2 h-2 rounded-full bg-yukti-teal status-pulse" />
        <span className="text-xs font-medium text-yukti-teal">CONVERGING</span>
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-yukti-bg-elevated to-transparent" />
    </div>
  )
}
