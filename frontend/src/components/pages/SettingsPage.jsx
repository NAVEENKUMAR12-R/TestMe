import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Settings, User, Bell, Shield, Palette, Globe, Code2,
  Moon, Sun, Monitor, Check, ChevronRight, Keyboard,
  Download, Upload, Trash2, ExternalLink, AlertTriangle,
  ToggleLeft, ToggleRight, Save, X,
} from 'lucide-react'

const SECTION_ICONS = {
  General:       Settings,
  Appearance:    Palette,
  Shortcuts:     Keyboard,
  Account:       User,
  Notifications: Bell,
  Privacy:       Shield,
  Data:          Download,
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-[#FF6C37]' : 'bg-[#3D3D3D]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#2D2D2D] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#CCCCCC] font-medium">{label}</div>
        {description && <div className="text-xs text-[#5A5A5A] mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const SHORTCUTS = [
  { label: 'Send Request',         keys: ['⌘', 'Enter'] },
  { label: 'New Tab',              keys: ['⌘', 'T'] },
  { label: 'Close Tab',            keys: ['⌘', 'W'] },
  { label: 'Save Request',         keys: ['⌘', 'S'] },
  { label: 'Global Search',        keys: ['⌘', 'K'] },
  { label: 'Toggle Sidebar',       keys: ['⌘', 'B'] },
  { label: 'Toggle Console',       keys: ['⌘', '`'] },
  { label: 'New Collection',       keys: ['⌘', 'Shift', 'N'] },
  { label: 'Open Environment Mgr', keys: ['⌘', 'E'] },
  { label: 'Duplicate Tab',        keys: ['⌘', 'D'] },
  { label: 'Previous Tab',         keys: ['⌘', 'Shift', '['] },
  { label: 'Next Tab',             keys: ['⌘', 'Shift', ']'] },
]

export default function SettingsPage() {
  const { activeWorkspace } = useApp()
  const [activeSection, setActiveSection] = useState('General')
  const [saved, setSaved] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    // General
    defaultMethod: 'GET',
    timeout: '30000',
    maxRedirects: '5',
    followRedirects: true,
    sslVerification: true,
    sendCookies: true,
    encodingUrl: true,
    trimWhitespace: true,
    // Appearance
    theme: 'dark',
    fontSize: '13',
    fontFamily: 'JetBrains Mono',
    compactMode: false,
    showLineNumbers: true,
    wordWrap: false,
    // Notifications
    notifyOnSuccess: false,
    notifyOnError: true,
    notifyOnMonitorAlert: true,
    // Privacy
    telemetry: false,
    crashReports: true,
  })

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = ['General', 'Appearance', 'Shortcuts', 'Account', 'Notifications', 'Privacy', 'Data']

  return (
    <div className="flex-1 flex overflow-hidden bg-[#1C1C1C]">
      {/* Left nav */}
      <div className="w-52 border-r border-[#2D2D2D] flex flex-col shrink-0 py-4">
        <div className="px-4 mb-4">
          <h1 className="text-sm font-semibold text-[#CCCCCC]">Settings</h1>
          <p className="text-xs text-[#5A5A5A] mt-0.5">{activeWorkspace.name}</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {sections.map(s => {
            const Icon = SECTION_ICONS[s]
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  activeSection === s
                    ? 'bg-[#FF6C37]/15 text-[#FF6C37]'
                    : 'text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D]'
                }`}
              >
                <Icon size={14} />
                {s}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">

          {activeSection === 'General' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">General</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Configure request defaults and behavior.</p>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Default HTTP Method" description="Method used when creating a new request">
                  <select
                    value={settings.defaultMethod}
                    onChange={e => update('defaultMethod', e.target.value)}
                    className="h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none"
                  >
                    {['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </SettingRow>
                <SettingRow label="Request Timeout (ms)" description="Maximum time in milliseconds to wait for a response">
                  <input
                    type="number"
                    value={settings.timeout}
                    onChange={e => update('timeout', e.target.value)}
                    className="w-24 h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none"
                  />
                </SettingRow>
                <SettingRow label="Max Redirects" description="Maximum number of redirects to follow">
                  <input
                    type="number"
                    value={settings.maxRedirects}
                    onChange={e => update('maxRedirects', e.target.value)}
                    min={0} max={20}
                    className="w-24 h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none"
                  />
                </SettingRow>
              </div>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Follow Redirects" description="Automatically follow HTTP redirects">
                  <Toggle value={settings.followRedirects} onChange={v => update('followRedirects', v)} />
                </SettingRow>
                <SettingRow label="SSL Certificate Verification" description="Verify SSL certificates for HTTPS requests">
                  <Toggle value={settings.sslVerification} onChange={v => update('sslVerification', v)} />
                </SettingRow>
                <SettingRow label="Send Cookies" description="Send cookies with each request">
                  <Toggle value={settings.sendCookies} onChange={v => update('sendCookies', v)} />
                </SettingRow>
                <SettingRow label="URL Encoding" description="Automatically encode URL parameters">
                  <Toggle value={settings.encodingUrl} onChange={v => update('encodingUrl', v)} />
                </SettingRow>
                <SettingRow label="Trim Whitespace" description="Trim whitespace from header and param values">
                  <Toggle value={settings.trimWhitespace} onChange={v => update('trimWhitespace', v)} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'Appearance' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Appearance</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Customize how PostFlow looks.</p>

              {/* Theme picker */}
              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Theme" description="Choose your preferred color theme">
                  <div className="flex gap-2">
                    {[
                      { id: 'dark',   icon: Moon,    label: 'Dark' },
                      { id: 'light',  icon: Sun,     label: 'Light' },
                      { id: 'system', icon: Monitor,  label: 'System' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => update('theme', id)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs transition-colors ${
                          settings.theme === id
                            ? 'border-[#FF6C37] text-[#FF6C37] bg-[#FF6C37]/10'
                            : 'border-[#3D3D3D] text-[#8D8D8D] hover:border-[#5A5A5A]'
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Font Size" description="Editor font size in pixels">
                  <select
                    value={settings.fontSize}
                    onChange={e => update('fontSize', e.target.value)}
                    className="h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none"
                  >
                    {['11','12','13','14','15','16'].map(s => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                </SettingRow>
                <SettingRow label="Font Family" description="Monospace font used in editors">
                  <select
                    value={settings.fontFamily}
                    onChange={e => update('fontFamily', e.target.value)}
                    className="h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none"
                  >
                    {['JetBrains Mono','Fira Code','Cascadia Code','Consolas','Menlo'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </SettingRow>
              </div>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Compact Mode" description="Reduce spacing for a denser layout">
                  <Toggle value={settings.compactMode} onChange={v => update('compactMode', v)} />
                </SettingRow>
                <SettingRow label="Show Line Numbers" description="Show line numbers in the response body editor">
                  <Toggle value={settings.showLineNumbers} onChange={v => update('showLineNumbers', v)} />
                </SettingRow>
                <SettingRow label="Word Wrap" description="Wrap long lines in the response viewer">
                  <Toggle value={settings.wordWrap} onChange={v => update('wordWrap', v)} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'Shortcuts' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Keyboard Shortcuts</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">All available keyboard shortcuts in PostFlow.</p>
              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] divide-y divide-[#2D2D2D] overflow-hidden">
                {SHORTCUTS.map(({ label, keys }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-[#CCCCCC]">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-[11px] text-[#8D8D8D] font-mono">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'Account' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Account</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Manage your profile and account details.</p>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] p-5 mb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ backgroundColor: '#FF6C37', color: 'white' }}
                  >
                    Y
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">You</div>
                    <div className="text-xs text-[#5A5A5A]">you@company.com</div>
                    <div className="mt-1.5 px-2 py-0.5 text-[10px] font-medium bg-[#FF6C37]/15 text-[#FF6C37] rounded-full w-fit">
                      Pro Plan
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                {[
                  ['Display Name', 'You'],
                  ['Email',        'you@company.com'],
                ].map(([label, value]) => (
                  <SettingRow key={label} label={label}>
                    <input
                      defaultValue={value}
                      className="w-48 h-8 px-3 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50"
                    />
                  </SettingRow>
                ))}
              </div>

              <div className="bg-[#252525] rounded-xl border border-[#F93E3E]/30 px-4">
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-[#F93E3E]" />
                    <span className="text-sm font-semibold text-[#F93E3E]">Danger Zone</span>
                  </div>
                  <p className="text-xs text-[#5A5A5A] mb-3">Once you delete your account, there is no going back.</p>
                  <button className="px-3 py-1.5 text-xs font-medium text-[#F93E3E] border border-[#F93E3E]/40 rounded hover:bg-[#F93E3E]/10 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Notifications</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Configure when and how you get notified.</p>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Notify on Success" description="Show notification when a request succeeds">
                  <Toggle value={settings.notifyOnSuccess} onChange={v => update('notifyOnSuccess', v)} />
                </SettingRow>
                <SettingRow label="Notify on Error" description="Show notification when a request fails">
                  <Toggle value={settings.notifyOnError} onChange={v => update('notifyOnError', v)} />
                </SettingRow>
                <SettingRow label="Monitor Alerts" description="Get notified when a monitor starts failing">
                  <Toggle value={settings.notifyOnMonitorAlert} onChange={v => update('notifyOnMonitorAlert', v)} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'Privacy' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Privacy & Security</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Control your privacy and data sharing preferences.</p>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] px-4 mb-5">
                <SettingRow label="Usage Telemetry" description="Send anonymous usage data to help improve PostFlow">
                  <Toggle value={settings.telemetry} onChange={v => update('telemetry', v)} />
                </SettingRow>
                <SettingRow label="Crash Reports" description="Automatically send crash reports">
                  <Toggle value={settings.crashReports} onChange={v => update('crashReports', v)} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'Data' && (
            <div>
              <h2 className="text-base font-semibold text-[#CCCCCC] mb-1">Data & Export</h2>
              <p className="text-xs text-[#5A5A5A] mb-6">Import and export your PostFlow data.</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Download, label: 'Export Collections', desc: 'Export as Postman-compatible JSON', color: '#49CC90' },
                  { icon: Upload,   label: 'Import Collections', desc: 'Import from Postman, Insomnia, OpenAPI', color: '#6C63FF' },
                  { icon: Download, label: 'Export Environments', desc: 'Export environment variables', color: '#FCA130' },
                  { icon: Trash2,   label: 'Clear All History', desc: 'Remove all request history', color: '#F93E3E' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <button
                    key={label}
                    className="flex items-start gap-3 p-4 bg-[#252525] border border-[#2D2D2D] rounded-xl hover:border-[#3D3D3D] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#CCCCCC]">{label}</div>
                      <div className="text-[11px] text-[#5A5A5A] mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#252525] rounded-xl border border-[#2D2D2D] p-4">
                <div className="text-xs font-semibold text-[#CCCCCC] mb-3">About PostFlow</div>
                <div className="space-y-1.5">
                  {[
                    ['Version',   '1.0.0'],
                    ['Build',     '2026.03.25'],
                    ['Platform',  'Web'],
                    ['License',   'MIT'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-[#5A5A5A]">{k}</span>
                      <span className="text-[#CCCCCC]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          {activeSection !== 'Shortcuts' && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  saved
                    ? 'bg-[#49CC90]/20 text-[#49CC90] border border-[#49CC90]/30'
                    : 'bg-[#FF6C37] hover:bg-[#e05a2a] text-white'
                }`}
              >
                {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
