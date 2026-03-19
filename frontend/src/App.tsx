import React, { useState } from 'react'
import {
    Search,
    TreePine,
    Crown,
    User,
    Loader2,
    AlertCircle,
    Maximize2,
    Minimize2,
    ChevronDown,
    ArrowRight,
    RefreshCw
} from 'lucide-react'

// --- Types ---
interface Person {
    Id: number
    Name: string
    Surname: string
    BirthDate: string | null
    IdentityNumber: string
    FatherId?: number | null
    MotherId?: number | null
    children?: Person[]
}

const API_BASE = (() => {
    const rawUrl = import.meta.env.VITE_API_URL ?? '/api'
    return rawUrl.replace(/\/$/, '')
})()

// --- Components ---
import { ZoomableTreeCanvas } from './ZoomableTreeCanvas'

const Header = ({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) => (
    <header className="flex items-center justify-between px-8 py-6 bg-[#0b0e14]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                <TreePine className="w-6 h-6 text-sky-400 font-bold" />
            </div>
            <div>
                <h1 className="text-xl font-black tracking-tighter text-white">WHO IS MY GRANDDADDY?</h1>
                <p className="text-[10px] text-sky-500/60 font-mono -mt-1">PRECISION GENEALOGY CORE v3.0</p>
            </div>
        </div>
        <nav className="flex gap-2">
            <button
                onClick={() => onViewChange('tree')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeView === 'tree'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <TreePine className="w-3.5 h-3.5" />
                FAMILY TREE VIEWER
            </button>
            <button
                onClick={() => onViewChange('root')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeView === 'root'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <Crown className="w-3.5 h-3.5" />
                ROOT ASCENDANT
            </button>
        </nav>
    </header>
)

const TreeRendererBase = ({ person, depth = 0 }: { person: Person, depth?: number }) => {
    // Root expanded, deeper generations collapsed by default.
    // This avoids showing every node open for a fresh search,
    // but once you open a branch and load +10, its children stay open.
    const [isExpanded, setIsExpanded] = useState(depth < 1)
    const hasChildren = person.children && person.children.length > 0

    return (
        <div className="flex flex-col items-center" {...(depth === 0 ? { 'data-root-node': true } : {})}>
            <div
                className={`relative p-4 rounded-xl border transition-all duration-300 min-w-[180px] ${depth === 0 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-800/40 border-white/5'
                    } hover:scale-105 hover:border-sky-500/40 shadow-xl group`}
            >
                {depth === 0 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-500 drop-shadow-lg" />}
                <div className="text-center">
                    <p className="text-[10px] text-sky-500 font-mono mb-1">{person.IdentityNumber}</p>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{person.Name} {person.Surname}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{person.BirthDate || "Unknown Birth"}</p>
                </div>
                {hasChildren && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-1 rounded-full bg-slate-700 border border-white/10 text-white hover:bg-sky-500 transition-colors"
                    >
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div
                    className="
                        relative pt-8 flex gap-8
                        before:content-[''] before:absolute before:top-0 before:left-1/2
                        before:-translate-x-1/2 before:h-6 before:w-px before:bg-slate-700/70
                    "
                >
                    {/* Horizontal connector spanning all children */}
                    <div className="absolute top-6 left-0 right-0 flex justify-between px-4 pointer-events-none">
                        {person.children!.map((_, idx) => (
                            <div
                                key={idx}
                                className="h-px w-full bg-slate-700/70 last:w-0"
                            />
                        ))}
                    </div>

                    {person.children!.map((child, idx) => (
                        <div
                            key={child.Id}
                            className="relative flex flex-col items-center"
                        >
                            {/* Vertical line from the horizontal bar down to each child */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-px bg-slate-700/70" />
                            <TreeRenderer person={child} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const TreeRenderer = React.memo(TreeRendererBase)

// --- Main App ---

export default function App() {
    const [view, setView] = useState('tree')
    const [identity, setIdentity] = useState('')
    const [levels, setLevels] = useState(10) // initially 10 levels deep
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [canvasResetKey, setCanvasResetKey] = useState(0)
    const [lastSearchedId, setLastSearchedId] = useState<string | null>(null)

    const handleSearch = async (e?: React.FormEvent, force = false) => {
        if (e) e.preventDefault()
        if (!identity) return

        // Agar same ID dubara type karo (manual search),
        // to kuch mat karo. "+10" ke liye force=true aayega.
        if (!force && lastSearchedId && identity === lastSearchedId) {
            return
        }

        // Nayi ID pe always root se 10 levels se start.
        let effectiveLevels = levels
        if (!force && identity !== lastSearchedId) {
            effectiveLevels = 10
            setLevels(10)
        }

        setLoading(true)
        setError(null)

        try {
            const endpoint = view === 'tree'
                ? `/tree/${identity}/?levels=${effectiveLevels}`
                : `/root-ascendant/${identity}/`

            const res = await fetch(`${API_BASE}${endpoint}`)
            if (!res.ok) throw new Error("ID_NOT_FOUND")
            const result = await res.json()
            setData(result)
            setLastSearchedId(identity)
            // each successful search recenters the canvas
            setCanvasResetKey(prev => prev + 1)
        } catch (err) {
            setError("ERR_ID_NOT_FOUND: Subject identification failed.")
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0b0e14] text-slate-300 font-sans selection:bg-sky-500/30 overflow-x-hidden">
            <Header
                activeView={view}
                onViewChange={(v) => {
                    setView(v)
                    setData(null)
                    setError(null)
                    setLevels(10) // reset to initial 10 when switching views
                    setLastSearchedId(null) // allow search again in the new view with same identity
                    setCanvasResetKey(prev => prev + 1)
                }}
            />

            <main className="max-w-7xl mx-auto p-8 pb-0">
                {/* Search Section */}
                <section className="mb-12">
                    <div className="flex flex-col items-center justify-center text-center mb-8">
                        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">
                            {view === 'tree' ? 'Family Tree Viewer' : 'Root Ascendant'}
                        </h2>
                        <div className="flex items-center gap-2 text-sky-500/60 font-mono text-xs uppercase tracking-widest">
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            <span>System Status: Visual Identification Active</span>
                        </div>
                    </div>

                    <form onSubmit={(e) => handleSearch(e)} className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent group-hover:via-sky-500 transition-all duration-500" />
                        <div className="flex items-center bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden focus-within:border-sky-500/50 transition-all shadow-2xl backdrop-blur-md">
                            <div className="pl-6 text-slate-500">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={identity}
                                onChange={(e) => setIdentity(e.target.value)}
                                placeholder="INITIATE IDENTITY SCAN (INPUT SUBJECT ID)..."
                                className="flex-1 bg-transparent px-6 py-5 text-sm font-mono focus:outline-none text-white tracking-tight"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-sky-500 hover:bg-sky-400 text-white font-black text-xs px-10 py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest active:scale-95"
                            >
                                {loading ? 'Processing...' : 'Search'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Results Section */}
                <section className="relative min-h-[500px] h-[70vh] border border-white/5 bg-slate-900/20 rounded-3xl p-4 overflow-hidden">
                    {loading && !data && (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
                            <p className="text-xs font-mono tracking-widest text-sky-500/60 uppercase">Decrypting Lineage Matrix...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-6 max-w-md text-center">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tighter">DATA CORRUPTION ALERT</h3>
                                <p className="text-sm text-slate-400 font-mono leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {!data && !loading && !error && (
                        <div className="text-center opacity-30 select-none">
                            <div className="mb-6 flex justify-center">
                                <div className="p-8 rounded-full border-4 border-dashed border-slate-700">
                                    <User className="w-20 h-20 text-slate-700" />
                                </div>
                            </div>
                            <p className="text-xs font-mono tracking-[0.2em] uppercase">Awaiting Identity Sequence Input</p>
                        </div>
                    )}

                    {data && view === 'tree' && (
                        <div className="flex flex-col items-center gap-4 w-full h-full">
                            <div className="self-end text-[10px] font-mono text-slate-500">
                                Showing up to <span className="text-sky-400 font-semibold">{levels}</span> levels
                            </div>

                            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                                <ZoomableTreeCanvas resetKey={canvasResetKey}>
                                    <div className="flex flex-col items-center gap-12">
                                        {/* key ensures new search (new Id) remounts the tree,
                                            so expansion state doesn't leak between identities */}
                                        <TreeRenderer key={data.Id} person={data} />
                                    </div>
                                </ZoomableTreeCanvas>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    const next = levels + 10
                                    setLevels(next)
                                    // fetch with new levels
                                    handleSearch(undefined, true)
                                }}
                                className="mt-2 px-8 py-3 bg-slate-800 hover:bg-sky-500 border border-white/5 rounded-full text-[10px] font-black tracking-widest text-white transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'EXPANDING MATRIX...' : 'LOAD MORE LEVELS (+10)'}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {data && view === 'root' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center scale-150">
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-sky-500 blur-3xl opacity-20 -z-10 animate-pulse" />
                                <div className="p-10 rounded-full bg-sky-500/10 border-2 border-sky-500/30">
                                    <Crown className="w-24 h-24 text-sky-400 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-mono text-sky-500 uppercase tracking-[0.4em]">Root Ascendant Identified</p>
                                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{data.Name} {data.Surname}</h2>
                                <div className="flex items-center justify-center gap-4 text-slate-500 font-mono text-[10px]">
                                    <span className="p-2 bg-white/5 rounded">ID: {data.IdentityNumber}</span>
                                    <span className="p-2 bg-white/5 rounded">BORN: {data.BirthDate || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
