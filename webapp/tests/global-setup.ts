import { spawn, execSync, type ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

const ROOT = path.resolve(__dirname, '..')
let serverProcess: ChildProcess | null = null

export async function setup() {
  const testDbPath = path.join(ROOT, 'prisma', 'data', 'test.db')

  // Clean up old test db if exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
  // Also clean journal files
  if (fs.existsSync(testDbPath + '-journal')) {
    fs.unlinkSync(testDbPath + '-journal')
  }

  const env = {
    ...process.env,
    DATABASE_URL: 'file:./data/test.db',
    JWT_SECRET: 'dev-secret-change-in-production',
    PORT: '3001',
    NODE_ENV: 'test',
  }

  // Initialize test database schema
  console.log('[test-setup] Pushing database schema...')
  execSync('npx prisma db push --skip-generate', {
    cwd: ROOT,
    env,
    stdio: 'pipe',
  })

  // Generate prisma client (in case not generated)
  execSync('npx prisma generate', {
    cwd: ROOT,
    env,
    stdio: 'pipe',
  })

  // Seed the test database
  console.log('[test-setup] Seeding test database...')
  execSync('npx tsx prisma/seed.ts', {
    cwd: ROOT,
    env,
    stdio: 'pipe',
  })

  // Start the server
  console.log('[test-setup] Starting server on port 3001...')
  serverProcess = spawn('node', ['server.js'], {
    cwd: ROOT,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timed out after 60s'))
    }, 60000)

    const onData = (data: Buffer) => {
      const output = data.toString()
      if (output.includes('Ready on')) {
        clearTimeout(timeout)
        serverProcess?.stdout?.removeListener('data', onData)
        console.log('[test-setup] Server is ready!')
        resolve()
      }
    }

    serverProcess!.stdout?.on('data', onData)

    serverProcess!.stderr?.on('data', (data: Buffer) => {
      const errOutput = data.toString()
      // Next.js outputs some info to stderr, only fail on real errors
      if (errOutput.includes('Error:') && !errOutput.includes('Warning')) {
        console.error('[test-setup] Server error:', errOutput)
      }
    })

    serverProcess!.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    serverProcess!.on('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout)
        reject(new Error(`Server exited with code ${code}`))
      }
    })
  })

  // Store server process globally for teardown
  ;(globalThis as any).__TEST_SERVER_PROCESS__ = serverProcess
}

export async function teardown() {
  const proc = (globalThis as any).__TEST_SERVER_PROCESS__ as ChildProcess | null
  if (proc && !proc.killed) {
    console.log('[test-teardown] Stopping server...')
    proc.kill('SIGTERM')
    // Wait for process to exit
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        proc.kill('SIGKILL')
        resolve()
      }, 5000)
      proc.on('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  // Clean up test database
  const testDbPath = path.join(path.resolve(__dirname, '..'), 'prisma', 'data', 'test.db')
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
    console.log('[test-teardown] Cleaned up test database')
  }
  if (fs.existsSync(testDbPath + '-journal')) {
    fs.unlinkSync(testDbPath + '-journal')
  }
}
