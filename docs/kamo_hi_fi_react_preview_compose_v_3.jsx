import React, { useMemo, useState } from "react";

// —— atoms ——
const Chip = ({ active=false, children, onClick }) => (
  <button onClick={onClick} className={["px-3 py-1.5 rounded-full text-sm border transition", active ? "bg-white text-black border-white" : "text-white/80 border-white/20 hover:border-white/40"].join(" ")}>{children}</button>
);
const Device = ({children}) => (
  <div className="mx-auto bg-[#0B0B0E] border border-white/10 rounded-[44px] p-4 w-[390px] shadow-2xl">
    <div className="rounded-[32px] overflow-hidden bg-black border border-white/10">{children}</div>
  </div>
);
const Header = ({onOpenTemplate}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
        <img alt="avatar" src="https://i.pravatar.cc/64?img=12" className="w-full h-full object-cover"/>
      </div>
      <div>
        <div className="text-white text-sm font-medium leading-tight">Kamo</div>
        <div className="text-white/60 text-[11px]">Create • Base</div>
      </div>
      <div className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">BASE</div>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onOpenTemplate} className="text-white/80 hover:text-white text-sm">Template</button>
    </div>
  </div>
);

// New atoms for the refined UX
const IconButton = ({label, onClick, children}) => (
  <button aria-label={label} onClick={onClick}
    className="w-9 h-9 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white/80 hover:border-white/40">
    {children}
  </button>
);
const Switch = ({checked, onChange, label}) => (
  <button onClick={()=>onChange(!checked)}
    className={"px-2 py-1 rounded-full border text-xs " + (checked ? "bg-white text-black border-white" : "text-white/80 border-white/20")}>
    {label}{checked ? " ✓" : ""}
  </button>
);
const DropUp = ({open, onClose, children, title}) => !open ? null : (
  <div className="fixed inset-0 flex items-end justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
    <div className="relative w-[390px] bg-[#0c0c12] border border-white/10 rounded-t-2xl p-4">
      <div className="mx-auto h-1 w-12 rounded-full bg-white/20 mb-3"/>
      {title && <div className="text-white/80 text-sm mb-2">{title}</div>}
      {children}
    </div>
  </div>
);
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 7h4l2-2h4l2 2h4v12H4V7z" stroke="currentColor"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor"/>
  </svg>
);
const TemplateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor"/>
    <path d="M8 9h8M8 13h5" stroke="currentColor"/>
  </svg>
);

// ——— Pure helper for tests & hook ———
export function autoTickerFromTitle(title){
  const words = (title || "").trim().split(/\s+/).filter(Boolean);
  let ticker = words.map(w => w[0]?.toUpperCase() || "").join("");
  if (ticker.length < 3) {
    for (let w of words) { if (ticker.length >= 3) break; ticker += (w.slice(1, 3 - ticker.length)||"").toUpperCase(); }
    if (ticker.length < 3) ticker = (ticker + "KAM").slice(0,3);
  }
  return ticker.slice(0,10).replace(/[^A-Z0-9]/g, "");
}

function useTicker(title) {
  const [manual, setManual] = useState("");
  const auto = useMemo(() => autoTickerFromTitle(title), [title]);
  return { value: manual || auto, set: v=>setManual(v.toUpperCase().replace(/[^A-Z0-9]/g,"")), isManual: !!manual };
}

export default function App(){
  const [tab, setTab] = useState('Compose');
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4"><h1 className="text-2xl font-semibold">Kamo — Compose v3</h1>
          <div className="flex gap-2">
            {['Compose','Plan','Coins'].map(t => <button key={t} onClick={()=>setTab(t)} className={["px-3 py-1.5 rounded-xl text-sm border", tab===t?"bg-white text-black border-white":"text-white/70 border-white/20"].join(' ')}>{t}</button>)}
          </div>
        </div>
        {tab==='Compose' && <ComposeV3/>}
        {tab!=='Compose' && <div className="text-white/60">(Focus on Compose for this iteration)</div>}
      </div>
    </div>
  );
}

