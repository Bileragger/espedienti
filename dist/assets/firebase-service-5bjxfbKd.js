import{getAuth as y,onAuthStateChanged as _,signInWithEmailAndPassword as E,createUserWithEmailAndPassword as L,signOut as R}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";import{getFirestore as S,doc as g,getDoc as I,setDoc as w}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";import{e as l,G as o}from"./state-manager-CEE3dZHc.js";const p="users";class ${constructor(){this.auth=null,this.db=null,this.currentUser=null,this.currentRole=null,this._stateListeners=[],this._initialized=!1}async initialize(){this._initialized||(await this._waitForFirebase(),this.auth=y(window.firebaseApp),this.db=S(window.firebaseApp),this._initialized=!0,_(this.auth,async t=>{t?(this.currentUser=t,this.currentRole=await this._fetchRole(t.uid)):(this.currentUser=null,this.currentRole=null),this._stateListeners.forEach(e=>e(this.currentUser,this.currentRole))}),console.log("✅ AuthService initialized"))}_waitForFirebase(){return new Promise(t=>{if(window.firebaseReady&&window.firebaseApp)return t();window.addEventListener("firebaseReady",t,{once:!0})})}async _fetchRole(t){var e;try{const i=g(this.db,p,t),a=await I(i);if(a.exists())return a.data().role||"user";const s=this.auth.currentUser;await w(i,{uid:t,email:(s==null?void 0:s.email)||"",displayName:(s==null?void 0:s.displayName)||((e=s==null?void 0:s.email)==null?void 0:e.split("@")[0])||"",role:"user",createdAt:new Date().toISOString()})}catch{}return"user"}onAuthStateChange(t){this._stateListeners.push(t),this._initialized&&t(this.currentUser,this.currentRole)}async signIn(t,e){await E(this.auth,t.trim(),e)}async signUp({email:t,password:e,displayName:i}){const a=await L(this.auth,t.trim(),e);await w(g(this.db,p,a.user.uid),{uid:a.user.uid,email:t.trim(),displayName:i.trim(),role:"user",createdAt:new Date().toISOString()})}async signOut(){await R(this.auth)}}const n=new $,b={user:()=>window.t?window.t("auth.role.user"):"Utente",artist:()=>window.t?window.t("auth.role.artist"):"Artista",manager:()=>window.t?window.t("auth.role.manager"):"Manager",admin:()=>window.t?window.t("auth.role.admin"):"Admin"},f={admin:"#dc2626",manager:"#7c3aed",artist:"#0284c7",user:"#16a34a"};class A{constructor(){this._activeTab="login"}initialize(){this._initialized||(this._initialized=!0,n.onAuthStateChange((t,e)=>{this._render(t,e),this._updateNavBtn(t,e),t&&this._closeModal()}),window.addEventListener("languageChanged",()=>{this._render(n.currentUser,n.currentRole),this._updateNavBtn(n.currentUser,n.currentRole)}),window.authSwitchTab=t=>{this._activeTab=t,this._render(n.currentUser,n.currentRole)},window.openAuthModal=()=>this._openModal(),window.closeAuthModal=()=>this._closeModal(),console.log("✅ AuthRenderer initialized"))}_container(){return document.getElementById("authContent")}_t(t,e){return window.t?window.t(t):e}_openModal(){const t=document.getElementById("authModal");t&&t.classList.add("show"),this._render(n.currentUser,n.currentRole)}_closeModal(){const t=document.getElementById("authModal");t&&t.classList.remove("show")}_updateNavBtn(t,e){const i=document.getElementById("authNavBtn"),a=document.getElementById("authNavLabel");if(!i)return;if(t){const r=t.displayName||t.email.split("@")[0];a&&(a.textContent=r),i.classList.add("logged-in"),i.title=t.email}else a&&(a.textContent=this._t("auth.tab.login","Accedi")),i.classList.remove("logged-in"),i.title="";const s=t&&e==="admin";["adminNavLink","adminNavLinkMobile"].forEach(r=>{const d=document.getElementById(r);d&&(d.style.display=s?"flex":"none")}),window.lucide&&window.lucide.createIcons({nodes:[i]})}_render(t,e){const i=this._container();i&&(t?i.innerHTML=this._loggedInHTML(t,e):(i.innerHTML=this._loggedOutHTML(),this._bindForms()),window.lucide&&window.lucide.createIcons())}_loggedInHTML(t,e){const i=t.displayName||t.email,a=b[e]?b[e]():e||"user",s=f[e]||f.user;return`
      <div class="auth-profile">
        <div class="auth-avatar"><i data-lucide="user-circle"></i></div>
        <div class="auth-profile-info">
          <div class="auth-profile-name">${this._esc(i)}</div>
          <div class="auth-profile-email">${this._esc(t.email)}</div>
          <span class="auth-role-badge" style="background:${s};">${a}</span>
        </div>
      </div>
      <button class="btn auth-submit-btn" style="margin-top:18px;" onclick="authLogout()">
        <i data-lucide="log-out"></i>
        <span>${this._t("auth.logout.btn","Esci")}</span>
      </button>`}_loggedOutHTML(){return`
      <div class="auth-tabs">
        <button class="auth-tab ${this._activeTab==="login"?"active":""}"
          onclick="authSwitchTab('login')">${this._t("auth.tab.login","Accedi")}</button>
        <button class="auth-tab ${this._activeTab==="register"?"active":""}"
          onclick="authSwitchTab('register')">${this._t("auth.tab.register","Registrati")}</button>
      </div>
      <div id="authFormWrap">
        ${this._activeTab==="login"?this._loginFormHTML():this._registerFormHTML()}
      </div>`}_loginFormHTML(){return`
      <form id="authLoginForm" class="auth-form" onsubmit="return false;">
        <div class="auth-field">
          <label>${this._t("auth.email","Email")}</label>
          <input type="email" id="authLoginEmail" autocomplete="email" required
            placeholder="email@esempio.it">
        </div>
        <div class="auth-field">
          <label>${this._t("auth.password","Password")}</label>
          <input type="password" id="authLoginPassword" autocomplete="current-password" required
            placeholder="••••••••">
        </div>
        <div class="auth-error" id="authLoginError"></div>
        <button type="submit" class="btn auth-submit-btn" id="authLoginBtn">
          <i data-lucide="log-in"></i>
          <span>${this._t("auth.login.btn","Accedi")}</span>
        </button>
      </form>`}_registerFormHTML(){return`
      <form id="authRegisterForm" class="auth-form" onsubmit="return false;">
        <div class="auth-field">
          <label>${this._t("auth.displayName","Nome")}</label>
          <input type="text" id="authRegName" autocomplete="name" required
            placeholder="Il tuo nome">
        </div>
        <div class="auth-field">
          <label>${this._t("auth.email","Email")}</label>
          <input type="email" id="authRegEmail" autocomplete="email" required
            placeholder="email@esempio.it">
        </div>
        <div class="auth-field">
          <label>${this._t("auth.password","Password")}</label>
          <input type="password" id="authRegPassword" autocomplete="new-password" required
            placeholder="Min. 6 caratteri">
        </div>
        <div class="auth-field">
          <label>${this._t("auth.confirmPassword","Conferma Password")}</label>
          <input type="password" id="authRegConfirm" autocomplete="new-password" required
            placeholder="Ripeti la password">
        </div>
        <div class="auth-error" id="authRegError"></div>
        <button type="submit" class="btn auth-submit-btn" id="authRegBtn">
          <i data-lucide="user-plus"></i>
          <span>${this._t("auth.register.btn","Registrati")}</span>
        </button>
      </form>`}_bindForms(){var t,e;this._activeTab==="login"?(t=document.getElementById("authLoginForm"))==null||t.addEventListener("submit",()=>this._handleLogin()):(e=document.getElementById("authRegisterForm"))==null||e.addEventListener("submit",()=>this._handleRegister()),window.authLogout=async()=>{await n.signOut()}}async _handleLogin(){var s,r;const t=(s=document.getElementById("authLoginEmail"))==null?void 0:s.value,e=(r=document.getElementById("authLoginPassword"))==null?void 0:r.value,i=document.getElementById("authLoginError"),a=document.getElementById("authLoginBtn");this._setLoading(a,!0),this._setError(i,"");try{await n.signIn(t,e)}catch(d){this._setError(i,this._mapError(d))}finally{this._setLoading(a,!1)}}async _handleRegister(){var d,c,h,m;const t=((d=document.getElementById("authRegName"))==null?void 0:d.value)||"",e=(c=document.getElementById("authRegEmail"))==null?void 0:c.value,i=(h=document.getElementById("authRegPassword"))==null?void 0:h.value,a=(m=document.getElementById("authRegConfirm"))==null?void 0:m.value,s=document.getElementById("authRegError"),r=document.getElementById("authRegBtn");if(this._setError(s,""),i!==a)return this._setError(s,this._t("auth.error.passwordMismatch","Le password non coincidono."));this._setLoading(r,!0);try{await n.signUp({email:e,password:i,displayName:t})}catch(v){this._setError(s,this._mapError(v))}finally{this._setLoading(r,!1)}}_setLoading(t,e){t&&(t.disabled=e,t.style.opacity=e?"0.6":"1")}_setError(t,e){t&&(t.textContent=e)}_mapError(t){const e=(t==null?void 0:t.code)||(t==null?void 0:t.message)||"";return e.includes("invite/invalid")||e.includes("invite/missing")?this._t("auth.error.invalidInvite","Codice invito non valido o già utilizzato."):e.includes("email-already-in-use")?this._t("auth.error.emailInUse","Email già in uso."):e.includes("wrong-password")||e.includes("invalid-credential")?this._t("auth.error.invalidCredential","Email o password non validi."):e.includes("weak-password")?this._t("auth.error.weakPassword","La password deve essere di almeno 6 caratteri."):this._t("auth.error.generic","Si è verificato un errore. Riprova.")}_esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}const z=new A;class B{constructor(){this.db=null,this.modules=null,this.ready=!1,this.listeners=new Map}async initialize(){if(this.ready)return!0;try{return await this._waitForFirebase(),this.db=window.db,this.modules=window.firestoreModules,this.ready=!0,console.log("✅ FirebaseService initialized"),l.emit("firebase:ready"),!0}catch(t){return console.error("❌ FirebaseService initialization failed:",t),l.emit("firebase:error",{error:t}),!1}}_waitForFirebase(){return new Promise(t=>{if(window.firebaseReady&&window.db&&window.firestoreModules){t();return}window.addEventListener("firebaseReady",t,{once:!0})})}async getAll(t){if(!this.ready)throw new Error("FirebaseService not initialized");try{const{collection:e,getDocs:i}=this.modules,a=await i(e(this.db,t)),s=[];return a.forEach(r=>{s.push({firebaseId:r.id,...r.data()})}),console.log(`✅ Loaded ${s.length} documents from ${t}`),s}catch(e){throw console.error(`❌ Error loading ${t}:`,e),e}}async add(t,e){if(!this.ready)throw new Error("FirebaseService not initialized");try{const{collection:i,addDoc:a}=this.modules,s=await a(i(this.db,t),e),r={firebaseId:s.id,...e};return console.log(`✅ Added document to ${t}:`,s.id),r}catch(i){throw console.error(`❌ Error adding document to ${t}:`,i),i}}async update(t,e,i){if(!this.ready)throw new Error("FirebaseService not initialized");try{const{doc:a,updateDoc:s}=this.modules;await s(a(this.db,t,e),i),console.log(`✅ Updated document in ${t}:`,e)}catch(a){throw console.error(`❌ Error updating document in ${t}:`,a),a}}async delete(t,e){if(!this.ready)throw new Error("FirebaseService not initialized");try{const{doc:i,deleteDoc:a}=this.modules;await a(i(this.db,t,e)),console.log(`✅ Deleted document from ${t}:`,e)}catch(i){throw console.error(`❌ Error deleting document from ${t}:`,i),i}}onSnapshot(t,e){if(!this.ready)throw new Error("FirebaseService not initialized");try{const{collection:i,onSnapshot:a}=this.modules,s=a(i(this.db,t),r=>{console.log(`🔄 Real-time update for ${t}`),e(r)},r=>{console.error(`❌ Snapshot error for ${t}:`,r),l.emit("firebase:snapshot-error",{collectionName:t,error:r})});return this.listeners.has(t)||this.listeners.set(t,new Set),this.listeners.get(t).add(s),console.log(`✅ Real-time listener set up for ${t}`),()=>{s();const r=this.listeners.get(t);r&&r.delete(s)}}catch(i){throw console.error(`❌ Error setting up listener for ${t}:`,i),i}}async getEvents(){return this.getAll(o.events)}async getPlaces(){return this.getAll(o.places)}async getCategories(){return this.getAll(o.categories)}async addEvent(t){return this.add(o.events,t)}async addPlace(t){return this.add(o.places,t)}async updateEvent(t,e){return this.update(o.events,t,e)}async updatePlace(t,e){return this.update(o.places,t,e)}async deleteEvent(t){return this.delete(o.events,t)}async deletePlace(t){return this.delete(o.places,t)}onEventsSnapshot(t){return this.onSnapshot(o.events,t)}onPlacesSnapshot(t){return this.onSnapshot(o.places,t)}cleanup(){for(const[t,e]of this.listeners)e.forEach(i=>i()),console.log(`✅ Cleaned up listeners for ${t}`);this.listeners.clear()}isReady(){return this.ready}}const C=new B;export{n as a,z as b,C as f};
