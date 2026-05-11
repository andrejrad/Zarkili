/**
 * Walk-in Queue Screen — G-3
 * Spec: /src/imports/pasted_text/screen-queue.json
 * Device: iPhone 14 390×844
 * Frames: G-3-default | G-3-empty | G-3-fully-booked | G-3-loading | G-3-error
 */
import { useState, useCallback } from 'react';
import {
  ChevronLeft, Plus, GripVertical, MoreHorizontal,
  Scissors, Sparkles, Eye, Paintbrush2, CalendarX,
  WifiOff, Clock, PlayCircle, CheckCircle2,
  AlertTriangle, X,
} from 'lucide-react';

// ─── Design tokens (spec-exact, inline because this is a staff screen
//     with slightly different token mappings than the client app) ─────────────
const T = {
  bg:          '#F2EDDD',
  surface:     '#FFFFFF',
  primary:     '#E3A9A0',
  accent:      '#BBEDDA',
  accentFg:    '#2D4A42',
  fg:          '#1A1A1A',
  muted:       '#6B6B6B',
  border:      '#E5E0D1',
  skeleton:    '#F5F5F5',
  warning:     '#F59E0B',
  error:       '#F44336',
  success:     '#4CAF50',
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────
type QueueTab    = 'waiting' | 'in-service' | 'completed';
type FrameState  = 'default' | 'empty' | 'fully-booked' | 'loading' | 'error';
type SvcCategory = 'nails' | 'hair' | 'skin' | 'lashes' | 'brows' | 'other';

interface QueueClient {
  id:                    string;
  position:              number;
  name:                  string;
  initials:              string;
  service:               string;
  category:              SvcCategory;
  estimatedWaitMinutes?: number;
  addedAt?:              string;
  startedAt?:            string;
  completedAt?:          string;
  progressPercent?:      number;
  hasNotes?:             boolean;
  notes?:                string;
  phone?:                string;
}

// ─── Avatar color from name hash ────────────────────────────────────────────
const AVATAR_PALETTE = [
  '#E3A9A0', '#BBEDDA', '#D1BFB3', '#A8C5BD',
  '#C4A49B', '#9ED3C0', '#B8D4CE', '#E8C4C0',
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = ((h << 5) - h) + name.charCodeAt(i); h |= 0; }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ─── Mock data (exact per spec frames) ──────────────────────────────────────
const WAITING_DEFAULT: QueueClient[] = [
  { id:'w1', position:1, name:'Maria Chen',    initials:'MC', service:'Gel Manicure',   category:'nails',  estimatedWaitMinutes:5,   addedAt:'2:25 PM' },
  { id:'w2', position:2, name:'Taylor Brooks', initials:'TB', service:'Balayage',       category:'hair',   estimatedWaitMinutes:45,  addedAt:'2:10 PM' },
  { id:'w3', position:3, name:'Sam Rivera',    initials:'SR', service:'Facial',         category:'skin',   estimatedWaitMinutes:90,  addedAt:'1:50 PM' },
  { id:'w4', position:4, name:'Jordan Kim',    initials:'JK', service:'Lash extensions',category:'lashes', estimatedWaitMinutes:120, addedAt:'1:30 PM', hasNotes:true, notes:'Sensitive eyes' },
];

const WAITING_FULL: QueueClient[] = [
  ...WAITING_DEFAULT,
  { id:'w5', position:5, name:'Zara Mitchell', initials:'ZM', service:'Eyebrow Threading', category:'brows',  estimatedWaitMinutes:135, addedAt:'1:15 PM' },
  { id:'w6', position:6, name:'Priya Patel',   initials:'PP', service:'Blow Dry',           category:'hair',   estimatedWaitMinutes:150, addedAt:'1:00 PM' },
  { id:'w7', position:7, name:'Emma Wright',   initials:'EW', service:'Shellac Manicure',   category:'nails',  estimatedWaitMinutes:165, addedAt:'12:45 PM' },
  { id:'w8', position:8, name:'Sofia Lee',     initials:'SL', service:'Lash Lift',           category:'lashes', estimatedWaitMinutes:180, addedAt:'12:30 PM' },
];

const IN_SERVICE_DATA: QueueClient[] = [
  { id:'s1', position:1, name:'Jade Monroe', initials:'JM', service:'Balayage',    category:'hair',  startedAt:'1:45 PM', progressPercent:65 },
  { id:'s2', position:2, name:'Ashley Park', initials:'AP', service:'Gel Manicure',category:'nails', startedAt:'2:20 PM', progressPercent:35 },
];

const COMPLETED_DATA: QueueClient[] = [
  { id:'c1', position:1, name:'Diana Rose',    initials:'DR', service:'Eyebrow Threading', category:'brows', completedAt:'1:30 PM' },
  { id:'c2', position:2, name:'Mia Torres',    initials:'MT', service:'Shellac Manicure',  category:'nails', completedAt:'2:05 PM' },
  { id:'c3', position:3, name:'Priya Shah',    initials:'PS', service:'Facial Treatment',  category:'skin',  completedAt:'2:35 PM' },
  { id:'c4', position:4, name:'Luna Garcia',   initials:'LG', service:'Lash Lift',          category:'lashes',completedAt:'11:50 AM' },
  { id:'c5', position:5, name:'Chloe Martin',  initials:'CM', service:'Balayage',           category:'hair',  completedAt:'12:15 PM' },
  { id:'c6', position:6, name:'Ava Johnson',   initials:'AJ', service:'Gel Manicure',       category:'nails', completedAt:'12:45 PM' },
  { id:'c7', position:7, name:'Natalie Wong',  initials:'NW', service:'Brow Shaping',       category:'brows', completedAt:'1:10 PM' },
];
const COMPLETED_FULL = COMPLETED_DATA.slice(0, 5); // 5 for fully-booked frame

// ─── Service category icon (14×14) ──────────────────────────────────────────
function CategoryIcon({ cat }: { cat: SvcCategory }) {
  const s = { width: 14, height: 14, color: T.muted, flexShrink: 0 } as const;
  if (cat === 'hair')               return <Scissors   style={s} aria-hidden />;
  if (cat === 'skin')               return <Sparkles   style={s} aria-hidden />;
  if (cat === 'lashes' || cat === 'brows') return <Eye style={s} aria-hidden />;
  if (cat === 'nails')              return <Paintbrush2 style={s} aria-hidden />;
  return <Sparkles style={s} aria-hidden />;
}

// ─── Shimmer skeleton primitives ────────────────────────────────────────────
function ShimmerBox({ style }: { style?: React.CSSProperties }) {
  return <div className="shimmer rounded-2xl" style={style} />;
}

function SkeletonStats() {
  return (
    <div style={{ display:'flex', gap:8, padding:'12px 16px' }}>
      {[0,1,2].map(i => (
        <ShimmerBox key={i} style={{ flex:1, height:64, borderRadius:16 }} />
      ))}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div style={{ padding:'8px 0' }}>
      {[0,1,2,3].map(i => (
        <ShimmerBox
          key={i}
          style={{ height:88, borderRadius:16, margin:'0 16px 8px' }}
        />
      ))}
    </div>
  );
}

// ─── Stats card ─────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        flex:1, background:T.surface, borderRadius:16, padding:12,
        display:'flex', flexDirection:'column', alignItems:'center',
      }}
    >
      <span style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg }}>
        {value}
      </span>
      <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:2 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Queue card ─────────────────────────────────────────────────────────────
