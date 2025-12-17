// ========== STATE MANAGEMENT ==========
let posts = [];
let currentUser = {
    name: 'Usuario',
    avatar: '👤',
    photo: null, // URL de la foto de perfil en base64
    followers: 0,
    following: []
};
let searchQuery = '';
let currentFilter = 'all';
let currentSort = 'desc';
let isFiltering = false;
let currentPostImage = null; // Imagen temporal para el post actual (deprecated)
let currentPostImages = []; // Array de imágenes temporales para el post actual
let savedPosts = []; // IDs de posts guardados
let followingUsers = []; // Array de nombres de usuarios que seguimos
let notifications = []; // Array de notificaciones
let draftPosts = []; // Posts guardados como borradores
let scheduledPosts = []; // Posts programados para publicarse después

// ========== MESSAGING STATE ==========
let conversations = [];
let activeConversation = null;
let allUsers = [];
let typingTimeout = null;
let isTyping = false;

// ========== DOM ELEMENTS ==========
const postForm = document.getElementById('postForm');
const postContent = document.getElementById('postContent');
const charCount = document.getElementById('charCount');
const postsContainer = document.getElementById('postsContainer');
const emptyState = document.getElementById('emptyState');
const postCountElement = document.getElementById('postCountNum');
const likesCountElement = document.getElementById('likesCountNum');
const commentsCountElement = document.getElementById('commentsCountNum');

// User elements
const currentUserName = document.getElementById('currentUserName');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const postUserName = document.getElementById('postUserName');
const postUserAvatar = document.getElementById('postUserAvatar');
const userButton = document.getElementById('userButton');
const userModal = document.getElementById('userModal');
const closeModalBtn = document.getElementById('closeModal');
const userForm = document.getElementById('userForm');
const userNameInput = document.getElementById('userNameInput');

// Search elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

// Theme removed: app uses single light theme (UI and styles reflect light mode)

// Stats elements
const userPostsCount = document.getElementById('userPostsCount');
const userLikesCount = document.getElementById('userLikesCount');
const userCommentsCount = document.getElementById('userCommentsCount');

// Image elements
const imageButton = document.getElementById('imageButton');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

// Profile photo elements
const profilePhotoInput = document.getElementById('profilePhotoInput');
const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
const profilePhotoAvatar = document.getElementById('profilePhotoAvatar');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const removePhotoBtn = document.getElementById('removePhotoBtn');

// Messaging elements
const messagesButton = document.getElementById('messagesButton');
const messagesModal = document.getElementById('messagesModal');
const closeMessagesBtn = document.getElementById('closeMessages');
const conversationsList = document.getElementById('conversationsList');
const chatView = document.getElementById('chatView');
const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const newChatBtn = document.getElementById('newChatBtn');
const usersList = document.getElementById('usersList');
const chatHeader = document.getElementById('chatHeader');
const typingIndicator = document.getElementById('typingIndicator');

// Stats elements
const statsButton = document.getElementById('statsButton');
const statsModal = document.getElementById('statsModal');

// Notifications elements
const notificationsButton = document.getElementById('notificationsButton');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.getElementById('notificationsList');
const notificationBadge = document.getElementById('notificationBadge');
const clearAllNotifications = document.getElementById('clearAllNotifications');

// Delete confirmation elements
const deleteModal = document.getElementById('deleteModal');
let postToDelete = null;
// Soft-delete / undo state
let lastDeleted = null; // { post, index }
let undoTimeoutId = null;
// Edit post state
let currentEditPostId = null;
let editTempImages = []; // base64 or URLs
let editTempVideoUrl = '';
let currentPoll = null; // { question: string, options: [{text: string}] }

// Hamburger menu elements
const hamburgerMenu = document.getElementById('hamburgerMenu');
const headerActions = document.getElementById('headerActions');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadPosts();
    loadFilterState();
    loadSavedPosts();
    loadFollowing();
    renderPosts();
    updateAllStats();
    
    // Event listeners
    postForm.addEventListener('submit', handlePostSubmit);
    postContent.addEventListener('input', handleTextareaInput);
    userButton.addEventListener('click', openUserModal);
    closeModalBtn.addEventListener('click', closeUserModal);
    userForm.addEventListener('submit', handleUserSubmit);
    clearSearchBtn.addEventListener('click', clearSearch);
    // theme toggle removed
    
    // Image event listeners
    imageButton.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
    removeImageBtn.addEventListener('click', removePostImage);
    
    // Video picker event listeners
    const videoButton = document.getElementById('videoButton');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const addVideoBtn = document.getElementById('addVideoBtn');
    
    if (videoButton) videoButton.addEventListener('click', toggleVideoModal);
    if (closeVideoModal) closeVideoModal.addEventListener('click', () => {
        const videoModal = document.getElementById('videoModal');
        if (videoModal) videoModal.style.display = 'none';
    });
    if (addVideoBtn) addVideoBtn.addEventListener('click', addVideoUrl);

    // Poll event listeners
    const pollButton = document.getElementById('pollButton');
    const closePollModal = document.getElementById('closePollModal');
    const addPollOption = document.getElementById('addPollOption');
    const createPollBtn = document.getElementById('createPollBtn');
    
    if (pollButton) pollButton.addEventListener('click', togglePollModal);
    if (closePollModal) closePollModal.addEventListener('click', () => {
        const pollModal = document.getElementById('pollModal');
        if (pollModal) pollModal.style.display = 'none';
    });
    if (addPollOption) addPollOption.addEventListener('click', addPollOptionField);
    if (createPollBtn) createPollBtn.addEventListener('click', createPoll);

    // Draft and schedule event listeners
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const scheduleBtn = document.getElementById('scheduleBtn');
    const closeScheduleModal = document.getElementById('closeScheduleModal');
    const confirmScheduleBtn = document.getElementById('confirmScheduleBtn');
    const closeDraftsBtn = document.getElementById('closeDraftsBtn');
    
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);
    if (scheduleBtn) scheduleBtn.addEventListener('click', openScheduleModal);
    if (closeScheduleModal) closeScheduleModal.addEventListener('click', () => {
        const scheduleModal = document.getElementById('scheduleModal');
        if (scheduleModal) scheduleModal.style.display = 'none';
    });
    if (confirmScheduleBtn) confirmScheduleBtn.addEventListener('click', schedulePost);
    if (closeDraftsBtn) closeDraftsBtn.addEventListener('click', closeDrafts);
    
    // Draft tabs
    document.querySelectorAll('.draft-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.draft-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById('draftsContainer').style.display = tabName === 'drafts' ? 'block' : 'none';
            document.getElementById('scheduledContainer').style.display = tabName === 'scheduled' ? 'block' : 'none';
        });
    });
    
    // Load drafts and scheduled posts
    loadDrafts();
    loadScheduledPosts();
    checkScheduledPosts(); // Check if any posts should be published
    setInterval(checkScheduledPosts, 60000); // Check every minute

    // Undo snackbar
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undoDelete);
    
    // Profile photo event listeners
    uploadPhotoBtn.addEventListener('click', () => profilePhotoInput.click());
    profilePhotoInput.addEventListener('change', handleProfilePhotoSelect);
    removePhotoBtn.addEventListener('click', removeProfilePhoto);
    // Edit modal image input
    const editImageInput = document.getElementById('editImageInput');
    if (editImageInput) editImageInput.addEventListener('change', handleEditImageSelect);
    
    // Filter and sort event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            saveFilterState();
            renderPostsWithAnimation();
        });
    });
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = sortSelect.value;
            saveFilterState();
            renderPostsWithAnimation();
        });
    }
    
    // Search event listener
    searchInput.addEventListener('input', handleSearch);
    
    // Messaging event listeners
    if (messagesButton) messagesButton.addEventListener('click', openMessagesModal);
    if (closeMessagesBtn) closeMessagesBtn.addEventListener('click', closeMessagesModal);
    if (newChatBtn) newChatBtn.addEventListener('click', showUsersList);
    if (messageForm) messageForm.addEventListener('submit', sendMessage);
    
    // Stats event listener
    if (statsButton) statsButton.addEventListener('click', openStatsModal);
    
    // Notifications event listeners
    if (notificationsButton) notificationsButton.addEventListener('click', toggleNotificationsPanel);
    if (clearAllNotifications) clearAllNotifications.addEventListener('click', clearAllNotifs);
    
    // Close notifications panel when clicking outside
    document.addEventListener('click', (e) => {
        if (notificationsPanel && notificationsPanel.classList.contains('active')) {
            if (!notificationsPanel.contains(e.target) && !notificationsButton.contains(e.target)) {
                closeNotificationsPanel();
            }
        }
    });
    
    // Load notifications
    loadNotifications();
    
    // Hamburger menu event listener
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (headerActions && headerActions.classList.contains('active')) {
            if (!headerActions.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });
    
    // Close mobile menu when clicking any menu item
    if (headerActions) {
        headerActions.querySelectorAll('button, .badge').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMobileMenu();
                }
            });
        });
    }
    if (messageInput) {
        messageInput.addEventListener('input', handleTypingIndicator);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                messageForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    // Load messaging data
    loadConversations();
    loadAllUsers();
    
    // Close modal on backdrop click
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            closeUserModal();
        }
    });
});

// Accessibility: manage modal aria-hidden and focus restore
const openModalsStack = [];
function setModalOpen(modalEl, open = true) {
    if (!modalEl) return;
    if (open) {
        modalEl.classList.add('active');
        modalEl.setAttribute('aria-hidden', 'false');
        openModalsStack.push(modalEl);
        // save previous focus
        modalEl.__previousFocus = document.activeElement;
        // focus first focusable
        const focusable = modalEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
        document.body.classList.add('modal-open');
    } else {
        modalEl.classList.remove('active');
        modalEl.setAttribute('aria-hidden', 'true');
        const idx = openModalsStack.indexOf(modalEl);
        if (idx > -1) openModalsStack.splice(idx, 1);
        document.body.classList.remove('modal-open');
        // restore focus
        try {
            const prev = modalEl.__previousFocus;
            if (prev && typeof prev.focus === 'function') prev.focus();
        } catch (e) {}
    }
}

// Close topmost modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (openModalsStack.length > 0) {
            const top = openModalsStack[openModalsStack.length - 1];
            if (top && top.id === 'editModal') closeEditModal();
            else if (top && top.id === 'userModal') closeUserModal();
            else if (top && top.id === 'messagesModal') closeMessagesModal();
            else if (top && top.id === 'statsModal') closeStatsModal();
            else if (top && top.id === 'deleteModal') closeDeleteModal();
            else if (top && top.id === 'likedByModal') closeLikedByModal();
        }
    }
});

// ========== SMOOTH COUNTER UPDATES ==========
function updatePostCountsUI(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (!card) return;

    const likeSpan = card.querySelector('.btn-like span');
    const commentSpan = card.querySelector('.btn-comment span');
    const saveBtn = card.querySelector('.btn-save');

    if (likeSpan) {
        animateCount(likeSpan, parseInt(likeSpan.textContent || '0', 10), post.likes || 0);
    }

    if (commentSpan) {
        animateCount(commentSpan, parseInt(commentSpan.textContent || '0', 10), (post.comments || []).length);
    }

    if (saveBtn) {
        if (savedPosts.includes(postId)) saveBtn.classList.add('saved');
        else saveBtn.classList.remove('saved');
    }
}

// Animate numeric count from `from` to `to` over `duration` ms
function animateCount(el, from, to, duration = 600) {
    if (!el) return;
    from = Number.isFinite(from) ? from : parseInt(el.textContent || '0', 10) || 0;
    to = Number.isFinite(to) ? to : parseInt(String(to), 10) || 0;
    if (from === to) {
        el.textContent = String(to);
        return;
    }

    // Cancel any ongoing animation
    if (el.__countAnimFrame) {
        cancelAnimationFrame(el.__countAnimFrame);
        el.__countAnimFrame = null;
    }

    const start = performance.now();
    const diff = to - from;

    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(from + diff * eased);
        el.textContent = String(current);
        if (t < 1) {
            el.__countAnimFrame = requestAnimationFrame(step);
        } else {
            el.textContent = String(to);
            el.__countAnimFrame = null;
        }
    }

    el.__countAnimFrame = requestAnimationFrame(step);
}

// ========== LOCAL STORAGE FUNCTIONS ==========
function savePosts() {
    localStorage.setItem('socialHubPosts', JSON.stringify(posts));
}

