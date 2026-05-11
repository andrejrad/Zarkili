/**
 * Client Lookup — G-4-lookup
 * Frames: G-4-lookup-default | G-4-lookup-no-results | G-4-lookup-loading | G-4-lookup-error
 * Device: iPhone 14 390×844
 */
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft, Search, ArrowUpDown, WifiOff, Users,
  X, Check, RefreshCw,
} from 'lucide-react';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const T = {
  bg:      '#F2EDDD',
  surface: '#FFFFFF',
  primary: '#E3A9A0',
  accent:  '#BBEDDA',
  fg:      '#1A1A1A',
  muted:   '#6B6B6B',
  border:  '#E5E0D1',
  skel:    '#F5F5F5',
  warning: '#FF9800',
  error:   '#F44336',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export type ClientTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
type FilterKey = 'all' | 'vip' | 'recent' | 'no-shows' | 'inactive';
type SortKey   = 'name' | 'last-visit' | 'ltv';
type FrameState = 'default' | 'loading' | 'error';

export interface ClientSummary {
  id:             string;
  name:           string;
  initials:       string;
  lastVisit:      string;  // MM/DD/YYYY
  lifetimeValue:  number;
  visits:         number;
  noShows:        number;
  tier:           ClientTier;
  phone:          string;
  email:          string;
  isVIP:          boolean;
  isInactive:     boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  '#E3A9A0','#BBEDDA','#D1BFB3','#A8C5BD','#C4A49B','#9ED3C0','#B8D4CE','#E8C4C0',
];
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = ((h << 5) - h) + name.charCodeAt(i); h |= 0; }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function fmtLTV(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${v}`;
}

function parseMDY(s: string): number {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
}

// Days since date string
function daysSince(s: string): number {
  return Math.floor((Date.now() - parseMDY(s)) / 86_400_000);
}

// ─── Mock data ────────────────────────────────────────────────────────────────
export const MOCK_CLIENTS: ClientSummary[] = [
  { id:'c1',  name:'Zoe Harrison',   initials:'ZH', lastVisit:'04/12/2025', lifetimeValue:2840, visits:24, noShows:0, tier:'Gold',     phone:'(213) 555-0101', email:'zoe.h@email.com',     isVIP:false, isInactive:false },
  { id:'c2',  name:'Marcus Davis',   initials:'MD', lastVisit:'03/28/2025', lifetimeValue:1150, visits:12, noShows:1, tier:'Silver',   phone:'(213) 555-0102', email:'marcus.d@email.com',   isVIP:false, isInactive:false },
  { id:'c3',  name:'Priya Patel',    initials:'PP', lastVisit:'04/20/2025', lifetimeValue:5620, visits:48, noShows:0, tier:'Platinum', phone:'(213) 555-0103', email:'priya.p@email.com',    isVIP:true,  isInactive:false },
  { id:'c4',  name:'Taylor Kim',     initials:'TK', lastVisit:'02/14/2025', lifetimeValue:380,  visits:4,  noShows:2, tier:'Bronze',   phone:'(213) 555-0104', email:'taylor.k@email.com',   isVIP:false, isInactive:false },
  { id:'c5',  name:'Aaliyah Brooks', initials:'AB', lastVisit:'04/08/2025', lifetimeValue:3240, visits:28, noShows:0, tier:'Gold',     phone:'(213) 555-0105', email:'aaliyah.b@email.com',  isVIP:true,  isInactive:false },
  { id:'c6',  name:'Jordan Lee',     initials:'JL', lastVisit:'01/30/2025', lifetimeValue:890,  visits:9,  noShows:1, tier:'Silver',   phone:'(213) 555-0106', email:'jordan.l@email.com',   isVIP:false, isInactive:true  },
  { id:'c7',  name:'Sofia Nguyen',   initials:'SN', lastVisit:'03/15/2025', lifetimeValue:220,  visits:2,  noShows:0, tier:'Bronze',   phone:'(213) 555-0107', email:'sofia.n@email.com',    isVIP:false, isInactive:false },
  { id:'c8',  name:'Cameron Walsh',  initials:'CW', lastVisit:'04/24/2025', lifetimeValue:8100, visits:72, noShows:0, tier:'Platinum', phone:'(213) 555-0108', email:'cameron.w@email.com',  isVIP:true,  isInactive:false },
  { id:'c9',  name:'Destiny Flores', initials:'DF', lastVisit:'11/05/2024', lifetimeValue:160,  visits:1,  noShows:3, tier:'Bronze',   phone:'(213) 555-0109', email:'destiny.f@email.com',  isVIP:false, isInactive:true  },
  { id:'c10', name:'Riley Chang',    initials:'RC', lastVisit:'04/01/2025', lifetimeValue:2100, visits:18, noShows:0, tier:'Gold',     phone:'(213) 555-0110', email:'riley.c@email.com',    isVIP:false, isInactive:false },
];

// ─── Tier badge ───────────────────────────────────────────────────────────────
const TIER_STYLE: Record<ClientTier, { bg: string; color: string }> = {
  Bronze:   { bg:'#FBE8D8', color:'#8B4513' },
  Silver:   { bg:'#EBEBEB', color:'#5A5A5A' },
  Gold:     { bg:'#FFF4D6', color:'#9B7000' },
  Platinum: { bg:'#EDE7F6', color:'#5E35B1' },
};

export function TierBadge({ tier, small }: { tier: ClientTier; small?: boolean }) {
  const s = TIER_STYLE[tier];
  return (
    <span
      style={{
        display:'inline-flex', alignItems:'center',
        height: small ? 20 : 22,
        paddingLeft: small ? 7 : 8, paddingRight: small ? 7 : 8,
        borderRadius:9999,
        background:s.bg, color:s.color,
        fontSize: small ? 10 : 11, fontWeight:600, lineHeight:'14px',
        whiteSpace:'nowrap',
      }}
    >
      {tier}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'12px 16px', borderBottom:`1px solid ${T.border}` }}>
      <div className="shimmer" style={{ width:40, height:40, borderRadius:9999, flexShrink:0 }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <div className="shimmer" style={{ height:16, borderRadius:8, width:'55%' }} />
        <div className="shimmer" style={{ height:12, borderRadius:8, width:'80%' }} />
      </div>
      <div className="shimmer" style={{ width:48, height:20, borderRadius:9999 }} />
    </div>
  );
}

// ─── Pull-to-refresh indicator ────────────────────────────────────────────────
function RefreshIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  gap:8, padding:'10px 0', background:T.bg }}>
      <RefreshCw style={{ width:16, height:16, color:T.primary,
                          animation:'spin 1s linear infinite' }} aria-hidden />
      <span style={{ fontSize:12, fontWeight:500, color:T.muted }}>Refreshing…</span>
    </div>
  );
}

// ─── Client row ───────────────────────────────────────────────────────────────
function ClientRow({
  client, onSelect,
}: {
  client: ClientSummary;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px',
        borderBottom:`1px solid ${T.border}`,
        background:T.surface,
        border:'none', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:T.border,
        cursor:'pointer', textAlign:'left',
        minHeight:68,
      }}
      aria-label={`View ${client.name}, ${client.tier} tier, last visit ${client.lastVisit}`}
    >
      {/* Avatar — 40×40 */}
      <div
        style={{
          width:40, height:40, borderRadius:9999, flexShrink:0,
          background: avatarColor(client.name),
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
        aria-hidden
      >
        <span style={{ fontSize:13, fontWeight:600, color:'#FFFFFF' }}>
          {client.initials}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14, fontWeight:500, lineHeight:'20px', color:T.fg,
                         overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {client.name}
          </span>
          {client.isVIP && (
            <span style={{ fontSize:10, fontWeight:600, color:'#9B7000',
                           background:'#FFF4D6', borderRadius:9999,
                           paddingLeft:5, paddingRight:5, height:16, lineHeight:'16px',
                           flexShrink:0 }}>
              VIP
            </span>
          )}
          {client.noShows > 0 && (
            <span style={{ fontSize:10, fontWeight:600, color:T.warning,
                           background:'rgba(255,152,0,0.1)', borderRadius:9999,
                           paddingLeft:5, paddingRight:5, height:16, lineHeight:'16px',
                           flexShrink:0 }}>
              {client.noShows} NS
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
          <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted }}>
            Last visit {client.lastVisit}
          </span>
          <span style={{ width:3, height:3, borderRadius:9999, background:T.muted,
                         flexShrink:0 }} aria-hidden />
          <span style={{ fontSize:12, fontWeight:500, lineHeight:'16px', color:T.fg }}>
            {fmtLTV(client.lifetimeValue)}
          </span>
        </div>
      </div>

      {/* Right: tier badge */}
      <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
        <TierBadge tier={client.tier} small />
      </div>
    </button>
  );
}

// ─── Empty / error states ────────────────────────────────────────────────────
function NoResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', flex:1, padding:'48px 32px', textAlign:'center' }}>
      <Search style={{ width:56, height:56, color:T.muted, strokeWidth:1.25 }} aria-hidden />
      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:20 }}>
        No clients found
      </h2>
      <p style={{ fontSize:14, fontWeight:400, lineHeight:'20px', color:T.muted,
                  marginTop:8, maxWidth:260 }}>
        No results for "<strong>{query}</strong>". Try a different name, phone, or email.
      </p>
      <button
        onClick={onClear}
        style={{
          marginTop:20, paddingLeft:24, paddingRight:24, paddingTop:12, paddingBottom:12,
          borderRadius:12, border:`1.5px solid ${T.primary}`, background:'transparent',
          color:T.primary, fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44,
        }}
        aria-label="Clear search"
      >
        Clear search
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', flex:1, padding:'48px 32px', textAlign:'center' }}>
      <Users style={{ width:64, height:64, color:T.muted, strokeWidth:1.25 }} aria-hidden />
      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:24 }}>
        No clients yet
      </h2>
      <p style={{ fontSize:14, fontWeight:400, lineHeight:'20px', color:T.muted,
                  marginTop:8, maxWidth:260 }}>
        Client profiles appear here once they've visited your salon.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', flex:1, padding:'48px 32px', textAlign:'center' }}>
      <WifiOff style={{ width:64, height:64, color:T.muted, strokeWidth:1.25 }} aria-hidden />
      <h2 style={{ fontSize:24, fontWeight:600, lineHeight:'32px', color:T.fg, marginTop:24 }}>
        Couldn't load clients
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

// ─── Filter chip ─────────────────────────────────────────────────────────────
function FilterChip({
  label, active, count, onClick,
}: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display:'inline-flex', alignItems:'center', gap:5,
        height:32, paddingLeft:12, paddingRight:12, flexShrink:0,
        borderRadius:9999,
        background: active ? T.primary : T.surface,
        border: `1px solid ${active ? T.primary : T.border}`,
        color: active ? '#FFFFFF' : T.fg,
        fontSize:13, fontWeight:500, cursor:'pointer',
        transition:'background 0.15s, border-color 0.15s, color 0.15s',
        whiteSpace:'nowrap',
      }}
    >
      {active && <Check style={{ width:13, height:13 }} aria-hidden />}
      {label}
      {count !== undefined && (
        <span style={{
          height:16, minWidth:16, paddingLeft:4, paddingRight:4, borderRadius:9999,
          background: active ? 'rgba(255,255,255,0.3)' : T.border,
          fontSize:10, fontWeight:600, lineHeight:'16px',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          color: active ? '#FFFFFF' : T.muted,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Sort menu ────────────────────────────────────────────────────────────────
const SORT_LABELS: Record<SortKey, string> = {
  'name':       'Name A–Z',
  'last-visit': 'Recent Visit',
  'ltv':        'Top Spenders',
};

// ─── Main screen ─────────────────────────────────────────────────────────────
interface ClientLookupScreenProps {
  onBack:         () => void;
  onClientSelect: (clientId: string) => void;
}

export function ClientLookupScreen({ onBack, onClientSelect }: ClientLookupScreenProps) {
  const [frame,        setFrame]        = useState<FrameState>('default');
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortBy,       setSortBy]       = useState<SortKey>('last-visit');
  const [showSort,     setShowSort]     = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter counts
  const filterCounts: Record<FilterKey, number> = useMemo(() => ({
    all:        MOCK_CLIENTS.length,
    vip:        MOCK_CLIENTS.filter(c => c.isVIP).length,
    recent:     MOCK_CLIENTS.filter(c => daysSince(c.lastVisit) <= 30).length,
    'no-shows': MOCK_CLIENTS.filter(c => c.noShows > 0).length,
    inactive:   MOCK_CLIENTS.filter(c => c.isInactive).length,
  }), []);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...MOCK_CLIENTS];

    switch (activeFilter) {
      case 'vip':      list = list.filter(c => c.isVIP); break;
      case 'recent':   list = list.filter(c => daysSince(c.lastVisit) <= 30); break;
      case 'no-shows': list = list.filter(c => c.noShows > 0); break;
      case 'inactive': list = list.filter(c => c.isInactive); break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }

    switch (sortBy) {
      case 'name':       list.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'last-visit': list.sort((a,b) => parseMDY(b.lastVisit) - parseMDY(a.lastVisit)); break;
      case 'ltv':        list.sort((a,b) => b.lifetimeValue - a.lifetimeValue); break;
    }

    return list;
  }, [search, activeFilter, sortBy]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  const handleFrameChange = (f: FrameState) => {
    setFrame(f);
    setSearch('');
  };

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key:'all',       label:'All'       },
    { key:'vip',       label:'VIP'       },
    { key:'recent',    label:'Recent'    },
    { key:'no-shows',  label:'No-shows'  },
    { key:'inactive',  label:'Inactive'  },
  ];

  const noResults = filtered.length === 0 && search.trim() !== '';
  const noClients = filtered.length === 0 && search.trim() === '' && activeFilter === 'all';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
                  background:T.bg, position:'relative', overflow:'hidden' }}>

      {/* ── HEADER ── */}
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
            Clients
          </h1>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {/* Sort button */}
          <button
            onClick={() => setShowSort(v => !v)}
            style={{ width:44, height:44, display:'flex', alignItems:'center',
                     justifyContent:'center', background:'none', border:'none',
                     padding:0, cursor:'pointer' }}
            aria-label={`Sort by: ${SORT_LABELS[sortBy]}`}
          >
            <ArrowUpDown style={{ width:20, height:20, color:T.fg }} aria-hidden />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            style={{ width:44, height:44, display:'flex', alignItems:'center',
                     justifyContent:'center', background:'none', border:'none',
                     padding:0, cursor:'pointer' }}
            aria-label="Refresh client list"
          >
            <RefreshCw
              style={{ width:20, height:20, color:T.primary,
                       animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
              aria-hidden
            />
          </button>
        </div>
      </header>

      {/* ── SORT DROPDOWN ── */}
      {showSort && (
        <div style={{
          position:'absolute', top:56, right:16, zIndex:50,
          background:T.surface, borderRadius:16,
          boxShadow:'0 4px 24px rgba(0,0,0,0.12)',
          border:`1px solid ${T.border}`,
          overflow:'hidden', minWidth:168,
        }}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => { setSortBy(k); setShowSort(false); }}
              style={{
                width:'100%', padding:'12px 16px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background: sortBy === k ? `rgba(227,169,160,0.1)` : 'none',
                border:'none',
                borderBottom: k !== 'ltv' ? `1px solid ${T.border}` : 'none',
                cursor:'pointer', textAlign:'left',
                fontSize:14, fontWeight: sortBy === k ? 600 : 400,
                color: sortBy === k ? T.primary : T.fg,
                minHeight:44,
              }}
              aria-pressed={sortBy === k}
            >
              {SORT_LABELS[k]}
              {sortBy === k && <Check style={{ width:16, height:16, color:T.primary }} aria-hidden />}
            </button>
          ))}
        </div>
      )}
      {showSort && (
        <div style={{ position:'absolute', inset:0, zIndex:40 }} onClick={() => setShowSort(false)} aria-hidden />
      )}

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
            onClick={() => handleFrameChange(f)}
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
        <button
          onClick={() => { setFrame('default'); setSearch('zzz not found xyz'); }}
          style={{
            padding:'3px 10px', borderRadius:9999, border:'none', cursor:'pointer',
            fontSize:11, fontWeight:500, whiteSpace:'nowrap', minHeight:28,
            background: 'rgba(209,191,179,0.35)', color: T.fg,
          }}
        >
          no-results
        </button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ flexShrink:0, padding:'12px 16px 0', background:T.bg }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          height:44, borderRadius:9999,
          background:T.surface, border:`1px solid ${T.border}`,
          padding:'0 14px',
        }}>
          <Search style={{ width:18, height:18, color:T.muted, flexShrink:0 }} aria-hidden />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:1, border:'none', outline:'none', background:'transparent',
              fontSize:14, fontWeight:400, lineHeight:'20px', color:T.fg,
            }}
            aria-label="Search clients by name, phone, or email"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ width:20, height:20, borderRadius:9999, background:T.border,
                       border:'none', display:'flex', alignItems:'center', justifyContent:'center',
                       cursor:'pointer', padding:0, flexShrink:0 }}
              aria-label="Clear search"
            >
              <X style={{ width:12, height:12, color:T.muted }} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div style={{
        flexShrink:0, display:'flex', gap:8, padding:'10px 16px',
        overflowX:'auto', scrollbarWidth:'none',
      }}>
        {FILTERS.map(({ key, label }) => (
          <FilterChip
            key={key}
            label={label}
            active={activeFilter === key}
            count={key !== 'all' ? filterCounts[key] : undefined}
            onClick={() => setActiveFilter(key)}
          />
        ))}
      </div>

      {/* ── COUNT ROW ── */}
      {frame === 'default' && !noResults && !noClients && (
        <div style={{ flexShrink:0, padding:'0 16px 6px',
                      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:400, lineHeight:'16px', color:T.muted }}>
            {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
          </span>
          <span style={{ fontSize:12, fontWeight:500, lineHeight:'16px', color:T.muted }}>
            {SORT_LABELS[sortBy]}
          </span>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ── */}
      <div
        role="list"
        aria-label="Client list"
        style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
                 background:T.bg }}
      >
        {/* Pull-to-refresh indicator */}
        <RefreshIndicator active={isRefreshing} />

        {frame === 'loading' && (
          <div style={{ background:T.surface }}>
            {Array.from({ length:7 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {frame === 'error' && <ErrorState onRetry={() => handleFrameChange('default')} />}

        {frame === 'default' && (
          <>
            {noResults  && <NoResultsState query={search} onClear={() => setSearch('')} />}
            {noClients  && <EmptyState />}
            {!noResults && !noClients && (
              <div style={{ background:T.surface }}>
                {filtered.map(client => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onSelect={() => onClientSelect(client.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
