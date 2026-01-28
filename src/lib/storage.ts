import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir()
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  },
})

// File filter
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common document and image types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`))
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
})

/**
 * Delete a file from the filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, path.basename(filePath))
  try {
    await fs.unlink(fullPath)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

/**
 * Get the full path to an uploaded file
 */
export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename)
}

/**
 * Get file info
 */
export async function getFileInfo(filename: string) {
  const fullPath = getFilePath(filename)
  try {
    const stats = await fs.stat(fullPath)
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    }
  } catch (error) {
    return {
      exists: false,
    }
  }
}