function loadPosts() {
    const storedPosts = localStorage.getItem('socialHubPosts');
    if (storedPosts) {
        posts = JSON.parse(storedPosts);
        // Migrate old posts without author
        posts = posts.map(post => {
            if (!post.author) {
                post.author = { name: 'Usuario Antiguo', avatar: '👤', photo: null };
            }
            if (post.comments) {
                post.comments = post.comments.map(comment => {
                    if (!comment.author) {
                        comment.author = { name: 'Usuario Antiguo', avatar: '👤', photo: null };
                    }
                    return comment;
                });
            }
            // Add pinned property if missing
            if (post.pinned === undefined) {
                post.pinned = false;
            }
            // Add likedBy array if missing
            if (!post.likedBy) {
                post.likedBy = [];
            }
            return post;
        });
        savePosts();
    } else {
        // Crear posts de ejemplo con diferentes usuarios
        posts = [
            {
                id: Date.now() - 7200000,
                content: '¡Hola a todos! 👋 Acabo de unirme a esta increíble red social. ¿Alguien más aquí es nuevo?',
                date: new Date(Date.now() - 7200000).toISOString(),
                likes: 12,
                liked: false,
                comments: [
                    {
                        id: Date.now() - 7100000,
                        text: '¡Bienvenida! Esta comunidad es genial 😊',
                        date: new Date(Date.now() - 7100000).toISOString(),
                        mediaUrl: null,
                        parentId: null,
                        replies: [],
                        author: { name: 'Carlos Méndez', avatar: '👨‍💻', photo: null }
                    }
                ],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'María García', avatar: '👩‍🎨', photo: null }
            },
            {
                id: Date.now() - 5400000,
                content: '¿Qué opinan del nuevo diseño? Me encanta lo minimalista que es 🎨✨',
                date: new Date(Date.now() - 5400000).toISOString(),
                likes: 8,
                liked: false,
                comments: [],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'Alex Rivera', avatar: '🎨', photo: null }
            },
            {
                id: Date.now() - 3600000,
                content: 'Compartiendo mi setup de trabajo desde casa 💻 ¿Les gusta? La productividad ha aumentado un 200%!',
                date: new Date(Date.now() - 3600000).toISOString(),
                likes: 24,
                liked: false,
                comments: [
                    {
                        id: Date.now() - 3500000,
                        text: '¡Wow! Se ve increíble, ¿qué monitor es ese?',
                        date: new Date(Date.now() - 3500000).toISOString(),
                        mediaUrl: null,
                        parentId: null,
                        replies: [],
                        author: { name: 'Laura Santos', avatar: '👩‍💼', photo: null }
                    }
                ],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'Carlos Méndez', avatar: '👨‍💻', photo: null }
            },
            {
                id: Date.now() - 1800000,
                content: '¿Alguien más está emocionado por el fin de semana? 🎉 Tengo planes increíbles: película, pizza y mucho descanso 🍕',
                date: new Date(Date.now() - 1800000).toISOString(),
                likes: 15,
                liked: false,
                comments: [
                    {
                        id: Date.now() - 1700000,
                        text: '¡Suena perfecto! Yo voy a una exposición de arte 🎨',
                        date: new Date(Date.now() - 1700000).toISOString(),
                        mediaUrl: null,
                        parentId: null,
                        replies: [],
                        author: { name: 'María García', avatar: '👩‍🎨', photo: null }
                    }
                ],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'Laura Santos', avatar: '👩‍💼', photo: null }
            },
            {
                id: Date.now() - 900000,
                content: 'Tip del día: Tomen descansos regulares cuando trabajen en la computadora. Sus ojos se lo agradecerán 👀💙',
                date: new Date(Date.now() - 900000).toISOString(),
                likes: 31,
                liked: false,
                comments: [],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'Dr. Sofía Reyes', avatar: '👩‍⚕️', photo: null }
            },
            {
                id: Date.now() - 300000,
                content: '¡Acabo de terminar mi primer maratón! 🏃‍♂️💪 42km de pura determinación. Nunca se rindan con sus metas.',
                date: new Date(Date.now() - 300000).toISOString(),
                likes: 45,
                liked: false,
                comments: [
                    {
                        id: Date.now() - 250000,
                        text: '¡Felicidades! Eso es inspirador 🎉',
                        date: new Date(Date.now() - 250000).toISOString(),
                        mediaUrl: null,
                        parentId: null,
                        replies: [],
                        author: { name: 'Carlos Méndez', avatar: '👨‍💻', photo: null }
                    },
                    {
                        id: Date.now() - 240000,
                        text: '¡Increíble logro! 💪',
                        date: new Date(Date.now() - 240000).toISOString(),
                        mediaUrl: null,
                        parentId: null,
                        replies: [],
                        author: { name: 'Alex Rivera', avatar: '🎨', photo: null }
                    }
                ],
                images: null,
                image: null,
                shares: 0,
                author: { name: 'Miguel Torres', avatar: '🏃‍♂️', photo: null }
            }
        ];
        savePosts();
    }
}

function saveUser() {
    localStorage.setItem('socialHubUser', JSON.stringify(currentUser));
}

function loadUser() {
    const storedUser = localStorage.getItem('socialHubUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUserUI();
    }
}


function saveFilterState() {
    localStorage.setItem('socialHubFilter', JSON.stringify({
        filter: currentFilter,
        sort: currentSort
    }));
}

function loadFilterState() {
    const savedFilter = localStorage.getItem('socialHubFilter');
    if (savedFilter) {
        const { filter, sort } = JSON.parse(savedFilter);
        currentFilter = filter || 'all';
        currentSort = sort || 'desc';
        
        // Update UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
        });
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = currentSort;
    }
}

function saveSavedPosts() {
    localStorage.setItem('socialHubSavedPosts', JSON.stringify(savedPosts));
}

function loadSavedPosts() {
    const stored = localStorage.getItem('socialHubSavedPosts');
    if (stored) {
        savedPosts = JSON.parse(stored);
    }
}

function saveFollowing() {
    localStorage.setItem('socialHubFollowing', JSON.stringify(followingUsers));
}

function loadFollowing() {
    const stored = localStorage.getItem('socialHubFollowing');
    if (stored) {
        followingUsers = JSON.parse(stored);
    }
}

function saveNotifications() {
    localStorage.setItem('socialHubNotifications', JSON.stringify(notifications));
}

function loadNotifications() {
    const stored = localStorage.getItem('socialHubNotifications');
    if (stored) {
        notifications = JSON.parse(stored);
        updateNotificationBadge();
        renderNotifications();
    }
}

// ========== MESSAGING SYSTEM ==========

// Storage functions
function saveConversations() {
    localStorage.setItem('socialHubConversations', JSON.stringify(conversations));
}

function loadConversations() {
    const stored = localStorage.getItem('socialHubConversations');
    if (stored) {
        conversations = JSON.parse(stored);
    }
}

function saveAllUsers() {
    localStorage.setItem('socialHubAllUsers', JSON.stringify(allUsers));
}

function loadAllUsers() {
    const stored = localStorage.getItem('socialHubAllUsers');
    if (stored) {
        allUsers = JSON.parse(stored);
    }
    
    // Add current user to allUsers if not exists
    const userExists = allUsers.find(u => u.name === currentUser.name);
    if (!userExists) {
        allUsers.push({
            name: currentUser.name,
            avatar: currentUser.avatar,
            photo: currentUser.photo
        });
        saveAllUsers();
    } else {
        // Update current user data
        const index = allUsers.findIndex(u => u.name === currentUser.name);
        allUsers[index] = {
            name: currentUser.name,
            avatar: currentUser.avatar,
            photo: currentUser.photo
        };
        saveAllUsers();
    }
    
    // Collect users from posts
    posts.forEach(post => {
        if (post.author && post.author.name) {
            const exists = allUsers.find(u => u.name === post.author.name);
            if (!exists) {
                allUsers.push({
                    name: post.author.name,
                    avatar: post.author.avatar,
                    photo: post.author.photo
                });
            }
        }
    });
    saveAllUsers();
}

// Modal functions
function openMessagesModal() {
    if (!messagesModal) return;
    setModalOpen(messagesModal, true);
    renderConversations();
}

function closeMessagesModal() {
    if (!messagesModal) return;
    setModalOpen(messagesModal, false);
    activeConversation = null;
}

// Conversation functions
function getOrCreateConversation(otherUserName) {
    const existing = conversations.find(conv => 
        (conv.user1 === currentUser.name && conv.user2 === otherUserName) ||
        (conv.user1 === otherUserName && conv.user2 === currentUser.name)
    );
    
    if (existing) {
        return existing;
    }
    
    const newConv = {
        id: Date.now(),
        user1: currentUser.name,
        user2: otherUserName,
        messages: [],
        lastMessage: null,
        unreadCount: {
            [currentUser.name]: 0,
            [otherUserName]: 0
        }
    };
    
    conversations.push(newConv);
    saveConversations();
    return newConv;
}

function renderConversations() {
    if (!conversationsList) return;
    
    const userConversations = conversations.filter(conv => 
        conv.user1 === currentUser.name || conv.user2 === currentUser.name
    );
    
    if (userConversations.length === 0) {
        conversationsList.innerHTML = '<div class="empty-conversations">No tienes conversaciones aún. ¡Inicia un nuevo chat!</div>';
        return;
    }
    
    // Sort by last message date
    userConversations.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.date) : new Date(0);
        const bTime = b.lastMessage ? new Date(b.lastMessage.date) : new Date(0);
        return bTime - aTime;
    });
    
    conversationsList.innerHTML = userConversations.map(conv => {
        const otherUserName = conv.user1 === currentUser.name ? conv.user2 : conv.user1;
        const otherUser = allUsers.find(u => u.name === otherUserName) || { name: otherUserName, avatar: '👤', photo: null };
        const unread = conv.unreadCount[currentUser.name] || 0;
        
        let avatarHTML;
        if (otherUser.photo) {
            avatarHTML = `<img src="${otherUser.photo}" alt="${otherUser.name}">`;
        } else {
            avatarHTML = otherUser.avatar;
        }
        
        const lastMsgPreview = conv.lastMessage ? 
            `<div class="conv-last-message">${escapeHTML(conv.lastMessage.text.substring(0, 30))}${conv.lastMessage.text.length > 30 ? '...' : ''}</div>` : 
            '<div class="conv-last-message">Nueva conversación</div>';
        
        return `
            <div class="conversation-item ${unread > 0 ? 'unread' : ''}" onclick="openConversation('${escapeHTML(otherUserName)}')">
                <span class="conv-avatar">${avatarHTML}</span>
                <div class="conv-info">
                    <div class="conv-name">${escapeHTML(otherUser.name)}</div>
                    ${lastMsgPreview}
                </div>
                ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
            </div>
        `;
    }).join('');
}

function openConversation(otherUserName) {
    activeConversation = getOrCreateConversation(otherUserName);
    
    // Mark messages as read
    markMessagesAsRead(activeConversation);
    
    renderChat();
    renderConversations(); // Update unread counts
}

