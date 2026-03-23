import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Inbox, PenLine, Mail, Sparkles, Calendar, MailOpen, 
  Flame, Coins, Shield, CalendarDays, Plus, X, Search, 
  TrendingUp, Award, BookOpen, Quote, Heart, Settings, Check,
  Download, Upload, Maximize2, Minimize2, Star, Copy, Clock, Target, Hash
} from 'lucide-react';

type Note = {
  id: string;
  date: string;
  createdAt?: string;
  text: string;
  isSealed: boolean;
  mood?: string;
  tags?: string[];
  isPinned?: boolean;
  writingTime?: number;
};

type GameState = {
  points: number;
  streak: number;
  bestStreak: number;
  streakProtectors: number;
  lastNoteDate: string | null;
  achievements: string[];
};

const ACHIEVEMENTS = [
  { id: 'first_note', title: 'First Step', desc: 'Wrote your first note', icon: '🌱' },
  { id: 'streak_3', title: 'On a Roll', desc: 'Reached a 3-day streak', icon: '🔥' },
  { id: 'streak_7', title: 'Unstoppable', desc: 'Reached a 7-day streak', icon: '⭐' },
  { id: 'words_1000', title: 'Word Smith', desc: 'Wrote 1000 total words', icon: '✍️' },
  { id: 'early_bird', title: 'Early Bird', desc: 'Wrote a note before 8 AM', icon: '🌅' },
  { id: 'night_owl', title: 'Night Owl', desc: 'Wrote a note after 10 PM', icon: '🦉' },
];

const INDIAN_HOLIDAYS = new Set([
  '01-26', '08-15', '10-02', '12-25', '01-01', '01-14', '03-25', '11-01'
]);

const isExemptDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  if (day === 0 || day === 6) return true;
  const mmdd = dateStr.substring(5);
  if (INDIAN_HOLIDAYS.has(mmdd)) return true;
  return false;
};

const getMissedRequiredDays = (startStr: string, endStr: string) => {
  let missed = 0;
  let curr = new Date(startStr + 'T12:00:00');
  curr.setDate(curr.getDate() + 1);
  const end = new Date(endStr + 'T12:00:00');

  while (curr < end) {
    const currStr = curr.toISOString().split('T')[0];
    if (!isExemptDay(currStr)) missed++;
    curr.setDate(curr.getDate() + 1);
  }
  return missed;
};

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🚀', label: 'Motivated' },
  { emoji: '✨', label: 'Grateful' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
];

const INSPIRATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you can imagine is real.",
  "Whatever you are, be a good one.",
  "Tough times never last but tough people do.",
  "Turn your wounds into wisdom."
];

