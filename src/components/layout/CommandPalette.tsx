'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Activity, 
  Settings, 
  ArrowRight,
  Command,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ElementType;
  shortcut?: string;
  color: string;
}

const commandItems: CommandItem[] = [
  { id: '1', title: 'Create New Recipe', category: 'Actions', href: '/content/new', icon: Plus, shortcut: 'N', color: 'text-orange-400' },
  { id: '2', title: 'Import Source Material (URL/OCR)', category: 'Actions', href: '/imports/new', icon: FileText, shortcut: 'I', color: 'text-cyan-400' },
  { id: '3', title: 'Review AI Staging Drafts', category: 'Actions', href: '/drafts', icon: Sparkles, shortcut: 'D', color: 'text-amber-400' },
  { id: '4', title: 'Browse Recipes & Guides', category: 'Navigation', href: '/content', icon: BookOpen, shortcut: 'R', color: 'text-orange-400' },
  { id: '5', title: 'Nutrition Engine & Macro Lookup', category: 'Tools', href: '/nutrition', icon: Activity, shortcut: 'M', color: 'text-emerald-400' },
  { id: '6', title: 'Search Knowledge Base', category: 'Navigation', href: '/search', icon: Search, shortcut: 'S', color: 'text-blue-400' },
  { id: '7', title: 'Configure AI Providers & Keys', category: 'Settings', href: '/settings', icon: Settings, color: 'text-zinc-400' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredCommands = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-hud-reveal">
      {/* Modal Card */}
      <div 
        className="w-full max-w-xl elevation-level3 rounded-2xl border border-neutral-700/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800 bg-neutral-900/90">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-sans"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-neutral-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-[#12100e]">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-zinc-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-sans transition-all ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border border-orange-500/30'
                      : 'text-zinc-300 hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">{item.title}</span>
                      <span className="ml-2 text-[10px] font-mono text-zinc-400 uppercase">[{item.category}]</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-900 text-zinc-400 border border-neutral-800">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${isSelected ? 'opacity-100 text-orange-400' : 'opacity-0'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-t border-neutral-800/80 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3 text-orange-400" />
            <span>Command Palette Active</span>
          </div>
          <div className="flex items-center gap-3">
            <span>[ESC] to close</span>
            <span>[↵] to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