function renderChat() {
    if (!activeConversation || !chatView || !messagesContainer) return;
    
    chatView.classList.add('active');
    
    const otherUserName = activeConversation.user1 === currentUser.name ? 
        activeConversation.user2 : activeConversation.user1;
    const otherUser = allUsers.find(u => u.name === otherUserName) || 
        { name: otherUserName, avatar: '👤', photo: null };
    
    let avatarHTML;
    if (otherUser.photo) {
        avatarHTML = `<img src="${otherUser.photo}" alt="${otherUser.name}">`;
    } else {
        avatarHTML = otherUser.avatar;
    }
    
    // Update chat header
    if (chatHeader) {
        chatHeader.innerHTML = `
            <button class="btn-back-chat" onclick="closeChat()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <span class="chat-user-avatar">${avatarHTML}</span>
            <div class="chat-user-name">${escapeHTML(otherUser.name)}</div>
        `;
    }
    
    // Render messages
    messagesContainer.innerHTML = activeConversation.messages.map(msg => {
        const isMine = msg.sender === currentUser.name;
        const formattedTime = formatTime(msg.date);
        
        return `
            <div class="message-item ${isMine ? 'mine' : 'theirs'}">
                <div class="message-bubble">
                    <div class="message-text">${escapeHTML(msg.text)}</div>
                    <div class="message-time">${formattedTime}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function closeChat() {
    if (chatView) {
        chatView.classList.remove('active');
    }
    activeConversation = null;
}

function sendMessage(e) {
    if (e) e.preventDefault();
    
    if (!activeConversation || !messageInput) return;
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    const newMessage = {
        id: Date.now(),
        sender: currentUser.name,
        text: text,
        date: new Date().toISOString(),
        read: false
    };
    
    activeConversation.messages.push(newMessage);
    activeConversation.lastMessage = newMessage;
    
    // Increment unread count for other user
    const otherUserName = activeConversation.user1 === currentUser.name ? 
        activeConversation.user2 : activeConversation.user1;
    activeConversation.unreadCount[otherUserName]++;
    
    saveConversations();
    
    messageInput.value = '';
    isTyping = false;
    hideTypingIndicator();
    
    renderChat();
    renderConversations();
    
    // Simular respuesta automática del otro usuario
    simulateAutoResponse(text);
}

function simulateAutoResponse(userMessage) {
    if (!activeConversation) return;
    
    const otherUserName = activeConversation.user1 === currentUser.name ? 
        activeConversation.user2 : activeConversation.user1;
    
    // Mostrar indicador de "escribiendo..." después de 1-2 segundos
    const typingDelay = Math.random() * 1000 + 1000;
    
    setTimeout(() => {
        if (activeConversation) {
            showTypingIndicator();
        }
    }, typingDelay);
    
    // Enviar respuesta después de 2-4 segundos
    const responseDelay = typingDelay + Math.random() * 2000 + 2000;
    
    setTimeout(() => {
        if (!activeConversation) return;
        
        hideTypingIndicator();
        
        // Generar respuesta contextual basada en el mensaje del usuario
        const response = generateContextualResponse(userMessage);
        
        const autoMessage = {
            id: Date.now(),
            sender: otherUserName,
            text: response,
            date: new Date().toISOString(),
            read: false
        };
        
        activeConversation.messages.push(autoMessage);
        activeConversation.lastMessage = autoMessage;
        activeConversation.unreadCount[currentUser.name]++;
        
        saveConversations();
        
        renderChat();
        renderConversations();
        
        // Marcar como leído automáticamente si estamos viendo el chat
        if (activeConversation) {
            markMessagesAsRead(activeConversation);
            renderConversations();
        }
    }, responseDelay);
}

function generateContextualResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Saludos
    if (lowerMsg.match(/^(hola|hey|hi|buenos días|buenas tardes|buenas noches|qué tal|cómo estás)/)) {
        const greetings = [
            "¡Hola! ¿Cómo estás? 😊",
            "¡Hey! ¿Qué tal todo?",
            "¡Hola! Me alegra saber de ti",
            "¡Hola! ¿Cómo va tu día?",
            "¡Hey! ¿Qué hay de nuevo?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Preguntas
    if (lowerMsg.includes('?') || lowerMsg.match(/^(qué|cómo|cuándo|dónde|por qué|quién)/)) {
        const questionResponses = [
            "Buena pregunta, déjame pensarlo 🤔",
            "Interesante pregunta, ¿tú qué opinas?",
            "Mmm, creo que depende del contexto",
            "No estoy seguro, pero podríamos averiguarlo juntos",
            "Esa es una pregunta complicada, dame un segundo",
            "¡Excelente pregunta! Te respondo en un momento"
        ];
        return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Emociones positivas
    if (lowerMsg.match(/(feliz|contento|alegre|genial|increíble|fantástico|excelente|bien|perfecto|amor|me gusta)/)) {
        const positiveResponses = [
            "¡Qué bueno! Me alegra mucho escucharlo 😊",
            "¡Eso es fantástico! 🎉",
            "¡Me encanta tu energía positiva!",
            "¡Wow! Eso suena genial",
            "¡Qué felicidad! Me contagias 😄",
            "¡Increíble! Cuéntame más"
        ];
        return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }
    
    // Emociones negativas
    if (lowerMsg.match(/(triste|mal|terrible|horrible|enojado|molesto|cansado|difícil|problema)/)) {
        const supportiveResponses = [
            "Lamento escuchar eso 😔 ¿Quieres hablar al respecto?",
            "Entiendo cómo te sientes, estoy aquí para ti",
            "Lo siento mucho, ¿puedo ayudarte en algo?",
            "Eso debe ser difícil, te acompaño",
            "Cuenta conmigo, ¿cómo puedo ayudarte?",
            "No estás solo en esto, hablemos"
        ];
        return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
    }
    
    // Comida
    if (lowerMsg.match(/(comer|comida|hambre|pizza|café|desayuno|almuerzo|cena|restaurante)/)) {
        const foodResponses = [
            "¡Mmm! Ahora me diste hambre 🍕",
            "¡Me encanta ese plan! ¿Dónde?",
            "Suena delicioso, ¿me invitas? 😋",
            "¡Qué rico! Yo también tengo antojo",
            "Excelente idea, yo también estoy hambriento",
            "¡Eso se ve increíble! Disfrútalo"
        ];
        return foodResponses[Math.floor(Math.random() * foodResponses.length)];
    }
    
    // Risa/humor
    if (lowerMsg.match(/(jaja|jeje|lol|😂|🤣|gracioso|divertido|risa)/)) {
        const laughResponses = [
            "Jajaja me hiciste reír 😂",
            "¡Qué divertido! 🤣",
            "Jajaja ¡buenísimo!",
            "Me encanta tu sentido del humor",
            "Jeje eso estuvo bueno 😄",
            "¡No puedo parar de reír! 😆"
        ];
        return laughResponses[Math.floor(Math.random() * laughResponses.length)];
    }
    
    // Agradecimiento
    if (lowerMsg.match(/(gracias|thanks|te agradezco|muchas gracias)/)) {
        const thanksResponses = [
            "¡De nada! Para eso estamos 😊",
            "No hay de qué, un placer",
            "Con gusto, cuando quieras",
            "¡Para eso están los amigos!",
            "Siempre a tu disposición 👍",
            "¡Claro! Cuenta conmigo siempre"
        ];
        return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
    }
    
    // Despedida
    if (lowerMsg.match(/(adiós|chao|bye|hasta luego|nos vemos|me voy)/)) {
        const byeResponses = [
            "¡Hasta luego! Cuídate 👋",
            "¡Adiós! Hablamos pronto",
            "¡Chao! Que te vaya bien",
            "¡Nos vemos! Que estés bien 😊",
            "¡Bye! Hasta la próxima",
            "¡Cuídate mucho! Hablamos luego"
        ];
        return byeResponses[Math.floor(Math.random() * byeResponses.length)];
    }
    
    // Tiempo/clima
    if (lowerMsg.match(/(clima|tiempo|lluvia|sol|calor|frío|día)/)) {
        const weatherResponses = [
            "Sí, el clima está interesante hoy",
            "Totalmente, perfecto para salir",
            "El clima puede cambiar tanto 🌤️",
            "Me encanta este tipo de día",
            "¿Verdad? Yo también lo noté",
            "Esperemos que mejore pronto"
        ];
        return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
    }
    
    // Planes/actividades
    if (lowerMsg.match(/(vamos|hacer|ir|plan|actividad|salir|evento)/)) {
        const plansResponses = [
            "¡Me apunto! ¿Cuándo? 🎉",
            "¡Suena genial! Cuenta conmigo",
            "¡Hagámoslo! ¿Qué día te viene bien?",
            "¡Me encanta la idea! Organicemos",
            "¡Sí! ¿Qué tienes en mente?",
            "¡Perfecto! Avísame los detalles"
        ];
        return plansResponses[Math.floor(Math.random() * plansResponses.length)];
    }
    
    // Números o cifras (estadísticas, fechas, etc)
    if (lowerMsg.match(/\d+/)) {
        const numberResponses = [
            "¡Wow! Esos números son impresionantes",
            "Interesante dato, no lo sabía",
            "¡Guau! Es más de lo que pensaba",
            "Gracias por compartir esa información",
            "Eso es bastante, ¿no?",
            "¡Increíble! No me lo esperaba"
        ];
        return numberResponses[Math.floor(Math.random() * numberResponses.length)];
    }
    
    // Respuestas genéricas para cualquier otro mensaje
    const genericResponses = [
        "Totalmente de acuerdo contigo 👍",
        "Interesante, cuéntame más",
        "¿En serio? ¡Qué genial!",
        "No lo había pensado así 🤔",
        "¡Me encanta tu punto de vista!",
        "Eso es muy interesante",
        "Tienes razón en eso",
        "¡Qué cool lo que dices! 😊",
        "Te entiendo perfectamente",
        "Buena observación",
        "Eso tiene mucho sentido",
        "Déjame pensar en eso...",
        "¡Claro! Tiene lógica",
        "Me parece bien pensado",
        "Esa es una buena forma de verlo"
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

function markMessagesAsRead(conversation) {
    conversation.messages.forEach(msg => {
        if (msg.sender !== currentUser.name && !msg.read) {
            msg.read = true;
        }
    });
    
    conversation.unreadCount[currentUser.name] = 0;
    saveConversations();
}

function handleTypingIndicator() {
    if (!isTyping) {
        isTyping = true;
        showTypingIndicator();
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        hideTypingIndicator();
    }, 1000);
}

function showTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
    }
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

function showUsersList() {
    if (!usersList) return;
    
    const otherUsers = allUsers.filter(u => u.name !== currentUser.name);
    
    if (otherUsers.length === 0) {
        usersList.innerHTML = '<div class="empty-users">No hay otros usuarios disponibles</div>';
        usersList.classList.add('active');
        return;
    }
    
    usersList.innerHTML = `
        <div class="users-list-header">
            <h3>Iniciar conversación</h3>
            <button class="btn-close-users" onclick="closeUsersList()">×</button>
        </div>
        <div class="users-list-content">
            ${otherUsers.map(user => {
                let avatarHTML;
                if (user.photo) {
                    avatarHTML = `<img src="${user.photo}" alt="${user.name}">`;
                } else {
                    avatarHTML = user.avatar;
                }
                
                return `
                    <div class="user-list-item" onclick="startConversationWith('${escapeHTML(user.name)}')">
                        <span class="user-list-avatar">${avatarHTML}</span>
                        <div class="user-list-name">${escapeHTML(user.name)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    usersList.classList.add('active');
}

function closeUsersList() {
    if (usersList) {
        usersList.classList.remove('active');
    }
}

function startConversationWith(userName) {
    closeUsersList();
    openConversation(userName);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    
    return date.toLocaleDateString('es-ES', { day: '2d', month: '2d' });
}

// ========== USER FUNCTIONS ==========
function updateUserUI() {
    currentUserName.textContent = currentUser.name;
    postUserName.textContent = currentUser.name;
    
    // Update avatar or photo
    if (currentUser.photo) {
        currentUserAvatar.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}">`;
        postUserAvatar.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}">`;
    } else {
        currentUserAvatar.textContent = currentUser.avatar;
        postUserAvatar.textContent = currentUser.avatar;
    }
}

function openUserModal() {
    const userModalEl = userModal;
    userNameInput.value = currentUser.name;
    
    // Update profile photo display
    if (currentUser.photo) {
        profilePhotoDisplay.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}">`;
        removePhotoBtn.style.display = 'flex';
    } else {
        profilePhotoDisplay.innerHTML = `<span id="profilePhotoAvatar">${currentUser.avatar}</span>`;
        removePhotoBtn.style.display = 'none';
    }
    
    // Select current avatar
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.avatar === currentUser.avatar) {
            btn.classList.add('selected');
        }
    });
    
    updateUserStats();
    setModalOpen(userModalEl, true);
}

function closeUserModal() {
    setModalOpen(userModal, false);
}

function handleUserSubmit(e) {
    e.preventDefault();
    
    const newName = userNameInput.value.trim();
    if (newName) {
        currentUser.name = newName;
    // Filtro y orden
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            saveFilterState();
            renderPostsWithAnimation();
        });
    });
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = sortSelect.value;
            saveFilterState();
            renderPostsWithAnimation();
        });
    }        // Only update avatar if no photo is set
        if (!currentUser.photo) {
            const selectedAvatar = document.querySelector('.avatar-option.selected');
            if (selectedAvatar) {
                currentUser.avatar = selectedAvatar.dataset.avatar;
            }
        }
        
        saveUser();
        updateUserUI();
        closeUserModal();
        renderPosts(); // Re-render to show updated user info
    }
}

function selectAvatar(avatar) {
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Clear photo when selecting an avatar
    currentUser.photo = null;
    profilePhotoDisplay.innerHTML = `<span id="profilePhotoAvatar">${avatar}</span>`;
    removePhotoBtn.style.display = 'none';
    currentUser.avatar = avatar;
}

function updateUserStats() {
    const userPosts = posts.filter(post => post.author.name === currentUser.name);
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = userPosts.reduce((sum, post) => sum + post.comments.length, 0);
    
    userPostsCount.textContent = userPosts.length;
    userLikesCount.textContent = totalLikes;
    userCommentsCount.textContent = totalComments;
}