const processCustomBackground = (file: File): Promise<{ image: string, colors: Record<string, string> }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 64;
        sampleCanvas.height = 64;
        const sampleCtx = sampleCanvas.getContext('2d');
        if (!sampleCtx) return reject('No sample context');
        sampleCtx.drawImage(img, 0, 0, 64, 64);
        const imageData = sampleCtx.getImageData(0, 0, 64, 64).data;
        
        // Cleanup to save RAM
        canvas.width = 0;
        canvas.height = 0;
        sampleCanvas.width = 0;
        sampleCanvas.height = 0;
        img.src = '';
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i+1];
          b += imageData[i+2];
          count++;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
          }
          h /= 6;
        }

        s = Math.min(1, s * 1.2);

        const generateHex = (lVal: number) => {
          let r, g, b;
          if (s === 0) {
            r = g = b = lVal;
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            const q = lVal < 0.5 ? lVal * (1 + s) : lVal + s - lVal * s;
            const p = 2 * lVal - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
          }
          const toHex = (x: number) => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          };
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        };

        const colors = {
          '50': generateHex(0.95),
          '100': generateHex(0.90),
          '200': generateHex(0.80),
          '300': generateHex(0.70),
          '400': generateHex(0.60),
          '500': generateHex(0.50),
          '600': generateHex(0.40),
          '700': generateHex(0.30),
          '800': generateHex(0.20),
          '900': generateHex(0.10),
        };

        resolve({ image: dataUrl, colors });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('dear-me-notes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('dear-me-game');
    const parsed = saved ? JSON.parse(saved) : null;
    return { 
      points: parsed?.points || 0, 
      streak: parsed?.streak || 0, 
      bestStreak: parsed?.bestStreak || parsed?.streak || 0,
      streakProtectors: parsed?.streakProtectors || 0, 
      lastNoteDate: parsed?.lastNoteDate || null,
      achievements: parsed?.achievements || []
    };
  });
  
  const [activeTab, setActiveTab] = useState<'today' | 'moments' | 'progress'>('today');
  const [currentText, setCurrentText] = useState(() => localStorage.getItem('dear-me-draft') || '');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isWritingNew, setIsWritingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('dear-me-theme') || 'ocean');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Features State
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(() => (localStorage.getItem('dear-me-fontsize') as any) || 'base');
  const [wordCountGoal, setWordCountGoal] = useState(() => parseInt(localStorage.getItem('dear-me-wordgoal') || '50'));
  const [isWordGoalEnabled, setIsWordGoalEnabled] = useState(() => localStorage.getItem('dear-me-wordgoal-enabled') !== 'false');
  const [dailyIntention, setDailyIntention] = useState(() => localStorage.getItem('dear-me-intention') || '');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [writingTime, setWritingTime] = useState(0);
  const [customMoods, setCustomMoods] = useState<string[]>(() => JSON.parse(localStorage.getItem('dear-me-custom-moods') || '[]'));
  const [newCustomMood, setNewCustomMood] = useState('');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('dear-me-custom-bg') || '');
  const [customColors, setCustomColors] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('dear-me-custom-colors') || 'null'));

  useEffect(() => {
    localStorage.setItem('dear-me-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('dear-me-game', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('dear-me-theme', theme);
    if (theme === 'ocean') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (theme === 'custom' && customColors) {
      Object.entries(customColors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      });
      if (customBg) {
        document.documentElement.style.setProperty('--bg-gradient', `url(${customBg})`);
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.documentElement.style.setProperty('--bg-gradient', 'none');
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundAttachment = '';
      }
    } else {
      ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].forEach(key => {
        document.documentElement.style.removeProperty(`--theme-${key}`);
      });
      document.documentElement.style.removeProperty('--bg-gradient');
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    }
  }, [theme, customColors, customBg]);

  // New Effects
  useEffect(() => { localStorage.setItem('dear-me-fontsize', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('dear-me-wordgoal', wordCountGoal.toString()); }, [wordCountGoal]);
  useEffect(() => { localStorage.setItem('dear-me-wordgoal-enabled', isWordGoalEnabled.toString()); }, [isWordGoalEnabled]);
  useEffect(() => { localStorage.setItem('dear-me-intention', dailyIntention); }, [dailyIntention]);
  useEffect(() => { localStorage.setItem('dear-me-draft', currentText); }, [currentText]);
  useEffect(() => { localStorage.setItem('dear-me-custom-moods', JSON.stringify(customMoods)); }, [customMoods]);
  useEffect(() => { 
    try {
      localStorage.setItem('dear-me-custom-bg', customBg); 
      localStorage.setItem('dear-me-custom-colors', JSON.stringify(customColors));
    } catch (e) {
      console.error("Failed to save custom background to localStorage", e);
      // If it fails, we might want to clear it or just let it be session-only
    }
  }, [customBg, customColors]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayNotes = notes.filter(n => n.date === todayStr);
  const hasSealedToday = todayNotes.some(n => n.isSealed);

  useEffect(() => {
    let interval: any;
    if (isWritingNew || (todayNotes.length === 0 && !hasSealedToday)) {
      interval = setInterval(() => {
        setWritingTime(prev => prev + 1);
      }, 1000);
    } else {
      setWritingTime(0);
    }
    return () => clearInterval(interval);
  }, [isWritingNew, todayNotes.length, hasSealedToday]);

  const quoteOfTheDay = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return INSPIRATIONAL_QUOTES[dayOfYear % INSPIRATIONAL_QUOTES.length];
  }, []);

  let displayStreak = gameState.streak;
  if (gameState.lastNoteDate && gameState.lastNoteDate !== todayStr) {
    const missed = getMissedRequiredDays(gameState.lastNoteDate, todayStr);
    if (missed > gameState.streakProtectors) {
      displayStreak = 0;
    }
  }

  const handleSealNote = () => {
    if (!currentText.trim()) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    const newNote: Note = {
      id: Date.now().toString(),
      date: todayStr,
      createdAt: now.toISOString(),
      text: currentText.trim(),
      isSealed: true,
      mood: selectedMood || undefined,
      tags: currentTags.length > 0 ? currentTags : undefined,
      writingTime: writingTime
    };
    
    setNotes(prev => [...prev, newNote]);
    setCurrentText('');
    setSelectedMood('');
    setCurrentTags([]);
    setIsWritingNew(false);
    setWritingTime(0);
    localStorage.removeItem('dear-me-draft');

    // Stats for achievements
    const totalWordsAfter = notes.reduce((acc, note) => acc + note.text.split(/\s+/).filter(w => w.length > 0).length, 0) + newNote.text.split(/\s+/).filter(w => w.length > 0).length;

    // Gamification Logic
    let newGameState = { ...gameState };
    
    if (todayNotes.length === 0) {
      newGameState.points += 10; // Increased points for motivation

      if (!newGameState.lastNoteDate) {
        newGameState.streak = 1;
      } else {
        const missed = getMissedRequiredDays(newGameState.lastNoteDate, todayStr);
        if (missed === 0) {
          newGameState.streak += 1;
        } else if (missed <= newGameState.streakProtectors) {
          newGameState.streakProtectors -= missed;
          newGameState.streak += 1;
        } else {
          newGameState.streak = 1;
        }
      }
      
      if (newGameState.streak > newGameState.bestStreak) {
        newGameState.bestStreak = newGameState.streak;
      }
      
      newGameState.lastNoteDate = todayStr;
    } else {
      // Bonus points for extra notes
      newGameState.points += 2;
    }

    // Achievements Check
    const checkAchievement = (id: string, condition: boolean) => {
      if (condition && !newGameState.achievements.includes(id)) {
        newGameState.achievements.push(id);
        newGameState.points += 20; // Bonus for achievement
      }
    };

    checkAchievement('first_note', true);
    checkAchievement('streak_3', newGameState.streak >= 3);
    checkAchievement('streak_7', newGameState.streak >= 7);
    checkAchievement('words_1000', totalWordsAfter >= 1000);
    checkAchievement('early_bird', currentHour < 8);
    checkAchievement('night_owl', currentHour >= 22);

    setGameState(newGameState);
  };

  const handleOpenNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isSealed: false } : n));
  };

  const handleOpenAllToday = () => {
    setNotes(prev => prev.map(n => n.date === todayStr ? { ...n, isSealed: false } : n));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportData = () => {
    const data = { notes, gameState, theme, fontSize, wordCountGoal, isWordGoalEnabled, customMoods, customBg, customColors };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dear-me-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.notes) setNotes(data.notes);
        if (data.gameState) setGameState(data.gameState);
        if (data.theme) setTheme(data.theme);
        if (data.fontSize) setFontSize(data.fontSize);
        if (data.wordCountGoal) setWordCountGoal(data.wordCountGoal);
        if (data.isWordGoalEnabled !== undefined) setIsWordGoalEnabled(data.isWordGoalEnabled);
        if (data.customMoods) setCustomMoods(data.customMoods);
        if (data.customBg) setCustomBg(data.customBg);
        if (data.customColors) setCustomColors(data.customColors);
        setIsSettingsOpen(false);
      } catch (err) {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const buyProtector = () => {
    if (gameState.points >= 50) {
      setGameState(prev => ({
        ...prev,
        points: prev.points - 50,
        streakProtectors: prev.streakProtectors + 1
      }));
    }
  };

  const buyInspiration = () => {
    if (gameState.points >= 15) {
      setGameState(prev => ({ ...prev, points: prev.points - 15 }));
      const randomQuote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
      setCurrentText(prev => prev ? `${prev}\n\n"${randomQuote}"` : `"${randomQuote}"\n\n`);
      setActiveTab('today');
      setIsWritingNew(true);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T12:00:00').toLocaleDateString(undefined, options);
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const moments = notes
    .filter(n => n.date !== todayStr || !n.isSealed)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date.localeCompare(a.date);
    });
    
  const filteredMoments = moments.filter(n => 
    n.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.mood && n.mood.includes(searchQuery)) ||
    (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Stats calculations
  const totalWords = notes.reduce((acc, note) => acc + note.text.split(/\s+/).filter(w => w.length > 0).length, 0);
  const totalNotes = notes.length;
  
  const moodCounts = notes.reduce((acc, note) => {
    if (note.mood) acc[note.mood] = (acc[note.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostUsedMood = Object.entries(moodCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'None';
  const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans text-${fontSize}`}>
      {/* Top Header Bar */}
      {!isFocusMode && (
      <header className="w-full bg-white shadow-sm border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-20 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500 p-2 rounded-xl text-white shadow-sm">
            <Sun size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">noteit</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-bold overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full shadow-sm border border-orange-100 whitespace-nowrap">
            <Flame size={16} className={displayStreak > 0 ? "fill-orange-500" : ""} /> 
            <span>{displayStreak} <span className="hidden sm:inline">Streak</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full shadow-sm border border-yellow-100 whitespace-nowrap">
            <Coins size={16} className="fill-yellow-500" /> 
            <span>{gameState.points} <span className="hidden sm:inline">Pts</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shadow-sm border border-blue-100 whitespace-nowrap">
            <Shield size={16} className={gameState.streakProtectors > 0 ? "fill-blue-500" : ""} /> 
            <span>{gameState.streakProtectors} <span className="hidden sm:inline">Shields</span></span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-2"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      )}

      <div className={`flex flex-col items-center p-4 sm:p-6 mx-auto w-full flex-1 ${isFocusMode ? 'max-w-3xl mt-10' : 'max-w-5xl mt-2 sm:mt-4'}`}>
        {/* Navigation Tabs */}
        {!isFocusMode && (
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto max-w-full w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'today' 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <PenLine size={18} />
            <span className="hidden sm:inline">Today's Notes</span>
            <span className="sm:hidden">Today</span>
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'moments' 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Inbox size={18} />
            Moments
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'progress' 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={18} />
            Progress
          </button>
        </div>
        )}

        {/* Main Content Area */}
        <main className="w-full flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'today' ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mx-auto space-y-6"
              >
                {/* Daily Intention */}
                {!isFocusMode && todayNotes.length === 0 && !isWritingNew && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Daily Intention</p>
                    <input 
                      type="text"
                      value={dailyIntention}
                      onChange={(e) => setDailyIntention(e.target.value)}
                      placeholder="What is your main focus for today?"
                      className="w-full bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                )}

                {/* Quote of the day banner */}
                {!isFocusMode && todayNotes.length === 0 && !isWritingNew && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
                  >
                    <Quote className="absolute -top-4 -left-4 w-24 h-24 text-white opacity-10 rotate-12" />
                    <div className="relative z-10">
                      <p className="text-lg sm:text-xl font-medium leading-relaxed mb-4">"{quoteOfTheDay}"</p>
                      <p className="text-teal-100 text-sm font-bold uppercase tracking-wider">Daily Inspiration</p>
                    </div>
                  </motion.div>
                )}

                {todayNotes.length === 0 || isWritingNew ? (
                  // State 1: Writing the note
                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 relative">
                    <button 
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className="absolute top-6 right-16 text-slate-400 hover:text-teal-500 transition-colors p-2 rounded-full hover:bg-slate-50"
                      title="Toggle Focus Mode"
                    >
                      {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-teal-500" />
                        {todayNotes.length === 0 ? "How are you today?" : "Add another thought"}
                      </h2>
                      {todayNotes.length > 0 && (
                        <button onClick={() => setIsWritingNew(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-full">
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    {/* Mood Selector */}
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-500 mb-2">How are you feeling?</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
                        {[...MOODS, ...customMoods.map(m => ({ emoji: m, label: 'Custom' }))].map((m, i) => (
                          <button 
                            key={i}
                            onClick={() => setSelectedMood(m.emoji)}
                            className={`text-2xl p-3 rounded-2xl transition-all shrink-0 ${
                              selectedMood === m.emoji 
                                ? 'bg-teal-100 scale-110 shadow-sm border border-teal-200' 
                                : 'bg-slate-50 hover:bg-slate-100 border border-transparent grayscale hover:grayscale-0'
                            }`}
                            title={m.label}
                          >
                            {m.emoji}
                          </button>
                        ))}
                        <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-200 shrink-0">
                          <input 
                            type="text" 
                            maxLength={2}
                            value={newCustomMood}
                            onChange={(e) => setNewCustomMood(e.target.value)}
                            placeholder="😀"
                            className="w-10 text-center bg-transparent border-none focus:outline-none text-xl"
                          />
                          <button 
                            onClick={() => {
                              if (newCustomMood && !customMoods.includes(newCustomMood)) {
                                setCustomMoods([...customMoods, newCustomMood]);
                                setNewCustomMood('');
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-teal-500"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Word Count Progress */}
                    {isWordGoalEnabled && (
                      <>
                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>Word Goal: {currentText.split(/\s+/).filter(w => w.length > 0).length} / {wordCountGoal}</span>
                          {writingTime > 0 && <span className="flex items-center gap-1"><Clock size={12}/> {Math.floor(writingTime / 60)}:{(writingTime % 60).toString().padStart(2, '0')}</span>}
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                          <div 
                            className="bg-teal-400 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (currentText.split(/\s+/).filter(w => w.length > 0).length / wordCountGoal) * 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                    {!isWordGoalEnabled && writingTime > 0 && (
                      <div className="mb-4 flex items-center justify-end text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12}/> {Math.floor(writingTime / 60)}:{(writingTime % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}

                    <textarea
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Start writing here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 min-h-[200px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all resize-none text-lg leading-relaxed"
                    />
                    
                    {/* Tags Input */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      {currentTags.map(tag => (
                        <span key={tag} className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-teal-100">
                          <Hash size={12} /> {tag}
                          <button onClick={() => setCurrentTags(currentTags.filter(t => t !== tag))} className="hover:text-teal-800 ml-1"><X size={12}/></button>
                        </span>
                      ))}
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim() && !currentTags.includes(tagInput.trim())) {
                            setCurrentTags([...currentTags, tagInput.trim()]);
                            setTagInput('');
                          }
                        }}
                        placeholder="Add tags (press Enter)..."
                        className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-slate-600 placeholder-slate-400 min-w-[150px]"
                      />
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <p className="text-sm text-slate-400 font-medium">
                        {currentText.length} characters
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSealNote}
                        disabled={!currentText.trim()}
                        className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mail size={18} />
                        Seal Note
                      </motion.button>
                    </div>
                  </div>
                ) : hasSealedToday ? (
                  // State 2: Note is sealed
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-60"></div>
                      <Mail className="text-teal-500 w-28 h-28 mb-8 relative z-10" strokeWidth={1.5} />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3 text-center">Notes are waiting!</h2>
                    <p className="text-slate-500 mb-10 text-center max-w-sm text-lg">
                      You've written {todayNotes.filter(n => n.isSealed).length} note(s) today. Ready to look back?
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenAllToday}
                      className="bg-teal-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all flex items-center gap-3 text-lg"
                    >
                      <MailOpen size={22} />
                      Open Today's Notes
                    </motion.button>
                  </div>
                ) : (
                  // State 3: Note is opened
                  <div className="space-y-6">
                    {todayNotes.map(note => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-400"></div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={16} />
                            <span className="font-bold tracking-wider uppercase text-xs">
                              {note.createdAt ? formatDateTime(note.createdAt) : "Today"}
                            </span>
                          </div>
                          {note.mood && (
                            <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-100">
                              {note.mood}
                            </div>
                          )}
                        </div>
                        <p className="text-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {note.text}
                        </p>
                      </motion.div>
                    ))}
                    
                    <div className="flex justify-center pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsWritingNew(true)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Plus size={18} />
                        Write another note
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'moments' ? (
              <motion.div
                key="moments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl mx-auto"
              >
                {/* Search Bar */}
                <div className="mb-8 relative max-w-md mx-auto sm:mx-0">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your moments or moods (e.g. 😊)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  />
                </div>

                {moments.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Your journal is empty</h3>
                    <p className="text-slate-500">Notes from previous days will appear here.</p>
                  </div>
                ) : filteredMoments.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No moments found</h3>
                    <p className="text-slate-500">Try a different search term.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMoments.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={14} />
                            <span className="font-bold text-xs uppercase tracking-wider">
                              {note.createdAt ? formatDateTime(note.createdAt) : formatDate(note.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {note.mood && (
                              <span className="text-xl" title="Mood">{note.mood}</span>
                            )}
                            <button 
                              onClick={() => togglePin(note.id)}
                              className={`p-1.5 rounded-full transition-colors ${note.isPinned ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                            >
                              <Star size={16} className={note.isPinned ? "fill-yellow-500" : ""} />
                            </button>
                            {!note.isSealed && (
                              <button 
                                onClick={() => copyToClipboard(note.text)}
                                className="p-1.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                                title="Copy to clipboard"
                              >
                                <Copy size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {note.isSealed ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Mail size={28} className="mb-3 text-slate-300" />
                            <span className="font-semibold text-sm">Sealed Note</span>
                            <button 
                              onClick={() => handleOpenNote(note.id)}
                              className="mt-3 text-sm font-bold text-teal-500 hover:text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full"
                            >
                              Open now
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col">
                            <p className="text-slate-700 leading-relaxed line-clamp-5 flex-1 whitespace-pre-wrap">
                              {note.text}
                            </p>
                            {note.tags && note.tags.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {note.tags.map(tag => (
                                  <span key={tag} className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl mx-auto space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="bg-teal-50 p-3 rounded-2xl text-teal-500 mb-3"><BookOpen size={24} /></div>
                    <p className="text-3xl font-black text-slate-800">{totalNotes}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Notes</p>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-500 mb-3"><PenLine size={24} /></div>
                    <p className="text-3xl font-black text-slate-800">{totalWords}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Words Written</p>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="bg-orange-50 p-3 rounded-2xl text-orange-500 mb-3"><Flame size={24} /></div>
                    <p className="text-3xl font-black text-slate-800">{gameState.streak}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Current Streak</p>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-500 mb-3"><Award size={24} /></div>
                    <p className="text-3xl font-black text-slate-800">{gameState.bestStreak}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Best Streak</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-pink-50 p-3 rounded-2xl text-pink-500"><Heart size={24} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Most Used Mood</p>
                      <p className="text-xl font-bold text-slate-800">{mostUsedMood}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-cyan-50 p-3 rounded-2xl text-cyan-500"><Target size={24} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Words/Note</p>
                      <p className="text-xl font-bold text-slate-800">{avgWords}</p>
                    </div>
                  </div>
                </div>

                {/* Achievements Section */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Award className="text-teal-500" /> Achievements
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ACHIEVEMENTS.map(ach => {
                      const isUnlocked = gameState.achievements.includes(ach.id);
                      return (
                        <div key={ach.id} className={`p-4 rounded-2xl border ${isUnlocked ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
                          <div className="text-3xl mb-2">{ach.icon}</div>
                          <h3 className={`font-bold text-sm ${isUnlocked ? 'text-teal-800' : 'text-slate-600'}`}>{ach.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{ach.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Calendar Section */}
                  <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <CalendarDays className="text-teal-500" /> Activity Calendar
                    </h2>
                    
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="font-bold text-slate-400 text-xs sm:text-sm">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {(() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = now.getMonth();
                        const daysInMonth = new Date(y, m + 1, 0).getDate();
                        const firstDay = new Date(y, m, 1).getDay();
                        
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="p-2"></div>);
                        }
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const hasNote = notes.some(n => n.date === dateStr);
                          const isExempt = isExemptDay(dateStr);
                          const isPast = dateStr < todayStr;
                          const isToday = dateStr === todayStr;
                          
                          let bgColor = "bg-slate-50 text-slate-600";
                          if (hasNote) bgColor = "bg-teal-500 text-white font-bold shadow-sm";
                          else if (isPast && !isExempt) bgColor = "bg-red-50 text-red-400";
                          else if (isExempt) bgColor = "bg-slate-100 text-slate-400 opacity-50";
                          
                          if (isToday && !hasNote) bgColor = "border-2 border-teal-400 text-teal-600 font-bold bg-teal-50";

                          cells.push(
                            <div key={d} className={`aspect-square rounded-xl flex items-center justify-center text-sm sm:text-base transition-all ${bgColor}`}>
                              {d}
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500 justify-center uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500"></div> Written</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100"></div> Missed</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Exempt</div>
                    </div>
                  </div>

                  {/* Shop Section */}
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500"><Shield size={20} /></div>
                        <div>
                          <h3 className="font-bold text-slate-800">Streak Protector</h3>
                          <p className="text-xs text-slate-500 font-medium">Saves a missed day</p>
                        </div>
                      </div>
                      <button 
                        onClick={buyProtector}
                        disabled={gameState.points < 50}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        Buy for 50 <Coins size={14} className="fill-yellow-500 text-yellow-500" />
                      </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-50 p-2.5 rounded-xl text-purple-500"><Sparkles size={20} /></div>
                        <div>
                          <h3 className="font-bold text-slate-800">Inspiration Boost</h3>
                          <p className="text-xs text-slate-500 font-medium">Get a quote to write about</p>
                        </div>
                      </div>
                      <button 
                        onClick={buyInspiration}
                        disabled={gameState.points < 15}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        Buy for 15 <Coins size={14} className="fill-yellow-500 text-yellow-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="text-slate-400" /> Settings
                </h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">App Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'ocean', name: 'Ocean', color: 'bg-teal-500' },
                      { id: 'forest', name: 'Forest', color: 'bg-emerald-500' },
                      { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
                      { id: 'lavender', name: 'Lavender', color: 'bg-purple-500' },
                      { id: 'gradient-aurora', name: 'Aurora', color: 'bg-gradient-to-br from-purple-400 to-blue-400' },
                      { id: 'gradient-peach', name: 'Peach', color: 'bg-gradient-to-br from-red-300 to-pink-300' },
                      { id: 'custom', name: 'Custom', color: 'bg-slate-200' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          theme === t.id 
                            ? 'border-slate-800 bg-slate-50 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full ${t.color} shadow-sm`}></div>
                        <span className="font-bold text-slate-700 text-sm">{t.name}</span>
                      </button>
                    ))}
                  </div>
                  {theme === 'custom' && (
                    <div className="mt-4">
                      <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors text-sm cursor-pointer">
                        <Upload size={16} /> Upload Background Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const { image, colors } = await processCustomBackground(file);
                                setCustomBg(image);
                                setCustomColors(colors);
                              } catch (err) {
                                console.error("Failed to process image", err);
                                alert("Failed to process image");
                              }
                            }
                          }} 
                        />
                      </label>
                      {customBg && (
                        <div className="mt-2 text-xs text-slate-500 text-center">
                          Custom background applied!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">Font Size</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['sm', 'base', 'lg'].map(size => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size as any)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${fontSize === size ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {size === 'sm' ? 'Small' : size === 'base' ? 'Medium' : 'Large'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 block">Daily Word Goal</label>
                        <button 
                          onClick={() => setIsWordGoalEnabled(!isWordGoalEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isWordGoalEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isWordGoalEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {isWordGoalEnabled && (
                        <input 
                          type="number" 
                          value={wordCountGoal}
                          onChange={(e) => setWordCountGoal(Math.max(10, parseInt(e.target.value) || 50))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-teal-400 mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Data Management</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={exportData}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors text-sm"
                    >
                      <Download size={16} /> Export
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-colors text-sm cursor-pointer">
                      <Upload size={16} /> Import
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
