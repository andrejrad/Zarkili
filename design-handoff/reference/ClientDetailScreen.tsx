/**
 * Client Detail — G-4-detail
 * Frames: G-4-detail-default | G-4-detail-loading | G-4-detail-error
 * Device: iPhone 14 390×844 | iPad 768×1024 (responsive)
 */
import { useState } from 'react';
import {
  ChevronLeft, Phone, MessageCircle, Mail,
  WifiOff, Calendar, Plus, Camera,
  CheckCircle2, Clock, Star,
  Sparkles, StickyNote, Image, ShieldCheck,
  AlertTriangle, CalendarDays,
} from 'lucide-react';
import { avatarColor, TierBadge } from './ClientLookupScreen';
import type { ClientTier } from './ClientLookupScreen';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const T = {
  bg:       '#F2EDDD',
  surface:  '#FFFFFF',
  primary:  '#E3A9A0',
  secondary:'#D1BFB3',
  accent:   '#BBEDDA',
  accentFg: '#2D4A42',
  fg:       '#1A1A1A',
  muted:    '#6B6B6B',
  border:   '#E5E0D1',
  skel:     '#F5F5F5',
  warning:  '#FF9800',
  error:    '#F44336',
  success:  '#4CAF50',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
type DetailTab  = 'overview' | 'history' | 'notes' | 'loyalty' | 'photos' | 'consents';
type FrameState = 'default' | 'loading' | 'error';
type ApptStatus = 'completed' | 'no-show' | 'cancelled';

interface Appointment {
  id:       string;
  date:     string;
  service:  string;
  stylist:  string;
  amount:   number;
  status:   ApptStatus;
}

interface Note {
  id:      string;
  author:  string;
  date:    string;
  content: string;
}

interface LoyaltyTx {
  id:     string;
  date:   string;
  desc:   string;
  points: number;
}

interface ConsentForm {
  id:     string;
  name:   string;
  signed: boolean;
  date?:  string;
}

interface ClientDetail {
  id:               string;
  name:             string;
  initials:         string;
  tier:             ClientTier;
  phone:            string;
  email:            string;
  isVIP:            boolean;
  visits:           number;
  lifetimeValue:    number;
  lastVisit:        string;
  noShows:          number;
  since:            string;
  preferredStylists:string[];
  preferredServices:string[];
  allergies?:       string;
  points:           number;
  history:          Appointment[];
  notes:            Note[];
  loyalty:          LoyaltyTx[];
  consents:         ConsentForm[];
  upcomingAppt?:    { date: string; service: string; stylist: string; time: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtLTV(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${v}`;
}

function fmtDateShort(s: string): string {
  // MM/DD/YYYY → Apr 20, '25
  const [m, d, y] = s.split('/');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, '${y.slice(2)}`;
}

function tierProgress(ltv: number, tier: ClientTier): { pct: number; next: string | null } {
  if (tier === 'Platinum') return { pct: 100, next: null };
  if (tier === 'Gold')     return { pct: Math.min(100, ((ltv-1500)/(3500-1500))*100), next: 'Platinum' };
  if (tier === 'Silver')   return { pct: Math.min(100, ((ltv-500) /(1500-500)) *100), next: 'Gold'     };
  return                          { pct: Math.min(100, (ltv / 500) * 100),           next: 'Silver'    };
}

// ─── Mock detail data ─────────────────────────────────────────────────────────
const PRIYA: ClientDetail = {
  id: 'c3',
  name: 'Priya Patel',
  initials: 'PP',
  tier: 'Platinum',
  phone: '(213) 555-0103',
  email: 'priya.p@email.com',
  isVIP: true,
  visits: 48,
  lifetimeValue: 5620,
  lastVisit: '04/20/2025',
  noShows: 0,
  since: '03/14/2022',
  preferredStylists: ['Maya Chen', 'Sara Kim'],
  preferredServices: ['Balayage', 'Toner', 'Deep Condition', 'Trim'],
  allergies: 'Sensitive to ammonia-based products',
  points: 1685,
  upcomingAppt: { date:'05/02/2025', service:'Balayage + Toner', stylist:'Maya Chen', time:'2:30 PM' },
  history: [
    { id:'h1', date:'04/20/2025', service:'Balayage + Toner',          stylist:'Maya Chen', amount:285, status:'completed' },
    { id:'h2', date:'01/18/2025', service:'Cut & Blowout',              stylist:'Sara Kim',  amount:95,  status:'completed' },
    { id:'h3', date:'10/12/2024', service:'Balayage + Gloss',           stylist:'Maya Chen', amount:265, status:'completed' },
    { id:'h4', date:'07/08/2024', service:'Deep Condition Treatment',   stylist:'Maya Chen', amount:75,  status:'completed' },
    { id:'h5', date:'04/22/2024', service:'Balayage + Toner + Trim',   stylist:'Maya Chen', amount:320, status:'completed' },
    { id:'h6', date:'01/14/2024', service:'Color Correction',           stylist:'Sara Kim',  amount:380, status:'completed' },
  ],
  notes: [
    { id:'n1', author:'Maya Chen', date:'04/20/2025', content:'Used Olaplex 3 as pre-treatment. Client loved the warm honey tones. 20-vol for roots, balayage blend throughout.' },
    { id:'n2', author:'Sara Kim',  date:'01/18/2025', content:'Regular trim — 1.5 inches. Discussed going shorter but client decided to keep length.' },
    { id:'n3', author:'Maya Chen', date:'10/12/2024', content:'Switched from ammonia-based toner to ammonia-free — client reported no scalp irritation.' },
  ],
  loyalty: [
    { id:'l1', date:'04/20/2025', desc:'Balayage visit',        points:  57 },
    { id:'l2', date:'01/18/2025', desc:'Cut & Blowout visit',   points:  19 },
    { id:'l3', date:'12/25/2024', desc:'Holiday bonus',         points:  50 },
    { id:'l4', date:'10/12/2024', desc:'Balayage + Gloss visit',points:  53 },
    { id:'l5', date:'09/01/2024', desc:'Reward redeemed',       points:-500 },
    { id:'l6', date:'07/08/2024', desc:'Deep Condition visit',  points:  15 },
  ],
  consents: [
    { id:'con1', name:'Color Service Release',       signed:true,  date:'03/14/2022' },
    { id:'con2', name:'Chemical Treatment Waiver',   signed:true,  date:'10/12/2024' },
    { id:'con3', name:'Photo Release (Marketing)',   signed:true,  date:'03/14/2022' },
    { id:'con4', name:'General Service Consent',     signed:true,  date:'03/14/2022' },
    { id:'con5', name:'Patch Test Acknowledgement',  signed:false              },
  ],
};

// ─── Skeleton components ─────────────────────────────────────────────────────
function SkeletonClientHeader() {
  return (
    <div style={{ background:T.surface, padding:'16px', display:'flex', gap:16, alignItems:'flex-start' }}>
      <div className="shimmer" style={{ width:80, height:80, borderRadius:9999, flexShrink:0 }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
        <div className="shimmer" style={{ height:28, borderRadius:8, width:'60%' }} />
        <div className="shimmer" style={{ height:20, borderRadius:9999, width:'30%' }} />
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          {[0,1,2].map(i => (
            <div key={i} className="shimmer" style={{ height:44, borderRadius:12, flex:1 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div style={{ display:'flex', gap:8, padding:'12px 16px', background:T.bg }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="shimmer" style={{ flex:1, height:52, borderRadius:12 }} />
      ))}
    </div>
  );
}

function SkeletonContent() {
  return (
    <div style={{ padding:'16px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ marginBottom:16 }}>
          <div className="shimmer" style={{ height:16, borderRadius:8, width:'40%', marginBottom:10 }} />
          <div className="shimmer" style={{ height:72, borderRadius:16 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', flex:1, padding:'48px 32px', textAlign:'center' }}>
      <WifiOff style={{ width:64, height:64, color:T.muted, strokeWidth:1.25 }} aria-hidden />
      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:24 }}>
        Couldn't load client
      </h2>
      <p style={{ fontSize:14, fontWeight:400, lineHeight:'20px', color:T.muted,
                  marginTop:8, maxWidth:260 }}>
        Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop:20, paddingLeft:24, paddingRight:24, paddingTop:12, paddingBottom:12,
          borderRadius:12, border:'none', background:T.primary,
          color:'#FFFFFF', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44,
        }}
        aria-label="Retry"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ client }: { client: ClientDetail }) {
  const tp = tierProgress(client.lifetimeValue, client.tier);

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Allergy / sensitivity alert */}
      {client.allergies && (
        <div style={{
          background:'rgba(255,152,0,0.08)', border:`1px solid ${T.warning}`,
          borderRadius:12, padding:12,
          display:'flex', gap:10, alignItems:'flex-start',
        }}
          role="alert"
        >
          <AlertTriangle style={{ width:18, height:18, color:T.warning, flexShrink:0, marginTop:1 }} aria-hidden />
          <div>
            <p style={{ fontSize:13, fontWeight:600, lineHeight:'18px', color:T.fg }}>
              Sensitivity Alert
            </p>
            <p style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:2 }}>
              {client.allergies}
            </p>
          </div>
        </div>
      )}

      {/* Upcoming appointment */}
      {client.upcomingAppt && (
        <div>
          <SectionTitle>Upcoming Appointment</SectionTitle>
          <div style={{
            background:T.surface, borderRadius:16, padding:16,
            border:`1px solid ${T.border}`,
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:14, fontWeight:600, lineHeight:'20px', color:T.fg }}>
                  {client.upcomingAppt.service}
                </p>
                <p style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:3 }}>
                  with {client.upcomingAppt.stylist}
                </p>
              </div>
              <div style={{
                background:`rgba(187,237,218,0.3)`, borderRadius:8, padding:'6px 10px', textAlign:'right',
              }}>
                <p style={{ fontSize:12, fontWeight:600, color:T.accentFg }}>
                  {client.upcomingAppt.date}
                </p>
                <p style={{ fontSize:11, fontWeight:400, color:T.accentFg, marginTop:1 }}>
                  {client.upcomingAppt.time}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div>
        <SectionTitle>Preferences</SectionTitle>
        <div style={{ background:T.surface, borderRadius:16, padding:16, border:`1px solid ${T.border}` }}>

          {/* Preferred services */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:12, fontWeight:500, lineHeight:'16px', color:T.muted, marginBottom:8 }}>
              Preferred Services
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {client.preferredServices.map(s => (
                <span
                  key={s}
                  style={{
                    height:28, paddingLeft:10, paddingRight:10, borderRadius:9999,
                    background:`rgba(227,169,160,0.15)`, color:T.fg,
                    fontSize:12, fontWeight:500, lineHeight:'28px',
                    display:'inline-block',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Preferred stylists */}
          <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}` }}>
            <p style={{ fontSize:12, fontWeight:500, lineHeight:'16px', color:T.muted, marginBottom:8 }}>
              Preferred Stylists
            </p>
            <div style={{ display:'flex', gap:8 }}>
              {client.preferredStylists.map(name => (
                <div key={name} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div
                    style={{
                      width:28, height:28, borderRadius:9999, flexShrink:0,
                      background: avatarColor(name),
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}
                    aria-hidden
                  >
                    <span style={{ fontSize:10, fontWeight:600, color:'#FFFFFF' }}>
                      {name.split(' ').map(n=>n[0]).join('')}
                    </span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:500, color:T.fg }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tier progress */}
      <div>
        <SectionTitle>Loyalty Tier</SectionTitle>
        <div style={{ background:T.surface, borderRadius:16, padding:16, border:`1px solid ${T.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <TierBadge tier={client.tier} />
              {tp.next && (
                <p style={{ fontSize:12, fontWeight:400, color:T.muted, marginTop:4 }}>
                  {fmtLTV(client.lifetimeValue)} lifetime · {fmtLTV(3500)} for Platinum
                </p>
              )}
              {!tp.next && (
                <p style={{ fontSize:12, fontWeight:400, color:T.muted, marginTop:4 }}>
                  {fmtLTV(client.lifetimeValue)} lifetime · Top tier ⭐
                </p>
              )}
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:T.primary }}>
              {client.points} pts
            </span>
          </div>
          <div style={{ height:6, borderRadius:3, background:T.skel, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:3, background:T.primary,
              width:`${tp.pct}%`, transition:'width 0.4s',
            }} />
          </div>
          {tp.next && (
            <p style={{ fontSize:11, fontWeight:400, color:T.muted, marginTop:6, textAlign:'right' }}>
              Next: {tp.next}
            </p>
          )}
        </div>
      </div>

      {/* Client since */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                    background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
        <CalendarDays style={{ width:16, height:16, color:T.muted }} aria-hidden />
        <span style={{ fontSize:13, fontWeight:400, color:T.muted }}>
          Client since <strong style={{ color:T.fg }}>{client.since}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────
function HistoryTab({ client }: { client: ClientDetail }) {
  const [filter, setFilter] = useState<'all'|'completed'|'cancelled'>('all');

  const list = client.history.filter(a =>
    filter === 'all' ? true : a.status === filter || (filter === 'cancelled' && a.status === 'no-show')
  );

  if (client.history.length === 0) {
    return (
      <TabEmpty
        icon={<CalendarDays style={{ width:48, height:48, color:T.muted }} />}
        title="No visit history"
        body="Completed appointments will appear here."
      />
    );
  }

  const STATUS_STYLE: Record<ApptStatus, { label:string; bg:string; color:string }> = {
    completed:  { label:'Completed', bg:'rgba(76,175,80,0.1)',  color:'#2E7D32' },
    'no-show':  { label:'No-show',   bg:'rgba(255,152,0,0.1)', color:T.warning },
    cancelled:  { label:'Cancelled', bg:`rgba(244,67,54,0.1)`, color:T.error   },
  };

  return (
    <div>
      {/* Quick filter */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px', overflowX:'auto', scrollbarWidth:'none' }}>
        {(['all','completed','cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              height:32, paddingLeft:12, paddingRight:12, borderRadius:9999, flexShrink:0,
              background: filter === f ? T.fg : T.surface,
              border: `1px solid ${filter === f ? T.fg : T.border}`,
              color: filter === f ? '#FFFFFF' : T.muted,
              fontSize:12, fontWeight:500, cursor:'pointer',
              whiteSpace:'nowrap',
            }}
            aria-pressed={filter === f}
          >
            {f === 'all' ? 'All Time' : f === 'completed' ? 'Completed' : 'Cancelled / NS'}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 16px 16px' }}>
        {list.length === 0 ? (
          <p style={{ textAlign:'center', color:T.muted, fontSize:14, padding:'24px 0' }}>
            No records in this category.
          </p>
        ) : list.map(appt => {
          const ss = STATUS_STYLE[appt.status];
          return (
            <div key={appt.id} style={{
              background:T.surface, borderRadius:16, padding:16,
              marginBottom:8, border:`1px solid ${T.border}`,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <p style={{ fontSize:14, fontWeight:600, lineHeight:'20px', color:T.fg }}>
                      {appt.service}
                    </p>
                  </div>
                  <p style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:3 }}>
                    {appt.stylist} · {appt.date}
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, marginLeft:12 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:T.fg }}>
                    ${appt.amount}
                  </span>
                  <span style={{
                    fontSize:10, fontWeight:600, lineHeight:'14px',
                    paddingLeft:7, paddingRight:7, height:18, borderRadius:9999,
                    background:ss.bg, color:ss.color,
                    display:'inline-flex', alignItems:'center',
                  }}>
                    {ss.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Notes ──────────────────────────────────────────────────────────────
function NotesTab({ client }: { client: ClientDetail }) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft,   setDraft]   = useState('');
  const [notes,   setNotes]   = useState<Note[]>(client.notes);

  const handleAdd = () => {
    if (!draft.trim()) return;
    setNotes(prev => [{
      id:      `n${Date.now()}`,
      author:  'You',
      date:    new Date().toLocaleDateString('en-US'),
      content: draft.trim(),
    }, ...prev]);
    setDraft('');
    setShowAdd(false);
  };

  if (notes.length === 0 && !showAdd) {
    return (
      <div style={{ padding:'0 16px 16px' }}>
        <TabEmpty
          icon={<StickyNote style={{ width:48, height:48, color:T.muted }} />}
          title="No notes yet"
          body="Add internal notes visible only to staff."
          cta={{ label:'Add first note', onClick:() => setShowAdd(true) }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding:'16px' }}>
      {/* Add note button */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width:'100%', height:44, borderRadius:12, marginBottom:16,
            background:'rgba(227,169,160,0.12)', border:`1.5px dashed ${T.primary}`,
            color:T.primary, fontSize:14, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}
          aria-label="Add note"
        >
          <Plus style={{ width:16, height:16 }} aria-hidden />
          Add note
        </button>
      )}

      {/* Draft input */}
      {showAdd && (
        <div style={{ marginBottom:16, background:T.surface, borderRadius:16, padding:16,
                      border:`1px solid ${T.primary}` }}>
          <textarea
            autoFocus
            placeholder="Enter note…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{
              width:'100%', minHeight:88, borderRadius:8, border:`1px solid ${T.border}`,
              padding:'10px 12px', fontSize:13, lineHeight:'18px', color:T.fg,
              background:T.skel, outline:'none', resize:'none', boxSizing:'border-box',
            }}
          />
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button
              onClick={() => { setShowAdd(false); setDraft(''); }}
              style={{ flex:1, height:40, borderRadius:12, border:`1px solid ${T.border}`,
                       background:'none', color:T.muted, fontSize:13, fontWeight:500, cursor:'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!draft.trim()}
              style={{
                flex:1, height:40, borderRadius:12, border:'none',
                background: draft.trim() ? T.primary : T.border,
                color: draft.trim() ? '#FFFFFF' : T.muted,
                fontSize:13, fontWeight:600, cursor: draft.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.map(note => (
        <div key={note.id} style={{
          background:T.surface, borderRadius:16, padding:16,
          marginBottom:8, border:`1px solid ${T.border}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{
              width:28, height:28, borderRadius:9999, background:avatarColor(note.author),
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }} aria-hidden>
              <span style={{ fontSize:10, fontWeight:600, color:'#FFFFFF' }}>
                {note.author.split(' ').map(n=>n[0]).join('')}
              </span>
            </div>
            <div>
              <span style={{ fontSize:13, fontWeight:600, color:T.fg }}>{note.author}</span>
              <span style={{ fontSize:11, color:T.muted, marginLeft:8 }}>{note.date}</span>
            </div>
          </div>
          <p style={{ fontSize:13, fontWeight:400, lineHeight:'18px', color:T.fg }}>
            {note.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Loyalty ─────────────────────────────────────────────────────────────
function LoyaltyTab({ client }: { client: ClientDetail }) {
  const tp = tierProgress(client.lifetimeValue, client.tier);
  const TIER_THRESHOLDS: Record<string, number> = { Bronze:500, Silver:1500, Gold:3500, Platinum:Infinity };
  const nextThreshold = tp.next ? TIER_THRESHOLDS[tp.next] : null;

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>
      {/* Points card */}
      <div style={{
        background: `linear-gradient(135deg, #E3A9A0 0%, #D1BFB3 100%)`,
        borderRadius:24, padding:'24px 20px', textAlign:'center',
        boxShadow:'0 4px 20px rgba(227,169,160,0.35)',
      }}>
        <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'rgba(255,255,255,0.8)',
                    textTransform:'uppercase' }}>
          Zarkili Points
        </p>
        <p style={{ fontSize:48, fontWeight:700, lineHeight:'56px', color:'#FFFFFF', marginTop:4 }}>
          {client.points.toLocaleString()}
        </p>
        <TierBadge tier={client.tier} />
        {tp.next && nextThreshold && (
          <>
            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.3)',
                          marginTop:16, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:'#FFFFFF',
                            width:`${tp.pct}%`, transition:'width 0.4s' }} />
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.85)', marginTop:6 }}>
              {fmtLTV(client.lifetimeValue)} of {fmtLTV(nextThreshold)} to {tp.next}
            </p>
          </>
        )}
        {!tp.next && (
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', marginTop:12 }}>
            Top Tier — Thank you for your loyalty ⭐
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div style={{ display:'flex', gap:8 }}>
        {[
          { label:'Redeemable', value: `${Math.floor(client.points / 500) * 10}`, unit:'$' },
          { label:'Per $1 Spent', value:'0.3', unit:'pts' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{
            flex:1, background:T.surface, borderRadius:16, padding:'12px 14px',
            border:`1px solid ${T.border}`,
          }}>
            <p style={{ fontSize:11, fontWeight:500, color:T.muted, marginBottom:4 }}>{label}</p>
            <p style={{ fontSize:18, fontWeight:600, color:T.fg }}>
              {unit === '$' ? unit : ''}{value}{unit === 'pts' ? ` ${unit}` : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div>
        <SectionTitle>Points History</SectionTitle>
        {client.loyalty.map(tx => (
          <div key={tx.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 0', borderBottom:`1px solid ${T.border}`,
          }}>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:T.fg }}>{tx.desc}</p>
              <p style={{ fontSize:11, fontWeight:400, color:T.muted, marginTop:2 }}>{tx.date}</p>
            </div>
            <span style={{
              fontSize:14, fontWeight:700,
              color: tx.points > 0 ? T.success : T.error,
            }}>
              {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Photos ─────────────────────────────────────────────────────────────
const PHOTO_PAIRS = [
  { id:'p1', label:'Apr 2025 – Balayage',      before:'#D4B5A9', after:'#C8A598' },
  { id:'p2', label:'Oct 2024 – Balayage + Gloss', before:'#C9A89D',after:'#BF9E93' },
  { id:'p3', label:'Apr 2024 – Balayage',      before:'#D9BDB5', after:'#CCB0A7' },
];

function PhotosTab({ client: _ }: { client: ClientDetail }) {
  return (
    <div style={{ padding:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <p style={{ fontSize:12, fontWeight:500, color:T.muted }}>
          {PHOTO_PAIRS.length * 2} photos · {PHOTO_PAIRS.length} sets
        </p>
        <button
          style={{
            height:36, paddingLeft:14, paddingRight:14, borderRadius:9999,
            background:T.primary, border:'none', color:'#FFFFFF',
            fontSize:13, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}
          aria-label="Add photos"
        >
          <Plus style={{ width:14, height:14 }} aria-hidden />
          Add
        </button>
      </div>

      {PHOTO_PAIRS.map(pair => (
        <div key={pair.id} style={{ marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:8 }}>
            {pair.label}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Before', bg:pair.before },
              { label:'After',  bg:pair.after  },
            ].map(({ label, bg }) => (
              <div key={label} style={{
                aspectRatio:'4/3', borderRadius:16,
                background:bg, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:8,
                border:`1px solid ${T.border}`, position:'relative',
              }}>
                <Camera style={{ width:24, height:24, color:'rgba(255,255,255,0.8)' }} aria-hidden />
                <span style={{
                  position:'absolute', bottom:8, left:8,
                  fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.9)',
                  background:'rgba(0,0,0,0.25)', paddingLeft:6, paddingRight:6,
                  height:18, borderRadius:4, lineHeight:'18px',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Consents ────────────────────────────────────────────────────────────
function ConsentsTab({ client }: { client: ClientDetail }) {
  return (
    <div style={{ padding:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <p style={{ fontSize:12, fontWeight:400, color:T.muted }}>
          {client.consents.filter(c=>c.signed).length}/{client.consents.length} signed
        </p>
        <button
          style={{
            height:32, paddingLeft:14, paddingRight:14, borderRadius:9999,
            background:T.accent, border:'none', color:T.accentFg,
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}
          aria-label="Request consent forms"
        >
          Request All
        </button>
      </div>

      {client.consents.map(form => (
        <div key={form.id} style={{
          background:T.surface, borderRadius:16, padding:'14px 16px',
          marginBottom:8, border:`1px solid ${T.border}`,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{
            width:36, height:36, borderRadius:9999, flexShrink:0,
            background: form.signed ? `rgba(76,175,80,0.1)` : `rgba(255,152,0,0.1)`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }} aria-hidden>
            {form.signed
              ? <CheckCircle2 style={{ width:18, height:18, color:T.success }} />
              : <Clock        style={{ width:18, height:18, color:T.warning }} />
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, lineHeight:'18px', color:T.fg,
                         overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {form.name}
            </p>
            <p style={{ fontSize:11, fontWeight:400, lineHeight:'14px', color:T.muted, marginTop:2 }}>
              {form.signed ? `Signed ${form.date}` : 'Not yet signed'}
            </p>
          </div>
          {!form.signed && (
            <button
              style={{
                height:32, paddingLeft:10, paddingRight:10, borderRadius:8, flexShrink:0,
                background:`rgba(255,152,0,0.1)`, border:'none', color:T.warning,
                fontSize:12, fontWeight:600, cursor:'pointer',
              }}
              aria-label={`Send ${form.name} reminder`}
            >
              Send
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize:12, fontWeight:600, lineHeight:'16px', color:T.muted,
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
      {children}
    </p>
  );
}

function TabEmpty({
  icon, title, body, cta,
}: {
  icon:   React.ReactNode;
  title:  string;
  body:   string;
  cta?:   { label: string; onClick: () => void };
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', padding:'40px 32px', textAlign:'center' }}>
      <div style={{ color:T.muted, opacity:0.7 }}>{icon}</div>
      <p style={{ fontSize:16, fontWeight:600, lineHeight:'22px', color:T.fg, marginTop:16 }}>
        {title}
      </p>
      <p style={{ fontSize:13, fontWeight:400, lineHeight:'18px', color:T.muted, marginTop:6, maxWidth:240 }}>
        {body}
      </p>
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            marginTop:16, height:44, paddingLeft:24, paddingRight:24, borderRadius:12,
            background:T.primary, border:'none', color:'#FFFFFF',
            fontSize:14, fontWeight:600, cursor:'pointer',
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}

// ─── Tab configuration ────────────────────────────────────────────────────────
const TABS: { key: DetailTab; label: string; icon: React.ElementType }[] = [
  { key:'overview',  label:'Overview',  icon: Sparkles     },
  { key:'history',   label:'History',   icon: Calendar     },
  { key:'notes',     label:'Notes',     icon: StickyNote   },
  { key:'loyalty',   label:'Loyalty',   icon: Star         },
  { key:'photos',    label:'Photos',    icon: Image        },
  { key:'consents',  label:'Consents',  icon: ShieldCheck  },
];

// ─── Main screen ─────────────────────────────────────────────────────────────
interface ClientDetailScreenProps {
  clientId:           string;
  onBack:             () => void;
  onBookForClient?:   () => void;
}

export function ClientDetailScreen({
  clientId,
  onBack,
  onBookForClient,
}: ClientDetailScreenProps) {
  const [frame,      setFrame]      = useState<FrameState>('default');
  const [activeTab,  setActiveTab]  = useState<DetailTab>('overview');

  // In a real app, look up by clientId. Here we always show Priya as the demo detail.
  const client: ClientDetail = PRIYA;

  // ── Tab content renderer ──
  const renderTabContent = () => {
    if (frame === 'loading') return <SkeletonContent />;
    if (frame === 'error')   return <ErrorState onRetry={() => setFrame('default')} />;

    switch (activeTab) {
      case 'overview': return <OverviewTab  client={client} />;
      case 'history':  return <HistoryTab   client={client} />;
      case 'notes':    return <NotesTab     client={client} />;
      case 'loyalty':  return <LoyaltyTab   client={client} />;
      case 'photos':   return <PhotosTab    client={client} />;
      case 'consents': return <ConsentsTab  client={client} />;
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
                  background:T.bg, position:'relative', overflow:'hidden' }}>

      {/* ── HEADER — h 56 ── */}
      <header style={{
        height:56, flexShrink:0, background:T.bg,
        borderBottom:`1px solid ${T.border}`,
        padding:'0 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        zIndex:20,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button
            onClick={onBack}
            style={{ width:44, height:44, display:'flex', alignItems:'center',
                     justifyContent:'center', background:'none', border:'none',
                     padding:0, cursor:'pointer', marginLeft:-8 }}
            aria-label="Go back"
          >
            <ChevronLeft style={{ width:24, height:24, color:T.fg }} aria-hidden />
          </button>
          <h1 style={{ fontSize:20, fontWeight:600, lineHeight:'28px', color:T.fg, margin:0 }}>
            Client Profile
          </h1>
        </div>

        <div style={{ display:'flex', gap:4 }}>
          {/* Additional header actions can go here */}
        </div>
      </header>

      {/* ── DEV FRAME SWITCHER ── */}
      <div style={{
        flexShrink:0, background:T.bg, borderBottom:`1px solid ${T.border}`,
        padding:'6px 16px', display:'flex', alignItems:'center', gap:6, overflowX:'auto',
      }}>
        <span style={{ fontSize:11, fontWeight:500, color:T.muted, whiteSpace:'nowrap', marginRight:2 }}>
          Frame:
        </span>
        {(['default','loading','error'] as FrameState[]).map(f => (
          <button
            key={f}
            onClick={() => setFrame(f)}
            style={{
              padding:'3px 10px', borderRadius:9999, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:500, whiteSpace:'nowrap', minHeight:28,
              background: frame === f ? T.fg       : 'rgba(209,191,179,0.35)',
              color:      frame === f ? '#FFFFFF'  : T.fg,
            }}
            aria-pressed={frame === f}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── CLIENT HEADER ── */}
      {frame === 'loading' ? (
        <SkeletonClientHeader />
      ) : frame !== 'error' ? (
        <div style={{
          flexShrink:0, background:T.surface,
          borderBottom:`1px solid ${T.border}`,
          padding:'16px',
        }}>
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            {/* Avatar — 80×80 */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:80, height:80, borderRadius:9999,
                background: avatarColor(client.name),
                display:'flex', alignItems:'center', justifyContent:'center',
              }} aria-hidden>
                <span style={{ fontSize:24, fontWeight:600, color:'#FFFFFF' }}>
                  {client.initials}
                </span>
              </div>
              {/* VIP crown */}
              {client.isVIP && (
                <div style={{
                  position:'absolute', bottom:-4, right:-4,
                  width:24, height:24, borderRadius:9999, background:'#FFF4D6',
                  border:`2px solid ${T.surface}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }} aria-label="VIP client">
                  <Star style={{ width:12, height:12, color:'#9B7000', fill:'#9B7000' }} aria-hidden />
                </div>
              )}
            </div>

            {/* Info column */}
            <div style={{ flex:1, minWidth:0 }}>
              {/* Name — heading-2 (24/32) */}
              <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg,
                            margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {client.name}
              </h2>

              {/* Tier + VIP badges */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <TierBadge tier={client.tier} />
                {client.isVIP && (
                  <span style={{
                    height:22, paddingLeft:8, paddingRight:8, borderRadius:9999,
                    background:'#FFF4D6', color:'#9B7000',
                    fontSize:11, fontWeight:700, lineHeight:'22px',
                  }}>
                    VIP
                  </span>
                )}
              </div>

              {/* Client since */}
              <p style={{ fontSize:12, fontWeight:400, color:T.muted, marginTop:4 }}>
                Client since {client.since}
              </p>

              {/* Contact actions — Call · Text · Email, each 44×44 touch target */}
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                {[
                  { label:'Call',  icon: Phone,          href:`tel:${client.phone}` },
                  { label:'Text',  icon: MessageCircle,  href:`sms:${client.phone}` },
                  { label:'Email', icon: Mail,            href:`mailto:${client.email}` },
                ].map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    style={{
                      flex:1, height:44, borderRadius:12,
                      background:T.skel,
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:3,
                      textDecoration:'none', minWidth:44,
                    }}
                    aria-label={`${label} ${client.name}`}
                  >
                    <Icon style={{ width:18, height:18, color:T.primary }} aria-hidden />
                    <span style={{ fontSize:11, fontWeight:500, color:T.fg }}>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── STATS ROW ── */}
      {frame !== 'loading' && frame !== 'error' && (
        <div style={{
          flexShrink:0,
          display:'flex', gap:8, padding:'10px 16px',
          background:T.bg,
        }}>
          {[
            { value:`${client.visits}`,           label:'Visits',     warn:false },
            { value:`${fmtLTV(client.lifetimeValue)}`, label:'Lifetime',   warn:false },
            { value:`${client.lastVisit}`,        label:'Last Visit', warn:false },
            { value:`${client.noShows}`,          label:'No-shows',   warn:client.noShows > 0 },
          ].map(({ value, label, warn }) => (
            <div
              key={label}
              style={{
                flex:1, background:T.surface, borderRadius:12, padding:'8px 6px', textAlign:'center',
              }}
            >
              <p style={{
                fontSize:14, fontWeight:600, lineHeight:'20px',
                color: warn ? T.warning : T.fg,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {value}
              </p>
              <p style={{ fontSize:10, fontWeight:400, lineHeight:'14px', color:T.muted, marginTop:1 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB BAR — h 44, horizontally scrollable ── */}
      {frame !== 'error' && (
        <div
          style={{
            flexShrink:0, height:44, background:T.surface,
            borderBottom:`1px solid ${T.border}`,
            display:'flex', alignItems:'stretch',
            overflowX:'auto', scrollbarWidth:'none',
            paddingLeft:8, paddingRight:8,
          }}
          role="tablist"
          aria-label="Client detail tabs"
        >
          {TABS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${key}`}
                onClick={() => setActiveTab(key)}
                style={{
                  flexShrink:0, height:44,
                  paddingLeft:14, paddingRight:14,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'none', border:'none', padding:'0 14px', cursor:'pointer',
                  borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent',
                  whiteSpace:'nowrap',
                  transition:'border-color 0.15s',
                }}
              >
                <span style={{
                  fontSize:13, fontWeight: active ? 600 : 400,
                  color: active ? T.fg : T.muted,
                  transition:'color 0.15s',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── SCROLLABLE TAB CONTENT ── */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={`${activeTab} tab`}
        style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
                 paddingBottom:80 /* CTA clearance */ }}
      >
        {renderTabContent()}
      </div>

      {/* ── STICKY BOOK CTA ── */}
      {frame !== 'error' && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          background:T.surface, borderTop:`1px solid ${T.border}`,
          padding:'12px 16px', paddingBottom:`max(12px, env(safe-area-inset-bottom, 0px))`,
          zIndex:10,
        }}>
          <button
            onClick={onBookForClient}
            style={{
              width:'100%', height:52, borderRadius:16,
              background:T.primary, border:'none', cursor:'pointer',
              fontSize:15, fontWeight:600, color:'#FFFFFF',
              boxShadow:'0 2px 12px rgba(227,169,160,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'background 0.15s',
            }}
            aria-label={`Book appointment for ${client.name}`}
          >
            <Calendar style={{ width:18, height:18 }} aria-hidden />
            Book for client
          </button>
        </div>
      )}
    </div>
  );
}