// ========== IMAGE FUNCTIONS ==========
// Compress image file to a base64 data URL using canvas
function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(e) {
            img.onload = function() {
                // Calculate target dimensions while keeping aspect ratio
                let [width, height] = [img.width, img.height];
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Determine output type
                const outputType = 'image/jpeg';
                const dataUrl = canvas.toDataURL(outputType, quality);
                resolve(dataUrl);
            };
            img.onerror = function(err) { reject(err); };
            img.src = e.target.result;
        };
        reader.onerror = function(err) { reject(err); };
        reader.readAsDataURL(file);
    });
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    // Limit to 10 images
    if (currentPostImages.length + validImages.length > 10) {
        alert('Puedes subir un máximo de 10 imágenes por publicación.');
        return;
    }
    
    validImages.forEach(file => {
        // If file is very large, warn (but still attempt to compress)
        if (file.size > 8 * 1024 * 1024) {
            alert('Una imagen es muy grande; se intentará comprimirla, pero puede tardar.');
        }

        // Compress image and push base64 result
        compressImageFile(file, 1200, 1200, 0.78).then(dataUrl => {
            currentPostImages.push(dataUrl);
            updateImagePreview();
        }).catch(() => {
            // Fallback to raw base64 if compression fails
            const reader = new FileReader();
            reader.onload = function(event) {
                currentPostImages.push(event.target.result);
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        });
    });
}

function updateImagePreview() {
    const imageCount = document.getElementById('imageCount');
    if (currentPostImages.length > 0) {
        imageCount.textContent = currentPostImages.length;
        imageCount.style.display = 'flex';
        
        // Clear existing preview
        imagePreview.innerHTML = '';
        
        // Create preview grid
        const previewGrid = document.createElement('div');
        previewGrid.className = 'image-preview-grid';
        
        currentPostImages.forEach((img, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${img}" alt="Preview ${index + 1}">
                <button type="button" class="remove-preview-image" data-index="${index}" aria-label="Eliminar imagen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            `;
            previewGrid.appendChild(previewItem);
        });
        
        imagePreview.appendChild(previewGrid);
        imagePreview.style.display = 'block';
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-preview-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeImageAtIndex(index);
            });
        });
    } else {
        imageCount.style.display = 'none';
        imagePreview.style.display = 'none';
    }
}

function removeImageAtIndex(index) {
    currentPostImages.splice(index, 1);
    updateImagePreview();
}

function removePostImage() {
    currentPostImages = [];
    imagePreview.style.display = 'none';
    imageInput.value = '';
    const imageCount = document.getElementById('imageCount');
    if (imageCount) imageCount.style.display = 'none';
}

function handleProfilePhotoSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        // Limit file size to 1MB for profile photos
        if (file.size > 1024 * 1024) {
            alert('La foto es demasiado grande. Por favor, selecciona una imagen menor a 1MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            currentUser.photo = event.target.result;
            profilePhotoDisplay.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}">`;
            removePhotoBtn.style.display = 'flex';
            
            // Deselect all avatars
            document.querySelectorAll('.avatar-option').forEach(btn => {
                btn.classList.remove('selected');
            });
        };
        reader.readAsDataURL(file);
    }
}

function removeProfilePhoto() {
    currentUser.photo = null;
    profilePhotoDisplay.innerHTML = `<span id="profilePhotoAvatar">${currentUser.avatar}</span>`;
    removePhotoBtn.style.display = 'none';
    profilePhotoInput.value = '';
    
    // Select default avatar
    const defaultAvatar = document.querySelector(`.avatar-option[data-avatar="${currentUser.avatar}"]`);
    if (defaultAvatar) {
        defaultAvatar.classList.add('selected');
    }
}

// ========== VIDEO FUNCTIONALITY ==========
let currentVideoUrl = '';

// Video URL functionality
function toggleVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoUrlInput = document.getElementById('videoUrlInput');
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    if (!videoModal) return;
    
    const isActive = videoModal.style.display === 'flex';
    
    if (isActive) {
        videoModal.style.display = 'none';
    } else {
        videoModal.style.display = 'flex';
        if (videoUrlInput) videoUrlInput.value = '';
        if (videoPreviewContainer) videoPreviewContainer.innerHTML = '';
    }
}

function addVideoUrl() {
    const videoUrlInput = document.getElementById('videoUrlInput');
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    const videoModal = document.getElementById('videoModal');
    if (!videoUrlInput) return;
    
    const url = videoUrlInput.value.trim();
    if (!url) return;
    
    const embedUrl = parseVideoUrl(url);
    if (embedUrl) {
        // Show preview
        if (videoPreviewContainer) {
            videoPreviewContainer.innerHTML = `
                <div id="videoPreview">
                    <iframe src="${embedUrl}" allowfullscreen></iframe>
                </div>
            `;
        }
        currentVideoUrl = url;
        
        // Close modal after 1 second
        setTimeout(() => {
            if (videoModal) videoModal.style.display = 'none';
        }, 1000);
    } else {
        alert('URL de video no válida. Por favor, usa un enlace de YouTube o Vimeo.');
    }
}

function parseVideoUrl(url) {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo patterns
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
}

// ========== POLL FUNCTIONS ==========
function togglePollModal() {
    const pollModal = document.getElementById('pollModal');
    if (!pollModal) return;
    
    const isActive = pollModal.style.display === 'flex';
    
    if (isActive) {
        pollModal.style.display = 'none';
    } else {
        pollModal.style.display = 'flex';
        resetPollModal();
    }
}

function resetPollModal() {
    const pollQuestion = document.getElementById('pollQuestion');
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    
    if (pollQuestion) pollQuestion.value = '';
    if (pollOptionsContainer) {
        pollOptionsContainer.innerHTML = `
            <input type="text" class="poll-option-input" placeholder="Opción 1" maxlength="100">
            <input type="text" class="poll-option-input" placeholder="Opción 2" maxlength="100">
        `;
    }
}

function addPollOptionField() {
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    if (!pollOptionsContainer) return;
    
    const currentOptions = pollOptionsContainer.querySelectorAll('.poll-option-input');
    if (currentOptions.length >= 6) {
        showToast('Máximo 6 opciones permitidas');
        return;
    }
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'poll-option-input';
    newInput.placeholder = `Opción ${currentOptions.length + 1}`;
    newInput.maxLength = 100;
    pollOptionsContainer.appendChild(newInput);
}

function createPoll() {
    const pollQuestion = document.getElementById('pollQuestion');
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    const pollModal = document.getElementById('pollModal');
    
    if (!pollQuestion || !pollOptionsContainer) return;
    
    const question = pollQuestion.value.trim();
    if (!question) {
        showToast('Escribe una pregunta para la encuesta');
        return;
    }
    
    const optionInputs = pollOptionsContainer.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(text => text.length > 0);
    
    if (options.length < 2) {
        showToast('Agrega al menos 2 opciones');
        return;
    }
    
    currentPoll = {
        question: question,
        options: options.map(text => ({ text }))
    };
    
    // Show preview in post form
    showPollPreview();
    
    // Close modal
    if (pollModal) pollModal.style.display = 'none';
}

function showPollPreview() {
    let pollPreviewContainer = document.getElementById('pollPreviewContainer');
    
    if (!pollPreviewContainer) {
        // Create container if it doesn't exist
        const postFormFooter = document.querySelector('.post-form-footer');
        pollPreviewContainer = document.createElement('div');
        pollPreviewContainer.id = 'pollPreviewContainer';
        pollPreviewContainer.className = 'poll-preview-container';
        postFormFooter.parentNode.insertBefore(pollPreviewContainer, postFormFooter);
    }
    
    if (currentPoll) {
        pollPreviewContainer.innerHTML = `
            <div class="poll-preview">
                <div class="poll-preview-header">
                    <span>📊 Encuesta: ${escapeHTML(currentPoll.question)}</span>
                    <button type="button" class="btn-remove-poll" onclick="removePoll()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="poll-preview-options">
                    ${currentPoll.options.map(opt => `<span class="poll-preview-option">${escapeHTML(opt.text)}</span>`).join('')}
                </div>
            </div>
        `;
        pollPreviewContainer.style.display = 'block';
    } else {
        pollPreviewContainer.style.display = 'none';
    }
}

function removePoll() {
    currentPoll = null;
    const pollPreviewContainer = document.getElementById('pollPreviewContainer');
    if (pollPreviewContainer) {
        pollPreviewContainer.style.display = 'none';
        pollPreviewContainer.innerHTML = '';
    }
}

// ========== DRAFT AND SCHEDULED POSTS ==========
function loadDrafts() {
    const stored = localStorage.getItem('socialHubDrafts');
    if (stored) {
        draftPosts = JSON.parse(stored);
        updateDraftsCount();
    }
}

function saveDraftsToStorage() {
    localStorage.setItem('socialHubDrafts', JSON.stringify(draftPosts));
}

function loadScheduledPosts() {
    const stored = localStorage.getItem('socialHubScheduled');
    if (stored) {
        scheduledPosts = JSON.parse(stored);
        updateScheduledCount();
    }
}

function saveScheduledToStorage() {
    localStorage.setItem('socialHubScheduled', JSON.stringify(scheduledPosts));
}

function saveDraft() {
    const content = postContent.value.trim();
    if (!content && currentPostImages.length === 0 && !currentVideoUrl && !currentPoll) {
        showToast('Escribe algo para guardar el borrador');
        return;
    }
    
    const draft = {
        id: Date.now(),
        content: content,
        images: currentPostImages.length > 0 ? [...currentPostImages] : null,
        videoUrl: currentVideoUrl || null,
        poll: currentPoll ? {...currentPoll} : null,
        savedAt: new Date().toISOString()
    };
    
    draftPosts.push(draft);
    saveDraftsToStorage();
    updateDraftsCount();
    
    // Clear form
    postForm.reset();
    charCount.textContent = '0/500';
    removePostImage();
    currentVideoUrl = '';
    currentPoll = null;
    
    showToast('✅ Borrador guardado');
    showDraftsSection();
}

function openScheduleModal() {
    const content = postContent.value.trim();
    if (!content && currentPostImages.length === 0 && !currentVideoUrl && !currentPoll) {
        showToast('Escribe algo para programar');
        return;
    }
    
    const scheduleModal = document.getElementById('scheduleModal');
    const dateTimeInput = document.getElementById('scheduleDateTime');
    
    // Set minimum date to now
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    dateTimeInput.min = localDate.toISOString().slice(0, 16);
    dateTimeInput.value = localDate.toISOString().slice(0, 16);
    
    if (scheduleModal) scheduleModal.style.display = 'flex';
}

function schedulePost() {
    const dateTimeInput = document.getElementById('scheduleDateTime');
    const scheduledDate = new Date(dateTimeInput.value);
    
    if (!dateTimeInput.value || scheduledDate <= new Date()) {
        showToast('Selecciona una fecha futura');
        return;
    }
    
    const content = postContent.value.trim();
    
    const scheduled = {
        id: Date.now(),
        content: content,
        images: currentPostImages.length > 0 ? [...currentPostImages] : null,
        videoUrl: currentVideoUrl || null,
        poll: currentPoll ? {...currentPoll} : null,
        scheduledFor: scheduledDate.toISOString(),
        createdAt: new Date().toISOString()
    };
    
    scheduledPosts.push(scheduled);
    saveScheduledToStorage();
    updateScheduledCount();
    
    // Clear form
    postForm.reset();
    charCount.textContent = '0/500';
    removePostImage();
    currentVideoUrl = '';
    currentPoll = null;
    
    const scheduleModal = document.getElementById('scheduleModal');
    if (scheduleModal) scheduleModal.style.display = 'none';
    
    showToast(`📅 Programado para ${formatDate(scheduledDate)}`);
    showDraftsSection();
}

function checkScheduledPosts() {
    const now = new Date();
    const toPublish = scheduledPosts.filter(sp => new Date(sp.scheduledFor) <= now);
    
    toPublish.forEach(sp => {
        publishScheduledPost(sp);
    });
    
    if (toPublish.length > 0) {
        updateScheduledCount();
        renderScheduledPosts();
    }
}

function publishScheduledPost(scheduledPost) {
    const newPost = {
        id: Date.now(),
        content: scheduledPost.content,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        likedBy: [],
        shares: 0,
        comments: [],
        images: scheduledPost.images,
        videoUrl: scheduledPost.videoUrl,
        poll: scheduledPost.poll ? {...scheduledPost.poll, votes: scheduledPost.poll.options.map(() => ({ count: 0, users: [] }))} : null,
        author: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            photo: currentUser.photo
        }
    };
    
    posts.unshift(newPost);
    savePosts();
    
    // Remove from scheduled
    scheduledPosts = scheduledPosts.filter(sp => sp.id !== scheduledPost.id);
    saveScheduledToStorage();
    
    renderPosts();
    updateAllStats();
    showToast('✅ Publicación programada publicada');
    
    // Schedule boost
    try {
        scheduleBoostForPost(newPost.id);
    } catch (e) {
        console.error('scheduleBoostForPost error', e);
    }
}

