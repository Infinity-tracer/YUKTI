import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

// MSYS2 UCRT64 bin directory for DLLs
const MSYS2_BIN = 'C:\\msys64\\ucrt64\\bin'

function getEnvWithMsys2Path(): NodeJS.ProcessEnv {
  const currentPath = process.env.PATH || process.env.Path || ''
  const newPath = `${MSYS2_BIN};${currentPath}`

  // Windows uses Path, Linux/Mac use PATH - set both to be safe
  return {
    ...process.env,
    PATH: newPath,
    Path: newPath,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mpsContent, mpsFile, options = {} } = await request.json()

    // Find the YUKTHI binary
    const possiblePaths = [
      path.join(process.cwd(), '..', 'build', 'YUKTHI.exe'),
      path.join(process.cwd(), '..', 'build', 'YUKTHI'),
      'D:/SIH/sih26/build/YUKTHI.exe',
      'D:/SIH/sih26/build/YUKTHI',
    ]

    let binaryPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        binaryPath = p
        break
      }
    }

    if (!binaryPath) {
      return NextResponse.json(
        { error: 'YUKTHI binary not found. Build the project first.' },
        { status: 500 }
      )
    }

    let inputFile = mpsFile

    // If MPS content is provided, write to temp file
    if (mpsContent) {
      const tempDir = os.tmpdir()
      inputFile = path.join(tempDir, `YUKTHI_${Date.now()}.mps`)
      fs.writeFileSync(inputFile, mpsContent)
    }

    if (!inputFile || !fs.existsSync(inputFile)) {
      return NextResponse.json(
        { error: 'No input file provided or file not found' },
        { status: 400 }
      )
    }

    // Build command
    const tempDir = os.tmpdir()
    const solFile = path.join(tempDir, `solution_${Date.now()}.sol`)
    const statsFile = path.join(tempDir, `stats_${Date.now()}.json`)

    let cmd = `"${binaryPath}" solve "${inputFile}" --write-sol "${solFile}" --stats "${statsFile}"`

    // Add options
    if (options.algorithm) {
      cmd += ` --option algorithm=${options.algorithm}`
    }
    if (options.timeLimit) {
      cmd += ` --option time_limit=${options.timeLimit}`
    }

    const startTime = Date.now()
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120000,
      env: getEnvWithMsys2Path(),
    })
    const solveTime = Date.now() - startTime

    // Parse results
    let stats: any = {}
    if (fs.existsSync(statsFile)) {
      stats = JSON.parse(fs.readFileSync(statsFile, 'utf-8'))
    }

    let solution = ''
    if (fs.existsSync(solFile)) {
      solution = fs.readFileSync(solFile, 'utf-8')
    }

    // Cleanup temp files
    if (mpsContent && fs.existsSync(inputFile)) {
      fs.unlinkSync(inputFile)
    }
    if (fs.existsSync(solFile)) fs.unlinkSync(solFile)
    if (fs.existsSync(statsFile)) fs.unlinkSync(statsFile)

    return NextResponse.json({
      success: true,
      status: stats.status || 'unknown',
      objective: stats.objective,
      iterations: stats.iterations,
      solveTimeMs: solveTime,
      solution,
      stdout,
      stderr,
      stats,
    })
  } catch (error: any) {
    console.error('Solve error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Solve failed',
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check / version endpoint
  try {
    const possiblePaths = [
      path.join(process.cwd(), '..', 'build', 'YUKTHI.exe'),
      path.join(process.cwd(), '..', 'build', 'YUKTHI'),
      'D:/SIH/sih26/build/YUKTHI.exe',
      'D:/SIH/sih26/build/YUKTHI',
    ]

    let binaryPath = ''
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        binaryPath = p
        break
      }
    }

    if (!binaryPath) {
      return NextResponse.json({
        status: 'offline',
        error: 'Binary not found',
      })
    }

    const { stdout } = await execAsync(`"${binaryPath}" version`, {
      env: getEnvWithMsys2Path(),
    })

    return NextResponse.json({
      status: 'online',
      version: stdout.trim(),
      binaryPath,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    })
  }
}
