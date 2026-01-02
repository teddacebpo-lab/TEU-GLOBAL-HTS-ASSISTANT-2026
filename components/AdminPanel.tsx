
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    XCircleIcon, TrashIcon, BeakerIcon, TerminalIcon, UsersIcon, 
    CogIcon, DashboardIcon, ServerIcon, ChartBarIcon, ClipboardDocumentListIcon,
    DatabaseIcon, PlayIcon, HistoryIcon, MicIcon, UploadIcon, SearchIcon, RestartIcon
} from './icons/Icons';
import { AiBehavior, User, SubscriptionTier, SubscriptionRequest, ClassificationHistoryItem, UserFeatures } from '../types';
import { saveString, saveData } from '../services/dataService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  classificationPrompt: string;
  setClassificationPrompt: (prompt: string) => void;
  lookupPrompt: string;
  setLookupPrompt: (prompt: string) => void;
  expiredHtsCodes: string[];
  setExpiredHtsCodes: (codes: string[]) => void;
  aiBehavior: AiBehavior;
  setAiBehavior: (behavior: AiBehavior) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  logs: string[];
  clearLogs: () => void;
  addLog: (message: string) => void;
  allUsers: User[];
  onAddUser: (user: Omit<User, 'id' | 'features'> & { subscriptionExpires?: string }, password: string) => void;
  onUpdateUser: (user: Omit<User, 'features'> & { subscriptionExpires?: string }, password?: string) => void;
  onDeleteUser: (userId: string) => void;
  subscriptionRequests: SubscriptionRequest[];
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  activityHistory: ClassificationHistoryItem[];
  subscriptionFeatures: Record<SubscriptionTier, UserFeatures>;
  onUpdateSubscriptionFeatures: (features: Record<SubscriptionTier, UserFeatures>) => void;
  watermark?: string;
}

