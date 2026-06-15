// 数据存储
class StorageManager {
    static STORAGE_KEYS = {
        ACCOUNTS: 'onmyoji_accounts',
        SHIKIGAMI: 'onmyoji_shikigami'
    };

    static getAccounts() {
        const data = localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS);
        return data ? JSON.parse(data) : [];
    }

    static saveAccounts(accounts) {
        localStorage.setItem(this.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }

    static getShikigami() {
        const data = localStorage.getItem(this.STORAGE_KEYS.SHIKIGAMI);
        return data ? JSON.parse(data) : [];
    }

    static saveShikigami(shikigami) {
        localStorage.setItem(this.STORAGE_KEYS.SHIKIGAMI, JSON.stringify(shikigami));
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 账号管理
class AccountManager {
    static getAll() {
        return StorageManager.getAccounts();
    }

    static add(account) {
        const accounts = this.getAll();
        account.id = StorageManager.generateId();
        account.createdAt = new Date().toISOString();
        accounts.push(account);
        StorageManager.saveAccounts(accounts);
        return account;
    }

    static update(id, updatedData) {
        const accounts = this.getAll();
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) {
            accounts[index] = { ...accounts[index], ...updatedData };
            StorageManager.saveAccounts(accounts);
            return accounts[index];
        }
        return null;
    }

    static delete(id) {
        const accounts = this.getAll().filter(a => a.id !== id);
        StorageManager.saveAccounts(accounts);
        // 同时删除该账号下的式神
        const shikigami = ShikigamiManager.getAll().filter(s => s.accountId !== id);
        StorageManager.saveShikigami(shikigami);
    }

    static getById(id) {
        return this.getAll().find(a => a.id === id);
    }

    static getStats() {
        const accounts = this.getAll();
        const totalAccounts = accounts.length;
        const avgLevel = totalAccounts > 0 
            ? Math.round(accounts.reduce((sum, a) => sum + (parseInt(a.level) || 0), 0) / totalAccounts) 
            : 0;
        const totalJade = accounts.reduce((sum, a) => sum + (parseInt(a.jade) || 0), 0);
        const totalGold = accounts.reduce((sum, a) => sum + (parseInt(a.gold) || 0), 0);
        
        return { totalAccounts, avgLevel, totalJade, totalGold };
    }
}

// 式神管理
class ShikigamiManager {
    static getAll() {
        return StorageManager.getShikigami();
    }

    static getByAccountId(accountId) {
        return this.getAll().filter(s => s.accountId === accountId);
    }

    static add(shikigami) {
        const all = this.getAll();
        shikigami.id = StorageManager.generateId();
        shikigami.createdAt = new Date().toISOString();
        all.push(shikigami);
        StorageManager.saveShikigami(all);
        return shikigami;
    }

    static update(id, updatedData) {
        const all = this.getAll();
        const index = all.findIndex(s => s.id === id);
        if (index !== -1) {
            all[index] = { ...all[index], ...updatedData };
            StorageManager.saveShikigami(all);
            return all[index];
        }
        return null;
    }

    static delete(id) {
        const all = this.getAll().filter(s => s.id !== id);
        StorageManager.saveShikigami(all);
    }

    static getById(id) {
        return this.getAll().find(s => s.id === id);
    }
}

// UI 渲染
class UIRenderer {
    static renderAccounts(searchQuery = '') {
        const accounts = AccountManager.getAll();
        const filteredAccounts = searchQuery 
            ? accounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : accounts;
        
        const container = document.getElementById('accountList');
        
        if (filteredAccounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <p>${searchQuery ? '未找到匹配的账号' : '暂无账号，点击上方按钮添加'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredAccounts.map(account => `
            <div class="account-card" data-id="${account.id}">
                <div class="account-header">
                    <div>
                        <div class="account-name">${this.escapeHtml(account.name)}</div>
                        <span class="account-level">Lv.${account.level || 1}</span>
                    </div>
                    <div class="account-actions">
                        <button class="action-btn" onclick="editAccount('${account.id}')" title="编辑">✏️</button>
                        <button class="action-btn delete" onclick="confirmDeleteAccount('${account.id}')" title="删除">🗑️</button>
                    </div>
                </div>
                <div class="account-stats">
                    <div class="account-stat">
                        <div class="account-stat-value">${this.formatNumber(account.exp || 0)}</div>
                        <div class="account-stat-label">经验</div>
                    </div>
                    <div class="account-stat">
                        <div class="account-stat-value">${this.formatNumber(account.gold || 0)}</div>
                        <div class="account-stat-label">金币</div>
                    </div>
                    <div class="account-stat">
                        <div class="account-stat-value">${this.formatNumber(account.jade || 0)}</div>
                        <div class="account-stat-label">勾玉</div>
                    </div>
                    <div class="account-stat">
                        <div class="account-stat-value">${ShikigamiManager.getByAccountId(account.id).length}</div>
                        <div class="account-stat-label">式神</div>
                    </div>
                </div>
                ${account.note ? `<div class="account-note">📝 ${this.escapeHtml(account.note)}</div>` : ''}
            </div>
        `).join('');
    }

    static renderStats() {
        const stats = AccountManager.getStats();
        document.getElementById('totalAccounts').textContent = stats.totalAccounts;
        document.getElementById('avgLevel').textContent = stats.avgLevel;
        document.getElementById('totalJade').textContent = this.formatNumber(stats.totalJade);
        document.getElementById('totalGold').textContent = this.formatNumber(stats.totalGold);
    }

    static renderShikigami(accountId, searchQuery = '') {
        let shikigami = accountId ? ShikigamiManager.getByAccountId(accountId) : ShikigamiManager.getAll();
        
        if (searchQuery) {
            shikigami = shikigami.filter(s => 
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        const container = document.getElementById('shikigamiList');
        
        if (!accountId) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👆</div>
                    <p>请先选择一个账号</p>
                </div>
            `;
            return;
        }

        if (shikigami.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎭</div>
                    <p>${searchQuery ? '未找到匹配的式神' : '该账号暂无式神，点击上方按钮添加'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = shikigami.map(s => `
            <div class="shikigami-card" data-id="${s.id}">
                <div class="shikigami-header">
                    <div class="shikigami-name">${this.escapeHtml(s.name)}</div>
                    <span class="rarity-badge rarity-${s.rarity}">${s.rarity}</span>
                </div>
                <div class="shikigami-info">
                    <span>等级: <strong>Lv.${s.level || 1}</strong></span>
                    <span>技能: <strong>${s.skills || '-'}</strong></span>
                </div>
                <div class="shikigami-info">
                    <span>觉醒: <strong>${s.awakened === 'true' ? '已觉醒' : '未觉醒'}</strong></span>
                </div>
                ${s.soul ? `<div class="shikigami-soul">🔮 ${this.escapeHtml(s.soul)}</div>` : ''}
                <div class="shikigami-actions">
                    <button class="action-btn" onclick="editShikigami('${s.id}')" style="flex: 1;">✏️ 编辑</button>
                    <button class="action-btn delete" onclick="confirmDeleteShikigami('${s.id}')" style="flex: 1;">🗑️ 删除</button>
                </div>
            </div>
        `).join('');
    }

    static renderAccountSelect() {
        const accounts = AccountManager.getAll();
        const select = document.getElementById('accountSelect');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">选择账号</option>' + 
            accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    }

    static formatNumber(num) {
        return parseInt(num).toLocaleString();
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局变量
let deleteTarget = { type: null, id: null };

// 视图切换 - 修复：使用 .tab-item 替代 .nav-item
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(viewName + 'View').classList.add('active');
    document.querySelector(`.tab-item[data-view="${viewName}"]`).classList.add('active');
    
    if (viewName === 'shikigami') {
        UIRenderer.renderAccountSelect();
    }
}

// 账号弹窗
function openAddAccountModal() {
    document.getElementById('accountModalTitle').textContent = '添加账号';
    document.getElementById('accountForm').reset();
    document.getElementById('accountId').value = '';
    document.getElementById('accountModal').classList.add('active');
}

function editAccount(id) {
    const account = AccountManager.getById(id);
    if (!account) return;
    
    document.getElementById('accountModalTitle').textContent = '编辑账号';
    document.getElementById('accountId').value = account.id;
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountLevel').value = account.level || 1;
    document.getElementById('accountExp').value = account.exp || 0;
    document.getElementById('accountGold').value = account.gold || 0;
    document.getElementById('accountJade').value = account.jade || 0;
    document.getElementById('accountNote').value = account.note || '';
    document.getElementById('accountModal').classList.add('active');
}

function closeAccountModal() {
    document.getElementById('accountModal').classList.remove('active');
}

// 式神弹窗
function openAddShikigamiModal() {
    const accountId = document.getElementById('accountSelect').value;
    if (!accountId) {
        alert('请先选择一个账号');
        return;
    }
    
    document.getElementById('shikigamiModalTitle').textContent = '添加式神';
    document.getElementById('shikigamiForm').reset();
    document.getElementById('shikigamiId').value = '';
    document.getElementById('shikigamiAccountId').value = accountId;
    document.getElementById('shikigamiModal').classList.add('active');
}

function editShikigami(id) {
    const shikigami = ShikigamiManager.getById(id);
    if (!shikigami) return;
    
    document.getElementById('shikigamiModalTitle').textContent = '编辑式神';
    document.getElementById('shikigamiId').value = shikigami.id;
    document.getElementById('shikigamiAccountId').value = shikigami.accountId;
    document.getElementById('shikigamiName').value = shikigami.name;
    document.getElementById('shikigamiRarity').value = shikigami.rarity;
    document.getElementById('shikigamiLevel').value = shikigami.level || 1;
    document.getElementById('shikigamiSkills').value = shikigami.skills || '';
    document.getElementById('shikigamiAwakened').value = shikigami.awakened || 'false';
    document.getElementById('shikigamiSoul').value = shikigami.soul || '';
    document.getElementById('shikigamiModal').classList.add('active');
}

function closeShikigamiModal() {
    document.getElementById('shikigamiModal').classList.remove('active');
}

// 删除确认
function confirmDeleteAccount(id) {
    deleteTarget = { type: 'account', id };
    document.getElementById('confirmModal').classList.add('active');
}

function confirmDeleteShikigami(id) {
    deleteTarget = { type: 'shikigami', id };
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    deleteTarget = { type: null, id: null };
}

function executeDelete() {
    if (deleteTarget.type === 'account') {
        AccountManager.delete(deleteTarget.id);
        refreshAll();
    } else if (deleteTarget.type === 'shikigami') {
        ShikigamiManager.delete(deleteTarget.id);
        const accountId = document.getElementById('accountSelect').value;
        UIRenderer.renderShikigami(accountId);
    }
    closeConfirmModal();
}

// 刷新所有数据
function refreshAll() {
    const searchQuery = document.getElementById('searchInput').value;
    UIRenderer.renderAccounts(searchQuery);
    UIRenderer.renderStats();
    UIRenderer.renderAccountSelect();
}

// 关闭弹窗按钮
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 导航切换 - 修复：使用 .tab-item 替代 .nav-item
    document.querySelectorAll('.tab-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // 添加账号按钮
    const addAccountBtn = document.getElementById('addAccountBtn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', openAddAccountModal);
    }

    // 添加式神按钮
    const addShikigamiBtn = document.getElementById('addShikigamiBtn');
    if (addShikigamiBtn) {
        addShikigamiBtn.addEventListener('click', openAddShikigamiModal);
    }

    // 账号表单提交
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accountData = {
                name: document.getElementById('accountName').value,
                level: document.getElementById('accountLevel').value,
                exp: document.getElementById('accountExp').value,
                gold: document.getElementById('accountGold').value,
                jade: document.getElementById('accountJade').value,
                note: document.getElementById('accountNote').value
            };
            
            const accountId = document.getElementById('accountId').value;
            if (accountId) {
                AccountManager.update(accountId, accountData);
            } else {
                AccountManager.add(accountData);
            }
            
            closeAccountModal();
            refreshAll();
        });
    }

    // 式神表单提交
    const shikigamiForm = document.getElementById('shikigamiForm');
    if (shikigamiForm) {
        shikigamiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const shikigamiData = {
                accountId: document.getElementById('shikigamiAccountId').value,
                name: document.getElementById('shikigamiName').value,
                rarity: document.getElementById('shikigamiRarity').value,
                level: document.getElementById('shikigamiLevel').value,
                skills: document.getElementById('shikigamiSkills').value,
                awakened: document.getElementById('shikigamiAwakened').value,
                soul: document.getElementById('shikigamiSoul').value
            };
            
            const shikigamiId = document.getElementById('shikigamiId').value;
            if (shikigamiId) {
                ShikigamiManager.update(shikigamiId, shikigamiData);
            } else {
                ShikigamiManager.add(shikigamiData);
            }
            
            closeShikigamiModal();
            const accountId = document.getElementById('accountSelect').value;
            UIRenderer.renderShikigami(accountId);
            UIRenderer.renderStats();
        });
    }

    // 账号选择变化
    const accountSelect = document.getElementById('accountSelect');
    if (accountSelect) {
        accountSelect.addEventListener('change', function() {
            UIRenderer.renderShikigami(this.value);
        });
    }

    // 搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value;
            const activeView = document.querySelector('.view.active');
            
            if (activeView) {
                if (activeView.id === 'accountsView') {
                    UIRenderer.renderAccounts(query);
                } else if (activeView.id === 'shikigamiView') {
                    const accountId = document.getElementById('accountSelect').value;
                    UIRenderer.renderShikigami(accountId, query);
                }
            }
        });
    }

    // 确认删除
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeDelete);
    }

    // 取消删除
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeConfirmModal);
    }

    // 点击弹窗外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // 初始化
    refreshAll();

    // 添加示例数据（如果为空）
    if (AccountManager.getAll().length === 0) {
        AccountManager.add({
            name: '我的主力账号',
            level: 60,
            exp: 999999,
            gold: 5000000,
            jade: 3000,
            note: '主要游戏账号，签到第1000天'
        });
        
        AccountManager.add({
            name: '小号',
            level: 45,
            exp: 500000,
            gold: 1000000,
            jade: 500,
            note: '备用账号'
        });

        const accounts = AccountManager.getAll();
        if (accounts.length > 0) {
            ShikigamiManager.add({
                accountId: accounts[0].id,
                name: '阿修罗',
                rarity: 'SSR',
                level: 40,
                skills: '555',
                awakened: 'true',
                soul: '破势 攻攻爆'
            });
            
            ShikigamiManager.add({
                accountId: accounts[0].id,
                name: '因幡辉夜姬',
                rarity: 'SP',
                level: 40,
                skills: '555',
                awakened: 'true',
                soul: '火灵 速防防'
            });

            ShikigamiManager.add({
                accountId: accounts[0].id,
                name: '不见岳',
                rarity: 'SSR',
                level: 40,
                skills: '515',
                awakened: 'true',
                soul: '薙魂 防防防'
            });
        }
        
        refreshAll();
    }
});
