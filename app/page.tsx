'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  MapPin, Star, Phone, Navigation, Plus, Search, 
  Pizza, Wine, Utensils, Coffee, Store, X, Check, Heart, 
  Smile, GlassWater, Home as HomeIcon
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const iconMap: { [key: string]: any } = {
  "Pizza": <Pizza size={18}/>, "Vino": <Wine size={18}/>, "Bistrot": <Utensils size={18}/>,
  "Caffè": <Coffee size={18}/>, "Ristorante": <Store size={18}/>
}

export default function Home() {
  const [locali, setLocali] = useState<any[]>([])
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null)
  const [raggio, setRaggio] = useState(5)
  const [catSelezionata, setCatSelezionata] = useState('Tutti')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [newLocale, setNewLocale] = useState({
    id: null as string | null, nome: '', indirizzo: '', telefono: '', 
    rating_cibo: 0, rating_vino: 0, rating_servizio: 0, 
    categoria: 'Ristorante', note: '', lat: 0, lng: 0, visitato: false
  })

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(coords); 
        setNewLocale(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))
      })
    }
  }, [])

  useEffect(() => { fetchLocali() }, [userPos, raggio, catSelezionata])

  const fetchLocali = async () => {
    setLoading(true)
    let query;
    if (userPos) {
      const { data } = await supabase.rpc('vicini_a_me', { lat: userPos.lat, lng: userPos.lng, raggio_km: raggio })
      query = data
    } else {
      const { data } = await supabase.from('locali').select('*').order('created_at', { ascending: false })
      query = data
    }
    if (catSelezionata !== 'Tutti') query = query?.filter((l: any) => l.categoria === catSelezionata)
    setLocali(query || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const isVisitato = newLocale.rating_cibo > 0 || newLocale.visitato;
    
    const { error } = await supabase.rpc('save_locale', {
      n_id: newLocale.id, n_nome: newLocale.nome, n_indirizzo: newLocale.indirizzo, n_telefono: newLocale.telefono,
      n_rating_cibo: newLocale.rating_cibo, n_rating_vino: newLocale.rating_vino, n_rating_servizio: newLocale.rating_servizio,
      n_categoria: newLocale.categoria, n_note: newLocale.note || '', // Assicuriamo stringa vuota
      n_lat: newLocale.lat, n_lng: newLocale.lng, n_visitato: isVisitato
    })
    if (!error) {
      setIsModalOpen(false)
      fetchLocali()
      resetForm()
    }
  }

  const resetForm = () => {
    setNewLocale({ 
      id: null, nome: '', indirizzo: '', telefono: '', 
      rating_cibo: 0, rating_vino: 0, rating_servizio: 0, 
      categoria: 'Ristorante', note: '', 
      lat: userPos?.lat || 0, lng: userPos?.lng || 0, visitato: false 
    })
  }

  const openReview = (l: any) => {
    setNewLocale({ 
      ...l, 
      note: l.note || '', // TRUCCO: Se la nota è null, carichiamo stringa vuota ""
      lat: l.posizione?.coordinates?.[1] || userPos?.lat || 0, 
      lng: l.posizione?.coordinates?.[0] || userPos?.lng || 0 
    })
    setIsModalOpen(true)
  }

  const RenderRating = ({ val, icon: Icon, color }: any) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Icon key={i} size={14} fill={i < val ? color : "none"} color={i < val ? color : "#e2e8f0"} strokeWidth={2.5} />
      ))}
    </div>
  )

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-32 font-sans">
      
      <div className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 p-6 space-y-6">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tighter">FIGLI DELLE STELLE ✨</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cerca, Prova, Ricorda</p>
            </div>
            <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-all"><Plus size={24}/></button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {['Tutti', 'Pizza', 'Vino', 'Bistrot', 'Caffè', 'Ristorante'].map((cat) => (
              <button key={cat} onClick={() => setCatSelezionata(cat)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all border ${catSelezionata === cat ? 'bg-amber-400 border-amber-400 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}> {cat} </button>
            ))}
          </div>

          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
            <div className="flex justify-between items-end mb-3 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Raggio d'azione</span>
              <span className="text-sm font-black text-slate-900">{raggio} <span className="text-[10px] text-slate-400 italic">km</span></span>
            </div>
            <input type="range" min="1" max="50" value={raggio} onChange={(e) => setRaggio(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"/>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">Allineamento stelle...</div>
        ) : (
          <div className="grid gap-6">
            {locali.map((l) => (
              <div key={l.id} className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden transition-all ${l.rating_cibo === 1 ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                
                <div className="absolute top-6 right-6 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <span className="text-slate-400">{iconMap[l.categoria]}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{l.categoria}</span>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-black mb-2 text-slate-900">{l.nome}</h3>
                  
                  {l.visitato ? (
                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400">Cibo</span>
                        <RenderRating val={l.rating_cibo} icon={Star} color="#f59e0b" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400">Vino</span>
                        <RenderRating val={l.rating_vino} icon={GlassWater} color="#be185d" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400">Ospitalità</span>
                        <RenderRating val={l.rating_servizio} icon={Smile} color="#0ea5e9" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Da Provare ✨</span>
                       <button onClick={() => openReview(l)} className="bg-white text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm border border-amber-100 uppercase">Aggiungi Voto</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}`)} className="py-3 bg-slate-900 text-white font-black text-[10px] uppercase rounded-2xl flex items-center justify-center gap-2"> <Navigation size={14}/> Naviga </button>
                    <button onClick={() => window.open(`tel:${l.telefono}`)} className="py-3 bg-slate-100 text-slate-900 font-black text-[10px] uppercase rounded-2xl flex items-center justify-center gap-2"> <Phone size={14}/> Chiama </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic">{newLocale.id ? 'Recensisci Locale ✨' : 'Nuova Stella ✨'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" placeholder="Nome locale" required disabled={!!newLocale.id} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none disabled:opacity-50" value={newLocale.nome} onChange={e => setNewLocale({...newLocale, nome: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <select className="p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none text-sm" value={newLocale.categoria} onChange={e => setNewLocale({...newLocale, categoria: e.target.value})}>
                  {['Pizza', 'Vino', 'Bistrot', 'Caffè', 'Ristorante'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="bg-slate-50 rounded-2xl flex items-center justify-center gap-2 px-4">
                   <input type="checkbox" id="v" checked={newLocale.visitato} onChange={e => setNewLocale({...newLocale, visitato: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                   <label htmlFor="v" className="text-[10px] font-black uppercase text-slate-500">Già provato</label>
                </div>
              </div>

              {(newLocale.visitato || newLocale.rating_cibo > 0) && (
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-amber-100/50">
                  {[
                    { label: 'Cibo 🍕', key: 'rating_cibo', icon: Star, color: '#f59e0b' },
                    { label: 'Vino 🍷', key: 'rating_vino', icon: GlassWater, color: '#be185d' },
                    { label: 'Servizio 😊', key: 'rating_servizio', icon: Smile, color: '#0ea5e9' }
                  ].map((r) => (
                    <div key={r.key} className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500">{r.label}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <button type="button" key={i} onClick={() => setNewLocale({...newLocale, [r.key]: i+1})}>
                            <r.icon size={22} fill={i < (newLocale as any)[r.key] ? r.color : "none"} color={i < (newLocale as any)[r.key] ? r.color : "#cbd5e1"} strokeWidth={2.5}/>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <input type="text" placeholder="Indirizzo" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" value={newLocale.indirizzo} onChange={e => setNewLocale({...newLocale, indirizzo: e.target.value})} />
                <button type="button" onClick={() => { setNewLocale({...newLocale, lat: userPos?.lat || 0, lng: userPos?.lng || 0}); alert("Posizione salvata!") }} className="absolute right-2 top-2 p-2 bg-white text-amber-500 rounded-xl shadow-sm border border-slate-100"> <MapPin size={20}/> </button>
              </div>

              {/* FIX: Aggiunto || '' per evitare l'errore null */}
              <textarea 
                placeholder="Note personali..." 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none h-20" 
                value={newLocale.note || ''} 
                onChange={e => setNewLocale({...newLocale, note: e.target.value})}
              ></textarea>

              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-2"> <Check size={20}/> {newLocale.id ? 'Salva Recensione' : 'Salva nei Preferiti'} </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}