function showDraftsSection() {
    const draftsSection = document.getElementById('draftsSection');
    if (draftsSection) {
        draftsSection.style.display = 'block';
        renderDrafts();
        renderScheduledPosts();
    }
}

function closeDrafts() {
    const draftsSection = document.getElementById('draftsSection');
    if (draftsSection) draftsSection.style.display = 'none';
}

function updateDraftsCount() {
    const count = document.getElementById('draftsCount');
    if (count) count.textContent = draftPosts.length;
}

function updateScheduledCount() {
    const count = document.getElementById('scheduledCount');
    if (count) count.textContent = scheduledPosts.length;
}

function renderDrafts() {
    const container = document.getElementById('draftsContainer');
    if (!container) return;
    
    if (draftPosts.length === 0) {
        container.innerHTML = '<p class="empty-drafts">No tienes borradores guardados</p>';
        return;
    }
    
    container.innerHTML = draftPosts.map(draft => `
        <div class="draft-item">
            <div class="draft-content">
                <p>${escapeHTML(draft.content || 'Sin contenido')}</p>
                <span class="draft-date">Guardado: ${formatDate(draft.savedAt)}</span>
            </div>
            <div class="draft-actions">
                <button onclick="loadDraft(${draft.id})" class="btn-icon" title="Editar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button onclick="deleteDraft(${draft.id})" class="btn-icon btn-danger" title="Eliminar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderScheduledPosts() {
    const container = document.getElementById('scheduledContainer');
    if (!container) return;
    
    if (scheduledPosts.length === 0) {
        container.innerHTML = '<p class="empty-drafts">No tienes publicaciones programadas</p>';
        return;
    }
    
    container.innerHTML = scheduledPosts.map(sched => `
        <div class="draft-item">
            <div class="draft-content">
                <p>${escapeHTML(sched.content || 'Sin contenido')}</p>
                <span class="draft-date">📅 Se publicará: ${formatDate(sched.scheduledFor)}</span>
            </div>
            <div class="draft-actions">
                <button onclick="cancelScheduled(${sched.id})" class="btn-icon btn-danger" title="Cancelar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function loadDraft(draftId) {
    const draft = draftPosts.find(d => d.id === draftId);
    if (!draft) return;
    
    postContent.value = draft.content || '';
    handleTextareaInput();
    
    if (draft.images) {
        currentPostImages = [...draft.images];
        // Show image preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview && draft.images.length > 0) {
            imagePreview.classList.remove('hidden');
            // Render images
        }
    }
    
    if (draft.videoUrl) currentVideoUrl = draft.videoUrl;
    if (draft.poll) {
        currentPoll = {...draft.poll};
        showPollPreview();
    }
    
    // Delete draft
    deleteDraft(draftId);
    closeDrafts();
    showToast('Borrador cargado');
}

function deleteDraft(draftId) {
    draftPosts = draftPosts.filter(d => d.id !== draftId);
    saveDraftsToStorage();
    updateDraftsCount();
    renderDrafts();
}

function cancelScheduled(schedId) {
    scheduledPosts = scheduledPosts.filter(s => s.id !== schedId);
    saveScheduledToStorage();
    updateScheduledCount();
    renderScheduledPosts();
    showToast('Publicación programada cancelada');
}

// ========== REPOST ==========
function repostPost(postId) {
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) return;
    
    const repost = {
        id: Date.now(),
        content: originalPost.content,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        likedBy: [],
        shares: 0,
        comments: [],
        images: originalPost.images,
        videoUrl: originalPost.videoUrl,
        poll: originalPost.poll ? {...originalPost.poll, votes: originalPost.poll.options.map(() => ({ count: 0, users: [] }))} : null,
        isRepost: true,
        originalPost: originalPost.id,
        originalAuthor: originalPost.author,
        author: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            photo: currentUser.photo
        }
    };
    
    posts.unshift(repost);
    savePosts();
    renderPosts();
    updateAllStats();
    
    showToast('✅ Post reposteado en tu feed');
}

// Close pickers when clicking outside (initialized after DOM is loaded)
// ========== THEME FUNCTIONS ==========
function toggleTheme() {
    // Theme switching removed. This function is deprecated and kept as no-op for compatibility.
}

function updateThemeIcon(theme) {
    // Icon update removed along with theme button.
}

// ========== SEARCH FUNCTIONS ==========
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
    renderPostsWithAnimation();
}

function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderPostsWithAnimation();
}

function filterPosts() {
    let filtered = [...posts];
    
    // Apply search filter
    if (searchQuery) {
        // Parse special tokens: @author, #hashtag, from:YYYY-MM-DD, to:YYYY-MM-DD
        const tokens = searchQuery.split(/\s+/).filter(Boolean);
        const textTokens = [];
        let authorToken = null;
        const hashtags = [];
        let fromDate = null;
        let toDate = null;

        tokens.forEach(t => {
            if (t.startsWith('@')) {
                authorToken = t.slice(1).toLowerCase();
            } else if (t.startsWith('#')) {
                hashtags.push(t.slice(1).toLowerCase());
            } else if (t.startsWith('from:')) {
                const d = t.slice(5);
                const parsed = new Date(d);
                if (!isNaN(parsed)) fromDate = parsed;
            } else if (t.startsWith('to:')) {
                const d = t.slice(3);
                const parsed = new Date(d);
                if (!isNaN(parsed)) toDate = parsed;
            } else {
                textTokens.push(t.toLowerCase());
            }
        });

        filtered = filtered.filter(post => {
            // Text tokens must be present in content or author
            const content = (post.content || '').toLowerCase();
            const author = (post.author && post.author.name || '').toLowerCase();

            if (authorToken && !author.includes(authorToken)) return false;

            // Check hashtags: simple extraction of words starting with # in content
            if (hashtags.length > 0) {
                const postTags = (post.content || '').toLowerCase().match(/#([a-z0-9_\-]+)/g) || [];
                const normalized = postTags.map(t => t.replace('#',''));
                for (const h of hashtags) {
                    if (!normalized.includes(h)) return false;
                }
            }

            // Date range
            if (fromDate || toDate) {
                const pd = new Date(post.date);
                if (fromDate && pd < fromDate) return false;
                if (toDate && pd > toDate) return false;
            }

            // Remaining text tokens
            if (textTokens.length > 0) {
                const matches = textTokens.every(tok => content.includes(tok) || author.includes(tok));
                if (!matches) return false;
            }

            return true;
        });
    }
    
    // Apply category filter
    if (currentFilter === 'image') {
        filtered = filtered.filter(post => post.image);
    } else if (currentFilter === 'likes') {
        filtered = filtered.filter(post => post.likes > 0);
    } else if (currentFilter === 'saved') {
        filtered = filtered.filter(post => savedPosts.includes(post.id));
    }
    // 'recent' and 'all' don't need filtering, just sorting
    
    // Apply sorting (priority: currentSort > currentFilter)
    if (currentSort === 'likes') {
        filtered.sort((a, b) => b.likes - a.likes);
    } else if (currentSort === 'asc') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (currentSort === 'desc') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentFilter === 'likes') {
        filtered.sort((a, b) => b.likes - a.likes);
    } else if (currentFilter === 'recent') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
        // Default: most recent first
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return filtered;
}

function renderPostsWithAnimation() {
    // Fade out
    postsContainer.style.opacity = '0';
    postsContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        renderPosts();
        
        // Fade in
        setTimeout(() => {
            postsContainer.style.opacity = '1';
            postsContainer.style.transform = 'translateY(0)';
        }, 50);
    }, 300);
}

// ========== POST FUNCTIONS ==========
function handlePostSubmit(e) {
    e.preventDefault();
    
    const content = postContent.value.trim();
    if (!content) return;
    
    // Show loading bar
    showLoadingBar();
    
    // Simulate upload delay for animation
    setTimeout(() => {
        const newPost = {
            id: Date.now(),
            content: content,
            date: new Date().toISOString(),
            likes: 0,
            liked: false,
            shares: 0,
            comments: [],
            image: currentPostImage, // Keep for backwards compatibility
            images: currentPostImages.length > 0 ? [...currentPostImages] : null,
            videoUrl: currentVideoUrl || null,
            poll: currentPoll ? { ...currentPoll, votes: currentPoll.options.map(() => ({ count: 0, users: [] })) } : null,
            author: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                photo: currentUser.photo
            }
        };
        
        posts.unshift(newPost);
        savePosts();
        renderPosts();
        updateAllStats();
        
        // Reset form
        postForm.reset();
        charCount.textContent = '0/500';
        removePostImage();
        currentVideoUrl = '';
        currentPoll = null;
        const videoPreviewContainer = document.getElementById('videoPreviewContainer');
        if (videoPreviewContainer) videoPreviewContainer.innerHTML = '';
        const pollPreviewContainer = document.getElementById('pollPreviewContainer');
        if (pollPreviewContainer) pollPreviewContainer.innerHTML = '';
        
        // Clear search when posting
        if (searchQuery) {
            clearSearch();
        }
        
        // Complete loading bar
        completeLoadingBar();
        
        // Add success animation to new post
        setTimeout(() => {
            const newPostCard = document.querySelector('.post-card');
            if (newPostCard) {
                newPostCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 800);
        // Schedule an automatic "boost" for this new post (likes/comments/saved)
        try {
            scheduleBoostForPost(newPost.id);
        } catch (e) {
            console.error('scheduleBoostForPost error', e);
        }
    }, 1000); // 1 second simulated delay
}

// ========== AUTO-BOOST (simulate organic engagement) ==========
const _fakeNames = [
    'Ana', 'Luis', 'Carla', 'Diego', 'Sofía', 'Mateo', 'Lucía', 'Marcos', 'Elena', 'Javier',
    'Camila', 'Pablo', 'Valeria', 'Andrés', 'Marta', 'Ricardo', 'Irene', 'Tomás', 'Nora', 'Héctor'
];

const _fakeComments = [
    '¡Me encanta esto!',
    'Totalmente de acuerdo 😊',
    'Wow, impresionante 😍',
    'Genial, gracias por compartir 👍',
    'Esto es justo lo que necesitaba ver hoy',
    '¿Dónde conseguiste eso?',
    'Buenísimo, lo voy a intentar',
    'Jajaja me identifiqué mucho',
    'Qué inspiración 🔥',
    'Gracias por compartir tu experiencia'
];

function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function scheduleBoostForPost(postId, opts = {}) {
    const delay = typeof opts.delayMs === 'number' ? opts.delayMs : (3000 + Math.random() * 5000);
    const likeTarget = typeof opts.likeTarget === 'number' ? opts.likeTarget : (Math.floor(Math.random() * 400) + 50);
    const commentCount = typeof opts.commentCount === 'number' ? opts.commentCount : (Math.floor(Math.random() * 18) + 3);

    setTimeout(() => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        // Gradually add likes so it looks organic, but update UI gently (no full re-render)
        let added = 0;
        const steps = Math.max(3, Math.floor(Math.random() * 8));
        const stepSize = Math.ceil(likeTarget / steps);
        const likeInterval = setInterval(() => {
            const inc = Math.min(stepSize, likeTarget - added);
            if (inc <= 0) {
                clearInterval(likeInterval);
                return;
            }
            post.likes = (post.likes || 0) + inc;
            
            // Add fake users to likedBy array
            if (!post.likedBy) post.likedBy = [];
            for (let j = 0; j < inc; j++) {
                const fakeName = _randomFrom(_fakeNames) + Math.floor(Math.random() * 10000);
                post.likedBy.push({
                    name: fakeName,
                    avatar: '👤',
                    photo: null
                });
            }
            
            added += inc;
            savePosts();
            updateAllStats();
            // Update only counters in DOM and apply a soft pulse (debounced)
            updatePostCountsUI(postId);
            if (added >= likeTarget) clearInterval(likeInterval);
        }, 700 + Math.random() * 800);

        // Add several fake comments spaced out a bit
        for (let i = 0; i < commentCount; i++) {
            setTimeout(() => {
                const fake = {
                    id: Date.now() + Math.floor(Math.random() * 1000000) + i,
                    text: _randomFrom(_fakeComments),
                    date: new Date().toISOString(),
                    mediaUrl: null,
                    parentId: null,
                    replies: [],
                    author: {
                        name: _randomFrom(_fakeNames),
                        avatar: '👤',
                        photo: null
                    }
                };
                post.comments = post.comments || [];
                post.comments.push(fake);
                savePosts();
                updateAllStats();
                // Update only the comment counter UI for smoothness
                updatePostCountsUI(postId);
            }, 800 + i * (300 + Math.random() * 400));
        }

        // Auto-vote in polls if post has one
        if (post.poll && post.poll.votes) {
            const voteCount = Math.floor(Math.random() * 30) + 10; // 10-40 votos automáticos
            for (let i = 0; i < voteCount; i++) {
                setTimeout(() => {
                    // Pick a random option weighted by position (first options get more votes)
                    const weights = post.poll.options.map((_, idx) => post.poll.options.length - idx);
                    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
                    let random = Math.random() * totalWeight;
                    let optionIndex = 0;
                    for (let j = 0; j < weights.length; j++) {
                        random -= weights[j];
                        if (random <= 0) {
                            optionIndex = j;
                            break;
                        }
                    }
                    
                    const fakeName = _randomFrom(_fakeNames) + Math.floor(Math.random() * 1000);
                    if (!post.poll.votes[optionIndex].users.includes(fakeName)) {
                        post.poll.votes[optionIndex].count++;
                        post.poll.votes[optionIndex].users.push(fakeName);
                        savePosts();
                        // Update poll UI
                        renderPosts();
                    }
                }, 1000 + i * (200 + Math.random() * 300));
            }
        }

        // Occasionally mark as saved (simulate other users saving)
        try {
            if (!savedPosts.includes(postId) && Math.random() < 0.9) {
                savedPosts.push(postId);
                saveSavedPosts();
            }
        } catch (e) {
            console.warn('Could not mark as saved', e);
        }
    }, delay);
}

