"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
export default function SavedTextsPage() {
  const { user, loadingAuth } = useAuth();
  const [savedTexts, setSavedTexts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null means "All"
  const [newCategoryName, setNewCategoryName] = useState("");

  // Which text is currently having its category changed?
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    if (user) {
      Promise.all([
        fetch("https://belgium-expat-ai-backend.onrender.com/api/categories", {
          credentials: "include",
        }).then((res) => res.json()),
        fetch("https://belgium-expat-ai-backend.onrender.com/api/saved-texts", {
          credentials: "include",
        }).then((res) => res.json()),
      ])
        .then(([catsData, textsData]) => {
          setCategories(catsData);
          setSavedTexts(textsData);
        })
        .finally(() => setLoadingData(false));
    } else if (!loadingAuth) {
      setLoadingData(false);
    }
  }, [user, loadingAuth]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/categories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategoryName.trim() }),
          credentials: "include",
        },
      );
      const newCat = await res.json();
      setCategories([...categories, newCat]);
      setNewCategoryName("");
    } catch (error) {
      console.error("Failed to create category");
    }
  };

  const handleAssignCategory = async (textId: string) => {
    const categoryToAssign =
      selectedCategoryId === "" ? null : selectedCategoryId;

    try {
      const res = await fetch(
        `https://belgium-expat-ai-backend.onrender.com/api/saved-texts/${textId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: categoryToAssign }),
          credentials: "include",
        },
      );

      if (res.ok) {
        // Find the category name to update the UI instantly
        const catName = categoryToAssign
          ? categories.find((c) => c.id === categoryToAssign)?.name
          : null;
        setSavedTexts((prev) =>
          prev.map((text) =>
            text.id === textId
              ? {
                  ...text,
                  category_id: categoryToAssign,
                  category_name: catName,
                }
              : text,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to assign category");
    } finally {
      setEditingId(null);
    }
  };

  if (loadingData)
    return (
      <div className="text-center mt-20 text-gray-500 font-medium">
        Loading your notebook...
      </div>
    );
  if (!user)
    return (
      <div className="text-center mt-20 font-bold text-xl text-gray-900">
        Please log in to view your notebook.
      </div>
    );

  const filteredTexts =
    activeFilter === null
      ? savedTexts
      : savedTexts.filter((t) => t.category_id === activeFilter);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* HEADER & CATEGORY CREATOR */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            My Expat Notebook
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Your personal collection of important rules.
          </p>
        </div>

        {/* Create Category Form */}
        <form
          onSubmit={handleCreateCategory}
          className="flex bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
        >
          <input
            type="text"
            placeholder="New Category Name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="px-4 py-2 outline-none w-48 text-sm"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 transition"
          >
            + Add
          </button>
        </form>
      </div>

      {/* FILTER BAR */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-6">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
              activeFilter === null
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Saved
          </button>

          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                activeFilter === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* SAVED TEXTS GRID */}
      {savedTexts.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Your notebook is empty!
          </h3>
          <p className="text-gray-500">
            Go to the AI Chat and save some important texts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTexts.map((text) => (
            <div
              key={text.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition"
            >
              {/* CATEGORY DROPDOWN SELECTOR */}
              <div className="mb-4 min-h-[32px]">
                {editingId === text.id ? (
                  <div className="flex space-x-2">
                    <select
                      className="text-xs font-bold px-2 py-1.5 rounded-lg border border-blue-300 outline-none w-full bg-white"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                      <option value="">-- No Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignCategory(text.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(text.id);
                      setSelectedCategoryId(text.category_id || "");
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide transition-colors ${
                      text.category_id
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "bg-gray-100 text-gray-500 border border-dashed border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {text.category_name
                      ? text.category_name
                      : "+ Assign Category"}
                  </button>
                )}
              </div>

              <p className="text-gray-800 font-medium leading-relaxed flex-1">
                "{text.content}"
              </p>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 font-medium">
                Saved on {new Date(text.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
