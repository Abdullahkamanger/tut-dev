'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlogGrid from '../components/blog/BlogGrid';
import BlogFilters from '../components/blog/BlogFilters';
import { useBlogs } from '../context/BlogContext';
import { parseEditorJSContent } from '../lib/content-parser';



interface Blog {
  id: string | number;
  title: string;
  description: string;
  category: string;
  date: string;
  image: string;
  content?: string;
  likes: number;
  dislikes: number;
  saves: number;
}

const Home = () => {
  const { blogs, loading, error } = useBlogs() as {
    blogs: any[];
    loading: boolean;
    error: string | null;
  };
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map database blogs to BlogGrid format
  const mappedBlogs = blogs.map((blog) => ({
    id: blog._id || blog.id,
    title: blog.title,
    description: blog.description || parseEditorJSContent(blog.content),
    category: blog.category || 'General',
    date: new Date(blog.created_at).toLocaleDateString(),
    image: blog.cover_image || '/placeholder-image.jpg',
    content: blog.content,
    likes: blog.likes_count || 0,
    dislikes: blog.dislikes_count || 0,
    saves: blog.saves_count || 0,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
       <div className="flex-col gap-4 w-full flex items-center justify-center">
  <div
    className="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full"
  >
    <div
      className="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"
    ></div>
  </div>
</div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">Database Error</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter Logic
  const filteredBlogs = mappedBlogs.filter((blog) => {
    const matchesCategory =
      activeCategory === 'All' || blog.category === activeCategory;
    
    const query = searchQuery.toLowerCase();
    const title = (blog.title || "").toLowerCase();
    const description = (blog.description || "").toLowerCase();

    const matchesSearch =
      title.includes(query) ||
      description.includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6">
          The <span className="text-indigo-600 dark:text-indigo-400 font-serif italic">Curated</span> Blog.
        </h1>
      </motion.section>

      {/* Filters */}
      <BlogFilters
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Blog Grid with "Empty State" */}
      <section className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {filteredBlogs.length > 0 ? (
            <motion.div
              key={`${activeCategory}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BlogGrid blogs={filteredBlogs} searchQuery={searchQuery} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <h3 className="text-xl text-slate-400 dark:text-slate-500">
                No articles found matching your search.
              </h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Home;