function deletePost(postId) {
    postToDelete = postId;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.classList.add('active');
    } else {
        console.error('Delete modal not found');
    }
}

// Edit modal handlers
function openEditModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    currentEditPostId = postId;
    const editModal = document.getElementById('editModal');
    const contentEl = document.getElementById('editPostContent');
    const videoEl = document.getElementById('editVideoUrlInput');
    const preview = document.getElementById('editImagePreview');

    if (contentEl) contentEl.value = post.content || '';
    editTempVideoUrl = post.videoUrl || '';
    if (videoEl) videoEl.value = editTempVideoUrl;

    // Populate temp images
    editTempImages = post.images && post.images.length > 0 ? [...post.images] : (post.image ? [post.image] : []);
    renderEditImagePreview();
    if (editModal) setModalOpen(editModal, true);
}

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) setModalOpen(editModal, false);
    currentEditPostId = null;
    editTempImages = [];
    editTempVideoUrl = '';
    const preview = document.getElementById('editImagePreview');
    if (preview) preview.innerHTML = '';
}

function handleEditImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Limit number of images to avoid bloating localStorage
    const MAX_EDIT_IMAGES = 6;
    const availableSlots = Math.max(0, MAX_EDIT_IMAGES - editTempImages.length);
    if (availableSlots <= 0) {
        showToast(`Máximo ${MAX_EDIT_IMAGES} imágenes por publicación`);
        return;
    }
    const filesToProcess = files.slice(0, availableSlots);
    // Compress files and convert to base64 to store in localStorage
    const promises = filesToProcess.map(file => compressImageFile(file, 1200, 1200, 0.78).catch(err => {
        // fallback to raw base64
        return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.readAsDataURL(file);
        });
    }));
    Promise.all(promises).then(results => {
        editTempImages = editTempImages.concat(results);
        renderEditImagePreview();
    }).catch(() => {
        // if something failed, still attempt to render whatever we have
        renderEditImagePreview();
    });
}

function renderEditImagePreview() {
    const preview = document.getElementById('editImagePreview');
    if (!preview) return;
    if (editTempImages.length === 0) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        return;
    }
    preview.style.display = 'flex';
    preview.classList.add('edit-image-preview');
    preview.innerHTML = editTempImages.map((src, idx) => `
        <div style="position:relative">
            <img src="${src}" alt="Vista previa ${idx + 1}" loading="lazy" decoding="async" class="edit-preview-img">
            <button type="button" class="remove-img" onclick="removeEditImage(${idx})" aria-label="Eliminar imagen ${idx + 1}">✕</button>
        </div>
    `).join('');
}

function removeEditImage(index) {
    if (index < 0 || index >= editTempImages.length) return;
    editTempImages.splice(index, 1);
    renderEditImagePreview();
}

function saveEdit(e) {
    if (e) e.preventDefault();
    if (!currentEditPostId) return closeEditModal();
    const contentEl = document.getElementById('editPostContent');
    const videoEl = document.getElementById('editVideoUrlInput');
    const content = contentEl ? contentEl.value.trim() : '';
    const video = videoEl ? videoEl.value.trim() : '';

    const idx = posts.findIndex(p => p.id === currentEditPostId);
    if (idx === -1) return closeEditModal();

    posts[idx].content = content;
    posts[idx].videoUrl = video || null;
    posts[idx].images = editTempImages.length > 0 ? [...editTempImages] : null;
    // maintain legacy single image field
    posts[idx].image = (editTempImages.length > 0) ? editTempImages[0] : null;

    savePosts();
    renderPosts();
    updateAllStats();
    closeEditModal();
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        setModalOpen(deleteModal, false);
    }
    postToDelete = null;
}

function confirmDelete() {
    if (postToDelete !== null) {
        // Capture the id now because closeDeleteModal() clears postToDelete
        const postIdToDelete = Number(postToDelete);
        closeDeleteModal();
        showLoadingBar();

        // If there's a pending lastDeleted, finalize it before proceeding
        if (lastDeleted) {
            finalizeDeletion();
        }

        setTimeout(() => {
            // Perform a soft-delete: store removed post to allow undo
            const idx = posts.findIndex(p => p.id === postIdToDelete);
            if (idx > -1) {
                lastDeleted = { post: posts[idx], index: idx };
                posts.splice(idx, 1);
                savePosts();
                renderPosts();
                updateAllStats();
            }
            completeLoadingBar();

            // Show snackbar with undo option for 6 seconds
            showUndoSnackbar('Publicación eliminada', 6000);
        }, 800);
    }
}

// Show the undo snackbar. duration in ms.
function showUndoSnackbar(message = 'Acción realizada', duration = 6000) {
    const snackbar = document.getElementById('undoSnackbar');
    const msgEl = snackbar ? snackbar.querySelector('.snackbar-message') : null;
    if (!snackbar) return;
    if (msgEl) msgEl.textContent = message;
    // Ensure visible and animate
    snackbar.style.display = 'flex';
    // force reflow then add class for transition
    // eslint-disable-next-line no-unused-expressions
    snackbar.offsetHeight;
    snackbar.classList.add('show');

    if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        undoTimeoutId = null;
    }

    undoTimeoutId = setTimeout(() => {
        finalizeDeletion();
    }, duration);
}

function hideUndoSnackbar() {
    const snackbar = document.getElementById('undoSnackbar');
    if (!snackbar) return;
    snackbar.classList.remove('show');
    // hide after transition
    setTimeout(() => {
        snackbar.style.display = 'none';
    }, 250);
}

function undoDelete() {
    if (!lastDeleted) return;
    // Restore at previous index if possible
    const insertIndex = Math.min(Math.max(0, lastDeleted.index), posts.length);
    posts.splice(insertIndex, 0, lastDeleted.post);
    savePosts();
    renderPosts();
    updateAllStats();

    // Clear pending deletion
    if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        undoTimeoutId = null;
    }
    lastDeleted = null;
    hideUndoSnackbar();
}

function finalizeDeletion() {
    // Permanently finalize the last deleted post (we already removed it from posts and saved)
    lastDeleted = null;
    if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        undoTimeoutId = null;
    }
    hideUndoSnackbar();
}

// Generic short toast for confirmations (share/copy)
function showToast(message = '', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.setAttribute('aria-hidden', 'true');
    }, duration);
}

// Share a post: try Web Share API, else copy permalink to clipboard
function sharePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const pageUrl = window.location.href.split('#')[0];
    const link = `${pageUrl}#post-${postId}`;

    // Increment share counter immediately for UX feedback
    post.shares = (post.shares || 0) + 1;
    savePosts();
    renderPosts();
    updateAllStats();

    // Try native share
    if (navigator.share) {
        navigator.share({ title: post.content.substring(0, 80), text: post.content.substring(0, 140), url: link })
            .then(() => showToast('Compartido'))
            .catch(() => showToast('No se pudo compartir'));
        return;
    }

    // Fallback: copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            showToast('Enlace copiado al portapapeles');
        }).catch(() => {
            // fallback to textarea
            fallbackCopyTextToClipboard(link);
        });
    } else {
        fallbackCopyTextToClipboard(link);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) showToast('Enlace copiado al portapapeles');
        else showToast('No se pudo copiar');
    } catch (err) {
        showToast('No se pudo copiar');
    }
    document.body.removeChild(textArea);
}

function togglePinPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.pinned = !post.pinned;
        savePosts();
        renderPosts();
        
        // Show notification
        showToast(
            post.pinned ? '📌 Publicación fijada' : 'Publicación desfijada'
        );
    }
}

function toggleFollow(userName) {
    const index = followingUsers.indexOf(userName);
    const isFollowing = index > -1;
    
    if (isFollowing) {
        // Dejar de seguir
        followingUsers.splice(index, 1);
    } else {
        // Seguir
        followingUsers.push(userName);
        
        // Add notification
        if (userName !== currentUser.name) {
            addNotification('follow', `Ahora sigues a ${userName}`, null, userName);
        }
    }
    
    saveFollowing();
    renderPosts();
}

function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        const wasLiked = post.liked;
        post.liked = !post.liked;
        
        // Initialize likedBy array if needed
        if (!post.likedBy) {
            post.likedBy = [];
        }
        
        if (post.liked) {
            post.likes = post.likes + 1;
            // Add current user to likedBy array
            if (!post.likedBy.some(u => u.name === currentUser.name)) {
                post.likedBy.push({
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                    photo: currentUser.photo
                });
            }
        } else {
            post.likes = post.likes - 1;
            // Remove current user from likedBy array
            post.likedBy = post.likedBy.filter(u => u.name !== currentUser.name);
        }
        
        // Add notification if liking (not unliking) and it's not own post
        if (post.liked && post.author && post.author.name !== currentUser.name) {
            addNotification('like', `Te gustó la publicación de ${post.author.name}`, postId, post.author.name);
        }
        
        savePosts();
        renderPosts();
        updateAllStats();
    }
}

function showLikedByModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.likedBy || post.likedBy.length === 0) {
        showToast('Nadie ha dado like todavía');
        return;
    }
    
    // Create modal dynamically
    let modal = document.getElementById('likedByModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'likedByModal';
        modal.className = 'modal liked-by-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'likedByTitle');
        document.body.appendChild(modal);
    }
    
    // Generate list of users
    const usersHTML = post.likedBy.map(user => {
        let avatarHTML;
        if (user.photo) {
            avatarHTML = `<img src="${user.photo}" alt="${user.name}" class="liked-user-photo">`;
        } else {
            avatarHTML = `<span class="liked-user-avatar">${user.avatar}</span>`;
        }
        
        return `
            <div class="liked-user-item">
                ${avatarHTML}
                <span class="liked-user-name">${escapeHTML(user.name)}</span>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="likedByTitle">Les gusta a ${post.likedBy.length} ${post.likedBy.length === 1 ? 'persona' : 'personas'}</h2>
                <button class="btn-close-modal" onclick="closeLikedByModal()" aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
            <div class="liked-by-list">
                ${usersHTML}
            </div>
        </div>
    `;
    
    setModalOpen(modal, true);
}

function closeLikedByModal() {
    const modal = document.getElementById('likedByModal');
    if (modal) {
        setModalOpen(modal, false);
    }
}

function toggleSavePost(postId) {
    const index = savedPosts.indexOf(postId);
    if (index > -1) {
        savedPosts.splice(index, 1);
    } else {
        savedPosts.push(postId);
    }
    saveSavedPosts();
    renderPosts();
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.classList.toggle('active');
    }
}

function addComment(postId, commentText, mediaUrl = null, parentId = null) {
    const post = posts.find(p => p.id === postId);
    if (post && (commentText.trim() || mediaUrl)) {
        const newComment = {
            id: Date.now(),
            text: commentText.trim(),
            date: new Date().toISOString(),
            mediaUrl: mediaUrl,
            parentId: parentId,
            replies: [],
            author: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                photo: currentUser.photo
            }
        };
        
        if (parentId) {
            // It's a reply to another comment
            const parentComment = findCommentById(post.comments, parentId);
            if (parentComment) {
                if (!parentComment.replies) parentComment.replies = [];
                parentComment.replies.push(newComment);
            }
        } else {
            // It's a top-level comment
            post.comments.push(newComment);
        }
        
        // Add notification if commenting on someone else's post
        if (post.author && post.author.name !== currentUser.name) {
            addNotification('comment', `Comentaste en la publicación de ${post.author.name}`, postId, post.author.name);
        }
        
        savePosts();
        renderPosts();
        updateAllStats();
    }
}

