import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Users, Mail, Crown, Edit2, Eye, Trash2, Shield, Plus, Check, UserPlus } from 'lucide-react'

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: '#FF6C37', icon: Crown, desc: 'Full access, billing, delete workspace' },
  editor: { label: 'Editor', color: '#6C63FF', icon: Edit2, desc: 'Can create, edit, delete collections' },
  viewer: { label: 'Viewer', color: '#00BFA5', icon: Eye, desc: 'Read-only access to collections' },
}

const STATUS_DOTS = {
  online: 'bg-[#49CC90]',
  away: 'bg-[#FCA130]',
  offline: 'bg-[#3D3D3D]',
}

export default function TeamModal() {
  const { activeWorkspace, closeModal, inviteMember, updateMemberRole, removeMember } = useApp()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviteSent, setInviteSent] = useState(false)
  const [tab, setTab] = useState('members') // members | settings

  if (!activeWorkspace) return null

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return
    inviteMember(activeWorkspace.id, inviteEmail.trim())
    setInviteSent(true)
    setTimeout(() => { setInviteSent(false); setInviteEmail('') }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => closeModal('team')}>
      <div
        className="bg-[#252525] border border-[#3D3D3D] rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D3D] bg-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF6C37]/15 flex items-center justify-center">
              <Users size={18} className="text-[#FF6C37]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{activeWorkspace.name}</h2>
              <p className="text-xs text-[#8D8D8D]">{activeWorkspace.members.length} member{activeWorkspace.members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => closeModal('team')} className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors p-1 rounded hover:bg-[#3D3D3D]">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#3D3D3D] px-6">
          {['members', 'settings'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 pt-3 mr-6 text-xs font-medium border-b-2 capitalize transition-colors ${
                tab === t ? 'border-[#FF6C37] text-white' : 'border-transparent text-[#8D8D8D] hover:text-[#CCCCCC]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {tab === 'members' && (
            <>
              {/* Invite section */}
              <div>
                <div className="text-xs font-semibold text-[#CCCCCC] mb-3 flex items-center gap-2">
                  <UserPlus size={13} className="text-[#FF6C37]" />
                  Invite new member
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 focus-within:border-[#FF6C37]/50 transition-colors">
                    <Mail size={13} className="text-[#5A5A5A] shrink-0 mr-2" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="teammate@example.com"
                      className="flex-1 bg-transparent py-2 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none"
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2 text-xs text-[#CCCCCC] outline-none cursor-pointer hover:border-[#FF6C37]/50 transition-colors"
                  >
                    <option value="editor" className="bg-[#252525]">Editor</option>
                    <option value="viewer" className="bg-[#252525]">Viewer</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                      inviteSent
                        ? 'bg-[#49CC90]/20 text-[#49CC90] border border-[#49CC90]/30'
                        : 'bg-[#FF6C37] hover:bg-[#e05a2a] text-white'
                    }`}
                  >
                    {inviteSent ? <><Check size={13} /> Sent!</> : <><Plus size={13} /> Invite</>}
                  </button>
                </div>
                <p className="text-[11px] text-[#5A5A5A] mt-2">
                  They'll receive an email with a link to join this workspace.
                </p>
              </div>

              {/* Members list */}
              <div>
                <div className="text-xs font-semibold text-[#CCCCCC] mb-3">
                  Members ({activeWorkspace.members.length})
                </div>
                <div className="space-y-1 border border-[#3D3D3D] rounded-lg overflow-hidden">
                  {activeWorkspace.members.map((member, i) => {
                    const RoleIcon = ROLE_CONFIG[member.role]?.icon || Shield
                    const roleColor = ROLE_CONFIG[member.role]?.color || '#8D8D8D'
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-[#2D2D2D]/50 transition-colors ${i !== 0 ? 'border-t border-[#3D3D3D]' : ''}`}
                      >
                        <div className="relative shrink-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: member.color + '25', color: member.color }}
                          >
                            {member.initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#252525] ${STATUS_DOTS[member.status || 'online']}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#CCCCCC] flex items-center gap-2">
                            {member.name}
                            {member.id === 'u-1' && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#FF6C37]/15 text-[#FF6C37] rounded-full font-medium">You</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5A5A5A] truncate">{member.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.id === 'u-1' ? (
                            <div
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                              style={{ backgroundColor: roleColor + '15', color: roleColor }}
                            >
                              <RoleIcon size={11} />
                              {ROLE_CONFIG[member.role]?.label}
                            </div>
                          ) : (
                            <select
                              value={member.role}
                              onChange={e => updateMemberRole(activeWorkspace.id, member.id, e.target.value)}
                              className="bg-[#1C1C1C] border border-[#3D3D3D] rounded px-2 py-1 text-xs text-[#CCCCCC] outline-none cursor-pointer hover:border-[#FF6C37]/30 transition-colors"
                            >
                              <option value="editor" className="bg-[#252525]">Editor</option>
                              <option value="viewer" className="bg-[#252525]">Viewer</option>
                            </select>
                          )}
                          {member.id !== 'u-1' && (
                            <button
                              onClick={() => removeMember(activeWorkspace.id, member.id)}
                              className="text-[#5A5A5A] hover:text-[#F93E3E] p-1.5 rounded hover:bg-[#F93E3E]/10 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Role reference */}
              <div className="bg-[#1C1C1C] rounded-lg p-4 border border-[#3D3D3D]">
                <div className="text-xs font-semibold text-[#8D8D8D] mb-3 uppercase tracking-wider">Role permissions</div>
                <div className="space-y-2">
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: cfg.color + '15' }}>
                          <Icon size={12} style={{ color: cfg.color }} />
                        </div>
                        <span className="text-xs font-medium w-14" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[11px] text-[#5A5A5A]">{cfg.desc}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-[#8D8D8D]">Workspace name</label>
                <input
                  defaultValue={activeWorkspace.name}
                  className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2 text-sm text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#8D8D8D]">Description</label>
                <textarea
                  defaultValue={activeWorkspace.description}
                  rows={3}
                  className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2 text-sm text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors">
                  Save Changes
                </button>
                <button className="px-4 py-2 text-xs font-medium text-[#F93E3E] border border-[#F93E3E]/30 hover:bg-[#F93E3E]/10 rounded-lg transition-colors">
                  Delete Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
