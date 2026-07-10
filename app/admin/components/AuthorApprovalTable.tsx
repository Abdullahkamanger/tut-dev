'use client';

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface Author {
  id: string | number;
  name: string;
  email: string;
}

const AuthorApprovalTable = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [approvingId, setApprovingId] = useState<string | number | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/admin/pending-authors');
      setAuthors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string | number) => {
    setApprovingId(id);
    try {
      await axios.put(`/api/admin/approve-author/${id}`);
      await loadPending(); // Refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
        
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading pending authors...
      </div>
    );
  }

  if (authors.length === 0) {
    return <div className="p-20 text-center text-slate-500 font-medium">No pending authors awaiting approval.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Author Name</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {authors.map(author => (
            <tr key={author.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-800 dark:text-white capitalize">{author.name}</td>
              <td className="px-6 py-4 text-slate-500 text-sm font-medium">{author.email}</td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => handleApprove(author.id)}
                  disabled={approvingId === author.id}
                  className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600 inline-flex items-center gap-2"
                >
                  {approvingId === author.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve"
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuthorApprovalTable;