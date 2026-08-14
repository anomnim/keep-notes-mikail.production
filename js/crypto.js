// crypto helpers using Web Crypto API
// deriveKey(password, salt) => CryptoKey
// encryptText(plaintext, password) => {ciphertext_b64, salt_b64, iv_b64}
// decryptObject(obj, password) => plaintext
// helpers: objToBase64Url(obj) and base64UrlToObj(str)

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buf){
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64){
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  return arr.buffer;
}

async function deriveKey(password, salt, iterations = 120000){
  const passKey = await crypto.subtle.importKey(
    'raw', encoder.encode(password), {name:'PBKDF2'}, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt: salt, iterations: iterations, hash:'SHA-256'},
    passKey,
    {name:'AES-GCM', length:256},
    false,
    ['encrypt','decrypt']
  );
}

async function encryptText(plaintext, password){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer);
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv: iv}, key, encoder.encode(plaintext));
  return {
    ciphertext: toBase64(ct),
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer)
  };
}

async function decryptObject(obj, password){
  const saltBuf = fromBase64(obj.salt);
  const ivBuf = fromBase64(obj.iv);
  const ctBuf = fromBase64(obj.ciphertext);
  const key = await deriveKey(password, saltBuf);
  const plainBuf = await crypto.subtle.decrypt({name:'AES-GCM', iv: ivBuf}, key, ctBuf);
  return decoder.decode(plainBuf);
}

// base64url helpers for compact URL fragments
function objToBase64Url(obj){
  const s = JSON.stringify(obj);
  const bytes = encoder.encode(s);
  let b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  // base64url
  b64 = b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return b64;
}

function base64UrlToObj(b64url){
  let b64 = b64url.replace(/-/g,'+').replace(/_/g,'/');
  // pad
  while(b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  const s = decoder.decode(arr);
  return JSON.parse(s);
}
