// ===== STATE =====
let books = JSON.parse(localStorage.getItem('lib_books') || '[]');
let members = JSON.parse(localStorage.getItem('lib_members') || '[]');
let records = JSON.parse(localStorage.getItem('lib_records') || '[]');
let activity = JSON.parse(localStorage.getItem('lib_activity') || '[]');

function save() {
  localStorage.setItem('lib_books', JSON.stringify(books));
  localStorage.setItem('lib_members', JSON.stringify(members));
  localStorage.setItem('lib_records', JSON.stringify(records));
  localStorage.setItem('lib_activity', JSON.stringify(activity));
}

// ===== NAVIGATION =====
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('onclick')?.includes(id)) b.classList.add('active');
  });
  if (id === 'borrow') populateBorrowDropdowns();
  if (id === 'records') renderRecords();
  if (id === 'books') renderBooks();
  if (id === 'members') renderMembers();
  if (id === 'dashboard') renderDashboard();
}

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ===== ACTIVITY =====
function logActivity(msg) {
  activity.unshift({ msg, time: new Date().toLocaleString() });
  if (activity.length > 20) activity.pop();
  save();
}

// ===== DASHBOARD =====
function renderDashboard() {
  document.getElementById('stat-books').textContent = books.length;
  document.getElementById('stat-members').textContent = members.length;
  const active = records.filter(r => !r.returned);
  document.getElementById('stat-borrowed').textContent = active.length;
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = active.filter(r => new Date(r.due) < today).length;
  document.getElementById('stat-overdue').textContent = overdue;

  const feed = document.getElementById('activity-feed');
  if (activity.length === 0) {
    feed.innerHTML = '<p class="empty-msg">No activity yet. Start by adding books or members!</p>';
  } else {
    feed.innerHTML = activity.slice(0, 8).map(a =>
      `<div class="activity-item"><div class="dot"></div><div><strong>${a.msg}</strong><br><span style="font-size:.8rem">${a.time}</span></div></div>`
    ).join('');
  }
}

