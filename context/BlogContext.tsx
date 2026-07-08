'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
//import { mockBlogs as initialData } from '../data/mockBlogs'; // Adjust path if needed
import { toast } from 'sonner';

const BlogContext = createContext<any>(null);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<any[]>([]);
  const [dislikedIds, setDislikedIds] = useState<any[]>([]);
  const [reactionLoading, setReactionLoading] = useState<Record<string | number, boolean>>({});

  // Auth State
  const [user, setUser] = useState<any>(null);

  // Sync session with user state
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      setUser(session.user);
    } else if (sessionStatus === 'unauthenticated') {
      setUser(null);
    }
  }, [session, sessionStatus]);

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Dark Mode Logic
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Fetch blogs from backend
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/blogs');
        const dbBlogs = res.data.map((b: any) => ({
          ...b,
          id: b._id, // Ensure id is mapped correctly from MongoDB _id
          // Normalize DB structure to match Mock structure
          image: b.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
          author: {
            id: b.author?.id || '',
            name: b.author?.name || b.author_name || 'Unknown Author',
            role: b.author?.role || 'Author',
            seed: b.author?.name || b.author_name || 'Author',
            description: b.author?.bio || null,
            social_links: b.author?.social_links || {},
          },
          date: new Date(b.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          likes: b.likes_count || 0,
          dislikes: b.dislikes_count || 0,
          saves: b.saves_count || 0
        }));
        
        // Merge real database data with mock data
        setBlogs([...dbBlogs]);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch blogs from database:', err);
        setError('Could not connect to the database. Please check your server and try again.');
       // setBlogs(initialData); // Use mock data as fallback in case of connection errors
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Fetch user interactions on login
  const fetchUserInteractions = async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const res = await axios.get('/api/user/interactions');
      const interactions = res.data;
      const liked = interactions.filter((i: any) => i.type === 'LIKE').map((i: any) => i.blog_id);
      const disliked = interactions.filter((i: any) => i.type === 'DISLIKE').map((i: any) => i.blog_id);
      const saved = interactions.filter((i: any) => i.type === 'SAVE').map((i: any) => i.blog_id);
      setLikedIds(liked);
      setSavedIds(saved);
      setDislikedIds(disliked);
    } catch (err) {
      console.error('Failed to fetch user interactions:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserInteractions();
    }
  }, [user]);

  const toggleLike = async (id: string | number) => {
    if (!user) {
      toast.error('Please login to like blogs');
      return;
    }

    const isCurrentlyLiked = likedIds.includes(id);

    // If it's a mock blog (numeric ID), only update local state
    if (typeof id === 'number') {
      const isCurrentlyDisliked = dislikedIds.includes(id);
      
      setLikedIds((prev) =>
        isCurrentlyLiked ? prev.filter((i) => i !== id) : [...prev, id],
      );
      
      if (!isCurrentlyLiked) {
        setDislikedIds((prev) => prev.filter((i) => i !== id));
      }

      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id) {
            return {
              ...blog,
              likes: isCurrentlyLiked ? (blog.likes || 0) - 1 : (blog.likes || 0) + 1,
              dislikes: (!isCurrentlyLiked && isCurrentlyDisliked) ? (blog.dislikes || 0) - 1 : blog.dislikes,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlyLiked ? 'Unliked!' : 'Liked!');
      return;
    }

    setReactionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.post(`/api/blogs/${id}/like`, {});

      setLikedIds((prev) =>
        isCurrentlyLiked ? prev.filter((i) => i !== id) : [...prev, id],
      );
      
      // If we are liking, ensure dislike is removed from UI
      if (!isCurrentlyLiked) {
        setDislikedIds((prev) => prev.filter((i) => i !== id));
      }

      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id || blog._id === id) {
            return {
              ...blog,
              likes: res.data.likes_count,
              dislikes: res.data.dislikes_count ?? blog.dislikes,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlyLiked ? 'Unliked!' : 'Liked!');
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('Failed to update like status');
    } finally {
      setReactionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleDislike = async (id: string | number) => {
    if (!user) {
      toast.error('Please login to dislike blogs');
      return;
    }

    const isCurrentlyDisliked = dislikedIds.includes(id);

    // If it's a mock blog (numeric ID), only update local state
    if (typeof id === 'number') {
      const isCurrentlyLiked = likedIds.includes(id);

      setDislikedIds((prev) =>
        isCurrentlyDisliked ? prev.filter((i) => i !== id) : [...prev, id],
      );

      if (!isCurrentlyDisliked) {
        setLikedIds((prev) => prev.filter((i) => i !== id));
      }

      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id) {
            return {
              ...blog,
              dislikes: isCurrentlyDisliked ? (blog.dislikes || 0) - 1 : (blog.dislikes || 0) + 1,
              likes: (!isCurrentlyDisliked && isCurrentlyLiked) ? (blog.likes || 0) - 1 : blog.likes,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlyDisliked ? 'Removed dislike' : 'Disliked!');
      return;
    }

    setReactionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.post(`/api/blogs/${id}/dislike`, {});

      setDislikedIds((prev) =>
        isCurrentlyDisliked ? prev.filter((i) => i !== id) : [...prev, id],
      );

      // If we are disliking, ensure like is removed from UI
      if (!isCurrentlyDisliked) {
        setLikedIds((prev) => prev.filter((i) => i !== id));
      }

      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id || blog._id === id) {
            return {
              ...blog,
              dislikes: res.data.dislikes_count,
              likes: res.data.likes_count ?? blog.likes,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlyDisliked ? 'Removed dislike' : 'Disliked!');
    } catch (err) {
      console.error('Failed to toggle dislike:', err);
      toast.error('Failed to update dislike status');
    } finally {
      setReactionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleSave = async (id: string | number) => {
    if (!user) {
      toast.error('Please login to save blogs');
      return;
    }

    const isCurrentlySaved = savedIds.includes(id);

    // If it's a mock blog (numeric ID), only update local state
    if (typeof id === 'number') {
      setSavedIds((prev) =>
        isCurrentlySaved ? prev.filter((i) => i !== id) : [...prev, id],
      );
      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id) {
            return {
              ...blog,
              saves: isCurrentlySaved ? (blog.saves || 0) - 1 : (blog.saves || 0) + 1,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlySaved ? 'Removed from saved' : 'Saved to library!');
      return;
    }

    setReactionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.post(`/api/blogs/${id}/save`, {});

      setSavedIds((prev) =>
        isCurrentlySaved ? prev.filter((i) => i !== id) : [...prev, id],
      );

      setBlogs((currentBlogs) =>
        currentBlogs.map((blog) => {
          if (blog.id === id || blog._id === id) {
            return {
              ...blog,
              saves: res.data.saves_count,
            };
          }
          return blog;
        }),
      );
      toast.success(isCurrentlySaved ? 'Removed from saved' : 'Saved to library!');
    } catch (err) {
      console.error('Failed to toggle save:', err);
      toast.error('Failed to update save status');
    } finally {
      setReactionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <BlogContext.Provider
      value={{
        likedIds,
        savedIds,
        dislikedIds,
        darkMode,
        toggleDarkMode,
        toggleLike,
        toggleSave,
        toggleDislike,
        reactionLoading,
        blogs,
        loading,
        error,
        user,
        logout,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlogs = () => {
  const context = useContext(BlogContext);
  
  if (!context) {
    throw new Error('useBlogs must be used within a BlogProvider');
  }
  
  return context;
};