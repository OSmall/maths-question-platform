import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export function defaultExportPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join('tmp', `payload-export-${timestamp}.json`)
}

export function defaultImportMapPath(exportPath: string) {
  const parsed = path.parse(exportPath)
  return path.join(parsed.dir || 'tmp', `${parsed.name}.import-map.json`)
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

export async function writeJsonFile(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}
