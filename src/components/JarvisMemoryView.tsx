/**
 * ONEVA Phase 14: Jarvis Memory & Owner Access Control UI Component
 * 
 * Interactive control panel for:
 * - Exploring local-first privacy memories (saved, research, task, preferences)
 * - Owner authentication configuration (SHA-256 hashed password)
 * - Multi-user identity actor switching & history isolation testing
 * - Protected device-wide activity history with password unlock gate
 * - Granular memory deletion and auto-save preferences
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Lock,
  Unlock,
  ShieldCheck,
  User,
  Users,
  Search,
  Trash2,
  Plus,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  JarvisMemoryItem,
  JarvisMemoryType,
  JarvisActorProfile,
  JarvisTaskHistoryItem,
} from '../types/jarvisMemory';
import { JarvisMemoryStorage } from '../services/memory/jarvisMemoryStorage';
import { OwnerAuthService } from '../services/memory/ownerAuthService';
import { JarvisTaskHistoryService } from '../services/memory/jarvisTaskHistoryService';

export function JarvisMemoryView() {
  const [memories, setMemories] = useState<JarvisMemoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'memories' | 'history' | 'security' | 'settings'>('memories');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Profiles & Auth State
  const [activeActor, setActiveActor] = useState<JarvisActorProfile>(OwnerAuthService.getActiveActor());
  const [allProfiles, setAllProfiles] = useState<JarvisActorProfile[]>(OwnerAuthService.getAllProfiles());
  const [isPasswordConfigured, setIsPasswordConfigured] = useState<boolean>(OwnerAuthService.isOwnerPasswordSet());
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(OwnerAuthService.isOwnerSessionUnlocked());
  const [voiceStatus, setVoiceStatus] = useState(OwnerAuthService.getVoiceVerificationStatus());

  // Task History State
  const [personalHistory, setPersonalHistory] = useState<JarvisTaskHistoryItem[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<JarvisTaskHistoryItem[]>([]);
  const [historyTab, setHistoryTab] = useState<'personal' | 'device_wide'>('personal');
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals & Inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<JarvisMemoryType>('USER_SAVED_MEMORY');

  // Password Modals
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'setup' | 'verify' | 'change'>('setup');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordModalMsg, setPasswordModalMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Settings
  const [settings, setSettings] = useState(JarvisMemoryStorage.getSettings());

  const refreshAll = () => {
    setMemories(JarvisMemoryStorage.getAll());
    setActiveActor(OwnerAuthService.getActiveActor());
    setAllProfiles(OwnerAuthService.getAllProfiles());
    setIsPasswordConfigured(OwnerAuthService.isOwnerPasswordSet());
    setIsSessionUnlocked(OwnerAuthService.isOwnerSessionUnlocked());
    setVoiceStatus(OwnerAuthService.getVoiceVerificationStatus());
    setSettings(JarvisMemoryStorage.getSettings());

    const pHistory = JarvisTaskHistoryService.getPersonalHistory();
    setPersonalHistory(pHistory.items);

    const dHistory = JarvisTaskHistoryService.getTotalDeviceHistory();
    if (dHistory.success) {
      setDeviceHistory(dHistory.items);
    } else {
      setDeviceHistory([]);
    }
  };

  useEffect(() => {
    refreshAll();

    const unsubMem = JarvisMemoryStorage.subscribe(refreshAll);
    const unsubAuth = OwnerAuthService.subscribe(refreshAll);
    const unsubHistory = JarvisTaskHistoryService.subscribe(refreshAll);

    return () => {
      unsubMem();
      unsubAuth();
      unsubHistory();
    };
  }, []);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Filter Memories
  const filteredMemories = memories.filter((m) => {
    if (selectedType !== 'ALL' && m.type !== selectedType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Handle Actor Change
  const handleActorSelect = (actorId: string) => {
    OwnerAuthService.setActiveActor(actorId);
    refreshAll();
    showToast(`Switched active profile to ${OwnerAuthService.getActiveActor().displayName}`);
  };

  // Handle Adding Memory
  const handleAddMemory = () => {
    if (!newMemoryText.trim()) return;
    JarvisMemoryStorage.save({
      memoryId: `mem_${Date.now()}`,
      type: newMemoryType,
      title: newMemoryText.length > 40 ? `${newMemoryText.slice(0, 37)}...` : newMemoryText,
      summary: newMemoryText.trim(),
      content: newMemoryText.trim(),
      tags: ['manual', newMemoryType.toLowerCase()],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'user_explicit',
      importance: 'high',
      ownerScope: activeActor.type === 'owner' ? 'owner' : 'user_2',
      reasonStored: 'Explicitly added via JARVIS Memory interface',
    });
    setNewMemoryText('');
    setShowAddModal(false);
    showToast('Sir, memory has been saved locally.');
  };

  // Handle Delete Memory
  const handleDeleteMemory = (id: string) => {
    JarvisMemoryStorage.delete(id);
    showToast('Memory item removed.');
  };

  // Handle Clear All Memory
  const handleClearAllMemory = () => {
    setShowConfirmClearAll(true);
  };

  const confirmClearAllMemory = () => {
    JarvisMemoryStorage.clearAll();
    setShowConfirmClearAll(false);
    showToast('All JARVIS memories cleared.');
  };

  // Password Operations
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalMsg(null);

    if (passwordMode === 'setup') {
      if (newPasswordInput.length < 4) {
        setPasswordModalMsg({ text: 'Password must be at least 4 characters.', isError: true });
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        setPasswordModalMsg({ text: 'Passwords do not match.', isError: true });
        return;
      }

      const res = await OwnerAuthService.setupOwnerPassword(newPasswordInput);
      if (res.success) {
        setShowPasswordModal(false);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        showToast(res.message);
      } else {
        setPasswordModalMsg({ text: res.message, isError: true });
      }
    } else if (passwordMode === 'verify') {
      const res = await OwnerAuthService.verifyPassword(currentPasswordInput);
      if (res.success) {
        setShowPasswordModal(false);
        setCurrentPasswordInput('');
        showToast('Owner session unlocked for 5 minutes.');
      } else {
        setPasswordModalMsg({ text: res.message, isError: true });
      }
    } else if (passwordMode === 'change') {
      if (newPasswordInput.length < 4) {
        setPasswordModalMsg({ text: 'New password must be at least 4 characters.', isError: true });
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        setPasswordModalMsg({ text: 'Passwords do not match.', isError: true });
        return;
      }

      const res = await OwnerAuthService.changeOwnerPassword(currentPasswordInput, newPasswordInput);
      if (res.success) {
        setShowPasswordModal(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        showToast(res.message);
      } else {
        setPasswordModalMsg({ text: res.message, isError: true });
      }
    }
  };

  const handleDeviceWideHistoryClick = () => {
    setHistoryTab('device_wide');
    const result = JarvisTaskHistoryService.getTotalDeviceHistory();
    if (!result.success && result.requiresVerification) {
      // Need owner password
      setPasswordMode('verify');
      setShowPasswordModal(true);
    } else if (!result.success) {
      setAuthError(result.message);
    } else {
      setAuthError(null);
      setDeviceHistory(result.items);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-cyan-500/30 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                JARVIS Memory &amp; Owner Control
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono">
                PHASE 14
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Local-first personal memory, multi-user context isolation, and owner access authorization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPasswordConfigured ? (
            <button
              onClick={() => {
                if (isSessionUnlocked) {
                  OwnerAuthService.lockOwnerSession();
                  showToast('Owner session locked.');
                } else {
                  setPasswordMode('verify');
                  setShowPasswordModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                isSessionUnlocked
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-neutral-800 border-white/10 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isSessionUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isSessionUnlocked ? 'Owner: Unlocked' : 'Owner: Locked'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setPasswordMode('setup');
                setShowPasswordModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Set Owner Password</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-cyan-200">Local-First Guarantee:</strong> Memories and owner verification hashes are never sent to any cloud server. JARVIS never stores private chats, passwords, keystrokes, or contacts.
        </p>
      </div>

      {/* Multi-User Identity Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950/50 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>SIMULATED RECOGNIZED ACTOR / VOICE PROFILE:</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Active: <strong className="text-white">{activeActor.displayName}</strong> ({activeActor.type})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {allProfiles.map((profile) => {
            const isSelected = activeActor.id === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => handleActorSelect(profile.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-neutral-800/90 border-cyan-500/40 shadow-md'
                    : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-white/5 text-neutral-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-neutral-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">{profile.displayName}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">{profile.type} profile</div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'memories', label: `Saved Memories (${memories.length})` },
          { id: 'history', label: 'User & Device History' },
          { id: 'security', label: 'Owner Access Control' },
          { id: 'settings', label: 'Memory Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MEMORIES */}
      {activeTab === 'memories' && (
        <div className="space-y-4">
          {/* Controls: Search & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved memories, research, or preferences..."
                className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            {memories.length > 0 && (
              <button
                onClick={handleClearAllMemory}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'USER_SAVED_MEMORY', label: 'User Saved' },
              { id: 'RESEARCH_MEMORY', label: 'Research' },
              { id: 'JARVIS_TASK_MEMORY', label: 'Task Summaries' },
              { id: 'USER_PREFERENCE_MEMORY', label: 'Preferences' },
              { id: 'TEMPORARY_CONTEXT', label: 'Temporary Context' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedType(p.id)}
                className={`px-3 py-1 rounded-lg border text-[11px] font-mono transition whitespace-nowrap cursor-pointer ${
                  selectedType === p.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-neutral-900/40 border-white/5 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Memories List */}
          {filteredMemories.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-950/30 border border-white/5 text-center space-y-2">
              <Brain className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs font-medium text-neutral-400">No memories found in this category.</p>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Ask JARVIS to "remember that..." or perform a web research task to populate persistent memory automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMemories.map((m) => (
                <div
                  key={m.memoryId}
                  className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 hover:border-white/10 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400">
                        {m.type.replace('_MEMORY', '')}
                      </span>
                      <button
                        onClick={() => handleDeleteMemory(m.memoryId)}
                        className="text-neutral-500 hover:text-red-400 transition cursor-pointer p-1"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-xs font-semibold text-white line-clamp-1">{m.title}</h3>
                    <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {m.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3 h-3 text-neutral-600 shrink-0" />
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="truncate">{m.reasonStored}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 uppercase text-[9px]">
                      {m.ownerScope}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASK & ACTIVITY HISTORY (MULTI-USER ISOLATION) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryTab('personal')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  historyTab === 'personal'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Personal History ({activeActor.displayName})
              </button>
              <button
                onClick={handleDeviceWideHistoryClick}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  historyTab === 'device_wide'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Total Device Activity (Protected)</span>
              </button>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{authError}</span>
            </div>
          )}

          {historyTab === 'personal' ? (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-400">
                Rule 13: Normal personal history accessible for active profile "{activeActor.displayName}".
              </div>
              {personalHistory.length === 0 ? (
                <div className="p-6 rounded-2xl bg-neutral-950/30 border border-white/5 text-center text-xs text-neutral-400">
                  No activity history recorded for this profile yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {personalHistory.map((item) => (
                    <div
                      key={item.taskId}
                      className="p-3 rounded-xl bg-neutral-950/50 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-neutral-200">{item.summary}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                          <span className="text-cyan-400 uppercase">{item.category}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                        {item.actorDisplayName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-400">
                Rule 14: Total device-wide activity requires Owner verification. Other users are isolated.
              </div>
              {deviceHistory.length === 0 ? (
                <div className="p-6 rounded-2xl bg-neutral-950/30 border border-white/5 text-center text-xs text-neutral-400">
                  {isSessionUnlocked
                    ? 'No task activity recorded across device.'
                    : 'Protected history locked. Click unlock above to authenticate with owner password.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {deviceHistory.map((item) => (
                    <div
                      key={item.taskId}
                      className="p-3 rounded-xl bg-neutral-950/50 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-medium text-neutral-200">{item.summary}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                          <span className="text-cyan-400 uppercase">{item.category}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          item.actorType === 'owner'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        }`}
                      >
                        {item.actorDisplayName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OWNER ACCESS CONTROL */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950/50 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Owner Password Status</span>
                {isPasswordConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    Configured (SHA-256)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300">
                {isPasswordConfigured
                  ? 'Your ONEVA Owner Password protects device-wide task histories and privacy security boundaries.'
                  : 'Set an owner password to safeguard total device history from guests and other users.'}
              </p>
              <div className="flex items-center gap-2 pt-2">
                {isPasswordConfigured ? (
                  <button
                    onClick={() => {
                      setPasswordMode('change');
                      setShowPasswordModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-medium transition cursor-pointer"
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPasswordMode('setup');
                      setShowPasswordModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition cursor-pointer"
                  >
                    Set Password Now
                  </button>
                )}
              </div>
            </div>

            {/* Voice Recognition Status (Rule 9: Real & Honest) */}
            <div className="p-4 rounded-2xl bg-neutral-950/50 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Voice Biometric Status</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-white/10 text-[10px] font-mono">
                  Honest Telemetry
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                {voiceStatus.statusSummary}
              </p>
              <div className="text-[11px] font-mono text-neutral-500">
                Rule 9: Never fake voice recognition. When neural voice driver is unverified, fallback to Owner Password is automatically enforced.
              </div>
            </div>
          </div>

          {/* Multi-User Isolation Rule Matrix */}
          <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase font-mono">Multi-User Authorization Rules (Phase 14)</h4>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-4">
              <li><strong>Owner Profile:</strong> Can view personal activity without password; viewing total device history requires owner verification.</li>
              <li><strong>Secondary Profile (Voice Profile 2):</strong> Can only view own permitted activity. Requests for other users' history are denied.</li>
              <li><strong>Unknown Voice:</strong> Denied access to private histories until a profile is enrolled and verified.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-4 rounded-2xl bg-neutral-950/50 border border-white/5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Memory Automation Toggles</h3>
          <div className="space-y-3">
            {[
              {
                id: 'autoSaveResearchMemory',
                label: 'Auto-save Web Research Findings',
                desc: 'Automatically save safe summaries of JARVIS web research for quick recall without re-searching.',
                checked: settings.autoSaveResearchMemory,
              },
              {
                id: 'autoSaveTaskMemory',
                label: 'Auto-save Task Execution Summaries',
                desc: 'Keep lightweight summaries of completed actions (e.g., opened apps, system toggles).',
                checked: settings.autoSaveTaskMemory,
              },
              {
                id: 'autoSavePreferences',
                label: 'Auto-save Explicit User Preferences',
                desc: 'Remember preferred browsers, apps, and topics explicitly mentioned by the user.',
                checked: settings.autoSavePreferences,
              },
            ].map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-white">{s.label}</div>
                  <div className="text-[11px] text-neutral-400">{s.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={s.checked}
                  onChange={(e) => {
                    JarvisMemoryStorage.updateSettings({ [s.id]: e.target.checked });
                    setSettings(JarvisMemoryStorage.getSettings());
                    showToast('Setting updated.');
                  }}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMORY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Add Persistent Memory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Memory Type</label>
                <select
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                >
                  <option value="USER_SAVED_MEMORY">User Saved ("Remember that...")</option>
                  <option value="USER_PREFERENCE_MEMORY">User Preference</option>
                  <option value="RESEARCH_MEMORY">Research Finding</option>
                  <option value="TEMPORARY_CONTEXT">Temporary Task Context</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Content / Instruction</label>
                <textarea
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g., Preferred browser is Brave, or recommended tools for editing..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMemory}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs transition hover:bg-cyan-400 cursor-pointer"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OWNER PASSWORD (SETUP / VERIFY / CHANGE) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePasswordSubmit}
            className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  {passwordMode === 'setup'
                    ? 'Setup Owner Password'
                    : passwordMode === 'verify'
                    ? 'Verify Owner Identity'
                    : 'Change Owner Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordModalMsg(null);
                }}
                className="text-neutral-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordModalMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordModalMsg.isError
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                }`}
              >
                {passwordModalMsg.isError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{passwordModalMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              {(passwordMode === 'verify' || passwordMode === 'change') && (
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current owner password"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 pr-9 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {(passwordMode === 'setup' || passwordMode === 'change') && (
                <>
                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                      {passwordMode === 'change' ? 'New Password' : 'Create Password'}
                    </label>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block mb-1">Confirm Password</label>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordModalMsg(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs transition hover:bg-cyan-400 cursor-pointer"
              >
                {passwordMode === 'verify' ? 'Unlock Session' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Clear All Memories */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Clear All Memories?</h3>
                <p className="text-[11px] text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently clear all stored JARVIS memories, preferences, and cached research from local storage?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAllMemory}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-xs transition cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
