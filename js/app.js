// main app logic: minimal read/write to Firestore document 'shared/note'
(async function(){
  const statusEl = id('status');
  const pwdEl = id('password');
  const loadBtn = id('loadBtn');
  const saveBtn = id('saveBtn');
  const noteEl = id('note');

  // init firebase
  if(!window.firebaseConfig || window.firebaseConfig.apiKey === 'REPLACE_ME'){
    status('Firebase config missing — buka README untuk cara buat.');
  } else {
    firebase.initializeApp(window.firebaseConfig);
    window.db = firebase.firestore();
    status('Firebase inited.');
  }

  loadBtn.addEventListener('click', loadNote);
  saveBtn.addEventListener('click', saveNote);

  async function loadNote(){
    const pwd = pwdEl.value || '';
    if(!pwd){status('Masukkan password dahulu.'); return}
    if(!window.db){status('Firebase belum dikonfigurasi.'); return}
    status('Mencari catatan...');
    try{
      const doc = await db.doc('shared/note').get();
      if(!doc.exists){
        status('Belum ada catatan tersimpan. Tulis lalu tekan Simpan.');
        noteEl.value = '';
        return;
      }
      const data = doc.data();
      const plain = await decryptObject(data, pwd);
      noteEl.value = plain;
      status('Berhasil dibuka.');
    }catch(err){
      console.error(err);
      status('Gagal buka — kemungkinan password salah atau data korup.');
    }
  }

  async function saveNote(){
    const pwd = pwdEl.value || '';
    if(!pwd){status('Masukkan password dahulu.'); return}
    if(!window.db){status('Firebase belum dikonfigurasi.'); return}
    const text = noteEl.value || '';
    status('Mengenkripsi...');
    try{
      const obj = await encryptText(text, pwd);
      // add timestamp
      obj.updated_at = firebase.firestore.FieldValue.serverTimestamp();
      await db.doc('shared/note').set(obj);
      status('Tersimpan (encrypted). Bagikan URL + password untuk akses.');
    }catch(err){
      console.error(err);
      status('Gagal simpan.');
    }
  }

  function id(s){return document.getElementById(s)}
  function status(t){statusEl.textContent = 'Status: '+t}
})();
