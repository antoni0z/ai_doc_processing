import { db } from "./db.server";
import { validateProjectId, validateDocumentId, validateFileName, validateFileSize } from "./utils/validation.js";
import { MAX_FILE_SIZE, MIME_TYPE_EXTENSIONS } from "./utils/constants.js";

export function getDocumentsByProject(projectId) {
  const validatedProjectId = validateProjectId(projectId);
  let documents = db
    .prepare(
      `SELECT id, name, tags, format, size, status, created_at
    FROM doc
    WHERE project_id = ?
    ORDER BY created_at DESC`
    )
    .all(validatedProjectId);
  return documents;
}

export function getDocumentsWithFilesForAnalysis(projectId) {
  let documents = db
    .prepare(
      `SELECT id, name, tags, format, size, status, created_at, original_file
    FROM doc
    WHERE project_id = ?
    ORDER BY created_at DESC`
    )
    .all(projectId);
  return documents;
}

export function updateDocumentTags(docId, tagValue) {
  try {
    const tags = tagValue ? [tagValue] : [];
    const stmt = db.prepare(
      `UPDATE doc SET tags = ? WHERE id = ?`
    );
    const result = stmt.run(
      JSON.stringify(tags),
      docId
    );
    return result.changes > 0;
  } catch (error) {
    console.error("Error updating document tags:", error);
    return false;
  }
}

export function deleteDocument(docId) {
  try {
    const stmt = db.prepare(
      `DELETE FROM doc WHERE id = ?`
    );
    const result = stmt.run(docId);
    return result.changes > 0;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
}

export async function createDocument(projectId, file) {
  try {
    // Validate inputs
    const validatedProjectId = validateProjectId(projectId);
    const validatedFileName = validateFileName(file.name);
    validateFileSize(file.size, MAX_FILE_SIZE);
    
    // Validate file extension matches MIME type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const allowedExtensions = MIME_TYPE_EXTENSIONS[file.type];
    if (!allowedExtensions || !allowedExtensions.includes(fileExtension)) {
      throw new Error('File extension does not match MIME type');
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const stmt = db.prepare(
      `INSERT INTO doc(name, format, size, status, project_id, original_file)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      validatedFileName,
      file.type,
      file.size,
      "unprocessed",
      validatedProjectId,
      fileBuffer
    );

    const insertId = result.lastInsertRowId || result.lastInsertRowid;
    if (insertId !== undefined && insertId !== null) {
      return Number(insertId);
    }

    console.error("❌ No se obtuvo ID del documento");
    return null;
  } catch (error) {
    console.error("Error en createDocument():", error);
    return null;
  }
}
