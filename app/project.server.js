import { db } from "./db.server";

export function getProjects() {
  try {
    return db
      .prepare(
        `SELECT id, alias AS name, description, created_at, stored_tags
         FROM project
         ORDER BY created_at ASC`
      )
      .all();
  } catch (error) {
    console.error("Error en getProjects():", error);
    return [];
  }
}

export function getProject(id) {
  try {
    const result = db
      .prepare(
        `SELECT id, alias AS name, description, created_at, stored_tags
         FROM project
         WHERE id = ?`
      )
      .get(id);
    return result;
  } catch (error) {
    console.error("Error en getProject():", error);
    return null;
  }
}

export function createDefaultProject() {
  try {
    const { lastInsertRowId } = db
      .prepare(`INSERT INTO project(alias, description) VALUES (?, ?)`)
      .run("Mi Primer Proyecto", "Proyecto creado automáticamente");
    return Number(lastInsertRowId);
  } catch (error) {
    console.error("Error en createDefaultProject():", error);
    return null;
  }
}

export function createProject(name, description = "") {
  try {
    const stmt = db.prepare(
      `INSERT INTO project(alias, description) VALUES (?, ?)`
    );
    const result = stmt.run(name, description);
    const insertId = result.lastInsertRowId || result.lastInsertRowid;

    if (insertId !== undefined && insertId !== null) {
      const id = Number(insertId);
      console.log("🔧 ID convertido:", id);
      return id;
    }

    const fallbackResult = db.prepare(`SELECT last_insert_rowid() as id`).get();
    if (fallbackResult && fallbackResult.id) {
      return Number(fallbackResult.id);
    }

    console.error("❌ No se obtuvo ningún ID");
    return null;
  } catch (error) {
    console.error("Error en createProject():", error);
    return null;
  }
}

export function updateProject(
  id,
  newName = null,
  newDescription = null,
  tags = null
) {
  try {
    const stmt = db.prepare(`
      UPDATE project
      SET
        alias       = COALESCE(?, alias),       -- solo cambia si el parámetro NO es null
        description = COALESCE(?, description),  -- idem
        stored_tags = COALESCE(?, stored_tags)
      WHERE id = ?;
    `);

    const result = stmt.run(
      newName ?? null,
      newDescription ?? null,
      tags ?? null,
      id
    );

    return result.changes > 0;
  } catch (error) {
    console.error("Error en updateProject():", error);
    return false;
  }
}

export function deleteProject(id) {
  try {
    const result = db.prepare(`DELETE FROM project WHERE id = ?`).run(id);
    return result.changes > 0;
  } catch (error) {
    console.error("Error en deleteProject():", error);
    return false;
  }
}
