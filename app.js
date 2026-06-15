const STORAGE = {
            ACCOUNTS: 'onmyoji_accounts',
            SERVERS: 'onmyoji_servers',
            SHIKIGAMI: 'onmyoji_shikigami',
            SETTINGS: 'onmyoji_settings',
            RECYCLE: 'onmyoji_recycle',
            GRIND_LOG: 'onmyoji_grind_log'
        };
        const DEFAULT_SHIKIGAMI = [
            { name: '阿修罗', icon: '' },
            { name: '因幡辉夜姬', icon: '' },
            { name: '不见岳', icon: '' },
            { name: '须佐之男', icon: '' },
            { name: '神堕八岐大蛇', icon: '' },
            { name: '季', icon: '' },
            { name: '禅心云外镜', icon: '' },
            { name: '天照', icon: '' }
        ];
        const DEFAULT_SERVERS = [
            { name: '春之樱', openTime: '2016-09-09' },
            { name: '夏之蝉', openTime: '2016-09-09' },
            { name: '秋之枫', openTime: '2016-09-09' },
            { name: '冬之雪', openTime: '2016-09-09' },
            { name: '相伴长情', openTime: '2017-01-01' }
        ];
        let currentView = 'home';
        let selectedServerId = '';
        let actionSheetServerId = '';
        let viewMode = localStorage.getItem('account_view_mode') || 'list';
        let newShikigamiIconData = '';
        let editShikigamiIconData = '';
        function initData() {
            if (!localStorage.getItem(STORAGE.SETTINGS)) {
                localStorage.setItem(STORAGE.SETTINGS, JSON.stringify({
                    defaultPassword: '147258369Hh',
                    phoneList: []
                }));
            }
            if (!localStorage.getItem(STORAGE.SERVERS)) {
                localStorage.setItem(STORAGE.SERVERS, JSON.stringify(
                    DEFAULT_SERVERS.map((s, i) => ({ id: generateId(), ...s, sort: i }))
                ));
            }
            if (!localStorage.getItem(STORAGE.SHIKIGAMI)) {
                localStorage.setItem(STORAGE.SHIKIGAMI, JSON.stringify(
                    DEFAULT_SHIKIGAMI.map(s => ({ id: generateId(), ...s }))
                ));
            }
            if (!localStorage.getItem(STORAGE.ACCOUNTS)) {
                localStorage.setItem(STORAGE.ACCOUNTS, JSON.stringify([]));
            }
            if (!localStorage.getItem(STORAGE.RECYCLE)) {
                localStorage.setItem(STORAGE.RECYCLE, JSON.stringify([]));
            }
            if (!localStorage.getItem(STORAGE.GRIND_LOG)) {
                localStorage.setItem(STORAGE.GRIND_LOG, JSON.stringify([]));
            }
        }
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        function getData(key) {
            return JSON.parse(localStorage.getItem(key) || '[]');
        }
        function setData(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        }
        function getSettings() {
            return JSON.parse(localStorage.getItem(STORAGE.SETTINGS) || '{}');
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
        
        function getCurrentPage() {
            const path = window.location.pathname;
            const filename = path.substring(path.lastIndexOf('/') + 1);
            const pageMap = {
                'index.html': 'home',
                'servers.html': 'accounts',
                'accounts.html': 'accounts',
                'grinding.html': 'grind',
                'sales.html': 'sales',
                'settings.html': 'settings'
            };
            return pageMap[filename] || 'home';
        }
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }
        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }
        function openActionSheet(serverId) {
            actionSheetServerId = serverId;
            document.getElementById('serverActionSheet').classList.add('active');
        }
        function closeActionSheet() {
            document.getElementById('serverActionSheet').classList.remove('active');
        }
        function editServerFromSheet() {
            closeActionSheet();
            editServer(actionSheetServerId);
        }
        function deleteServerFromSheet() {
            closeActionSheet();
            deleteServer(actionSheetServerId);
        }
        function showGrindDetail() {
            const today = new Date().toDateString();
            const grindLog = getData(STORAGE.GRIND_LOG).filter(g => new Date(g.date).toDateString() === today);
            const accounts = getData(STORAGE.ACCOUNTS);
            
            const detailList = document.getElementById('grindDetailList');
            
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
                    const serverName = getServerName(account.serverId);
                    const time = new Date(g.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    const typeText = g.type === 'levelup' ? '等级+1' : '标记完成';
                    const prevLevel = g.type === 'levelup' ? account.level - 1 : account.level;
                    
                    return `
                        <div class="grind-detail-item">
                            <div class="grind-detail-account">${account.account}</div>
                            <div class="grind-detail-info">
                                <span>${serverName}</span>
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
        function renderHome() {
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => !a.isSold);
            const servers = getData(STORAGE.SERVERS);
            const today = new Date().toDateString();
            const grindLog = getData(STORAGE.GRIND_LOG).filter(g => new Date(g.date).toDateString() === today);
            
            document.getElementById('statTotal').textContent = accounts.length;
            document.getElementById('statTodo').textContent = accounts.filter(a => a.level < 40 && !grindLog.map(g => g.accountId).includes(a.id)).length;
            document.getElementById('statLevel40').textContent = accounts.filter(a => a.level >= 40).length;
            document.getElementById('statUnder40').textContent = grindLog.length;
            
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
            document.getElementById('serverRankList').innerHTML = sortedServers.length ? 
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
            
            const shikigami = getData(STORAGE.SHIKIGAMI).slice(0, 8);
            document.getElementById('shikigamiQuick').innerHTML = shikigami.map(s => `
                <div class="shikigami-item" onclick="showShikigamiAccounts('${s.name}')">
                    <div class="shikigami-icon">
                        ${s.icon ? `<img src="${s.icon}">` : s.name.charAt(0)}
                    </div>
                    <div class="shikigami-name">${s.name}</div>
                </div>
            `).join('');
        }
        function showShikigamiAccounts(name) {
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => 
                !a.isSold && a.shikigami && a.shikigami.includes(name)
            );
            document.getElementById('shikigamiAccountsTitle').textContent = `拥有【${name}】的账号 (${accounts.length}个)`;
            document.getElementById('shikigamiAccountsList').innerHTML = accounts.length ?
                accounts.map(a => `
                    <div class="ios-item" onclick="locateAccount('${a.serverId}', '${a.id}')">
                        <div class="ios-item-content">
                            <div class="ios-item-title">${a.account}</div>
                            <div class="ios-item-subtitle">${getServerName(a.serverId)} · Lv.${a.level}</div>
                        </div>
                        <span class="ios-item-arrow">›</span>
                    </div>
                `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无账号</div>';
            openModal('shikigamiAccountsModal');
        }
        function locateAccount(serverId, accountId) {
            closeModal('shikigamiAccountsModal');
            selectedServerId = serverId;
            const server = getData(STORAGE.SERVERS).find(s => s.id === serverId);
            document.getElementById('currentServerName').textContent = server ? server.name : '';
            document.getElementById('currentServerId').value = serverId;
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('accountListView').classList.add('active');
            setTimeout(() => {
                filterAccounts();
                setTimeout(() => {
                    const card = document.querySelector(`.account-card[data-id="${accountId}"], .account-grid-card[data-id="${accountId}"]`);
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }, 100);
        }
        function getServerName(id) {
            const servers = getData(STORAGE.SERVERS);
            const server = servers.find(s => s.id === id);
            return server ? server.name : '未知区服';
        }
        function getShikigamiIcon(name) {
            const shikigami = getData(STORAGE.SHIKIGAMI);
            const s = shikigami.find(item => item.name === name);
            return s ? s.icon : '';
        }
        function renderServerList() {
            const servers = getData(STORAGE.SERVERS);
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => !a.isSold);
            
            document.getElementById('serverList').innerHTML = servers.map(s => {
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
        function deleteServer(id) {
            if (!confirm('删除区服将同时删除该服下所有账号，确定继续？')) return;
            
            const servers = getData(STORAGE.SERVERS).filter(s => s.id !== id);
            setData(STORAGE.SERVERS, servers);
            
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => a.serverId !== id);
            setData(STORAGE.ACCOUNTS, accounts);
            
            renderServerList();
            renderHome();
            showToast('已删除区服及相关账号');
        }
        function enterServer(id) {
            window.location.href = 'accounts.html?serverId=' + id;
        }
        function backToServerList() {
            window.location.href = 'servers.html';
        }
        function openAddServerModal() {
            document.getElementById('serverModalTitle').textContent = '添加区服';
            document.getElementById('serverForm').reset();
            document.getElementById('editServerId').value = '';
            openModal('serverModal');
        }
        function editServer(id) {
            const servers = getData(STORAGE.SERVERS);
            const server = servers.find(s => s.id === id);
            if (!server) return;
            
            document.getElementById('serverModalTitle').textContent = '编辑区服';
            document.getElementById('editServerId').value = id;
            document.getElementById('serverName').value = server.name;
            document.getElementById('serverOpenTime').value = server.openTime || '';
            openModal('serverModal');
        }
        document.getElementById('serverForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('editServerId').value;
            const serverData = {
                name: document.getElementById('serverName').value.trim(),
                openTime: document.getElementById('serverOpenTime').value
            };
            
            const servers = getData(STORAGE.SERVERS);
            if (id) {
                const index = servers.findIndex(s => s.id === id);
                if (index !== -1) servers[index] = { ...servers[index], ...serverData };
            } else {
                servers.push({ id: generateId(), ...serverData, sort: servers.length });
            }
            
            setData(STORAGE.SERVERS, servers);
            closeModal('serverModal');
            renderServerList();
            showToast(id ? '已更新' : '已添加');
        });
        function setViewMode(mode) {
            localStorage.setItem("account_view_mode", mode);
            viewMode = mode;
            document.getElementById('viewListBtn').classList.toggle('active', mode === 'list');
            document.getElementById('viewGridBtn').classList.toggle('active', mode === 'grid');
            filterAccounts();
        }
        function filterAccounts() {
            const search = document.getElementById('accountSearch').value.toLowerCase();
            let accounts = getData(STORAGE.ACCOUNTS).filter(a => !a.isSold && a.serverId === selectedServerId);
            const shikigamiList = getData(STORAGE.SHIKIGAMI);
            
            if (search) {
                accounts = accounts.filter(a => 
                    a.account.toLowerCase().includes(search) ||
                    (a.shikigami && a.shikigami.some(s => s.toLowerCase().includes(search)))
                );
            }
            
            const container = document.getElementById('accountList');
            
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
                    icons += `<div class="account-shikigami-icon">${icon}</div>`;
                }
                if (moreCount > 0) {
                    icons += `<div class="account-shikigami-more">+${moreCount}</div>`;
                }
                return `<div class="account-shikigami-icons">${icons}</div>`;
            }
            
            if (viewMode === 'list') {
                container.innerHTML = accounts.map(a => `
                    <div class="account-card" data-id="${a.id}">
                        <div class="account-header" style="flex-direction:column;gap:12px;">
                            ${renderShikigamiIcons(a.shikigami)}
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
                        <div style="margin-bottom:10px;">
                            ${renderShikigamiIcons(a.shikigami)}
                        </div>
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
        function copyAccountInfo(id) {
            const accounts = getData(STORAGE.ACCOUNTS);
            const account = accounts.find(a => a.id === id);
            if (account) {
                const text = `账号：${account.account}\n密码：${account.password}\n区服：${getServerName(account.serverId)}\n等级：${account.level}`;
                navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
            }
        }
        function openAddAccountModal() {
            document.getElementById('accountModalTitle').textContent = '添加账号';
            document.getElementById('accountForm').reset();
            document.getElementById('editAccountId').value = '';
            document.getElementById('accountPhoneManual').style.display = 'none';
            
            const settings = getSettings();
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
        function editAccount(id) {
            const accounts = getData(STORAGE.ACCOUNTS);
            const account = accounts.find(a => a.id === id);
            if (!account) return;
            
            document.getElementById('accountModalTitle').textContent = '编辑账号';
            document.getElementById('editAccountId').value = id;
            document.getElementById('accountName').value = account.account.replace('@163.com', '');
            document.getElementById('accountPassword').value = account.password;
            document.getElementById('accountLevel').value = account.level;
            document.getElementById('accountShikigami').value = account.shikigami ? account.shikigami.join(',') : '';
            document.getElementById('accountRemark').value = account.remark || '';
            
            const settings = getSettings();
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
        document.getElementById('accountForm').addEventListener('submit', function(e) {
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
            
            const accounts = getData(STORAGE.ACCOUNTS);
            
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
            
            setData(STORAGE.ACCOUNTS, accounts);
            closeModal('accountModal');
            filterAccounts();
            renderHome();
            showToast(id ? '已更新' : '已添加');
        });
        function openSellModal(id) {
            document.getElementById('sellAccountId').value = id;
            document.getElementById('sellPrice').value = '';
            openModal('sellModal');
        }
        document.getElementById('sellForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('sellAccountId').value;
            const price = parseFloat(document.getElementById('sellPrice').value);
            
            const accounts = getData(STORAGE.ACCOUNTS);
            const index = accounts.findIndex(a => a.id === id);
            if (index !== -1) {
                accounts[index].isSold = true;
                accounts[index].soldPrice = price;
                accounts[index].soldTime = new Date().toISOString();
                setData(STORAGE.ACCOUNTS, accounts);
            }
            
            closeModal('sellModal');
            filterAccounts();
            renderHome();
            renderSales();
            showToast('已标记为已售');
        });
        function deleteAccount(id) {
            if (!confirm('确定要删除此账号吗？将移至回收站')) return;
            
            const accounts = getData(STORAGE.ACCOUNTS);
            const account = accounts.find(a => a.id === id);
            if (account) {
                const recycle = getData(STORAGE.RECYCLE);
                recycle.push({ ...account, deleteTime: new Date().toISOString() });
                setData(STORAGE.RECYCLE, recycle);
                setData(STORAGE.ACCOUNTS, accounts.filter(a => a.id !== id));
                filterAccounts();
                renderHome();
                showToast('已移至回收站');
            }
        }
        function renderGrind() {
            const today = new Date().toDateString();
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => !a.isSold && a.level < 40);
            const grindLog = getData(STORAGE.GRIND_LOG).filter(g => new Date(g.date).toDateString() === today);
            
            const grindedIds = grindLog.map(g => g.accountId);
            const pendingAccounts = accounts.filter(a => !grindedIds.includes(a.id));
            
            document.getElementById('grindTodo').textContent = pendingAccounts.length;
            document.getElementById('grindDone').textContent = grindLog.length;
            
            const container = document.getElementById('grindList');
            
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
                                <div class="grind-server">${getServerName(a.serverId)}</div>
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
        function levelUp(id) {
            const accounts = getData(STORAGE.ACCOUNTS);
            const index = accounts.findIndex(a => a.id === id);
            if (index !== -1) {
                accounts[index].level = Math.min(accounts[index].level + 1, 60);
                accounts[index].updateTime = new Date().toISOString();
                setData(STORAGE.ACCOUNTS, accounts);
                
                const grindLog = getData(STORAGE.GRIND_LOG);
                grindLog.push({ accountId: id, date: new Date().toISOString(), type: 'levelup' });
                setData(STORAGE.GRIND_LOG, grindLog);
            }
            renderGrind();
            renderHome();
            showToast('等级+1');
        }
        function markDone(id) {
            const grindLog = getData(STORAGE.GRIND_LOG);
            grindLog.push({ accountId: id, date: new Date().toISOString(), type: 'done' });
            setData(STORAGE.GRIND_LOG, grindLog);
            renderGrind();
            renderHome();
            showToast('已标记今日完成');
        }
        function renderSales() {
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => a.isSold);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const todaySales = accounts.filter(a => new Date(a.soldTime) >= today);
            const monthSales = accounts.filter(a => new Date(a.soldTime) >= monthStart);
            
            document.getElementById('saleToday').textContent = '¥' + todaySales.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
            document.getElementById('saleMonth').textContent = '¥' + monthSales.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
            document.getElementById('saleTotal').textContent = '¥' + accounts.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
            
            accounts.sort((a, b) => new Date(b.soldTime) - new Date(a.soldTime));
            
            document.getElementById('saleList').innerHTML = accounts.length ?
                accounts.map(a => `
                    <div class="ios-item">
                        <div class="ios-item-content">
                            <div class="ios-item-title">${a.account}</div>
                            <div class="ios-item-subtitle">${getServerName(a.serverId)} · ${new Date(a.soldTime).toLocaleDateString()}</div>
                        </div>
                        <span class="ios-item-value" style="color: var(--ios-green); font-weight: 700;">¥${a.soldPrice || 0}</span>
                    </div>
                `).join('') : '<div class="empty-text" style="text-align:center;padding:20px;">暂无销售记录</div>';
        }
        function exportSales(format) {
            const accounts = getData(STORAGE.ACCOUNTS).filter(a => a.isSold);
            let content, filename, type;
            
            if (format === 'txt') {
                content = accounts.map(a => 
                    `${a.account}\t${getServerName(a.serverId)}\t¥${a.soldPrice}\t${new Date(a.soldTime).toLocaleDateString()}`
                ).join('\n');
                filename = 'sales.txt';
                type = 'text/plain';
            } else {
                content = JSON.stringify(accounts, null, 2);
                filename = 'sales.json';
                type = 'application/json';
            }
            
            downloadFile(content, filename, type);
        }
        function openDefaultSettings() {
            const settings = getSettings();
            document.getElementById('defaultPassword').value = settings.defaultPassword || '';
            document.getElementById('phoneList').value = (settings.phoneList || []).join('\n');
            openModal('defaultModal');
        }
        document.getElementById('defaultForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const settings = getSettings();
            settings.defaultPassword = document.getElementById('defaultPassword').value;
            settings.phoneList = document.getElementById('phoneList').value.split('\n').map(p => p.trim()).filter(p => p);
            localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(settings));
            closeModal('defaultModal');
            showToast('已保存');
        });
        function openShikigamiManage() {
            renderShikigamiManageList();
            newShikigamiIconData = '';
            document.getElementById('newShikigamiIconPreview').style.display = 'none';
            openModal('shikigamiModal');
        }
        function renderShikigamiManageList() {
            const shikigami = getData(STORAGE.SHIKIGAMI);
            document.getElementById('shikigamiManageList').innerHTML = shikigami.map(s => `
                <div class="ios-item">
                    <div class="ios-item-content" style="display:flex;align-items:center;gap:14px;">
                        <div class="shikigami-icon" style="width:38px;height:38px;font-size:15px;">
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
        function previewNewIcon(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                newShikigamiIconData = e.target.result;
                const preview = document.getElementById('newShikigamiIconPreview');
                preview.src = newShikigamiIconData;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        function previewEditIcon(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                editShikigamiIconData = e.target.result;
                document.getElementById('editShikigamiIconPreview').src = editShikigamiIconData;
            };
            reader.readAsDataURL(file);
        }
        function addShikigami() {
            const name = document.getElementById('newShikigamiName').value.trim();
            if (!name) return;
            
            const shikigami = getData(STORAGE.SHIKIGAMI);
            shikigami.push({ 
                id: generateId(), 
                name, 
                icon: newShikigamiIconData 
            });
            setData(STORAGE.SHIKIGAMI, shikigami);
            
            document.getElementById('newShikigamiName').value = '';
            newShikigamiIconData = '';
            document.getElementById('newShikigamiIconPreview').style.display = 'none';
            
            renderShikigamiManageList();
            renderHome();
            showToast('已添加');
        }
        function openEditShikigami(id) {
            const shikigami = getData(STORAGE.SHIKIGAMI);
            const s = shikigami.find(item => item.id === id);
            if (!s) return;
            
            document.getElementById('editShikigamiId').value = id;
            document.getElementById('editShikigamiName').value = s.name;
            editShikigamiIconData = s.icon || '';
            document.getElementById('editShikigamiIconPreview').src = s.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="62" height="62"><rect fill="%23007AFF" width="62" height="62"/></svg>';
            
            openModal('editShikigamiModal');
        }
        document.getElementById('editShikigamiForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('editShikigamiId').value;
            const shikigami = getData(STORAGE.SHIKIGAMI);
            const index = shikigami.findIndex(s => s.id === id);
            if (index !== -1) {
                shikigami[index].name = document.getElementById('editShikigamiName').value;
                if (editShikigamiIconData) {
                    shikigami[index].icon = editShikigamiIconData;
                }
                setData(STORAGE.SHIKIGAMI, shikigami);
            }
            closeModal('editShikigamiModal');
            renderShikigamiManageList();
            renderHome();
            showToast('已更新');
        });
        function deleteShikigami(id) {
            if (!confirm('确定删除此式神吗？')) return;
            const shikigami = getData(STORAGE.SHIKIGAMI).filter(s => s.id !== id);
            setData(STORAGE.SHIKIGAMI, shikigami);
            renderShikigamiManageList();
            renderHome();
            showToast('已删除');
        }
        function openRecycleBin() {
            renderRecycleList();
            openModal('recycleModal');
        }
        function renderRecycleList() {
            const recycle = getData(STORAGE.RECYCLE);
            document.getElementById('recycleList').innerHTML = recycle.length ?
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
        function restoreAccount(id) {
            const recycle = getData(STORAGE.RECYCLE);
            const account = recycle.find(a => a.id === id);
            if (account) {
                const accounts = getData(STORAGE.ACCOUNTS);
                delete account.deleteTime;
                accounts.push(account);
                setData(STORAGE.ACCOUNTS, accounts);
                setData(STORAGE.RECYCLE, recycle.filter(a => a.id !== id));
                renderRecycleList();
                renderHome();
                showToast('已恢复');
            }
        }
        function permanentDelete(id) {
            if (!confirm('确定永久删除吗？此操作不可恢复！')) return;
            const recycle = getData(STORAGE.RECYCLE).filter(a => a.id !== id);
            setData(STORAGE.RECYCLE, recycle);
            renderRecycleList();
            showToast('已永久删除');
        }
        function exportData() {
            const data = {
                accounts: getData(STORAGE.ACCOUNTS),
                servers: getData(STORAGE.SERVERS),
                shikigami: getData(STORAGE.SHIKIGAMI),
                settings: getSettings(),
                recycle: getData(STORAGE.RECYCLE)
            };
            downloadFile(JSON.stringify(data, null, 2), 'onmyoji-backup.json', 'application/json');
            showToast('已导出备份文件');
        }
        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.accounts) localStorage.setItem(STORAGE.ACCOUNTS, JSON.stringify(data.accounts));
                    if (data.servers) localStorage.setItem(STORAGE.SERVERS, JSON.stringify(data.servers));
                    if (data.shikigami) localStorage.setItem(STORAGE.SHIKIGAMI, JSON.stringify(data.shikigami));
                    if (data.settings) localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(data.settings));
                    if (data.recycle) localStorage.setItem(STORAGE.RECYCLE, JSON.stringify(data.recycle));
                    showToast('数据导入成功');
                    renderHome();
                    renderServerList();
                } catch (err) {
                    showToast('导入失败：文件格式错误');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }
        function clearAllData() {
            if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
            if (!confirm('再次确认：所有账号、区服、设置都将被清空！')) return;
            
            Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
            initData();
            renderHome();
            renderServerList();
            showToast('已清空所有数据');
        }
        function downloadFile(content, filename, type) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
        document.addEventListener('DOMContentLoaded', function() {
            initData();
            renderHome();
        });