import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList,
  Clock3, Download, ExternalLink, FileBarChart, Filter, HeartPulse,
  LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Search, Settings,
  ShieldCheck, Sparkles, TicketCheck, Users, X
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const initialEvents = []

const menu = [
  { label: 'Workspace', items: [{ name: 'Ringkasan', icon: LayoutDashboard }, { name: 'Manajemen Event', icon: CalendarDays }, { name: 'Daftar Tamu', icon: Users }, { name: 'Undangan Digital', icon: TicketCheck }] },
  { label: 'Operasional', items: [{ name: 'Registrasi & Check-in', icon: ShieldCheck }, { name: 'Rundown Acara', icon: ClipboardList }, { name: 'Laporan', icon: FileBarChart }] },
]
const fmt = (date) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date + 'T00:00:00'))

function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      if (!isSupabaseConfigured) throw new Error('Konfigurasi Supabase belum dipasang. Tambahkan environment variable di deployment.')
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } })
      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) setError('Akun berhasil dibuat. Periksa email untuk verifikasi, lalu masuk.')
      else onLogin(result.data.user)
    } catch (err) { setError(err.message || 'Tidak dapat masuk.') }
    finally { setBusy(false) }
  }
  return <div className="auth-shell">
    <div className="auth-art">
      <div className="brand brand-light"><span className="brand-mark"><HeartPulse size={22}/></span><span>HEMS<small>HOSPITAL EVENT MANAGEMENT</small></span></div>
      <div className="art-copy"><div className="eyebrow"><span/> EVENT OPERATIONS PLATFORM</div><h1>Every event.<br/><em>Thoughtfully</em> managed.</h1><p>Platform terpadu untuk merencanakan acara, mengelola undangan, dan menyambut setiap tamu dengan lebih baik.</p></div>
      <div className="art-foot"><span>SECURE WORKSPACE</span><span>·</span><span>BUILT FOR HEALTHCARE</span></div>
      <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
    </div>
    <div className="auth-panel"><div className="auth-card">
      <div className="mobile-brand brand"><span className="brand-mark"><HeartPulse size={20}/></span><span>HEMS<small>EVENT MANAGEMENT</small></span></div>
      <div className="auth-kicker">WELCOME TO HEMS</div><h2>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun pengelola'}</h2><p className="muted">Masuk untuk melanjutkan ke workspace event rumah sakit.</p>
      <form onSubmit={submit}><label>Email kerja</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@rumahsakit.com" required/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 8 karakter" minLength="8" required/>
        {error && <div className="form-message">{error}</div>}<button className="primary-btn full" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke workspace' : 'Daftar akun'} <ChevronRight size={17}/></button>
      </form>
      <div className="auth-switch">{mode === 'login' ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login'?'Daftar akun':'Masuk'}</button></div>
      <div className="secure-note"><ShieldCheck size={15}/> Akses aman · Data dikelola sesuai hak akses</div>
    </div></div>
  </div>
}

