// no-backend app logic: encrypt in browser and store ciphertext in URL fragment
(function(){
  const statusEl = id('status');
  const pwdEl = id('password');
  const genBtn = id('genBtn');
  const saveBtn = id('saveBtn');
  const loadBtn = id('loadBtn');
  const exportBtn = id('exportBtn');
  const importFile = id('importFile');
  const clearBtn = id('clearBtn');
  const noteEl = id('note');
  const shareLinkEl = id('shareLink');
  const copyBtn = id('copyBtn');

  let autosaveTimer = null;
  let lastPlain = '';

  // bind buttons (support old ids)
  if(genBtn) genBtn.addEventListener('click', generateLink);
  if(saveBtn) saveBtn.addEventListener('click', generateLink); // alias for compatibility
  if(loadBtn) loadBtn.addEventListener('click', loadFromUrl);
  if(exportBtn) exportBtn.addEventListener('click', exportJson);
  if(importFile) importFile.addEventListener('change', handleImport);
  if(clearBtn) clearBtn.addEventListener('click', clearAll);
  if(copyBtn) copyBtn.addEventListener('click', copyLink);
  if(noteEl) noteEl.addEventListener('input', scheduleAutosave);

  // auto-load if fragment present
  window.addEventListener('load', async ()=>{
    const data = readFragment();
    if(data){
      status('Data ditemukan di URL fragment. Masukkan password lalu tekan "Buka"');
      if(shareLinkEl) shareLinkEl.value = window.location.href;
    }
  });

  async function generateLink(){
    const pwd = pwdEl.value || '';
    if(!pwd){status('Masukkan password dahulu.'); return}
    const text = noteEl.value || '';
    status('Mengenkripsi...');
    try{
      const obj = await encryptText(text, pwd);
      const b64url = objToBase64Url(obj);
      // set fragment
      location.hash = 'd='+b64url;
      const link = location.href;
      if(shareLinkEl) shareLinkEl.value = link;
      lastPlain = text;
      status('Sukses. Bagikan link + password.');
    }catch(err){
      console.error(err);
      status('Gagal mengenkripsi.');
    }
  }

  async function loadFromUrl(){
    const pwd = pwdEl.value || '';
    if(!pwd){status('Masukkan password dahulu.'); return}
    const data = readFragment();
    if(!data){status('Tidak ada data di URL.'); return}
    status('Mendekripsi...');
    try{
      const plain = await decryptObject(data, pwd);
      noteEl.value = plain;
      lastPlain = plain;
      status('Berhasil dibuka.');
    }catch(err){
      console.error(err);
      status('Gagal buka — kemungkinan password salah atau data korup.');
    }
  }

  function readFragment(){
    if(!location.hash) return null;
    const h = location.hash.replace(/^#/, '');
    const m = h.match(/(^|&)d=([^&]+)/);
    if(!m) return null;
    try{
      return base64UrlToObj(decodeURIComponent(m[2]));
    }catch(e){
      console.error('parse fragment failed', e);
      return null;
    }
  }

  function exportJson(){
    const data = readFragment();
    if(!data){status('Tidak ada data di URL untuk diekspor.'); return}
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keep-note.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status('File JSON diekspor.');
  }

  function handleImport(e){
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = function(){
      try{
        const obj = JSON.parse(r.result);
        // encode into fragment
        const b64url = objToBase64Url(obj);
        location.hash = 'd='+b64url;
        if(shareLinkEl) shareLinkEl.value = location.href;
        status('File diimpor. Link diperbarui.');
      }catch(err){
        console.error(err);
        status('Format file tidak valid.');
      }
    };
    r.readAsText(f);
  }

  function clearAll(){
    location.hash = '';
    noteEl.value = '';
    pwdEl.value = '';
    if(shareLinkEl) shareLinkEl.value = '';
    localStorage.removeItem('keepnotes_pwd');
    status('Cleared.');
  }

  function copyLink(){
    if(!shareLinkEl || !shareLinkEl.value){status('Tidak ada link untuk disalin.'); return}
    navigator.clipboard.writeText(shareLinkEl.value).then(()=>status('Link disalin.'), ()=>status('Gagal menyalin link.'));
  }

  // Autosave: debounce encrypt when user stops typing for 1.5s
  function scheduleAutosave(){
    if(autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async ()=>{
      const pwd = pwdEl.value || '';
      if(!pwd) { status('Autosave: password kosong.'); return }
      const text = noteEl.value || '';
      if(text === lastPlain) { status('Autosave: tidak ada perubahan.'); return }
      status('Autosave: mengenkripsi...');
      try{
        const obj = await encryptText(text, pwd);
        const b64url = objToBase64Url(obj);
        location.hash = 'd='+b64url;
        if(shareLinkEl) shareLinkEl.value = location.href;
        lastPlain = text;
        status('Autosave: tersimpan ke URL.');
      }catch(err){
        console.error(err);
        status('Autosave gagal (mungkin password salah).');
      }
    },1500);
  }

  function id(s){return document.getElementById(s)}
  function status(t){statusEl.textContent = 'Status: '+t}
})();
