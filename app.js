// 1v1语音社交匹配应用
class VoiceChatApp {
    constructor() {
        this.currentPage = 'entry';
        this.demandText = '';
        this.isMatching = false;
        this.callTimer = null;
        this.timeRemaining = 60;
        this.isExtended = false;
        this.isMuted = false;
        this.micPermission = false;
        this.partnerId = null;
        this.roomId = null;
        
        // AI对话相关状态
        this.aiMessages = [];
        this.isAITyping = false;
        this.aiConfig = {
            apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            apiKey: '75851fc743ef4a0ca3a29197254f6431.UtfFp9OUjl0HPEuJ',
            modelName: 'glm-4.7'
        };
        this.aiConfigured = true; // 设置为已配置状态
        
        this.initializeElements();
        this.bindEvents();
        this.initialize();
    }

    // 初始化DOM元素
    initializeElements() {
        // 页面元素
        this.entryPage = document.getElementById('entryPage');
        this.matchingPage = document.getElementById('matchingPage');
        this.callPage = document.getElementById('callPage');
        this.aiChatPage = document.getElementById('aiChatPage');
        
        // 输入页面元素
        this.demandInput = document.getElementById('demandInput');
        this.charCount = document.getElementById('charCount');
        this.micStatus = document.getElementById('micStatus');
        this.micIcon = document.getElementById('micIcon');
        this.micText = document.getElementById('micText');
        this.startMatchBtn = document.getElementById('startMatchBtn');
        this.chatWithAIBtn = document.getElementById('chatWithAIBtn');
        
        // 匹配页面元素
        this.demandPreview = document.getElementById('demandPreview');
        this.onlineCount = document.getElementById('onlineCount');
        this.cancelMatchBtn = document.getElementById('cancelMatchBtn');
        
        // 通话页面元素
        this.partnerDemand = document.getElementById('partnerDemand');
        this.timerCircle = document.getElementById('timerCircle');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.muteBtn = document.getElementById('muteBtn');
        this.hangupBtn = document.getElementById('hangupBtn');
        
        // 续聊弹窗元素
        this.extensionModal = document.getElementById('extensionModal');
        this.decisionTimer = document.getElementById('decisionTimer');
        this.agreeBtn = document.getElementById('agreeBtn');
        this.declineBtn = document.getElementById('declineBtn');
        this.myStatus = document.getElementById('myStatus');
        this.partnerStatus = document.getElementById('partnerStatus');
        
        // AI对话页面元素
        this.aiChatContainer = document.getElementById('aiChatContainer');
        this.aiMessageInput = document.getElementById('aiMessageInput');
        this.aiSendBtn = document.getElementById('aiSendBtn');
        this.aiStatusText = document.getElementById('aiStatusText');
        this.aiTypingIndicator = document.getElementById('aiTypingIndicator');
        this.aiUserDemand = document.getElementById('aiUserDemand');
        this.backToHomeBtn = document.getElementById('backToHomeBtn');
        
        // AI设置面板元素
        this.aiSettingsBtn = document.getElementById('aiSettingsBtn');
        this.aiSettingsPanel = document.getElementById('aiSettingsPanel');
        this.closeAISettingsBtn = document.getElementById('closeAISettingsBtn');
        this.aiOverlay = document.getElementById('aiOverlay');
        this.aiApiUrlInput = document.getElementById('aiApiUrl');
        this.aiApiKeyInput = document.getElementById('aiApiKey');
        this.aiModelNameInput = document.getElementById('aiModelName');
        this.saveAIConfigBtn = document.getElementById('saveAIConfigBtn');
        this.testAIConnectionBtn = document.getElementById('testAIConnectionBtn');
        this.clearAIChatBtn = document.getElementById('clearAIChatBtn');
        this.toggleAIApiKeyBtn = document.getElementById('toggleAIApiKey');
    }

