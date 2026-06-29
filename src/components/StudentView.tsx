/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, GradeLevel, SelectionState } from '../types';
import { filterBooks, getEnglishOptions, getMathOptions, isMajorRequired, MAJOR_OPTIONS } from '../data';
import { MetricCard } from './MetricCard';
import { BookOpen, DollarSign, Download, Printer, CheckCircle, Info, RefreshCw, FileText } from 'lucide-react';

interface StudentViewProps {
  books: Book[];
}

function getBookType(book: Book): 'ספר לימוד / קריאה' | 'חוברת עבודה' | 'לא בהשאלת הספרים' {
  if (book.bookType) return book.bookType;
  const title = book.title.toLowerCase();
  
  if (
    title.includes('לא בהשאלה') ||
    title.includes('לא בהשאלת הספרים')
  ) {
    return 'לא בהשאלת הספרים';
  }

  if (
    title.includes('workbook') ||
    title.includes('practice') ||
    title.includes('חוברת') ||
    title.includes('עבודה') ||
    title.includes('תרגול') ||
    title.includes('מעבדות')
  ) {
    return 'חוברת עבודה';
  }
  return 'ספר לימוד / קריאה';
}

function formatGroupLetter(group: string): string {
  if (group === 'א') return "א'";
  if (group === 'ב') return "ב'";
  if (group === 'ג') return "ג'";
  return group;
}

function formatClassName(grade: string, num: number): string {
  if (!grade) return '';
  if (grade === 'י"א') {
    return `י"א${num}`;
  }
  if (grade === 'י"ב') {
    return `י"ב${num}`;
  }
  return `${grade}'${num}`;
}

function getSubjectSortIndex(subjectKey: string): number {
  const fullOrder = [
    'גמרא',
    'תושב"ע',
    'משנה',
    'הלכה',
    'תנ"ך',
    'מחשבת ישראל',
    'ספרות',
    'לשון',
    'אזרחות',
    'גיאוגרפיה',
    'היסטוריה',
    'מדעים',
    'עתודה',
    'מתמטיקה',
    'אנגלית',
    'מגמות',
    'מדעי המחשב',
    'פיזיקה',
    'ביולוגיה',
    'ניהול עסקי',
    'משפטים',
    'מוזיקה',
    'תקשורת',
    'ערבית',
    'אלקטרוניקה',
    'כימיה'
  ];

  const index = fullOrder.findIndex(subj => {
    return subjectKey === subj || subjectKey.startsWith(subj) || subjectKey.includes(subj);
  });

  return index !== -1 ? index : 999;
}

const GRADE_CLASS_NOTICES: Record<string, string[]> = {
  'ז': [
    "ז'1 - ז'3, ז'7 – תלמוד",
    "ז'4 – ז'5 - צורבא",
    "ז'6 – חינוך מיוחד / תקשורת"
  ],
  'ח': [
    "ח'1 – ח'3, ח'7 – תלמוד",
    "ח'4 – ח'5 - צורבא",
    "ח'6 – חינוך מיוחד"
  ],
  'ט': [
    "ט'1 – ט'5: תלמוד",
    "ט'6 – תקשורת"
  ],
  'י': [
    "י'1 - תושב\"ע",
    "י'2 – י'5, י'7 – תלמוד / צורבא",
    "י'6 – חינוך מיוחד"
  ],
  'י"א': [
    "י\"א1 – תושב\"ע",
    "י\"א2 – י\"א5 - תלמוד / צורבא",
    "י\"א6 – חינוך מיוחד"
  ],
  'י"ב': [
    "י\"ב1 – תושב\"ע",
    "י\"ב2 – י\"ב5 – תלמוד / צורבא",
    "י\"ב6 – תקשורת"
  ]
};

