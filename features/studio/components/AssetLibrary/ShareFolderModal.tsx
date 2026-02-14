
import React, { useState, useEffect } from 'react';
import { useAssetStore, AssetPermission } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';

export const ShareFolderModal: React.FC = () => {
  const { assets, sharingAssetId, setSharingAssetId, updateAssetPermissions } = useAssetStore();
  const asset = assets.find(a => a.id === sharingAssetId);

  const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>('private');
  const [people, setPeople] = useState<AssetPermission[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (asset) {
      setVisibility(asset.visibility || 'private');
      setPeople(asset.permissions || []);
      setNewEmail('');
    }
  }, [asset]);

  if (!sharingAssetId || !asset) return null;

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (email && !people.some(p => p.email === email)) {
      setPeople([...people, { email, role: 'viewer' }]);
      setNewEmail('');
    }
  };

  const handleRemovePerson = (email: string) => {
    setPeople(people.filter(p => p.email !== email));
  };

  const handleRoleChange = (email: string, role: 'viewer' | 'editor') => {
    setPeople(people.map(p => p.email === email ? { ...p, role } : p));
  };

  const handleSave = () => {
    updateAssetPermissions(sharingAssetId, visibility, people);
    setSharingAssetId(null);
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 px-4"
      onClick={() => setSharingAssetId(null)}
    >
      <div 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Share Folder</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter truncate max-w-[200px]">{asset.name}</p>
            </div>
          </div>
          <button onClick={() => setSharingAssetId(null)} className="text-zinc-500 hover:text-white transition-colors p-1">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Access Visibility</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['private', 'team', 'public'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${visibility === v ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                >
                  {v === 'private' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {v === 'team' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  {v === 'public' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                  <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Manage People</h4>
            <form onSubmit={handleAddPerson} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:border-blue-500 outline-none transition-colors"
              />
              <Button type="submit" variant="primary" disabled={!newEmail.includes('@')} size="sm" className="px-5 font-bold uppercase tracking-widest text-[10px]">Add</Button>
            </form>

            <div className="space-y-2">
              {people.map(person => (
                <div key={person.email} className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800/50 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">{person.email.charAt(0)}</div>
                    <span className="text-xs font-medium text-zinc-300 truncate">{person.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={person.role}
                      onChange={(e) => handleRoleChange(person.email, e.target.value as any)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-400 outline-none cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button 
                      onClick={() => handleRemovePerson(person.email)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {people.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-zinc-800/30 rounded-2xl bg-black/20">
                   <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest italic">No collaborators added</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3 bg-zinc-900/50">
           <Button variant="secondary" onClick={() => setSharingAssetId(null)} className="flex-1 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
           <Button variant="primary" onClick={handleSave} className="flex-1 font-bold uppercase tracking-widest text-[10px]">Save Permissions</Button>
        </div>
      </div>
    </div>
  );
};
