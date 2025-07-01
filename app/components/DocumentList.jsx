import {XMarkIcon } from "@heroicons/react/20/solid";

export default function DocumentList({ items, allowed_tags, onTagChange, onDocumentDelete, hasTag}) {
  if (!items.length) {
    return <p className="text-gray-500">No docs have been processed.</p>;
  }
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className={`group py-3 flex items-center justify-between space-x-4 relative ${allowed_tags.length > 0 && (!hasTag || !hasTag(item)) ? 'bg-red-50 text-red-800 rounded-lg' : ''}`}>
          {/* Delete button on the left */}
          <button
            onClick={() => {
              if (onDocumentDelete) {
                onDocumentDelete(item.id);
              }
            }}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-600 transition-opacity flex items-center justify-center ml-2"
          >
            <XMarkIcon className = "w-3 h-3"/>
          </button>
          
          <div className="flex-1 min-w-0 ml-6">
            <p className="text-sm font-medium text-gray-900 truncate ml-2">
              {item.name || item.filename}
              {item.uploading && (
                <span className="ml-4 text-xs text-blue-600">Subiendo...</span>
              )}
            </p>
            <p className="text-sm text-gray-500 truncate ml-2">
              {item.format || item.type} · {(item.size / 1024).toFixed(1)} KB
            </p>
          </div>
          
          {/* Minimal tag selector */}
          <div className="flex items-center pr-2">
            {Array.isArray(allowed_tags) && allowed_tags.length > 0 && (
              <select
                value={
                  Array.isArray(item.tags) && item.tags.length > 0
                    ? item.tags[0]
                    : ""
                }
                onChange={(e) => {
                  if (onTagChange) {
                    onTagChange(item.id, e.target.value);
                  }
                }}
                className="appearance-none bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:bg-gray-200"
              >
                <option value="">No tag</option>
                {allowed_tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
