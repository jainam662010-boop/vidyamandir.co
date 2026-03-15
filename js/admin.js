/**
 * VIDYA MANDIR — Admin CMS v4
 * Full control: subjects, chapters, videos, notes, quizzes,
 * PDFs, NCERT topics, announcements, teacher profiles, theme, settings
 * All inputs sanitised via VidyaSec before storage
 */
'use strict';

const Admin = {
  _section: 'overview',

  init() {
    VidyaSec.applyProtections();
    if (VidyaSec.isValid()) this._show();
    else this._showLogin();
  },

  _showLogin() {
    document.getElementById('loginWall').style.display='flex';
    document.getElementById('adminBody').style.display='none';
  },
  _show() {
    document.getElementById('loginWall').style.display='none';
    document.getElementById('adminBody').style.display='block';
    this.switchSection(this._section);
    this.refresh();
  },

  /* ── Secure login ── */
  async tryLogin() {
    const btn=document.getElementById('loginBtn');
    const err=document.getElementById('loginErr');
    const inp=document.getElementById('adminPass');
    if (!inp||!err||!btn) return;

    const secs=VidyaSec.isLocked();
    if (secs) { err.textContent=`Too many attempts. Wait ${secs}s.`; err.classList.add('show'); return; }

    btn.disabled=true; btn.textContent='Verifying…';

    const ok=await VidyaSec.verify(inp.value||'');
    if (ok) {
      VidyaSec.createSession(); VidyaSec.reset();
      inp.value=''; this._show();
    } else {
      VidyaSec.fail();
      const rem=VidyaSec.attLeft();
      err.textContent = rem>0 ? `Incorrect. ${rem} attempt${rem!==1?'s':''} remaining.` : 'Locked. Wait 30 seconds.';
      err.classList.add('show');
      inp.value=''; inp.focus();
    }
    btn.disabled=false; btn.textContent='Sign In →';
  },
  logout() { VidyaSec.kill(); location.href='index.html'; },

  /* ── Data (all values sanitised on save) ── */
  getData() {
    return App._parseLS('vm_admin_data', {
      subjects:[], chapters:[], quiz:[], pdfs:[],
      ncertTopics:[], announcements:[], teachers:[], customTheme:null
    });
  },
  saveData(d) { App._saveLS('vm_admin_data', d); },

  /* ── Panel routing ── */
  switchSection(id) {
    this._section=id;
    document.querySelectorAll('.a-panel').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('.al-link').forEach(l=>l.classList.remove('on'));
    document.getElementById('ap-'+id)?.classList.add('on');
    document.getElementById('al-'+id)?.classList.add('on');
    this.refresh();
  },
  _setActiveNav(id) {
    document.querySelectorAll('.al-link').forEach(l=>l.classList.remove('on'));
    document.getElementById('al-'+id)?.classList.add('on');
  },

  /* ── Full refresh ── */
  refresh() {
    this._renderStats();
    this._renderBuiltinTable();
    this._renderSubjTable();
    this._renderChTable();
    this._renderPDFTable();
    this._renderNCERTTable();
    this._renderQuizTable();
    this._renderAnnTable();
    this._renderTeachersTable();
    this._renderProgressTable();
    this._renderTodosTable();
    this._renderSettingsInfo();
  },

  /* ── Stats ── */
  _renderStats() {
    const d=this.getData(); const el=document.getElementById('admin-stats'); if(!el) return;
    const p=App.getProgress(); let done=0; Object.values(p).forEach(s=>done+=(s.done||[]).length);
    el.innerHTML=`
      <div class="stat-tile"><div class="stat-ico">📚</div><div><div class="stat-num">${4+d.subjects.length}</div><div class="stat-lbl">Subjects</div></div></div>
      <div class="stat-tile"><div class="stat-ico">📁</div><div><div class="stat-num">${d.pdfs.length}</div><div class="stat-lbl">PDFs</div></div></div>
      <div class="stat-tile"><div class="stat-ico">⭐</div><div><div class="stat-num">${d.ncertTopics.length}</div><div class="stat-lbl">Topics</div></div></div>
      <div class="stat-tile"><div class="stat-ico">🧠</div><div><div class="stat-num">${d.quiz.length}</div><div class="stat-lbl">Quiz Qs</div></div></div>`;
  },

  /* ── Built-in chapter editor (VIDEO + NOTE override) ── */
  _BUILTIN: [
    {sid:'mathematics',   cid:'real-numbers',       name:'Real Numbers'},
    {sid:'mathematics',   cid:'polynomials',         name:'Polynomials'},
    {sid:'mathematics',   cid:'linear-equations',    name:'Linear Equations'},
    {sid:'mathematics',   cid:'triangles',           name:'Triangles'},
    {sid:'mathematics',   cid:'trigonometry',        name:'Trigonometry'},
    {sid:'science',       cid:'chemical-reactions',  name:'Chemical Reactions'},
    {sid:'science',       cid:'acids-bases',         name:'Acids, Bases & Salts'},
    {sid:'science',       cid:'life-processes',      name:'Life Processes'},
    {sid:'science',       cid:'metals-nonmetals',    name:'Metals & Non-metals'},
    {sid:'science',       cid:'carbon-compounds',    name:'Carbon Compounds'},
    {sid:'social-science',cid:'nationalism-europe',  name:'Nationalism in Europe'},
    {sid:'social-science',cid:'resources-development',name:'Resources & Development'},
    {sid:'social-science',cid:'power-sharing',       name:'Power Sharing'},
    {sid:'social-science',cid:'development',         name:'Development'},
    {sid:'english',       cid:'a-letter-to-god',     name:'A Letter to God'},
    {sid:'english',       cid:'nelson-mandela',      name:'Nelson Mandela'},
    {sid:'english',       cid:'grammar-writing',     name:'Grammar & Writing'},
    {sid:'english',       cid:'his-first-flight',    name:'His First Flight'},
  ],

  _renderBuiltinTable() {
    const el=document.getElementById('builtin-tbody'); if(!el) return;
    el.innerHTML = this._BUILTIN.map(({sid,cid,name})=>{
      const ov=App.getOverride(sid,cid);
      return `<tr>
        <td><strong>${name}</strong><br><span style="font-size:.68rem;color:var(--t3)">${sid}</span></td>
        <td>
          <input class="fc" style="font-size:.79rem;margin-bottom:4px" id="ov-vid-${sid}--${cid}" placeholder="YouTube Video ID" value="${ov.videoId||''}" onchange="Admin._saveBuiltin('${sid}','${cid}','videoId',this.value)">
          <input class="fc" style="font-size:.79rem" id="ov-tit-${sid}--${cid}" placeholder="Lesson title (optional)" value="${ov.lesson0Title||''}" onchange="Admin._saveBuiltin('${sid}','${cid}','lesson0Title',this.value)">
        </td>
        <td>
          <textarea class="fc fc-ta" style="font-size:.79rem;min-height:52px" placeholder="Teacher's note (shown at top of chapter)…" onchange="Admin._saveBuiltin('${sid}','${cid}','adminNote',this.value)">${ov.adminNote||''}</textarea>
        </td>
        <td><a href="chapter.html?subject=${sid}&chapter=${cid}" target="_blank" class="btn btn-gh btn-sm">View →</a></td>
      </tr>`;
    }).join('');
  },
  _saveBuiltin(sid,cid,field,rawVal) {
    if (field==='videoId' && rawVal && !VidyaSec.isValidYTId(rawVal)) {
      App.toast('Invalid YouTube ID — must be 11 characters','⚠️'); return;
    }
    const val = VidyaSec.clampStr(VidyaSec.sanitize(rawVal), 200);
    App.saveOverride(sid,cid,{[field]:val});
    App.toast('Saved ✓','💾');
  },

  /* ── Custom Subjects ── */
  _renderSubjTable() {
    const d=this.getData(); const el=document.getElementById('subj-tbody'); if(!el) return;
    const bi=[['Mathematics','📐','mathematics'],['Science','🔬','science'],['Social Science','🌍','social-science'],['English','📚','english']];
    el.innerHTML = bi.map(([n,i,id])=>`<tr>
      <td>${i} <strong>${n}</strong></td>
      <td><span class="chip chip-b">Built-in</span></td>
      <td><a href="subject.html?id=${id}" target="_blank" class="btn btn-gh btn-sm">View →</a></td>
    </tr>`).join('')
    + d.subjects.map((s,i)=>`<tr>
      <td>${VidyaSec.sanitize(s.icon||'📖')} <strong>${VidyaSec.sanitize(s.name)}</strong></td>
      <td><span class="chip chip-tl">Custom</span></td>
      <td><button class="btn btn-dn btn-sm" onclick="Admin._delSubj(${i})">Delete</button></td>
    </tr>`).join('');
  },
  addSubject() {
    const name=VidyaSec.clampStr(document.getElementById('ns-name')?.value.trim());
    const icon=VidyaSec.clampStr(document.getElementById('ns-icon')?.value.trim()||'📖',4);
    const desc=VidyaSec.clampStr(document.getElementById('ns-desc')?.value.trim());
    const color=document.getElementById('ns-color')?.value||'#C8822A';
    if (!name) { App.toast('Name required','⚠️'); return; }
    const d=this.getData();
    d.subjects.push({name,icon,desc,color,id:App._slug(name),date:Date.now()});
    this.saveData(d); App.toast(`"${name}" added ✅`);
    document.getElementById('ns-name').value=''; this.refresh();
  },
  _delSubj(i) {
    if (!confirm('Delete this subject?')) return;
    const d=this.getData(); d.subjects.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Custom Chapters ── */
  _renderChTable() {
    const d=this.getData(); const el=document.getElementById('ch-tbody'); if(!el) return;
    el.innerHTML = !d.chapters.length
      ? '<tr><td colspan="5" style="text-align:center;color:var(--t3)">No custom chapters yet</td></tr>'
      : d.chapters.map((c,i)=>`<tr>
          <td><strong>${VidyaSec.sanitize(c.title)}</strong></td>
          <td>${VidyaSec.sanitize(c.subject)}</td>
          <td>${c.videoId?`<span class="chip chip-tl">✓ Video</span>`:'—'}</td>
          <td>${c.notes?`<span class="chip chip-b">✓ Notes</span>`:'—'}</td>
          <td><button class="btn btn-dn btn-sm" onclick="Admin._delCh(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addChapter() {
    const title=VidyaSec.clampStr(document.getElementById('nc-title')?.value.trim());
    const subject=VidyaSec.clampStr(document.getElementById('nc-subj')?.value);
    const videoId=VidyaSec.clampStr(document.getElementById('nc-vid')?.value.trim(),11);
    const notes=VidyaSec.clampStr(document.getElementById('nc-notes')?.value.trim(),5000);
    const duration=VidyaSec.clampStr(document.getElementById('nc-dur')?.value.trim()||'40 min',20);
    if (!title||!subject) { App.toast('Title & subject required','⚠️'); return; }
    if (videoId && !VidyaSec.isValidYTId(videoId)) { App.toast('Invalid YouTube ID','⚠️'); return; }
    const d=this.getData();
    d.chapters.push({title,subject,videoId,notes,duration,date:Date.now()});
    this.saveData(d); App.toast(`Chapter "${title}" added ✅`);
    ['nc-title','nc-vid','nc-notes','nc-dur'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    this.refresh();
  },
  _delCh(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.chapters.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── PDFs ── */
  _renderPDFTable() {
    const d=this.getData(); const el=document.getElementById('pdf-tbody'); if(!el) return;
    el.innerHTML = !d.pdfs.length
      ? '<tr><td colspan="5" style="text-align:center;color:var(--t3)">No PDFs yet</td></tr>'
      : d.pdfs.map((p,i)=>`<tr>
          <td>📄 <strong>${VidyaSec.sanitize(p.name)}</strong></td>
          <td>${VidyaSec.sanitize(p.subject)}</td>
          <td>${VidyaSec.sanitize(p.chapter||'General')}</td>
          <td><span class="chip chip-tl">${VidyaSec.sanitize(p.type||'Notes')}</span></td>
          <td style="display:flex;gap:5px">
            <a href="${p.url}" target="_blank" rel="noopener" class="btn btn-gh btn-sm">View</a>
            <button class="btn btn-dn btn-sm" onclick="Admin._delPDF(${i})">Delete</button>
          </td>
        </tr>`).join('');
  },
  addPDF() {
    const file=document.getElementById('pdf-file')?.files[0];
    const name=VidyaSec.clampStr(document.getElementById('pdf-name')?.value.trim());
    const subject=VidyaSec.clampStr(document.getElementById('pdf-subj')?.value);
    const chapter=VidyaSec.clampStr(document.getElementById('pdf-ch')?.value.trim());
    const type=VidyaSec.clampStr(document.getElementById('pdf-type')?.value);
    const urlField=VidyaSec.clampStr(document.getElementById('pdf-url')?.value.trim(),1000);
    if (!name||!subject) { App.toast('Name and subject required','⚠️'); return; }
    if (urlField && !VidyaSec.isValidURL(urlField)) { App.toast('Invalid URL','⚠️'); return; }
    const save=(url,size)=>{
      const d=this.getData();
      d.pdfs.push({name,subject,chapter:chapter||'',type:type||'Notes',url,size:size||'—',date:Date.now()});
      this.saveData(d); App.toast(`PDF "${name}" saved 📁`);
      ['pdf-name','pdf-ch','pdf-url'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      const fi=document.getElementById('pdf-file'); if(fi) fi.value='';
      this.refresh();
    };
    if (file) {
      if (file.size > 10*1024*1024) { App.toast('File too large (max 10MB)','⚠️'); return; }
      const reader=new FileReader();
      reader.onload=e=>save(e.target.result, Math.round(file.size/1024)+'KB');
      reader.readAsDataURL(file);
    } else if (urlField) { save(urlField,'—'); }
    else App.toast('Upload a file or enter a URL','⚠️');
  },
  _delPDF(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.pdfs.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── NCERT Topics ── */
  _renderNCERTTable() {
    const d=this.getData(); const el=document.getElementById('ncert-tbody'); if(!el) return;
    const nh=document.getElementById('ncert-count-head'); if(nh) nh.textContent=`All NCERT Topics (${d.ncertTopics.length})`;
    el.innerHTML = !d.ncertTopics.length
      ? '<tr><td colspan="6" style="text-align:center;color:var(--t3)">No topics yet</td></tr>'
      : d.ncertTopics.map((t,i)=>`<tr>
          <td style="max-width:200px">${VidyaSec.sanitize(t.text.slice(0,70))}${t.text.length>70?'…':''}</td>
          <td>${VidyaSec.sanitize(t.subject)}</td>
          <td>${VidyaSec.sanitize(t.chapter||'—')}</td>
          <td>${t.marks?`<span class="chip chip-a">${VidyaSec.sanitize(t.marks)}M</span>`:'—'}</td>
          <td>${t.important?'⭐':'—'}</td>
          <td><button class="btn btn-dn btn-sm" onclick="Admin._delNCERT(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addNCERT() {
    const text=VidyaSec.clampStr(document.getElementById('nt-text')?.value.trim(),500);
    const subject=VidyaSec.clampStr(document.getElementById('nt-subj')?.value);
    const chapter=VidyaSec.clampStr(document.getElementById('nt-ch')?.value.trim());
    const marks=VidyaSec.clampStr(document.getElementById('nt-marks')?.value.trim(),3);
    const important=document.getElementById('nt-imp')?.checked||false;
    const type=VidyaSec.clampStr(document.getElementById('nt-type')?.value);
    if (!text||!subject) { App.toast('Text and subject required','⚠️'); return; }
    const d=this.getData();
    d.ncertTopics.push({text,subject,chapter:chapter||'',marks,important,type,date:Date.now()});
    this.saveData(d); App.toast('NCERT topic added ⭐');
    ['nt-text','nt-ch','nt-marks'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    const imp=document.getElementById('nt-imp'); if(imp) imp.checked=false;
    this.refresh();
  },
  _delNCERT(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.ncertTopics.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Quiz ── */
  _renderQuizTable() {
    const d=this.getData(); const el=document.getElementById('quiz-tbody'); if(!el) return;
    el.innerHTML = !d.quiz.length
      ? '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No questions yet</td></tr>'
      : d.quiz.map((q,i)=>`<tr>
          <td style="max-width:180px">${VidyaSec.sanitize(q.q.slice(0,55))}…</td>
          <td>${VidyaSec.sanitize(q.subject)}</td>
          <td>${VidyaSec.sanitize(q.chapter||'—')}</td>
          <td><button class="btn btn-dn btn-sm" onclick="Admin._delQuiz(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addQuiz() {
    const q=VidyaSec.clampStr(document.getElementById('nq-q')?.value.trim(),300);
    const subject=VidyaSec.clampStr(document.getElementById('nq-subj')?.value);
    const chapter=VidyaSec.clampStr(document.getElementById('nq-ch')?.value.trim());
    const opts=[1,2,3,4].map(i=>VidyaSec.clampStr(document.getElementById('nq-o'+i)?.value.trim(),200)).filter(Boolean);
    const correct=parseInt(document.getElementById('nq-ans')?.value||'0');
    const marks=VidyaSec.clampStr(document.getElementById('nq-marks')?.value||'1',2);
    const difficulty=document.getElementById('nq-diff')?.value||'medium';
    if (!q||opts.length<2) { App.toast('Question and 2+ options required','⚠️'); return; }
    if (correct>=opts.length) { App.toast('Correct answer index out of range','⚠️'); return; }
    const d=this.getData();
    d.quiz.push({q,subject,chapter:chapter||'',options:opts,answer:correct,marks,difficulty,date:Date.now()});
    this.saveData(d); App.toast('Question added 🧠');
    ['nq-q','nq-ch','nq-o1','nq-o2','nq-o3','nq-o4'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    this.refresh();
  },
  _delQuiz(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.quiz.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Teachers ── */
  _renderTeachersTable() {
    const d=this.getData(); const el=document.getElementById('teacher-tbody'); if(!el) return;
    el.innerHTML = !(d.teachers||[]).length
      ? '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No teachers added</td></tr>'
      : d.teachers.map((t,i)=>`<tr>
          <td>${VidyaSec.sanitize(t.avatar||'T')} <strong>${VidyaSec.sanitize(t.name)}</strong></td>
          <td>${VidyaSec.sanitize(t.channel)}</td>
          <td>${VidyaSec.sanitize(t.subject||'—')}</td>
          <td><button class="btn btn-dn btn-sm" onclick="Admin._delTeacher(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addTeacher() {
    const name=VidyaSec.clampStr(document.getElementById('nt2-name')?.value.trim());
    const channel=VidyaSec.clampStr(document.getElementById('nt2-channel')?.value.trim());
    const subject=VidyaSec.clampStr(document.getElementById('nt2-subj')?.value);
    const color=document.getElementById('nt2-color')?.value||'#C8822A';
    const avatar=VidyaSec.clampStr(document.getElementById('nt2-avatar')?.value.trim()||name[0]||'T',4);
    if (!name||!channel) { App.toast('Name and channel required','⚠️'); return; }
    const d=this.getData();
    if (!d.teachers) d.teachers=[];
    d.teachers.push({name,channel,subject:subject||'',color,avatar,date:Date.now()});
    this.saveData(d); App.toast(`Teacher "${name}" added ✅`);
    ['nt2-name','nt2-channel','nt2-avatar'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    this.refresh();
  },
  _delTeacher(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.teachers.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Announcements ── */
  _renderAnnTable() {
    const d=this.getData(); const el=document.getElementById('ann-tbody'); if(!el) return;
    el.innerHTML = !(d.announcements||[]).length
      ? '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No announcements</td></tr>'
      : d.announcements.map((a,i)=>`<tr>
          <td><strong>${VidyaSec.sanitize(a.title)}</strong></td>
          <td style="max-width:180px">${VidyaSec.sanitize(a.text.slice(0,60))}</td>
          <td><span class="chip chip-${a.type==='exam'?'a':a.type==='info'?'tl':'b'}">${VidyaSec.sanitize(a.type)}</span></td>
          <td><button class="btn btn-dn btn-sm" onclick="Admin._delAnn(${i})">Delete</button></td>
        </tr>`).join('');
  },
  addAnnouncement() {
    const title=VidyaSec.clampStr(document.getElementById('na-title')?.value.trim(),150);
    const text=VidyaSec.clampStr(document.getElementById('na-text')?.value.trim(),500);
    const type=VidyaSec.clampStr(document.getElementById('na-type')?.value);
    if (!title||!text) { App.toast('Title and message required','⚠️'); return; }
    const d=this.getData();
    d.announcements.unshift({title,text,type,date:new Date().toLocaleDateString('en-IN')});
    this.saveData(d); App.toast('Posted 📢');
    ['na-title','na-text'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    this.refresh();
  },
  _delAnn(i) {
    if (!confirm('Delete?')) return;
    const d=this.getData(); d.announcements.splice(i,1); this.saveData(d); this.refresh(); App.toast('Deleted 🗑️');
  },

  /* ── Progress ── */
  _renderProgressTable() {
    const p=App.getProgress(); const el=document.getElementById('prog-tbody'); if(!el) return;
    const subs=[{id:'mathematics',n:'Mathematics',t:5},{id:'science',n:'Science',t:5},{id:'social-science',n:'Social Science',t:4},{id:'english',n:'English',t:4}];
    el.innerHTML=subs.map(s=>{
      const sp=p[s.id]||{};
      const done=(sp.done||[]).length, pct=Math.round(done/s.t*100), qz=Object.keys(sp.scores||{}).length;
      return `<tr>
        <td><strong>${s.n}</strong></td>
        <td>${done}/${s.t}</td>
        <td><div class="pbar" style="width:80px"><div class="pfill" style="width:${pct}%"></div></div></td>
        <td>${qz} quizzes</td>
        <td><button class="btn btn-gh btn-sm" onclick="Admin._clearSubj('${s.id}')">Clear</button></td>
      </tr>`;
    }).join('');
  },
  _clearSubj(id) {
    if (!confirm('Clear progress for this subject?')) return;
    const p=App.getProgress(); delete p[id]; App.saveProgress(p); this.refresh(); App.toast('Cleared 🗑️');
  },
  clearAll() {
    if (!confirm('Clear ALL student progress? This cannot be undone.')) return;
    App.saveProgress({}); this.refresh(); App.toast('All progress cleared 🗑️');
  },
  clearAllOverrides() {
    if (!confirm('Clear all chapter overrides?')) return;
    localStorage.removeItem('vm_overrides'); this.refresh(); App.toast('Overrides cleared 🗑️');
  },

  /* ── Todos ── */
  _renderTodosTable() {
    const todos=TodoPanel.getData(); const el=document.getElementById('todos-tbody'); if(!el) return;
    el.innerHTML = !todos.length
      ? '<tr><td colspan="6" style="text-align:center;color:var(--t3)">No tasks</td></tr>'
      : todos.map(t=>`<tr>
          <td style="max-width:180px">${VidyaSec.sanitize(t.text.slice(0,55))}</td>
          <td>${VidyaSec.sanitize(t.subject||'—')}</td>
          <td>${t.priority==='high'?'<span class="chip chip-a">High</span>':'Normal'}</td>
          <td>${t.due?new Date(t.due).toLocaleDateString('en-IN'):'—'}</td>
          <td>${t.marks||'—'}</td>
          <td>${t.done?'<span class="chip chip-tl">Done</span>':'<span class="chip chip-b">Pending</span>'}</td>
        </tr>`).join('');
  },

  /* ── Settings ── */
  _renderSettingsInfo() {
    const el=document.getElementById('settings-info'); if(!el) return;
    const d=this.getData();
    el.innerHTML=`
      Built-in subjects: <strong>4</strong><br>
      Custom subjects: <strong>${d.subjects.length}</strong><br>
      Custom chapters: <strong>${d.chapters.length}</strong><br>
      PDFs: <strong>${d.pdfs.length}</strong><br>
      NCERT topics (custom): <strong>${d.ncertTopics.length}</strong><br>
      Quiz questions (custom): <strong>${d.quiz.length}</strong><br>
      Teachers: <strong>${(d.teachers||[]).length}</strong><br>
      Announcements: <strong>${(d.announcements||[]).length}</strong><br>
      Student tasks: <strong>${TodoPanel.getData().length}</strong>`;
    const sn=localStorage.getItem('vm_site_name'), mo=localStorage.getItem('vm_motd');
    if (sn) { const el2=document.getElementById('s-name'); if(el2) el2.value=sn; }
    if (mo) { const el2=document.getElementById('s-motd'); if(el2) el2.value=mo; }
  },
  saveSiteSettings() {
    const name=VidyaSec.clampStr(document.getElementById('s-name')?.value.trim(),60);
    const motd=VidyaSec.clampStr(document.getElementById('s-motd')?.value.trim(),200);
    if (name) localStorage.setItem('vm_site_name', name);
    if (motd) localStorage.setItem('vm_motd', motd);
    App.toast('Settings saved ✅');
  },
  exportData() {
    const all={
      adminData:this.getData(), progress:App.getProgress(),
      todos:TodoPanel.getData(), overrides:App._parseLS('vm_overrides',{})
    };
    const blob=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`vidyamandir-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); App.toast('Backup exported 💾');
  },
  importData(e) {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const d=JSON.parse(ev.target.result);
        if (d.adminData) this.saveData(d.adminData);
        if (d.progress)  App.saveProgress(d.progress);
        if (d.todos)     TodoPanel.saveData(d.todos);
        if (d.overrides) App._saveLS('vm_overrides', d.overrides);
        App.toast('Backup imported 🎉'); this.refresh();
      } catch { App.toast('Invalid backup file','❌'); }
    };
    reader.readAsText(file);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.initPage('admin');
  Admin.init();
});