// ===== BOOKS =====
function addBook() {
  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  if (!title || !author) return toast('⚠️ Title and Author are required!');
  const book = {
    id: Date.now(),
    title,
    author,
    genre: document.getElementById('book-genre').value,
    copies: parseInt(document.getElementById('book-copies').value) || 1,
    available: parseInt(document.getElementById('book-copies').value) || 1,
    isbn: document.getElementById('book-isbn').value
  };
  books.push(book);
  save();
  logActivity(`📚 Book added: "${title}" by ${author}`);
  closeModal('add-book-modal');
  ['book-title','book-author','book-isbn'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('book-copies').value = 1;
  renderBooks();
  renderDashboard();
  toast(`✅ "${title}" added!`);
}

function deleteBook(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;
  books = books.filter(x => x.id !== id);
  save();
  logActivity(`🗑️ Book removed: "${b.title}"`);
  renderBooks();
  renderDashboard();
  toast('🗑️ Book deleted');
}

let bookSearch = '';
function searchBooks(q) { bookSearch = q; renderBooks(); }

function renderBooks(list = null) {
  const data = (list || books).filter(b =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.author.toLowerCase().includes(bookSearch.toLowerCase())
  );
  const tbody = document.getElementById('books-tbody');
  document.getElementById('no-books').style.display = data.length ? 'none' : 'block';
  tbody.innerHTML = data.map((b, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${b.title}</strong></td>
      <td>${b.author}</td>
      <td><span class="badge badge-blue">${b.genre}</span></td>
      <td>${b.copies}</td>
      <td>${b.available > 0
        ? `<span class="badge badge-green">Available (${b.available})</span>`
        : `<span class="badge badge-red">All Borrowed</span>`}</td>
      <td><button class="btn-sm btn-del" onclick="deleteBook(${b.id})">Delete</button></td>
    </tr>`).join('');
}

// ===== MEMBERS =====
function addMember() {
  const name = document.getElementById('member-name').value.trim();
  const email = document.getElementById('member-email').value.trim();
  if (!name || !email) return toast('⚠️ Name and Email are required!');
  const member = {
    id: Date.now(), name, email,
    phone: document.getElementById('member-phone').value,
    type: document.getElementById('member-type').value,
    borrowed: 0
  };
  members.push(member);
  save();
  logActivity(`👤 Member added: ${name}`);
  closeModal('add-member-modal');
  ['member-name','member-email','member-phone'].forEach(id => document.getElementById(id).value = '');
  renderMembers();
  renderDashboard();
  toast(`✅ ${name} added!`);
}

function deleteMember(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  members = members.filter(x => x.id !== id);
  save();
  logActivity(`🗑️ Member removed: ${m.name}`);
  renderMembers();
  renderDashboard();
  toast('🗑️ Member deleted');
}

let memberSearch = '';
function searchMembers(q) { memberSearch = q; renderMembers(); }

function renderMembers() {
  const data = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const tbody = document.getElementById('members-tbody');
  document.getElementById('no-members').style.display = data.length ? 'none' : 'block';
  tbody.innerHTML = data.map((m, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.email}</td>
      <td>${m.phone || '—'}</td>
      <td><span class="badge badge-yellow">${m.borrowed || 0}</span></td>
      <td><button class="btn-sm btn-del" onclick="deleteMember(${m.id})">Delete</button></td>
    </tr>`).join('');
}

// ===== BORROW / RETURN =====
function populateBorrowDropdowns() {
  const ms = document.getElementById('borrow-member');
  const bs = document.getElementById('borrow-book');
  const rr = document.getElementById('return-record');

  ms.innerHTML = '<option value="">Select member...</option>' +
    members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  bs.innerHTML = '<option value="">Select book...</option>' +
    books.filter(b => b.available > 0).map(b => `<option value="${b.id}">${b.title} (${b.available} left)</option>`).join('');

  const active = records.filter(r => !r.returned);
  rr.innerHTML = '<option value="">Select record...</option>' +
    active.map(r => {
      const m = members.find(x => x.id === r.memberId);
      const b = books.find(x => x.id === r.bookId);
      return `<option value="${r.id}">${m?.name || '?'} — ${b?.title || '?'}</option>`;
    }).join('');

  rr.onchange = () => {
    const r = records.find(x => x.id === parseInt(rr.value));
    const info = document.getElementById('return-info');
    if (r) {
      const m = members.find(x => x.id === r.memberId);
      const b = books.find(x => x.id === r.bookId);
      const today = new Date(); today.setHours(0,0,0,0);
      const due = new Date(r.due);
      const overdue = due < today;
      info.innerHTML = `<strong>${m?.name}</strong> borrowed <strong>${b?.title}</strong><br>
        Due: ${r.due} ${overdue ? '<span class="badge badge-red">OVERDUE</span>' : '<span class="badge badge-green">On Time</span>'}`;
    } else {
      info.innerHTML = '';
    }
  };
}

function borrowBook() {
  const memberId = parseInt(document.getElementById('borrow-member').value);
  const bookId = parseInt(document.getElementById('borrow-book').value);
  const due = document.getElementById('borrow-due').value;
  if (!memberId || !bookId || !due) return toast('⚠️ Please fill all fields!');

  const book = books.find(b => b.id === bookId);
  const member = members.find(m => m.id === memberId);
  if (!book || book.available < 1) return toast('❌ Book not available!');

  book.available--;
  member.borrowed = (member.borrowed || 0) + 1;

  const record = {
    id: Date.now(),
    memberId, bookId,
    issued: new Date().toISOString().split('T')[0],
    due, returned: null
  };
  records.push(record);
  save();
  logActivity(`🔄 "${book.title}" issued to ${member.name}`);
  populateBorrowDropdowns();
  renderDashboard();
  toast(`✅ "${book.title}" issued to ${member.name}`);
}

function returnBook() {
  const id = parseInt(document.getElementById('return-record').value);
  if (!id) return toast('⚠️ Please select a record!');
  const record = records.find(r => r.id === id);
  if (!record) return;

  record.returned = new Date().toISOString().split('T')[0];
  const book = books.find(b => b.id === record.bookId);
  const member = members.find(m => m.id === record.memberId);
  if (book) book.available++;
  if (member) member.borrowed = Math.max(0, (member.borrowed || 1) - 1);

  save();
  logActivity(`✅ "${book?.title}" returned by ${member?.name}`);
  populateBorrowDropdowns();
  renderDashboard();
  document.getElementById('return-info').innerHTML = '';
  toast(`✅ Book returned successfully!`);
}

// ===== RECORDS =====
function renderRecords() {
  const tbody = document.getElementById('records-tbody');
  document.getElementById('no-records').style.display = records.length ? 'none' : 'block';
  const today = new Date(); today.setHours(0,0,0,0);
  tbody.innerHTML = [...records].reverse().map((r, i) => {
    const m = members.find(x => x.id === r.memberId);
    const b = books.find(x => x.id === r.bookId);
    const due = new Date(r.due);
    let status = r.returned
      ? `<span class="badge badge-green">Returned</span>`
      : due < today
        ? `<span class="badge badge-red">Overdue</span>`
        : `<span class="badge badge-yellow">Active</span>`;
    return `<tr>
      <td>${records.length - i}</td>
      <td>${m?.name || '?'}</td>
      <td>${b?.title || '?'}</td>
      <td>${r.issued}</td>
      <td>${r.due}</td>
      <td>${r.returned || '—'}</td>
      <td>${status}</td>
    </tr>`;
  }).join('');
}

// ===== INIT =====
function init() {
  // Seed demo data if empty
  if (books.length === 0) {
    books = [
      { id: 1, title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', copies: 3, available: 2, isbn: '978-0132350884' },
      { id: 2, title: 'The Pragmatic Programmer', author: 'David Thomas', genre: 'Technology', copies: 2, available: 2, isbn: '978-0135957059' },
      { id: 3, title: 'Introduction to Algorithms', author: 'Thomas Cormen', genre: 'Science', copies: 4, available: 3, isbn: '978-0262033848' },
    ];
  }
  if (members.length === 0) {
    members = [
      { id: 1, name: 'Abebe Girma', email: 'abebe@email.com', phone: '0912345678', type: 'Student', borrowed: 1 },
      { id: 2, name: 'Sara Haile', email: 'sara@email.com', phone: '0987654321', type: 'Teacher', borrowed: 0 },
    ];
  }
  if (records.length === 0) {
    records = [
      { id: 1, memberId: 1, bookId: 1, issued: '2025-01-10', due: '2025-01-24', returned: null },
    ];
    books[0].available = 2;
  }
  if (activity.length === 0) {
    activity = [
      { msg: '📚 Library system initialized', time: new Date().toLocaleString() },
      { msg: '👤 Demo members added', time: new Date().toLocaleString() },
    ];
  }
  save();
  renderDashboard();
  renderBooks();
  renderMembers();
}

init();