const StatCard: React.FC<{ icon: React.ReactElement<{ className?: string }>; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-light-bg/30 dark:bg-dark-bg/30 backdrop-blur-sm p-4 rounded-lg border border-accent dark:border-dark-border flex items-center gap-4 shadow-soft hover-themed transition-all">
        <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${color}`}>
            {React.cloneElement(icon, { className: 'w-6 h-6 text-white' })}
        </div>
        <div>
            <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-black dark:text-dark-text-secondary">{title}</p>
        </div>
    </div>
);

const UserManagement: React.FC<Pick<AdminPanelProps, 'allUsers' | 'onAddUser' | 'onUpdateUser' | 'onDeleteUser'> & { subscriptionTiers: SubscriptionTier[] }> = (props) => {
    const { allUsers, onAddUser, onUpdateUser, onDeleteUser, subscriptionTiers } = props;
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [subscription, setSubscription] = useState<SubscriptionTier>('Free');
    const [subscriptionExpires, setSubscriptionExpires] = useState('');

    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setEmail(user.email);
        setRole(user.role);
        setSubscription(user.subscription);
        setSubscriptionExpires(user.subscriptionExpires || '');
        setPassword('');
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingUser(null);
        setEmail('');
        setPassword('');
        setRole('user');
        setSubscription('Free');
        setSubscriptionExpires('');
        setIsModalOpen(true);
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const userData = { email, role, subscription, subscriptionExpires: subscriptionExpires || undefined };
        if (editingUser) {
            onUpdateUser({ ...userData, id: editingUser.id }, password || undefined);
        } else {
            onAddUser(userData, password);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            onDeleteUser(userId);
        }
    };
    
    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const filteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                    <UsersIcon className="w-5 h-5 text-black-blue dark:text-accent"/>User Accounts
                </h3>
                <button onClick={openModalForNew} className="px-4 py-2 bg-primary-blue dark:bg-accent text-white text-sm rounded-md btn-hover-themed transition-all font-bold">Add New User</button>
            </div>
            <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-dark-text-secondary pointer-events-none" />
                <input 
                    type="search"
                    placeholder="Filter by user email..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full p-2 pl-10 bg-light-bg/30 dark:bg-dark-bg/30 border border-accent dark:border-dark-border rounded-md hover-themed transition-all focus:ring-2 focus:ring-accent focus:border-transparent backdrop-blur-sm text-black dark:text-white"
                />
            </div>
            <div className="overflow-x-auto border border-accent dark:border-dark-border rounded-lg bg-white/30 dark:bg-dark-surface/30 backdrop-blur-md">
                <table className="w-full text-left text-sm">
                    <thead className="bg-light-bg/40 dark:bg-dark-bg/40">
                        <tr>
                            <th className="p-3 font-semibold uppercase tracking-widest text-[10px] text-black dark:text-white">Email</th>
                            <th className="p-3 font-semibold uppercase tracking-widest text-[10px] text-black dark:text-white">Role</th>
                            <th className="p-3 font-semibold uppercase tracking-widest text-[10px] text-black dark:text-white">Subscription</th>
                            <th className="p-3 font-semibold uppercase tracking-widest text-[10px] text-black dark:text-white">Expires On</th>
                            <th className="p-3 font-semibold uppercase tracking-widest text-[10px] text-right text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-accent dark:divide-dark-border text-black dark:text-white">
                        {filteredUsers.map(user => {
                            const todayStr = getTodayString();
                            const isExpired = user.subscriptionExpires && user.subscriptionExpires < todayStr;
                            return (
                                <tr key={user.id} className={`${isExpired ? 'bg-red-100/30 dark:bg-red-900/10' : ''} hover:bg-zinc-100/20 dark:hover:bg-dark-bg/20 transition-colors`}>
                                    <td className="p-3 font-medium">{user.email}</td>
                                    <td className="p-3 capitalize">{user.role}</td>
                                    <td className="p-3 font-bold">
                                        {user.subscription}
                                        {isExpired && <span className="ml-2 text-red-500 font-black">(EXPIRED)</span>}
                                    </td>
                                    <td className={`p-3 ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                                        {user.subscriptionExpires ? new Date(`${user.subscriptionExpires}T00:00:00`).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="p-3 text-right space-x-3">
                                        <button onClick={() => openModalForEdit(user)} className="text-black-blue dark:text-accent font-black hover:underline transition-all uppercase text-xs">Edit</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 font-black hover:underline transition-all uppercase text-xs">Delete</button>
                                    </td>
                                </tr>
                            )
                        })}
                         {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-black dark:text-dark-text-secondary">
                                    No matching users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-md p-6 border border-accent" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-black dark:text-white">
                             <CogIcon className="w-5 h-5 text-accent"/>
                             {editingUser ? 'Edit User Profile' : 'Create New Account'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md hover-themed transition-all text-black dark:text-white"/>
                            </div>
                             <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Password {editingUser ? '(leave blank to keep unchanged)' : ''}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUser} className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md hover-themed transition-all text-black dark:text-white"/>
                            </div>
                             <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Role</label>
                                <select value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')} className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md text-black dark:text-white">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Subscription Tier</label>
                                <select value={subscription} onChange={e => setSubscription(e.target.value as SubscriptionTier)} className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md text-black dark:text-white">
                                    {subscriptionTiers.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Subscription Expiration</label>
                                <input type="date" value={subscriptionExpires} onChange={e => setSubscriptionExpires(e.target.value)} className="w-full p-2 bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border rounded-md text-black dark:text-white" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200/40 dark:bg-dark-border/40 rounded-md hover:bg-gray-300 transition-colors font-bold text-sm text-black dark:text-white">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-blue/80 dark:bg-accent/80 text-white rounded-md btn-hover-themed transition-all font-bold text-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

const RequestManagement: React.FC<Pick<AdminPanelProps, 'subscriptionRequests' | 'onApproveRequest' | 'onDenyRequest'>> = ({ subscriptionRequests, onApproveRequest, onDenyRequest }) => {
    return (
        <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white mb-4">
                <ClipboardDocumentListIcon className="w-5 h-5 text-black-blue dark:text-accent"/>Pending User Requests
            </h3>
            {subscriptionRequests.length > 0 ? (
                <div className="overflow-x-auto border border-accent dark:border-dark-border rounded-lg bg-white/30 dark:bg-dark-surface/30 backdrop-blur-md">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-light-bg/40 dark:bg-dark-bg/40 text-black dark:text-white">
                            <tr>
                                <th className="p-3 font-black uppercase tracking-widest text-[10px]">Email</th>
                                <th className="p-3 font-black uppercase tracking-widest text-[10px]">Requested Tier</th>
                                <th className="p-3 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent dark:divide-dark-border text-black dark:text-white">
                            {subscriptionRequests.map(req => (
                                <tr key={req.id} className="hover:bg-zinc-100/20 dark:hover:bg-dark-bg/20 transition-colors">
                                    <td className="p-3 font-medium">{req.email}</td>
                                    <td className="p-3 font-bold">{req.requestedTier}</td>
                                    <td className="p-3 text-right space-x-3">
                                        <button onClick={() => onApproveRequest(req.id)} className="text-green-600 font-black hover:underline uppercase text-xs">Approve</button>
                                        <button onClick={() => onDenyRequest(req.id)} className="text-red-500 font-black hover:underline uppercase text-xs">Deny</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-black dark:text-dark-text-secondary py-12 bg-white/10 dark:bg-dark-bg/10 rounded-xl border-2 border-dashed border-accent">No pending requests at this time.</p>
            )}
        </section>
    );
};

const ActivityFeed: React.FC<{ history: ClassificationHistoryItem[] }> = ({ history }) => {
    const [filter, setFilter] = useState('');
    const filteredHistory = history.filter(item => 
        item.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
        item.query.toLowerCase().includes(filter.toLowerCase())
    );

    return (
         <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white mb-4">
                <HistoryIcon className="w-5 h-5 text-black-blue dark:text-accent"/>Global Activity Feed
            </h3>
            <div className="relative mb-4">
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-dark-text-secondary pointer-events-none" />
                <input 
                    type="search"
                    placeholder="Filter by user email or query..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full p-2 pl-10 bg-light-bg/30 dark:bg-dark-bg/30 border border-accent dark:border-dark-border rounded-md hover-themed transition-all backdrop-blur-sm text-black dark:text-white"
                />
            </div>
            <div className="overflow-auto border border-accent dark:border-dark-border rounded-lg max-h-[60vh] bg-white/30 dark:bg-dark-surface/30 backdrop-blur-md">
                <table className="w-full text-left text-sm">
                    <thead className="bg-light-bg/40 dark:bg-dark-bg/40 sticky top-0 text-black dark:text-white">
                        <tr>
                            <th className="p-3 font-black uppercase tracking-widest text-[10px]">Timestamp</th>
                            <th className="p-3 font-black uppercase tracking-widest text-[10px]">User</th>
                            <th className="p-3 font-black uppercase tracking-widest text-[10px]">Type</th>
                            <th className="p-3 font-black uppercase tracking-widest text-[10px]">Query</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-accent dark:divide-dark-border text-black dark:text-white">
                        {filteredHistory.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-100/20 dark:hover:bg-dark-bg/20 transition-colors">
                                <td className="p-3 whitespace-nowrap font-mono text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                                <td className="p-3 font-medium">{item.userEmail}</td>
                                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.viewType === 'classification' ? 'bg-blue-100/40 text-blue-700' : 'bg-orange-100/40 text-orange-700'}`}>{item.viewType}</span></td>
                                <td className="p-3 truncate max-w-xs">{item.query}</td>
                            </tr>
                        ))}
                         {filteredHistory.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-black dark:text-dark-text-secondary">No matching activity found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

const ServerManagement: React.FC<{ addLog: (message: string) => void }> = ({ addLog }) => {
    const [cpu, setCpu] = useState(0);
    const [mem, setMem] = useState(0);
    const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCpu(Math.floor(Math.random() * (60 - 20 + 1) + 20));
            setMem(Math.floor(Math.random() * (75 - 40 + 1) + 40));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (action: string) => {
        setIsActionInProgress(action);
        addLog(`ADMIN: Initiating system procedure - [${action.toUpperCase()}]`);
        
        // Simulated process duration
        const procedureTime = action === 'Run Diagnostics' ? 3000 : 1500;
        
        await new Promise(resolve => setTimeout(resolve, procedureTime));
        
        addLog(`SUCCESS: [${action.toUpperCase()}] completed with status 200 OK.`);
        setIsActionInProgress(null);
        alert(`${action} procedure successfully executed.`);
    };

    return (
        <section>
             <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white mb-4">
                <ServerIcon className="w-5 h-5 text-black-blue dark:text-accent"/>Server & Database
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-accent dark:border-dark-border rounded-lg space-y-4 bg-white/10 dark:bg-dark-bg/10 backdrop-blur-sm hover-themed transition-all">
                    <h4 className="font-black text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Live Server Metrics</h4>
                    <div className="text-black dark:text-white">
                        <div className="flex justify-between mb-1"><label className="text-xs font-bold">CPU Usage</label> <span className="text-xs font-mono">{cpu}%</span></div>
                        <div className="w-full bg-light-bg/30 dark:bg-dark-bg/30 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{width: `${cpu}%`}}></div></div>
                    </div>
                     <div className="text-black dark:text-white">
                        <div className="flex justify-between mb-1"><label className="text-xs font-bold">Memory Usage</label> <span className="text-xs font-mono">{mem}%</span></div>
                        <div className="w-full bg-light-bg/30 dark:bg-dark-bg/30 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.5)]" style={{width: `${mem}%`}}></div></div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-black dark:text-white">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                        <p className="text-xs font-bold">Database Cluster: <span className="text-green-500 font-black">STABLE</span></p>
                    </div>
                </div>
                 <div className="p-5 border border-accent dark:border-dark-border rounded-lg space-y-3 bg-white/10 dark:bg-dark-bg/10 backdrop-blur-sm text-black dark:text-white">
                    <h4 className="font-black text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Administrative Overrides</h4>
                    <button 
                        disabled={!!isActionInProgress}
                        onClick={() => handleAction('Restart Server')} 
                        className={`w-full p-2.5 text-left flex items-center justify-between bg-light-bg/30 dark:bg-dark-bg/30 hover-themed rounded-md transition-all font-bold text-xs backdrop-blur-sm ${isActionInProgress === 'Restart Server' ? 'opacity-50 animate-pulse' : ''}`}
                    >
                        <div className="flex items-center gap-2"><RestartIcon className="w-4 h-4 text-red-500"/>Restart Cluster</div>
                        <span className="text-[10px] text-zinc-400">{isActionInProgress === 'Restart Server' ? 'BOOTING...' : 'REBOOT'}</span>
                    </button>
                    <button 
                        disabled={!!isActionInProgress}
                        onClick={() => handleAction('Run Diagnostics')} 
                        className={`w-full p-2.5 text-left flex items-center justify-between bg-light-bg/30 dark:bg-dark-bg/30 hover-themed rounded-md transition-all font-bold text-xs backdrop-blur-sm ${isActionInProgress === 'Run Diagnostics' ? 'opacity-50 animate-pulse' : ''}`}
                    >
                        <div className="flex items-center gap-2"><BeakerIcon className="w-4 h-4 text-yellow-500"/>Run System Check</div>
                        <span className="text-[10px] text-zinc-400">{isActionInProgress === 'Run Diagnostics' ? 'RUNNING...' : 'DIAG'}</span>
                    </button>
                    <button 
                        disabled={!!isActionInProgress}
                        onClick={() => handleAction('Clear Application Cache')} 
                        className={`w-full p-2.5 text-left flex items-center justify-between bg-light-bg/30 dark:bg-dark-bg/30 hover-themed rounded-md transition-all font-bold text-xs backdrop-blur-sm ${isActionInProgress === 'Clear Application Cache' ? 'opacity-50 animate-pulse' : ''}`}
                    >
                        <div className="flex items-center gap-2"><TrashIcon className="w-4 h-4 text-blue-500"/>Purge Memory</div>
                        <span className="text-[10px] text-zinc-400">{isActionInProgress === 'Clear Application Cache' ? 'PURGING...' : 'CLEAN'}</span>
                    </button>
                    <button 
                        disabled={!!isActionInProgress}
                        onClick={() => handleAction('Backup Database')} 
                        className={`w-full p-2.5 text-left flex items-center justify-between bg-light-bg/30 dark:bg-dark-bg/30 hover-themed rounded-md transition-all font-bold text-xs backdrop-blur-sm ${isActionInProgress === 'Backup Database' ? 'opacity-50 animate-pulse' : ''}`}
                    >
                        <div className="flex items-center gap-2"><DatabaseIcon className="w-4 h-4 text-green-500"/>Clone Instance</div>
                        <span className="text-[10px] text-zinc-400">{isActionInProgress === 'Backup Database' ? 'BACKING UP...' : 'BACKUP'}</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

const TierManagement: React.FC<{
    currentFeatures: Record<SubscriptionTier, UserFeatures>;
    onSave: (newFeatures: Record<SubscriptionTier, UserFeatures>) => void;
}> = ({ currentFeatures, onSave }) => {
    const [editedFeatures, setEditedFeatures] = useState(currentFeatures);

    useEffect(() => {
        setEditedFeatures(currentFeatures);
    }, [currentFeatures]);

    const handleNumericChange = (tier: SubscriptionTier, type: 'text' | 'image', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setEditedFeatures(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                queryLimits: { ...prev[tier].queryLimits, [type]: numValue }
            }
        }));
    };
    
    const handleUnlimitedToggle = (tier: SubscriptionTier, type: 'text' | 'image', isUnlimited: boolean) => {
        setEditedFeatures(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                queryLimits: { ...prev[tier].queryLimits, [type]: isUnlimited ? Infinity : 0 }
            }
        }));
    };

    const handleFeatureToggle = (tier: SubscriptionTier, feature: 'canUseVoice' | 'canUploadImage', isEnabled: boolean) => {
         setEditedFeatures(prev => ({
            ...prev,
            [tier]: { ...prev[tier], [feature]: isEnabled }
        }));
    };

    const tiers = Object.keys(editedFeatures) as SubscriptionTier[];

    return (
        <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white mb-2">
                <CogIcon className="w-5 h-5 text-black-blue dark:text-accent"/>Subscription Tier Management
            </h3>
            <p className="text-sm text-black dark:text-dark-text-secondary mb-4">
                Define the features and usage limits for each subscription tier.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiers.map(tier => {
                    const features = editedFeatures[tier];
                    const isTextUnlimited = features.queryLimits.text === Infinity;
                    const isImageUnlimited = features.queryLimits.image === Infinity;
                    
                    return (
                        <div key={tier} className="p-5 border border-accent dark:border-dark-border rounded-lg bg-light-bg/30 dark:bg-dark-bg/20 backdrop-blur-sm hover-themed transition-all text-black dark:text-white">
                            <h4 className="font-black text-sm uppercase tracking-widest mb-4 text-black-blue dark:text-accent border-b border-accent pb-2">{tier} Status</h4>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold mb-2">Daily Text Queries</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            value={isTextUnlimited ? '' : features.queryLimits.text}
                                            onChange={e => handleNumericChange(tier, 'text', e.target.value)}
                                            disabled={isTextUnlimited}
                                            className="w-20 p-1.5 bg-light-surface/40 dark:bg-dark-surface/40 border border-accent dark:border-dark-border rounded transition-all hover-themed text-black dark:text-white"
                                        />
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={isTextUnlimited}
                                                onChange={e => handleUnlimitedToggle(tier, 'text', e.target.checked)}
                                                className="w-3.5 h-3.5 rounded text-black-blue"
                                            />
                                            <span>Unlimited</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold mb-2">Daily Image Queries</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            value={isImageUnlimited ? '' : features.queryLimits.image}
                                            onChange={e => handleNumericChange(tier, 'image', e.target.value)}
                                            disabled={isImageUnlimited}
                                            className="w-20 p-1.5 bg-light-surface/40 dark:bg-dark-surface/40 border border-accent dark:border-dark-border rounded transition-all hover-themed text-black dark:text-white"
                                        />
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={isImageUnlimited}
                                                onChange={e => handleUnlimitedToggle(tier, 'image', e.target.checked)}
                                                className="w-3.5 h-3.5 rounded text-black-blue"
                                            />
                                            <span>Unlimited</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                                        <input type="checkbox" checked={features.canUseVoice} onChange={e => handleFeatureToggle(tier, 'canUseVoice', e.target.checked)} className="w-3.5 h-3.5 rounded"/>
                                        <span>Allow Voice Interactions</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                                        <input type="checkbox" checked={features.canUploadImage} onChange={e => handleFeatureToggle(tier, 'canUploadImage', e.target.checked)} className="w-3.5 h-3.5 rounded"/>
                                        <span>Allow Image Uploads</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-accent dark:border-dark-border">
                <button type="button" onClick={() => setEditedFeatures(currentFeatures)} className="px-4 py-2 bg-gray-200/30 dark:bg-dark-border/30 rounded-md font-bold text-sm transition-all hover:bg-gray-300 text-black dark:text-white">Discard</button>
                <button type="button" onClick={() => { onSave(editedFeatures); alert('Settings Applied.')}} className="px-6 py-2 bg-primary-blue/80 dark:bg-accent/80 text-white rounded-md font-black uppercase tracking-widest text-xs btn-hover-themed transition-all">Save Changes</button>
            </div>
        </section>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const {
    isOpen, onClose, classificationPrompt, setClassificationPrompt,
    lookupPrompt, setLookupPrompt, expiredHtsCodes, setExpiredHtsCodes,
    aiBehavior, setAiBehavior, temperature, setTemperature, logs, clearLogs,
    allUsers, onAddUser, onUpdateUser, onDeleteUser, addLog,
    subscriptionRequests, onApproveRequest, onDenyRequest, activityHistory,
    subscriptionFeatures, onUpdateSubscriptionFeatures, watermark
  } = props;
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'settings' | 'activity' | 'server' | 'logs' | 'tiers'>('dashboard');
  const [logFilter, setLogFilter] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen && activeTab === 'logs') {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    addLog("Admin is saving AI settings...");
    try {
      await saveString('classificationPrompt', classificationPrompt);
      await saveString('lookupPrompt', lookupPrompt);
      await saveData('temperature', temperature);
      await saveData('aiBehavior', aiBehavior);
      alert('AI settings applied successfully.');
      addLog("AI settings saved successfully.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save settings:', error);
      addLog(`Error saving settings: ${errorMessage}`);
      alert('An error occurred while saving the settings.');
    }
  };

  const TABS = {
      dashboard: { label: 'Intelligence', icon: <DashboardIcon className="w-5 h-5"/> },
      users: { label: 'Personnel', icon: <UsersIcon className="w-5 h-5"/> },
      tiers: { label: 'Quota Mgmt', icon: <CogIcon className="w-5 h-5"/> },
      requests: { label: 'Requests', icon: <ClipboardDocumentListIcon className="w-5 h-5"/> },
      activity: { label: 'Operation Log', icon: <HistoryIcon className="w-5 h-5"/> },
      settings: { label: 'Brain Config', icon: <BeakerIcon className="w-5 h-5"/> },
      server: { label: 'Hardware', icon: <ServerIcon className="w-5 h-5"/> },
      logs: { label: 'System Stream', icon: <TerminalIcon className="w-5 h-5"/> },
  }
  
  const usersByTier: Record<SubscriptionTier, number> = allUsers.reduce((acc, user) => {
      const tier = user.subscription as SubscriptionTier;
      if (!acc[tier]) {
          acc[tier] = 0;
      }
      acc[tier]++;
      return acc;
  }, {} as Record<SubscriptionTier, number>);

  const tierColors: Record<SubscriptionTier, string> = {
      Free: 'bg-slate-400',
      Basic: 'bg-blue-500',
      Pro: 'bg-indigo-500',
      Enterprise: 'bg-purple-500'
  }
  
  const subscriptionTiers = Object.keys(subscriptionFeatures) as SubscriptionTier[];
  
  const filteredLogs = logs.filter(log => log.toLowerCase().includes(logFilter.toLowerCase()));

  const renderContent = () => {
      return (
          <div className="relative z-10">
            <div role="tabpanel" hidden={activeTab !== 'dashboard'}>
                 <div className="space-y-8">
                      <section>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-4">Network Overview</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <StatCard icon={<UsersIcon/>} title="Active Users" value={allUsers.length} color="bg-blue-600" />
                              <StatCard icon={<ClipboardDocumentListIcon />} title="Waiting List" value={subscriptionRequests.length} color="bg-orange-600" />
                              <StatCard icon={<TerminalIcon/>} title="System Events" value={logs.length} color="bg-zinc-600" />
                          </div>
                      </section>
                      <section>
                          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-6">
                            <ChartBarIcon className="w-4 h-4"/>Population Density
                          </h3>
                          <div className="bg-white/20 dark:bg-dark-bg/20 p-6 rounded-2xl border border-accent backdrop-blur-md shadow-soft">
                               <ul className="space-y-6">
                                  {subscriptionTiers.map((tier) => {
                                      const count = usersByTier[tier] || 0;
                                      const percentage = allUsers.length > 0 ? (count / allUsers.length) * 100 : 0;
                                      const tierColor = tierColors[tier];
                                      
                                      return (
                                          <li key={tier}>
                                              <div className="flex justify-between items-center mb-2 font-black text-xs uppercase tracking-widest text-black dark:text-white">
                                                  <span>{tier}</span>
                                                  <span className="text-zinc-500">{count} Nodes ({percentage.toFixed(1)}%)</span>
                                              </div>
                                              <div className="w-full bg-light-surface/30 dark:bg-dark-surface/30 rounded-full h-2 shadow-inner">
                                                  <div className={`${tierColor} h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${percentage}%` }}></div>
                                              </div>
                                          </li>
                                      )
                                  })}
                              </ul>
                          </div>
                      </section>
                  </div>
            </div>
            <div role="tabpanel" hidden={activeTab !== 'users'}>
                {/* Fixed undefined handleDeleteUser by using onDeleteUser from props. */}
                <UserManagement allUsers={allUsers} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} subscriptionTiers={subscriptionTiers} />
            </div>
             <div role="tabpanel" hidden={activeTab !== 'requests'}>
                {/* Fixed undefined variable handleDenyRequest by using onDenyRequest from props */}
                <RequestManagement subscriptionRequests={subscriptionRequests} onApproveRequest={onApproveRequest} onDenyRequest={onDenyRequest} />
            </div>
             <div role="tabpanel" hidden={activeTab !== 'tiers'}>
                <TierManagement
                    currentFeatures={subscriptionFeatures}
                    onSave={onUpdateSubscriptionFeatures}
                />
            </div>
            <div role="tabpanel" hidden={activeTab !== 'activity'}>
                <ActivityFeed history={activityHistory} />
            </div>
             <div role="tabpanel" hidden={activeTab !== 'server'}>
                <ServerManagement addLog={addLog} />
            </div>
            <div role="tabpanel" hidden={activeTab !== 'settings'}>
                 <div className="space-y-8">
                      <section>
                          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-4"><BeakerIcon className="w-4 h-4"/>Algorithm Controls</h3>
                          <div className="p-6 border border-accent dark:border-dark-border rounded-2xl bg-white/10 dark:bg-dark-bg/10 backdrop-blur-md text-black dark:text-white">
                              <div>
                                  <label htmlFor="temperature" className="block font-black text-xs uppercase tracking-widest mb-3">Synaptic Randomness (Temperature): <span className="text-accent">{temperature.toFixed(1)}</span></label>
                                  <input id="temperature" type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-accent h-1.5 bg-zinc-200/30 dark:bg-zinc-800/30 rounded-lg cursor-pointer" />
                                  <p className="text-[10px] text-zinc-500 mt-3">Determines creativity vs. literal data compliance. 0.3 is optimal for HTS.</p>
                              </div>
                          </div>
                      </section>
                      <section>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-4">Logic Hardcoding</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label htmlFor="classificationPrompt" className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Core Classification Subroutine</label>
                                  <textarea id="classificationPrompt" value={classificationPrompt} onChange={e => setClassificationPrompt(e.target.value)} rows={10} className="w-full p-4 text-xs bg-black/10 dark:bg-black/20 backdrop-blur-sm border border-accent dark:border-dark-border rounded-xl font-mono focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-black dark:text-white"></textarea>
                              </div>
                              <div className="space-y-2">
                                  <label htmlFor="lookupPrompt" className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Core Lookup Subroutine</label>
                                  <textarea id="lookupPrompt" value={lookupPrompt} onChange={e => setLookupPrompt(e.target.value)} rows={10} className="w-full p-4 text-xs bg-black/10 dark:bg-black/20 backdrop-blur-sm border border-accent dark:border-dark-border rounded-xl font-mono focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-black dark:text-white"></textarea>
                              </div>
                          </div>
                      </section>
                      <button onClick={handleSaveSettings} className="px-8 py-3 bg-primary-blue/80 dark:bg-accent/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-white rounded-xl font-black uppercase tracking-widest text-xs btn-hover-themed transition-all">Compile Brain Changes</button>
                  </div>
            </div>
            <div role="tabpanel" hidden={activeTab !== 'logs'}>
                 <section>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400"><TerminalIcon className="w-4 h-4"/>Operational Stream</h3>
                          <button onClick={clearLogs} className="text-[10px] font-black uppercase text-red-500 hover:underline">Flush Logs</button>
                      </div>
                      <div className="bg-black/60 text-green-400 font-mono text-[10px] p-6 rounded-2xl h-[55vh] overflow-y-scroll border border-accent shadow-inner backdrop-blur-md">
                          {filteredLogs.length > 0 ? filteredLogs.map((log, i) => <p key={i} className="mb-1 leading-relaxed"><span className="opacity-40">{`[${i.toString().padStart(3, '0')}]`}</span> {log}</p>) : <p className="animate-pulse">Waiting for system traffic...</p>}
                          <div ref={logsEndRef} />
                      </div>
                  </section>
            </div>
          </div>
      );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-panel-title"
        className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg text-zinc-900 rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col border border-accent dark:border-dark-border overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Admin Watermark */}
        <div className="watermark-bg" style={{ backgroundImage: `url(${watermark})` }}></div>

        <header className="p-6 border-b border-accent dark:border-dark-border flex justify-between items-center flex-shrink-0 bg-white/30 dark:bg-dark-surface/30 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-2xl"><CogIcon className="w-8 h-8 text-accent animate-spin-slow"/></div>
                <div>
                    <h2 id="admin-panel-title" className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Admin Control Center</h2>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Restricted Access - Terminal v2.05</p>
                </div>
            </div>
            <button onClick={onClose} aria-label="Close admin panel" className="text-zinc-400 hover:text-red-500 transition-all hover:scale-110"><XCircleIcon className="w-10 h-10"/></button>
        </header>
        
        <div className="flex-1 flex overflow-hidden relative z-10">
            <nav className="w-72 p-6 border-r border-accent dark:border-dark-border flex-shrink-0 overflow-y-auto bg-white/10 dark:bg-black/10 backdrop-blur-sm" role="tablist" aria-label="Admin sections">
                <ul className="space-y-3">
                    {Object.entries(TABS).map(([key, {label, icon}]) => {
                         const requestCount = key === 'requests' ? subscriptionRequests.length : 0;
                         return (
                         <li key={key}>
                             <button 
                                 id={`tab-${key}`}
                                 role="tab"
                                 aria-selected={activeTab === key}
                                 aria-controls={`tabpanel-${key}`}
                                 onClick={() => setActiveTab(key as any)}
                                 className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === key ? 'bg-primary-blue/70 dark:bg-accent/70 text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/30 dark:hover:bg-zinc-800/30 hover-themed'}`}
                             >
                                <div className="flex items-center gap-3">
                                     {icon}
                                     <span>{label}</span>
                                </div>
                                {requestCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black rounded-lg px-2 py-0.5 animate-pulse">{requestCount}</span>}
                             </button>
                         </li>
                         );
                    })}
                </ul>
            </nav>
            <main className="p-10 flex-1 overflow-y-auto custom-scrollbar bg-white/5 dark:bg-black/5 backdrop-blur-sm">
                {renderContent()}
            </main>
        </div>
         {/* Powered By Footer Attribution - Fixed Bottom Right of Main Content */}
                    <div className="absolute bottom-2 right-4 z-50 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-all duration-300">
                        <div className="px-3 py-1.5 rounded-lg bg-white/30 dark:bg-black/10 backdrop-blur-md border border-accent/20 text-zinc-500 dark:text-zinc-400 shadow-sm">
                            Powered By Junaid Abbasi
                        </div>
                    </div>
      </div>
    </div>
  );
};

export default AdminPanel;
