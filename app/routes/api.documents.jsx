// API route for document analysis
import { validateProjectId, validateJSON, validateAnalysisConfig, sanitizeString } from "../utils/validation.js";

export const action = async ({ request }) => {
  const AI_SERVER_API = process.env.AI_SERVER_API ?? "http://localhost:8000";
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    
    // Validate and sanitize inputs
    const projectId = validateProjectId(formData.get("projectId"));
    const analysisConfigRaw = formData.get("analysisConfig");
    const analysisConfig = validateAnalysisConfig(validateJSON(analysisConfigRaw));
    const projectDescription = sanitizeString(formData.get("projectDescription"), 1000);
    const projectTagsRaw = formData.get("projectTags") || "[]";
    const projectTags = validateJSON(projectTagsRaw);
    
    // Validate projectTags is an array
    if (!Array.isArray(projectTags)) {
      throw new Error("Project tags must be an array");
    }
    
    const { getDocumentsWithFilesForAnalysis } = await import("../document.server");
    const docs = getDocumentsWithFilesForAnalysis(projectId);
    
    const docsByTag = {};
    docs.forEach(doc => {
      try {
        const docTags = doc.tags ? JSON.parse(doc.tags) : [];
        
        if (docTags.length > 0) {
          const tag = docTags[0];
          
          if (tag && tag.trim() !== "") {
            if (!docsByTag[tag]) {
              docsByTag[tag] = [];
            }
            docsByTag[tag].push(doc);
          }
        }
      } catch (e) {
        console.error("Error parsing doc tags:", e);
      }
    });

    const apiCalls = [];
    const tagsList = [];

    for (const [tag, tagConfig] of Object.entries(analysisConfig)) {
      if (!projectTags.includes(tag)) {
        continue;
      }
      
      if (!tagConfig.output_fields || tagConfig.output_fields.length === 0) {
        continue;
      }
      
      const tagDocs = docsByTag[tag];
      if (!tagDocs || tagDocs.length === 0) {
        continue;
      }

      const pythonFormData = new FormData();
      pythonFormData.append("provider", "openai/o3");
      pythonFormData.append("description", projectDescription || "Document analysis");
      pythonFormData.append("tag", tag);
      pythonFormData.append("output_fields", JSON.stringify(tagConfig.output_fields));
      
      for (const doc of tagDocs) {
        if (doc.original_file) {
          const fileBuffer = Buffer.from(doc.original_file);
          const file = new File([fileBuffer], doc.name, { type: doc.format });
          pythonFormData.append("files", file);
        } else if (doc.original_file_uri) {
          console.log("File URI not yet implemented:", doc.original_file_uri);
        }
      }

      const apiCall = fetch(AI_SERVER_API + "/images/analyze", {
        method: "POST",
        body: pythonFormData,
      }).then(async (response) => {
        if (response.ok) {
          const analysisResult = await response.json();
          return {
            tag,
            success: true,
            data: analysisResult,
            processedDocs: tagDocs.length
          };
        } else {
          const errorText = await response.text();
          return {
            tag,
            error: `Python API error: ${response.status} - ${errorText}`
          };
        }
      }).catch(error => {
        console.error(`Error processing tag ${tag}:`, error);
        return {
          tag,
          error: `Processing error: ${error.message}`
        };
      });

      apiCalls.push(apiCall);
      tagsList.push(tag);
    }

    const results = {};

    if (apiCalls.length > 0) {
      const parallelResults = await Promise.all(apiCalls);
      
      parallelResults.forEach(result => {
        results[result.tag] = result;
      });
    }

    return Response.json({ results });
    
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
};