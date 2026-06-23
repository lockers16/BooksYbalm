/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DEFAULT_BOOKS } from './data';
import { Book } from './types';
import { StudentView } from './components/StudentView';
import { BookOpen } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [fetchStatus, setFetchStatus] = useState<'loading' | 'success' | 'fallback' | 'error'>('loading');

  // Hydrate book database dynamically from /books.json with localStorage fallback
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/books.json');
        if (!response.ok) {
          throw new Error(`Failed to load books.json: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setBooks(data);
          setFetchStatus('success');
          // Cache the latest copy offline
          localStorage.setItem('school_books_custom_db', JSON.stringify(data));
          return;
        }
        throw new Error('Loaded JSON is not an array');
      } catch (err) {
        console.warn('Could not load books.json, using offline localStorage fallback:', err);
        const saved = localStorage.getItem('school_books_custom_db');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBooks(parsed);
              setFetchStatus('fallback');
              return;
            }
          } catch (e) {
            console.error('Failed to parse offline backup database:', e);
          }
        }
        // Fallback to local import list
        setBooks(DEFAULT_BOOKS);
        setFetchStatus('error');
      }
    };

    fetchBooks();
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

          {/* Subtle status indicator showing whether the database loaded successfully from /books.json */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-1.75 rounded-lg border border-slate-200/60 dark:border-slate-800/80 text-xs">
            {fetchStatus === 'loading' && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-slate-500 dark:text-slate-455 font-semibold font-sans">טוען מאגר ספרים...</span>
              </>
            )}
            {fetchStatus === 'success' && (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-350 font-semibold font-sans">מחובר למאגר ספרים דינמי</span>
              </>
            )}
            {fetchStatus === 'fallback' && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-slate-600 dark:text-slate-350 font-semibold font-sans">נטען מהזיכרון המקומי (לא מקוון)</span>
              </>
            )}
            {fetchStatus === 'error' && (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 dark:text-slate-350 font-semibold font-sans">שגיאה בטעינת המאגר</span>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <StudentView books={books} />
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

