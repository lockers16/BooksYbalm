/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Book } from './types';
import { StudentView } from './components/StudentView';
import { BookOpen } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load books dynamically from the backend static JSON file "behind the scenes"
  useEffect(() => {
    fetch('/books.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load books database (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setBooks(data);
          // Sync with local storage as secondary backup
          localStorage.setItem('school_books_custom_db', JSON.stringify(data));
        } else {
          throw new Error('הנתונים שהתקבלו מקובץ ה-JSON אינם תקינים');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading books database:', err);
        // Secondary fallback to localStorage if available
        const saved = localStorage.getItem('school_books_custom_db');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBooks(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse fallback books data:', e);
          }
        }
        setError('לא ניתן היה לטעון את רשומת הספרים. אנא ודאו שקובץ books.json קיים בשרת ומעודכן.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" dir="rtl">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Branding - Simple Book motif */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10 text-white">
              <BookOpen size={26} className="fill-blue-100 stroke-[2.5]" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight font-display">
                <span>ישיבת בנ"ע לפיד מודיעין</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium font-sans">רשימת ספרי לימוד לשנת הלימודים תשפ"ז</p>
            </div>
          </div>

          {/* Simple status indicating dynamic books load */}
          <div className="text-xs text-slate-450 flex items-center gap-1.5 font-medium">
            <span className={`inline-block size-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            <span>{loading ? 'טוען נתונים...' : error ? 'שגיאה בחיבור למאגר' : 'מחובר למאגר ספרים דינמי'}</span>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-sm font-medium text-slate-500">טוען את רשימת ספרי הלימוד המעודכנת...</p>
          </div>
        ) : error && books.length === 0 ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-8 text-center max-w-xl mx-auto space-y-3">
            <h3 className="font-bold text-red-800 dark:text-red-400">שגיאה בטעינת מסד הנתונים</h3>
            <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed font-semibold">{error}</p>
          </div>
        ) : (
          <StudentView books={books} />
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="mt-auto py-8 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-center text-slate-450 text-xs transition-colors print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-slate-500 dark:text-slate-400">© ישיבת בני עקיבא לפיד מודיעין, תשפ"ו - 2026</p>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 bg-emerald-500 rounded-full"></span>
            <span className="font-medium text-slate-400">המידע נטען דינמית מקובץ הגדרות מובנה</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