function ComposeV3(){
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState("");
  const ticker = useTicker(title);
  const [fcOn] = useState(true); // Farcaster always on
  const [zoraOn, setZoraOn] = useState(true);
  const [mediaMode, setMediaMode] = useState('none'); // none|upload|template
  const [images, setImages] = useState([]);
  const [checkingTicker, setCheckingTicker] = useState(false);
  const [collision, setCollision] = useState(false);
  const [editTicker, setEditTicker] = useState(false);
  const [schedule, setSchedule] = useState('Publish now');
  const [status, setStatus] = useState('');

  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [templateStyleId, setTemplateStyleId] = useState('Style 01');

  const hasMedia = images.length > 0 || mediaMode==='template';
  const canPreview = title.trim().length>0 && (!zoraOn || (!collision && hasMedia));

  const onTickerBlur = async () => {
    setCheckingTicker(true); await new Promise(r=>setTimeout(r,400)); setCollision(ticker.value==='HELLO'); setCheckingTicker(false);
  };

  const pickFromGalleryOrCamera = () => { alert('Camera/Gallery'); setMediaMode('upload'); setImages(prev => [...prev, 'Image ' + (prev.length+1)]); };

  // —— Collapsed (first-open)
  const Collapsed = (
    <div className="p-4 bg-gradient-to-b from-black to-[#0c0c12] min-h-[720px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <img alt="avatar" src="https://i.pravatar.cc/48?img=12" className="w-8 h-8 rounded-full"/>
          <input placeholder="Write something…" className="flex-1 bg-white/5 border border-white/10 rounded-full text-white px-4 py-3 outline-none focus:border-white/30" onFocus={()=>setExpanded(true)} readOnly />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
          <div className="flex gap-2">
            <IconButton label="Add media" onClick={()=>{ setExpanded(true); pickFromGalleryOrCamera(); }}><CameraIcon/></IconButton>
            <IconButton label="Template" onClick={()=>{ setExpanded(true); setMediaMode('template'); setTemplateMenuOpen(true); }}><TemplateIcon/></IconButton>
          </div>
          <div className="flex gap-2">
            <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Queue 3</div>
            <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10">Drafts 2</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TickerChip = () => (
    <div className="relative">
      {!editTicker ? (
        <button onClick={()=>setEditTicker(true)} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/20 text-[12px] tracking-widest">{ticker.value}</button>
      ) : (
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/20">
          <input value={ticker.value} onChange={(e)=>ticker.set(e.target.value)} onBlur={()=>{setEditTicker(false); onTickerBlur();}} className="w-20 bg-transparent outline-none text-white tracking-widest text-[12px]"/>
          {checkingTicker ? <span className="text-white/60 text-[11px]">…</span> : collision ? <span className="text-rose-300 text-[11px]">Taken</span> : <span className="text-emerald-300 text-[11px]">OK</span>}
        </div>
      )}
    </div>
  );

  // —— Expanded composer
  const Compose = (
    <div className="p-4 bg-gradient-to-b from-black to-[#0c0c12] min-h-[720px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
        {/* Text */}
        <div className="flex items-start gap-2">
          <img alt="avatar" src="https://i.pravatar.cc/48?img=12" className="w-8 h-8 rounded-full mt-0.5"/>
          <textarea value={title} onChange={(e)=>setTitle(e.target.value)} rows={3} placeholder="Write something…" className="flex-1 bg-transparent text-white placeholder-white/30 outline-none resize-none"/>
        </div>

        {/* Toolbar: icons + Zora switch + ticker (if on) */}
        <div className="mt-3 flex items-center gap-8">
          <div className="flex items-center gap-8">
            <IconButton label="Add media" onClick={pickFromGalleryOrCamera}><CameraIcon/></IconButton>
            <IconButton label="Template" onClick={()=>{ setMediaMode('template'); setTemplateMenuOpen(true); }}><TemplateIcon/></IconButton>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Switch checked={zoraOn} onChange={setZoraOn} label="Create coin"/>
            {zoraOn && <TickerChip/>}
          </div>
        </div>

        {(images.length > 0 || mediaMode==='template') && (
          <div className="mt-3">
            {images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center text-white/60 text-xs">
                    {img}
                    <button onClick={()=>setImages(prev => prev.filter((_,i)=>i!==idx))} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <div className="h-56 bg-white/5 flex items-center justify-center text-white/60 text-xs">{`Template • ${templateStyleId}`}</div>
              </div>
            )}
          </div>
        )}

        {/* Bottom action row: Schedule + Preview */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={()=>setScheduleOpen(true)} className="px-4 py-2 rounded-2xl border border-white/20 text-white/90 bg-white/5">Schedule</button>
          <button disabled={title.trim().length===0 || (zoraOn && (collision || !hasMedia))}
                  onClick={()=>setPreview(true)}
                  className="px-4 py-2 rounded-2xl font-medium bg-white text-black disabled:bg-white/10 disabled:text-white/40 disabled:border disabled:border-white/10">Preview</button>
        </div>
      </div>
    </div>
  );

  // —— Single clean preview card
  const PreviewSheet = (
    <div className="p-4 bg-gradient-to-b from-black to-[#0c0c12] min-h-[720px] space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-3">
        {(images.length>0 || mediaMode==='template') && (
          images.length>0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx)=> (
                <div key={idx} className="w-28 h-28 rounded-xl bg-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center text-white/60 text-xs">{img}</div>
              ))}
            </div>
          ) : (
            <div className="h-56 rounded-xl bg-white/10 flex items-center justify-center text-white/60 text-xs">{`Template • ${templateStyleId}`}</div>
          )
        )}
        <div className="text-white text-base">{title || '(empty)'}</div>
        {zoraOn && <div className="text-white/70 text-sm">Ticker: <span className="tracking-widest text-white">{ticker.value}</span></div>}
        <div className="text-[11px] text-white/50">Farcaster {fcOn ? '✓' : '—'} · Zora {zoraOn ? '✓' : '—'}</div>
        <div className="text-[12px] text-white/70">{schedule==='Publish now' ? 'Posting now' : `Scheduled: ${schedule}`}</div>
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-[#0c0c12] to-transparent pt-2 flex gap-2">
        <button onClick={()=>setPreview(false)} className="flex-1 py-3 rounded-2xl bg-white/10 text-white border border-white/20">Back</button>
        <button onClick={()=>setStatus(schedule==='Publish now'? 'Sent' : `Scheduled • ${schedule}`)} className="flex-1 py-3 rounded-2xl bg-white text-black font-medium">{schedule==='Publish now'?'Send':'Schedule'}</button>
      </div>
      {status && <div className="text-center text-xs text-emerald-300">{status} • View in Plan → Queue</div>}
    </div>
  );

  return (
    <Device>
      <Header onOpenTemplate={()=>alert('Open Template Editor')} />
      <>
        {!expanded ? Collapsed : (preview ? PreviewSheet : Compose)}

        {/* Drop-ups */}
        <DropUp open={templateMenuOpen} onClose={()=>setTemplateMenuOpen(false)} title="Template">
          <div className="grid gap-2">
            {['Style 01','Style 02','Style 03'].map(s => (
              <button key={s} onClick={()=>{ setTemplateStyleId(s); setMediaMode('template'); setTemplateMenuOpen(false); }}
                className={"w-full text-left px-3 py-3 rounded-xl border " + (templateStyleId===s ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10")}>{s}</button>
            ))}
            <button onClick={()=>alert('Open Template Editor')} className="w-full text-left px-3 py-3 rounded-xl border bg-white text-black">Customize…</button>
          </div>
        </DropUp>

        <DropUp open={scheduleOpen} onClose={()=>setScheduleOpen(false)} title="When to publish?">
          <div className="grid gap-2">
            {[{id:'now',label:'Publish now'},{id:'later',label:'Later today (10 PM)'},{id:'tmrw',label:'Tomorrow morning (9 AM)'},{id:'custom',label:'Pick date & time'}].map(o => (
              <button key={o.id} onClick={()=>{ setSchedule(o.label); setScheduleOpen(false); }} className="w-full text-left px-3 py-3 rounded-xl border bg-white/5 text-white border-white/10 hover:border-white/30">{o.label}</button>
            ))}
          </div>
        </DropUp>

        {/* Inline queue status */}
        <div className="px-4 pb-3 bg-black border-t border-white/10">
          <div className="mx-auto w-44 text-center text-white/70 text-xs bg-white/5 border border-white/10 rounded-full py-1">Queue • 3 • Drafts • 2</div>
        </div>
      </>
    </Device>
  );
}

// ——— lightweight tests (run in console) ———
(function runSmokeTests(){
  try {
    console.assert(autoTickerFromTitle('Hello World').length >= 2, 'Ticker should have >=2 chars');
    console.assert(autoTickerFromTitle('a').length === 3, 'Short titles should pad to 3');
    console.assert(/^[A-Z0-9]+$/.test(autoTickerFromTitle('hi! @there')), 'Ticker should be alphanumeric');
    console.log('%cKamo compose preview • smoke tests passed','color:#0f0');
  } catch(e) { console.warn('Smoke tests failed', e); }
})();
