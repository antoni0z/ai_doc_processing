import { useRef } from "react";
import { Form } from "@remix-run/react";
import DocumentList from "./DocumentList";

export default function DocumentManagement({
  docs,
  projectTags,
  onSubmit,
  onTagChange,
  onDocumentDelete,
}) {
  const fileInputRef = useRef(null);

  return (
    <div>
      <h2 className="font-semibold mb-2 text-gray-800">Documents</h2>
      <p className="text-xs text-gray-500">
        Each tag gives a group of documents a logical grouping and a
        desirable output.
      </p>
      <p className="text-xs text-gray-500">
        Ex: tag: <strong>spanish_dni</strong>. Desired output fields:{" "}
        <strong>name, creation_date, id</strong>
      </p>
      <p className="text-xs text-gray-500 mb-4">
        If no tags are included all the docs will be processed at the same
        time.
      </p>
      
      
      <Form
        method="post"
        encType="multipart/form-data"
        className="space-y-4"
      >
        <input type="hidden" name="intent" value="upload" />
        <input
          ref={fileInputRef}
          type="file"
          name="docs"
          multiple
          accept=".pdf,.png,.jpeg,.jpg"
          required
          className="block w-full file:mr-4 file:rounded
                   file:border-0 file:bg-gray-100 file:px-4
                   file:py-2 file:text-gray-600 hover:file:bg-gray-200 cursor-pointer"
          onChange={(e) => {
            const form = e.currentTarget.form;
            const inputEl = e.currentTarget;
            onSubmit(form);
            inputEl.value = "";
          }}
        />
      </Form>
      
      <div className="mt-6">
        <DocumentList
          items={docs.map((doc) => ({
            ...doc,
            tags: (() => {
              try {
                return doc.tags ? JSON.parse(doc.tags) : [];
              } catch {
                return [];
              }
            })(),
          }))}
          hasTag={(item) => Array.isArray(item.tags) && item.tags.length > 0}
          allowed_tags={projectTags}
          onTagChange={onTagChange}
          onDocumentDelete={onDocumentDelete}
        />
      </div>
    </div>
  );
}