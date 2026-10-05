export interface SolveOptions {
  algorithm?: 'simplex' | 'pdhg' | 'ipm'
  timeLimit?: number
  threads?: number
}

export interface SolveResult {
  success: boolean
  status: string
  objective: number | null
  iterations: number
  solveTimeMs: number
  solution: string
  stdout: string
  stderr: string
  stats: Record<string, any>
  error?: string
}

export interface EngineStatus {
  status: 'online' | 'offline' | 'error'
  version?: string
  binaryPath?: string
  error?: string
}

export async function checkEngineStatus(): Promise<EngineStatus> {
  try {
    const response = await fetch('/api/solve')
    return await response.json()
  } catch (error) {
    return { status: 'offline', error: 'Failed to connect to API' }
  }
}

export async function solveMPS(
  mpsFile: string,
  options: SolveOptions = {}
): Promise<SolveResult> {
  const response = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mpsFile, options }),
  })
  return await response.json()
}

export async function solveMPSContent(
  mpsContent: string,
  options: SolveOptions = {}
): Promise<SolveResult> {
  const response = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mpsContent, options }),
  })
  return await response.json()
}

// Demo MPS models
export const DEMO_MODELS = {
  crude_blend: `D:/SIH/sih26/demo/crude_blend.mps`,
  crude_blend_qp: `D:/SIH/sih26/demo/crude_blend_qp.mps`,
  blend_milp: `D:/SIH/sih26/demo/blend_milp.mps`,
  qp_blend: `D:/SIH/sih26/demo/qp_blend.mps`,
}

// Parse constraint text to approximate MPS (demo purpose)
export function constraintTextToMPS(text: string): string {
  // This is a simplified demo - real implementation would use an LLM or proper parser
  const lines = [
    'NAME          UserConstraint',
    'ROWS',
    ' N  OBJ',
  ]

  // Add detected constraints as rows
  const constraints: string[] = []
  if (text.toLowerCase().includes('sulfur')) {
    lines.push(' L  SULFUR')
    constraints.push('sulfur')
  }
  if (text.toLowerCase().includes('octane')) {
    lines.push(' G  OCTANE')
    constraints.push('octane')
  }
  if (text.toLowerCase().includes('capacity') || text.toLowerCase().includes('limit')) {
    lines.push(' L  CAPACITY')
    constraints.push('capacity')
  }

  lines.push('COLUMNS')
  lines.push('    X1        OBJ       1.0')
  constraints.forEach((c, i) => {
    lines.push(`    X1        ${c.toUpperCase().padEnd(10)} 1.0`)
  })

  lines.push('RHS')
  // Extract numbers from text
  const numbers = text.match(/[\d.]+/g) || ['100']
  constraints.forEach((c, i) => {
    const val = numbers[i] || '100'
    lines.push(`    RHS1      ${c.toUpperCase().padEnd(10)} ${val}`)
  })

  lines.push('ENDATA')

  return lines.join('\n')
}
