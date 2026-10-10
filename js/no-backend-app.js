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
  const qrBtn = id('qrBtn');
  const qrModal = id('qrModal');
  const closeQrBtn = id('closeQrBtn');
  const qrContainer = id('qrContainer');
  const togglePwdBtn = id('togglePwd');
  const charCountEl = id('charCount');
  const tabWrite = id('tabWrite');
  const tabPreview = id('tabPreview');
  const previewEl = id('preview');

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
  if(qrBtn) qrBtn.addEventListener('click', showQrCode);
  if(closeQrBtn) closeQrBtn.addEventListener('click', () => { if(qrModal) qrModal.style.display = 'none'; });
  if(qrModal) {
    qrModal.addEventListener('click', (e) => {
      if(e.target === qrModal) qrModal.style.display = 'none';
    });
  }
  if(noteEl) {
    noteEl.addEventListener('input', () => {
      autoResizeTextarea();
      updateCharCount();
      scheduleAutosave();
    });
  }
  if(pwdEl) {
    pwdEl.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') {
        if(location.hash) loadFromUrl();
        else generateLink();
      }
    });
  }
  if(togglePwdBtn && pwdEl) {
    togglePwdBtn.addEventListener('click', () => {
      const isPwd = pwdEl.type === 'password';
      pwdEl.type = isPwd ? 'text' : 'password';
      togglePwdBtn.textContent = isPwd ? '🙈' : '👁';
      togglePwdBtn.title = isPwd ? 'Sembunyikan password' : 'Lihat password';
    });
  }

  // Tabs write / preview
  if(tabWrite && tabPreview && noteEl && previewEl) {
    tabWrite.addEventListener('click', () => {
      tabWrite.classList.add('active');
      tabPreview.classList.remove('active');
      noteEl.style.display = 'block';
      previewEl.style.display = 'none';
      autoResizeTextarea();
    });
    tabPreview.addEventListener('click', () => {
      tabPreview.classList.add('active');
      tabWrite.classList.remove('active');
      renderMarkdownPreview();
      noteEl.style.display = 'none';
      previewEl.style.display = 'block';
    });
  }

  function autoResizeTextarea(){
    if(!noteEl) return;
    noteEl.style.height = 'auto';
    noteEl.style.height = Math.max(220, noteEl.scrollHeight) + 'px';
  }

  function renderMarkdownPreview(){
    if(!previewEl || !noteEl) return;
    previewEl.innerHTML = parseSimpleMarkdown(noteEl.value || '');
  }

  function parseSimpleMarkdown(src){
    if(!src.trim()) return '<em>(Catatan kosong)</em>';
    // escape HTML
    let out = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // code blocks ```
    out = out.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    // headers
    out = out.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // blockquotes
    out = out.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    // bold & italic
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // unordered lists
    out = out.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    out = out.replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul>$1</ul>');
    // newlines to <br> if not preceded by closing tag
    out = out.replace(/\n/g, '<br>');
    return out;
  }

  // Unsaved changes safety guard
  window.addEventListener('beforeunload', (e) => {
    if(noteEl && noteEl.value && noteEl.value !== lastPlain) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function updateCharCount(){
    if(!charCountEl || !noteEl) return;
    const len = noteEl.value.length;
    charCountEl.textContent = `${len.toLocaleString('id-ID')} karakter`;
    if(len > 2500) {
      charCountEl.title = 'Peringatan: URL fragment sangat panjang untuk beberapa browser/aplikasi chat';
      charCountEl.style.color = '#d97706';
    } else {
      charCountEl.title = '';
      charCountEl.style.color = '#6b7280';
    }
  }

  // auto-load if fragment present
  window.addEventListener('load', async ()=>{
    const data = readFragment();
    if(data){
      status('Data terenkripsi terdeteksi di URL. Masukkan password lalu klik "Buka".', 'info');
      if(shareLinkEl) shareLinkEl.value = window.location.href;
      if(pwdEl) pwdEl.focus();
    }
  });

  async function generateLink(){
    const pwd = (pwdEl.value || '').trim();
    if(!pwd){status('Masukkan password terlebih dahulu.', 'error'); pwdEl.focus(); return}
    const text = noteEl.value || '';
    status('Mengenkripsi...', 'info');
    try{
      const obj = await encryptText(text, pwd);
      const b64url = objToBase64Url(obj);
      // set fragment
      location.hash = 'd='+b64url;
      const link = location.href;
      if(shareLinkEl) shareLinkEl.value = link;
      lastPlain = text;
      status('Berhasil disimpan. Salin link & password untuk berbagi.', 'success');
    }catch(err){
      console.error(err);
      status('Gagal mengenkripsi.', 'error');
    }
  }

  async function loadFromUrl(){
    const pwd = (pwdEl.value || '').trim();
    if(!pwd){status('Masukkan password untuk membuka.', 'error'); pwdEl.focus(); return}
    const data = readFragment();
    if(!data){status('Tidak ada data terenkripsi yang valid di URL.', 'error'); return}
    status('Mendekripsi catatan...', 'info');
    try{
      const plain = await decryptObject(data, pwd);
      noteEl.value = plain;
      lastPlain = plain;
      autoResizeTextarea();
      updateCharCount();
      status('Catatan berhasil dibuka.', 'success');
    }catch(err){
      console.error('Decryption failed detail:', err);
      status('Gagal membuka — kemungkinan password salah atau data di URL terpotong/rusak.', 'error');
    }
  }

  function readFragment(){
    // Read from location.hash or window.location.href fallback
    const rawUrl = window.location.href;
    const hashIndex = rawUrl.indexOf('#');
    if(hashIndex === -1) return null;
    let h = rawUrl.substring(hashIndex + 1);
    
    // Match d parameter: allow trailing characters cleanup
    const m = h.match(/(^|&)d=([^&#]+)/);
    if(!m) return null;

    let payloadStr = m[2];
    // Clean trailing slashes or URL query artifacts if added by external apps
    payloadStr = payloadStr.replace(/\/+$/, '');

    try{
      // Try direct base64url decoding first
      return base64UrlToObj(payloadStr);
    }catch(e1){
      try{
        // Try URI decoded version if percent-encoded by browser
        return base64UrlToObj(decodeURIComponent(payloadStr));
      }catch(e2){
        console.error('parse fragment failed', e1, e2);
        return null;
      }
    }
  }

  function exportJson(){
    const data = readFragment();
    if(!data){status('Tidak ada data terenkripsi di URL untuk diekspor.', 'error'); return}
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keep-note.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status('File JSON berhasil diekspor.', 'success');
  }

  function handleImport(e){
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = function(){
      try{
        const obj = JSON.parse(r.result);
        const b64url = objToBase64Url(obj);
        location.hash = 'd='+b64url;
        if(shareLinkEl) shareLinkEl.value = location.href;
        status('File diimpor. Masukkan password lalu klik "Buka".', 'info');
      }catch(err){
        console.error(err);
        status('Format file JSON tidak valid.', 'error');
      }
    };
    r.readAsText(f);
  }

  function clearAll(){
    if(!confirm('Hapus semua catatan dan reset URL?')) return;
    location.hash = '';
    noteEl.value = '';
    pwdEl.value = '';
    if(shareLinkEl) shareLinkEl.value = '';
    lastPlain = '';
    updateCharCount();
    status('Semua data dibersihkan.', 'info');
  }

  function copyLink(){
    if(!shareLinkEl || !shareLinkEl.value){status('Belum ada link untuk disalin. Klik "Simpan" dahulu.', 'error'); return}
    navigator.clipboard.writeText(shareLinkEl.value).then(()=>{
      status('Link berhasil disalin ke clipboard!', 'success');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Tersalin!';
      setTimeout(()=>{ copyBtn.textContent = originalText; }, 2000);
    }, ()=>status('Gagal menyalin link.', 'error'));
  }

  function showQrCode(){
    const link = (shareLinkEl && shareLinkEl.value) || (location.hash ? location.href : '');
    if(!link){
      status('Simpan catatan terlebih dahulu untuk membuat QR Code.', 'error');
      return;
    }
    if(typeof qrcode === 'undefined'){
      status('Library QR Code tidak tersedia.', 'error');
      return;
    }
    try{
      const qr = qrcode(0, 'M');
      qr.addData(link);
      qr.make();
      qrContainer.innerHTML = qr.createSvgTag(5, 4);
      qrModal.style.display = 'flex';
      status('QR Code siap di-scan.', 'info');
    }catch(err){
      console.error(err);
      status('Gagal membuat QR Code (data link terlalu panjang, gunakan salin link).', 'error');
    }
  }

  // Autosave: debounce encrypt when user stops typing for 1.5s
  function scheduleAutosave(){
    if(autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async ()=>{
      const pwd = (pwdEl.value || '').trim();
      if(!pwd) return;
      const text = noteEl.value || '';
      if(text === lastPlain) return;
      status('Autosave: mengenkripsi...', 'info');
      try{
        const obj = await encryptText(text, pwd);
        const b64url = objToBase64Url(obj);
        location.hash = 'd='+b64url;
        if(shareLinkEl) shareLinkEl.value = location.href;
        lastPlain = text;
        status('Autosave: tersimpan ke URL.', 'success');
      }catch(err){
        console.error(err);
        status('Autosave gagal.', 'error');
      }
    }, 1500);
  }

  function id(s){return document.getElementById(s)}
  function status(t, type = ''){
    if(!statusEl) return;
    statusEl.textContent = 'Status: ' + t;
    statusEl.className = 'status-box ' + type;
  }
})();
