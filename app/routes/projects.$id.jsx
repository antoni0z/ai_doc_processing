import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import TagsInput from "../components/TagsInput";
import DocumentManagement from "../components/DocumentManagement";
import TagConfiguration from "../components/TagConfiguration";
import AnalysisResults from "../components/AnalysisResults";
import { useAnalysisConfig } from "../hooks/useAnalysisConfig";
import { VALID_FILE_TYPES } from "../utils/constants";
import { getOverallPrecisionStats } from "../utils/precisionCalculations";

export const loader = async ({ params }) => {
  try {
    const { getProject } = await import("../project.server");
    const { getDocumentsByProject } = await import("../document.server");

    const projectId = Number(params.id);

    const project = getProject(projectId);
    if (!project) {
      const { getProjects } = await import("../project.server");
      const projects = getProjects();
      if (projects.length > 0) {
        return redirect(`/projects/${projects[0].id}`);
      }
      return redirect("/projects");
    }

    const docs = getDocumentsByProject(projectId);

    return { docs, activeProject: project };
  } catch (error) {
    console.error("Error en loader:", error);
    return {
      docs: [],
      activeProject: { id: 1, name: "Error", description: "Fallback" },
    };
  }
};

export const action = async ({ params, request }) => {
  const form = await request.formData();
  const intent = form.get("intent");
  const projectId = Number(params.id);

  if (intent === "upload") {
    const files = form.getAll("docs");
    if (!files.length) {
      return { error: "Debes seleccionar al menos un archivo." };
    }

    const rejected = [];
    const accepted = [];

    for (const file of files) {
      if (!VALID_FILE_TYPES.includes(file.type)) {
        rejected.push(file.name);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length) {
      const { createDocument } = await import("../document.server");

      for (const file of accepted) {
        const docId = await createDocument(projectId, file);
        if (!docId) {
          console.error("Failed to save document:", file.name);
        }
      }
    }

    return { rejected, added: accepted.length };
  }

  // 🎯 GESTIÓN DE PROYECTOS
  if (intent === "create_project") {
    const { createProject } = await import("../project.server");
    const newId = createProject("Nuevo Proyecto");
    if (newId) {
      return redirect(`/projects/${newId}`);
    }
    return { error: "Error creando proyecto" };
  }

  if (intent === "update_project") {
    const { updateProject } = await import("../project.server");
    const description = form.get("description");
    const name = form.get("name");
    const success = updateProject(projectId, name, description);
    if (success) {
      return redirect(`/projects/${projectId}`);
    }
    return { error: "Error actualizando proyecto" };
  }

  if (intent === "update_tags") {
    const { updateProject } = await import("../project.server");
    const tagsJson = form.get("tags");
    const success = updateProject(projectId, null, null, tagsJson);
    if (success) {
      return redirect(`/projects/${projectId}`);
    }
    return { error: "Error actualizando tags" };
  }

  if (intent === "delete_project") {
    const { deleteProject, getProjects } = await import("../project.server");
    const success = deleteProject(projectId);
    if (success) {
      const remainingProjects = getProjects();
      if (remainingProjects.length > 0) {
        return redirect(`/projects/${remainingProjects[0].id}`);
      } else {
        return redirect("/");
      }
    }
    return { error: "Error eliminando proyecto" };
  }

  // 🏷️ ACTUALIZAR TAG DE DOCUMENTO
  if (intent === "updateDocumentTag") {
    const docId = Number(form.get("docId"));
    const tagValue = form.get("tagValue");

    const { updateDocumentTags } = await import("../document.server");
    const success = updateDocumentTags(docId, tagValue);

    if (success) {
      return { success: "Tag actualizada correctamente" };
    }
    return { error: "Error actualizando tag del documento" };
  }

  // 🗑️ ELIMINAR DOCUMENTO
  if (intent === "deleteDocument") {
    const docId = Number(form.get("docId"));

    const { deleteDocument } = await import("../document.server");
    const success = deleteDocument(docId);

    if (success) {
      return { success: "Documento eliminado correctamente" };
    }
    return { error: "Error eliminando documento" };
  }

  return { error: "Acción no soportada" };
};

/* --------------------------- UI --------------------------- */
export default function ProjectDetails() {
  const { docs = [], activeProject } = useLoaderData();
  const submit = useSubmit();

  // Parse tags from JSON string to array
  const projectTags = (() => {
    try {
      return activeProject.stored_tags
        ? JSON.parse(activeProject.stored_tags)
        : [];
    } catch {
      return [];
    }
  })();


  const {
    analysisConfig,
    setAnalysisConfig,
    currentProjectResults,
    currentProjectAnalyzing,
    analyzeDocuments,
    saveTagConfigToCache,
  } = useAnalysisConfig(activeProject, projectTags);

  
  const availableResultTags = currentProjectResults?.results ? Object.keys(currentProjectResults.results) : [];
  const [currentResultTagIndex, setCurrentResultTagIndex] = useState(0);


  useEffect(() => {
    setCurrentResultTagIndex(0);
  }, [currentProjectResults]);

  
  const navigateToNextResultTag = () => {
    if (availableResultTags.length > 0) {
      setCurrentResultTagIndex((prev) => (prev + 1) % availableResultTags.length);
    }
  };

  const navigateToPrevResultTag = () => {
    if (availableResultTags.length > 0) {
      setCurrentResultTagIndex((prev) => (prev - 1 + availableResultTags.length) % availableResultTags.length);
    }
  };

  // Get current result tag
  const currentResultTag = availableResultTags[currentResultTagIndex] || null;

  const updateProjectDescription = (e) => {
    const form = new FormData();
    form.append("intent", "update_project");
    form.append("description", e.currentTarget.value);
    submit(form, { method: "post", action: `/projects/${activeProject.id}` });
  };

  const updateProjectTags = (newTags) => {
    const form = new FormData();
    form.append("intent", "update_tags");
    form.append("tags", JSON.stringify(newTags));
    submit(form, { method: "post", action: `/projects/${activeProject.id}` });
  };


  return (
    <>
      {/* Project Information */}
      <Form
        method="post"
        onSubmit={(e) => {
          updateProjectDescription(e);
        }}
        id={activeProject.id}
        className="space-y-3"
      >
        <textarea
          name="projectDescription"
          placeholder="Add here any additional information that will help with the document analysis..."
          onBlur={(e) => {
            updateProjectDescription(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              updateProjectDescription(e);
              e.target.blur();
            }
          }}
          key={activeProject.id}
          defaultValue={activeProject.description}
          rows={3}
          className="w-full px-3 py-2 mb-1 border bg-gray-50 border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-200 resize-y min-h-[4.5rem] max-h-[13.5rem] overflow-y-auto"
        />
        <p className="text-xs text-gray-400 mb-3">
          Store with Cmd+Enter or Ctrl+Enter
        </p>
      </Form>

      {/* Project Tags */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Project Tags</h3>
        <TagsInput
          tags={projectTags}
          onChange={updateProjectTags}
          placeholder="Add tags to group documents..."
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel - Document Management and Tag Configuration */}
        <section className="w-full md:w-1/2 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <DocumentManagement
            docs={docs}
            projectTags={projectTags}
            onSubmit={(form) => submit(form)}
            onTagChange={(docId, tagValue) => {
              const form = new FormData();
              form.append("intent", "updateDocumentTag");
              form.append("docId", docId);
              form.append("tagValue", tagValue);
              submit(form, { method: "post" });
            }}
            onDocumentDelete={(docId) => {
              const form = new FormData();
              form.append("intent", "deleteDocument");
              form.append("docId", docId);
              submit(form, { method: "post" });
            }}
          />

          <TagConfiguration
            projectTags={projectTags}
            analysisConfig={analysisConfig}
            setAnalysisConfig={setAnalysisConfig}
            onAnalyze={analyzeDocuments}
            isAnalyzing={currentProjectAnalyzing}
            docs={docs}
            saveTagConfigToCache={saveTagConfigToCache}
          />
        </section>

        {/* Right Panel - Analysis Results */}
        <AnalysisResults
          currentProjectAnalyzing={currentProjectAnalyzing}
          currentProjectResults={currentProjectResults}
          availableResultTags={availableResultTags}
          currentResultTagIndex={currentResultTagIndex}
          navigateToNextResultTag={navigateToNextResultTag}
          navigateToPrevResultTag={navigateToPrevResultTag}
          currentResultTag={currentResultTag}
          getOverallPrecisionStats={getOverallPrecisionStats}
        />
      </div>
    </>
  );
}