interface QueueCardProps {
  client:       QueueClient;
  tab:          QueueTab;
  isDragging:   boolean;
  isDragOver:   boolean;
  onDragStart:  () => void;
  onDragOver:   (e: React.DragEvent) => void;
  onDragEnd:    () => void;
  onDrop:       () => void;
  onMenu:       (id: string) => void;
}

function QueueCard({
  client, tab, isDragging, isDragOver,
  onDragStart, onDragOver, onDragEnd, onDrop, onMenu,
}: QueueCardProps) {
  const isWaiting = tab === 'waiting';

  const cardStyle: React.CSSProperties = {
    background:   isDragOver ? 'rgba(227,169,160,0.05)' : T.surface,
    borderRadius: 16,
    padding:      16,
    margin:       '0 16px 8px',
    border:       isDragging || isDragOver
      ? `2px dashed ${T.primary}`
      : '1px solid transparent',
    opacity:      isDragging ? 0.7 : 1,
    cursor:       isWaiting ? 'grab' : 'default',
    userSelect:   'none',
    transition:   'border-color 0.15s, opacity 0.15s, background 0.15s',
  };

  return (
    <div
      draggable={isWaiting}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      style={cardStyle}
      role="listitem"
      aria-label={`${client.name}, ${client.service}, position ${client.position}`}
    >
      {/* Main row */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>

        {/* Grip handle — Waiting tab only */}
        {isWaiting ? (
          <button
            style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                     background:'none', border:'none', padding:0, cursor:'grab', flexShrink:0 }}
            aria-label="Drag to reorder"
            tabIndex={-1}
          >
            <GripVertical style={{ width:20, height:20, color:T.muted }} aria-hidden />
          </button>
        ) : (
          <div style={{ width:20, flexShrink:0 }} />
        )}

        {/* Position badge — 28×28, radius full, #E3A9A0 */}
        <div
          style={{
            width:28, height:28, borderRadius:9999, background:T.primary,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}
          aria-hidden
        >
          <span style={{ fontSize:12, fontWeight:600, lineHeight:'16px', color:'#FFFFFF' }}>
            {client.position}
          </span>
        </div>

        {/* Avatar — 44×44, color-coded bg */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <div
            style={{
              width:44, height:44, borderRadius:9999,
              background: avatarColor(client.name),
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
            aria-hidden
          >
            <span style={{ fontSize:14, fontWeight:400, color:'#FFFFFF' }}>
              {client.initials}
            </span>
          </div>
          {/* Notes indicator dot */}
          {client.hasNotes && (
            <div
              style={{
                position:'absolute', top:0, right:0,
                width:8, height:8, borderRadius:9999,
                background:T.primary, border:`1.5px solid ${T.bg}`,
              }}
              aria-label="Has notes"
            />
          )}
        </div>

        {/* Body — flex 1 */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Client name */}
          <p style={{ fontSize:14, fontWeight:500, lineHeight:'20px', color:T.fg,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {client.name}
          </p>
          {/* Service row: category icon 14×14 + name */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
            <CategoryIcon cat={client.category} />
            <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted,
                           whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {client.service}
            </span>
          </div>
          {/* Meta row */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
            {tab === 'waiting' && (
              <>
                <Clock style={{ width:12, height:12, color:T.muted, flexShrink:0 }} aria-hidden />
                <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted }}>
                  ~{client.estimatedWaitMinutes} min wait
                </span>
              </>
            )}
            {tab === 'in-service' && (
              <>
                <PlayCircle style={{ width:12, height:12, color:T.muted, flexShrink:0 }} aria-hidden />
                <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted }}>
                  Started {client.startedAt}
                </span>
              </>
            )}
            {tab === 'completed' && (
              <>
                <CheckCircle2 style={{ width:12, height:12, color:T.accent, flexShrink:0 }} aria-hidden />
                <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted }}>
                  Completed {client.completedAt}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Menu — 20×20 icon, 44×44 touch target */}
        <button
          onClick={() => onMenu(client.id)}
          style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                   background:'none', border:'none', padding:0, cursor:'pointer', flexShrink:0 }}
          aria-label={`More options for ${client.name}`}
        >
          <MoreHorizontal style={{ width:20, height:20, color:T.muted }} aria-hidden />
        </button>
      </div>

      {/* Progress bar — In Service only (h 4, radius 2) */}
      {tab === 'in-service' && (
        <div style={{ height:4, borderRadius:2, background:T.skeleton, marginTop:10, overflow:'hidden' }}>
          <div
            style={{ height:'100%', borderRadius:2, background:T.primary,
                     width:`${client.progressPercent ?? 50}%`, transition:'width 0.3s' }}
            aria-label={`${client.progressPercent}% complete`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', padding:'0 32px', textAlign:'center' }}>
      {/* CalendarX illustration placeholder — 80×80 */}
      <CalendarX style={{ width:80, height:80, color:T.muted, strokeWidth:1.25 }} aria-hidden />

      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:24 }}>
        No one in the queue
      </h2>
      <p style={{ fontSize:14, fontWeight:400, lineHeight:'20px', color:T.muted, marginTop:8, maxWidth:280 }}>
        Add a walk-in client to get started.
      </p>

      <button
        onClick={onAdd}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:T.primary, color:'#FFFFFF', border:'none',
          paddingLeft:24, paddingRight:24, paddingTop:14, paddingBottom:14,
          borderRadius:14, marginTop:24, cursor:'pointer', minHeight:44,
          fontSize:14, fontWeight:600, lineHeight:'20px',
        }}
        aria-label="Add first walk-in client"
      >
        <Plus style={{ width:18, height:18 }} aria-hidden />
        Add first walk-in
      </button>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', padding:'0 32px', textAlign:'center' }}>
      <WifiOff style={{ width:64, height:64, color:T.muted, strokeWidth:1.25 }} aria-hidden />

      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:24 }}>
        Couldn't load queue
      </h2>
      <p style={{ fontSize:14, fontWeight:400, lineHeight:'20px', color:T.muted, marginTop:8, maxWidth:280 }}>
        Check your connection and try again.
      </p>

      <button
        onClick={onRetry}
        style={{
          background:T.primary, color:'#FFFFFF', border:'none',
          paddingLeft:24, paddingRight:24, paddingTop:14, paddingBottom:14,
          borderRadius:14, marginTop:24, cursor:'pointer', minHeight:44,
          fontSize:14, fontWeight:600, lineHeight:'20px',
        }}
        aria-label="Retry loading queue"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Fully-booked banner ──────────────────────────────────────────────────────
function FullyBookedBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        margin:'12px 16px 0',
        padding:12,
        borderRadius:12,
        background:'rgba(245,158,11,0.10)',
        border:`1px solid ${T.warning}`,
        display:'flex',
        flexDirection:'row',
        alignItems:'flex-start',
        gap:12,
      }}
    >
      <AlertTriangle style={{ width:20, height:20, color:T.warning, flexShrink:0, marginTop:1 }} aria-hidden />

      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:500, lineHeight:'20px', color:T.fg }}>
          Queue is full (8/8)
        </p>
        <p style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:2 }}>
          No new walk-ins can be added until a slot opens.
        </p>
      </div>

      {/* Dismiss — 20×20 icon, 44×44 touch target */}
      <button
        onClick={onDismiss}
        style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                 background:'none', border:'none', padding:0, cursor:'pointer',
                 margin:'-12px -12px -12px 0', flexShrink:0 }}
        aria-label="Dismiss fully booked banner"
      >
        <X style={{ width:20, height:20, color:T.muted }} aria-hidden />
      </button>
    </div>
  );
}

// ─── Add Walk-in sheet ────────────────────────────────────────────────────────
const SERVICES = [
  'Gel Manicure','Acrylic Set','Eyebrow Threading','Eyebrow Shaping',
  'Lash Tint','Lash Lift','Lash Extensions','Haircut & Style','Blowout',
  'Balayage','Facial Treatment','Shellac Manicure','Brow Lamination','Other',
];

