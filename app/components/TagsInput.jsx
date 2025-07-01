import { useState } from "react";

export default function TagsInput({
  tags = [],
  onChange,
  placeholder = "Add tags...",
}) {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();

      // Evitar duplicados
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue("");
    }
  };

  const handleTagDoubleClick = (index) => {
    setEditingIndex(index);
    setEditingValue(tags[index]);
  };

  const handleEditKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = editingValue.trim().toLowerCase();

      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags];
        newTags[index] = newTag;
        onChange(newTags);
      }
      setEditingIndex(null);
      setEditingValue("");
    }

    if (e.key === "Escape") {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const handleTagDelete = (indexToDelete) => {
    const newTags = tags.filter((_, index) => index !== indexToDelete);
    onChange(newTags);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded bg-gray-50 min-h-[2.5rem] items-center focus-within:outline-none focus-within:ring-1 focus-within:ring-gray-200">
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center">
            {editingIndex === index ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, index)}
                onBlur={() => setEditingIndex(null)}
                autoFocus
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-200"
              />
            ) : (
              <span
                onDoubleClick={() => handleTagDoubleClick(index)}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors"
              >
                {tag}
                <button
                  onClick={() => handleTagDelete(index)}
                  className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm placeholder-gray-400"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Press Enter to add tags, double-click to edit
      </p>
    </div>
  );
}
