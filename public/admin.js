// admin.js
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginBox = document.getElementById('loginBox');
const adminPanel = document.getElementById('adminPanel');
const loginMsg = document.getElementById('loginMsg');

loginBtn?.addEventListener('click', async ()=>{
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  loginMsg.textContent = 'Logging in...';
  try{
    const res = await fetch('/api/admin/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if(data.ok){
      loginBox.style.display = 'none';
      adminPanel.style.display = 'block';
      loadDashboard();
    } else {
      loginMsg.textContent = data.error || 'Invalid credentials';
    }
  } catch(e){
    loginMsg.textContent = 'Network error';
  }
});

logoutBtn?.addEventListener('click', async ()=>{
  await fetch('/api/admin/logout', { method:'POST' });
  adminPanel.style.display = 'none';
  loginBox.style.display = 'block';
});

async function loadDashboard(){
  // stats
  try {
    const s = await (await fetch('/api/admin/stats')).json();
    if(s.ok) document.getElementById('stats').innerText = `Total contacts: ${s.stats.totalContacts}`;
  } catch(e){
    document.getElementById('stats').innerText = 'Stats error';
  }

  // contacts
  try {
    const contacts = await (await fetch('/api/admin/contacts')).json();
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '';
    contacts.forEach(c=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.phone)}</td><td>${escapeHtml(c.message)}</td><td>${new Date(c.createdAt).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  } catch(e){
    console.error(e);
  }
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}
