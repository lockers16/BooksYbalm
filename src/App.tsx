/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Book } from './types';
import { StudentView } from './components/StudentView';
import { BookOpen } from 'lucide-react';

function migrateBooks(books: Book[]): Book[] {
  return books.map(book => {
    let hasChanged = false;

    // 1. Migrate associations
    let updatedAssociations = book.associations;
    if (book.associations && book.associations.length > 0) {
      updatedAssociations = book.associations.map(assoc => {
        let assocChanged = false;
        let newStream = assoc.stream;
        if (['י"א', 'י"ב'].includes(assoc.grade) && assoc.subjectType === 'אנגלית' && assoc.stream === '3-4 יח"ל') {
          assocChanged = true;
          newStream = '3 יח"ל';
        }
        if (['י"א', 'י"ב'].includes(assoc.grade) && assoc.subjectType === 'מתמטיקה' && assoc.stream === 'אין') {
          assocChanged = true;
          newStream = 'סיים';
        }
        if (assocChanged) {
          hasChanged = true;
          return { ...assoc, stream: newStream };
        }
        return assoc;
      });
    }

    // 2. Migrate legacy english array
    let updatedEnglish = book.english;
    if (book.english && book.english.includes('3-4 יח"ל') && (book.grades.includes('י"א') || book.grades.includes('י"ב'))) {
      hasChanged = true;
      if (book.grades.includes('י')) {
        if (!book.english.includes('3 יח"ל')) {
          updatedEnglish = [...book.english, '3 יח"ל'];
        }
      } else {
        updatedEnglish = book.english.map(opt => opt === '3-4 יח"ל' ? '3 יח"ל' : opt);
      }
    }

    // 3. Migrate legacy math array
    let updatedMath = book.math;
    if (book.math && book.math.includes('אין') && (book.grades.includes('י"א') || book.grades.includes('י"ב'))) {
      hasChanged = true;
      updatedMath = book.math.map(opt => opt === 'אין' ? 'סיים' : opt);
    }

    if (hasChanged) {
      return {
        ...book,
        associations: updatedAssociations,
        english: updatedEnglish,
        math: updatedMath,
      };
    }
    return book;
  });
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [dbStatus, setDbStatus] = useState<'success' | 'fallback' | 'error' | 'loading'>('loading');

  // Load books state dynamically from /books.json or localStorage fallback
  useEffect(() => {
    async function loadBooks() {
      try {
        const response = await fetch('/books.json');
        if (!response.ok) {
          throw new Error('Failed to fetch /books.json');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          const migrated = migrateBooks(data);
          setBooks(migrated);
          setDbStatus('success');
          // Update offline fallback cache
          localStorage.setItem('school_books_custom_db', JSON.stringify(migrated));
          return;
        } else {
          throw new Error('Invalid database format inside books.json');
        }
      } catch (err) {
        console.warn('Unable to load dynamic database, checking offline fallback...', err);
        const saved = localStorage.getItem('school_books_custom_db');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setBooks(migrateBooks(parsed));
              setDbStatus('fallback');
              return;
            }
          } catch (storageErr) {
            console.error('Failed to parse cached database from localStorage', storageErr);
          }
        }
        setDbStatus('error');
      }
    }

    loadBooks();
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

          {/* Dynamic database status indicator */}
          <div className="flex items-center gap-2">
            {dbStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>מחובר למאגר ספרים דינמי</span>
              </div>
            )}
            {dbStatus === 'fallback' && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>חיבור מקומי (אופליין)</span>
              </div>
            )}
            {dbStatus === 'loading' && (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                <span>מתחבר למאגר...</span>
              </div>
            )}
            {dbStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                <span>שגיאה - לא מחובר למאגר הספרים</span>
              </div>
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
