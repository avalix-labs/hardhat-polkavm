import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { REVIVE_RELEASES_BASE_URL } from './constants.js'

/**
 * Maps the current platform to the matching resolc release asset name.
 * (See https://github.com/paritytech/revive/releases.)
 */
export function getResolcAssetName(): string {
  const platform = os.platform()
  const arch = os.arch()

  if (platform === 'darwin') {
    return 'resolc-universal-apple-darwin'
  }
  if (platform === 'linux' && arch === 'x64') {
    return 'resolc-x86_64-unknown-linux-musl'
  }
  if (platform === 'win32' && arch === 'x64') {
    return 'resolc-x86_64-pc-windows-msvc.exe'
  }

  throw new Error(
    `No native resolc binary is published for ${platform}/${arch}. ` +
      'Use `resolc: { compilerSource: "npm" }` instead — it works on every platform.',
  )
}

function getCacheDir(): string {
  const base =
    process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache')
  return path.join(base, 'hardhat-polkadot', 'resolc')
}

/** Deterministic on-disk location for a given resolc version (no I/O). */
export function getResolcBinaryPath(version: string): string {
  return path.join(getCacheDir(), `v${version}`, getResolcAssetName())
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Downloads the native resolc binary for `version` into the cache if it isn't
 * there yet, and returns the path to it.
 */
export async function downloadResolcBinary(
  version: string,
  quiet = false,
): Promise<string> {
  const destination = getResolcBinaryPath(version)
  if (await fileExists(destination)) {
    return destination
  }

  const asset = getResolcAssetName()
  const url = `${REVIVE_RELEASES_BASE_URL}/v${version}/${asset}`
  if (!quiet) {
    console.log(`Downloading resolc ${version} from ${url}`)
  }

  await fs.mkdir(path.dirname(destination), { recursive: true })

  const response = await fetch(url)
  if (!response.ok || response.body === null) {
    throw new Error(
      `Failed to download resolc from ${url}: ${response.status} ${response.statusText}`,
    )
  }

  const tempPath = `${destination}.download`
  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(tempPath),
  )
  if (process.platform !== 'win32') {
    await fs.chmod(tempPath, 0o755)
  }
  await fs.rename(tempPath, destination)

  return destination
}
