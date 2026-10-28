(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DONE_KEY = 'tkaora_completed_v1';
  const QUIZ_KEY = 'tkaora_quiz_v1';
  const TITLES = { home: 'Beranda', library: 'Materi', practice: 'Latihan', progress: 'Catatan' };
  const LETTERS = 'ABCDE';
  const st = { materials: [], questions: [], done: new Set(), kind: 'semua', current: null, answers: {}, index: 0, onlyWrong: false };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (store, key, fallback) => { try { return JSON.parse(store.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (store, key, val) => { try { store.setItem(key, JSON.stringify(val)); } catch {} };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- Navigasi ---------- */
  function show(page) {
    if (!TITLES[page]) page = 'home';
    $$('.page').forEach(p => { p.hidden = p.id !== page; });
    $$('[data-nav]').forEach(a => a.toggleAttribute('aria-current', a.dataset.nav === page));
    document.title = `${TITLES[page]} | TKAORA`;
    if (page === 'library') renderLibrary();
    if (page === 'progress') renderProgress();
    window.scrollTo(0, 0);
    $(`#h-${page}`)?.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  /* ---------- Progres belajar ---------- */
  function saveDone() { write(localStorage, DONE_KEY, [...st.done]); renderProgress(); renderLibrary(); }
  function renderProgress() {
    const total = st.materials.length, n = st.done.size, pct = total ? Math.round(n / total * 100) : 0;
    const msg = n === 0 ? 'Mulai dari satu materi yang membuatmu penasaran.'
      : n === total ? 'Semua materi sudah kamu pelajari. Ulangi yang masih terasa kurang yakin.'
      : `Kamu sudah mempelajari ${n} materi. Lanjutkan sesuai kebutuhanmu.`;
    $('#doneNum').textContent = `${n} materi dipelajari`;
    $('#doneMsg').textContent = msg;
    $('#doneBar').style.width = pct + '%';
    $('#homeMsg').textContent = msg;
    $('#homeBar').style.width = pct + '%';
    $('#homeCount').textContent = `${n} dari ${total} materi`;
    $('#plist').innerHTML = st.materials.map(m => {
      const d = st.done.has(m.id);
      return `<li><button class="prow ${d ? 'on' : ''}" data-toggle="${m.id}" aria-pressed="${d}"><span class="tick" aria-hidden="true">${d ? '✓' : ''}</span><span>${esc(m.title)}</span><small>${d ? 'Sudah dipelajari' : 'Belum ditandai'}</small></button></li>`;
    }).join('');
  }
  function toggleDone(id) {
    st.done.has(id) ? st.done.delete(id) : st.done.add(id);
    saveDone();
    syncPdfButton();
  }
  $('#plist').addEventListener('click', e => { const b = e.target.closest('[data-toggle]'); if (b) toggleDone(b.dataset.toggle); });
  $('#reset').addEventListener('click', () => {
    if (!st.done.size || !confirm('Hapus semua catatan materi yang sudah ditandai?')) return;
    st.done.clear(); saveDone(); toast('Catatan belajar dihapus dari perangkat ini');
  });

  /* ---------- Materi ---------- */
  function renderLibrary() {
    const q = $('#search').value.toLowerCase().trim();
    const list = st.materials.filter(m => (st.kind === 'semua' || m.kind === st.kind) && (!q || `${m.title} ${m.description}`.toLowerCase().includes(q)));
    $('#count').textContent = `${list.length} materi`;
    $('#noPdf').hidden = st.materials.every(m => m.hasPdf);
    $('#materials').innerHTML = list.length ? list.map(m => {
      const d = st.done.has(m.id);
      return `<article class="card ${d ? 'is-done' : ''}"><div class="card-top"><span class="tag ${m.kind === 'Wajib' ? 'wajib' : ''}">${esc(m.kind)}</span>${d ? '<span class="done-mark">✓ Dipelajari</span>' : ''}</div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><div class="card-foot"><span class="status ${m.hasPdf ? 'ok' : ''}">${m.hasPdf ? 'PDF tersedia' : 'PDF belum diunggah'}</span><button class="btn small" data-open="${m.id}" aria-label="Buka ${esc(m.title)}">Buka</button></div></article>`;
    }).join('') : `<div class="empty"><b>Tidak ada materi yang cocok</b><p>Coba kata kunci lain atau pilih "Semua".</p></div>`;
  }
  $('#search').addEventListener('input', renderLibrary);
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    st.kind = c.dataset.kind;
    $$('.chip').forEach(x => { const on = x === c; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    renderLibrary();
  }));
  $('#materials').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openPdf(b.dataset.open); });

  /* ---------- Pembaca PDF ---------- */
  const dlg = $('#pdf');
  function syncPdfButton() {
    if (!st.current) return;
    const d = st.done.has(st.current.id), b = $('#pdfDone');
    b.textContent = d ? '✓ Sudah dipelajari' : 'Tandai sudah dipelajari';
    b.setAttribute('aria-pressed', d);
  }
  function openPdf(id) {
    const m = st.current = st.materials.find(x => x.id === id);
    if (!m) return;
    $('#pdfTitle').textContent = m.title;
    $('#pdfFrame').hidden = !m.hasPdf;
    $('#pdfMissing').hidden = !!m.hasPdf;
    $('#pdfFrame').src = m.hasPdf ? m.pdf : 'about:blank';
    if (m.sourceUrl) $('#pdfSource').href = m.sourceUrl;
    syncPdfButton();
    dlg.showModal();
  }
  $('#pdfClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { $('#pdfFrame').src = 'about:blank'; });
  $('#pdfDone').addEventListener('click', () => {
    if (!st.current) return;
    toggleDone(st.current.id);
    toast(st.done.has(st.current.id) ? 'Ditandai sudah dipelajari' : 'Tanda dihapus');
  });

  /* ---------- Latihan ---------- */
  const saveQuiz = () => write(sessionStorage, QUIZ_KEY, { answers: st.answers, index: st.index });
  function begin(fresh) {
    const saved = fresh ? null : read(sessionStorage, QUIZ_KEY, null);
    st.answers = saved?.answers || {};
    st.index = Math.min(saved?.index || 0, st.questions.length - 1);
    $('#intro').hidden = true; $('#results').hidden = true; $('#quiz').hidden = false;
    renderQuestion();
  }
  function renderQuestion(focusPicked) {
    const qs = st.questions, i = st.index, q = qs[i], a = st.answers[i];
    const answered = Object.keys(st.answers).length;
    $('#quiz').innerHTML = `
      <div class="qhead"><p><b>Soal ${i + 1}</b> dari ${qs.length}</p><p>${answered} sudah dijawab</p><button class="link-btn" data-act="restart">Ulangi dari awal</button></div>
      <div class="navi" role="group" aria-label="Pilih nomor soal">${qs.map((_, k) => `<button class="dot ${k === i ? 'now' : ''} ${st.answers[k] !== undefined ? 'filled' : ''}" data-jump="${k}" aria-label="Soal ${k + 1}${st.answers[k] !== undefined ? ', sudah dijawab' : ''}" ${k === i ? 'aria-current="step"' : ''}>${k + 1}</button>`).join('')}</div>
      <article class="qcard">
        <p class="qmeta"><span class="tag">${esc(q.subject)}</span> ${esc(q.topic)}</p>
        <h2 id="qtext">${esc(q.question)}</h2>
        <div class="options" role="radiogroup" aria-labelledby="qtext">${q.options.map((o, k) => `<label class="opt ${a === k ? 'picked' : ''}"><input type="radio" name="ans" value="${k}" ${a === k ? 'checked' : ''}><span class="bubble" aria-hidden="true">${LETTERS[k]}</span><span>${esc(o)}</span></label>`).join('')}</div>
      </article>
      <div class="qactions"><button class="btn" data-act="prev" ${i === 0 ? 'disabled' : ''}>Sebelumnya</button>${i === qs.length - 1 ? '<button class="btn primary" data-act="finish">Lihat pembahasan</button>' : '<button class="btn primary" data-act="next">Berikutnya</button>'}</div>`;
    if (focusPicked) $('.opt input:checked', $('#quiz'))?.focus();
  }
  $('#quiz').addEventListener('change', e => {
    if (e.target.name !== 'ans') return;
    st.answers[st.index] = Number(e.target.value); saveQuiz(); renderQuestion(true);
  });
  $('#quiz').addEventListener('click', e => {
    const j = e.target.closest('[data-jump]');
    if (j) { st.index = Number(j.dataset.jump); saveQuiz(); renderQuestion(); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'prev' && st.index > 0) st.index--;
    else if (act === 'next') st.index++;
    else if (act === 'restart') { if (confirm('Hapus semua jawaban dan mulai dari soal 1?')) { sessionStorage.removeItem(QUIZ_KEY); begin(true); } return; }
    else if (act === 'finish') return finish();
    else return;
    saveQuiz(); renderQuestion(); window.scrollTo(0, 0);
  });
  function finish() {
    const left = st.questions.length - Object.keys(st.answers).length;
    if (left && !confirm(`Masih ada ${left} soal yang belum dijawab. Lihat pembahasan sekarang?`)) return;
    sessionStorage.removeItem(QUIZ_KEY);
    st.onlyWrong = false;
    renderResults();
  }
  function renderResults() {
    const qs = st.questions, ok = i => st.answers[i] === qs[i].answer;
    const score = qs.reduce((n, _, i) => n + (ok(i) ? 1 : 0), 0);
    const subjects = {};
    qs.forEach((q, i) => { (subjects[q.subject] ??= [0, 0])[1]++; if (ok(i)) subjects[q.subject][0]++; });
    const items = qs.map((q, i) => ({ q, i })).filter(({ i }) => !st.onlyWrong || !ok(i));
    $('#quiz').hidden = true; $('#results').hidden = false;
    $('#results').innerHTML = `
      <div class="score"><h2>${score} dari ${qs.length} jawaban tepat</h2><p>Hasil ini hanya menunjukkan pemahamanmu di latihan ini. Pakai pembahasan di bawah untuk melihat apa yang bisa dipelajari berikutnya.</p><div class="row"><button class="btn primary" data-r="retry">Coba lagi</button><a class="btn" href="#library">Buka materi</a></div></div>
      <ul class="bysub">${Object.entries(subjects).map(([s, [c, t]]) => `<li><span>${esc(s)}</span><b>${c}/${t}</b></li>`).join('')}</ul>
      <label class="toggle"><input type="checkbox" id="onlyWrong" ${st.onlyWrong ? 'checked' : ''}> Tampilkan hanya yang perlu dipelajari lagi</label>
      ${items.length ? items.map(({ q, i }) => `<article class="review ${ok(i) ? 'right' : 'wrong'}"><p class="qmeta"><span class="tag">${i + 1}. ${esc(q.subject)}</span> ${esc(q.topic)} <b class="verdict">${st.answers[i] === undefined ? 'Belum dijawab' : ok(i) ? 'Tepat' : 'Perlu dipelajari lagi'}</b></p><h3>${esc(q.question)}</h3><p>Jawaban benar: <b>${LETTERS[q.answer]}. ${esc(q.options[q.answer])}</b></p>${st.answers[i] !== undefined && !ok(i) ? `<p>Jawabanmu: ${LETTERS[st.answers[i]]}. ${esc(q.options[st.answers[i]])}</p>` : ''}<p class="why">${esc(q.explanation)}</p></article>`).join('') : '<div class="empty"><b>Semua jawabanmu tepat</b><p>Tidak ada yang perlu diulang dari latihan ini.</p></div>'}`;
    window.scrollTo(0, 0);
  }
  $('#results').addEventListener('click', e => { if (e.target.closest('[data-r="retry"]')) { sessionStorage.removeItem(QUIZ_KEY); begin(true); window.scrollTo(0, 0); } });
  $('#results').addEventListener('change', e => { if (e.target.id === 'onlyWrong') { st.onlyWrong = e.target.checked; renderResults(); $('#onlyWrong').focus(); } });
  $('#start').addEventListener('click', () => begin(false));

  /* ---------- Mulai ---------- */
  async function init() {
    let failed = false;
    try {
      const [m, q] = await Promise.all([fetch('/api/materials'), fetch('/questions.json')]);
      if (!m.ok || !q.ok) throw new Error('Gagal memuat');
      st.materials = (await m.json()).materials;
      st.questions = await q.json();
    } catch (err) {
      console.error(err);
      failed = true;
      $('#materials').innerHTML = '<div class="empty"><b>Data belum bisa dimuat</b><p>Periksa koneksi internet, lalu muat ulang halaman.</p><button class="btn" onclick="location.reload()">Muat ulang</button></div>';
      $('#start').disabled = true;
    }
    const ids = new Set(st.materials.map(m => m.id));
    st.done = new Set(read(localStorage, DONE_KEY, []).filter(id => ids.has(id)));
    if (read(sessionStorage, QUIZ_KEY, null)?.answers && Object.keys(read(sessionStorage, QUIZ_KEY, {}).answers).length) $('#start').textContent = 'Lanjutkan latihan';
    renderProgress();
    if (!failed) renderLibrary();
    show(location.hash.slice(1));
  }
  init();
})();
