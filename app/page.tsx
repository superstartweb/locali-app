'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  MapPin, Star, Phone, Navigation, Plus, Search, 
  Pizza, Wine, Utensils, Coffee, X, Check, Heart, 
  Smile, GlassWater, Home as HomeIcon, Trash2, Beef, Fish
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const iconMap: { [key: string]: any } = {
  "Pizza": <Pizza size={18}/>, "Vino": <Wine size={18}/>, "Bistrot": <Utensils size={18}/>,
  "Caffè": <Coffee size={18}/>, "Carne": <Beef size={18}/>, "Pesce": <Fish size={18}/>
}

export default function Home() {
  const [locali, setLocali] = useState<any[]>([])
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null)
  const [raggio, setRaggio] = useState(5)
  const [catSelezionata, setCatSelezionata] = useState('Tutti')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [soloVisitati, setSoloVisitati] = useState(false)

  const [newLocale, setNewLocale] = useState({
    id: null as string | null, nome: '', indirizzo: '', telefono: '', 
    rating_cibo: 0, rating_vino: 0, rating_servizio: 0, 
    categoria: 'Carne', note: '', lat: 0, lng: 0, visitato: false
  })

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, null, { enableHighAccuracy: true })
    }
  }, [])

  useEffect(() => { fetchLocali() }, [userPos, raggio, catSelezionata, soloVisitati])

  const fetchLocali = async () => {
    if (!userPos) return;
    setLoading(true)
    const { data, error } = await supabase.rpc('vicini_a_me', { lat: userPos.lat, lng: userPos.lng, raggio_km: raggio })
    if (!error) {
      let filtered = data
      if (catSelezionata !== 'Tutti') filtered = filtered.filter((l: any) => l.categoria === catSelezionata)
      if (soloVisitati) filtered = filtered.filter((l: any) => l.visitato === true)
      setLocali(filtered)
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const isVisitato = newLocale.rating_cibo > 0 || newLocale.visitato;
    const { error } = await supabase.rpc('save_locale', {
      n_id: newLocale.id, n_nome: newLocale.nome, n_indirizzo: newLocale.indirizzo, n_telefono: newLocale.telefono,
      n_rating_cibo: newLocale.rating_cibo, n_rating_vino: newLocale.rating_vino, n_rating_servizio: newLocale.rating_servizio,
      n_categoria: newLocale.categoria, n_note: newLocale.note || '', n_lat: newLocale.lat, n_lng: newLocale.lng, n_visitato: isVisitato
    })
    if (!error) { setIsModalOpen(false); fetchLocali(); resetForm() }
  }

  const handleDelete = async () => {
    if (!newLocale.id || !confirm("Eliminare definitivamente?")) return
    await supabase.from('locali').delete().eq('id', newLocale.id)
    setIsModalOpen(false); fetchLocali(); resetForm()
  }

  const resetForm = () => {
    setNewLocale({ id: null, nome: '', indirizzo: '', telefono: '', rating_cibo: 0, rating_vino: 0, rating_servizio: 0, categoria: 'Carne', note: '', lat: 0, lng: 0, visitato: false })
  }

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-40 font-sans">
      
      {/* HEADER FISSO IN ALTO */}
      <div className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 p-6 shadow-sm">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic text-slate-900">FIGLI DELLE STELLE ✨</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Le mie tappe stellari</p>
            </div>
            <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90"><Plus size={24}/></button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Tutti', 'Carne', 'Pesce', 'Pizza', 'Vino', 'Bistrot'].map((cat) => (
              <button key={cat} onClick={() => setCatSelezionata(cat)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all border ${catSelezionata === cat ? 'bg-amber-400 border-amber-400 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}> {cat} </button>
            ))}
          </div>

          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
             <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raggio</span>
                <span className="text-xs font-black">{raggio} km</span>
             </div>
             <input type="range" min="1" max="50" value={raggio} onChange={(e) => setRaggio(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-slate-900 cursor-pointer"/>
          </div>
        </div>
      </div>

      {/* LISTA LOCALI */}
      <div className="max-w-xl mx-auto p-5 space-y-6">
        {locali.map((l) => (
          <div key={l.id} onClick={() => {setNewLocale({...l, note: l.note || '', lat: l.posizione?.coordinates?.[1], lng: l.posizione?.coordinates?.[0]}); setIsModalOpen(true)}} className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden transition-all active:scale-[0.98] ${l.rating_cibo === 1 ? 'opacity-60' : ''}`}>
            <div className="absolute top-6 left-6 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md">
               {l.distanza_km < 0.05 ? 'Qui 📍' : l.distanza_km < 1 ? `${Math.round(l.distanza_km * 1000)} m` : `${l.distanza_km.toFixed(1)} km`}
            </div>
            <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <span className="text-slate-400">{iconMap[l.categoria]}</span>
               <span className="text-[9px] font-black uppercase text-slate-500">{l.categoria}</span>
            </div>
            <div className="mt-8 mb-6">
              <h3 className="text-2xl font-black mb-3 text-slate-900">{l.nome}</h3>
              {l.visitato ? (
                <div className="flex gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <div className="flex items-center gap-1"><Star size={12} className="text-amber-400" fill="currentColor"/> {l.rating_cibo}</div>
                  <div className="flex items-center gap-1"><GlassWater size={12} className="text-rose-500" fill="currentColor"/> {l.rating_vino}</div>
                  <div className="flex items-center gap-1"><Smile size={12} className="text-blue-400" fill="currentColor"/> {l.rating_servizio}</div>
                </div>
              ) : (
                <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 flex justify-between items-center">
                   <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Da Provare ✨</span>
                   <span className="text-[9px] font-bold text-amber-500 underline uppercase tracking-tighter">Vota</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}`) }} className="py-4 bg-slate-900 text-white font-black text-[11px] uppercase rounded-2xl flex items-center justify-center gap-2 shadow-lg"> <Navigation size={14}/> Naviga </button>
                <a onClick={(e) => e.stopPropagation()} href={`tel:${l.telefono}`} className="py-4 bg-slate-100 text-slate-900 font-black text-[11px] uppercase rounded-2xl flex items-center justify-center gap-2 border border-slate-200"> <Phone size={14}/> Chiama </a>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER NAV FISSO IN BASSO */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center z-50 px-6 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-xl text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-14 border border-white/10 pointer-events-auto">
           <button onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setSoloVisitati(false); setCatSelezionata('Tutti') }} className={!soloVisitati ? 'text-amber-400' : 'text-white/30'}><HomeIcon size={24} strokeWidth={2.5}/></button>
           <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-white/30"><Search size={24} strokeWidth={2.5}/></button>
           <button onClick={() => setSoloVisitati(!soloVisitati)} className={soloVisitati ? 'text-amber-400' : 'text-white/30'}><Heart size={24} strokeWidth={2.5} fill={soloVisitati ? "currentColor" : "none"}/></button>
        </div>
      </div>

      {/* MODAL EDIT / ADD - TOTALMENTE RIFATTO PER MOBILE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col justify-end">
          
          {/* Tasto chiusura ALTO e SICURO */}
          <div className="w-full flex justify-end p-6">
             <button onClick={() => setIsModalOpen(false)} className="bg-white/10 text-white p-4 rounded-full active:scale-90 transition-all border border-white/20">
               <X size={28}/>
             </button>
          </div>

          <div className="bg-white w-full rounded-t-[3rem] p-8 pb-16 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500">
            <h2 className="text-2xl font-black italic text-slate-900 mb-8 border-b border-slate-50 pb-4">
              {newLocale.id ? 'Modifica Stella' : 'Nuova Stella ✨'}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <input type="text" placeholder="Nome locale" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-amber-400" value={newLocale.nome} onChange={e => setNewLocale({...newLocale, nome: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <select className="p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none text-sm" value={newLocale.categoria} onChange={e => setNewLocale({...newLocale, categoria: e.target.value})}>
                  {['Carne', 'Pesce', 'Pizza', 'Vino', 'Bistrot', 'Caffè'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="bg-slate-50 rounded-2xl flex items-center justify-center gap-3 p-3 border-2 border-transparent has-[:checked]:border-amber-400 transition-all">
                   <input type="checkbox" id="v" checked={newLocale.visitato} onChange={e => setNewLocale({...newLocale, visitato: e.target.checked})} className="w-6 h-6 accent-amber-500" />
                   <label htmlFor="v" className="text-[10px] font-black uppercase text-slate-500">Provato</label>
                </div>
              </div>

              {(newLocale.visitato || newLocale.rating_cibo > 0) && (
                <div className="space-y-5 bg-slate-50 p-6 rounded-3xl border border-amber-100/30">
                  {[
                    { label: 'Cibo 🍕', k: 'rating_cibo', ic: Star, col: '#f59e0b' },
                    { label: 'Vino 🍷', k: 'rating_vino', ic: GlassWater, col: '#be185d' },
                    { label: 'Ospitalità 😊', k: 'rating_servizio', ic: Smile, col: '#0ea5e9' }
                  ].map((r) => (
                    <div key={r.k} className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400">{r.label}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <button type="button" key={i} onClick={() => setNewLocale({...newLocale, [r.k]: i+1})} className="active:scale-125 transition-transform">
                            <r.ic size={30} fill={i < (newLocale as any)[r.k] ? r.col : "none"} color={i < (newLocale as any)[r.k] ? r.col : "#cbd5e1"} strokeWidth={2.5}/>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <input type="text" placeholder="Indirizzo" required className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none pr-14" value={newLocale.indirizzo} onChange={e => setNewLocale({...newLocale, indirizzo: e.target.value})} />
                <button type="button" onClick={() => { setNewLocale({...newLocale, lat: userPos?.lat || 0, lng: userPos?.lng || 0}); alert("GPS Sincronizzato! 📡") }} className="absolute right-2 top-2 p-3 bg-white text-amber-500 rounded-xl shadow-sm border border-slate-100 active:scale-90"> <MapPin size={24}/> </button>
              </div>

              <input type="text" placeholder="Numero di Telefono" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none" value={newLocale.telefono} onChange={e => setNewLocale({...newLocale, telefono: e.target.value})} />
              
              <textarea placeholder="Note personali..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none h-24" value={newLocale.note || ''} onChange={e => setNewLocale({...newLocale, note: e.target.value})}></textarea>
              
              <div className="space-y-4 pt-4">
                 <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"> <Check size={20}/> SALVA STELLA </button>
                 {newLocale.id && <button type="button" onClick={handleDelete} className="w-full py-4 text-rose-500 font-black text-[11px] uppercase flex items-center justify-center gap-2 border border-rose-50 rounded-2xl active:bg-rose-50"> <Trash2 size={16}/> ELIMINA </button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}