function findCommentById(comments, commentId) {
    for (let comment of comments) {
        if (comment.id === commentId) return comment;
        if (comment.replies && comment.replies.length > 0) {
            const found = findCommentById(comment.replies, commentId);
            if (found) return found;
        }
    }
    return null;
}

function deleteComment(postId, commentId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments = post.comments.filter(c => c.id !== commentId);
        savePosts();
        renderPosts();
        updateAllStats();
    }
}

// ========== RENDER FUNCTIONS ==========
function renderPosts() {
    let filteredPosts = filterPosts();
    
    // Sort pinned posts first
    filteredPosts = filteredPosts.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });
    
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.querySelector('p').textContent = searchQuery 
            ? 'No se encontraron publicaciones' 
            : 'Sé el primero en compartir algo';
        return;
    }
    
    emptyState.classList.add('hidden');
    postsContainer.innerHTML = filteredPosts.map(post => createPostHTML(post)).join('');
    // Animar aparición de posts
    const postElements = postsContainer.querySelectorAll('.post');
    postElements.forEach((el, i) => {
        el.style.animationDelay = (i * 0.08) + 's';
        el.classList.add('fadeInUp');
    });
}

function createPostHTML(post) {
    const formattedDate = formatDate(post.date);
    const likedClass = post.liked ? 'liked' : '';
    const author = post.author || { name: 'Usuario', avatar: '👤', photo: null };
    const isOwnPost = author.name === currentUser.name;
    const isFollowing = followingUsers.includes(author.name);
    
    // Create avatar HTML
    let avatarHTML;
    if (author.photo) {
        avatarHTML = `<img src="${author.photo}" alt="${author.name}">`;
    } else {
        avatarHTML = author.avatar;
    }
    
    return `
        <article class="post-card ${post.pinned ? 'pinned' : ''} ${post.isRepost ? 'repost' : ''}" data-post-id="${post.id}">
            ${post.isRepost ? `<div class="repost-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17 1L21 5L17 9V6H5V10H3V5C3 3.9 3.9 3 5 3H17V1ZM7 23L3 19L7 15V18H19V14H21V19C21 20.1 20.1 21 19 21H7V23Z"/></svg> ${escapeHTML(currentUser.name)} compartió</div>` : ''}
            ${post.pinned ? '<div class="pin-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/></svg> Publicación destacada</div>' : ''}
            <div class="post-header">
                <div class="post-author">
                    <span class="post-author-avatar">${avatarHTML}</span>
                    <div>
                        <div class="post-author-name">${escapeHTML(author.name)}</div>
                        <span class="post-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="post-header-actions">
                    ${!isOwnPost ? `
                    <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${escapeHTML(author.name)}')" aria-label="${isFollowing ? 'Dejar de seguir' : 'Seguir'}">
                        ${isFollowing ? `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Siguiendo
                        ` : `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Seguir
                        `}
                    </button>
                    ` : ''}
                    ${isOwnPost ? `
                        <button class="btn-pin ${post.pinned ? 'pinned' : ''}" onclick="togglePinPost(${post.id})" aria-label="${post.pinned ? 'Desfijar publicación' : 'Fijar publicación'}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.pinned ? 'currentColor' : 'none'}" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-edit-post" onclick="openEditModal(${post.id})" aria-label="Editar publicación">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-delete" onclick="deletePost(${post.id})" aria-label="Eliminar publicación">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                        ` : ''}
                </div>
            </div>
            <p class="post-content">${escapeHTML(post.content)}</p>
            ${createImageHTML(post)}
            ${createPollHTML(post)}
            <div class="post-actions">
                <button class="btn-like ${likedClass}" onclick="toggleLike(${post.id})" aria-label="Me gusta">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="count-number clickable-count" onclick="event.stopPropagation(); showLikedByModal(${post.id})">${post.likes}</span>
                </button>
                <button class="btn-comment" onclick="toggleComments(${post.id})" aria-label="Comentarios">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="count-number">${(post.comments||[]).length}</span>
                </button>
                <button class="btn-save ${savedPosts.includes(post.id) ? 'saved' : ''}" onclick="toggleSavePost(${post.id})" aria-label="Guardar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${savedPosts.includes(post.id) ? 'currentColor' : 'none'}" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                    <button class="btn-share" onclick="sharePost(${post.id})" aria-label="Compartir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 3v13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="share-count count-number">${post.shares || 0}</span>
                    </button>
                    ${!isOwnPost ? `
                    <button class="btn-repost" onclick="repostPost(${post.id})" aria-label="Repostear">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 1L21 5L17 9V6H5V10H3V5C3 3.9 3.9 3 5 3H17V1Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 23L3 19L7 15V18H19V14H21V19C21 20.1 20.1 21 19 21H7V23Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    ` : ''}
            </div>
            
            <div class="comments-section" id="comments-${post.id}">
                <form class="comment-form" id="comment-form-${post.id}" onsubmit="handleCommentSubmit(event, ${post.id})">
                    <div class="comment-form-content">
                        <input 
                            type="text" 
                            class="comment-input" 
                            placeholder="Escribe un comentario..."
                            maxlength="200"
                        />
                        <div class="comment-media-actions">
                            <button type="button" class="btn-gif" onclick="document.getElementById('media-input-${post.id}').style.display = document.getElementById('media-input-${post.id}').style.display === 'none' ? 'flex' : 'none'" aria-label="Agregar GIF/Imagen">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                    <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button type="submit" class="btn-comment-submit" aria-label="Enviar comentario">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="comment-media-input-container" id="media-input-${post.id}" style="display: none;">
                        <input 
                            type="url" 
                            class="comment-media-input" 
                            placeholder="Pega la URL de un GIF o imagen..."
                            oninput="previewCommentMedia(this, 'media-preview-${post.id}')"
                        />
                    </div>
                    <div class="media-preview" id="media-preview-${post.id}" style="display: none;">
                        <img class="media-preview-img" src="" alt="Preview">
                        <button type="button" class="btn-remove-media" onclick="removeCommentMedia('comment-form-${post.id}', 'media-preview-${post.id}')" aria-label="Eliminar media">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                                <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </form>
                
                ${post.comments.length > 0 ? `
                    <div class="comments-list">
                        ${post.comments.map(comment => createCommentHTML(post.id, comment)).join('')}
                    </div>
                ` : ''}
            </div>
        </article>
    `;
}