export function StudentView({ books }: StudentViewProps) {
  // Selection workflow state
  const [selection, setSelection] = useState<SelectionState>({
    grade: '',
    classNumber: '',
    englishGroup: '',
    mathGroup: '',
    majors: ['אין'],
    atudaProgram: '',
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [highlightedBook, setHighlightedBook] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Check if current setup skips Major
  const needsMajor = isMajorRequired(selection.grade);
  const needsAtuda = ['ז', 'ח'].includes(selection.grade);

  // Restart questionnaire
  const handleReset = () => {
    setSelection({
      grade: '',
      classNumber: '',
      englishGroup: '',
      mathGroup: '',
      majors: ['אין'],
      atudaProgram: '',
    });
    setIsSubmitted(false);
  };

  // Determine current active question level
  const isGradeChosen = selection.grade !== '';
  const isClassChosen = isGradeChosen && selection.classNumber !== '';
  const isEnglishChosen = isClassChosen && selection.englishGroup !== '';
  const isMathChosen = isEnglishChosen && selection.mathGroup !== '';
  const isAtudaChosen = !needsAtuda || (selection.atudaProgram === 'כן' || selection.atudaProgram === 'לא');
  const isMajorChosen = isMathChosen && isAtudaChosen && (!needsMajor || (needsMajor && selection.majors && selection.majors.length > 0));

  // Handler for changes
  const handleGradeChange = (gradeVal: GradeLevel) => {
    setSelection(prev => ({
      ...prev,
      grade: gradeVal,
      // Clear downstream
      classNumber: '',
      englishGroup: '',
      mathGroup: '',
      majors: ['אין'],
      atudaProgram: '',
    }));
    setIsSubmitted(false);
  };

  const handleClassChange = (classNum: number) => {
    setSelection(prev => ({
      ...prev,
      classNumber: classNum,
    }));
    setIsSubmitted(false);
  };

  const handleEnglishChange = (group: string) => {
    setSelection(prev => ({
      ...prev,
      englishGroup: group,
    }));
    setIsSubmitted(false);
  };

  const handleMathChange = (group: string) => {
    setSelection(prev => ({
      ...prev,
      mathGroup: group,
    }));
    setIsSubmitted(false);
  };

  const handleAtudaChange = (val: 'כן' | 'לא') => {
    setSelection(prev => ({
      ...prev,
      atudaProgram: val,
    }));
    setIsSubmitted(false);
  };

  const handleMajorToggle = (majorVal: string) => {
    setSelection(prev => {
      const current = prev.majors || [];
      if (majorVal === 'אין') {
        return {
          ...prev,
          majors: ['אין']
        };
      }
      
      let nextMajors = current.filter(m => m !== 'אין');
      
      if (nextMajors.includes(majorVal)) {
        nextMajors = nextMajors.filter(m => m !== majorVal);
      } else {
        nextMajors.push(majorVal);
      }
      
      if (nextMajors.length > 2) {
        nextMajors = nextMajors.slice(-2); // Keep max 2
      }

      if (nextMajors.length === 0) {
        nextMajors = ['אין'];
      }
      
      return {
        ...prev,
        majors: nextMajors
      };
    });
    setIsSubmitted(false);
  };

  // Process and filter books list
  const filteredBooks = isSubmitted ? filterBooks(books, selection) : [];

  // Submit and scroll to results
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  useEffect(() => {
    if (isSubmitted && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isSubmitted]);

  // Statistics
  const totalBooksCount = filteredBooks.length;
  const mandatoryCount = filteredBooks.filter(b => b.isMandatory).length;
  const optionalCount = totalBooksCount - mandatoryCount;

  const [printError, setPrintError] = useState<boolean>(false);

  // Helper inside the component to render identical PDF layout
  const generateDocumentHtml = (isWord = false) => {
    const activeClassName = formatClassName(selection.grade, selection.classNumber as number);
    const selectedMajorsText = selection.majors ? selection.majors.join(', ') : '';

    const tableHeader = `
      <div style="background-color: #2563eb; color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: right; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; font-family: 'Assistant', sans-serif;">ישיבת בנ"ע לפיד מודיעין</h1>
        <h2 style="margin: 5px 0 0 0; font-size: 15px; opacity: 0.95; font-family: 'Assistant', sans-serif;">רשימת ספרי לימוד לשנת הלימודים תשפ"ז (2026-2027)</h2>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin-bottom: 25px; direction: rtl; text-align: right; font-family: 'Assistant', sans-serif; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <p style="margin: 4px 0;"><strong>פרטי שיוך וכיתה:</strong> כיתה ${activeClassName}</p>
        <p style="margin: 4px 0;"><strong>הקבצה באנגלית:</strong> ${formatGroupLetter(selection.englishGroup)}</p>
        <p style="margin: 4px 0;"><strong>הקבצה במתמטיקה:</strong> ${formatGroupLetter(selection.mathGroup)}</p>
        ${needsAtuda && selection.atudaProgram ? `<p style="margin: 4px 0;"><strong>עתודה מדעית טכנולוגית:</strong> ${selection.atudaProgram}</p>` : ''}
        ${needsMajor && selection.majors && !selection.majors.includes('אין') ? `<p style="margin: 4px 0;"><strong>מגמות נבחרות:</strong> ${selectedMajorsText}</p>` : ''}
      </div>
    `;

    const booksBySubject: Record<string, Book[]> = {};
    filteredBooks.forEach(book => {
      let sub = book.subject;
      if (sub === 'מתמטיקה' && selection.mathGroup) {
        sub = `מתמטיקה (${formatGroupLetter(selection.mathGroup)})`;
      } else if (sub === 'אנגלית' && selection.englishGroup) {
        sub = `אנגלית (${formatGroupLetter(selection.englishGroup)})`;
      }
      if (!booksBySubject[sub]) {
        booksBySubject[sub] = [];
      }
      booksBySubject[sub].push(book);
    });

    const hasAnyNotes = filteredBooks.some(b => b.notes && b.notes.trim() !== '');

    let tableBodyHtml = '';
    Object.keys(booksBySubject).sort((a, b) => getSubjectSortIndex(a) - getSubjectSortIndex(b)).forEach(subject => {
      tableBodyHtml += `
        <tr style="background-color: #eff6ff; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <td colspan="${hasAnyNotes ? 3 : 2}" style="padding: 12px; border: 1px solid #cbd5e1; text-align: right; direction: rtl; font-size: 14px; font-weight: bold; color: #1e40af; font-family: 'Assistant', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            ${subject}
          </td>
        </tr>
      `;
      const sortedSubjectBooks = [...booksBySubject[subject]].sort((b1, b2) => {
        const ord1 = b1.order !== undefined ? b1.order : 1000;
        const ord2 = b2.order !== undefined ? b2.order : 1000;
        if (ord1 !== ord2) return ord1 - ord2;
        return b1.title.localeCompare(b2.title);
      });
      sortedSubjectBooks.forEach((book, idx) => {
        const bType = getBookType(book);
        let typeStyle = 'color: #475569;';
        if (bType === 'חוברת עבודה') {
          typeStyle = 'color: #1d4ed8; font-weight: bold; background-color: #eff6ff;';
        } else if (bType === 'לא בהשאלת הספרים') {
          typeStyle = 'color: #991b1b; font-weight: bold; background-color: #fef2f2;';
        }
        tableBodyHtml += `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: right; direction: rtl; font-weight: bold; font-family: 'Assistant', sans-serif; font-size: 13px;">${book.title}</td>
            <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Assistant', sans-serif; font-size: 12px; ${typeStyle}">${bType}</td>
            ${hasAnyNotes ? `<td style="padding: 12px; border: 1px solid #cbd5e1; text-align: right; direction: rtl; font-size: 12px; color: #475569; font-family: 'Assistant', sans-serif;">${book.notes || ''}</td>` : ''}
          </tr>
        `;
      });
    });

    const docAttrs = 'dir="rtl"';
    const docType = '<!DOCTYPE html>';

    return `
      ${docType}
      <html ${docAttrs}>
      <head>
        <meta charset="utf-8">
        <title>רשימת ספרי לימוד - ישיבת לפיד מודיעין</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap');
          * { font-family: 'Assistant', sans-serif !important; box-sizing: border-box; }
          body { font-family: 'Assistant', sans-serif; direction: rtl; text-align: right; padding: 30px; margin: 0; background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #2563eb; color: white; padding: 14px; font-weight: bold; border: 1px solid #cbd5e1; text-align: center; font-family: 'Assistant', sans-serif; font-size: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          td { border: 1px solid #cbd5e1; padding: 12px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${tableHeader}
        <table>
          <thead>
            <tr>
              <th style="width: 60%; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">שם הספר</th>
              <th style="width: 20%; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">סוג הספר</th>
              ${hasAnyNotes ? '<th style="width: 20%; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">הערות</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${tableBodyHtml}
          </tbody>
        </table>
        <p style="margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; font-family: 'Assistant', sans-serif;">
          הופק אוטומטית עבור ישיבת בני עקיבא לפיד מודיעין. המשך קיץ נעים ושנת לימודים מוצלחת!
        </p>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Printable action
  const handlePrint = () => {
    try {
      const htmlContent = generateDocumentHtml(false);
      
      // Attempt opening print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        // Fallback using high reliability hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
          
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1500);
          }, 500);
        } else {
          window.print();
        }
      }
    } catch (e) {
      console.error('Print failed or was blocked', e);
      setPrintError(true);
      setTimeout(() => setPrintError(false), 8000);
    }
  };

  return (
    <div className="space-y-8 print:p-0" dir="rtl">
      {/* Selection Panel Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-250 dark:border-slate-800 shadow-sm p-6 lg:p-8 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-blue-600"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 text-right">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              התאמת רשימת ספרי הלימוד לשנת הלימודים הבאה (תשפ"ז)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-3xl leading-relaxed">
              בחרו שכבה, מספר כיתה, הקבצות ומגמות כדי לקבל את רשימת הספרים המלאה לשנת הלימודים הבאה
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 self-end md:self-auto cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>איפוס בחירות</span>
          </button>
        </div>
      </div>

      {/* Main split work-area */}
      <div className="flex flex-col lg:flex-row-reverse gap-8 items-start">
        {/* Right side: Sidebar Picker Form */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-5 shrink-0 lg:sticky lg:top-20 shadow-sm print:hidden">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">בניית רשימה אישית</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">אנא מלאו את כל הפרטים כדי להפיק את הרשימה</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Question 1: Grade Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block">
                1. בחירת שכבה
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ז', 'ח', 'ט', 'י', 'י"א', 'י"ב'] as GradeLevel[]).map(gradeLevel => {
                  const isSelected = selection.grade === gradeLevel;
                  return (
                    <button
                      key={gradeLevel}
                      type="button"
                      onClick={() => handleGradeChange(gradeLevel)}
                      className={`py-2 px-1 text-sm font-bold rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-350 hover:border-slate-300'
                      }`}
                    >
                      {gradeLevel === 'י"א' || gradeLevel === 'י"ב' ? `שכבה ${gradeLevel}` : `שכבה ${gradeLevel}'`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Class Selection */}
            <AnimatePresence>
              {isGradeChosen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Dynamic Class Notice Box */}
                  {selection.grade && GRADE_CLASS_NOTICES[selection.grade] && (
                    <div className="bg-blue-500/[0.04] dark:bg-blue-500/[0.02] border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 text-[12px] text-blue-900 dark:text-blue-300 leading-relaxed text-right space-y-2 font-display">
                      <div className="font-bold flex items-center gap-1.5 mb-1.5 text-blue-800 dark:text-blue-250">
                        <Info size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>שימו לב לסוגי הכיתות:</span>
                      </div>
                      <div className="space-y-1.5 pr-2">
                        {GRADE_CLASS_NOTICES[selection.grade].map((line, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="inline-block size-1 bg-blue-400 dark:bg-blue-600 rounded-full shrink-0"></span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block">
                    2. בחירת כיתה
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ז', 'ח', 'י'].includes(selection.grade) ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6]).map(num => {
                      const isSelected = selection.classNumber === num;
                      const displayLabel = formatClassName(selection.grade as string, num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleClassChange(num)}
                          className={`py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-350 hover:border-slate-300'
                          }`}
                        >
                          {displayLabel}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Question 3: English stream Selection */}
            <AnimatePresence>
              {isClassChosen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block">
                    3. הקבצה באנגלית
                  </label>
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {getEnglishOptions(selection.grade).map(group => {
                      const isSelected = selection.englishGroup === group;
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => handleEnglishChange(group)}
                          className={`w-full py-2 px-3 text-right text-xs rounded transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-150/40 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{group}</span>
                          {isSelected && <span className="size-1.5 bg-white rounded-full"></span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Question 4: Math stream Selection */}
            <AnimatePresence>
              {isEnglishChosen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block">
                    4. הקבצה במתמטיקה
                  </label>
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {getMathOptions(selection.grade).map(group => {
                      const isSelected = selection.mathGroup === group;
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => handleMathChange(group)}
                          className={`w-full py-2 px-3 text-right text-xs rounded transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-150/40 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{group}</span>
                          {isSelected && <span className="size-1.5 bg-white rounded-full"></span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question 5: Atuda Program Selection (Only for ז, ח, ט) */}
            <AnimatePresence>
              {isMathChosen && needsAtuda && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block leading-relaxed">
                    5. האם התלמיד משתתף בתוכנית "עתודה מדעית טכנולוגית"?
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {(['כן', 'לא'] as const).map(option => {
                      const isSelected = selection.atudaProgram === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAtudaChange(option)}
                          className={`py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-350 hover:border-slate-300'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question 5 or 6: Major Selection */}
            <AnimatePresence>
              {isAtudaChosen && isMathChosen && needsMajor && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-baseline">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 block">
                      {needsAtuda ? '6. בחירת מגמות' : '5. בחירת מגמות'}
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold dark:text-blue-400">ניתן לבחור עד 2 מגמות</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MAJOR_OPTIONS.map(majorVal => {
                      const isSelected = selection.majors?.includes(majorVal);
                      return (
                        <button
                          key={majorVal}
                          type="button"
                          onClick={() => handleMajorToggle(majorVal)}
                          className={`py-2 px-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-350 hover:border-slate-300'
                          }`}
                        >
                          {majorVal}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action Button */}
            <AnimatePresence>
              {isMajorChosen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="pt-2"
                >
                  <button
                    type="submit"
                    id="submit-form-button"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-lg shadow-lg shadow-blue-200 dark:shadow-none text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>הצגת רשימת ספרים</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </aside>

        {/* Left side: Results Content Area */}
        <section ref={resultsRef} className="flex-1 w-full space-y-6">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="placeholder-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm"
              >
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/30">
                  <BookOpen size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">מחכה להזנת פרטי שיבוץ כיתתי</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    בחרו שכבה, מספר כיתה, הקבצות ומגמות כדי לקבל את רשימת הספרים המלאה לשנת הלימודים הבאה. לאחר מכן לחצו על "הצגת רשימת ספרים".
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Decorative print-only paper header */}
                <div className="hidden print:block text-right border-b-2 border-blue-600 pb-5 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h1 className="text-2xl font-bold text-blue-600">ישיבת בנ"ע לפיד מודיעין</h1>
                      <p className="text-xs text-slate-500 mt-1">רשימת ספרי לימוד לשנת הלימודים תשפ"ז (2026-2027)</p>
                    </div>
                  </div>
                </div>

                {/* Selection Summary Banner */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-1.5 text-right w-full md:w-auto">
                    <div className="flex gap-2 items-center">
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        רשימת ספרים - כיתה {formatClassName(selection.grade, selection.classNumber as number)}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      הקבצה במתמטיקה: <strong>{formatGroupLetter(selection.mathGroup)}</strong> | הקבצה באנגלית: <strong>{formatGroupLetter(selection.englishGroup)}</strong>
                      {needsAtuda && selection.atudaProgram && (
                        <>
                          {' | עתודה מדעית: '}
                          <strong>{selection.atudaProgram}</strong>
                        </>
                      )}
                      {needsMajor && selection.majors && !selection.majors.includes('אין') && (
                        <>
                          {' | מגמות: '}
                          <strong>{selection.majors.join(', ')}</strong>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end print:hidden">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      <Printer size={14} />
                      <span>הדפסה / שמירה כ-PDF</span>
                    </button>
                  </div>
                </div>

                {/* Actual Table Display */}
                <div
                  id="booklist-table-container"
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative"
                >
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center print:border-b">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">פירוט ספרי הלימוד שהותאמו עבורך</h3>
                    <span className="text-[11px] text-slate-500 font-sans print:hidden font-semibold text-xs">נמצאו {totalBooksCount} ספרים מתאימים</span>
                  </div>

                  {totalBooksCount > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <th className="px-6 py-4 w-[60%] text-center">שם הספר</th>
                            <th className="px-4 py-4 w-[20%] text-center">סוג הספר</th>
                            {(() => {
                              const hasAnyNotes = filteredBooks.some(b => b.notes && b.notes.trim() !== '');
                              return hasAnyNotes ? (
                                <th className="px-6 py-4 w-[20%] text-center print:hidden">הערות</th>
                              ) : null;
                            })()}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {(() => {
                             const booksBySubject: Record<string, Book[]> = {};
                             filteredBooks.forEach(book => {
                               let sub = book.subject;
                               if (sub === 'מתמטיקה' && selection.mathGroup) {
                                 sub = `מתמטיקה (${formatGroupLetter(selection.mathGroup)})`;
                               } else if (sub === 'אנגלית' && selection.englishGroup) {
                                 sub = `אנגלית (${formatGroupLetter(selection.englishGroup)})`;
                               }
                               if (!booksBySubject[sub]) {
                                 booksBySubject[sub] = [];
                               }
                               booksBySubject[sub].push(book);
                             });
                             const hasAnyNotes = filteredBooks.some(b => b.notes && b.notes.trim() !== '');

                             return Object.keys(booksBySubject).sort((a, b) => getSubjectSortIndex(a) - getSubjectSortIndex(b)).map(subject => {
                               const sortedSubjectBooks = [...booksBySubject[subject]].sort((b1, b2) => {
                                 const ord1 = b1.order !== undefined ? b1.order : 1000;
                                 const ord2 = b2.order !== undefined ? b2.order : 1000;
                                 if (ord1 !== ord2) return ord1 - ord2;
                                 return b1.title.localeCompare(b2.title);
                               });
                               
                               return (
                                 <React.Fragment key={subject}>
                                   {/* Subject Category Row - Aligned to right */}
                                   <tr className="bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-750">
                                     <td
                                       colSpan={hasAnyNotes ? 3 : 2}
                                       className="px-6 py-2.5 text-right text-xs font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/5"
                                     >
                                       {subject}
                                     </td>
                                   </tr>
                                   {sortedSubjectBooks.map((book) => {
                                     const isHighlighted = highlightedBook === book.id;
                                     const bType = getBookType(book);
                                     
                                     let bTypeColorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent';
                                     if (bType === 'חוברת עבודה') {
                                       bTypeColorClasses = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
                                     } else if (bType === 'לא בהשאלת הספרים') {
                                       bTypeColorClasses = 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
                                     }
                                     
                                     return (
                                       <tr
                                         key={book.id}
                                         onClick={() => setHighlightedBook(isHighlighted ? null : book.id)}
                                         className={`hover:bg-blue-50/10 dark:hover:bg-slate-800/10 transition-all cursor-pointer ${
                                           isHighlighted ? 'bg-blue-500/5 border-r-4 border-r-blue-600 dark:bg-blue-950/15' : ''
                                         }`}
                                       >
                                         <td className="px-6 py-4">
                                           <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight">
                                             {book.title}
                                           </div>
                                           <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                                             מחבר / הוצאה: {book.author || '-'}
                                           </div>
                                         </td>
                                         <td className="px-4 py-4 text-center">
                                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${bTypeColorClasses}`}>
                                             {bType}
                                           </span>
                                         </td>
                                         {hasAnyNotes && (
                                           <td className="px-6 py-4 text-xs text-slate-450 dark:text-slate-450 leading-relaxed print:hidden">
                                             {book.notes || <span className="text-slate-200 dark:text-slate-800">-</span>}
                                           </td>
                                         )}
                                       </tr>
                                     );
                                   })}
                                 </React.Fragment>
                               );
                             });
                           })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <BookOpen size={48} className="mx-auto text-slate-300 animate-pulse" />
                      <h4 className="text-slate-700 dark:text-slate-300 font-bold">לא נמצאו ספרים מתאימים</h4>
                      <p className="text-slate-455 text-xs max-w-sm mx-auto">
                        שימו לב: ייתכן שהבחירות שלכם אינן דורשות ספרים מיוחדים לבחירה זו, או שהרשימה מעודכנת ברקע.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Text Box (Replacing tips) */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 flex items-center gap-4 print:hidden text-right">
                  <Info className="text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    <strong>שימו לב:</strong> רשימת הספרים יכולה להתעדכן, עקבו אחר ההודעות בקבוצות הווטסאפ.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