function AddWalkInSheet({
  open, onClose, onAdd,
}: {
  open:    boolean;
  onClose: () => void;
  onAdd:   (name: string, service: string, notes: string) => void;
}) {
  const [name,    setName]    = useState('');
  const [service, setService] = useState('');
  const [notes,   setNotes]   = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !service) return;
    onAdd(name.trim(), service, notes.trim());
    setName(''); setService(''); setNotes('');
    onClose();
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width:'100%', height:52, borderRadius:12,
    border:`1px solid ${T.border}`, background:T.surface,
    padding:'0 16px', fontSize:14, fontWeight:400, lineHeight:'20px',
    color:T.fg, outline:'none', boxSizing:'border-box',
  };

  return (
    <div
      style={{ position:'absolute', inset:0, zIndex:60, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      role="dialog" aria-modal aria-label="Add Walk-in Client"
    >
      {/* Scrim */}
      <div
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }}
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div style={{ position:'relative', background:T.surface, borderRadius:'24px 24px 0 0',
                    padding:'8px 16px 40px', zIndex:1, boxShadow:'0 -4px 24px rgba(0,0,0,0.12)' }}>
        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:T.border,
                      margin:'0 auto 20px' }} aria-hidden />

        {/* Title */}
        <h3 style={{ fontSize:20, fontWeight:600, lineHeight:'28px', color:T.fg, marginBottom:20 }}>
          Add Walk-in Client
        </h3>

        {/* Client Name */}
        <div style={{ marginBottom:0 }}>
          <label htmlFor="wiq-name"
            style={{ display:'block', fontSize:12, fontWeight:500, lineHeight:'16px',
                     color:T.muted, marginBottom:6 }}>
            Client Name
          </label>
          <input
            id="wiq-name"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            aria-required
            onFocus={e => { e.currentTarget.style.borderColor = T.primary; }}
            onBlur={e  => { e.currentTarget.style.borderColor = T.border;  }}
          />
        </div>

        {/* Service picker */}
        <div style={{ marginTop:16 }}>
          <label htmlFor="wiq-service"
            style={{ display:'block', fontSize:12, fontWeight:500, lineHeight:'16px',
                     color:T.muted, marginBottom:6 }}>
            Service
          </label>
          <select
            id="wiq-service"
            value={service}
            onChange={e => setService(e.target.value)}
            style={{ ...inputStyle, appearance:'none' }}
            aria-required
            onFocus={e => { e.currentTarget.style.borderColor = T.primary; }}
            onBlur={e  => { e.currentTarget.style.borderColor = T.border;  }}
          >
            <option value="" disabled>Choose a service</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Notes (optional) */}
        <div style={{ marginTop:16 }}>
          <label htmlFor="wiq-notes"
            style={{ display:'block', fontSize:12, fontWeight:500, lineHeight:'16px',
                     color:T.muted, marginBottom:6 }}>
            Notes <span style={{ fontWeight:400, opacity:0.7 }}>(optional)</span>
          </label>
          <textarea
            id="wiq-notes"
            placeholder="e.g. allergies, preferences…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, height:88, padding:'12px 16px',
                     resize:'none', lineHeight:'20px' }}
            onFocus={e => { e.currentTarget.style.borderColor = T.primary; }}
            onBlur={e  => { e.currentTarget.style.borderColor = T.border;  }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !service}
          style={{
            width:'100%', height:52, borderRadius:14, marginTop:24,
            background: (!name.trim() || !service) ? T.border : T.primary,
            color: (!name.trim() || !service) ? T.muted : '#FFFFFF',
            border:'none', cursor: (!name.trim() || !service) ? 'not-allowed' : 'pointer',
            fontSize:14, fontWeight:600, lineHeight:'20px',
            transition:'background 0.15s',
          }}
          aria-label="Add to Queue"
        >
          Add to Queue
        </button>
      </div>
    </div>
  );
}