function createImageHTML(post) {
    let html = '';
    
    // Check if post has video URL
    if (post.videoUrl) {
        const embedUrl = parseVideoUrl(post.videoUrl);
        if (embedUrl) {
            html += `
                <div class="post-video">
                    <iframe src="${embedUrl}" allowfullscreen></iframe>
                </div>
            `;
        }
    }
    
    // Check if post has multiple images
    if (post.images && post.images.length > 0) {
        if (post.images.length === 1) {
            html += `<img src="${post.images[0]}" alt="Post image" class="post-image" loading="lazy" onclick="openImageModal('${post.images[0]}')">`;
        } else {
            // Multiple images - create carousel
            const carouselId = `carousel-${post.id}`;
            html += `
                <div class="image-carousel" id="${carouselId}">
                    <div class="carousel-container">
                        <div class="carousel-track">
                            ${post.images.map((img, index) => `
                                <div class="carousel-slide">
                                            <img src="${img}" alt="Image ${index + 1}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        ${post.images.length > 1 ? `
                            <button class="carousel-button carousel-button-prev" onclick="moveCarousel('${carouselId}', -1)" aria-label="Anterior">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="carousel-button carousel-button-next" onclick="moveCarousel('${carouselId}', 1)" aria-label="Siguiente">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <div class="carousel-counter">
                                <span class="carousel-current">1</span> / ${post.images.length}
                            </div>
                            <div class="carousel-indicators">
                                ${post.images.map((_, index) => `
                                    <button class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                                            onclick="goToSlide('${carouselId}', ${index})"
                                            aria-label="Ir a imagen ${index + 1}">
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    } else if (post.image) {
        // Fallback to old single image format for backwards compatibility
        html += `<img src="${post.image}" alt="Post image" class="post-image" onclick="openImageModal('${post.image}')">`;
    }
    
    return html;
}

function createPollHTML(post) {
    if (!post.poll) return '';
    
    const poll = post.poll;
    const totalVotes = poll.votes.reduce((sum, v) => sum + v.count, 0);
    const hasVoted = poll.votes.some(v => v.users.includes(currentUser.name));
    
    let html = '<div class="post-poll">';
    html += `<div class="poll-question">📊 ${escapeHTML(poll.question)}</div>`;
    html += '<div class="poll-options">';
    
    poll.options.forEach((option, index) => {
        const voteData = poll.votes[index];
        const percentage = totalVotes > 0 ? Math.round((voteData.count / totalVotes) * 100) : 0;
        const userVoted = voteData.users.includes(currentUser.name);
        
        if (hasVoted) {
            // Show results
            html += `
                <div class="poll-option poll-option-result ${userVoted ? 'poll-option-voted' : ''}">
                    <div class="poll-option-bar" style="width: ${percentage}%"></div>
                    <div class="poll-option-content">
                        <span class="poll-option-text">${escapeHTML(option.text)}</span>
                        <span class="poll-option-percentage">${percentage}% (${voteData.count})</span>
                    </div>
                    ${userVoted ? '<span class="poll-vote-check">✓</span>' : ''}
                </div>
            `;
        } else {
            // Show voteable buttons
            html += `
                <button class="poll-option poll-option-button" onclick="votePoll(${post.id}, ${index})">
                    ${escapeHTML(option.text)}
                </button>
            `;
        }
    });
    
    html += '</div>';
    html += `<div class="poll-footer">${totalVotes} ${totalVotes === 1 ? 'voto' : 'votos'}</div>`;
    html += '</div>';
    
    return html;
}

function votePoll(postId, optionIndex) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll) return;
    
    // Check if already voted
    const hasVoted = post.poll.votes.some(v => v.users.includes(currentUser.name));
    if (hasVoted) {
        showToast('Ya votaste en esta encuesta');
        return;
    }
    
    // Add vote
    post.poll.votes[optionIndex].count++;
    post.poll.votes[optionIndex].users.push(currentUser.name);
    
    savePosts();
    renderPosts();
    showToast('¡Voto registrado! 📊');
}

function createCommentHTML(postId, comment, depth = 0) {
    const formattedDate = formatDate(comment.date);
    const author = comment.author || { name: 'Usuario', avatar: '👤', photo: null };
    const isOwnComment = author.name === currentUser.name;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const replyCount = hasReplies ? comment.replies.length : 0;
    
    // Create avatar HTML
    let avatarHTML;
    if (author.photo) {
        avatarHTML = `<img src="${author.photo}" alt="${author.name}">`;
    } else {
        avatarHTML = author.avatar;
    }
    
    return `
        <div class="comment-item ${depth > 0 ? 'comment-reply' : ''}" style="margin-left: ${depth * 2.5}rem;">
            <div class="comment-header">
                <span class="comment-avatar">${avatarHTML}</span>
                <div class="comment-info">
                    <div class="comment-author-row">
                        <span class="comment-author-name">${escapeHTML(author.name)}</span>
                        <span class="comment-date">${formattedDate}</span>
                    </div>
                </div>
                ${isOwnComment ? `
                <button class="btn-comment-delete" onclick="deleteComment(${postId}, ${comment.id})" aria-label="Eliminar comentario">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                ` : ''}
            </div>
            ${comment.text ? `<p class="comment-text">${escapeHTML(comment.text)}</p>` : ''}
            ${comment.mediaUrl ? `
                <div class="comment-media">
                    <img src="${comment.mediaUrl}" alt="Comment media" onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="comment-actions">
                <button class="btn-reply" onclick="toggleReplyForm(${comment.id})" aria-label="Responder">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Responder
                </button>
                ${hasReplies ? `
                    <span class="reply-count">${replyCount} ${replyCount === 1 ? 'respuesta' : 'respuestas'}</span>
                ` : ''}
            </div>
            
            <!-- Reply Form -->
            <form class="reply-form" id="reply-form-${comment.id}" style="display: none;" onsubmit="handleCommentSubmit(event, ${postId}, ${comment.id})">
                <div class="comment-form-content">
                    <input 
                        type="text" 
                        class="comment-input" 
                        placeholder="Escribe una respuesta..."
                        maxlength="200"
                    />
                    <div class="comment-media-actions">
                        <button type="button" class="btn-gif" onclick="document.getElementById('reply-media-input-${comment.id}').style.display = document.getElementById('reply-media-input-${comment.id}').style.display === 'none' ? 'flex' : 'none'" aria-label="Agregar GIF/Imagen">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button type="submit" class="btn-comment-submit" aria-label="Enviar respuesta">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="comment-media-input-container" id="reply-media-input-${comment.id}" style="display: none;">
                    <input 
                        type="url" 
                        class="comment-media-input" 
                        placeholder="Pega la URL de un GIF o imagen..."
                        oninput="previewCommentMedia(this, 'reply-media-preview-${comment.id}')"
                    />
                </div>
                <div class="media-preview" id="reply-media-preview-${comment.id}" style="display: none;">
                    <img class="media-preview-img" src="" alt="Preview">
                    <button type="button" class="btn-remove-media" onclick="removeCommentMedia('reply-form-${comment.id}', 'reply-media-preview-${comment.id}')" aria-label="Eliminar media">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </form>
            
            <!-- Nested Replies -->
            ${hasReplies ? `
                <div class="comment-replies">
                    ${comment.replies.map(reply => createCommentHTML(postId, reply, depth + 1)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function handleCommentSubmit(event, postId, parentId = null) {
    event.preventDefault();
    const form = event.target;
    const input = form.querySelector('.comment-input');
    const mediaInput = form.querySelector('.comment-media-input');
    const commentText = input.value.trim();
    const mediaUrl = mediaInput ? mediaInput.value.trim() : null;
    
    if (commentText || mediaUrl) {
        addComment(postId, commentText, mediaUrl, parentId);
        form.reset();
        const preview = form.querySelector('.media-preview');
        if (preview) preview.style.display = 'none';
        
        // Close reply form if it was a reply
        if (parentId) {
            const replyForm = document.getElementById(`reply-form-${parentId}`);
            if (replyForm) replyForm.style.display = 'none';
        }
    }
}

function toggleReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.style.display = replyForm.style.display === 'none' ? 'flex' : 'none';
        if (replyForm.style.display === 'flex') {
            const input = replyForm.querySelector('.comment-input');
            if (input) input.focus();
        }
    }
}

function previewCommentMedia(input, previewId) {
    const url = input.value.trim();
    const preview = document.getElementById(previewId);
    const previewImg = preview.querySelector('.media-preview-img');
    
    if (url && (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.includes('tenor.com') || url.includes('giphy.com'))) {
        previewImg.src = url;
        preview.style.display = 'flex';
    } else {
        preview.style.display = 'none';
    }
}

function removeCommentMedia(formId, previewId) {
    const form = document.getElementById(formId);
    const preview = document.getElementById(previewId);
    const mediaInput = form.querySelector('.comment-media-input');
    
    if (mediaInput) mediaInput.value = '';
    if (preview) preview.style.display = 'none';
}

// ========== STATS FUNCTIONS ==========
function updateAllStats() {
    // Update header badges
    postCountElement.textContent = posts.length;
    
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    likesCountElement.textContent = totalLikes;
    
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    commentsCountElement.textContent = totalComments;
}

// ========== UTILITY FUNCTIONS ==========
function handleTextareaInput(e) {
    const length = e.target.value.length;
    charCount.textContent = `${length}/500`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Justo ahora';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    } else {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openImageModal(imageUrl) {
    // Create modal if it doesn't exist
    let imageModal = document.getElementById('imageModal');
    if (!imageModal) {
        imageModal = document.createElement('div');
        imageModal.id = 'imageModal';
        imageModal.className = 'modal image-modal';
        imageModal.setAttribute('role','dialog');
        imageModal.setAttribute('aria-modal','true');
        imageModal.setAttribute('aria-hidden','true');
        imageModal.innerHTML = `
            <div class="image-modal-content">
                <button class="btn-close-modal" onclick="closeImageModal()" aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <img id="modalImage" src="" alt="Imagen ampliada">
            </div>
        `;
        document.body.appendChild(imageModal);
        
        // Close on backdrop click
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }
    
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageUrl;
    setModalOpen(imageModal, true);
}

function closeImageModal() {
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        setModalOpen(imageModal, false);
    }
}

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit post
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === postContent) {
            postForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        if (userModal.classList.contains('active')) {
            closeUserModal();
        }
        const imageModal = document.getElementById('imageModal');
        if (imageModal && imageModal.classList.contains('active')) {
            closeImageModal();
        }
        if (statsModal && statsModal.classList.contains('active')) {
            closeStatsModal();
        }
        if (deleteModal && deleteModal.classList.contains('active')) {
            closeDeleteModal();
        }
    }
});

// Close delete modal when clicking outside
deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// ========== STATS MODAL FUNCTIONS ==========
let chartsInstances = {};

function openStatsModal() {
    setModalOpen(statsModal, true);
    updateStatsData();
    renderCharts();
}

function closeStatsModal() {
    setModalOpen(statsModal, false);
    // Destroy chart instances to prevent memory leaks
    Object.values(chartsInstances).forEach(chart => chart.destroy());
    chartsInstances = {};
}

function updateStatsData() {
    // Calculate totals
    const totalPostsCount = posts.length;
    const totalLikesCount = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalCommentsCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
    
    // Update summary cards
    document.getElementById('totalPosts').textContent = totalPostsCount;
    document.getElementById('totalLikes').textContent = totalLikesCount;
    document.getElementById('totalComments').textContent = totalCommentsCount;
    document.getElementById('totalFollowers').textContent = currentUser.followers || 0;
}

function renderCharts() {
    // Destroy existing charts
    Object.values(chartsInstances).forEach(chart => chart.destroy());
    chartsInstances = {};
    
    renderWeeklyActivityChart();
    renderFollowersGrowthChart();
    renderInteractionsChart();
    renderCategoryChart();
}

function renderWeeklyActivityChart() {
    const ctx = document.getElementById('weeklyActivityChart');
    if (!ctx) return;
    
    // Generate weekly data (last 7 days)
    const weekData = generateWeeklyData();
    
    chartsInstances.weeklyActivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekData.labels,
            datasets: [
                {
                    label: 'Posts',
                    data: weekData.posts,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Likes',
                    data: weekData.likes,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Comentarios',
                    data: weekData.comments,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderFollowersGrowthChart() {
    const ctx = document.getElementById('followersGrowthChart');
    if (!ctx) return;
    
    // Generate growth data
    const growthData = generateFollowersGrowthData();
    
    chartsInstances.followersGrowth = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: growthData.labels,
            datasets: [{
                label: 'Nuevos Seguidores',
                data: growthData.followers,
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderInteractionsChart() {
    const ctx = document.getElementById('interactionsChart');
    if (!ctx) return;
    
    const totalLikesCount = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalCommentsCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const totalSaved = savedPosts.length;
    
    chartsInstances.interactions = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Likes', 'Comentarios', 'Guardados'],
            datasets: [{
                data: [totalLikesCount, totalCommentsCount, totalSaved],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(59, 130, 246, 0.7)'
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const withImages = posts.filter(p => p.image).length;
    const withoutImages = posts.filter(p => !p.image).length;
    const withLikes = posts.filter(p => p.likes > 0).length;
    
    chartsInstances.category = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Con Imagen', 'Solo Texto', 'Con Likes'],
            datasets: [{
                data: [withImages, withoutImages, withLikes],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                    'rgba(236, 72, 153, 0.6)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(236, 72, 153)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generateWeeklyData() {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const labels = [];
    const postsData = [];
    const likesData = [];
    const commentsData = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(days[date.getDay()]);
        
        // Count posts, likes, and comments for this day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayPosts = posts.filter(post => {
            const postDate = new Date(post.date);
            return postDate >= dayStart && postDate <= dayEnd;
        });
        
        postsData.push(dayPosts.length);
        likesData.push(dayPosts.reduce((sum, post) => sum + post.likes, 0));
        commentsData.push(dayPosts.reduce((sum, post) => sum + post.comments.length, 0));
    }
    
    return { labels, posts: postsData, likes: likesData, comments: commentsData };
}

function generateFollowersGrowthData() {
    const labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const baseFollowers = currentUser.followers || 0;
    
    // Simulate growth based on activity
    const activityScore = posts.length + (posts.reduce((sum, p) => sum + p.likes, 0) / 10);
    const growthRate = Math.max(1, Math.floor(activityScore / 5));
    
    const followers = [
        growthRate,
        growthRate + Math.floor(Math.random() * 3),
        growthRate + Math.floor(Math.random() * 5),
        growthRate + Math.floor(Math.random() * 4)
    ];
    
    return { labels, followers };
}

// Close stats modal when clicking outside
statsModal?.addEventListener('click', (e) => {
    if (e.target === statsModal) {
        closeStatsModal();
    }
});

// ========== MOBILE MENU FUNCTIONS ==========
function toggleMobileMenu() {
    hamburgerMenu.classList.toggle('active');
    headerActions.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (headerActions.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMobileMenu() {
    hamburgerMenu.classList.remove('active');
    headerActions.classList.remove('active');
    document.body.style.overflow = '';
}

// ========== NOTIFICATIONS SYSTEM ==========
function addNotification(type, message, postId = null, userName = null) {
    const notification = {
        id: Date.now(),
        type: type, // 'like', 'comment', 'follow', 'message'
        message: message,
        postId: postId,
        userName: userName,
        date: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
}

function toggleNotificationsPanel() {
    notificationsPanel.classList.toggle('active');
    
    if (notificationsPanel.classList.contains('active')) {
        // Mark all as read when opening
        notifications.forEach(n => n.read = true);
        saveNotifications();
        updateNotificationBadge();
        renderNotifications();
    }
}

function closeNotificationsPanel() {
    notificationsPanel.classList.remove('active');
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        notificationBadge.style.display = 'flex';
    } else {
        notificationBadge.style.display = 'none';
    }
}

function renderNotifications() {
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-notifications">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No tienes notificaciones</p>
            </div>
        `;
        clearAllNotifications.style.display = 'none';
        return;
    }
    
    clearAllNotifications.style.display = 'block';
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : ''}" data-notification-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                ${getNotificationIcon(notif.type)}
            </div>
            <div class="notification-content">
                <p class="notification-message">${notif.message}</p>
                <span class="notification-time">${formatDate(notif.date)}</span>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        like: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>`,
        comment: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
        </svg>`,
        follow: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" stroke-width="2"/>
            <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="2"/>
        </svg>`,
        message: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/>
            <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2"/>
        </svg>`
    };
    
    return icons[type] || icons.message;
}

function clearAllNotifs() {
    notifications = [];
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
}

// ========== LOADING BAR FUNCTIONS ==========
function showLoadingBar() {
    const loadingBar = document.getElementById('loadingBar');
    const progress = loadingBar.querySelector('.loading-bar-progress');
    
    if (loadingBar) {
        loadingBar.classList.add('active');
        loadingBar.classList.remove('complete');
        progress.style.width = '0%';
        
        // Animate to 70% while processing
        setTimeout(() => {
            progress.style.width = '70%';
        }, 50);
    }
}

function completeLoadingBar() {
    const loadingBar = document.getElementById('loadingBar');
    const progress = loadingBar.querySelector('.loading-bar-progress');
    
    if (loadingBar) {
        loadingBar.classList.add('complete');
        progress.style.width = '100%';
        
        // Hide after completion
        setTimeout(() => {
            loadingBar.classList.remove('active', 'complete');
            progress.style.width = '0%';
        }, 600);
    }
}

// ========== CAROUSEL FUNCTIONS ==========
const carouselStates = {};

function moveCarousel(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const counter = carousel.querySelector('.carousel-current');
    
    if (!carouselStates[carouselId]) {
        carouselStates[carouselId] = 0;
    }
    
    let currentIndex = carouselStates[carouselId];
    currentIndex += direction;
    
    // Loop around
    if (currentIndex < 0) currentIndex = slides.length - 1;
    if (currentIndex >= slides.length) currentIndex = 0;
    
    carouselStates[carouselId] = currentIndex;
    updateCarousel(carouselId, currentIndex, track, indicators, counter);
}

function goToSlide(carouselId, index) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const track = carousel.querySelector('.carousel-track');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const counter = carousel.querySelector('.carousel-current');
    
    carouselStates[carouselId] = index;
    updateCarousel(carouselId, index, track, indicators, counter);
}

function updateCarousel(carouselId, index, track, indicators, counter) {
    // Move track
    track.style.transform = `translateX(-${index * 100}%)`;
    
    // Update indicators
    indicators.forEach((indicator, i) => {
        if (i === index) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // Update counter
    if (counter) {
        counter.textContent = index + 1;
    }
}