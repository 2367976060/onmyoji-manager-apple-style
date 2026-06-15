// ==================== IndexedDB 数据库层 ====================
const DB_NAME = 'OnmyojiManagerDB';
const DB_VERSION = 5;
const STORES = {
    USERS: 'users',
    PENDING_REG: 'pending_registrations',
    ACCOUNTS: 'accounts',
    SERVERS: 'servers',
    SHIKIGAMI: 'shikigami',
    SETTINGS: 'settings',
    RECYCLE: 'recycle',
    GRIND_LOG: 'grind_log',
    OPERATION_LOGS: 'operation_logs'
};
let currentUser = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'username' });
                userStore.createIndex('isAdmin', 'isAdmin', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.PENDING_REG)) {
                db.createObjectStore(STORES.PENDING_REG, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
                const accStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
                accStore.createIndex('userId', 'userId', { unique: false });
                accStore.createIndex('serverId', 'serverId', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.SERVERS)) {
                const srvStore = db.createObjectStore(STORES.SERVERS, { keyPath: 'id' });
                srvStore.createIndex('userId', 'userId', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.SHIKIGAMI)) {
                const shiStore = db.createObjectStore(STORES.SHIKIGAMI, { keyPath: 'id' });
                shiStore.createIndex('userId', 'userId', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'userId' });
            }
            if (!db.objectStoreNames.contains(STORES.RECYCLE)) {
                const recStore = db.createObjectStore(STORES.RECYCLE, { keyPath: 'id' });
                recStore.createIndex('userId', 'userId', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.GRIND_LOG)) {
                const logStore = db.createObjectStore(STORES.GRIND_LOG, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.OPERATION_LOGS)) {
                const opStore = db.createObjectStore(STORES.OPERATION_LOGS, { keyPath: 'id' });
                opStore.createIndex('userId', 'userId', { unique: false });
            }
                logStore.createIndex('userId', 'userId', { unique: false });
            }
        };
    });
}
async function dbAdd(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function dbPut(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function dbGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function dbGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function dbDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function dbGetByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}
async function initAdmin() {
    try {
        const admin = await dbGet(STORES.USERS, '19330711219');
        if (!admin) {
            await dbAdd(STORES.USERS, {
                username: '19330711219',
                password: '147258369Hh',
                isAdmin: true,
                createTime: new Date().toISOString()
            });
        }
    } catch (e) {
        console.error('初始化管理员失败:', e);
    }
}
async function loginUser(username, password) {
    try {
        const user = await dbGet(STORES.USERS, username);
        if (!user) {
            showToast('用户名不存在');
            return false;
        }
        if (user.password !== password) {
            showToast('密码错误');
            return false;
        }
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        await initUserData(user.username);
        return true;
    } catch (e) {
        console.error('登录错误:', e);
        showToast('登录失败');
        return false;
    }
}
async function registerUser(username, password, contact) {
    try {
        const existing = await dbGet(STORES.USERS, username);
        if (existing) {
            showToast('用户名已存在');
            return false;
        }
        const pending = await dbGetAll(STORES.PENDING_REG);
        const exists = pending.find(p => p.username === username);
        if (exists) {
            showToast('该用户名已提交申请');
            return false;
        }
        await dbAdd(STORES.PENDING_REG, {
            id: generateId(),
            username,
            password,
            contact,
            submitTime: new Date().toISOString(),
            status: 'pending'
        });
        return true;
    } catch (e) {
        console.error('注册错误:', e);
        showToast('注册失败');
        return false;
    }
}
function checkAuth() {
    const userStr = sessionStorage.getItem('currentUser');
    const isLoginPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('register.html');
    
    if (userStr) {
        currentUser = JSON.parse(userStr);
        // 已登录用户访问登录/注册页，跳转到首页
        if (isLoginPage) {
            window.location.href = 'index.html';
        }
        return true;
    } else {
        // 未登录用户访问非登录/注册页，跳转到登录页
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
        return false;
    }
}
function logout() {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'login.html';
}
async function getPendingRegistrations() {
    return await dbGetAll(STORES.PENDING_REG);
}
async function approveRegistration(regId, approve) {
    try {
        const pending = await dbGet(STORES.PENDING_REG, regId);
        if (!pending) {
            showToast('申请记录不存在');
            return false;
        }
        if (approve) {
            const existing = await dbGet(STORES.USERS, pending.username);
            if (existing) {
                showToast('用户名已存在');
                await dbDelete(STORES.PENDING_REG, regId);
                return false;
            }
            await dbAdd(STORES.USERS, {
                username: pending.username,
                password: pending.password,
                isAdmin: false,
                createTime: new Date().toISOString()
            });
            const created = await dbGet(STORES.USERS, pending.username);
            if (!created) {
                showToast('用户创建失败，请重试');
                return false;
            }
            await initUserData(pending.username);
        }
        await dbDelete(STORES.PENDING_REG, regId);
        return true;
    } catch (e) {
        console.error('审批错误:', e);
        showToast('审批失败');
        return false;
    }
}
const DEFAULT_SHIKIGAMI = [];
const DEFAULT_SERVERS = [];
async function initUserData(userId) {
    try {
        const settings = await dbGet(STORES.SETTINGS, userId);
        if (settings) return;
        await dbAdd(STORES.SETTINGS, {
            userId,
            defaultPassword: '147258369Hh',
            phoneList: []
        });
    } catch (e) {
        console.error('初始化用户数据失败:', e);
    }
}
    }
}
async function getData(storeName) {
    if (!currentUser) return [];
    return await dbGetByIndex(storeName, 'userId', currentUser.username);
}
async function setData(storeName, data) {
    const oldData = await getData(storeName);
    for (const item of oldData) {
        await dbDelete(storeName, item.id);
    }
    for (const item of data) {
        item.userId = currentUser.username;
        await dbAdd(storeName, item);
    }
}
async function getSettings() {
    if (!currentUser) return {};
    const settings = await dbGet(STORES.SETTINGS, currentUser.username);
    return settings || { defaultPassword: '147258369Hh', phoneList: [] };
}
async function saveSettings(settings) {
    if (!currentUser) return;
    settings.userId = currentUser.username;
    await dbPut(STORES.SETTINGS, settings);
}
let selectedServerId = '';
let actionSheetServerId = '';
let viewMode = localStorage.getItem('account_view_mode') || 'list';
let newShikigamiIconData = '';
let editShikigamiIconData = '';
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}
function openActionSheet(serverId) {
    actionSheetServerId = serverId;
    const sheet = document.getElementById('serverActionSheet');
    if (sheet) sheet.classList.add('active');
}
function closeActionSheet() {
    const sheet = document.getElementById('serverActionSheet');
    if (sheet) sheet.classList.remove('active');
}
function editServerFromSheet() {
    closeActionSheet();
    editServer(actionSheetServerId);
}
function deleteServerFromSheet() {
    closeActionSheet();
    deleteServer(actionSheetServerId);
}
function navigateTo(page) {
    const pages = {
        'home': 'index.html',
        'accounts': 'servers.html',
        'grind': 'grinding.html',
        'sales': 'sales.html',
        'settings': 'settings.html'
    };
    window.location.href = pages[page];
}
function enterServer(id) {
    window.location.href = 'accounts.html?serverId=' + id;
}
function backToServerList() {
    window.location.href = 'servers.html';
}
function setViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('account_view_mode', mode);
    const listBtn = document.getElementById('viewListBtn');
    const gridBtn = document.getElementById('viewGridBtn');
    if (listBtn) listBtn.classList.toggle('active', mode === 'list');
    if (gridBtn) gridBtn.classList.toggle('active', mode === 'grid');
    filterAccounts();
}
async function renderHome() {
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => !a.isSold);
    const servers = await getData(STORES.SERVERS);
    const today = new Date().toDateString();
    const grindLog = (await getData(STORES.GRIND_LOG)).filter(g => new Date(g.date).toDateString() === today);
    
    const statTotal = document.getElementById('statTotal');
    const statTodo = document.getElementById('statTodo');
    const statLevel40 = document.getElementById('statLevel40');
    const statUnder40 = document.getElementById('statUnder40');
    
    if (statTotal) statTotal.textContent = accounts.length;
    if (statTodo) statTodo.textContent = accounts.filter(a => a.level < 40 && !grindLog.map(g => g.accountId).includes(a.id)).length;
    if (statLevel40) statLevel40.textContent = accounts.filter(a => a.level >= 40).length;
    if (statUnder40) statUnder40.textContent = grindLog.length;
    
    const serverStats = {};
    accounts.forEach(a => {
        if (a.level >= 40) {
            serverStats[a.serverId] = (serverStats[a.serverId] || 0) + 1;
        }
    });
    const sortedServers = Object.entries(serverStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    const rankClasses = ['gold', 'silver', 'bronze'];
    const rankList = document.getElementById('serverRankList');
    if (rankList) {
        rankList.innerHTML = sortedServers.length ? 
            sortedServers.map(([serverId, count], i) => {
                const server = servers.find(s => s.id === serverId);
                return `
                    <div class="rank-item">
                        <div class="rank-info">
                            <span class="rank-num ${rankClasses[i]}">${i+1}</span>
                            <span class="rank-name">${server ? server.name : '未知区服'}</span>
                        </div>
                        <span class="rank-count">${count}个</span>
                    </div>
                `;
            }).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无数据</div>';
    }
    
    const shikigami = (await getData(STORES.SHIKIGAMI)).slice(0, 8);
    const shikigamiQuick = document.getElementById('shikigamiQuick');
    if (shikigamiQuick) {
        shikigamiQuick.innerHTML = shikigami.map(s => `
            <div class="shikigami-item" onclick="showShikigamiAccounts('${s.name}')">
                <div class="shikigami-icon" style="width:56px;height:56px;font-size:22px;">
                    ${s.icon ? `<img src="${s.icon}">` : s.name.charAt(0)}
                </div>
                <div class="shikigami-name">${s.name}</div>
            </div>
        `).join('');
    }
}
async function showGrindDetail() {
    const today = new Date().toDateString();
    const grindLog = (await getData(STORES.GRIND_LOG)).filter(g => new Date(g.date).toDateString() === today);
    const accounts = await getData(STORES.ACCOUNTS);
    
    const detailList = document.getElementById('grindDetailList');
    if (!detailList) return;
    
    if (grindLog.length === 0) {
        detailList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">今日暂无刷号记录</div>
            </div>
        `;
    } else {
        detailList.innerHTML = grindLog.map(g => {
            const account = accounts.find(a => a.id === g.accountId);
            if (!account) return '';
            const time = new Date(g.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            const prevLevel = g.type === 'levelup' ? account.level - 1 : account.level;
            
            return `
                <div class="grind-detail-item">
                    <div class="grind-detail-account">${account.account}</div>
                    <div class="grind-detail-info">
                        <span>区服</span>
                        <div class="grind-detail-level">
                            <span>Lv.${prevLevel}</span>
                            ${g.type === 'levelup' ? '<span class="grind-detail-level-arrow">→</span><span style="color:var(--ios-green);font-weight:700;">Lv.' + account.level + '</span>' : ''}
                        </div>
                        <span>${time}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    openModal('grindDetailModal');
}
async function showShikigamiAccounts(name) {
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => 
        !a.isSold && a.shikigami && a.shikigami.includes(name)
    );
    const title = document.getElementById('shikigamiAccountsTitle');
    const list = document.getElementById('shikigamiAccountsList');
    if (title) title.textContent = `拥有【${name}】的账号 (${accounts.length}个)`;
    if (list) {
        list.innerHTML = accounts.length ?
            accounts.map(a => `
                <div class="ios-item" onclick="locateAccount('${a.serverId}', '${a.id}')">
                    <div class="ios-item-content">
                        <div class="ios-item-title">${a.account}</div>
                        <div class="ios-item-subtitle">区服 · Lv.${a.level}</div>
                    </div>
                    <span class="ios-item-arrow">›</span>
                </div>
            `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无账号</div>';
    }
    openModal('shikigamiAccountsModal');
}
function locateAccount(serverId, accountId) {
    closeModal('shikigamiAccountsModal');
    window.location.href = 'accounts.html?serverId=' + serverId;
}
async function renderServerList() {
    const servers = await getData(STORES.SERVERS);
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => !a.isSold);
    
    const serverList = document.getElementById('serverList');
    if (!serverList) return;
    
    serverList.innerHTML = servers.map(s => {
        const count = accounts.filter(a => a.serverId === s.id).length;
        return `
            <div class="ios-item" onclick="enterServer('${s.id}')">
                <div class="ios-item-content">
                    <div class="ios-item-title">${s.name}</div>
                    <div class="ios-item-subtitle">${s.openTime || '未设置开服时间'}</div>
                </div>
                <span class="ios-item-value">${count}个账号</span>
                <button class="ios-more-btn" onclick="event.stopPropagation();openActionSheet('${s.id}')">⋯</button>
                <span class="ios-item-arrow">›</span>
            </div>
        `;
    }).join('');
}
async function deleteServer(id) {
    if (!confirm('删除区服将同时删除该服下所有账号，确定继续？')) return;
    const servers = (await getData(STORES.SERVERS)).filter(s => s.id !== id);
    await setData(STORES.SERVERS, servers);
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => a.serverId !== id);
    await setData(STORES.ACCOUNTS, accounts);
    renderServerList();
    renderHome();
    showToast('已删除区服及相关账号');
}
async function openAddServerModal() {
    document.getElementById('serverModalTitle').textContent = '添加区服';
    document.getElementById('serverForm').reset();
    document.getElementById('editServerId').value = '';
    openModal('serverModal');
}
async function editServer(id) {
    const servers = await getData(STORES.SERVERS);
    const server = servers.find(s => s.id === id);
    if (!server) return;
    document.getElementById('serverModalTitle').textContent = '编辑区服';
    document.getElementById('editServerId').value = id;
    document.getElementById('serverName').value = server.name;
    document.getElementById('serverOpenTime').value = server.openTime || '';
    openModal('serverModal');
}
async function saveServer(e) {
    e.preventDefault();
    const id = document.getElementById('editServerId').value;
    const serverData = {
        name: document.getElementById('serverName').value.trim(),
        openTime: document.getElementById('serverOpenTime').value
    };
    const servers = await getData(STORES.SERVERS);
    if (id) {
        const index = servers.findIndex(s => s.id === id);
        if (index !== -1) servers[index] = { ...servers[index], ...serverData };
    } else {
        servers.push({ id: generateId(), ...serverData, sort: servers.length });
    }
    await setData(STORES.SERVERS, servers);
    closeModal('serverModal');
    renderServerList();
    showToast(id ? '已更新' : '已添加');
}
async function filterAccounts() {
    const search = document.getElementById('accountSearch')?.value.toLowerCase() || '';
    let accounts = (await getData(STORES.ACCOUNTS)).filter(a => !a.isSold && a.serverId === selectedServerId);
    const shikigamiList = await getData(STORES.SHIKIGAMI);
    
    if (search) {
        accounts = accounts.filter(a => 
            a.account.toLowerCase().includes(search) ||
            (a.shikigami && a.shikigami.some(s => s.toLowerCase().includes(search)))
        );
    }
    
    const container = document.getElementById('accountList');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <div class="empty-text">暂无账号</div>
            </div>
        `;
        return;
    }
    
    function renderShikigamiIcons(accountShikigami) {
        if (!accountShikigami || accountShikigami.length === 0) return '';
        const showCount = Math.min(accountShikigami.length, 4);
        const moreCount = accountShikigami.length - showCount;
        let icons = '';
        for (let i = 0; i < showCount; i++) {
            const sName = accountShikigami[i];
            const sData = shikigamiList.find(s => s.name === sName);
            const icon = sData && sData.icon ? `<img src="${sData.icon}">` : sName.charAt(0);
            icons += `<div class="account-shikigami-icon" style="width:56px;height:56px;font-size:20px;">${icon}</div>`;
        }
        if (moreCount > 0) {
            icons += `<div class="account-shikigami-more" style="width:56px;height:56px;font-size:16px;">+${moreCount}</div>`;
        }
        return `<div class="account-shikigami-icons" style="margin-bottom:12px;">${icons}</div>`;
    }
    
    if (viewMode === 'list') {
        container.innerHTML = accounts.map(a => `
            <div class="account-card" data-id="${a.id}">
                ${renderShikigamiIcons(a.shikigami)}
                <div class="account-header" style="flex-direction:column;gap:12px;">
                    <div class="account-info" style="width:100%;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div class="account-name">${a.account}</div>
                            <div class="account-meta">${a.phone || '未绑定手机'}</div>
                        </div>
                        <span class="account-level ${a.level >= 40 ? 'green' : 'red'}">Lv.${a.level}</span>
                    </div>
                </div>
                <div class="account-actions">
                    <button class="ios-btn ios-btn-gray ios-btn-sm" onclick="copyAccountInfo('${a.id}')">复制</button>
                    <button class="ios-btn ios-btn-gray ios-btn-sm" onclick="editAccount('${a.id}')">编辑</button>
                    <button class="ios-btn ios-btn-success ios-btn-sm" onclick="openSellModal('${a.id}')">已售</button>
                    <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="deleteAccount('${a.id}')">删除</button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="account-grid">' + accounts.map(a => `
            <div class="account-grid-card" data-id="${a.id}">
                ${renderShikigamiIcons(a.shikigami)}
                <div class="account-grid-header">
                    <div style="flex:1;">
                        <div class="account-grid-name">${a.account.substring(0, 12)}${a.account.length > 12 ? '...' : ''}</div>
                        <div class="account-grid-meta">${a.phone ? a.phone.substring(0, 7) + '...' : '无手机'}</div>
                    </div>
                    <span class="account-level ${a.level >= 40 ? 'green' : 'red'}" style="font-size:11px;padding:3px 8px;">Lv.${a.level}</span>
                </div>
                <div class="account-grid-actions">
                    <button class="ios-btn ios-btn-gray ios-btn-sm" onclick="copyAccountInfo('${a.id}')">复制</button>
                    <button class="ios-btn ios-btn-gray ios-btn-sm" onclick="editAccount('${a.id}')">编辑</button>
                    <button class="ios-btn ios-btn-success ios-btn-sm" onclick="openSellModal('${a.id}')">已售</button>
                    <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="deleteAccount('${a.id}')">删除</button>
                </div>
            </div>
        `).join('') + '</div>';
    }
}
async function copyAccountInfo(id) {
    const accounts = await getData(STORES.ACCOUNTS);
    const account = accounts.find(a => a.id === id);
    if (account) {
        const text = `账号：${account.account}\n密码：${account.password}\n等级：${account.level}`;
        navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
    }
}
async function openAddAccountModal() {
    document.getElementById('accountModalTitle').textContent = '添加账号';
    document.getElementById('accountForm').reset();
    document.getElementById('editAccountId').value = '';
    document.getElementById('accountPhoneManual').style.display = 'none';
    const settings = await getSettings();
    document.getElementById('accountPassword').value = settings.defaultPassword || '';
    const phoneSelect = document.getElementById('accountPhone');
    phoneSelect.innerHTML = '<option value="">选择手机号</option><option value="__manual__">手动输入</option>';
    (settings.phoneList || []).forEach(phone => {
        phoneSelect.innerHTML += `<option value="${phone}">${phone}</option>`;
    });
    openModal('accountModal');
}
function checkPhoneManual() {
    const select = document.getElementById('accountPhone');
    const manualInput = document.getElementById('accountPhoneManual');
    manualInput.style.display = select.value === '__manual__' ? 'block' : 'none';
}
async function editAccount(id) {
    const accounts = await getData(STORES.ACCOUNTS);
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    document.getElementById('accountModalTitle').textContent = '编辑账号';
    document.getElementById('editAccountId').value = id;
    document.getElementById('accountName').value = account.account.replace('@163.com', '');
    document.getElementById('accountPassword').value = account.password;
    document.getElementById('accountLevel').value = account.level;
    document.getElementById('accountShikigami').value = account.shikigami ? account.shikigami.join(',') : '';
    document.getElementById('accountRemark').value = account.remark || '';
    const settings = await getSettings();
    const phoneSelect = document.getElementById('accountPhone');
    phoneSelect.innerHTML = '<option value="">选择手机号</option><option value="__manual__">手动输入</option>';
    (settings.phoneList || []).forEach(phone => {
        phoneSelect.innerHTML += `<option value="${phone}" ${phone === account.phone ? 'selected' : ''}>${phone}</option>`;
    });
    if (account.phone && !settings.phoneList?.includes(account.phone)) {
        phoneSelect.value = '__manual__';
        document.getElementById('accountPhoneManual').value = account.phone;
        document.getElementById('accountPhoneManual').style.display = 'block';
    } else {
        document.getElementById('accountPhoneManual').style.display = 'none';
    }
    openModal('accountModal');
}
async function saveAccount(e) {
    e.preventDefault();
    const id = document.getElementById('editAccountId').value;
    let accountName = document.getElementById('accountName').value.trim();
    if (!accountName.includes('@')) accountName += '@163.com';
    let phone = document.getElementById('accountPhone').value;
    if (phone === '__manual__') phone = document.getElementById('accountPhoneManual').value;
    const accountData = {
        serverId: document.getElementById('currentServerId').value,
        account: accountName,
        password: document.getElementById('accountPassword').value,
        level: parseInt(document.getElementById('accountLevel').value) || 1,
        phone: phone,
        shikigami: document.getElementById('accountShikigami').value.split(',').map(s => s.trim()).filter(s => s),
        remark: document.getElementById('accountRemark').value,
        updateTime: new Date().toISOString()
    };
    const accounts = await getData(STORES.ACCOUNTS);
    if (id) {
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) accounts[index] = { ...accounts[index], ...accountData };
    } else {
        accounts.push({
            id: generateId(),
            ...accountData,
            isSold: false,
            images: [],
            createTime: new Date().toISOString()
        });
    }
    await setData(STORES.ACCOUNTS, accounts);
    closeModal('accountModal');
    filterAccounts();
    renderHome();
    showToast(id ? '已更新' : '已添加');
}
async function openSellModal(id) {
    document.getElementById('sellAccountId').value = id;
    document.getElementById('sellPrice').value = '';
    openModal('sellModal');
}
async function saveSell(e) {
    e.preventDefault();
    const id = document.getElementById('sellAccountId').value;
    const price = parseFloat(document.getElementById('sellPrice').value);
    const accounts = await getData(STORES.ACCOUNTS);
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
        accounts[index].isSold = true;
        accounts[index].soldPrice = price;
        accounts[index].soldTime = new Date().toISOString();
        await setData(STORES.ACCOUNTS, accounts);
    }
    closeModal('sellModal');
    filterAccounts();
    renderHome();
    renderSales();
    showToast('已标记为已售');
}
async function deleteAccount(id) {
    if (!confirm('确定要删除此账号吗？将移至回收站')) return;
    const accounts = await getData(STORES.ACCOUNTS);
    const account = accounts.find(a => a.id === id);
    if (account) {
        const recycle = await getData(STORES.RECYCLE);
        recycle.push({ ...account, deleteTime: new Date().toISOString() });
        await setData(STORES.RECYCLE, recycle);
        await setData(STORES.ACCOUNTS, accounts.filter(a => a.id !== id));
        filterAccounts();
        renderHome();
        showToast('已移至回收站');
    }
}
async function renderGrind() {
    const today = new Date().toDateString();
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => !a.isSold && a.level < 40);
    const grindLog = (await getData(STORES.GRIND_LOG)).filter(g => new Date(g.date).toDateString() === today);
    const grindedIds = grindLog.map(g => g.accountId);
    const pendingAccounts = accounts.filter(a => !grindedIds.includes(a.id));
    
    const grindTodo = document.getElementById('grindTodo');
    const grindDone = document.getElementById('grindDone');
    if (grindTodo) grindTodo.textContent = pendingAccounts.length;
    if (grindDone) grindDone.textContent = grindLog.length;
    
    const container = document.getElementById('grindList');
    if (!container) return;
    
    if (pendingAccounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <div class="empty-text">今日刷号任务已完成！</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingAccounts.map(a => {
        const progress = Math.min((a.level / 40) * 100, 100);
        return `
            <div class="grind-card">
                <div class="grind-header">
                    <div class="grind-info">
                        <div class="grind-name">${a.account}</div>
                    </div>
                </div>
                <div class="grind-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${a.level}/40</span>
                </div>
                <div class="grind-actions">
                    <button class="ios-btn ios-btn-orange ios-btn-sm" onclick="levelUp('${a.id}')">+1级</button>
                    <button class="ios-btn ios-btn-success ios-btn-sm" onclick="markDone('${a.id}')">今日完成</button>
                </div>
            </div>
        `;
    }).join('');
}
async function levelUp(id) {
    const accounts = await getData(STORES.ACCOUNTS);
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
        accounts[index].level = Math.min(accounts[index].level + 1, 60);
        accounts[index].updateTime = new Date().toISOString();
        await setData(STORES.ACCOUNTS, accounts);
        const grindLog = await getData(STORES.GRIND_LOG);
        grindLog.push({ id: generateId(), accountId: id, date: new Date().toISOString(), type: 'levelup' });
        await setData(STORES.GRIND_LOG, grindLog);
    }
    renderGrind();
    renderHome();
    showToast('等级+1');
}
async function markDone(id) {
    const grindLog = await getData(STORES.GRIND_LOG);
    grindLog.push({ id: generateId(), accountId: id, date: new Date().toISOString(), type: 'done' });
    await setData(STORES.GRIND_LOG, grindLog);
    renderGrind();
    renderHome();
    showToast('已标记今日完成');
}
async function renderSales() {
    const accounts = (await getData(STORES.ACCOUNTS)).filter(a => a.isSold);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todaySales = accounts.filter(a => new Date(a.soldTime) >= today);
    const monthSales = accounts.filter(a => new Date(a.soldTime) >= monthStart);
    
    const saleToday = document.getElementById('saleToday');
    const saleMonth = document.getElementById('saleMonth');
    const saleTotal = document.getElementById('saleTotal');
    if (saleToday) saleToday.textContent = '¥' + todaySales.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
    if (saleMonth) saleMonth.textContent = '¥' + monthSales.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
    if (saleTotal) saleTotal.textContent = '¥' + accounts.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
    
    accounts.sort((a, b) => new Date(b.soldTime) - new Date(a.soldTime));
    const saleList = document.getElementById('saleList');
    if (saleList) {
        saleList.innerHTML = accounts.length ?
            accounts.map(a => `
                <div class="ios-item">
                    <div class="ios-item-content">
                        <div class="ios-item-title">${a.account}</div>
                        <div class="ios-item-subtitle">${new Date(a.soldTime).toLocaleDateString()}</div>
                    </div>
                    <span class="ios-item-value" style="color: var(--ios-green); font-weight: 700;">¥${a.soldPrice || 0}</span>
                </div>
            `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无销售记录</div>';
    }
}
function exportSales(format) {
    showToast('导出功能开发中');
}
async function openDefaultSettings() {
    const settings = await getSettings();
    document.getElementById('defaultPassword').value = settings.defaultPassword || '';
    document.getElementById('phoneList').value = (settings.phoneList || []).join('\n');
    openModal('defaultModal');
}
async function saveDefaultSettings(e) {
    e.preventDefault();
    const settings = await getSettings();
    settings.defaultPassword = document.getElementById('defaultPassword').value;
    settings.phoneList = document.getElementById('phoneList').value.split('\n').map(p => p.trim()).filter(p => p);
    await saveSettings(settings);
    closeModal('defaultModal');
    showToast('已保存');
}
async function openShikigamiManage() {
    renderShikigamiManageList();
    newShikigamiIconData = '';
    openModal('shikigamiModal');
}
async function renderShikigamiManageList() {
    const shikigami = await getData(STORES.SHIKIGAMI);
    const list = document.getElementById('shikigamiManageList');
    const addForm = document.getElementById('shikigamiAddForm');
    
    // 所有用户都可以添加式神
    if (addForm) {
        addForm.style.display = 'block';
    }
    
    if (list) {
        list.innerHTML = shikigami.map(s => `
            <div class="ios-item">
                <div class="ios-item-content" style="display:flex;align-items:center;gap:14px;">
                    <div class="shikigami-icon" style="width:56px;height:56px;font-size:22px;">
                        ${s.icon ? `<img src="${s.icon}">` : s.name.charAt(0)}
                    </div>
                    <span>${s.name}</span>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="ios-btn ios-btn-primary ios-btn-sm" onclick="openEditShikigami('${s.id}')">编辑</button>
                    <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="deleteShikigami('${s.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }
}
function previewNewIcon(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        newShikigamiIconData = e.target.result;
        const preview = document.getElementById('newShikigamiIconPreview');
        if (preview) {
            preview.src = newShikigamiIconData;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}
function previewEditIcon(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        editShikigamiIconData = e.target.result;
        const preview = document.getElementById('editShikigamiIconPreview');
        if (preview) preview.src = editShikigamiIconData;
    };
    reader.readAsDataURL(file);
}
async function addShikigami() {
    const nameInput = document.getElementById('newShikigamiName');
    const name = nameInput?.value.trim();
    if (!name) return;
    const shikigami = await getData(STORES.SHIKIGAMI);
    shikigami.push({ id: generateId(), name, icon: newShikigamiIconData });
    await setData(STORES.SHIKIGAMI, shikigami);
    if (nameInput) nameInput.value = '';
    newShikigamiIconData = '';
    renderShikigamiManageList();
    renderHome();
    showToast('已添加');
    await logOperation('add_shikigami', '添加式神: ' + name);
}
async function openEditShikigami(id) {
    const shikigami = await getData(STORES.SHIKIGAMI);
    const s = shikigami.find(item => item.id === id);
    if (!s) return;
    document.getElementById('editShikigamiId').value = id;
    document.getElementById('editShikigamiName').value = s.name;
    editShikigamiIconData = s.icon || '';
    openModal('editShikigamiModal');
}
async function saveEditShikigami(e) {
    e.preventDefault();
    const id = document.getElementById('editShikigamiId').value;
    const shikigami = await getData(STORES.SHIKIGAMI);
    const index = shikigami.findIndex(s => s.id === id);
    if (index !== -1) {
        shikigami[index].name = document.getElementById('editShikigamiName').value;
        if (editShikigamiIconData) {
            shikigami[index].icon = editShikigamiIconData;
        }
        await setData(STORES.SHIKIGAMI, shikigami);
    }
    closeModal('editShikigamiModal');
    renderShikigamiManageList();
    renderHome();
    showToast('已更新');
}
async function deleteShikigami(id) {
    if (!confirm('确定删除此式神吗？')) return;
    const shikigami = (await getData(STORES.SHIKIGAMI)).filter(s => s.id !== id);
    await setData(STORES.SHIKIGAMI, shikigami);
    renderShikigamiManageList();
    renderHome();
    showToast('已删除');
}
async function openRecycleBin() {
    renderRecycleList();
    openModal('recycleModal');
}
async function renderRecycleList() {
    const recycle = await getData(STORES.RECYCLE);
    const list = document.getElementById('recycleList');
    if (list) {
        list.innerHTML = recycle.length ?
            recycle.map(a => `
                <div class="ios-item">
                    <div class="ios-item-content">
                        <div class="ios-item-title">${a.account}</div>
                        <div class="ios-item-subtitle">删除于 ${new Date(a.deleteTime).toLocaleDateString()}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="ios-btn ios-btn-success ios-btn-sm" onclick="restoreAccount('${a.id}')">恢复</button>
                        <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="permanentDelete('${a.id}')">删除</button>
                    </div>
                </div>
            `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">回收站为空</div>';
    }
}
async function restoreAccount(id) {
    const recycle = await getData(STORES.RECYCLE);
    const account = recycle.find(a => a.id === id);
    if (account) {
        const accounts = await getData(STORES.ACCOUNTS);
        delete account.deleteTime;
        accounts.push(account);
        await setData(STORES.ACCOUNTS, accounts);
        await setData(STORES.RECYCLE, recycle.filter(a => a.id !== id));
        renderRecycleList();
        renderHome();
        showToast('已恢复');
    }
}
async function permanentDelete(id) {
    if (!confirm('确定永久删除吗？此操作不可恢复！')) return;
    const recycle = (await getData(STORES.RECYCLE)).filter(a => a.id !== id);
    await setData(STORES.RECYCLE, recycle);
    renderRecycleList();
    showToast('已永久删除');
}
function exportData() {
    showToast('导出功能开发中');
}
function importData(event) {
    showToast('导入功能开发中');
}
function clearAllData() {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
    showToast('清空功能开发中');
}

// ==================== 管理员用户管理功能 ====================

async function adminAddUser(username, password, isAdmin) {
    try {
        const existing = await dbGet(STORES.USERS, username);
        if (existing) {
            showToast('用户名已存在');
            return false;
        }
        await dbAdd(STORES.USERS, {
            username,
            password,
            isAdmin: isAdmin || false,
            createTime: new Date().toISOString()
        });
        const created = await dbGet(STORES.USERS, username);
        if (!created) {
            showToast('用户创建失败，请重试');
            return false;
        }
        await initUserData(username);
        showToast('用户创建成功');
        return true;
    } catch (e) {
        console.error('创建用户错误:', e);
        showToast('创建用户失败');
        return false;
    }
}
async function getAllUsers() {
    return await dbGetAll(STORES.USERS);
}
async function adminChangeRole(username, isAdmin) {
    try {
        const user = await dbGet(STORES.USERS, username);
        if (!user) {
            showToast('用户不存在');
            return false;
        }
        user.isAdmin = isAdmin;
        await dbPut(STORES.USERS, user);
        showToast('权限修改成功');
        return true;
    } catch (e) {
        console.error('修改权限错误:', e);
        showToast('修改权限失败');
        return false;
    }
}
async function adminResetPassword(username, newPassword) {
    try {
        const user = await dbGet(STORES.USERS, username);
        if (!user) {
            showToast('用户不存在');
            return false;
        }
        user.password = newPassword;
        await dbPut(STORES.USERS, user);
        showToast('密码重置成功');
        return true;
    } catch (e) {
        console.error('重置密码错误:', e);
        showToast('重置密码失败');
        return false;
    }
}
async function adminDeleteUser(username) {
    if (!confirm('确定要删除用户 ' + username + ' 吗？此操作不可恢复！')) {
        return false;
    }
    try {
        await dbDelete(STORES.USERS, username);
        const stores = [STORES.ACCOUNTS, STORES.SERVERS, STORES.SHIKIGAMI, STORES.SETTINGS, STORES.RECYCLE, STORES.GRIND_LOG];
        for (const store of stores) {
            const userData = await dbGetByIndex(store, 'userId', username);
            for (const item of userData) {
                await dbDelete(store, item.id);
            }
        }
        showToast('用户删除成功');
        return true;
    } catch (e) {
        console.error('删除用户错误:', e);
        showToast('删除用户失败');
        return false;
    }
}
function openAddUserModal() {
    document.getElementById('addUserForm').reset();
    openModal('addUserModal');
}
async function openUserManageModal() {
    await renderUserManageList();
    openModal('userManageModal');
}
async function renderUserManageList() {
    const users = await getAllUsers();
    const container = document.getElementById('userManageList');
    if (!container) return;
    
    container.innerHTML = users.map(u => {
        const roleText = u.isAdmin ? '<span style="color:var(--ios-orange);font-weight:600;">管理员</span>' : '普通用户';
        const roleBtnText = u.isAdmin ? '降为用户' : '设为管理员';
        return `
            <div class="ios-item">
                <div class="ios-item-content">
                    <div class="ios-item-title">${u.username}</div>
                    <div class="ios-item-subtitle">
                        ${roleText} · 注册于 ${new Date(u.createTime).toLocaleDateString()}
                    </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="ios-btn ios-btn-primary ios-btn-sm" onclick="toggleUserRole('${u.username}', ${!u.isAdmin})">
                        ${roleBtnText}
                    </button>
                    <button class="ios-btn ios-btn-gray ios-btn-sm" onclick="openResetPasswordModal('${u.username}')">重置密码</button>
                    <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="deleteUserConfirm('${u.username}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}
async function toggleUserRole(username, isAdmin) {
    const success = await adminChangeRole(username, isAdmin);
    if (success) {
        await renderUserManageList();
    }
}
function openResetPasswordModal(username) {
    document.getElementById('resetUsername').value = username;
    document.getElementById('resetNewPassword').value = '';
    openModal('resetPasswordModal');
}
async function deleteUserConfirm(username) {
    const success = await adminDeleteUser(username);
    if (success) {
        await renderUserManageList();
    }
}
async function openApprovalModal() {
    await renderApprovalList();
    openModal('approvalModal');
}
async function renderApprovalList() {
    const pending = await getPendingRegistrations();
    const container = document.getElementById('approvalList');
    if (!container) return;
    
    container.innerHTML = pending.length ?
        pending.map(p => `
            <div class="ios-item">
                <div class="ios-item-content">
                    <div class="ios-item-title">${p.username}</div>
                    <div class="ios-item-subtitle">
                        申请时间：${new Date(p.submitTime).toLocaleString()}
                        ${p.contact ? ' | 联系：' + p.contact : ''}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="ios-btn ios-btn-success ios-btn-sm" onclick="approveReg('${p.id}', true)">同意</button>
                    <button class="ios-btn ios-btn-danger ios-btn-sm" onclick="approveReg('${p.id}', false)">驳回</button>
                </div>
            </div>
        `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无待审批申请</div>';
}
async function approveReg(id, approve) {
    const msg = approve ? '确定通过此注册申请吗？' : '确定驳回此注册申请吗？';
    if (!confirm(msg)) return;
    await approveRegistration(id, approve);
    await renderApprovalList();
    showToast(approve ? '已通过' : '已驳回');
}

(async function() {
    await initAdmin();
})();

document.addEventListener('DOMContentLoaded', function() {
    const serverForm = document.getElementById('serverForm');
    if (serverForm) serverForm.addEventListener('submit', saveServer);
    const accountForm = document.getElementById('accountForm');
    if (accountForm) accountForm.addEventListener('submit', saveAccount);
    const sellForm = document.getElementById('sellForm');
    if (sellForm) sellForm.addEventListener('submit', saveSell);
    const defaultForm = document.getElementById('defaultForm');
    if (defaultForm) defaultForm.addEventListener('submit', saveDefaultSettings);
    const editShikigamiForm = document.getElementById('editShikigamiForm');
    if (editShikigamiForm) editShikigamiForm.addEventListener('submit', saveEditShikigami);
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('newUserUsername').value.trim();
            const password = document.getElementById('newUserPassword').value;
            const password2 = document.getElementById('newUserPassword2').value;
            const role = document.getElementById('newUserRole').value;
            
            if (password !== password2) {
                showToast('两次输入的密码不一致');
                return;
            }
            if (password.length < 6) {
                showToast('密码长度至少6位');
                return;
            }
            
            const success = await adminAddUser(username, password, role === 'admin');
            if (success) {
                closeModal('addUserModal');
                addUserForm.reset();
            }
        });
    }
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('resetUsername').value;
            const newPassword = document.getElementById('resetNewPassword').value;
            
            if (newPassword.length < 6) {
                showToast('密码长度至少6位');
                return;
            }
            
            const success = await adminResetPassword(username, newPassword);
            if (success) {
                closeModal('resetPasswordModal');
                resetPasswordForm.reset();
                await renderUserManageList();
            }
        });
    }
    
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path === '') {
        checkAuth();
        renderHome();
    } else if (path.includes('servers.html')) {
        checkAuth();
        renderServerList();
    } else if (path.includes('accounts.html')) {
        checkAuth();
        const urlParams = new URLSearchParams(window.location.search);
        const serverId = urlParams.get('serverId');
        if (serverId) {
            selectedServerId = serverId;
            document.getElementById('currentServerId').value = serverId;
            filterAccounts();
        }
        const savedMode = localStorage.getItem('account_view_mode') || 'list';
        viewMode = savedMode;
    } else if (path.includes('grinding.html')) {
        checkAuth();
        renderGrind();
    } else if (path.includes('sales.html')) {
        checkAuth();
        renderSales();
    } else if (path.includes('settings.html')) {
        checkAuth();
        setTimeout(() => {
            if (currentUser && currentUser.isAdmin) {
                const adminTitle = document.getElementById('adminSectionTitle');
                const adminSection = document.getElementById('adminSection');
                if (adminTitle) adminTitle.style.display = 'block';
                if (adminSection) adminSection.style.display = 'block';
            }
        }, 100);
    }
});

// ==================== 用户操作日志系统 ====================

async function logOperation(operationType, details) {
    if (!currentUser) return;
    
    try {
        await dbAdd(STORES.OPERATION_LOGS, {
            id: generateId(),
            userId: currentUser.username,
            username: currentUser.username,
            operationType: operationType,
            details: details,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error('记录操作日志失败:', e);
    }
}

async function getOperationLogs(filterUser = null) {
    const allLogs = await dbGetAll(STORES.OPERATION_LOGS);
    let logs = allLogs;
    
    if (filterUser) {
        logs = logs.filter(log => log.userId === filterUser);
    }
    
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs;
}

async function renderOperationLogs(filterUser = null) {
    const logs = await getOperationLogs(filterUser);
    const container = document.getElementById('operationLogList');
    if (!container) return;
    
    const operationTypeNames = {
        'add_server': '添加区服',
        'add_account': '添加账号',
        'edit_account': '编辑账号',
        'delete_account': '删除账号',
        'add_shikigami': '添加式神',
        'mark_sold': '标记已售',
        'grind_complete': '刷号完成',
        'reset_password': '重置密码',
        'change_role': '修改权限',
        'delete_user': '删除用户'
    };
    
    container.innerHTML = logs.length ? logs.map(log => {
        const typeName = operationTypeNames[log.operationType] || log.operationType;
        return `
            <div class="ios-item">
                <div class="ios-item-content">
                    <div class="ios-item-title">${log.username}</div>
                    <div class="ios-item-subtitle">
                        <strong>${typeName}</strong> · ${new Date(log.timestamp).toLocaleString()}
                        <br>${log.details || ''}
                    </div>
                </div>
            </div>
        `;
    }).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无操作日志</div>';
}

async function openOperationLogModal() {
    await renderOperationLogs();
    openModal('operationLogModal');
}
