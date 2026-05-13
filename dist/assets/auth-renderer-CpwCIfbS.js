import{authService as a}from"./auth-service-BXAz2aCO.js";import"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";const c={user:()=>window.t?window.t("auth.role.user"):"Utente",artist:()=>window.t?window.t("auth.role.artist"):"Artista",manager:()=>window.t?window.t("auth.role.manager"):"Manager",admin:()=>window.t?window.t("auth.role.admin"):"Admin"},h={admin:"#dc2626",manager:"#7c3aed",artist:"#0284c7",user:"#16a34a"};class g{constructor(){this._activeTab="login"}initialize(){this._initialized||(this._initialized=!0,a.onAuthStateChange((t,e)=>{this._render(t,e),this._updateNavBtn(t,e),t&&this._closeModal()}),window.addEventListener("languageChanged",()=>{this._render(a.currentUser,a.currentRole),this._updateNavBtn(a.currentUser,a.currentRole)}),window.authSwitchTab=t=>{this._activeTab=t,this._render(a.currentUser,a.currentRole)},window.openAuthModal=()=>this._openModal(),window.closeAuthModal=()=>this._closeModal(),console.log("✅ AuthRenderer initialized"))}_container(){return document.getElementById("authContent")}_t(t,e){return window.t?window.t(t):e}_openModal(){const t=document.getElementById("authModal");t&&t.classList.add("show"),this._render(a.currentUser,a.currentRole)}_closeModal(){const t=document.getElementById("authModal");t&&t.classList.remove("show")}_updateNavBtn(t,e){const i=document.getElementById("authNavBtn"),n=document.getElementById("authNavLabel");if(!i)return;if(t){const o=t.displayName||t.email.split("@")[0];n&&(n.textContent=o),i.classList.add("logged-in"),i.title=t.email}else n&&(n.textContent=this._t("auth.tab.login","Accedi")),i.classList.remove("logged-in"),i.title="";const s=t&&e==="admin";["adminNavLink","adminNavLinkMobile"].forEach(o=>{const r=document.getElementById(o);r&&(r.style.display=s?"flex":"none")}),window.lucide&&window.lucide.createIcons({nodes:[i]})}_render(t,e){const i=this._container();i&&(t?i.innerHTML=this._loggedInHTML(t,e):(i.innerHTML=this._loggedOutHTML(),this._bindForms()),window.lucide&&window.lucide.createIcons())}_loggedInHTML(t,e){const i=t.displayName||t.email,n=c[e]?c[e]():e||"user",s=h[e]||h.user;return`
      <div class="auth-profile">
        <div class="auth-avatar"><i data-lucide="user-circle"></i></div>
        <div class="auth-profile-info">
          <div class="auth-profile-name">${this._esc(i)}</div>
          <div class="auth-profile-email">${this._esc(t.email)}</div>
          <span class="auth-role-badge" style="background:${s};">${n}</span>
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
      </form>`}_bindForms(){var t,e;this._activeTab==="login"?(t=document.getElementById("authLoginForm"))==null||t.addEventListener("submit",()=>this._handleLogin()):(e=document.getElementById("authRegisterForm"))==null||e.addEventListener("submit",()=>this._handleRegister()),window.authLogout=async()=>{await a.signOut()}}async _handleLogin(){var s,o;const t=(s=document.getElementById("authLoginEmail"))==null?void 0:s.value,e=(o=document.getElementById("authLoginPassword"))==null?void 0:o.value,i=document.getElementById("authLoginError"),n=document.getElementById("authLoginBtn");this._setLoading(n,!0),this._setError(i,"");try{await a.signIn(t,e)}catch(r){this._setError(i,this._mapError(r))}finally{this._setLoading(n,!1)}}async _handleRegister(){var r,d,l,u;const t=((r=document.getElementById("authRegName"))==null?void 0:r.value)||"",e=(d=document.getElementById("authRegEmail"))==null?void 0:d.value,i=(l=document.getElementById("authRegPassword"))==null?void 0:l.value,n=(u=document.getElementById("authRegConfirm"))==null?void 0:u.value,s=document.getElementById("authRegError"),o=document.getElementById("authRegBtn");if(this._setError(s,""),i!==n)return this._setError(s,this._t("auth.error.passwordMismatch","Le password non coincidono."));this._setLoading(o,!0);try{await a.signUp({email:e,password:i,displayName:t})}catch(m){this._setError(s,this._mapError(m))}finally{this._setLoading(o,!1)}}_setLoading(t,e){t&&(t.disabled=e,t.style.opacity=e?"0.6":"1")}_setError(t,e){t&&(t.textContent=e)}_mapError(t){const e=(t==null?void 0:t.code)||(t==null?void 0:t.message)||"";return e.includes("invite/invalid")||e.includes("invite/missing")?this._t("auth.error.invalidInvite","Codice invito non valido o già utilizzato."):e.includes("email-already-in-use")?this._t("auth.error.emailInUse","Email già in uso."):e.includes("wrong-password")||e.includes("invalid-credential")?this._t("auth.error.invalidCredential","Email o password non validi."):e.includes("weak-password")?this._t("auth.error.weakPassword","La password deve essere di almeno 6 caratteri."):this._t("auth.error.generic","Si è verificato un errore. Riprova.")}_esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}}const b=new g;export{g as AuthRenderer,b as authRenderer};
