import { db } from "./db.server";

export function getDocumentsByProject(projectId) {
  let documents = db
    .prepare(
      `SELECT id, name, tags, format, size, status, created_at
    FROM doc
    WHERE project_id = ?
    ORDER BY created_at DESC`
    )
    .all(projectId);
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
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const stmt = db.prepare(
      `INSERT INTO doc(name, format, size, status, project_id, original_file)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      file.name,
      file.type,
      file.size,
      "unprocessed",
      projectId,
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