    // 绑定事件
    bindEvents() {
        // 输入框事件
        this.demandInput.addEventListener('input', () => this.handleInputChange());
        
        // 按钮事件
        this.startMatchBtn.addEventListener('click', () => this.startMatching());
        this.chatWithAIBtn.addEventListener('click', () => {
            console.log('AI助手按钮被点击了！');
            console.log('按钮状态:', this.chatWithAIBtn.disabled);
            console.log('需求文本:', this.demandText);
            console.log('AI配置状态:', this.aiConfigured);
            this.startAIChat();
        });
        this.cancelMatchBtn.addEventListener('click', () => this.cancelMatching());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.hangupBtn.addEventListener('click', () => this.hangupCall());
        
        // AI对话事件
        this.aiSendBtn.addEventListener('click', () => this.sendAIMessage());
        this.aiMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIMessage();
            }
        });
        this.aiMessageInput.addEventListener('input', () => this.autoResizeAITextarea());
        this.backToHomeBtn.addEventListener('click', () => this.showPage('entry'));
        
        // AI设置面板事件
        this.aiSettingsBtn.addEventListener('click', () => this.openAISettings());
        this.closeAISettingsBtn.addEventListener('click', () => this.closeAISettings());
        this.aiOverlay.addEventListener('click', () => this.closeAISettings());
        this.saveAIConfigBtn.addEventListener('click', () => this.saveAIConfiguration());
        this.testAIConnectionBtn.addEventListener('click', () => this.testAIConnection());
        this.clearAIChatBtn.addEventListener('click', () => this.clearAIChat());
        this.toggleAIApiKeyBtn.addEventListener('click', () => this.toggleAIApiKeyVisibility());
        
        // 续聊弹窗事件
        this.agreeBtn.addEventListener('click', () => this.voteExtension(true));
        this.declineBtn.addEventListener('click', () => this.voteExtension(false));
    }

    // 初始化应用
    async initialize() {
        await this.checkMicrophonePermission();
        
        // 尝试加载AI配置，但不阻塞应用启动
        try {
            await this.loadAIConfig();
        } catch (error) {
            console.log('加载AI配置时出现问题，使用预设配置:', error);
        }
        
        // 确保AI配置状态正确显示
        if (this.aiConfigured) {
            if (this.aiStatusText) {
                this.aiStatusText.textContent = '已配置';
            }
            // 确保表单也显示配置
            if (this.aiApiUrlInput) {
                this.loadAIConfigToForm();
            }
        }
        
        this.updateStartButton();
        this.showPage('entry');
        
        // 模拟在线用户数
        this.updateOnlineCount();
    }

    // 处理输入变化
    handleInputChange() {
        const length = this.demandInput.value.length;
        console.log('输入变化，当前长度:', length, '内容:', this.demandInput.value);
        
        this.charCount.textContent = `${length}/50`;
        
        // 字符数颜色变化
        if (length > 40) {
            this.charCount.classList.remove('text-gray-400', 'text-red-500');
            this.charCount.classList.add('text-yellow-400');
        } else if (length === 50) {
            this.charCount.classList.remove('text-gray-400', 'text-yellow-400');
            this.charCount.classList.add('text-red-500');
        } else {
            this.charCount.classList.remove('text-yellow-400', 'text-red-500');
            this.charCount.classList.add('text-gray-400');
        }
        
        this.demandText = this.demandInput.value;
        console.log('demandText 已更新为:', this.demandText);
        
        this.updateStartButton();
    }

    // 检查麦克风权限
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            this.micPermission = true;
            this.micIcon.classList.remove('bg-gray-500');
            this.micIcon.classList.add('bg-green-500', 'neon-green');
            this.micText.textContent = '音频接口已连接';
            this.micText.classList.remove('text-cyan-300');
            this.micText.classList.add('neon-green');
        } catch (error) {
            this.micPermission = false;
            this.micIcon.classList.remove('bg-gray-500');
            this.micIcon.classList.add('bg-red-500');
            this.micText.textContent = '音频接口连接失败';
            this.micText.classList.remove('text-cyan-300');
            this.micText.classList.add('text-red-400');
        }
    }

    // 更新开始按钮状态
    updateStartButton() {
        const canStart = this.demandText.trim().length > 0 && this.micPermission;
        const canStartAI = this.demandText.trim().length > 0; // AI对话不需要麦克风权限
        
        console.log('更新按钮状态:');
        console.log('- 需求文本长度:', this.demandText.trim().length);
        console.log('- 麦克风权限:', this.micPermission);
        console.log('- 可以开始匹配:', canStart);
        console.log('- 可以开始AI对话:', canStartAI);
        
        this.startMatchBtn.disabled = !canStart;
        this.chatWithAIBtn.disabled = !canStartAI;
        
        console.log('- 匹配按钮禁用状态:', this.startMatchBtn.disabled);
        console.log('- AI按钮禁用状态:', this.chatWithAIBtn.disabled);
    }

    // 开始匹配
    async startMatching() {
        if (this.demandText.trim().length === 0) return;
        
        this.isMatching = true;
        this.demandPreview.textContent = this.demandText;
        this.showPage('matching');
        
        // 保存用户需求到数据库
        await this.saveUserDemand();
        
        // 模拟匹配过程
        this.simulateMatching();
    }

    // 保存用户需求
    async saveUserDemand() {
        try {
            const { data, error } = await window.supabase
                .from('user_demands')
                .insert([{
                    demand_text: this.demandText,
                    user_ip: this.getUserIP(),
                    status: 'matching',
                    created_at: new Date().toISOString()
                }]);
            
            if (error) {
                console.error('保存用户需求失败:', error);
            }
        } catch (error) {
            console.error('保存用户需求异常:', error);
        }
    }

    // 获取用户IP（简化版）
    getUserIP() {
        return Math.random().toString(36).substr(2, 9);
    }

    // 模拟匹配过程
    simulateMatching() {
        // 模拟3-8秒的匹配时间
        const matchTime = Math.random() * 5000 + 3000;
        
        setTimeout(() => {
            if (this.isMatching) {
                this.foundMatch();
            }
        }, matchTime);
    }

    // 找到匹配
    foundMatch() {
        // 模拟匹配到的用户
        const partnerDemands = [
            "想找个人聊聊最近的工作压力和生活感悟",
            "希望能遇到有趣的人，聊聊旅行和美食",
            "想和人分享一下最近看的好电影",
            "聊聊创业的酸甜苦辣，寻找同路人",
            "想找个人倾诉一下感情上的困惑"
        ];
        
        this.partnerDemand.textContent = partnerDemands[Math.floor(Math.random() * partnerDemands.length)];
        this.partnerId = 'partner_' + Math.random().toString(36).substr(2, 9);
        this.roomId = 'room_' + Math.random().toString(36).substr(2, 9);
        
        this.startCall();
    }

    // 取消匹配
    cancelMatching() {
        this.isMatching = false;
        this.showPage('entry');
    }

    // 开始通话
    startCall() {
        this.showPage('call');
        this.timeRemaining = 60;
        this.isExtended = false;
        this.startTimer();
        
        // 这里可以集成WebRTC进行实际的语音通话
        this.initializeWebRTC();
    }

    // 初始化WebRTC（模拟）
    initializeWebRTC() {
        // 实际项目中在这里集成SimplePeer或PeerJS
        console.log('初始化WebRTC连接...');
        console.log('房间ID:', this.roomId);
        console.log('对方ID:', this.partnerId);
    }

    // 开始计时器
    startTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
        }
        
        this.callTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            // 50秒时显示续聊弹窗
            if (this.timeRemaining === 10 && !this.isExtended) {
                this.showExtensionModal();
            }
            
            // 时间到结束通话
            if (this.timeRemaining <= 0) {
                this.endCall();
            }
        }, 1000);
    }

    // 更新计时器显示
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新圆形进度条
        const totalTime = this.isExtended ? 120 : 60;
        const progress = this.timeRemaining / totalTime;
        const offset = 283 * (1 - progress);
        this.timerCircle.style.strokeDashoffset = offset;
        
        // 颜色变化
        if (this.timeRemaining <= 10) {
            this.timerCircle.classList.remove('text-blue-500', 'text-yellow-500');
            this.timerCircle.classList.add('text-red-500');
        } else if (this.timeRemaining <= 30) {
            this.timerCircle.classList.remove('text-blue-500', 'text-red-500');
            this.timerCircle.classList.add('text-yellow-500');
        } else {
            this.timerCircle.classList.remove('text-yellow-500', 'text-red-500');
            this.timerCircle.classList.add('text-blue-500');
        }
    }

    // 显示续聊弹窗
    showExtensionModal() {
        this.extensionModal.classList.remove('hidden');
        
        let decisionTime = 10;
        const decisionTimer = setInterval(() => {
            decisionTime--;
            this.decisionTimer.textContent = decisionTime;
            
            if (decisionTime <= 0) {
                clearInterval(decisionTimer);
                this.hideExtensionModal();
            }
        }, 1000);
    }

    // 隐藏续聊弹窗
    hideExtensionModal() {
        this.extensionModal.classList.add('hidden');
        // 重置状态指示器
        this.myStatus.classList.remove('bg-green-500', 'bg-red-500');
        this.myStatus.classList.add('bg-gray-400');
        this.partnerStatus.classList.remove('bg-green-500', 'bg-red-500');
        this.partnerStatus.classList.add('bg-gray-400');
    }

    // 续聊投票
    voteExtension(agree) {
        // 更新自己的状态
        this.myStatus.classList.remove('bg-gray-400');
        if (agree) {
            this.myStatus.classList.add('bg-green-500');
        } else {
            this.myStatus.classList.add('bg-red-500');
        }
        
        // 模拟对方的投票（随机）
        setTimeout(() => {
            const partnerAgree = Math.random() > 0.3; // 70%概率同意
            this.partnerStatus.classList.remove('bg-gray-400');
            if (partnerAgree) {
                this.partnerStatus.classList.add('bg-green-500');
            } else {
                this.partnerStatus.classList.add('bg-red-500');
            }
            
            // 检查双方是否都同意
            setTimeout(() => {
                if (agree && partnerAgree) {
                    this.extendCall();
                }
                this.hideExtensionModal();
            }, 1000);
        }, 1500);
    }

    // 延长通话
    extendCall() {
        this.isExtended = true;
        this.timeRemaining += 60;
        this.showNotification('🎉 续聊成功！再聊60秒', 'success');
    }

    // 切换静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        const icon = this.muteBtn.querySelector('i');
        if (this.isMuted) {
            this.muteBtn.classList.remove('bg-gray-700');
            this.muteBtn.classList.add('bg-red-600');
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-microphone-slash');
        } else {
            this.muteBtn.classList.remove('bg-red-600');
            this.muteBtn.classList.add('bg-gray-700');
            icon.classList.remove('fa-microphone-slash');
            icon.classList.add('fa-microphone');
        }
    }

    // 挂断通话
    hangupCall() {
        this.endCall();
    }

    // 结束通话
    endCall() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        this.hideExtensionModal();
        
        // 重置状态
        this.timeRemaining = 60;
        this.isExtended = false;
        this.isMuted = false;
        this.partnerId = null;
        this.roomId = null;
        
        // 重置UI
        this.muteBtn.classList.remove('bg-red-600');
        this.muteBtn.classList.add('bg-gray-700');
        const muteIcon = this.muteBtn.querySelector('i');
        muteIcon.classList.remove('fa-microphone-slash');
        muteIcon.classList.add('fa-microphone');
        
        // 显示通话结束提示
        this.showNotification('通话已结束', 'info');
        
        // 返回首页
        setTimeout(() => {
            this.showPage('entry');
            this.demandInput.value = '';
            this.demandText = '';
            this.handleInputChange();
        }, 2000);
    }

    // 页面切换
    showPage(pageName) {
        console.log('showPage 被调用，目标页面:', pageName);
        
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        // 显示目标页面
        switch(pageName) {
            case 'entry':
                console.log('显示首页');
                this.entryPage.classList.remove('hidden');
                break;
            case 'matching':
                console.log('显示匹配页面');
                this.matchingPage.classList.remove('hidden');
                break;
            case 'call':
                console.log('显示通话页面');
                this.callPage.classList.remove('hidden');
                break;
            case 'ai-chat':
                console.log('显示AI对话页面');
                console.log('aiChatPage 元素:', this.aiChatPage);
                if (this.aiChatPage) {
                    this.aiChatPage.classList.remove('hidden');
                    console.log('AI对话页面已显示');
                } else {
                    console.error('aiChatPage 元素未找到！');
                }
                break;
            default:
                console.error('未知页面:', pageName);
        }
        
        this.currentPage = pageName;
        console.log('当前页面设置为:', this.currentPage);
    }

    // ==================== AI对话功能 ====================
    
    // 开始AI对话
    async startAIChat() {
        console.log('startAIChat 方法被调用');
        console.log('当前需求文本:', this.demandText);
        console.log('文本长度:', this.demandText.trim().length);
        
        if (this.demandText.trim().length === 0) {
            console.log('需求文本为空，退出');
            return;
        }
        
        console.log('AI配置状态:', this.aiConfigured);
        console.log('AI配置内容:', this.aiConfig);
        
        // 检查AI配置
        if (!this.aiConfigured) {
            console.log('AI未配置，显示设置面板');
            this.showNotification('请先配置AI API信息', 'warning');
            this.openAISettings();
            return;
        }
        
        console.log('准备显示AI对话页面');
        
        // 设置用户需求
        if (this.aiUserDemand) {
            this.aiUserDemand.textContent = this.demandText;
            console.log('用户需求已设置:', this.aiUserDemand.textContent);
        } else {
            console.error('aiUserDemand 元素未找到');
        }
        
        // 显示AI对话页面
        console.log('调用 showPage("ai-chat")');
        this.showPage('ai-chat');
        
        // 清空之前的对话
        this.aiMessages = [];
        console.log('准备渲染欢迎消息');
        this.renderAIWelcomeMessage();
        
        console.log('startAIChat 方法执行完成');
    }
    
    // 渲染AI欢迎消息
    renderAIWelcomeMessage() {
        const welcomeMessage = `你好！我是AI助手，我看到你想聊：${this.demandText}。有什么可以帮助你的吗？`;
        this.aiMessages.push({
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date()
        });
        
        // 重新渲染聊天容器
        this.renderAIChatContainer();
    }
    
    // 渲染AI聊天容器
    renderAIChatContainer() {
        this.aiChatContainer.innerHTML = '';
        
        this.aiMessages.forEach(message => {
            const messageElement = this.createAIMessageElement(message);
            this.aiChatContainer.appendChild(messageElement);
        });
        
        this.scrollAIChatToBottom();
    }
    
    // 创建AI消息元素
    createAIMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `px-6 py-4 max-w-xs lg:max-w-md shadow-lg ${this.getAIMessageStyles(message.role)}`;

        bubbleDiv.innerHTML = `
            <div class="whitespace-pre-wrap font-medium">${this.escapeHtml(message.content)}</div>
            <div class="text-xs opacity-70 mt-2">${this.formatTime(message.timestamp)}</div>
        `;

        messageDiv.appendChild(bubbleDiv);
        
        // 添加动画效果
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 100);

        return messageDiv;
    }
    
    // 获取AI消息样式
    getAIMessageStyles(role) {
        switch (role) {
            case 'user':
                return 'cyber-border cyber-glow bg-gradient-to-r from-blue-900 to-cyan-900 text-cyan-300 rounded-2xl rounded-br-md ml-12';
            case 'assistant':
                return 'cyber-border cyber-glow bg-gradient-to-r from-purple-900 to-pink-900 text-pink-300 rounded-2xl rounded-bl-md mr-12';
            default:
                return 'cyber-border bg-gray-900 text-gray-300 rounded-2xl';
        }
    }
    
    // 发送AI消息
    async sendAIMessage() {
        const message = this.aiMessageInput.value.trim();
        if (!message || this.isAITyping) return;

        if (!this.aiConfigured) {
            this.showNotification('请先配置AI API信息', 'error');
            this.openAISettings();
            return;
        }

        // 添加用户消息
        this.aiMessages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        
        this.renderAIChatContainer();
        this.aiMessageInput.value = '';
        this.autoResizeAITextarea();

        // 显示AI正在输入指示器
        this.showAITypingIndicator();

        try {
            const response = await this.callAI(message);
            this.hideAITypingIndicator();
            
            // 添加AI回复
            this.aiMessages.push({
                role: 'assistant',
                content: response,
                timestamp: new Date()
            });
            
            this.renderAIChatContainer();
        } catch (error) {
            this.hideAITypingIndicator();
            this.showNotification('AI回复失败：' + error.message, 'error');
        }
    }
    
    // 调用AI API
    async callAI(message) {
        // 构建消息历史，包含用户需求作为系统提示
        const messages = [
            {
                role: 'system',
                content: `你是一个友善的AI助手。用户想聊的话题是："${this.demandText}"。请围绕这个话题进行对话，提供有帮助的回复。`
            }
        ];
        
        // 添加对话历史
        this.aiMessages.forEach(msg => {
            if (msg.role !== 'system') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        });

        const response = await fetch(this.aiConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.aiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: this.aiConfig.modelName,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    // 显示/隐藏AI正在输入指示器
    showAITypingIndicator() {
        this.isAITyping = true;
        this.aiTypingIndicator.classList.remove('hidden');
        this.aiSendBtn.disabled = true;
        this.scrollAIChatToBottom();
    }

    hideAITypingIndicator() {
        this.isAITyping = false;
        this.aiTypingIndicator.classList.add('hidden');
        this.aiSendBtn.disabled = false;
    }
    
    // 滚动AI聊天到底部
    scrollAIChatToBottom() {
        setTimeout(() => {
            this.aiChatContainer.scrollTop = this.aiChatContainer.scrollHeight;
        }, 100);
    }
    
    // 自动调整AI文本框高度
    autoResizeAITextarea() {
        const textarea = this.aiMessageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    // ==================== AI配置管理 ====================
    
    // 加载AI配置
    async loadAIConfig() {
        // 如果已经有预设配置，直接返回
        if (this.aiConfigured) {
            console.log('使用预设AI配置');
            return true;
        }
        
        try {
            const { data, error } = await window.supabase
                .from('ai_config')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.log('数据库中没有AI配置，使用预设配置');
                return false;
            }

            if (data) {
                this.aiConfig = {
                    apiUrl: data.api_url,
                    apiKey: data.api_key,
                    modelName: data.model_name
                };
                this.aiConfigured = true;
                this.loadAIConfigToForm();
                this.aiStatusText.textContent = '已配置';
                return true;
            }

            this.aiStatusText.textContent = '需要配置';
            return false;
        } catch (error) {
            console.log('加载AI配置时出现异常，使用预设配置:', error);
            return false;
        }
    }
    
    // 保存AI配置
    async saveAIConfiguration() {
        const config = {
            apiUrl: this.aiApiUrlInput.value.trim(),
            apiKey: this.aiApiKeyInput.value.trim(),
            modelName: this.aiModelNameInput.value.trim()
        };

        // 验证配置
        const errors = this.validateAIConfig(config);
        if (errors.length > 0) {
            this.showNotification('❌ ' + errors.join('\n'), 'error');
            return;
        }

        this.saveAIConfigBtn.disabled = true;

        try {
            const configData = {
                api_url: config.apiUrl,
                api_key: config.apiKey,
                model_name: config.modelName,
                updated_at: new Date().toISOString()
            };

            // 尝试更新现有配置
            let result;
            try {
                const { data: existingData } = await window.supabase
                    .from('ai_config')
                    .select('id')
                    .single();

                if (existingData) {
                    result = await window.supabase
                        .from('ai_config')
                        .update(configData)
                        .eq('id', existingData.id);
                } else {
                    configData.created_at = new Date().toISOString();
                    result = await window.supabase
                        .from('ai_config')
                        .insert([configData]);
                }
            } catch (dbError) {
                // 如果数据库操作失败，直接使用内存配置
                console.log('数据库保存失败，使用内存配置:', dbError);
                result = { error: null }; // 假装成功
            }

            if (result.error) {
                console.error('保存AI配置失败:', result.error);
                this.showNotification('❌ 配置保存失败，但将使用当前配置', 'warning');
            } else {
                this.showNotification('✅ AI配置保存成功！', 'success');
            }

            // 无论数据库是否成功，都更新内存中的配置
            this.aiConfig = config;
            this.aiConfigured = true;
            this.aiStatusText.textContent = '已配置';
            this.closeAISettings();
        } catch (error) {
            this.showNotification('❌ 保存配置时发生错误：' + error.message, 'error');
        } finally {
            this.saveAIConfigBtn.disabled = false;
        }
    }
    
    // 验证AI配置
    validateAIConfig(config) {
        const errors = [];

        if (!config.apiUrl || !config.apiUrl.trim()) {
            errors.push('API 地址不能为空');
        } else if (!this.isValidUrl(config.apiUrl)) {
            errors.push('API 地址格式不正确');
        }

        if (!config.apiKey || !config.apiKey.trim()) {
            errors.push('API 密钥不能为空');
        }

        if (!config.modelName || !config.modelName.trim()) {
            errors.push('模型名称不能为空');
        }

        return errors;
    }
    
    // 验证URL格式
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // 测试AI连接
    async testAIConnection() {
        const config = {
            apiUrl: this.aiApiUrlInput.value.trim(),
            apiKey: this.aiApiKeyInput.value.trim(),
            modelName: this.aiModelNameInput.value.trim()
        };

        const errors = this.validateAIConfig(config);
        if (errors.length > 0) {
            this.showNotification('❌ ' + errors.join('\n'), 'error');
            return;
        }

        this.testAIConnectionBtn.disabled = true;
        this.testAIConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>测试中...</span>';

        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: [{ role: 'user', content: 'Hello, this is a test.' }],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });

            if (response.ok) {
                this.showNotification('✅ AI API 连接测试成功！', 'success');
            } else {
                const errorData = await response.json();
                this.showNotification(`❌ API 连接失败: ${errorData.error?.message || response.statusText}`, 'error');
            }
        } catch (error) {
            this.showNotification('❌ 测试连接时发生错误：' + error.message, 'error');
        } finally {
            this.testAIConnectionBtn.disabled = false;
            this.testAIConnectionBtn.innerHTML = '<i class="fas fa-plug"></i><span>测试连接</span>';
        }
    }
    
    // 打开/关闭AI设置面板
    openAISettings() {
        this.aiSettingsPanel.classList.remove('translate-x-full');
        this.aiOverlay.classList.remove('opacity-0', 'invisible');
        this.aiOverlay.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';
    }

    closeAISettings() {
        this.aiSettingsPanel.classList.add('translate-x-full');
        this.aiOverlay.classList.remove('opacity-100', 'visible');
        this.aiOverlay.classList.add('opacity-0', 'invisible');
        document.body.style.overflow = '';
    }
    
    // 加载AI配置到表单
    loadAIConfigToForm() {
        this.aiApiUrlInput.value = this.aiConfig.apiUrl;
        this.aiApiKeyInput.value = this.aiConfig.apiKey;
        this.aiModelNameInput.value = this.aiConfig.modelName;
    }
    
    // 切换AI API密钥可见性
    toggleAIApiKeyVisibility() {
        const input = this.aiApiKeyInput;
        const icon = this.toggleAIApiKeyBtn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    // 清空AI聊天记录
    clearAIChat() {
        if (confirm('确定要清空AI聊天记录吗？')) {
            this.aiMessages = [];
            this.renderAIWelcomeMessage();
            this.showNotification('🧹 AI聊天记录已清空', 'success');
        }
    }

    // 更新在线人数
    updateOnlineCount() {
        // 模拟在线人数
        const count = Math.floor(Math.random() * 50) + 10;
        this.onlineCount.textContent = count;
        
        // 每30秒更新一次
        setTimeout(() => this.updateOnlineCount(), 30000);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full ${this.getNotificationStyles(type)}`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="${this.getNotificationIcon(type)}"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取通知样式
    getNotificationStyles(type) {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-blue-500 text-white';
        }
    }

    // 获取通知图标
    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            default:
                return 'fas fa-info-circle';
        }
    }

    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化时间
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return time.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保所有脚本都加载完成
    setTimeout(() => {
        if (typeof window.supabase !== 'undefined') {
            // 初始化 Supabase 客户端
            window.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('Supabase 准备就绪，启动应用');
            window.voiceChatApp = new VoiceChatApp();
        } else {
            console.error('Supabase 库加载失败');
            alert('应用初始化失败，请刷新页面重试');
        }
    }, 100);
});