// ─── Client Action Sheet ──────────────────────────────────────────────────────
function ClientActionSheet({
  clientId, tab, clients,
  onClose, onStartService, onMarkComplete, onRemove,
}: {
  clientId:        string | null;
  tab:             QueueTab;
  clients:         QueueClient[];
  onClose:         () => void;
  onStartService:  (id: string) => void;
  onMarkComplete:  (id: string) => void;
  onRemove:        (id: string) => void;
}) {
  if (!clientId) return null;
  const client = clients.find(c => c.id === clientId);
  if (!client) return null;

  const actionRow = (
    label: string,
    bg: string,
    color: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      style={{
        width:'100%', height:52, borderRadius:14, marginBottom:8,
        background:bg, color, border:'none', cursor:'pointer',
        fontSize:14, fontWeight:500, lineHeight:'20px', textAlign:'left',
        padding:'0 16px', display:'flex', alignItems:'center',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{ position:'absolute', inset:0, zIndex:60, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      role="dialog" aria-modal aria-label={`Actions for ${client.name}`}
    >
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }}
           onClick={onClose} aria-hidden />

      <div style={{ position:'relative', background:T.surface, borderRadius:'24px 24px 0 0',
                    padding:'8px 16px 40px', zIndex:1, boxShadow:'0 -4px 24px rgba(0,0,0,0.12)' }}>
        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:T.border,
                      margin:'0 auto 16px' }} aria-hidden />

        {/* Client preview */}
        <div style={{ display:'flex', alignItems:'center', gap:12,
                      paddingBottom:16, borderBottom:`1px solid ${T.border}`, marginBottom:16 }}>
          <div
            style={{ width:44, height:44, borderRadius:9999,
                     background:avatarColor(client.name),
                     display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            aria-hidden
          >
            <span style={{ fontSize:14, fontWeight:400, color:'#FFFFFF' }}>{client.initials}</span>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:600, lineHeight:'20px', color:T.fg }}>
              {client.name}
            </p>
            <p style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted, marginTop:2 }}>
              {client.service}
            </p>
          </div>
        </div>

        {/* Actions */}
        {tab === 'waiting' && actionRow(
          'Start Service', T.primary, '#FFFFFF',
          () => { onStartService(clientId); onClose(); },
        )}
        {tab === 'in-service' && actionRow(
          'Mark Complete', T.accent, T.accentFg,
          () => { onMarkComplete(clientId); onClose(); },
        )}
        {actionRow('Call Client',   T.skeleton, T.fg, () => onClose())}
        {actionRow('Send Message',  T.skeleton, T.fg, () => onClose())}
        {tab !== 'completed' && (
          <button
            onClick={() => { onRemove(clientId); onClose(); }}
            style={{
              width:'100%', height:52, borderRadius:14,
              background:'none', color:T.error, border:'none', cursor:'pointer',
              fontSize:14, fontWeight:500, lineHeight:'20px', textAlign:'left',
              padding:'0 16px', display:'flex', alignItems:'center',
            }}
            aria-label={`Remove ${client.name} from queue`}
          >
            Remove from Queue
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export function WalkInQueueScreen({ onBack }: { onBack: () => void }) {
  // ── Frame / tab state ──
  const [frame,    setFrame]    = useState<FrameState>('default');
  const [activeTab, setActiveTab] = useState<QueueTab>('waiting');
  const [showBanner, setShowBanner] = useState(true);

  // ── Queue data ──
  const [waiting,   setWaiting]   = useState<QueueClient[]>(WAITING_DEFAULT);
  const [inService, setInService] = useState<QueueClient[]>(IN_SERVICE_DATA);
  const [completed, setCompleted] = useState<QueueClient[]>(COMPLETED_DATA);

  // ── Sheets ──
  const [showAdd,   setShowAdd]   = useState(false);
  const [menuId,    setMenuId]    = useState<string | null>(null);

  // ── Drag ──
  const [dragId,    setDragId]    = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState<string | null>(null);

  // ── Derived counts (spec-exact per frame) ──
  const waitingCount   = frame === 'fully-booked' ? 8
                       : frame === 'empty'        ? 0
                       : waiting.length;
  const inSvcCount     = frame === 'fully-booked' ? 2
                       : frame === 'empty'        ? 0
                       : inService.length;
  const completedCount = frame === 'fully-booked' ? 5
                       : frame === 'empty'        ? 0
                       : completed.length;

  const isFullyBooked  = frame === 'fully-booked';
  const fabDisabled    = frame === 'loading' || frame === 'error' || isFullyBooked;

  // ── Active clients list ──
  const activeList: QueueClient[] =
    frame === 'fully-booked' ? (
      activeTab === 'waiting'    ? WAITING_FULL
      : activeTab === 'in-service' ? IN_SERVICE_DATA
      : COMPLETED_FULL
    ) : (
      activeTab === 'waiting'    ? waiting
      : activeTab === 'in-service' ? inService
      : completed
    );

  // ── Frame switcher side-effects ──
  const handleFrameChange = (f: FrameState) => {
    setFrame(f);
    setShowBanner(true);
    if (f === 'empty') {
      setWaiting([]);
      setInService([]);
      setCompleted([]);
    } else if (f !== 'fully-booked') {
      setWaiting(WAITING_DEFAULT);
      setInService(IN_SERVICE_DATA);
      setCompleted(COMPLETED_DATA);
    }
  };

  // ── Drag handlers (Waiting tab only) ──
  const handleDragStart = useCallback((id: string) => setDragId(id), []);
  const handleDragOver  = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault(); setDragOver(id);
  }, []);
  const handleDragEnd   = useCallback(() => { setDragId(null); setDragOver(null); }, []);
  const handleDrop      = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOver(null); return; }
    setWaiting(prev => {
      const list = [...prev];
      const from = list.findIndex(c => c.id === dragId);
      const to   = list.findIndex(c => c.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return list.map((c, i) => ({ ...c, position: i + 1 }));
    });
    setDragId(null); setDragOver(null);
  }, [dragId]);

  // ── Queue actions ──
  const nowStr = () => new Date().toLocaleTimeString('en-US',
    { hour:'numeric', minute:'2-digit', hour12:true });

  const handleAdd = (name: string, service: string, notes: string) => {
    const id  = `w${Date.now()}`;
    const pos = waiting.length + 1;
    const cat: SvcCategory = 'other';
    setWaiting(prev => [...prev, {
      id, position: pos,
      name, initials: name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
      service, category: cat,
      estimatedWaitMinutes: pos * 15,
      addedAt: nowStr(),
      hasNotes: notes.length > 0, notes: notes || undefined,
    }]);
    if (frame === 'empty') setFrame('default');
  };

  const handleStartService = (id: string) => {
    const client = waiting.find(c => c.id === id);
    if (!client) return;
    setWaiting(prev => prev.filter(c => c.id !== id).map((c,i)=>({...c,position:i+1})));
    setInService(prev => [...prev, {
      ...client, id:`s${Date.now()}`, position:prev.length+1,
      startedAt:nowStr(), progressPercent:5,
    }]);
  };

  const handleMarkComplete = (id: string) => {
    const client = inService.find(c => c.id === id);
    if (!client) return;
    setInService(prev => prev.filter(c=>c.id!==id).map((c,i)=>({...c,position:i+1})));
    setCompleted(prev => [
      { ...client, id:`c${Date.now()}`, position:prev.length+1, completedAt:nowStr() },
      ...prev,
    ]);
  };

  const handleRemove = (id: string) => {
    if (activeTab === 'waiting')
      setWaiting(prev => prev.filter(c=>c.id!==id).map((c,i)=>({...c,position:i+1})));
    else if (activeTab === 'in-service')
      setInService(prev => prev.filter(c=>c.id!==id).map((c,i)=>({...c,position:i+1})));
  };

  // ── Tabs config ──
  const TABS: { key: QueueTab; label: string; count: number }[] = [
    { key:'waiting',    label:'Waiting',        count:waitingCount   },
    { key:'in-service', label:'In Service',     count:inSvcCount     },
    { key:'completed',  label:'Completed Today',count:completedCount },
  ];

  // ── Render content area ──
  const renderContent = () => {
    if (frame === 'loading') return <SkeletonCards />;
    if (frame === 'error')   return <ErrorState onRetry={() => handleFrameChange('default')} />;

    if ((frame === 'empty' || activeList.length === 0) && activeTab === 'waiting')
      return <EmptyState onAdd={() => setShowAdd(true)} />;

    if (activeList.length === 0)
      return (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                      justifyContent:'center', padding:'48px 32px', textAlign:'center' }}>
          <CheckCircle2 style={{ width:40, height:40, color:T.accent }} aria-hidden />
          <p style={{ fontSize:14, color:T.muted, marginTop:12 }}>
            {activeTab === 'in-service' ? 'No clients in service right now.' : 'No clients completed yet today.'}
          </p>
        </div>
      );

    return (
      <div role="list" aria-label={`${activeTab} queue`} style={{ paddingTop:8, paddingBottom:8 }}>
        {activeList.map(client => (
          <QueueCard
            key={client.id}
            client={client}
            tab={activeTab}
            isDragging={dragId   === client.id}
            isDragOver={dragOver  === client.id && dragId !== client.id}
            onDragStart={() => handleDragStart(client.id)}
            onDragOver={(e) => handleDragOver(e, client.id)}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDrop(client.id)}
            onMenu={(id) => setMenuId(id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
                  background:T.bg, position:'relative', overflow:'hidden' }}>

      {/* ── HEADER — h 56 ── */}
      <header
        style={{
          height:56, flexShrink:0,
          background:T.bg,
          borderBottom:`1px solid ${T.border}`,
          padding:'0 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          zIndex:20,
        }}
      >
        {/* Left: back + title */}
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
            Walk-in Queue
          </h1>
        </div>

        {/* Right: + add button */}
        <button
          onClick={() => !fabDisabled && setShowAdd(true)}
          disabled={fabDisabled}
          style={{
            width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
            background:'none', border:'none', padding:0,
            cursor: fabDisabled ? 'not-allowed' : 'pointer',
            opacity: fabDisabled ? 0.4 : 1,
          }}
          aria-label="Add walk-in client"
        >
          <Plus style={{ width:24, height:24, color:T.primary }} aria-hidden />
        </button>
      </header>

      {/* ── FRAME SWITCHER (dev review strip) ── */}
      <div
        style={{
          flexShrink:0, background:T.bg, borderBottom:`1px solid ${T.border}`,
          padding:'6px 16px', display:'flex', alignItems:'center', gap:6, overflowX:'auto',
        }}
      >
        <span style={{ fontSize:11, fontWeight:500, color:T.muted, whiteSpace:'nowrap', marginRight:2 }}>
          Frame:
        </span>
        {(['default','empty','fully-booked','loading','error'] as FrameState[]).map(f => (
          <button
            key={f}
            onClick={() => handleFrameChange(f)}
            style={{
              padding:'3px 10px', borderRadius:9999, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:500, whiteSpace:'nowrap', minHeight:28,
              background: frame === f ? T.fg       : 'rgba(209,191,179,0.35)',
              color:      frame === f ? '#FFFFFF'  : T.fg,
              transition: 'background 0.15s',
            }}
            aria-pressed={frame === f}
          >
            {f === 'fully-booked' ? 'full' : f}
          </button>
        ))}
      </div>

      {/* ── STATS DASHBOARD ── */}
      {frame !== 'error' && (
        frame === 'loading'
          ? <SkeletonStats />
          : (
            <div style={{ flexShrink:0, display:'flex', gap:8, padding:'12px 16px',
                          background:T.bg }}>
              <StatCard value={waitingCount}   label="Waiting"         />
              <StatCard value={inSvcCount}     label="In Service"      />
              <StatCard value={completedCount} label="Completed Today" />
            </div>
          )
      )}

      {/* ── TAB BAR — h 44, bg #FFFFFF ── */}
      <div
        style={{
          flexShrink:0, height:44, background:T.surface,
          borderBottom:`1px solid ${T.border}`,
          display:'flex', alignItems:'center', paddingLeft:16, paddingRight:16, gap:0,
        }}
        role="tablist"
        aria-label="Queue tabs"
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex:1, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                gap:5, background:'none', border:'none', padding:0, cursor:'pointer',
                borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              <span
                style={{
                  fontSize:12, fontWeight: active ? 600 : 400,
                  lineHeight:'16px',
                  color: active ? T.fg : T.muted,
                  whiteSpace:'nowrap',
                  transition:'color 0.15s, font-weight 0.15s',
                }}
              >
                {tab.label}
              </span>
              {/* Live-count badge */}
              <span
                aria-live="polite"
                aria-label={`${tab.count} ${tab.label.toLowerCase()}`}
                style={{
                  height:20, minWidth:20, paddingLeft:6, paddingRight:6, borderRadius:9999,
                  background:T.primary, color:'#FFFFFF',
                  fontSize:12, fontWeight:500, lineHeight:'16px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={`${activeTab} queue`}
        style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
                 paddingBottom:96 /* FAB clearance */ }}
      >
        {/* Fully-booked banner */}
        {isFullyBooked && showBanner && (
          <FullyBookedBanner onDismiss={() => setShowBanner(false)} />
        )}

        {/* Queue list / empty / error / loading */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {renderContent()}
        </div>
      </div>

      {/* ── FAB — 56×56, fixed bottom-right ── */}
      <button
        onClick={() => !fabDisabled && setShowAdd(true)}
        disabled={fabDisabled}
        aria-label="Add walk-in client"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: fabDisabled ? T.border : T.primary,
          border: 'none',
          cursor: fabDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: fabDisabled
            ? 'none'
            : '0px 4px 12px rgba(227,169,160,0.4)',
          transition: 'background 0.15s, box-shadow 0.15s',
          zIndex: 10,
        }}
      >
        <Plus style={{ width:24, height:24, color:'#FFFFFF' }} aria-hidden />
      </button>

      {/* ── ADD WALK-IN SHEET ── */}
      <AddWalkInSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />

      {/* ── CLIENT ACTION SHEET ── */}
      <ClientActionSheet
        clientId={menuId}
        tab={activeTab}
        clients={activeList}
        onClose={() => setMenuId(null)}
        onStartService={handleStartService}
        onMarkComplete={handleMarkComplete}
        onRemove={handleRemove}
      />
    </div>
  );
}