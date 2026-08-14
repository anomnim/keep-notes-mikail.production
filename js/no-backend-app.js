// no-backend app logic: encrypt in browser and store ciphertext in URL fragment
(function(){
  const statusEl = id('status');
  const pwdEl = id('password');
  const genBtn = id('genBtn');
  const loadBtn = id('loadBtn');
  const exportBtn = id('exportBtn');
  const importFile = id('importFile');
  const clearBtn = id('clearBtn');
  const noteEl = id('note');
  const shareLinkEl = id('shareLink');
  const copyBtn = id('copyBtn');

  genBtn.addEventListener('click', generateLink);
  loadBtn.addEventListener('click', loadFromUrl);
  exportBtn.addEventListener('click', exportJson);
  importFile.addEventListener('change', handleImport);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyLink);

  // auto-load if fragment present
  window.addEventListener('load', async ()=>{
    const data = readFragment();
    if(data){
      status('Data ditemukan di URL fragment. Masukkan password lalu tekan "Buka dari URL"');
      shareLinkEl.value = window.location.href;
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
      shareLinkEl.value = link;
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
        shareLinkEl.value = location.href;
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
    shareLinkEl.value = '';
    status('Cleared.');
  }

  function copyLink(){
    if(!shareLinkEl.value){status('Tidak ada link untuk disalin.'); return}
    navigator.clipboard.writeText(shareLinkEl.value).then(()=>status('Link disalin.'), ()=>status('Gagal menyalin link.'));
  }

  function id(s){return document.getElementById(s)}
  function status(t){statusEl.textContent = 'Status: '+t}
})();