function App() {
  const [user, setUser] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [page, setPage] = useState('Ringkasan')
  const [events, setEvents] = useState(initialEvents)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newVenue, setNewVenue] = useState('RS Indonesia Heart Center · Karawang')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) { setSessionReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setSessionReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return
    supabase.from('events').select('id,title,venue,starts_at,status,created_at').order('starts_at', { ascending: true }).then(({ data, error }) => {
      if (error) { setNotice('Database belum siap: ' + error.message); return }
      setEvents((data || []).map((e,i)=>({ id:e.id, title:e.title, subtitle:e.venue || 'Lokasi belum ditentukan', date:e.starts_at?.slice(0,10) || '', time:e.starts_at ? new Date(e.starts_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '—', status:e.status, guests:0, confirmed:0, attended:0, color:['gold','blue','teal'][i%3], initials:e.title.split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase() })))
    })
  }, [user])

  const stats = useMemo(() => [
    { label:'Total event', value:events.length, note:'Event tersimpan di database', icon:CalendarDays, trend:'Data aktual', up:true },
    { label:'Total undangan', value:events.reduce((a,e)=>a+e.guests,0).toLocaleString('id-ID'), note:'Tamu dari seluruh event', icon:Users, trend:'Data aktual', up:true },
    { label:'Konfirmasi hadir', value:events.reduce((a,e)=>a+e.confirmed,0).toLocaleString('id-ID'), note:'RSVP positif diterima', icon:TicketCheck, trend:'Data aktual', up:true },
    { label:'Sudah check-in', value:events.reduce((a,e)=>a+e.attended,0), note:'Kehadiran tercatat', icon:ShieldCheck, trend:'Belum ada event', up:false },
  ], [events])
  const filtered = events.filter(e => e.title.toLowerCase().includes(query.toLowerCase()) || e.subtitle.toLowerCase().includes(query.toLowerCase()))

  async function createEvent(e) {
    e.preventDefault(); if (!newTitle || !newDate) return
    setSaving(true)
    const payload = { title:newTitle, venue:newVenue, starts_at:new Date(newDate+'T09:00:00').toISOString(), status:'Draft', created_by:user.id }
    if (user && isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      if (error) { setNotice(error.message); setSaving(false); return }
      const { error: staffError } = await supabase.from('event_staff').insert({ event_id:data.id, user_id:user.id, role:'event_manager' })\n      if (staffError) { setNotice('Event tersimpan, tetapi penugasan pengelola gagal: '+staffError.message); setSaving(false); return }\n      setEvents(prev=>[...prev,{id:data.id,title:data.title,subtitle:data.venue,date:data.starts_at.slice(0,10),time:'09.00 WIB',status:data.status,guests:0,confirmed:0,attended:0,color:'gold',initials:'EV'}])
    } else { setNotice('Supabase belum dikonfigurasi. Data tidak disimpan. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di GitHub Actions Variables, lalu jalankan deployment ulang.'); setSaving(false); return }
    setSaving(false); setShowCreate(false); setNewTitle(''); setNewDate(''); setNotice('Event berhasil ditambahkan.')
  }
  async function logout() { if (isSupabaseConfigured) await supabase.auth.signOut(); setUser(null) }

  if (!sessionReady) return <div className="loading-screen"><div className="loader"/><span>Menyiapkan workspace…</span></div>
  if (!isSupabaseConfigured) return <div className='loading-screen'><div className='panel' style={{maxWidth:520,padding:28}}><h2>HEMS belum terhubung ke database</h2><p>Data demo sudah dinonaktifkan. Untuk mulai memasukkan data asli, administrator perlu memasang VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada GitHub → Settings → Secrets and variables → Actions → Variables, lalu menjalankan ulang deployment.</p></div></div>\n  if (!user) return <Login onLogin={setUser}/>
  const greeting = user?.email?.split('@')[0] || 'Administrator'
  return <div className="app-shell">
    <aside className={'sidebar '+(mobileNav?'open':'')}>
      <div className="brand"><span className="brand-mark"><HeartPulse size={21}/></span><span>HEMS<small>EVENT MANAGEMENT</small></span><button className="close-nav" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><div className="hospital-avatar"><HeartPulse size={17}/></div><div><b>RS Indonesia Heart Center</b><small>Karawang · Workspace</small></div><ChevronDown size={15}/></div>
      <nav>{menu.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item=><button key={item.name} className={'nav-item '+(page===item.name?'active':'')} onClick={()=>{setPage(item.name);setMobileNav(false)}}><item.icon size={18}/><span>{item.name}</span>{item.name==='Manajemen Event'&&<span className="nav-count">{events.length}</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Butuh bantuan?</b><p>Tim support siap membantu pengelolaan event Anda.</p><button onClick={()=>setNotice('Hubungi administrator sistem untuk bantuan HEMS.')}>Pusat bantuan <ExternalLink size={13}/></button></div><button className="nav-item"><Settings size={18}/><span>Pengaturan</span></button><div className="profile-row"><div className="profile-avatar">{greeting.slice(0,1).toUpperCase()}</div><div className="profile-meta"><b>{greeting}</b><small>{user?.email || 'Admin HEMS'}</small></div><button title="Keluar" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileNav&&<button className="nav-scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="crumb"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><span>Workspace</span><ChevronRight size={14}/><b>{page}</b></div><div className="top-actions"><div className="system-status"><span/> Sistem aktif</div><button className="icon-btn" onClick={()=>setNotice('Belum ada notifikasi baru.')}><Bell size={18}/><i/></button><div className="top-avatar">{greeting.slice(0,1).toUpperCase()}</div></div></header>
      <div className="content">
        {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
        <section className="welcome-row"><div><div className="eyebrow dark"><span/> TUESDAY, 17 NOVEMBER 2026</div><h1>{page==='Ringkasan'?'Selamat datang di HEMS':page}</h1><p>Kelola setiap detail acara rumah sakit dari satu workspace terpadu.</p></div><button className="primary-btn" onClick={()=>setShowCreate(true)}><Plus size={17}/> Buat event baru</button></section>
        {page==='Ringkasan' ? <>
          <div className="stats-grid">{stats.map((s,i)=><article className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className={'stat-icon stat-'+i}><s.icon size={18}/></div></div><div className="stat-value">{s.value}</div><div className="stat-foot"><span>{s.note}</span><small className={s.up?'positive':''}>{s.trend}</small></div></article>)}</div>
          <div className="section-heading"><div><h2>Event Anda</h2><p>Pantau dan kelola agenda yang sedang berjalan.</p></div><button className="text-btn" onClick={()=>setPage('Manajemen Event')}>Lihat semua <ArrowUpRight size={15}/></button></div>
          <div className="event-grid">{events.length ? events.slice(0,3).map(event=><EventCard key={event.id} event={event} onOpen={()=>setPage('Manajemen Event')}/>) : <div className='panel empty-state'>Belum ada event. Klik <b>Buat event baru</b> untuk memasukkan event pertama Anda.</div>}</div>
          <div className="lower-grid"><section className="panel activity-panel"><div className="panel-heading"><div><h3>Aktivitas terbaru</h3><p>Ringkasan aktivitas workspace</p></div><button className="more-btn"><MoreHorizontal size={19}/></button></div><div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>Aktivitas akan tampil di sini</b><span>Ketika tim mulai mengelola event, riwayat aktivitas akan tercatat otomatis.</span></div></section><section className="panel quick-panel"><div className="panel-heading"><div><h3>Akses cepat</h3><p>Mulai dari pekerjaan umum</p></div></div><div className="quick-links"><button onClick={()=>setPage('Daftar Tamu')}><span className="quick-icon qi-blue"><Users size={18}/></span><span><b>Kelola daftar tamu</b><small>Tambah dan impor data undangan</small></span><ChevronRight size={16}/></button><button onClick={()=>setPage('Undangan Digital')}><span className="quick-icon qi-gold"><TicketCheck size={18}/></span><span><b>Desain undangan</b><small>Personalisasi undangan digital</small></span><ChevronRight size={16}/></button><button onClick={()=>setPage('Registrasi & Check-in')}><span className="quick-icon qi-teal"><ShieldCheck size={18}/></span><span><b>Registrasi & check-in</b><small>Kelola kehadiran peserta</small></span><ChevronRight size={16}/></button></div></section></div>
        </> : <section className="panel list-panel"><div className="list-toolbar"><div><h2>{page}</h2><p>Kelola data {page.toLowerCase()} dalam workspace Anda.</p></div><div className="toolbar-actions"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari event…"/></div><button className="secondary-btn"><Filter size={16}/> Filter</button></div></div>{page==='Manajemen Event'?<div className="table-wrap"><table><thead><tr><th>NAMA EVENT</th><th>TANGGAL</th><th>UNDANGAN</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td><div className="table-event"><span className={'event-avatar '+e.color}>{e.initials}</span><span><b>{e.title}</b><small>{e.subtitle}</small></span></div></td><td>{fmt(e.date)}</td><td>{e.guests} tamu</td><td><span className={'status-pill '+(e.status==='Terjadwal'?'green':e.status==='Persiapan'?'amber':'gray')}>{e.status}</span></td><td><button className="more-btn"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state">Belum ada event yang cocok dengan pencarian.</div>}</div>:<div className="module-empty"><div className="module-empty-icon"><Sparkles size={23}/></div><h3>Modul {page} siap dikembangkan</h3><p>Fondasi workspace sudah tersedia. Modul ini akan terhubung ke data event, tamu, dan hak akses.</p><button className="secondary-btn" onClick={()=>setPage('Ringkasan')}><ChevronLeft size={15}/> Kembali ke ringkasan</button></div>}</section>}
        <footer className="footer"><span>© 2026 HEMS · Hospital Event Management System</span><span>Designed for better healthcare experiences <HeartPulse size={13}/></span></footer>
      </div>
    </main>
    {showCreate&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowCreate(false)}><form className="modal" onSubmit={createEvent}><div className="modal-head"><div><span className="auth-kicker">EVENT WORKSPACE</span><h2>Buat event baru</h2><p>Isi informasi utama. Detail lainnya dapat dilengkapi setelah event dibuat.</p></div><button type="button" className="icon-btn" onClick={()=>setShowCreate(false)}><X size={18}/></button></div><label>Nama event</label><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Contoh: Doctor Gathering & Referral Networking" required/><label>Tanggal event</label><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} required/><label>Lokasi / venue</label><input value={newVenue} onChange={e=>setNewVenue(e.target.value)} required/><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowCreate(false)}>Batal</button><button className="primary-btn" disabled={saving}>{saving?'Menyimpan…':<><Plus size={16}/> Buat event</>}</button></div></form></div>}
  </div>
}

function EventCard({event,onOpen}) {
  const pct = event.guests ? Math.round(event.confirmed/event.guests*100) : 0
  return <article className="event-card"><div className={'event-cover '+event.color}><div className="cover-orb"/><span className="event-avatar">{event.initials}</span><span className={'status-pill '+(event.status==='Persiapan'?'amber':event.status==='Terjadwal'?'green':'gray')}>{event.status}</span><div className="cover-brand">HEMS <i>·</i> EVENT</div></div><div className="event-body"><div className="event-date"><CalendarDays size={14}/>{fmt(event.date)}<span/> <Clock3 size={14}/>{event.time}</div><h3>{event.title}</h3><p>{event.subtitle}</p><div className="event-metrics"><div><b>{event.guests}</b><small>Undangan</small></div><div><b>{event.confirmed}</b><small>Konfirmasi</small></div><div><b>{pct}%</b><small>Response</small></div></div><div className="progress-track"><span style={{width:pct+'%'}}/></div><button className="event-open" onClick={onOpen}>Kelola event <ArrowUpRight size={15}/></button></div></article>
}

export default App