import { redirect } from "@remix-run/node";
import {
  Outlet,
  useLoaderData,
  useNavigate,
  useSubmit,
  useParams,
} from "@remix-run/react";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

export const loader = async ({ request }) => {
  try {
    const { getProjects, createDefaultProject } = await import("../project.server");
    const url = new URL(request.url);
    
    let projects = getProjects();
    
    if (url.pathname === '/projects') {
      if (!projects.length) {
        const firstId = createDefaultProject();
        throw redirect(`/projects/${firstId}`);
      }
      throw redirect(`/projects/${projects[0].id}`);
    }
    
    return { projects };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error("Error en loader de projects:", error);
    return { projects: [] };
  }
};


export default function ProjectsLayout() {
  const { projects = [] } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const params = useParams();
  const [editingTab, setEditingTab] = useState(null);

  const activeProjectId = params.id ? Number(params.id) : null;

  const changeProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const createNewProject = () => {
    const form = new FormData();
    form.append("intent", "create_project");
    const targetRoute = activeProjectId
      ? `/projects/${activeProjectId}`
      : `/projects/${projects[0]?.id || 1}`;
    submit(form, { method: "post", action: targetRoute });
  };

  const updateProjectName = (id, newName) => {
    if (!newName.trim()) return;
    const form = new FormData();
    form.append("intent", "update_project");
    form.append("name", newName.trim());
    submit(form, { method: "post", action: `/projects/${id}` });
    setEditingTab(null);
  };

  const deleteProject = (id) => {
    const form = new FormData();
    form.append("intent", "delete_project");
    submit(form, { method: "post", action: `/projects/${id}` });
  };

  return (
    <div className="min-h-screen bg-white py-12">
      {/* cabecera COMPARTIDA */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-8">
        <h1 className="text-2xl font-bold text-black mb-2">Doc Dashboard</h1>
        <p className="text-gray-600">
          Automated document review and analysis system
        </p>
      </div>

      {/* Pestañas de Proyectos COMPARTIDAS */}
      <div className="max-w-6xl mx-auto px-4 mb-4">
        <div className="border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1">
            {projects.map((p) => (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => changeProject(p.id)}
                  className={`px-3 py-2 text-sm font-medium rounded ${
                    activeProjectId === p.id
                      ? "text-gray-800 bg-gray-200"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {editingTab === p.id ? (
                    <input
                      type="text"
                      defaultValue={p.name}
                      autoFocus
                      onBlur={(e) => updateProjectName(p.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateProjectName(p.id, e.target.value);
                        }
                      }}
                      className="bg-transparent outline-none text-sm w-32"
                    />
                  ) : (
                    <span onDoubleClick={() => setEditingTab(p.id)}>
                      {p.name}
                    </span>
                  )}
                </button>
                {projects.length > 1 && (
                  <button
                  onClick={() => deleteProject(p.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 text-white rounded-full
                            opacity-0 group-hover:opacity-100 hover:bg-gray-600 transition-opacity
                            flex items-center justify-center"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                )}
              </div>
            ))}
            <button
              onClick={createNewProject}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              + Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO DINÁMICO - aquí se renderizan las rutas hijas */}
      <div className="max-w-6xl mx-auto px-4">
        <Outlet />
      </div>
    </div>
  );
}
