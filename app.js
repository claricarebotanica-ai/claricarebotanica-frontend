const API_BASE_URL = 'https://claricarebotanica-backend.onrender.com/api';
const USER_STORAGE_KEY = 'claricare-user';
const TOKEN_STORAGE_KEY = 'claricare-token';
const EAST_AFRICA_TIME_ZONE = 'Africa/Nairobi';

function formatEATDateTime(value, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!value) return '';
  const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00+03:00` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-KE', { ...options, timeZone: EAST_AFRICA_TIME_ZONE }).format(date);
}

function parseEATDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(`${value}:00+03:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function setupHeroVideoPlayback() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const startPlayback = () => {
    if (document.visibilityState === 'hidden') return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (!video.paused) return;
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  };

  const removeGestureFallbacks = () => {
    document.removeEventListener('pointerdown', startPlayback);
    document.removeEventListener('keydown', startPlayback);
  };

  video.addEventListener('loadeddata', startPlayback);
  video.addEventListener('playing', removeGestureFallbacks, { once: true });
  document.addEventListener('pointerdown', startPlayback, { passive: true });
  document.addEventListener('keydown', startPlayback);
  document.addEventListener('visibilitychange', startPlayback);
  window.addEventListener('pageshow', startPlayback);
  startPlayback();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupHeroVideoPlayback, { once: true });
} else {
  setupHeroVideoPlayback();
}

const customerLoginButton = document.querySelector('#customer-login-button');
const siteMenuToggle = document.querySelector('#site-menu-toggle');
const siteHeader = document.querySelector('#site-header');
const connectionStatus = document.querySelector('#connection-status');
const productList = document.querySelector('#product-list');
const publicProductList = document.querySelector('#public-products');
const productCount = document.querySelector('#product-count');

let products = [];
let inventoryMaterials = [];
let inventoryProducts = [];
let inventoryEquipment = [];
let adminContentPosts = [];
let currentUser = loadUser();
let activePublicPage = 'home';
let activeArticle = null;
let publishedPosts = null;
let staffLoginRole = 'employee';
let pendingCartProductId = '';
let pendingCartVariantLabel = '';
let pendingInvitationRole = '';
let invitationDetailsLoaded = false;
let customerActiveConversationId = '';
let customerConversationPoll = null;
let customerCallSession = null;
let agentCallSession = null;
let agentConversation = null;
let agentConversationPoll = null;
let inboxConversations = [];
let activeMessageCategory = 'quotation';
let messageBinEntries = [];
let callQueuePoll = null;
let inboxPoll = null;
let callEventsController = null;
let callRingtoneTimer = null;
let callRingtoneContext = null;
let waitingCallIds = new Set();
let answeredCallIds = new Set();
let newsletterFeedbackTimeout = null;
let adminContentFeedbackTimeout = null;
let editorReturnPage = 'content-home-page';
let pendingApplicantPositionId = null;
let claricareChatProductId = '';
let departmentDiscussionDepartments = [];
let selectedDiscussionDepartmentId = '';
let departmentDiscussionPoll = null;
let departmentDiscussionLoadId = 0;
let departmentDiscussionUnreadCounts = {};
let selectedPeoplePage = 'departments';
let selectedRecruitmentApplicationId = null;
let selectedApplicantApplicationId = null;
let selectedCompanyDepartmentId = null;

function setSkipTarget(target) {
  const link = document.querySelector('#skip-to-main');
  if (link) link.href = `#${target}`;
}

function showAdminLogin(updateAddress = true) {
  setSkipTarget('admin-login-page');
  document.querySelector('#site-header').hidden = true;
  document.querySelector('#public-site').hidden = true;
  document.querySelector('#workspace').hidden = true;
  document.querySelector('#staff-login-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = true;
  document.querySelector('#admin-login-page').hidden = false;
  if (updateAddress) history.pushState(null, '', '/admin');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStaffLogin(role, updateAddress = true) {
  setSkipTarget('staff-login-page');
  staffLoginRole = ['referrer', 'applicant'].includes(role) ? role : 'employee';
  document.querySelector('#site-header').hidden = true;
  document.querySelector('#public-site').hidden = true;
  document.querySelector('#workspace').hidden = true;
  document.querySelector('#admin-login-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = true;
  document.querySelector('#staff-login-page').hidden = false;
  const title = staffLoginRole === 'applicant' ? 'Applicant portal' : staffLoginRole === 'referrer' ? 'Referrer sign in' : 'Employee sign in';
  document.querySelector('#staff-brand-label').textContent = `${staffLoginRole.toUpperCase()} ACCESS`;
  document.querySelector('#staff-login-eyebrow').textContent = `${staffLoginRole.toUpperCase()} WORKSPACE`;
  document.querySelector('#staff-login-title').textContent = title;
  document.querySelector('#staff-login-description').textContent = staffLoginRole === 'applicant'
    ? 'Sign in to track your applications, or create an applicant account to apply for an open role.'
    : staffLoginRole === 'referrer'
    ? 'Sign in to view your referrals and commissions.'
    : 'Sign in with your employee account to access the staff workspace.';
  document.querySelectorAll('[data-staff-portal]').forEach((link) => {
    if (link.dataset.staffPortal === staffLoginRole) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#staff-login-submit').innerHTML = `Sign in as ${staffLoginRole} <span aria-hidden="true">→</span>`;
  document.querySelector('#show-applicant-register').hidden = staffLoginRole !== 'applicant';
  document.querySelector('#staff-back-link').hidden = staffLoginRole === 'applicant';
  document.querySelector('#staff-portal-links').hidden = staffLoginRole === 'applicant';
  document.querySelector('#applicant-register-form').hidden = true;
  document.querySelector('#staff-login-form').hidden = false;
  document.querySelector('#show-applicant-register').textContent = 'Create an applicant account';
  document.querySelectorAll('#staff-portal-links [data-staff-portal]').forEach((link) => {
    link.hidden = staffLoginRole === 'applicant';
  });
  document.querySelector('[data-staff-portal="applicant"]').hidden = staffLoginRole === 'applicant';
  document.querySelector('#staff-login-feedback').textContent = '';
  if (updateAddress) {
    const query = staffLoginRole === 'applicant' && pendingApplicantPositionId
      ? `?positionId=${encodeURIComponent(pendingApplicantPositionId)}`
      : '';
    history.pushState(null, '', `/${staffLoginRole}-login${query}`);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPublicSite(updateAddress = true) {
  setSkipTarget('public-site');
  document.querySelector('#admin-login-page').hidden = true;
  document.querySelector('#staff-login-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = true;
  document.querySelector('#workspace').hidden = true;
  document.querySelector('#site-header').hidden = false;
  document.querySelector('#public-site').hidden = false;
  if (updateAddress) history.pushState(null, '', '/#home');
  setPublicPage('home', false);
}

function showReferrerInvitationPage() {
  setSkipTarget('referrer-invitation-page');
  document.querySelector('#site-header').hidden = true;
  document.querySelector('#public-site').hidden = true;
  document.querySelector('#workspace').hidden = true;
  document.querySelector('#admin-login-page').hidden = true;
  document.querySelector('#staff-login-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = false;
  document.querySelector('#referrer-invitation-feedback').textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setCustomerAuthMode(mode) {
  const selectedMode = ['register', 'forgot'].includes(mode) ? mode : 'login';
  document.querySelector('#customer-login-card').hidden = selectedMode !== 'login';
  document.querySelector('#customer-register-card').hidden = selectedMode !== 'register';
  document.querySelector('#customer-forgot-card').hidden = selectedMode !== 'forgot';
  const copy = {
    login: ['Welcome back', 'Sign in to your customer account to continue.'],
    register: ['Create your account', 'Join ClariCare to access your customer dashboard.'],
    forgot: ['Reset your password', 'We’ll email password reset instructions to your customer account.'],
  }[selectedMode];
  document.querySelector('#customer-auth-title').textContent = copy[0];
  document.querySelector('#customer-auth-intro').textContent = copy[1];
  setFeedback(document.querySelector('#auth-feedback'), '');
}

function moveCustomerAuthToPublicSite() {
  const authSection = document.querySelector('#view-auth');
  const publicSite = document.querySelector('#public-site');
  if (!authSection.classList.contains('public-page')) {
    authSection.classList.remove('view', 'active');
    authSection.classList.add('public-page', 'customer-auth-page');
    authSection.dataset.publicPage = 'customer-login';
    publicSite.insertBefore(authSection, publicSite.querySelector('.site-footer'));
  }
}

function moveCustomerAuthToWorkspace() {
  const authSection = document.querySelector('#view-auth');
  const mainArea = document.querySelector('#workspace .main-area');
  if (authSection.classList.contains('public-page')) {
    authSection.classList.remove('public-page', 'public-page-active', 'customer-auth-page');
    authSection.classList.add('view');
    authSection.removeAttribute('data-public-page');
    mainArea.insertBefore(authSection, mainArea.querySelector('.page-footer'));
  }
}

function showCustomerAuthPage(mode = 'login', updateAddress = true) {
  if (currentUser && String(currentUser.role || '').toLowerCase() !== 'customer') clearSession();
  moveCustomerAuthToPublicSite();
  document.querySelector('#admin-login-page').hidden = true;
  document.querySelector('#staff-login-page').hidden = true;
  document.querySelector('#referrer-invitation-page').hidden = true;
  document.querySelector('#workspace').hidden = true;
  document.querySelector('#site-header').hidden = false;
  document.querySelector('#public-site').hidden = false;
  document.querySelector('#account-profile-panel').hidden = true;
  document.querySelector('.auth-grid').hidden = false;
  document.querySelector('#logout-button').hidden = true;
  setCustomerAuthMode(mode);
  if (updateAddress) history.pushState(null, '', '/#customer-login');
  setPublicPage('customer-login', false);
}

document.querySelectorAll('[data-open-admin-login]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  showAdminLogin();
}));
document.querySelector('#show-register').addEventListener('click', () => setCustomerAuthMode('register'));
document.querySelector('#show-forgot-password').addEventListener('click', () => setCustomerAuthMode('forgot'));
document.querySelector('#show-login-from-register').addEventListener('click', () => setCustomerAuthMode('login'));
document.querySelector('#show-login-from-forgot').addEventListener('click', () => setCustomerAuthMode('login'));
customerLoginButton.addEventListener('click', () => {
  setSiteMenuOpen(false);
  if (String(currentUser?.role || '').toLowerCase() === 'customer') {
    openWorkspace('dashboard');
    return;
  }
  showCustomerAuthPage('login');
});
function setSiteMenuOpen(open) {
  siteHeader.classList.toggle('menu-open', open);
  siteMenuToggle.setAttribute('aria-expanded', String(open));
  siteMenuToggle.setAttribute('aria-label', open ? 'Close website menu' : 'Open website menu');
}
siteMenuToggle.addEventListener('click', () => {
  setSiteMenuOpen(siteMenuToggle.getAttribute('aria-expanded') !== 'true');
});
document.querySelectorAll('.site-nav [data-public-page-link]').forEach((link) => {
  link.addEventListener('click', () => setSiteMenuOpen(false));
});
document.addEventListener('click', (event) => {
  if (!siteHeader.contains(event.target)) setSiteMenuOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteMenuToggle.getAttribute('aria-expanded') === 'true') {
    setSiteMenuOpen(false);
    siteMenuToggle.focus();
  }
});
['#admin-home-link', '#admin-back-link'].forEach((selector) => {
  document.querySelector(selector).addEventListener('click', (event) => {
    event.preventDefault();
    showPublicSite();
  });
});
['#staff-home-link', '#staff-back-link'].forEach((selector) => {
  document.querySelector(selector).addEventListener('click', (event) => {
    event.preventDefault();
    showPublicSite();
  });
});

function setPublicPage(name, updateAddress = true) {
  const pages = ['home', 'about', 'products', 'contact', 'quotation', 'updates', 'article', 'membership', 'team', 'customer-login'];
  if (!pages.includes(name)) name = 'home';
  activePublicPage = name;
  setSkipTarget('public-site');
  document.querySelector('#public-site')?.setAttribute('data-active-page', name);
  document.querySelectorAll('#public-site [data-public-page]').forEach((section) => {
    section.classList.toggle('public-page-active', section.dataset.publicPage === name);
  });
  document.querySelectorAll('.site-nav [data-public-page-link]').forEach((link) => {
    const active = link.dataset.publicPageLink === (name === 'article' ? 'updates' : name);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (updateAddress) history.pushState(null, '', name === 'article' && activeArticle ? `#article/${encodeURIComponent(String(activeArticle.id || activeArticle.slug || ''))}` : `#${name}`);
  if (name === 'updates') loadPublishedContent();
  if (name === 'membership') loadRecruitmentOpportunities();
  if (name === 'article' && activeArticle) renderPublicArticle(activeArticle);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getClaricareChatReply(message) {
  const question = message.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (pattern) => pattern.test(question);
  const actions = {
    products: [['Browse products', 'products']],
    services: [['Learn about ClariCare', 'about'], ['Contact the team', 'contact']],
    quote: [['Request a quotation', 'quotation'], ['Contact the team', 'contact']],
    contact: [['Contact us', 'contact']],
  };
  const catalog = products.filter((product) => product && product.name);
  const namedProduct = catalog.find((product) => {
    const name = String(product.name).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    return name.length > 2 && question.includes(name);
  });
  const mentionedProduct = namedProduct || (claricareChatProductId && catalog.find((product) => product.id === claricareChatProductId));
  if (namedProduct) claricareChatProductId = namedProduct.id;
  const hasCatalogPrice = (product) => product.price !== null && product.price !== undefined && product.price !== '' && Number.isFinite(Number(product.price));

  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)\b/.test(question)) {
    return { text: 'Hello! I’m ClariCare’s website assistant. I can help you find a product, check product details or delivery information, learn about our services, or reach our team. What can I help with?', actions: actions.products };
  }
  if (has(/\b(thank|thanks|appreciate)\b/)) {
    return { text: 'You’re welcome! If you need anything else, ask me about our products, services, delivery, or how to contact the team.', actions: actions.contact };
  }
  if (has(/\b(health|medical|treat|cure|diagnos|prescri|eczema|acne|rash|allerg|pregnan|safe for|side effect)\b/)) {
    return { text: 'I can share product information published by ClariCare, but I can’t diagnose a condition or advise on treatment or personal medical suitability. Please check the product label and consult a qualified healthcare professional. You can contact our team about the product’s listed ingredients.', actions: actions.contact };
  }

  if (mentionedProduct && has(/\b(price|cost|how much|size|size options|measurement|price list|ingredient|contains|made of|how to use|usage|apply|benefit|what does|description|tell me about|details)\b/)) {
    const product = mentionedProduct;
    const variants = Array.isArray(product.sizeOptions) ? product.sizeOptions
      : Array.isArray(product.size_options) ? product.size_options
        : typeof product.size_options === 'string' ? (() => { try { return JSON.parse(product.size_options); } catch { return []; } })() : [];
    const options = variants.filter((option) => option && option.label && Number.isFinite(Number(option.price)));
    if (has(/\b(price|cost|how much|size|size options|measurement|price list)\b/)) {
      const priceText = options.length
        ? options.map((option) => `${option.label}: ${productMoney(option.price)}`).join('; ')
        : hasCatalogPrice(product) ? productMoney(product.price) : 'Price not listed';
      return { text: `${product.name}${product.category ? ` (${product.category})` : ''} is listed at ${priceText}. Visit Our products to see the full listing and available options.`, actions: actions.products };
    }
    if (has(/\b(ingredient|contains|made of)\b/)) {
      const ingredients = product.ingredients || product.ingredient_list;
      return { text: ingredients
        ? `The listed ingredients for ${product.name} are: ${ingredients}`
        : `I don’t see ingredient details listed for ${product.name} right now. Please check its product page or ask our team for current information.`,
      actions: ingredients ? actions.products : actions.contact };
    }
    if (has(/\b(how to use|usage|apply)\b/)) {
      const instructions = product.how_to_use || product.howToUse || product.instructions;
      return { text: instructions
        ? `The product page says to use ${product.name} this way: ${instructions}`
        : `Usage instructions aren’t listed for ${product.name} yet. Please check the packaging or contact our team before use.`,
      actions: instructions ? actions.products : actions.contact };
    }
    if (has(/\b(benefit|what does)\b/)) {
      const benefits = product.concerns_and_benefits || product.concernsAndBenefits || product.benefits;
      return { text: benefits
        ? `ClariCare lists these details for ${product.name}: ${benefits}`
        : `There aren’t specific benefits listed for ${product.name} right now. You can read its product description or ask our team.`,
      actions: benefits ? actions.products : actions.contact };
    }
    return { text: `${product.name}: ${product.description || 'A ClariCare product.'} Visit Our products to view its details and available options.`, actions: actions.products };
  }

  if (has(/\b(deliver|delivery|shipping|courier|how long|when will|shipping cost)\b/)) {
    return { text: 'Current delivery estimates: Nairobi KSh 700 (usually 1–3 hours on business days); Mombasa KSh 2,500 (usually the next business day); other counties KSh 1,500 (typically 1–3 working days in major towns, 2–5 elsewhere). Orders above KSh 5,000 qualify for free delivery. Timing can vary by location and courier availability.', actions: [['Read delivery & returns policy', 'delivery-policy'], ...actions.contact] };
  }
  if (has(/\b(return|refund|exchange|damaged|defective|wrong item|cancel order)\b/)) {
    return { text: 'For damaged, defective, incorrect, or materially different items, contact ClariCare within 24 hours of delivery. Eligible unused and unopened items may be considered for exchange or store credit; opened or used products are generally not eligible unless defective or required by law. For an order-specific request, include your order number and contact our team.', actions: [['Read delivery & returns policy', 'delivery-policy'], ...actions.contact] };
  }
  if (has(/\b(quote|quotation|custom price|service price|how much for|pricing for)\b/)) {
    return { text: 'For a product or service quote, use Ask a quotation to tell the team what you need. Product catalog prices are shown on each product listing.', actions: actions.quote };
  }
  if (has(/\b(formulat|formulation|develop a product|make a product|private label|cosmetic service|consult|business service)\b/)) {
    return { text: 'ClariCare provides cosmetic formulation support for people and businesses developing products. Tell the team about your project and requirements to discuss the right support and pricing.', actions: actions.services };
  }
  if (has(/\b(education|learn|training|course|class|workshop|ingredient science)\b/)) {
    return { text: 'ClariCare shares learning opportunities and digital resources about cosmetic ingredients, formulation techniques, and responsible product development. Contact the team to ask what learning support is currently available.', actions: actions.services };
  }
  if (has(/\b(product|shop|buy|order|skincare|cream|moisturi|catalog|collection)\b/)) {
    if (catalog.length) {
      const listed = catalog.slice(0, 5).map((product) => `${product.name}${hasCatalogPrice(product) ? ` (${productMoney(product.price)})` : ''}`).join('; ');
      return { text: `Here are some products currently in the catalog: ${listed}${catalog.length > 5 ? '; and more' : ''}. Open a product listing for its description, ingredients, usage instructions, and available options.`, actions: actions.products };
    }
    return { text: 'Browse the Our products page to view the current collection and product details. The live catalog isn’t available to me right now, so I can’t confirm which items are in stock.', actions: actions.products };
  }
  if (has(/\b(cart|checkout|pay|payment|place an order|customer account|sign in|login)\b/)) {
    return { text: 'To shop, browse Our products, open a product to choose an option, and add it to your cart. Sign in or create a customer account to continue to your cart and checkout.', actions: [['Browse products', 'products'], ['Customer sign in', 'customer-login']] };
  }
  if (has(/\b(contact|email|phone|whatsapp|human|talk|speak|support|help|reach)\b/)) {
    return { text: 'You can reach ClariCare at claricarebotanica@gmail.com or +254 798 065 875 on WhatsApp. The team aims to respond within one business day.', actions: actions.contact };
  }
  if (has(/\b(update|news|blog|video|article)\b/)) {
    return { text: 'The Updates page brings together ClariCare stories, company news, and videos when available.', actions: [['Browse updates', 'updates']] };
  }
  if (has(/\b(member|join|membership|career|job|vacan|apply for a role)\b/)) {
    return { text: 'Visit Membership to learn about becoming a member, or browse open opportunities and apply through the applicant portal when positions are available.', actions: [['Membership information', 'membership'], ['Meet the team', 'team']] };
  }
  if (has(/\b(team|people|staff|founder)\b/)) {
    return { text: 'Visit the Team page to learn about the people behind ClariCare.', actions: [['Meet the team', 'team']] };
  }
  if (has(/\b(about|company|who are you|what is claricare|what do you do|website|navigate|where|page|menu|find)\b/)) {
    return { text: 'ClariCare Botanica Ltd brings together botanical skincare products, cosmetic formulation support, and cosmetic learning. Use the site menu to explore the company, product collection, contact options, quotations, and updates.', actions: [['About ClariCare', 'about'], ...actions.products] };
  }
  return { text: 'I’m not sure I understood that. I can help with product details from the catalog, delivery and returns, quotations, ClariCare services, or contacting the team. What would you like to know?', actions: [['Browse products', 'products'], ['Delivery & returns', 'delivery-policy'], ...actions.contact] };
}

function addClaricareChatMessage(message, sender, actions = []) {
  const messages = document.querySelector('#claricare-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `claricare-chat-message ${sender}`;
  bubble.textContent = message;
  messages.append(bubble);
  if (actions.length) {
    const actionRow = document.createElement('div');
    actionRow.className = 'claricare-chat-actions';
    actions.forEach(([label, page]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        document.querySelector('#claricare-chat-panel').hidden = true;
        document.querySelector('#claricare-chat-launcher').setAttribute('aria-expanded', 'false');
        if (page === 'delivery-policy') document.querySelector('#delivery-policy-dialog').showModal();
        else if (page === 'customer-login') showCustomerAuthPage('login');
        else setPublicPage(page);
      });
      actionRow.append(button);
    });
    messages.append(actionRow);
  }
  messages.scrollTop = messages.scrollHeight;
}

const claricareChatPanel = document.querySelector('#claricare-chat-panel');
const claricareChatLauncher = document.querySelector('#claricare-chat-launcher');
function setClaricareChatOpen(isOpen) {
  claricareChatPanel.hidden = !isOpen;
  claricareChatLauncher.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) document.querySelector('#claricare-chat-input').focus();
}
claricareChatLauncher.addEventListener('click', () => setClaricareChatOpen(claricareChatPanel.hidden));
document.querySelector('#claricare-chat-close').addEventListener('click', () => setClaricareChatOpen(false));
document.querySelector('#claricare-chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#claricare-chat-input');
  const message = input.value.trim();
  if (!message) return;
  addClaricareChatMessage(message, 'visitor');
  const reply = getClaricareChatReply(message);
  addClaricareChatMessage(reply.text, 'bot', reply.actions);
  input.value = '';
  input.focus();
});
document.querySelectorAll('[data-chat-prompt]').forEach((button) => button.addEventListener('click', () => {
  const input = document.querySelector('#claricare-chat-input');
  input.value = button.dataset.chatPrompt;
  document.querySelector('#claricare-chat-form').requestSubmit();
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !claricareChatPanel.hidden) setClaricareChatOpen(false);
});

function setUpdatesTab(name) {
  const selected = ['blogs', 'news', 'videos'].includes(name) ? name : 'blogs';
  document.querySelectorAll('[data-updates-tab]').forEach((button) => {
    const active = button.dataset.updatesTab === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.updates-panel').forEach((panel) => {
    panel.hidden = panel.id !== `updates-panel-${selected}`;
  });
}

document.querySelectorAll('[data-updates-tab]').forEach((button) => {
  button.addEventListener('click', () => setUpdatesTab(button.dataset.updatesTab));
});

document.querySelectorAll('[data-public-page-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setPublicPage(link.dataset.publicPageLink);
  });
});
document.querySelector('#public-article-back').addEventListener('click', () => setPublicPage('updates'));

window.addEventListener('hashchange', () => {
  if (document.querySelector('#workspace').hidden && document.querySelector('#admin-login-page').hidden && document.querySelector('#staff-login-page').hidden) {
    if (location.hash.slice(1) === 'customer-login') showCustomerAuthPage('login', false);
    else if (location.hash.slice(1).startsWith('article/')) showArticleFromRoute(decodeURIComponent(location.hash.slice(1).slice(8)));
    else setPublicPage(location.hash.slice(1), false);
  }
});
window.addEventListener('popstate', () => {
  if (!document.querySelector('#workspace').hidden) return;
  const path = location.pathname.replace(/\/$/, '');
  if (path === '/admin') showAdminLogin(false);
  else if (path === '/employee-login' || path === '/employee') showStaffLogin('employee', false);
  else if (path === '/referrer-login' || path === '/referrer') showStaffLogin('referrer', false);
  else if (path === '/applicant-login' || path === '/applicant') showStaffLogin('applicant', false);
  else if (path === '/accept-invitation') showReferrerInvitationPage();
  else showPublicSite(false);
});

function apiBase() {
  return API_BASE_URL;
}

function setFeedback(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(localStorage.getItem(TOKEN_STORAGE_KEY)
          ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY)}` }
          : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(`Could not reach the API at ${apiBase()}. Check that the backend is running and the URL is correct.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) throw new Error(`Request failed (${response.status}) at ${apiBase()}${path}. The server did not return a JSON error.`);
    throw new Error('The API returned a response that was not valid JSON.');
  }
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.call = data.call;
    throw error;
  }
  return data;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(data) {
  currentUser = data.user;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  updateProfile();
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  updateProfile();
}

function updateProfile() {
  const signedIn = Boolean(currentUser);
  const role = String(currentUser?.role || '').toLowerCase();
  document.querySelector('#workspace').classList.toggle('customer-workspace', role === 'customer');
  document.querySelector('#customer-dashboard-logout').hidden = role !== 'customer';
  customerLoginButton.hidden = false;
  customerLoginButton.querySelector('.login-label-full').textContent = role === 'customer' ? 'My account' : 'Customer login';
  customerLoginButton.querySelector('.login-label-short').textContent = role === 'customer' ? 'Account' : 'Login';
  customerLoginButton.setAttribute('aria-label', role === 'customer' ? 'Open your customer dashboard' : 'Customer sign in or create an account');
  document.querySelector('#agreement-employee-id').value = signedIn ? currentUser.id : '';
  document.querySelector('#logout-button').hidden = !signedIn;
  document.querySelector('#manual-sale-panel').hidden = !isFinanceUser();
  const profilePanel = document.querySelector('#account-profile-panel');
  profilePanel.hidden = !signedIn;
  document.querySelector('.auth-grid').hidden = signedIn;
  if (signedIn) {
    document.querySelector('#account-page-eyebrow').textContent = 'ACCOUNT PROFILE';
    document.querySelector('#customer-auth-title').textContent = 'Your account';
    document.querySelector('#customer-auth-intro').textContent = 'Manage your profile photo and account details.';
    document.querySelector('#account-profile-name').textContent = currentUser.name;
    document.querySelector('#account-profile-email').textContent = currentUser.email;
    document.querySelector('#account-profile-role').textContent = role;
    document.querySelector('#account-avatar-initials').textContent = String(currentUser.name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    const photo = document.querySelector('#account-profile-image');
    photo.hidden = !currentUser.profileImage;
    photo.src = currentUser.profileImage || '';
    document.querySelector('#account-avatar-initials').hidden = Boolean(currentUser.profileImage);
  } else {
    document.querySelector('#account-page-eyebrow').textContent = 'YOUR CUSTOMER ACCOUNT';
    document.querySelector('#customer-auth-title').textContent = 'Welcome back';
    document.querySelector('#customer-auth-intro').textContent = 'Sign in to your customer account to continue.';
  }
}

function isFinanceUser() {
  return String(currentUser?.role || '').toLowerCase() === 'admin';
}

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount);
}

function productMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `KSh ${money(amount)}` : '—';
}

function setOptions(select, rows, placeholder) {
  const selected = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  rows.forEach((row) => select.add(new Option(row.name, row.id)));
  if (rows.some((row) => row.id === selected)) select.value = selected;
}

function setConnection(online, detail) {
  const statusText = connectionStatus.querySelector('span:last-child');
  const dot = connectionStatus.querySelector('.status-dot');
  statusText.textContent = online ? 'Backend connected' : 'Backend unavailable';
  dot.classList.toggle('online', online);
  dot.classList.toggle('offline', !online);
}

async function checkHealth() {
  connectionStatus.querySelector('span:last-child').textContent = 'Checking backend';
  try {
    const data = await apiRequest('/health');
    setConnection(data.status === 'ok', data.status === 'ok'
      ? `${data.service || 'ClariCare API'} is responding.`
      : 'The API responded, but did not report a healthy status.');
  } catch (error) {
    setConnection(false, error.message);
  }
}

function setView(name) {
  if (!name) return;
  if (name !== 'contact-center') {
    clearInterval(inboxPoll);
    inboxPoll = null;
    callQueuePoll = null;
    clearInterval(agentConversationPoll);
    agentConversationPoll = null;
  }
  if (name !== 'department-discussions') {
    clearInterval(departmentDiscussionPoll);
    departmentDiscussionPoll = null;
  }
  const role = String(currentUser?.role || '').toLowerCase();
  const adminDiagnosticsVisible = role === 'admin';
  document.querySelector('#workspace-api-config').hidden = !adminDiagnosticsVisible;
  document.querySelector('#connection-status').hidden = !adminDiagnosticsVisible;
  const allowedViews = role === 'admin'
    ? ['dashboard', 'department-discussions', 'account-management', 'registered-users', 'people', 'agreements', 'products', 'content', 'accounting', 'inventory', 'referrals', 'contact-center', 'auth']
    : role === 'customer'
      ? ['dashboard', 'customer-call', 'customer-chat', 'customer-cart', 'customer-products']
    : role === 'applicant'
      ? ['dashboard', 'applicant-application', 'auth']
    : role === 'employee'
      ? ['dashboard', 'department-discussions', 'contact-center', 'products', 'auth']
      : role === 'referrer'
        ? ['dashboard', 'auth']
      : currentUser ? ['dashboard', 'auth'] : ['auth'];
  if (!allowedViews.includes(name)) name = currentUser ? 'dashboard' : 'auth';
  setSkipTarget('workspace-main');
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
    item.hidden = !allowedViews.includes(item.dataset.view);
    const active = item.dataset.view === name;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const selected = document.querySelector(`.nav-item[data-view="${name}"]`);
  selected?.scrollIntoView({ block: 'nearest' });
  const selectedLabel = selected ? [...selected.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent).join(' ').replace(/\s+/g, ' ').trim() : '';
  document.querySelector('#breadcrumb-current').textContent = selectedLabel || 'Overview';
  if (name === 'products') { setProductsPage('catalog'); loadProducts(); }
  if (name === 'content') loadAdminContent();
  if (name === 'accounting') { setAccountingPage('trends'); loadAccounting(); }
  if (name === 'inventory') { setInventoryPage('overview'); loadInventoryDashboard(); }
  if (name === 'referrals') document.querySelector('#referral-result').replaceChildren();
  if (name === 'contact-center') { setContactCenterPage('messages'); loadInbox(); }
  if (name === 'dashboard') loadRoleDashboard();
  if (name === 'department-discussions') {
    loadDepartmentDiscussions();
    clearInterval(departmentDiscussionPoll);
    departmentDiscussionPoll = setInterval(() => loadDepartmentDiscussions({ background: true }), 20000);
  }
  if (name === 'account-management' || name === 'registered-users') loadAdminUsers();
  if (name === 'people') {
    setPeoplePage(selectedPeoplePage);
    loadCompanyStructure();
  }
  if (name === 'customer-chat') loadCustomerChatPage();
  if (name === 'customer-cart') loadCustomerCartPage();
  if (name === 'customer-products') loadCustomerProductsPage();
  if (name === 'applicant-application') loadApplicantApplicationForm(pendingApplicantPositionId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setPeoplePage(name) {
  const availablePages = [...document.querySelectorAll('[data-people-subpage]')].map((page) => page.dataset.peopleSubpage);
  selectedPeoplePage = availablePages.includes(name) ? name : 'departments';
  document.querySelectorAll('[data-people-subpage]').forEach((page) => {
    page.hidden = page.dataset.peopleSubpage !== selectedPeoplePage;
  });
  document.querySelectorAll('.people-page-link[data-people-page]').forEach((link) => {
    const active = link.dataset.peoplePage === selectedPeoplePage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (selectedPeoplePage === 'applicants') loadRecruitmentApplications();
}

function discussionReadStorageKey() {
  return `claricare-discussion-read-${currentUser?.id || 'anonymous'}`;
}

function readDiscussionCheckpoints() {
  try {
    const value = JSON.parse(localStorage.getItem(discussionReadStorageKey()) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function discussionPoint(message) {
  return { createdAt: message?.created_at || '', id: message?.id || '' };
}

function compareDiscussionPoints(left, right) {
  const timeOrder = String(left?.createdAt || '').localeCompare(String(right?.createdAt || ''));
  return timeOrder || String(left?.id || '').localeCompare(String(right?.id || ''));
}

function markDepartmentDiscussionRead(departmentId, messages) {
  const latest = messages[messages.length - 1];
  if (!latest) return;
  const checkpoints = readDiscussionCheckpoints();
  checkpoints[departmentId] = discussionPoint(latest);
  localStorage.setItem(discussionReadStorageKey(), JSON.stringify(checkpoints));
  departmentDiscussionUnreadCounts[departmentId] = 0;
  renderDepartmentDiscussionList();
}

function renderDepartmentDiscussionList() {
  const list = document.querySelector('#department-discussion-list');
  list.replaceChildren();
  if (!departmentDiscussionDepartments.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = currentUser?.role === 'employee'
      ? 'Your account is not assigned to a department. Ask an administrator to update your assignment.'
      : 'No departments are available yet.';
    list.append(empty);
  }
  departmentDiscussionDepartments.forEach((department) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'department-discussion-channel-button';
    button.classList.toggle('active', department.id === selectedDiscussionDepartmentId);
    button.setAttribute('aria-pressed', String(department.id === selectedDiscussionDepartmentId));
    const name = document.createElement('span');
    name.textContent = department.name;
    const unread = Number(departmentDiscussionUnreadCounts[department.id]) || 0;
    if (unread) {
      const badge = document.createElement('span');
      badge.className = 'discussion-unread-badge';
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.setAttribute('aria-label', `${unread} unread ${unread === 1 ? 'message' : 'messages'}`);
      button.append(name, badge);
    } else button.append(name);
    button.addEventListener('click', () => {
      if (selectedDiscussionDepartmentId === department.id) return;
      selectedDiscussionDepartmentId = department.id;
      loadDepartmentDiscussions();
    });
    list.append(button);
  });
  const total = Object.values(departmentDiscussionUnreadCounts).reduce((sum, count) => sum + (Number(count) || 0), 0);
  const totalBadge = document.querySelector('#department-discussion-unread-total');
  totalBadge.hidden = total === 0;
  totalBadge.textContent = total > 99 ? '99+' : String(total);
}

function renderDepartmentDiscussionMessages(department, messages) {
  const title = document.querySelector('#department-discussion-title');
  const note = document.querySelector('#department-discussion-member-note');
  const history = document.querySelector('#department-discussion-messages');
  const form = document.querySelector('#department-discussion-form');
  title.textContent = department?.name || 'Select a department';
  note.textContent = currentUser?.role === 'admin' ? 'Administrator access' : 'Department members';
  form.hidden = !department;
  history.replaceChildren();
  if (!department) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Choose an available department channel to view its discussion.';
    history.append(empty);
    return;
  }
  if (!messages.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No messages yet. Start the discussion with your team.';
    history.append(empty);
    return;
  }
  messages.forEach((message) => {
    const item = document.createElement('article');
    item.className = 'department-discussion-message';
    if (message.sender_id === currentUser?.id) item.classList.add('own');
    const header = document.createElement('div');
    header.className = 'department-discussion-message-meta';
    const sender = document.createElement('strong');
    sender.textContent = message.sender_name || 'Workspace member';
    const role = document.createElement('span');
    role.textContent = message.sender_role === 'admin' ? 'Administrator' : 'Team member';
    const time = document.createElement('time');
    time.dateTime = message.created_at || '';
    const parsedTime = Date.parse(message.created_at || '');
    time.textContent = Number.isFinite(parsedTime) ? formatEATDateTime(parsedTime) : '';
    header.append(sender, role, time);
    const body = document.createElement('p');
    body.textContent = message.message;
    item.append(header, body);
    history.append(item);
  });
  history.scrollTop = history.scrollHeight;
}

async function loadDepartmentDiscussions({ background = false } = {}) {
  const feedback = document.querySelector('#department-discussions-feedback');
  const loadId = ++departmentDiscussionLoadId;
  if (!background) setFeedback(feedback, 'Loading department discussions…');
  try {
    const { departments = [] } = await apiRequest('/company/discussions');
    if (loadId !== departmentDiscussionLoadId) return;
    departmentDiscussionDepartments = departments;
    if (!departments.some((department) => department.id === selectedDiscussionDepartmentId)) {
      selectedDiscussionDepartmentId = departments[0]?.id || '';
    }
    const results = await Promise.all(departments.map(async (department) => {
      const { messages = [] } = await apiRequest(`/company/departments/${encodeURIComponent(department.id)}/messages?limit=200`);
      return [department, messages];
    }));
    if (loadId !== departmentDiscussionLoadId) return;
    const checkpoints = readDiscussionCheckpoints();
    results.forEach(([department, messages]) => {
      if (!Object.prototype.hasOwnProperty.call(checkpoints, department.id)) {
        const latest = messages[messages.length - 1];
        checkpoints[department.id] = latest ? discussionPoint(latest) : { createdAt: '', id: '' };
        departmentDiscussionUnreadCounts[department.id] = 0;
      } else {
        departmentDiscussionUnreadCounts[department.id] = messages.filter((message) =>
          compareDiscussionPoints(discussionPoint(message), checkpoints[department.id]) > 0
        ).length;
      }
    });
    departmentDiscussionUnreadCounts = Object.fromEntries(results.map(([department]) => [
      department.id,
      Number(departmentDiscussionUnreadCounts[department.id]) || 0,
    ]));
    localStorage.setItem(discussionReadStorageKey(), JSON.stringify(checkpoints));
    renderDepartmentDiscussionList();
    const selected = results.find(([department]) => department.id === selectedDiscussionDepartmentId);
    if (selected) {
      const [department, messages] = selected;
      renderDepartmentDiscussionMessages(department, messages);
      markDepartmentDiscussionRead(department.id, messages);
    } else {
      renderDepartmentDiscussionMessages(null, []);
    }
    if (!background) setFeedback(feedback, 'Showing up to the latest 200 messages. New messages refresh automatically every 20 seconds.');
    else setFeedback(feedback, '');
  } catch (error) {
    if (loadId !== departmentDiscussionLoadId) return;
    setFeedback(feedback, error.message, true);
    if (!background) renderDepartmentDiscussionMessages(null, []);
  }
}

document.querySelector('#refresh-department-discussions').addEventListener('click', () => loadDepartmentDiscussions());
document.querySelector('#department-discussion-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.elements.message;
  const button = form.querySelector('button[type="submit"]');
  const message = input.value.trim();
  if (!selectedDiscussionDepartmentId || !message) return;
  button.disabled = true;
  try {
    await apiRequest(`/company/departments/${encodeURIComponent(selectedDiscussionDepartmentId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    input.value = '';
    await loadDepartmentDiscussions();
  } catch (error) {
    setFeedback(document.querySelector('#department-discussions-feedback'), error.message, true);
  } finally {
    button.disabled = false;
  }
});

function dashboardMetric(label, value, detail = '') {
  const card = document.createElement('article');
  card.className = 'summary-card';
  const caption = document.createElement('span');
  caption.textContent = label;
  const number = document.createElement('strong');
  number.textContent = value ?? '—';
  const note = document.createElement('small');
  note.textContent = detail;
  card.append(caption, number, note);
  return card;
}

function renderAdminDashboardCharts(stats = {}) {
  const visuals = document.createElement('section');
  visuals.className = 'admin-dashboard-visuals';

  const activity = [
    ['Users', Number(stats.totalUsers) || 0],
    ['Products', Number(stats.totalProducts) || 0],
    ['Sales', Number(stats.totalSales) || 0],
    ['Messages', Number(stats.totalMessages) || 0],
    ['Referrals', Number(stats.totalReferrals) || 0],
  ];
  const colors = ['#4e8765', '#c49b5b', '#7186b4', '#bd806c', '#719c97'];
  const piePanel = document.createElement('section');
  piePanel.className = 'panel admin-chart-panel';
  piePanel.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">WORKSPACE MIX</p><h2>Activity by category</h2></div><span class="pill">Record counts</span></div>';
  const pieBody = document.createElement('div'); pieBody.className = 'admin-pie-body';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Pie chart of users, products, sales, messages, and referrals');
  const total = activity.reduce((sum, item) => sum + item[1], 0);
  if (!total) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', '100'); circle.setAttribute('cy', '100'); circle.setAttribute('r', '82'); circle.setAttribute('fill', '#e9eee8'); svg.append(circle);
  } else if (activity.filter((row) => row[1] > 0).length === 1) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', '100'); circle.setAttribute('cy', '100'); circle.setAttribute('r', '82'); circle.setAttribute('fill', colors[activity.findIndex((row) => row[1] > 0)]); svg.append(circle);
  } else {
    let angle = -Math.PI / 2;
    activity.forEach(([label, value], index) => {
      if (!value) return;
      const next = angle + (value / total) * Math.PI * 2;
      const largeArc = next - angle > Math.PI ? 1 : 0;
      const point = (a) => [100 + 82 * Math.cos(a), 100 + 82 * Math.sin(a)];
      const [x1, y1] = point(angle); const [x2, y2] = point(next);
      const slice = document.createElementNS(svg.namespaceURI, 'path');
      slice.setAttribute('d', `M100 100 L${x1} ${y1} A82 82 0 ${largeArc} 1 ${x2} ${y2} Z`);
      slice.setAttribute('fill', colors[index]); slice.setAttribute('aria-label', `${label}: ${value}`); svg.append(slice); angle = next;
    });
  }
  const pieWrap = document.createElement('div'); pieWrap.className = 'admin-pie-wrap'; pieWrap.append(svg);
  const legend = document.createElement('div'); legend.className = 'customer-chart-legend admin-chart-legend';
  activity.forEach(([label, value], index) => {
    const row = document.createElement('div');
    const swatch = document.createElement('span'); swatch.style.setProperty('--legend-color', colors[index]);
    const name = document.createElement('span'); name.textContent = label;
    const number = document.createElement('strong'); number.textContent = value.toLocaleString();
    row.append(swatch, name, number); legend.append(row);
  });
  pieBody.append(pieWrap, legend); piePanel.append(pieBody);

  const revenuePanel = document.createElement('section');
  revenuePanel.className = 'panel admin-chart-panel';
  revenuePanel.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">SALES TRENDS</p><h2>Recorded revenue by month</h2><p class="admin-chart-caption">Backend recorded units · currency unspecified</p></div></div>';
  const chart = document.createElement('div'); chart.className = 'admin-revenue-chart';
  const monthly = new Map();
  (Array.isArray(stats.summary?.salesTrend) ? stats.summary.salesTrend : []).forEach((sale) => {
    const date = String(sale.date || '').slice(0, 7);
    const revenue = Number(sale.revenue);
    if (/^\d{4}-\d{2}$/.test(date) && Number.isFinite(revenue)) monthly.set(date, (monthly.get(date) || 0) + revenue);
  });
  const points = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  if (!points.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'Monthly revenue bars will appear after sales are recorded.'; chart.append(empty);
  } else {
    const barSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const width = 620; const height = 250; const left = 42; const right = 12; const top = 16; const bottom = 48;
    const plotWidth = width - left - right; const plotHeight = height - top - bottom; const max = Math.max(1, ...points.map(([, value]) => value));
    barSvg.setAttribute('viewBox', `0 0 ${width} ${height}`); barSvg.setAttribute('role', 'img'); barSvg.setAttribute('aria-label', `Monthly recorded revenue bar chart for ${points.length} months`);
    [0, 0.5, 1].forEach((fraction) => {
      const y = top + plotHeight * (1 - fraction);
      const line = document.createElementNS(barSvg.namespaceURI, 'line'); line.setAttribute('x1', String(left)); line.setAttribute('x2', String(width - right)); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'admin-chart-gridline'); barSvg.append(line);
      const label = document.createElementNS(barSvg.namespaceURI, 'text'); label.setAttribute('x', String(left - 7)); label.setAttribute('y', String(y + 4)); label.setAttribute('text-anchor', 'end'); label.setAttribute('class', 'admin-chart-axis-label'); label.textContent = Math.round(max * fraction).toLocaleString(); barSvg.append(label);
    });
    const slot = plotWidth / points.length; const barWidth = Math.min(46, slot * .56);
    points.forEach(([month, value], index) => {
      const barHeight = Math.max(value > 0 ? 2 : 0, (value / max) * (plotHeight - 5));
      const x = left + slot * index + (slot - barWidth) / 2; const y = top + plotHeight - barHeight;
      const bar = document.createElementNS(barSvg.namespaceURI, 'rect'); bar.setAttribute('x', String(x)); bar.setAttribute('y', String(y)); bar.setAttribute('width', String(barWidth)); bar.setAttribute('height', String(barHeight)); bar.setAttribute('rx', '5'); bar.setAttribute('class', 'admin-revenue-bar'); barSvg.append(bar);
      const valueLabel = document.createElementNS(barSvg.namespaceURI, 'text'); valueLabel.setAttribute('x', String(x + barWidth / 2)); valueLabel.setAttribute('y', String(Math.max(top + 11, y - 6))); valueLabel.setAttribute('text-anchor', 'middle'); valueLabel.setAttribute('class', 'admin-chart-value-label'); valueLabel.textContent = value.toLocaleString(undefined, { maximumFractionDigits: 0 }); barSvg.append(valueLabel);
      const dateLabel = document.createElementNS(barSvg.namespaceURI, 'text'); dateLabel.setAttribute('x', String(left + slot * index + slot / 2)); dateLabel.setAttribute('y', String(height - 20)); dateLabel.setAttribute('text-anchor', 'middle'); dateLabel.setAttribute('class', 'admin-chart-axis-label'); dateLabel.textContent = formatEATDateTime(`${month}-01`, { month: 'short', year: '2-digit' }); barSvg.append(dateLabel);
    });
    chart.append(barSvg);
  }
  revenuePanel.append(chart);
  visuals.append(piePanel, revenuePanel);
  return visuals;
}

function dashboardSection(title, items, formatter) {
  const panel = document.createElement('section');
  panel.className = 'panel dashboard-list-panel';
  const heading = document.createElement('h2');
  heading.textContent = title;
  panel.append(heading);
  const list = document.createElement('div');
  list.className = 'record-list';
  if (!items?.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nothing to show yet.';
    list.append(empty);
  } else {
    items.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'record-row';
      const text = document.createElement('div');
      const name = document.createElement('strong');
      const detail = document.createElement('small');
      const description = document.createElement('p');
      const fields = formatter(item);
      name.textContent = fields.name || 'Record';
      detail.textContent = fields.detail || '';
      description.textContent = fields.description || '';
      text.append(name, detail, description);
      row.append(text);
      list.append(row);
    });
  }
  panel.append(list);
  return panel;
}

async function loadRoleDashboard() {
  const content = document.querySelector('#dashboard-content');
  const feedback = document.querySelector('#dashboard-feedback');
  content.replaceChildren();
  if (!currentUser) {
    document.querySelector('#dashboard-title').textContent = 'Sign in to continue';
    document.querySelector('#dashboard-intro').textContent = 'Each account has its own role dashboard.';
    setFeedback(feedback, 'Sign in to load a role-specific dashboard.', true);
    return;
  }
  const role = String(currentUser.role || '').toLowerCase();
  document.querySelector('#view-dashboard').classList.toggle('customer-dashboard-view', role === 'customer');
  document.querySelector('#view-dashboard').classList.toggle('admin-dashboard-view', role === 'admin');
  content.classList.toggle('customer-dashboard-content', role === 'customer');
  if (!['admin', 'employee', 'customer', 'referrer', 'applicant'].includes(role)) {
    document.querySelector('#dashboard-title').textContent = 'Dashboard unavailable';
    document.querySelector('#dashboard-intro').textContent = 'This account does not have a supported dashboard role.';
    setFeedback(feedback, 'Ask an administrator to review your account role.', true);
    return;
  }
  document.querySelector('#dashboard-title').textContent = `${role[0].toUpperCase()}${role.slice(1)} dashboard`;
  document.querySelector('#dashboard-intro').textContent = role === 'customer'
    ? `Welcome, ${currentUser.name}. Review your account activity and choose a way to reach our team.`
    : role === 'applicant'
      ? `Welcome, ${currentUser.name}. View your application progress and updates from ClariCare.`
    : `Welcome, ${currentUser.name}. This view is limited to your ${role} workspace.`;
  setFeedback(feedback, 'Loading your dashboard…');
  try {
    let data;
    let customerCart = null;
    let customerConversations = [];
    let customerCallStats = {};
    if (role === 'customer') {
      [data, customerCart, { conversations: customerConversations }] = await Promise.all([
        apiRequest('/dashboard/customer'),
        apiRequest(`/cart?customerId=${encodeURIComponent(currentUser.id)}`),
        apiRequest('/customer/contact/conversations'),
      ]);
    } else if (role === 'admin') {
      data = await apiRequest('/dashboard/admin');
    } else {
      data = await apiRequest(`/dashboard/${role}`);
    }
    const metrics = document.createElement('div');
    metrics.className = 'accounting-summary dashboard-metrics';
    if (role === 'admin') {
      const stats = data.stats || {};
      metrics.append(
        dashboardMetric('USERS', stats.totalUsers, 'All registered accounts'),
        dashboardMetric('PRODUCTS', stats.totalProducts, 'Catalog products'),
        dashboardMetric('SALES', stats.totalSales, 'Recorded sales'),
        dashboardMetric('MESSAGES', stats.totalMessages, 'Customer messages'),
        dashboardMetric('REFERRALS', stats.totalReferrals, 'Referral records'),
        dashboardMetric('REVENUE', money(stats.summary?.totalRevenue ?? stats.summary?.totalSales), 'Accounting summary'),
      );
      content.append(metrics, renderAdminDashboardCharts(stats));
    } else if (role === 'referrer') {
      const summary = data.summary || {};
      metrics.append(
        dashboardMetric('REFERRALS', summary.totalReferrals ?? 0, 'Your referral records'),
        dashboardMetric('REFERRED SALES', money(summary.totalSales), 'Sales attributed to you'),
        dashboardMetric('COMMISSION', money(summary.totalCommission), 'Commission recorded by the backend'),
      );
      content.append(metrics, dashboardSection('Your referrals', data.referrals, (item) => ({
        name: item.customer_name || item.customerName || 'Referral',
        detail: `${money(item.sale_amount)} sale · ${money(item.commission_amount)} commission · ${item.status || 'recorded'}`,
        description: item.note || item.referred_at || '',
      })));
    } else if (role === 'employee') {
      content.append(
        dashboardSection('Your company assignment', data.user?.departmentName ? [{
          name: data.user.position || 'Position not assigned',
          detail: data.user.departmentName,
          description: data.user.positionDescription || 'Your department and position are assigned by a ClariCare administrator.',
        }] : [], (item) => item),
        dashboardSection('Recent customer messages', data.recentMessages, (item) => ({ name: item.customer_name || item.customerName, detail: `${item.channel || 'message'} · ${formatEATDateTime(item.created_at || item.createdAt)}`, description: item.message })),
      );
    } else if (role === 'applicant') {
      content.append(renderApplicantApplications(data.applications || []));
    } else if (role === 'customer') {
      renderCustomerDashboard(content, data, customerCart, customerConversations, customerCallStats);
    }
    if (role === 'employee' || role === 'referrer') await appendMyAgreements(content);
    setFeedback(feedback, role === 'customer' ? 'Your dashboard is up to date.' : 'Dashboard data loaded from your protected role endpoint.');
  } catch (error) {
    setFeedback(feedback, error.message, true);
  }
}

async function loadAdminUsers() {
  const inviteContent = document.querySelector('#admin-user-invite-content');
  const usersContent = document.querySelector('#registered-users-content');
  const inviteFeedback = document.querySelector('#account-management-feedback');
  const usersFeedback = document.querySelector('#registered-users-feedback');
  if (!inviteContent || !usersContent) return;
  inviteContent.replaceChildren();
  usersContent.replaceChildren();
  if (String(currentUser?.role || '').toLowerCase() !== 'admin') {
    setFeedback(inviteFeedback, 'Account management is available to administrators only.', true);
    setFeedback(usersFeedback, 'Registered users are available to administrators only.', true);
    return;
  }
  setFeedback(inviteFeedback, 'Loading account management…');
  setFeedback(usersFeedback, 'Loading registered users…');
  try {
    const [payload, structure] = await Promise.all([
      apiRequest('/admin/users?includeDeleted=true'),
      apiRequest('/company/structure'),
    ]);
    const userPanel = renderAdminUsers({ ...payload, ...structure });
    const invitePanel = userPanel.querySelector('.admin-invite-panel');
    if (invitePanel) {
      invitePanel.remove();
      inviteContent.replaceChildren(invitePanel);
    } else {
      const error = document.createElement('p'); error.className = 'muted'; error.textContent = 'User management could not be loaded from the backend.'; inviteContent.replaceChildren(error);
    }
    usersContent.replaceChildren(userPanel);
    setFeedback(inviteFeedback, invitePanel ? 'Send a department- and position-specific employee invitation or invite a referrer.' : 'User management is currently unavailable.', !invitePanel);
    setFeedback(usersFeedback, 'Registered users are up to date.');
  } catch (error) {
    usersContent.replaceChildren(renderAdminUsers({ error: error.message }));
    setFeedback(inviteFeedback, error.message, true);
    setFeedback(usersFeedback, error.message, true);
  }
}

function renderAdminUsers(payload = {}) {
  const panel = document.createElement('section'); panel.className = 'panel admin-users-panel';
  const heading = document.createElement('div'); heading.className = 'panel-heading';
  const title = document.createElement('div'); title.innerHTML = '<p class="eyebrow">ACCOUNT MANAGEMENT</p><h2>Registered users</h2>';
  const count = document.createElement('span'); count.className = 'pill'; count.textContent = payload.error ? 'Unavailable' : `${payload.activeCount ?? 0} active`;
  heading.append(title, count); panel.append(heading);
  if (payload.error) {
    const error = document.createElement('p'); error.className = 'muted'; error.textContent = `Registered user management is not available from the connected backend: ${payload.error}`; panel.append(error); return panel;
  }
  const invitePanel = document.createElement('section');
  invitePanel.className = 'panel form-panel admin-invite-panel';
  invitePanel.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">TEAM ACCESS</p><h3>Add an employee or invite a referrer</h3></div></div>
    <form id="admin-user-create-form" class="admin-user-create-form">
      <label>Full name<input name="name" required maxlength="160" autocomplete="name" placeholder="Name"></label>
      <label>Email address<input name="email" type="email" required autocomplete="email" placeholder="name@example.com"></label>
      <label>Account type<select name="role" required><option value="employee">Employee</option><option value="referrer">Referrer invitation</option></select></label>
      <label id="admin-user-department-wrap">Department<select name="departmentId" id="admin-user-department" required></select></label>
      <label id="admin-user-position-select-wrap">Position<select name="positionId" id="admin-user-position-select" required></select></label>
      <label id="admin-user-position-wrap" hidden>Referrer position<input name="position" maxlength="160" placeholder="e.g. Community referrer"></label>
      <p class="form-hint admin-user-create-hint">The employee receives a one-time invitation and accepts it to create their password.</p>
      <button class="button button-primary" type="submit">Send employee invitation</button>
      <div class="feedback" id="admin-user-create-feedback" role="status" aria-live="polite"></div>
    </form>`;
  panel.append(invitePanel);
  const createForm = invitePanel.querySelector('#admin-user-create-form');
  const roleSelect = createForm.elements.role;
  const positionWrap = invitePanel.querySelector('#admin-user-position-wrap');
  const departmentWrap = invitePanel.querySelector('#admin-user-department-wrap');
  const positionSelectWrap = invitePanel.querySelector('#admin-user-position-select-wrap');
  const departmentSelect = createForm.elements.departmentId;
  const positionSelect = createForm.elements.positionId;
  const departments = payload.departments || [];
  const positions = payload.positions || [];
  const fillDepartmentOptions = (selected = '') => {
    departmentSelect.replaceChildren(new Option('Choose a department', ''));
    departments.forEach((department) => departmentSelect.add(new Option(department.name, department.id)));
    departmentSelect.value = selected;
  };
  const fillPositionOptions = (departmentId, selected = '') => {
    positionSelect.replaceChildren(new Option('Choose a position', ''));
    positions.filter((position) => position.department_id === departmentId && !position.isHiring)
      .forEach((position) => positionSelect.add(new Option(position.title, position.id)));
    positionSelect.value = selected;
  };
  fillDepartmentOptions();
  fillPositionOptions('');
  departmentSelect.addEventListener('change', () => fillPositionOptions(departmentSelect.value));
  const syncRoleFields = () => {
    const referrer = roleSelect.value === 'referrer';
    departmentWrap.hidden = referrer;
    positionSelectWrap.hidden = referrer;
    departmentSelect.required = !referrer;
    departmentSelect.disabled = referrer;
    positionSelect.required = !referrer;
    positionSelect.disabled = referrer;
    positionWrap.hidden = !referrer;
    createForm.elements.position.required = referrer;
    createForm.elements.position.disabled = !referrer;
    invitePanel.querySelector('.admin-user-create-hint').textContent = referrer
      ? 'The backend will email a one-time invitation link. Email delivery must be configured on the backend.'
      : departments.length && positions.some((position) => !position.isHiring)
        ? 'The employee receives a one-time invitation with their department and position already assigned.'
        : 'Add a department and at least one internal position in People & hiring before inviting an employee.';
    createForm.querySelector('button[type="submit"]').textContent = referrer ? 'Send referrer invitation' : 'Send employee invitation';
    createForm.querySelector('button[type="submit"]').disabled = !referrer && (!departments.length || !positions.some((position) => !position.isHiring));
  };
  roleSelect.addEventListener('change', syncRoleFields);
  syncRoleFields();
  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = createForm.querySelector('button[type="submit"]');
    const feedback = invitePanel.querySelector('#admin-user-create-feedback');
    const values = formData(createForm);
    const body = { name: values.name.trim(), email: values.email.trim().toLowerCase(), role: values.role };
    if (values.role === 'referrer') body.position = values.position.trim();
    else {
      body.departmentId = values.departmentId;
      body.positionId = values.positionId;
    }
    submit.disabled = true;
    setFeedback(feedback, 'Sending invitation…');
    try {
      await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(body) });
      await loadAdminUsers();
      setFeedback(document.querySelector('#account-management-feedback'), values.role === 'referrer'
        ? `Referrer invitation sent to ${body.email}.`
        : `Employee invitation sent to ${body.email} for ${departmentSelect.selectedOptions[0]?.textContent} · ${positionSelect.selectedOptions[0]?.textContent}.`);
    } catch (error) {
      setFeedback(feedback, error.message, true);
      submit.disabled = false;
    }
  });
  const controls = document.createElement('div'); controls.className = 'admin-users-controls';
  const list = document.createElement('div'); list.className = 'admin-users-list';
  let showBin = false;
  const draw = () => {
    controls.replaceChildren();
    [['Active users', false, payload.activeCount || 0], ['Bin', true, payload.deletedCount || 0]].forEach(([label, bin, number]) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `button button-small ${showBin === bin ? 'button-primary' : 'button-outline'}`; button.textContent = `${label} (${number})`; button.setAttribute('aria-pressed', String(showBin === bin)); button.addEventListener('click', () => { showBin = bin; draw(); }); controls.append(button);
    });
    list.replaceChildren();
    const users = (payload.users || []).filter((user) => Boolean(user.deletedAt) === showBin);
    if (!users.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = showBin ? 'The bin is empty.' : 'No registered users yet.'; list.append(empty); return; }
    users.forEach((user) => {
      const row = document.createElement('article'); row.className = 'admin-user-row';
      const avatar = document.createElement('div'); avatar.className = 'admin-user-avatar';
      if (user.profileImage) { const img = document.createElement('img'); img.src = user.profileImage; img.alt = ''; avatar.append(img); }
      else avatar.textContent = String(user.name || '?').trim().slice(0, 1).toUpperCase();
      const details = document.createElement('div'); details.className = 'admin-user-details';
      const name = document.createElement('strong'); name.textContent = user.name;
      const assignment = user.role === 'employee'
        ? ` · ${user.departmentName || 'Department not assigned'} · ${user.position || 'Position not assigned'}`
        : '';
      const meta = document.createElement('small'); meta.textContent = `${user.email} · ${user.role}${assignment} · Joined ${formatEATDateTime(user.createdAt) || 'date unavailable'}`;
      details.append(name, meta); row.append(avatar, details);
      const action = document.createElement('button'); action.type = 'button'; action.className = `button button-small ${showBin ? 'button-outline' : 'button-danger'}`; action.textContent = showBin ? 'Restore' : 'Move to bin';
      action.addEventListener('click', async () => {
        action.disabled = true;
        try {
          await apiRequest(`/admin/users/${encodeURIComponent(user.id)}${showBin ? '/restore' : ''}`, { method: showBin ? 'POST' : 'DELETE', ...(showBin ? { body: '{}' } : {}) });
          await loadAdminUsers();
        } catch (error) { setFeedback(document.querySelector('#registered-users-feedback'), error.message, true); action.disabled = false; }
      });
      row.append(action); list.append(row);
    });
  };
  draw(); panel.append(controls, list); return panel;
}

async function loadCompanyStructure() {
  const root = document.querySelector('#company-structure-content');
  if (!root || currentUser?.role !== 'admin') return;
  root.className = 'company-structure-content';
  root.replaceChildren();
  try {
    const [structure, settings] = await Promise.all([
      apiRequest('/company/structure'),
      apiRequest('/recruitment/settings'),
    ]);
    const departmentSelect = document.querySelector('#department-id');
    if (departmentSelect) {
      const selected = departmentSelect.value;
      departmentSelect.replaceChildren(new Option('Choose a department', ''));
      (structure.departments || []).forEach((department) => departmentSelect.add(new Option(department.name, department.id)));
      if ((structure.departments || []).some((department) => department.id === selected)) departmentSelect.value = selected;
    }
    root.append(renderCompanyStructure(structure));
    const toggle = document.querySelector('#foundational-team-toggle');
    toggle.checked = Boolean(settings.foundationalTeamEnabled);
    toggle.onchange = async () => {
      toggle.disabled = true;
      const feedback = document.querySelector('#recruitment-settings-feedback');
      try {
        const updated = await apiRequest('/recruitment/settings', {
          method: 'PATCH',
          body: JSON.stringify({ foundationalTeamEnabled: toggle.checked }),
        });
        toggle.checked = updated.foundationalTeamEnabled;
        setFeedback(feedback, updated.foundationalTeamEnabled
          ? 'Foundational Team applications are now open.'
          : 'Foundational Team applications are now closed; new applicants can apply as Regular Employees.');
      } catch (error) {
        toggle.checked = !toggle.checked;
        setFeedback(feedback, error.message, true);
      } finally {
        toggle.disabled = false;
      }
    };
    await loadRecruitmentApplications();
  } catch (error) {
    root.textContent = `Company structure could not be loaded: ${error.message}`;
    root.className = 'feedback error';
  }
}

async function loadRecruitmentOpportunities() {
    const root = document.querySelector('#recruitment-opportunities');
    const status = document.querySelector('#recruitment-opportunity-status');
    if (!root || !status) return;
    root.replaceChildren();
    try {
      const { positions = [] } = await apiRequest('/recruitment/positions');
      status.textContent = positions.length
        ? `${positions.length} open ${positions.length === 1 ? 'position' : 'positions'} accepting applications.`
        : 'No public positions are open right now.';
      if (!positions.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Please check again later for new ClariCare opportunities.';
        root.append(empty);
        return;
      }
      positions.forEach((position) => {
        const card = document.createElement('article');
        card.className = 'recruitment-opportunity-card';
        const heading = document.createElement('div');
        heading.className = 'recruitment-opportunity-heading';
        const titleBlock = document.createElement('div');
        titleBlock.className = 'recruitment-opportunity-title';
        const title = document.createElement('h3');
        title.textContent = position.title;
        const department = document.createElement('p');
        department.className = 'eyebrow';
        department.textContent = position.department_name || 'CLARICARE';
        titleBlock.append(department, title);
        const description = document.createElement('p');
        description.className = 'recruitment-opportunity-description';
        const descriptionText = position.description || 'Join the ClariCare team.';
        const embeddedRequirements = descriptionText.match(/\bRequirements:\s*([\s\S]*)$/i);
        description.textContent = embeddedRequirements
          ? descriptionText.slice(0, embeddedRequirements.index).trim()
          : descriptionText;
        const requirementsText = position.requirements || embeddedRequirements?.[1] || '';
        const details = document.createElement('div');
        details.className = 'recruitment-opportunity-details';
        details.append(description);
        if (requirementsText) {
          const requirementsSection = document.createElement('section');
          requirementsSection.className = 'recruitment-requirements';
          const requirementsTitle = document.createElement('h4');
          requirementsTitle.textContent = 'What you’ll bring';
          const requirements = document.createElement('ul');
          requirements.className = 'recruitment-requirements-list';
          String(requirementsText).split(/(?<=[.!?])\s+/).filter(Boolean).forEach((requirement) => {
            const item = document.createElement('li');
            item.textContent = requirement.trim();
            requirements.append(item);
          });
          requirementsSection.append(requirementsTitle, requirements);
          details.append(requirementsSection);
        }
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'button button-primary recruitment-apply-button';
        apply.textContent = 'Apply for this role';
        apply.addEventListener('click', () => {
          pendingApplicantPositionId = position.id;
          if (currentUser?.role === 'applicant') {
            setView('applicant-application');
          } else {
            showStaffLogin('applicant');
          }
        });
        heading.append(titleBlock, apply);
        card.append(heading, details);
        root.append(card);
      });
    } catch (error) {
      status.textContent = `Open opportunities could not be loaded: ${error.message}`;
    }
  }

async function loadApplicantApplicationForm(selectedPositionId = null) {
    if (currentUser?.role !== 'applicant') return;
    const select = document.querySelector('#applicant-position-select');
    const feedback = document.querySelector('#applicant-application-feedback');
    const type = document.querySelector('#applicant-application-type');
    const foundational = document.querySelector('#foundational-application-questions');
    try {
      const { positions = [], foundationalTeamEnabled = false } = await apiRequest('/recruitment/positions');
      setOptions(select, positions.map((position) => ({ id: position.id, name: `${position.title} · ${position.department_name}` })), 'Choose an open position');
      const selected = selectedPositionId || new URLSearchParams(location.search).get('positionId');
      if (selected && positions.some((position) => position.id === selected)) select.value = selected;
      type.querySelector('option[value="foundational"]').hidden = !foundationalTeamEnabled;
      if (!foundationalTeamEnabled) type.value = 'regular';
      foundational.hidden = type.value !== 'foundational';
      type.onchange = () => { foundational.hidden = type.value !== 'foundational'; };
      setFeedback(feedback, positions.length ? '' : 'No positions are currently open. You can still return to the applicant dashboard.');
    } catch (error) {
      setFeedback(feedback, error.message, true);
    }
  }

function renderApplicantApplications(applications) {
    const section = document.createElement('section');
    section.className = 'applicant-applications';
    if (selectedApplicantApplicationId && !applications.some((application) => application.id === selectedApplicantApplicationId)) {
      selectedApplicantApplicationId = null;
    }
    const selectedApplication = applications.find((application) => application.id === selectedApplicantApplicationId);
    const heading = document.createElement('div');
    heading.className = 'panel-heading';
    heading.innerHTML = selectedApplication
      ? '<div><p class="eyebrow">APPLICATION DETAILS</p><h2>Your application</h2></div>'
      : '<div><p class="eyebrow">YOUR CAREER JOURNEY</p><h2>My applications</h2></div>';
    const apply = document.createElement('button');
    apply.className = 'button button-primary button-small';
    apply.type = 'button';
    apply.textContent = 'Apply for an open role';
    apply.addEventListener('click', () => { pendingApplicantPositionId = null; setView('applicant-application'); });
    section.append(heading);
    if (selectedApplication) {
      const back = document.createElement('button');
      back.className = 'button button-outline applicant-application-back';
      back.type = 'button';
      back.textContent = '← Back to my applications';
      back.addEventListener('click', () => {
        selectedApplicantApplicationId = null;
        loadRoleDashboard();
      });
      const detail = document.createElement('article');
      detail.className = 'applicant-application-detail';
      const top = document.createElement('div');
      top.className = 'applicant-detail-header';
      const roleBlock = document.createElement('div');
      const department = document.createElement('p');
      department.className = 'eyebrow';
      department.textContent = selectedApplication.department_name || 'CLARICARE';
      const title = document.createElement('h3');
      title.textContent = selectedApplication.position_title || 'Application';
      roleBlock.append(department, title);
      const status = document.createElement('span');
      status.className = `application-status application-status-${selectedApplication.status}`;
      status.textContent = String(selectedApplication.status || 'submitted').replaceAll('_', ' ');
      top.append(roleBlock, status);
      const meta = document.createElement('div');
      meta.className = 'applicant-detail-meta';
      const track = document.createElement('span');
      track.textContent = selectedApplication.application_type === 'foundational' ? 'Foundational Team Member' : 'Regular Employee';
      const submitted = document.createElement('span');
      submitted.textContent = `Submitted ${formatEATDateTime(selectedApplication.created_at) || 'date unavailable'}`;
      meta.append(track, submitted);
      const timelineHeading = document.createElement('h4');
      timelineHeading.className = 'applicant-timeline-heading';
      timelineHeading.textContent = 'Progress updates';
      const history = document.createElement('ol');
      history.className = 'application-progress-list applicant-progress-timeline';
      (selectedApplication.history || []).forEach((entry) => {
        const item = document.createElement('li');
        const event = document.createElement('strong');
        event.textContent = String(entry.status || '').replaceAll('_', ' ');
        const note = document.createElement('p');
        note.textContent = entry.note || '';
        const date = document.createElement('small');
        date.textContent = formatEATDateTime(entry.created_at);
        item.append(event, note, date);
        history.append(item);
      });
      if (!history.childElementCount) {
        const pending = document.createElement('li');
        pending.className = 'applicant-pending-update';
        pending.textContent = 'Your application has been received. There are no progress updates yet.';
        history.append(pending);
      }
      detail.append(top, meta, timelineHeading, history);
      section.append(back, detail);
      return section;
    }
    section.append(apply);
    if (!applications.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'You have not submitted an application yet. Browse open opportunities to get started.';
      section.append(empty);
      return section;
    }
    applications.forEach((application) => {
      const card = document.createElement('article');
      card.className = 'panel applicant-application-card';
      const title = document.createElement('h3');
      title.textContent = application.position_title || 'Application';
      const status = document.createElement('span');
      status.className = `application-status application-status-${application.status}`;
      status.textContent = String(application.status || 'submitted').replaceAll('_', ' ');
      const meta = document.createElement('p');
      meta.className = 'muted';
      meta.textContent = `${application.department_name || ''} · ${application.application_type === 'foundational' ? 'Foundational Team Member' : 'Regular Employee'} · Submitted ${formatEATDateTime(application.created_at)}`;
      const top = document.createElement('div');
      top.className = 'applicant-application-heading';
      top.append(title, status);
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'applicant-application-open';
      open.textContent = 'View application';
      open.setAttribute('aria-label', `View ${application.position_title || 'application'} progress`);
      open.addEventListener('click', () => {
        selectedApplicantApplicationId = application.id;
        loadRoleDashboard();
      });
      card.append(top, meta, open);
      section.append(card);
    });
    return section;
  }

async function loadRecruitmentApplications() {
    const root = document.querySelector('#recruitment-applications-list');
    if (!root || currentUser?.role !== 'admin') return;
    const panelEyebrow = document.querySelector('#applications-panel-eyebrow');
    const panelTitle = document.querySelector('#applications-panel-title');
    root.replaceChildren();
    try {
      const { applications = [] } = await apiRequest('/recruitment/applications');
      if (!applications.length) {
        selectedRecruitmentApplicationId = null;
        panelEyebrow.textContent = 'APPLICANT INBOX';
        panelTitle.textContent = 'Applications received';
        document.querySelector('[data-people-subpage="applicants"]')?.classList.remove('has-application-detail');
        root.innerHTML = '<div class="empty-state">No applications have been received yet.</div>';
        return;
      }
      if (selectedRecruitmentApplicationId && !applications.some((application) => application.id === selectedRecruitmentApplicationId)) {
        selectedRecruitmentApplicationId = null;
      }
      panelEyebrow.textContent = selectedRecruitmentApplicationId ? 'CANDIDATE REVIEW' : 'APPLICANT INBOX';
      panelTitle.textContent = selectedRecruitmentApplicationId ? 'Application details' : 'Applications received';
      document.querySelector('[data-people-subpage="applicants"]')?.classList.toggle('has-application-detail', Boolean(selectedRecruitmentApplicationId));
      applications.forEach((application) => {
        const card = document.createElement('article');
        card.className = 'recruitment-application-row';
        card.dataset.applicationId = application.id;
        const details = document.createElement('details');
        details.className = 'recruitment-application-details';
        const summary = document.createElement('summary');
        const summaryMain = document.createElement('span');
        summaryMain.className = 'recruitment-application-summary-main';
        const applicantName = document.createElement('strong');
        applicantName.textContent = application.applicant_name || 'Applicant';
        const roleName = document.createElement('span');
        roleName.textContent = `${application.position_title || 'Position'} · ${application.department_name || 'ClariCare'}`;
        summaryMain.append(applicantName, roleName);
        const status = document.createElement('span');
        status.className = `application-status application-status-${application.status || 'submitted'}`;
        status.textContent = String(application.status || 'submitted').replaceAll('_', ' ');
        summary.append(summaryMain, status);
        summary.addEventListener('click', (event) => {
          event.preventDefault();
          selectedRecruitmentApplicationId = application.id;
          loadRecruitmentApplications();
        });
        details.open = selectedRecruitmentApplicationId === application.id;
        const info = document.createElement('div');
        info.className = 'recruitment-applicant-info';
        const contact = document.createElement('div');
        contact.className = 'recruitment-applicant-contact';
        const email = document.createElement('p');
        email.textContent = application.applicant_email || 'Email not provided';
        const track = document.createElement('p');
        track.textContent = application.applicant_phone || 'Phone not provided';
        const applicationTrack = document.createElement('span');
        applicationTrack.className = 'candidate-track';
        applicationTrack.textContent = application.application_type === 'foundational' ? 'Foundational Team Member' : 'Regular Employee';
        contact.append(email, track, applicationTrack);
        info.append(contact);
        const answers = document.createElement('section');
        answers.className = 'recruitment-answer-section';
        const answersTitle = document.createElement('h4');
        answersTitle.textContent = 'Application responses';
        answers.append(answersTitle);
        const answerList = document.createElement('dl');
        answerList.className = 'recruitment-answer-list';
        Object.entries(application.answers || {}).forEach(([key, value]) => {
          if (!value) return;
          const item = document.createElement('div');
          item.className = 'recruitment-answer-item';
          const label = document.createElement('dt');
          label.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
          const answer = document.createElement('dd');
          answer.textContent = value;
          item.append(label, answer);
          answerList.append(item);
        });
        if (answerList.childElementCount) answers.append(answerList);
        else answers.append(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'No additional responses provided.' }));
        info.append(answers);
        if (application.cv_url) {
          const cv = document.createElement('a');
          cv.className = 'candidate-cv-link';
          cv.href = application.cv_url;
          cv.target = '_blank';
          cv.rel = 'noopener noreferrer';
          cv.textContent = 'Open CV / résumé link';
          info.append(cv);
        }
        details.append(summary, info);
        const form = document.createElement('form');
        form.className = 'application-review-form';
        form.hidden = selectedRecruitmentApplicationId !== application.id;
        const reviewHeading = document.createElement('h3');
        reviewHeading.textContent = 'Review application';
        form.append(reviewHeading);
        form.insertAdjacentHTML('beforeend', `<label>Progress<select name="status"><option value="submitted">Submitted</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="interview_in_progress">Interview in progress</option><option value="interview_completed">Interview completed</option><option value="hr_review">HR review</option><option value="ceo_review">CEO review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option></select></label><label>Message to applicant (included in email)<textarea name="note" maxlength="2000" rows="2" placeholder="Optional update or next steps"></textarea></label><button class="button button-outline button-small" type="submit">Update applicant</button><span class="feedback" role="status"></span>`);
        if (application.status === 'draft') {
          form.elements.status.disabled = true;
          form.querySelector('button').disabled = true;
          setFeedback(form.querySelector('.feedback'), 'Draft application — waiting for the applicant to upload a CV and submit.');
        } else {
          if (![...form.elements.status.options].some((option) => option.value === application.status)) {
            form.elements.status.add(new Option(`${String(application.status).replaceAll('_', ' ')} (current)`, application.status), 0);
          }
          form.elements.status.value = application.status;
        }
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (form.elements.status.value === application.status) {
            setFeedback(form.querySelector('.feedback'), 'Choose a different application status before updating.', true);
            return;
          }
          const button = form.querySelector('button');
          button.disabled = true;
          const notification = form.querySelector('.feedback');
          try {
            const result = await apiRequest(`/recruitment/applications/${encodeURIComponent(application.id)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: form.elements.status.value, note: form.elements.note.value.trim() }),
            });
            setFeedback(notification, result.notification?.sent
              ? 'Application updated and email sent.'
              : `Application updated. Email was not sent: ${result.notification?.reason || 'Unknown notification failure.'}`,
              !result.notification?.sent);
            await Promise.all([loadRecruitmentApplications(), loadRoleDashboard()]);
          } catch (error) {
            setFeedback(notification, error.message, true);
            button.disabled = false;
          }
        });
        card.append(details, form);
        root.append(card);
      });
      if (selectedRecruitmentApplicationId) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'button button-outline recruitment-back-button';
        back.textContent = '← Back to all applications';
        back.addEventListener('click', () => {
          selectedRecruitmentApplicationId = null;
          loadRecruitmentApplications();
        });
        root.prepend(back);
        root.querySelectorAll('.recruitment-application-row').forEach((card) => {
          card.hidden = card.dataset.applicationId !== selectedRecruitmentApplicationId;
          if (!card.hidden) card.classList.add('is-application-detail');
        });
      }
    } catch (error) {
      root.textContent = `Applicant progress could not be loaded: ${error.message}`;
    }
}

function renderCompanyStructure(structure = {}) {
  const panel = document.createElement('section');
  panel.className = 'panel company-structure-panel';
  const departments = structure.departments || [];
  const positions = structure.positions || [];
  let selectedDepartment = departments.find((department) => String(department.id) === String(selectedCompanyDepartmentId));
  if (selectedCompanyDepartmentId && !selectedDepartment) {
    selectedCompanyDepartmentId = null;
    selectedDepartment = null;
  }
  const heading = document.createElement('div');
  heading.className = 'panel-heading';
  const title = document.createElement('div');
  title.innerHTML = selectedDepartment
    ? '<p class="eyebrow">DEPARTMENT PROFILE</p><h2>Department details</h2>'
    : '<p class="eyebrow">CLARICARE ORGANIZATION</p><h2>Departments &amp; positions</h2>';
  const count = document.createElement('span');
  count.className = 'pill';
  count.textContent = selectedDepartment
    ? `${positions.filter((position) => String(position.department_id) === String(selectedDepartment.id)).length} positions`
    : `${departments.length} departments`;
  heading.append(title, count);
  panel.append(heading);
  if (selectedDepartment) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'button button-outline department-back-button';
    back.textContent = '← All departments';
    back.addEventListener('click', () => {
      selectedCompanyDepartmentId = null;
      loadCompanyStructure();
    });
    const detail = document.createElement('section');
    detail.className = 'company-department-detail';
    const detailHeader = document.createElement('header');
    detailHeader.className = 'company-department-detail-header';
    const departmentName = document.createElement('h3');
    departmentName.textContent = selectedDepartment.name;
    const departmentDescription = document.createElement('p');
    departmentDescription.textContent = selectedDepartment.description || 'Department overview has not been added yet.';
    detailHeader.append(departmentName, departmentDescription);
    const departmentPositions = positions.filter((position) => String(position.department_id) === String(selectedDepartment.id));
    const rolesHeading = document.createElement('div');
    rolesHeading.className = 'company-roles-heading';
    const rolesTitle = document.createElement('h4');
    rolesTitle.textContent = 'Positions in this department';
    const hiringCount = departmentPositions.filter((position) => position.isHiring).length;
    const rolesMeta = document.createElement('span');
    rolesMeta.textContent = `${hiringCount} currently hiring`;
    rolesHeading.append(rolesTitle, rolesMeta);
    const roles = document.createElement('div');
    roles.className = 'company-position-list';
    departmentPositions.forEach((position) => {
      const role = document.createElement('article');
      role.className = 'company-position-item';
      const roleHeading = document.createElement('div');
      roleHeading.className = 'company-position-heading';
      const roleTitle = document.createElement('h5');
      roleTitle.textContent = position.title;
      const badge = document.createElement('span');
      badge.className = `company-position-status${position.isHiring ? ' is-hiring' : ''}`;
      badge.textContent = position.isHiring ? 'Hiring' : 'Internal role';
      roleHeading.append(roleTitle, badge);
      role.append(roleHeading);
      if (position.description) {
        const roleDescription = document.createElement('p');
        roleDescription.className = 'company-position-description';
        roleDescription.textContent = position.description;
        role.append(roleDescription);
      }
      if (position.requirements) {
        const requirementsBlock = document.createElement('div');
        requirementsBlock.className = 'company-position-requirements';
        const requirementsTitle = document.createElement('h6');
        requirementsTitle.textContent = 'Requirements';
        const requirements = document.createElement('ul');
        String(position.requirements).split(/(?<=[.!?])\s+/).filter(Boolean).forEach((requirement) => {
          const item = document.createElement('li');
          item.textContent = requirement.trim();
          requirements.append(item);
        });
        requirementsBlock.append(requirementsTitle, requirements);
        role.append(requirementsBlock);
      }
      roles.append(role);
    });
    if (!departmentPositions.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
      empty.textContent = 'No positions have been added to this department yet.';
      roles.append(empty);
  }
    detail.append(detailHeader, rolesHeading, roles);
    panel.append(back, detail);
    return panel;
  }
  const list = document.createElement('div');
  list.className = 'company-department-list';
  departments.forEach((department) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'company-department-card';
    const label = document.createElement('span');
    label.className = 'company-department-card-label';
    label.textContent = 'DEPARTMENT';
    const name = document.createElement('strong');
    name.textContent = department.name;
    const description = document.createElement('span');
    description.className = 'company-department-card-description';
    description.textContent = department.description || 'Department overview';
    const departmentPositions = positions.filter((position) => String(position.department_id) === String(department.id));
    const footer = document.createElement('span');
    footer.className = 'company-department-card-footer';
    const roleCount = document.createElement('span');
    roleCount.textContent = `${departmentPositions.length} ${departmentPositions.length === 1 ? 'position' : 'positions'}`;
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    footer.append(roleCount, arrow);
    card.append(label, name, description, footer);
    card.addEventListener('click', () => {
      selectedCompanyDepartmentId = department.id;
      loadCompanyStructure();
    });
    list.append(card);
  });
  if (!departments.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No departments have been created yet.';
    list.append(empty);
  }
  panel.append(list);
  return panel;
}

function renderCustomerDashboard(content, data, cartData, conversations, callStats = {}) {
  const cart = cartData?.cart || { items: [] };
  const cartItems = cart.items || [];
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelector('#shop-cart-count').textContent = String(cartCount);
  const waitingProducts = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const metrics = [
    ['Calls', Number(callStats.totalCalls || 0), 'All call attempts'], ['Missed calls', Number(callStats.missedCalls || 0), 'Calls not answered'],
    ['Cart items', cartCount, 'Saved in your cart'], ['Bought products', Number(callStats.boughtProducts || 0), 'Completed orders'], ['Waiting products', waitingProducts, 'Items in your cart'],
  ];
  const metricCards = document.createElement('div'); metricCards.className = 'accounting-summary dashboard-metrics';
  const welcome = document.createElement('section'); welcome.className = 'customer-dashboard-welcome';
  welcome.innerHTML = `<div><p class="eyebrow">YOUR CLARICARE</p><h2>A little care, at a glance.</h2><p>Your account activity and saved products, all in one place.</p></div><span class="customer-welcome-mark" aria-hidden="true">✿</span>`;
  content.append(welcome);
  metrics.forEach(([label, value, detail]) => {
    const card = dashboardMetric(label.toUpperCase(), value, detail);
    card.classList.add('customer-summary-card');
    metricCards.append(card);
  });
  content.append(metricCards);
  const overview = document.createElement('section'); overview.className = 'customer-activity-overview';
  const chartPanel = document.createElement('section'); chartPanel.className = 'panel customer-activity-chart';
  chartPanel.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">YOUR ACTIVITY</p><h2>Activity overview</h2></div></div>';
  const chartWrap = document.createElement('div'); chartWrap.className = 'customer-pie-chart-wrap';
  const chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chart.setAttribute('viewBox', '0 0 180 180'); chart.setAttribute('role', 'img'); chart.setAttribute('aria-label', 'Customer activity pie chart');
  const total = metrics.reduce((sum, row) => sum + row[1], 0);
  const colors = ['#6a57c8','#d58b65','#83a86f','#d3ad4d','#5b9a9c'];
  if (!total) { const c = document.createElementNS(chart.namespaceURI, 'circle'); c.setAttribute('cx','90'); c.setAttribute('cy','90'); c.setAttribute('r','72'); c.setAttribute('fill','#e9eaf0'); chart.append(c); }
  else if (metrics.filter((row) => row[1] > 0).length === 1) { const c = document.createElementNS(chart.namespaceURI, 'circle'); c.setAttribute('cx','90'); c.setAttribute('cy','90'); c.setAttribute('r','72'); c.setAttribute('fill',colors[metrics.findIndex((row) => row[1] > 0)]); chart.append(c); }
  else {
    let angle = -Math.PI / 2;
    metrics.forEach(([label, value], index) => { if (!value) return; const next = angle + value / total * Math.PI * 2; const large = next - angle > Math.PI ? 1 : 0; const point = (a) => [90 + 72 * Math.cos(a), 90 + 72 * Math.sin(a)]; const [x1,y1] = point(angle), [x2,y2] = point(next); const path = document.createElementNS(chart.namespaceURI, 'path'); path.setAttribute('d', `M90 90 L${x1} ${y1} A72 72 0 ${large} 1 ${x2} ${y2} Z`); path.setAttribute('fill', colors[index]); chart.append(path); angle = next; });
  }
  chartWrap.append(chart); const legend = document.createElement('div'); legend.className = 'customer-chart-legend';
  metrics.forEach(([label,value], index) => { const row = document.createElement('div'); row.innerHTML = `<span style="--legend-color:${colors[index]}"></span><span>${label}</span><strong>${value}</strong>`; legend.append(row); });
  chartPanel.append(chartWrap, legend);
  const tablePanel = document.createElement('section'); tablePanel.className = 'panel customer-activity-table';
  tablePanel.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">ACTIVITY BREAKDOWN</p><h2>Counts</h2></div><label>Sort <select id="customer-activity-sort"><option value="default">Default</option><option value="value">Highest first</option><option value="label">Name A–Z</option></select></label></div>';
  const table = document.createElement('table'); table.className = 'activity-table'; table.innerHTML = '<thead><tr><th>Activity</th><th>Count</th></tr></thead><tbody></tbody>';
  const renderRows = (mode='default') => { const rows = [...metrics]; if (mode === 'value') rows.sort((a,b)=>b[1]-a[1]); if (mode === 'label') rows.sort((a,b)=>a[0].localeCompare(b[0])); const body = table.querySelector('tbody'); body.replaceChildren(); rows.forEach(([label,value]) => { const tr=document.createElement('tr'); tr.innerHTML=`<td>${label}</td><td>${value}</td>`; body.append(tr); }); };
  renderRows(); tablePanel.append(table); tablePanel.querySelector('select').addEventListener('change', (event)=>renderRows(event.target.value));
  overview.append(chartPanel, tablePanel); content.append(overview);
  const actions = document.createElement('div'); actions.className = 'customer-dashboard-links';
  [['customer-products','Shop our products'],['customer-cart','View your cart'],['customer-call','Call our team'],['customer-chat','Message our team']].forEach(([view,label])=>{ const button=document.createElement('button'); button.className='button button-outline'; button.type='button'; button.textContent=label; button.addEventListener('click',()=>setView(view)); actions.append(button); });
  content.append(actions);
}

async function loadCustomerProductsPage() {
  if (!currentUser || currentUser.role !== 'customer') return;
  const root = document.querySelector('#customer-products-content');
  root.replaceChildren();
  try {
    const { products: catalog = [] } = await apiRequest('/catalog/products');
    if (!catalog.length) { root.innerHTML = '<div class="empty-state">Our collection will appear here soon.</div>'; return; }
    catalog.forEach((product) => {
      const card = document.createElement('article'); card.className = 'panel customer-shop-card';
      const visual = document.createElement('div'); visual.className = 'customer-shop-visual';
      const image = createProductImage(product, 'customer-shop-image', `${product.name || 'Product'} product image`);
      if (image) { visual.classList.add('has-product-image'); visual.append(image); }
      else { const mark = document.createElement('span'); mark.setAttribute('aria-hidden', 'true'); mark.textContent = '✿'; visual.append(mark); }
      const category = document.createElement('p'); category.className = 'eyebrow'; category.textContent = product.category || 'CLARICARE PRODUCT';
      const title = document.createElement('h2'); title.textContent = product.name || 'ClariCare product';
      const description = document.createElement('p'); description.className = 'customer-shop-description'; description.textContent = product.description || 'A thoughtful addition to your everyday routine.';
      const details = document.createElement('button'); details.type = 'button'; details.className = 'text-button customer-product-details'; details.textContent = 'View product details';
      details.addEventListener('click', () => openProductDetails(product));
      const footer = document.createElement('div'); footer.className = 'customer-shop-footer';
      const price = document.createElement('strong'); price.textContent = productMoney(product.price || product.selling_price || 0);
      const add = document.createElement('button'); add.type = 'button'; add.className = 'button button-primary button-small';
      if ((product.sizeOptions || []).length) {
        add.addEventListener('click', () => openProductDetails(product));
        add.textContent = 'Choose size';
      } else {
        add.dataset.addToCart = product.id;
        add.textContent = 'Add to cart';
      }
      footer.append(price, add); card.append(visual, category, title, description, details, footer); root.append(card);
    });
  } catch (error) { setFeedback(document.querySelector('#customer-products-feedback'), error.message, true); }
}

async function loadCustomerCartPage() {
  if (!currentUser || currentUser.role !== 'customer') return;
  const root = document.querySelector('#customer-cart-content');
  const feedback = document.querySelector('#customer-cart-feedback');
  root.replaceChildren();
  try {
    const data = await apiRequest(`/cart?customerId=${encodeURIComponent(currentUser.id)}`);
    const items = data.cart?.items || [];
    const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelector('#shop-cart-count').textContent = String(count);
    const layout = document.createElement('div'); layout.className = 'cart-page-layout';
    const panel = document.createElement('section'); panel.className = 'panel customer-cart-panel';
    const heading = document.createElement('div'); heading.className = 'panel-heading';
    heading.innerHTML = `<div><p class="eyebrow">${count} ${count === 1 ? 'ITEM' : 'ITEMS'}</p><h2>Your cart</h2></div><span class="pill">Saved to your account</span>`;
    panel.append(heading);
    if (!items.length) {
      const empty = document.createElement('div'); empty.className = 'cart-empty-state';
      empty.innerHTML = '<span aria-hidden="true">🛍</span><h3>Your cart is waiting for something lovely.</h3><p>Browse the ClariCare collection and add a product to get started.</p><button type="button" class="button button-primary" data-open-catalog>Explore products</button>';
      panel.append(empty);
    } else {
      const list = document.createElement('div'); list.className = 'customer-cart-list';
      items.forEach((item) => {
        const row = document.createElement('article'); row.className = 'customer-cart-row';
        const info = document.createElement('div'); info.className = 'customer-cart-item-info';
        const cartProduct = products.find((product) => String(product.id) === String(item.product_id)) || {};
        const detailProduct = { ...cartProduct, ...item, id: item.product_id, name: item.product_name || cartProduct.name, price: item.product_price ?? item.unit_price ?? cartProduct.price };
        const image = createProductImage(item, 'customer-cart-product-image', `${item.product_name || 'Product'} image`);
        if (image) {
          info.classList.add('has-cart-image');
          const imageButton = document.createElement('button'); imageButton.type = 'button'; imageButton.className = 'customer-cart-image-button'; imageButton.setAttribute('aria-label', `View details for ${item.product_name || 'ClariCare product'}`); imageButton.append(image); imageButton.addEventListener('click', () => openProductDetails(detailProduct)); info.append(imageButton);
        }
        const title = document.createElement('button'); title.type = 'button'; title.className = 'customer-cart-product-name'; title.textContent = item.product_name || 'ClariCare product'; title.addEventListener('click', () => openProductDetails(detailProduct));
        const qty = document.createElement('small'); qty.textContent = `${item.variant_label ? `${item.variant_label} · ` : ''}Quantity: ${item.quantity}`; info.append(title, qty);
        const price = document.createElement('strong'); price.className = 'customer-cart-price'; price.textContent = productMoney(Number(item.quantity) * Number(item.unit_price));
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.dataset.removeCartItem = item.id; remove.textContent = 'Remove';
        row.append(info, price, remove); list.append(row);
      });
      panel.append(list);
    }
    const summary = document.createElement('aside'); summary.className = 'panel customer-cart-summary';
    summary.innerHTML = '<p class="eyebrow">ORDER SUMMARY</p><h2>Cart total</h2>';
    const total = document.createElement('strong'); total.className = 'customer-cart-total'; total.textContent = productMoney(data.total || 0);
    const note = document.createElement('p'); note.className = 'muted'; note.textContent = 'Online payment is not enabled yet. Your selected products remain saved in your cart.';
    summary.append(total, note); layout.append(panel, summary); root.append(layout);
    setFeedback(feedback, 'Your cart is up to date.');
  } catch (error) { setFeedback(feedback, error.message, true); }
}

async function loadCustomerChatPage() {
  if (!currentUser || currentUser.role !== 'customer') return;
  try {
    const { conversations = [] } = await apiRequest('/customer/contact/conversations');
    const root = document.querySelector('#customer-chat-content'); root.replaceChildren();
    const panel = document.createElement('section'); panel.className = 'panel customer-live-chat';
    panel.innerHTML = '<div class="panel-heading"><h2>Your conversations</h2><span class="pill">Live replies</span></div>';
    const layout = document.createElement('div'); layout.className = 'customer-chat-layout';
    const list = document.createElement('div'); list.className = 'customer-chat-list'; list.id = 'customer-chat-list';
    if (!conversations.length) list.innerHTML = '<div class="empty-state">Start a conversation with our team.</div>';
    conversations.forEach((c) => { const b=document.createElement('button'); b.type='button'; b.className='customer-chat-list-item'; b.textContent=`${c.subject || 'Customer care'} · ${c.last_message || c.status || 'Open chat'}`; b.addEventListener('click',()=>openCustomerConversation(c.id)); list.append(b); });
    const thread=document.createElement('div'); thread.className='customer-chat-thread'; thread.innerHTML='<div id="customer-live-messages" class="conversation-messages"><div class="empty-state">Choose a conversation or send your first message.</div></div><form id="customer-chat-reply-form" class="customer-message-form" hidden><input name="message" maxlength="10000" required placeholder="Write a message"><button class="button button-primary">Send</button></form>';
    layout.append(list,thread); panel.append(layout);
    const form=document.createElement('form'); form.id='customer-chat-new-form'; form.className='customer-chat-new-form'; form.innerHTML='<label>Start a conversation</label><div><input name="message" maxlength="10000" required placeholder="How can we help?"><button class="button button-primary">Send message</button></div>'; panel.append(form); root.append(panel);
    if (customerActiveConversationId && conversations.some(c=>c.id===customerActiveConversationId)) openCustomerConversation(customerActiveConversationId);
  } catch(error) { document.querySelector('#customer-chat-content').textContent=error.message; }
}

async function openCustomerConversation(id) {
  customerActiveConversationId = id;
  const replyForm = document.querySelector('#customer-chat-reply-form');
  if (!replyForm) return;
  replyForm.hidden = false;
  clearInterval(customerConversationPoll);
  await loadCustomerConversation();
  customerConversationPoll = setInterval(loadCustomerConversation, 3500);
}

async function loadCustomerConversation() {
  if (!customerActiveConversationId || !document.querySelector('#workspace').hidden) return;
  try {
    const data = await apiRequest(`/customer/contact/conversations/${encodeURIComponent(customerActiveConversationId)}`);
    const messages = document.querySelector('#customer-live-messages');
    if (!messages) return;
    messages.replaceChildren();
    (data.conversation?.messages || []).forEach((message) => appendMessage(messages, message, message.sender_type === 'visitor'));
  } catch (error) {
    clearInterval(customerConversationPoll);
    setFeedback(document.querySelector('#dashboard-feedback'), error.message, true);
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id === 'customer-chat-new-form') {
    event.preventDefault();
    const values = formData(form);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const data = await apiRequest('/customer/contact/conversations', {
        method: 'POST',
        body: JSON.stringify({ subject: 'Customer support', message: values.message.trim() }),
      });
      customerActiveConversationId = data.conversation.id;
      await loadRoleDashboard();
      setFeedback(document.querySelector('#dashboard-feedback'), 'Your chat is open. The ClariCare team can reply here.');
    } catch (error) {
      setFeedback(document.querySelector('#dashboard-feedback'), error.message, true);
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (form.id === 'customer-chat-reply-form') {
    event.preventDefault();
    const input = form.elements.message;
    const message = input.value.trim();
    if (!customerActiveConversationId || !message) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await apiRequest(`/customer/contact/conversations/${encodeURIComponent(customerActiveConversationId)}/messages`, {
        method: 'POST', body: JSON.stringify({ message }),
      });
      input.value = '';
      await loadCustomerConversation();
    } catch (error) {
      setFeedback(document.querySelector('#dashboard-feedback'), error.message, true);
    } finally { button.disabled = false; }
    return;
  }
  if (form.matches('[data-customer-review]')) {
    event.preventDefault();
    const values = formData(form);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await apiRequest(`/catalog/products/${encodeURIComponent(form.dataset.productId)}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: Number(values.rating), comment: values.comment.trim() }),
      });
      await loadRoleDashboard();
      setFeedback(document.querySelector('#dashboard-feedback'), 'Thank you. Your product review has been submitted.');
    } catch (error) {
      setFeedback(document.querySelector('#dashboard-feedback'), error.message, true);
      button.disabled = false;
    }
  }
});

document.addEventListener('click', async (event) => {
  const openDeliveryPolicy = event.target.closest('[data-open-delivery-policy]');
  if (openDeliveryPolicy) {
    event.preventDefault();
    document.querySelector('#delivery-policy-dialog').showModal();
    return;
  }
  if (event.target.closest('[data-close-delivery-policy]')) {
    document.querySelector('#delivery-policy-dialog').close();
    return;
  }
  if (event.target.closest('[data-open-catalog]')) { setView('customer-products'); return; }
  const customerProductButton = event.target.closest('#customer-products-content [data-add-to-cart]');
  if (customerProductButton) { addProductToCart(customerProductButton.dataset.addToCart, customerProductButton); return; }
  const remove = event.target.closest('[data-remove-cart-item]');
  if (remove) {
    remove.disabled = true;
    try {
      await apiRequest(`/cart/items/${encodeURIComponent(remove.dataset.removeCartItem)}`, {
        method: 'DELETE',
        body: JSON.stringify({ customerId: currentUser.id }),
      });
      if (document.querySelector('#view-customer-cart').classList.contains('active')) await loadCustomerCartPage();
      else await loadRoleDashboard();
    } catch (error) {
      setFeedback(document.querySelector('#view-customer-cart').classList.contains('active')
        ? document.querySelector('#customer-cart-feedback')
        : document.querySelector('#dashboard-feedback'), error.message, true);
      remove.disabled = false;
    }
    return;
  }
  const callButton = event.target.closest('[data-customer-call]');
  if (callButton) startCustomerCall(callButton.dataset.customerCall);
  if (event.target.closest('#customer-end-call')) endCustomerCall(true);
});

function productImageSource(product) {
  const source = String(product?.image_url || product?.imageUrl || product?.image || '').trim();
  if (/^data:image\/(png|jpeg|webp);base64,/i.test(source)) return source;
  return safeExternalUrl(source);
}

function createProductImage(product, className, alt = '') {
  const source = productImageSource(product);
  if (!source) return null;
  const image = document.createElement('img');
  image.className = className;
  image.src = source;
  image.alt = alt;
  image.loading = 'lazy';
  return image;
}

function displayProduct(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const image = createProductImage(product, 'admin-product-image', `${product.name || 'Product'} product image`);
  if (image) card.append(image);

  const top = document.createElement('div');
  top.className = 'product-top';
  const symbol = document.createElement('span');
  symbol.className = 'product-symbol';
  symbol.textContent = '✿';
  const category = document.createElement('span');
  category.className = 'product-category';
  category.textContent = product.category || 'Product';
  top.append(symbol, category);

  const title = document.createElement('h3');
  title.textContent = product.name || 'Untitled product';
  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || 'No description provided.';

  const rating = document.createElement('div');
  rating.className = 'rating-line';
  const average = Number(product.averageRating || 0);
  const stars = document.createElement('span');
  stars.textContent = average ? `${'★'.repeat(Math.round(average))}${'☆'.repeat(5 - Math.round(average))}` : '☆☆☆☆☆';
  const averageText = document.createElement('strong');
  averageText.textContent = average ? average.toFixed(1) : 'New';
  const reviewCount = document.createElement('small');
  reviewCount.textContent = `(${product.totalReviews || 0} reviews)`;
  rating.append(stars, averageText, reviewCount);
  card.append(top, title, description, rating);

  if (product.reviews?.length) {
    const list = document.createElement('div');
    list.className = 'review-list';
    product.reviews.slice(0, 3).forEach((review) => {
      const item = document.createElement('div');
      item.className = 'review-item';
      const reviewStars = document.createElement('span');
      reviewStars.className = 'review-stars';
      reviewStars.textContent = `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} `;
      const comment = document.createElement('span');
      comment.textContent = review.comment || 'No comment provided.';
      item.append(reviewStars, comment);
      list.append(item);
    });
    card.append(list);
  }
  return card;
}

function renderProducts() {
  productCount.textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
  productList.replaceChildren();
  publicProductList.replaceChildren();
  const homeProducts = document.querySelector('#home-featured-products');
  const homeCategories = document.querySelector('#home-categories');
  if (homeProducts) homeProducts.replaceChildren();
  if (homeCategories) homeCategories.replaceChildren();
  if (!products.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No products are in the catalog yet.';
    productList.append(empty);
    const publicEmpty = empty.cloneNode(true);
    publicEmpty.textContent = 'Our collection is taking shape. Please check back soon.';
    publicProductList.append(publicEmpty);
    if (homeProducts) {
      const homeEmpty = document.createElement('div');
      homeEmpty.className = 'empty-state';
      homeEmpty.textContent = 'Our collection is taking shape. Please check back soon.';
      homeProducts.append(homeEmpty);
    }
    if (homeCategories) {
      const note = document.createElement('span');
      note.className = 'home-category-note';
      note.textContent = 'New categories will appear as our collection grows.';
      homeCategories.append(note);
    }
  } else {
    products.forEach((product) => {
      productList.append(displayProduct(product));
      publicProductList.append(displayPublicProduct(product));
    });
    if (homeProducts) products.slice(0, 3).forEach((product) => homeProducts.append(displayPublicProduct(product)));
    if (homeCategories) {
      const categories = [...new Set(products.map((product) => String(product.category || '').trim()).filter(Boolean))];
      if (categories.length) {
        categories.slice(0, 6).forEach((category) => {
          const tag = document.createElement('a');
          tag.className = 'home-category-tag';
          tag.href = '#products';
          tag.dataset.publicPageLink = 'products';
          tag.textContent = category;
          homeCategories.append(tag);
        });
      } else {
        const note = document.createElement('span');
        note.className = 'home-category-note';
        note.textContent = 'Thoughtful products for your everyday routine';
        homeCategories.append(note);
      }
    }
  }
}

function renderUpdatesEmpty(feed, message) {
  const empty = document.createElement('div');
  empty.className = 'updates-empty';
  const mark = document.createElement('span'); mark.className = 'updates-mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = '✦';
  const title = document.createElement('h3'); title.textContent = message;
  const description = document.createElement('p'); description.textContent = 'Check back soon for new ClariCare content.';
  empty.append(mark, title, description);
  feed.replaceChildren(empty);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function createInlineUpdateVideo(value, title) {
  const safeUrl = safeExternalUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let youtubeId = '';
  if (host === 'youtu.be') youtubeId = url.pathname.split('/').filter(Boolean)[0] || '';
  else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (url.pathname === '/watch') youtubeId = url.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live'].includes(parts[0])) youtubeId = parts[1] || '';
  }
  if (youtubeId && /^[\w-]{6,}$/.test(youtubeId)) {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`;
    frame.title = title ? `Play ${title}` : 'ClariCare video';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    return frame;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const videoId = url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
    if (videoId) {
      const frame = document.createElement('iframe');
      frame.src = `https://player.vimeo.com/video/${videoId}`;
      frame.title = title ? `Play ${title}` : 'ClariCare video';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      return frame;
    }
  }
  if (/\.(mp4|webm|ogv|ogg)(?:$|\/)/i.test(url.pathname)) {
    const player = document.createElement('video');
    player.controls = true;
    player.preload = 'metadata';
    player.playsInline = true;
    player.src = safeUrl;
    player.setAttribute('aria-label', title ? `Play ${title}` : 'ClariCare video');
    return player;
  }
  return null;
}

function renderPublicUpdatePost(post, type, feed) {
  const article = document.createElement('article');
  article.className = 'panel update-card';
  if (type === 'video') article.classList.add('update-video-card');
  const coverUrl = safeExternalUrl(post.cover_image_url || post.coverImageUrl);
  if (coverUrl && type !== 'video') {
    const image = document.createElement('img');
    image.className = 'update-cover-image';
    image.src = coverUrl;
    image.alt = '';
    image.loading = 'lazy';
    article.append(image);
  }
  const category = document.createElement('span');
  category.className = 'product-category';
  category.textContent = type === 'blog' ? 'ClariCare journal' : type === 'news' ? 'ClariCare news' : 'Watch & learn';
  const title = document.createElement('h2');
  title.textContent = post.title || 'ClariCare update';
  const timestamp = post.published_at || post.publishedAt || post.updated_at || post.updatedAt || post.created_at || post.createdAt;
  const date = document.createElement('small');
  const parsedDate = timestamp ? new Date(timestamp) : null;
  date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? formatEATDateTime(parsedDate, { dateStyle: 'medium' })
    : '';
  const excerpt = document.createElement('p');
  excerpt.className = 'update-excerpt';
  excerpt.textContent = post.excerpt || (type === 'video' ? 'Watch a ClariCare video.' : 'Read the latest from ClariCare.');
  if (type === 'video') {
    const metaLine = document.createElement('div');
    metaLine.className = 'update-video-meta-line';
    title.className = 'update-video-title';
    metaLine.append(title);
    if (date.textContent) {
      date.className = 'update-video-date';
      metaLine.append(date);
    }
    excerpt.className = 'update-video-excerpt';
    metaLine.append(excerpt);
    article.append(metaLine);
    const videoUrl = safeExternalUrl(post.video_url || post.videoUrl);
    if (videoUrl) {
      const player = createInlineUpdateVideo(videoUrl, post.title);
      if (player) {
        const playerWrap = document.createElement('div');
        playerWrap.className = 'update-video-player';
        playerWrap.append(player);
        article.append(playerWrap);
      } else {
        const link = document.createElement('a');
        link.className = 'button button-primary update-video-link';
        link.href = videoUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Watch video';
        article.append(link);
      }
    }
    if (post.body) {
      const description = document.createElement('div');
      description.className = 'update-video-description';
      description.innerHTML = sanitizeRichContent(post.body);
      article.append(description);
    }
  } else {
    article.append(category, title);
    if (date.textContent) article.append(date);
    article.append(excerpt);
    article.classList.add('update-story-card');
    article.tabIndex = 0;
    article.setAttribute('role', 'link');
    article.setAttribute('aria-label', `Read ${post.title || 'ClariCare article'}`);
    article.addEventListener('click', () => openPublicArticle(post));
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPublicArticle(post); }
    });
    const readLink = document.createElement('span');
    readLink.className = 'update-read-link';
    readLink.textContent = 'Read full story';
    title.classList.add('update-card-title');
    article.append(readLink);
  }
  feed.append(article);
}

async function loadPublishedContent() {
  const feeds = {
    blog: document.querySelector('#updates-feed-blogs'),
    news: document.querySelector('#updates-feed-news'),
    video: document.querySelector('#updates-feed-videos'),
  };
  if (!feeds.blog || !feeds.news || !feeds.video) return;
  Object.values(feeds).forEach((feed) => {
    const loading = document.createElement('div');
    loading.className = 'updates-empty';
    loading.textContent = 'Loading ClariCare updates…';
    feed.replaceChildren(loading);
  });
  try {
    const data = await apiRequest('/content');
    const posts = contentPostsFromResponse(data);
    publishedPosts = posts;
    for (const [type, feed] of Object.entries(feeds)) {
      const matchingPosts = posts.filter((post) => String(post.type || '').toLowerCase() === type);
      feed.replaceChildren();
      if (!matchingPosts.length) {
        renderUpdatesEmpty(feed, type === 'blog' ? 'Stories are on their way' : type === 'news' ? 'No news posted yet' : 'Videos are on their way');
        continue;
      }
      matchingPosts.forEach((post) => renderPublicUpdatePost(post, type, feed));
    }
  } catch (error) {
    Object.values(feeds).forEach((feed) => {
      const message = document.createElement('div');
      message.className = 'updates-empty';
      message.textContent = `ClariCare updates could not be loaded. ${error.message}`;
      feed.replaceChildren(message);
    });
  }
}

async function openPublicArticle(post) {
  activeArticle = post;
  setPublicPage('article');
  await loadFullPublicArticle(post);
}

function renderPublicArticle(post) {
  const content = document.querySelector('#public-article-content');
  if (!content) return;
  content.replaceChildren();
  const type = String(post.type || '').toLowerCase();
  const category = document.createElement('p');
  category.className = 'eyebrow';
  category.textContent = type === 'news' ? 'CLARICARE NEWS' : 'THE CLARICARE JOURNAL';
  const title = document.createElement('h1');
  title.id = 'public-article-title';
  title.textContent = post.title || 'ClariCare update';
  const timestamp = post.published_at || post.publishedAt || post.updated_at || post.updatedAt || post.created_at || post.createdAt;
  const date = document.createElement('small');
  const parsedDate = timestamp ? new Date(timestamp) : null;
  date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime()) ? formatEATDateTime(parsedDate, { dateStyle: 'medium' }) : '';
  content.append(category, title);
  if (date.textContent) content.append(date);
  if (post.excerpt) { const excerpt = document.createElement('p'); excerpt.className = 'article-excerpt'; excerpt.textContent = post.excerpt; content.append(excerpt); }
  const coverUrl = safeExternalUrl(post.cover_image_url || post.coverImageUrl);
  if (coverUrl) { const image = document.createElement('img'); image.className = 'article-cover-image'; image.src = coverUrl; image.alt = ''; content.append(image); }
  const body = document.createElement('div');
  body.className = 'update-content article-body';
  if (post.body) body.innerHTML = sanitizeRichContent(post.body);
  else {
    const message = document.createElement('p');
    message.textContent = post.articleLoadError || 'Loading the full article…';
    body.append(message);
  }
  content.append(body);
}

async function loadFullPublicArticle(post) {
  if (post.body || !post.slug) return;
  const articleKey = String(post.id || post.slug);
  try {
    const data = await apiRequest(`/content/${encodeURIComponent(post.slug)}`);
    if (String(activeArticle?.id || activeArticle?.slug || '') !== articleKey) return;
    activeArticle = { ...post, ...(data.post || {}), body: data.post?.body || '' };
    renderPublicArticle(activeArticle);
  } catch (error) {
    if (String(activeArticle?.id || activeArticle?.slug || '') !== articleKey) return;
    activeArticle = { ...post, articleLoadError: `The full article could not be loaded. ${error.message}` };
    renderPublicArticle(activeArticle);
  }
}

async function showArticleFromRoute(key) {
  if (!publishedPosts) {
    try {
      const data = await apiRequest('/content');
      publishedPosts = contentPostsFromResponse(data);
    } catch { publishedPosts = []; }
  }
  const post = publishedPosts.find((item) => String(item.id || item.slug || '') === String(key));
  if (!post || !['news', 'blog'].includes(String(post.type || '').toLowerCase())) {
    activeArticle = null;
    setPublicPage('updates', false);
    return;
  }
  activeArticle = post;
  setPublicPage('article', false);
  await loadFullPublicArticle(post);
}

function contentPostsFromResponse(data) {
  if (Array.isArray(data)) return data;
  const collection = data?.posts || data?.content || data?.items;
  if (Array.isArray(collection)) return collection;
  const grouped = collection && typeof collection === 'object' ? collection : data;
  return ['blog', 'blogs', 'news', 'video', 'videos'].flatMap((key) => {
    const items = grouped?.[key];
    const type = key.startsWith('blog') ? 'blog' : key.startsWith('video') ? 'video' : 'news';
    return Array.isArray(items) ? items.map((post) => ({ ...post, type: post.type || type })) : [];
  });
}

function setContentTypeFields(type) {
  document.querySelectorAll('[data-content-type]').forEach((field) => {
    const visibleTypes = field.dataset.contentType.split(/\s+/);
    field.hidden = !visibleTypes.includes(type);
  });
  const videoInput = document.querySelector('#content-editor-form [name="videoUrl"]');
  videoInput.required = type === 'video';
}

function resetContentEditor() {
  const form = document.querySelector('#content-editor-form');
  const type = form.elements.type.value || 'blog';
  form.reset();
  form.elements.id.value = '';
  form.elements.type.value = type;
  document.querySelector('#content-rich-editor').replaceChildren();
  document.querySelector('#content-editor-heading').textContent = `Create a ${type === 'video' ? 'video' : type === 'news' ? 'news post' : 'blog'}`;
  document.querySelector('#content-editor-intro').textContent = type === 'news'
    ? 'Write your announcement. Publishing news sends an email to active subscribers.'
    : type === 'video' ? 'Add a video link and write a clear description for customers.' : 'Compose a polished story for the ClariCare journal.';
  setContentTypeFields(type);
  updateRichEditorWordCount();
}

function setContentEditorPage(type, post = null) {
  const selectedType = ['blog', 'news', 'video'].includes(type) ? type : 'blog';
  const home = document.querySelector('#content-home-page');
  const library = document.querySelector('#content-library-page');
  const editorPage = document.querySelector('#content-editor-page');
  const form = document.querySelector('#content-editor-form');
  home.hidden = true;
  library.hidden = true;
  editorPage.hidden = false;
  editorReturnPage = post ? 'content-library-page' : 'content-home-page';
  document.querySelector('#content-editor-back').textContent = post ? 'Back to content library' : 'Back to publishing';
  document.querySelector('#content-editor-delete').hidden = !post;
  form.elements.type.value = selectedType;
  if (!post) resetContentEditor();
  form.elements.type.value = selectedType;
  setContentTypeFields(selectedType);
  if (post) {
    form.elements.id.value = post.id || '';
    form.elements.title.value = post.title || '';
    form.elements.slug.value = post.slug || '';
    form.elements.excerpt.value = post.excerpt || '';
    form.elements.coverImageUrl.value = post.cover_image_url || post.coverImageUrl || '';
    form.elements.videoUrl.value = post.video_url || post.videoUrl || '';
    document.querySelector('#content-rich-editor').innerHTML = sanitizeRichContent(post.body || '');
    document.querySelector('#content-editor-heading').textContent = `Edit ${selectedType === 'video' ? 'video' : selectedType === 'news' ? 'news post' : 'blog'}`;
    document.querySelector('#content-editor-intro').textContent = post.status === 'published'
      ? 'Edit this published item. Save it as a draft or publish your changes.'
      : 'Continue editing this draft, then save it or publish when it is ready.';
    updateRichEditorWordCount();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sanitizeRichContent(html) {
  const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'SPAN']);
  const cleanNodes = (nodes) => [...nodes].map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
    const tag = node.tagName.toUpperCase();
    if (tag === 'FONT') {
      const span = document.createElement('span');
      const sizes = { 2: 'editor-size-small', 3: 'editor-size-normal', 4: 'editor-size-large', 5: 'editor-size-xl' };
      if (sizes[node.getAttribute('size')]) span.className = sizes[node.getAttribute('size')];
      span.append(...cleanNodes(node.childNodes));
      return span;
    }
    if (!allowed.has(tag)) {
      const fragment = document.createDocumentFragment();
      fragment.append(...cleanNodes(node.childNodes));
      return fragment;
    }
    const element = document.createElement(tag.toLowerCase());
    if (tag === 'A') {
      const href = safeExternalUrl(node.getAttribute('href'));
      if (href) {
        element.href = href;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      }
    }
    if (tag === 'SPAN' && /^editor-size-(small|normal|large|xl)$/.test(node.className)) element.className = node.className;
    element.append(...cleanNodes(node.childNodes));
    return element;
  });
  const clean = document.createElement('div');
  clean.append(...cleanNodes(parsed.body.childNodes));
  return clean.innerHTML;
}

function updateRichEditorWordCount() {
  const text = document.querySelector('#content-rich-editor').innerText || '';
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.querySelector('#content-word-count').textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
}

function richContentText(html) {
  const container = document.createElement('div');
  container.innerHTML = sanitizeRichContent(html);
  return container.textContent || '';
}

const richEditor = document.querySelector('#content-rich-editor');
const richToolbar = document.querySelector('.professional-editor-toolbar');
let richEditorSelection = null;
function saveRichEditorSelection() {
  const selection = window.getSelection();
  if (selection?.rangeCount && richEditor.contains(selection.anchorNode)) richEditorSelection = selection.getRangeAt(0).cloneRange();
}
function restoreRichEditorSelection() {
  richEditor.focus();
  if (!richEditorSelection) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(richEditorSelection);
}
richEditor.addEventListener('keyup', () => { saveRichEditorSelection(); updateRichEditorWordCount(); });
richEditor.addEventListener('mouseup', saveRichEditorSelection);
richEditor.addEventListener('input', updateRichEditorWordCount);
document.addEventListener('selectionchange', saveRichEditorSelection);
richToolbar.addEventListener('mousedown', (event) => {
  if (event.target.closest('button')) event.preventDefault();
});
richToolbar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rich-command]');
  if (!button) return;
  restoreRichEditorSelection();
  document.execCommand(button.dataset.richCommand, false);
  saveRichEditorSelection();
  updateRichEditorWordCount();
});
document.querySelector('#content-rich-block').addEventListener('change', (event) => {
  restoreRichEditorSelection();
  document.execCommand('formatBlock', false, `<${event.currentTarget.value}>`);
  saveRichEditorSelection();
});
document.querySelector('#content-rich-font-size').addEventListener('change', (event) => {
  restoreRichEditorSelection();
  document.execCommand('fontSize', false, event.currentTarget.value);
  saveRichEditorSelection();
});
document.querySelector('#content-rich-link').addEventListener('click', () => {
  restoreRichEditorSelection();
  const url = window.prompt('Enter a web link (https://…)');
  if (url && safeExternalUrl(url.trim())) document.execCommand('createLink', false, safeExternalUrl(url.trim()));
  saveRichEditorSelection();
});

document.querySelectorAll('[data-content-create]').forEach((button) => button.addEventListener('click', () => setContentEditorPage(button.dataset.contentCreate)));
document.querySelector('#open-content-library').addEventListener('click', () => {
  document.querySelector('#content-home-page').hidden = true;
  document.querySelector('#content-editor-page').hidden = true;
  document.querySelector('#content-library-page').hidden = false;
  loadAdminContent();
});
document.querySelector('#content-library-back').addEventListener('click', () => {
  document.querySelector('#content-library-page').hidden = true;
  document.querySelector('#content-home-page').hidden = false;
});
document.querySelector('#content-editor-back').addEventListener('click', () => {
  document.querySelector('#content-editor-page').hidden = true;
  document.querySelector(`#${editorReturnPage}`).hidden = false;
});
document.querySelector('#content-editor-reset').addEventListener('click', resetContentEditor);

document.querySelector('#content-editor-delete').addEventListener('click', async () => {
  const form = document.querySelector('#content-editor-form');
  const id = form.elements.id.value.trim();
  if (!id || !window.confirm('Permanently delete this post? This cannot be undone.')) return;
  const button = document.querySelector('#content-editor-delete');
  button.disabled = true;
  try {
    await apiRequest(`/admin/content/${encodeURIComponent(id)}`, { method: 'DELETE' });
    setFeedback(document.querySelector('#admin-content-feedback'), 'Post deleted.');
    resetContentEditor();
    document.querySelector('#content-editor-page').hidden = true;
    document.querySelector('#content-library-page').hidden = false;
    await loadAdminContent();
  } catch (error) {
    setFeedback(document.querySelector('#admin-content-feedback'), error.message, true);
  } finally { button.disabled = false; }
});

function renderAdminContentList(posts) {
  const root = document.querySelector('#admin-content-list');
  root.replaceChildren();
  const count = document.querySelector('#content-library-count');
  if (count) count.textContent = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} in your library.`;
  if (!posts.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No content yet. Create a blog, news post, or video description.';
    root.append(empty);
    return;
  }
  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'admin-content-item';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${post.title || 'untitled post'} to edit or delete`);
    const meta = document.createElement('div');
    meta.className = 'admin-content-meta';
    const kind = document.createElement('span');
    kind.className = 'pill';
    kind.textContent = post.type || 'content';
    const status = document.createElement('span');
    status.className = `content-status content-status-${post.status || 'draft'}`;
    status.textContent = post.status || 'draft';
    meta.append(kind, status);
    const title = document.createElement('h3'); title.textContent = post.title || 'Untitled post';
    const excerpt = document.createElement('p'); excerpt.textContent = post.excerpt || richContentText(post.body || '') || post.video_url || post.videoUrl || 'No description';
    const prompt = document.createElement('span'); prompt.className = 'admin-content-card-prompt'; prompt.textContent = 'Open to edit or delete →';
    const edit = () => {
      setContentEditorPage(post.type || 'blog', post);
      const form = document.querySelector('#content-editor-form');
      document.querySelector('#content-editor-page').scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.elements.title.focus({ preventScroll: true });
    };
    card.addEventListener('click', edit);
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edit(); } });
    card.append(meta, title, excerpt, prompt);
    root.append(card);
  });
}

async function loadAdminContent() {
  const root = document.querySelector('#admin-content-list');
  if (String(currentUser?.role || '').toLowerCase() !== 'admin') {
    root.textContent = 'Only administrators can manage published content.';
    return;
  }
  root.textContent = 'Loading content…';
  try {
    const data = await apiRequest('/admin/content');
    adminContentPosts = contentPostsFromResponse(data);
    renderAdminContentList(adminContentPosts);
    setFeedback(document.querySelector('#admin-content-feedback'), `Loaded ${adminContentPosts.length} content ${adminContentPosts.length === 1 ? 'item' : 'items'}.`);
  } catch (error) {
    root.textContent = error.message;
    setFeedback(document.querySelector('#admin-content-feedback'), error.message, true);
  }
}

document.querySelector('#refresh-content').addEventListener('click', loadAdminContent);
document.querySelector('#content-editor-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const cleanedBody = sanitizeRichContent(richEditor.innerHTML);
  if (!richContentText(cleanedBody).trim()) {
    setFeedback(document.querySelector('#admin-content-feedback'), 'Write some content before saving or publishing.', true);
    richEditor.focus();
    return;
  }
  form.elements.body.value = cleanedBody;
  const values = formData(form);
  const status = event.submitter?.value === 'published' ? 'published' : 'draft';
  const type = values.type;
  if (type === 'news' && status === 'published' && !window.confirm('Publish this news now? Active email subscribers will be sent an announcement.')) return;
  const feedback = document.querySelector('#admin-content-feedback');
  clearTimeout(adminContentFeedbackTimeout);
  adminContentFeedbackTimeout = null;
  const button = event.submitter;
  if (button) button.disabled = true;
  setFeedback(feedback, status === 'published' ? 'Publishing content…' : 'Saving draft…');
  const post = {
    type,
    title: values.title.trim(),
    slug: values.slug.trim() || undefined,
    excerpt: values.excerpt.trim(),
    body: values.body.trim(),
    coverImageUrl: values.coverImageUrl.trim() || undefined,
    videoUrl: values.videoUrl.trim() || undefined,
    status,
  };
  try {
    const id = values.id.trim();
    const result = await apiRequest(id ? `/admin/content/${encodeURIComponent(id)}` : '/admin/content', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(post),
    });
    const savedPost = result.post || result.content || {};
    resetContentEditor();
    document.querySelector('#content-editor-page').hidden = true;
    document.querySelector('#content-home-page').hidden = true;
    document.querySelector('#content-library-page').hidden = false;
    await loadAdminContent();
    const savedType = savedPost.type || type;
    const message = status === 'draft'
      ? 'Draft saved. It is not visible on the public Updates page.'
      : savedType === 'news'
        ? 'News published. Active subscribers have been emailed.'
        : `${savedType[0].toUpperCase()}${savedType.slice(1)} published on the Updates page.`;
    setFeedback(feedback, message);
    if (status === 'published' && savedType === 'news') {
      adminContentFeedbackTimeout = setTimeout(() => {
        if (feedback.textContent === message) setFeedback(feedback, '');
        adminContentFeedbackTimeout = null;
      }, 5000);
    }
    if (status === 'published') loadPublishedContent();
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { if (button) button.disabled = false; }
});

document.querySelector('#updates-subscribe-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.elements.email.value.trim().toLowerCase();
  const feedback = document.querySelector('#updates-subscribe-feedback');
  const button = form.querySelector('button[type="submit"]');
  clearTimeout(newsletterFeedbackTimeout);
  newsletterFeedbackTimeout = null;
  button.disabled = true;
  setFeedback(feedback, 'Adding your email…');
  try {
    const data = await apiRequest('/updates/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, consent: form.elements.consent.checked }),
    });
    form.reset();
    const successMessage = data.message ? `${data.message}. New ClariCare news will be sent to ${email}.` : `Subscribed. New ClariCare news will be sent to ${email}.`;
    setFeedback(feedback, successMessage);
    newsletterFeedbackTimeout = setTimeout(() => {
      if (feedback.textContent === successMessage) setFeedback(feedback, '');
      newsletterFeedbackTimeout = null;
    }, 5000);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});

function productDetailText(value) {
  if (Array.isArray(value)) return value.map((part) => String(part)).join('\n');
  return typeof value === 'string' ? value.trim() : '';
}

function openProductDetails(product) {
  const dialog = document.querySelector('#product-detail-dialog');
  const content = document.querySelector('#product-detail-content');
  const catalogProduct = products.find((item) => String(item.id) === String(product.id));
  const selectedProduct = { ...catalogProduct, ...product };
  const name = selectedProduct.name || selectedProduct.product_name || 'ClariCare product';
  content.replaceChildren();

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'product-detail-close';
  close.setAttribute('aria-label', 'Close product details');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());

  const layout = document.createElement('div');
  layout.className = 'product-detail-layout';
  const visual = document.createElement('div');
  visual.className = 'product-detail-visual';
  const image = createProductImage(selectedProduct, 'product-detail-image', `${name} product image`);
  if (image) visual.append(image);
  else {
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '✿';
    visual.append(mark);
  }

  const info = document.createElement('div');
  info.className = 'product-detail-info';
  const category = document.createElement('p');
  category.className = 'eyebrow';
  category.textContent = selectedProduct.category || 'CLARICARE PRODUCT';
  const title = document.createElement('h2');
  title.id = 'product-detail-name';
  title.textContent = name;
  let sizeOptions = selectedProduct.sizeOptions;
  if (!Array.isArray(sizeOptions)) {
    try { sizeOptions = JSON.parse(selectedProduct.size_options || '[]'); } catch (_) { sizeOptions = []; }
  }
  const initialVariant = selectedProduct.variant_label || sizeOptions[0]?.label || '';
  let selectedOption = sizeOptions.find((option) => option.label === initialVariant);
  const price = document.createElement('p');
  price.className = 'product-detail-price';
  const updatePrice = () => {
    const currentPrice = selectedOption?.price ?? selectedProduct.price ?? selectedProduct.selling_price ?? selectedProduct.product_price ?? selectedProduct.unit_price;
    price.textContent = currentPrice !== undefined && currentPrice !== null && Number.isFinite(Number(currentPrice))
      ? `${productMoney(currentPrice)}${selectedOption ? ` · ${selectedOption.label}` : ''}`
      : 'Contact us for product pricing';
  };
  updatePrice();
  info.append(category, title, price);
  if (sizeOptions.length) {
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'product-detail-size-label';
    sizeLabel.textContent = 'Size / measurement';
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'product-detail-size-select';
    sizeOptions.forEach((option) => sizeSelect.add(new Option(option.label, option.label)));
    sizeSelect.value = selectedOption?.label || sizeOptions[0].label;
    sizeSelect.addEventListener('change', () => {
      selectedOption = sizeOptions.find((option) => option.label === sizeSelect.value);
      updatePrice();
    });
    sizeLabel.append(sizeSelect);
    info.insertBefore(sizeLabel, price);
  }

  const sections = [
    ['Product details', selectedProduct.description || selectedProduct.details],
    ['Brand', selectedProduct.brand],
    ['How to use', selectedProduct.how_to_use || selectedProduct.howToUse || selectedProduct.instructions],
    ['Ingredients', selectedProduct.ingredients],
    ['Concerns & benefits', selectedProduct.concerns_and_benefits || selectedProduct.concernsAndBenefits || selectedProduct.benefits],
    ['Delivery & returns', 'Free delivery on orders above KSh 5,000\nNairobi: KSh 700 — 1 to 3 hours\nMombasa: KSh 2,500 — next business day\nOther counties: KSh 1,500 — 1 to 3 working days in major towns; 2 to 5 working days elsewhere'],
  ];
  sections.forEach(([label, value]) => {
    const text = productDetailText(value);
    if (!text) return;
    const section = document.createElement('details');
    section.className = 'product-detail-section';
    const summary = document.createElement('summary');
    summary.textContent = label;
    const description = document.createElement('p');
    description.textContent = text;
    section.append(summary, description);
    if (label === 'Delivery & returns') {
      const policyLink = document.createElement('button');
      policyLink.type = 'button';
      policyLink.className = 'text-button delivery-policy-trigger';
      policyLink.dataset.openDeliveryPolicy = '';
      policyLink.textContent = 'Read the full Delivery & Returns Policy';
      section.append(policyLink);
    }
    info.append(section);
  });

  const feedback = document.createElement('div');
  feedback.className = 'feedback product-detail-feedback';
  feedback.id = 'product-detail-feedback';
  feedback.setAttribute('role', 'status');
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'button button-primary product-detail-add';
  add.textContent = 'Add to cart';
  add.addEventListener('click', async () => {
    const added = await addProductToCart(selectedProduct.id, add, selectedOption?.label || '');
    if (added || String(currentUser?.role || '').toLowerCase() !== 'customer') dialog.close();
  });
  info.append(feedback, add);

  layout.append(visual, info);
  content.append(close, layout);
  dialog.showModal();
}

function displayPublicProduct(product) {
  const card = document.createElement('article');
  card.className = 'public-product-card';
  const visual = document.createElement('div');
  visual.className = 'public-product-visual';
  const plant = document.createElement('span');
  plant.textContent = '✿';
  const vessel = document.createElement('div');
  vessel.className = 'product-vessel';
  const label = document.createElement('small');
  label.textContent = 'claricare';
  vessel.append(label);
  const image = createProductImage(product, 'public-product-image', `${product.name || 'Product'} product image`);
  if (image) { visual.classList.add('has-product-image'); visual.append(image); }
  else visual.append(plant, vessel);

  const info = document.createElement('div');
  info.className = 'public-product-info';
  const category = document.createElement('span');
  category.className = 'product-category';
  category.textContent = product.category || 'Care';
  const name = document.createElement('h3');
  name.textContent = product.name || 'ClariCare product';
  const description = document.createElement('p');
  description.textContent = product.description || 'A thoughtful addition to your everyday ritual.';
  info.append(category, name, description);
  const detailsButton = document.createElement('button');
  detailsButton.className = 'button button-outline product-detail-trigger';
  detailsButton.type = 'button';
  detailsButton.dataset.productDetail = product.id;
  detailsButton.textContent = 'View details';
  info.append(detailsButton);
  if (product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price))) {
    const priceNotice = document.createElement('small');
    priceNotice.className = 'price-notice';
    priceNotice.textContent = productMoney(product.price);
    info.append(priceNotice);
  } else {
    const priceNotice = document.createElement('small');
    priceNotice.className = 'price-notice';
    priceNotice.textContent = 'Contact us for product pricing';
    info.append(priceNotice);
  }
  const addButton = document.createElement('button');
  addButton.className = 'button button-primary purchase-button';
  addButton.type = 'button';
  if ((product.sizeOptions || []).length) {
    addButton.dataset.productDetail = product.id;
    addButton.textContent = 'Choose size';
  } else {
    addButton.dataset.addToCart = product.id;
    addButton.textContent = 'Add to cart';
  }
  info.append(addButton);
  card.append(visual, info);
  return card;
}

async function addProductToCart(productId, button = null, variantLabel = '') {
  if (String(currentUser?.role || '').toLowerCase() !== 'customer') {
    pendingCartProductId = productId;
    pendingCartVariantLabel = variantLabel;
    showCustomerAuthPage('login');
    setFeedback(document.querySelector('#auth-feedback'), 'Sign in or create a customer account to save this item to your cart.');
    return false;
  }
  if (button) button.disabled = true;
  try {
    const data = await apiRequest('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ customerId: currentUser.id, productId, quantity: 1, ...(variantLabel ? { variantLabel } : {}) }),
    });
    const count = (data.cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const countNode = document.querySelector('#shop-cart-count');
    if (countNode) countNode.textContent = String(count);
    if (button) {
      button.textContent = 'Added to cart';
      setTimeout(() => { button.textContent = 'Add to cart'; button.disabled = false; }, 1300);
    }
    if (!document.querySelector('#workspace').hidden && document.querySelector('#view-dashboard').classList.contains('active')) await loadRoleDashboard();
    return true;
  } catch (error) {
    if (button) button.disabled = false;
    setFeedback(button?.closest('#product-detail-content')
      ? document.querySelector('#product-detail-feedback')
      : button?.closest('#customer-products-content')
      ? document.querySelector('#customer-products-feedback')
      : document.querySelector('#dashboard-feedback'), error.message, true);
    return false;
  }
}

async function addPendingProductToCart() {
  if (!pendingCartProductId) return;
  const productId = pendingCartProductId;
  const variantLabel = pendingCartVariantLabel;
  pendingCartProductId = '';
  pendingCartVariantLabel = '';
  await addProductToCart(productId, null, variantLabel);
}

document.querySelector('#public-site').addEventListener('click', (event) => {
  const details = event.target.closest('[data-product-detail]');
  if (details) {
    const product = products.find((item) => String(item.id) === details.dataset.productDetail);
    if (product) openProductDetails(product);
    return;
  }
  const button = event.target.closest('[data-add-to-cart]');
  if (button) addProductToCart(button.dataset.addToCart, button);
});

document.querySelector('#shop-cart-link').addEventListener('click', () => {
  if (String(currentUser?.role || '').toLowerCase() !== 'customer') {
    showCustomerAuthPage('login');
    return;
  }
  openWorkspace('customer-cart');
});

async function loadProducts(feedback) {
  try {
    const data = await apiRequest('/catalog/products');
    products = data.products || [];
    renderProducts();
    setOptions(document.querySelector('#manual-sale-product'), products, 'Choose a product');
    if (feedback) setFeedback(feedback, 'Catalog refreshed.');
  } catch (error) {
    if (!products.length) {
      [productList, publicProductList].forEach((container) => {
        container.replaceChildren();
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = error.message;
        container.append(empty);
      });
    }
    if (feedback) setFeedback(feedback, error.message, true);
  }
}

function showAgreement(agreement) {
  const result = document.querySelector('#agreement-result');
  result.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = agreement.title || `${agreement.type} Agreement`;
  const metadata = document.createElement('span');
  metadata.textContent = `${agreement.type} · ${agreement.status} · ID ${agreement.id}`;
  const content = document.createElement('p');
  content.textContent = agreement.content;
  result.append(title, metadata, content);
  if (agreement.signed_by && agreement.signed_at) {
    const signer = document.createElement('span');
    signer.textContent = `Electronically signed by ${agreement.signed_by} · ${agreement.signed_at}`;
    result.append(signer);
  }
  if (agreement.signature_data && /^data:image\/png;base64,/.test(agreement.signature_data)) {
    const signature = document.createElement('img');
    signature.className = 'agreement-signature';
    signature.src = agreement.signature_data;
    signature.alt = `Signature of ${agreement.signed_by || 'signer'}`;
    result.append(signature);
  }
}

async function appendMyAgreements(content) {
  content.querySelector('.user-agreements-panel')?.remove();
  const panel = document.createElement('section');
  panel.className = 'panel user-agreements-panel';
  const heading = document.createElement('div');
  heading.className = 'panel-heading';
  heading.innerHTML = '<div><p class="eyebrow">PEOPLE OPERATIONS</p><h2>My agreements</h2></div>';
  panel.append(heading);
  try {
    const { agreements = [] } = await apiRequest('/agreements/mine');
    if (!agreements.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No agreements have been assigned to you yet.';
      panel.append(empty);
    }
    agreements.forEach((agreement) => {
      const documentPanel = document.createElement('article');
      documentPanel.className = 'user-agreement';
      const title = document.createElement('h3');
      title.textContent = agreement.title || `${agreement.type} Agreement`;
      const status = document.createElement('p');
      status.className = 'muted';
      status.textContent = agreement.status === 'signed'
        ? `Signed by ${agreement.signed_by || 'you'} · ${agreement.signed_at || ''}`
        : agreement.status === 'pending_signature' ? 'Awaiting your signature' : agreement.status;
      const copy = document.createElement('pre');
      copy.className = 'agreement-copy';
      copy.textContent = agreement.content;
      documentPanel.append(title, status, copy);
      if (agreement.status === 'pending_signature') {
        const form = document.createElement('form');
        form.className = 'user-agreement-sign-form';
        const nameLabel = document.createElement('label');
        nameLabel.textContent = agreement.type === 'employee-team-participation'
          ? 'Team member full name (also used as your signature name)'
          : 'Full name for electronic signature';
        const nameInput = document.createElement('input');
        nameInput.name = 'signatureName';
        nameInput.required = true;
        nameInput.maxLength = 160;
        nameInput.autocomplete = 'name';
        nameInput.placeholder = 'Your full legal name';
        nameLabel.append(nameInput);
        const fields = {};
        const fieldLabels = (agreement.fillableFields || []).map((field) => {
          const label = document.createElement('label');
          label.textContent = field.label;
          const input = document.createElement('input');
          input.name = field.name;
          input.type = ['date', 'text'].includes(field.type) ? field.type : 'text';
          input.required = field.required !== false;
          if (field.maxLength) input.maxLength = field.maxLength;
          label.append(input);
          fields[field.name] = input;
          return label;
        });
        const signatureLabel = document.createElement('label');
        signatureLabel.className = 'signature-label';
        signatureLabel.textContent = 'Draw your signature';
        const canvas = document.createElement('canvas');
        canvas.className = 'signature-pad';
        canvas.setAttribute('aria-label', 'Draw your signature');
        signatureLabel.append(canvas);
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'text-button';
        clear.textContent = 'Clear signature';
        const consentLabel = document.createElement('label');
        consentLabel.className = 'agreement-consent';
        const consent = document.createElement('input');
        consent.type = 'checkbox';
        const consentText = document.createElement('span');
        consentText.textContent = 'I have read this agreement, agree to its terms, and intend my drawn signature and typed name to be my electronic signature.';
        consentLabel.append(consent, consentText);
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'button button-primary';
        submit.textContent = 'Sign agreement';
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        feedback.setAttribute('role', 'status');
        form.append(nameLabel, ...fieldLabels, signatureLabel, clear, consentLabel, submit, feedback);
        prepareSignaturePad(canvas, clear);
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (canvas.dataset.hasSignature !== 'true') {
            setFeedback(feedback, 'Draw your signature before signing.', true);
            return;
          }
          submit.disabled = true;
          setFeedback(feedback, 'Saving your signed agreement…');
          try {
            const result = await apiRequest(`/agreements/${encodeURIComponent(agreement.id)}/sign`, {
              method: 'POST',
              body: JSON.stringify({
                signatureName: nameInput.value.trim(),
                signatureData: canvas.toDataURL('image/png'),
                consent: consent.checked,
                fields: Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])),
              }),
            });
            await appendMyAgreements(content);
          } catch (error) {
            setFeedback(feedback, error.message, true);
            submit.disabled = false;
          }
        });
        documentPanel.append(form);
      } else if (agreement.signature_data && /^data:image\/png;base64,/.test(agreement.signature_data)) {
        const signature = document.createElement('img');
        signature.className = 'agreement-signature';
        signature.src = agreement.signature_data;
        signature.alt = `Signature of ${agreement.signed_by || 'signer'}`;
        documentPanel.append(signature);
      }
      panel.append(documentPanel);
    });
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'feedback error';
    message.textContent = `Agreements could not be loaded: ${error.message}`;
    panel.append(message);
  }
  content.append(panel);
}

async function submitForm(form, endpoint, feedback, successMessage, onSuccess, transform = (values) => values) {
  setFeedback(feedback, '');
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const data = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(await transform(formData(form))),
    });
    setFeedback(feedback, successMessage(data));
    if (onSuccess) await onSuccess(data);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally {
    submit.disabled = false;
  }
}

function renderSalesChart(data) {
  const container = document.querySelector('#sales-chart');
  const period = document.querySelector('#sales-period').value;
  const grouped = new Map();
  (data.salesTrend || []).forEach((sale) => {
    if (!sale.date) return;
    const date = new Date(`${sale.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    let key = sale.date;
    if (period === 'week') {
      const weekday = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - weekday);
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (period === 'month') {
      key = sale.date.slice(0, 7);
    }
    grouped.set(key, (grouped.get(key) || 0) + Number(sale.revenue || 0));
  });
  const series = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(period === 'day' ? -14 : -12)
    .map(([label, revenue]) => ({ label, revenue }));
  container.replaceChildren();
  if (!series.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No sales records yet.';
    container.append(empty);
    return;
  }

  const width = 760;
  const height = 250;
  const padding = { top: 18, right: 20, bottom: 42, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxRevenue = Math.max(1, ...series.map((item) => Number(item.revenueKsh || 0)));
  const slotWidth = chartWidth / series.length;
  const barWidth = Math.min(38, slotWidth * .64);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Recorded sales by ${period}; currency is unspecified`);
  const make = (name, attrs) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    svg.append(element);
    return element;
  };

  for (let tick = 0; tick <= 4; tick += 1) {
    const y = padding.top + (chartHeight * tick) / 4;
    make('line', { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: 'chart-gridline' });
    const label = make('text', { x: padding.left - 8, y: y + 3, class: 'chart-axis-label', 'text-anchor': 'end' });
    label.textContent = Math.round(maxRevenue * (4 - tick) / 4).toLocaleString('en-KE');
  }

  series.forEach((item, index) => {
    const centerX = padding.left + slotWidth * index + slotWidth / 2;
    const revenue = Number(item.revenue || 0);
    const barHeight = chartHeight * revenue / maxRevenue;
    make('rect', {
      x: centerX - barWidth / 2,
      y: padding.top + chartHeight - barHeight,
      width: barWidth,
      height: Math.max(0, barHeight),
      rx: 4,
      class: 'chart-revenue-bar',
    });
    const xLabel = make('text', { x: centerX, y: height - 15, class: 'chart-axis-label', 'text-anchor': 'middle' });
    xLabel.textContent = period === 'month' ? item.label : item.label.slice(5);
    const title = make('title', {});
    title.textContent = `${item.label}: ${money(revenue)} recorded`;
  });
  container.append(svg);
}

async function loadSales() {
  const feedback = document.querySelector('#sales-feedback');
  try {
    const data = await apiRequest('/accounting/summary');
    const summary = data.summary || {};
    document.querySelector('#sales-total').textContent = money(summary.totalRevenue);
    document.querySelector('#orders-total').textContent = String(summary.totalOrders ?? '—');
    document.querySelector('#average-order').textContent = money(summary.avgOrderValue);
    document.querySelector('#sales-cost').textContent = money(summary.totalCost);
    document.querySelector('#sales-profit').textContent = money(summary.totalProfit);
    document.querySelector('#ingredient-spend').textContent = money(summary.ingredientSpend);
    renderSalesChart(summary);
    setFeedback(feedback, 'Values use the backend’s recorded units; no currency or payment settlement status is provided.');
  } catch (error) {
    setFeedback(feedback, error.message, true);
    document.querySelector('#sales-total').textContent = '—';
    document.querySelector('#orders-total').textContent = '—';
    document.querySelector('#average-order').textContent = '—';
    document.querySelector('#sales-cost').textContent = '—';
    document.querySelector('#sales-profit').textContent = '—';
    document.querySelector('#ingredient-spend').textContent = '—';
    document.querySelector('#sales-chart').replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Sales reporting is waiting for the accounting summary API.';
    document.querySelector('#sales-chart').append(empty);
  }
}

function inventoryKes(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'KES —';
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(amount);
}

function inventoryQuantity(value, unit = '') {
  const quantity = Number(value);
  return `${Number.isFinite(quantity) ? new Intl.NumberFormat('en-KE', { maximumFractionDigits: 3 }).format(quantity) : '0'}${unit ? ` ${unit}` : ''}`;
}

function getFirstValue(source, keys, fallback = undefined) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
  }
  return fallback;
}

function getFirstNumber(source, keys, fallback = null) {
  const value = getFirstValue(source, keys);
  if (value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function renderInventoryEquipment(equipment = []) {
  const list = document.querySelector('#inventory-equipment-list');
  const count = document.querySelector('#equipment-list-count');
  count.textContent = `${equipment.length} active ${equipment.length === 1 ? 'asset' : 'assets'}`;
  list.replaceChildren();
  if (!equipment.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No active equipment yet. Add an asset above to include its depreciation in product costing.';
    list.append(empty);
    return;
  }
  equipment.forEach((asset) => {
    const card = document.createElement('article');
    card.className = 'inventory-equipment-card';
    const header = document.createElement('div');
    header.className = 'inventory-equipment-card-header';
    const identity = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = asset.name || 'Equipment asset';
    const category = document.createElement('span');
    category.className = 'pill';
    category.textContent = asset.category || 'Equipment';
    identity.append(name, category);
    const archive = document.createElement('button');
    archive.type = 'button';
    archive.className = 'button button-outline button-small inventory-equipment-archive';
    archive.dataset.equipmentId = asset.id;
    archive.textContent = 'Archive';
    header.append(identity, archive);
    const stats = document.createElement('dl');
    stats.className = 'inventory-equipment-details';
    const basis = getFirstValue(asset, ['allocation_basis', 'allocationBasis'], 'per_unit');
    const allocationQuantity = getFirstValue(asset, ['allocation_quantity', 'allocationQuantity'], 0);
    const allocationDescription = basis === 'per_batch'
      ? `${inventoryQuantity(allocationQuantity)} batches per month`
      : `${inventoryQuantity(allocationQuantity)} units per month`;
    const monthly = getFirstValue(asset, ['monthly_depreciation', 'monthlyDepreciation', 'current_monthly_depreciation', 'currentMonthlyDepreciation']);
    const annual = getFirstValue(asset, ['annual_depreciation', 'annualDepreciation', 'yearly_depreciation', 'yearlyDepreciation']);
    [
      ['Purchase price', inventoryKes(getFirstValue(asset, ['purchase_price', 'purchasePrice']))],
      ['Purchased', getFirstValue(asset, ['purchase_date', 'purchaseDate'], '—')],
      ['Useful life', `${Number.isFinite(Number(getFirstValue(asset, ['useful_life_months', 'usefulLifeMonths', 'useful_life', 'usefulLife']))) ? inventoryQuantity(getFirstValue(asset, ['useful_life_months', 'usefulLifeMonths', 'useful_life', 'usefulLife'])) : '—'} months`],
      ['Residual value', inventoryKes(getFirstValue(asset, ['residual_value', 'residualValue'], 0))],
      ['Monthly depreciation', inventoryKes(monthly)],
      ['Annual depreciation', inventoryKes(annual ?? (Number.isFinite(Number(monthly)) ? Number(monthly) * 12 : null))],
      ['Allocation', allocationDescription],
    ].forEach(([label, value]) => {
      const term = document.createElement('dt'); term.textContent = label;
      const detail = document.createElement('dd'); detail.textContent = value;
      stats.append(term, detail);
    });
    card.append(header, stats);
    if (asset.notes) {
      const notes = document.createElement('p');
      notes.className = 'inventory-equipment-notes';
      notes.textContent = asset.notes;
      card.append(notes);
    }
    list.append(card);
  });
}

function inventoryCell(row, value, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function inventoryTable(headers, rows, emptyMessage) {
  const wrapper = document.createElement('div');
  wrapper.className = 'inventory-table-wrap';
  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    wrapper.append(empty);
    return wrapper;
  }
  const table = document.createElement('table');
  table.className = 'inventory-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach((header) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = header;
    headRow.append(cell);
  });
  head.append(headRow);
  const body = document.createElement('tbody');
  rows.forEach((buildRow) => body.append(buildRow()));
  table.append(head, body);
  wrapper.append(table);
  return wrapper;
}

function renderInventoryTables(data) {
  const materials = data.materials || [];
  const finished = data.products || [];
  const equipmentSummary = data.equipment || {};
  const lowStock = materials.filter((material) => Number(material.stock) <= Number(material.reorder_level ?? material.reorderLevel ?? 0));
  document.querySelector('#inventory-material-count').textContent = String(materials.length);
  document.querySelector('#inventory-low-count').textContent = String(lowStock.length);
  document.querySelector('#inventory-product-count').textContent = String(finished.length);
  const activeEquipmentCount = Array.isArray(equipmentSummary.activeAssets)
    ? equipmentSummary.activeAssets.length
    : getFirstValue(equipmentSummary, ['activeAssetCount', 'active_asset_count', 'activeCount', 'active_count', 'activeAssets', 'count'], inventoryEquipment.length);
  const monthlyDepreciation = getFirstValue(equipmentSummary, ['monthlyDepreciation', 'monthly_depreciation', 'monthlyDepreciationAmount', 'monthly_depreciation_amount', 'currentMonthlyDepreciation', 'current_monthly_depreciation', 'depreciationMonthly', 'depreciation_monthly', 'monthly'], 0);
  document.querySelector('#inventory-equipment-count').textContent = String(activeEquipmentCount);
  document.querySelector('#inventory-equipment-monthly').textContent = inventoryKes(monthlyDepreciation);
  document.querySelector('#inventory-equipment-annual').textContent = inventoryKes(getFirstValue(equipmentSummary, ['annualDepreciation', 'annual_depreciation', 'annualDepreciationAmount', 'annual_depreciation_amount', 'yearlyDepreciation', 'yearly_depreciation', 'currentAnnualDepreciation', 'current_annual_depreciation', 'depreciationAnnual', 'depreciation_annual', 'annual'], getFirstNumber(equipmentSummary, ['monthlyDepreciation', 'monthly_depreciation', 'monthlyDepreciationAmount', 'monthly_depreciation_amount', 'currentMonthlyDepreciation', 'current_monthly_depreciation', 'depreciationMonthly', 'depreciation_monthly', 'monthly'], 0) * 12));

  const materialRows = materials.map((material) => () => {
    const row = document.createElement('tr');
    const low = Number(material.stock) <= Number(material.reorder_level ?? material.reorderLevel ?? 0);
    inventoryCell(row, material.name || 'Unnamed material');
    inventoryCell(row, material.category || 'ingredient');
    inventoryCell(row, inventoryQuantity(material.stock, material.unit));
    inventoryCell(row, inventoryQuantity(material.reorder_level ?? material.reorderLevel ?? 0, material.unit));
    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = `inventory-status ${low ? 'low' : 'in-stock'}`;
    status.textContent = low ? 'Low stock' : 'In stock';
    statusCell.append(status);
    row.append(statusCell);
    return row;
  });
  const productRows = finished.map((product) => () => {
    const row = document.createElement('tr');
    inventoryCell(row, product.name || 'Product');
    inventoryCell(row, inventoryQuantity(product.stock));
    return row;
  });
  const materialsTable = inventoryTable(['Material', 'Type', 'On hand', 'Reorder at', 'Status'], materialRows, 'No materials yet. Add your first material below.');
  const productTable = inventoryTable(['Product', 'Saleable units'], productRows, 'Finished stock appears after the first production batch.');
  document.querySelector('#inventory-material-table').replaceChildren(...materialsTable.childNodes);
  document.querySelector('#inventory-product-table').replaceChildren(...productTable.childNodes);
  renderInventoryEquipment(inventoryEquipment);

  setOptions(document.querySelector('#inventory-purchase-material'), materials, 'Choose a material');
  const productSelects = ['#inventory-formula-product', '#inventory-costing-product', '#inventory-production-product'];
  productSelects.forEach((selector) => setOptions(document.querySelector(selector), inventoryProducts, 'Choose a product'));
}

function renderInventoryPurchaseHistory(purchases = []) {
  const root = document.querySelector('#inventory-purchase-history');
  if (!root) return;
  root.replaceChildren();
  if (!purchases.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No material purchases have been recorded yet.';
    root.append(empty);
    return;
  }
  purchases.forEach((purchase) => {
    const card = document.createElement('article');
    card.className = 'inventory-purchase-card';
    const info = document.createElement('div');
    info.className = 'inventory-purchase-card-info';
    const title = document.createElement('h4');
    title.textContent = purchase.materialName || 'Material purchase';
    const date = document.createElement('p');
    const parsedDate = purchase.createdAt ? new Date(purchase.createdAt) : null;
    date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? formatEATDateTime(parsedDate)
      : 'Date unavailable';
    const amount = document.createElement('strong');
    amount.textContent = inventoryKes(purchase.totalCost ?? Number(purchase.quantity || 0) * Number(purchase.unitCost || 0));
    const quantity = document.createElement('span');
    quantity.textContent = `${inventoryQuantity(purchase.quantity, purchase.unit)} purchased`;
    const reference = document.createElement('span');
    reference.textContent = purchase.reference || 'No reference added';
    info.append(title, date, amount, quantity, reference);
    card.append(info);
    const receiptUrl = safeExternalUrl(purchase.receiptUrl || purchase.receipt_url);
    if (receiptUrl) {
      const previewButton = document.createElement('button');
      previewButton.type = 'button';
      previewButton.className = 'inventory-receipt-preview-button';
      previewButton.setAttribute('aria-label', `View full receipt for ${purchase.materialName || 'material purchase'}`);
      const image = document.createElement('img');
      image.src = receiptUrl;
      image.alt = `Receipt for ${purchase.materialName || 'material purchase'}`;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        previewButton.replaceChildren();
        previewButton.classList.add('receipt-preview-unavailable');
        previewButton.textContent = 'Receipt image unavailable';
        previewButton.disabled = true;
      }, { once: true });
      previewButton.append(image);
      previewButton.addEventListener('click', () => openReceiptPreview(receiptUrl, purchase.materialName || 'Purchase receipt'));
      card.append(previewButton);
    } else {
      const missing = document.createElement('span');
      missing.className = 'inventory-receipt-missing';
      missing.textContent = 'No receipt image';
      card.append(missing);
    }
    root.append(card);
  });
}

function openReceiptPreview(url, title) {
  const dialog = document.querySelector('#receipt-preview-dialog');
  const image = document.querySelector('#receipt-preview-image');
  const heading = document.querySelector('#receipt-preview-title');
  const original = document.querySelector('#receipt-preview-open-link');
  image.src = url;
  heading.textContent = title;
  original.href = url;
  if (!dialog.open) dialog.showModal();
}

document.querySelector('#receipt-preview-close').addEventListener('click', () => {
  document.querySelector('#receipt-preview-dialog').close();
});
document.querySelector('#receipt-preview-dialog').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

function setAccountingPage(page) {
  const labels = { trends: 'Sales trends', purchases: 'Purchased ingredients', pricing: 'Product pricing', sales: 'Record a sale' };
  const selected = Object.hasOwn(labels, page) ? page : 'trends';
  document.querySelector('#accounting-trends').hidden = selected !== 'trends';
  const forms = document.querySelector('.accounting-forms');
  forms.hidden = !['purchases', 'pricing'].includes(selected);
  forms.classList.toggle('single-section', !forms.hidden);
  document.querySelector('#accounting-purchases').hidden = selected !== 'purchases';
  document.querySelector('#accounting-pricing').hidden = selected !== 'pricing';
  document.querySelector('#manual-sale-panel').hidden = selected !== 'sales' || !isFinanceUser();
  document.querySelector('.report-period').hidden = selected !== 'trends';
  document.querySelectorAll('#view-accounting [data-accounting-page]').forEach((button) => {
    if (!button.closest('.accounting-page-nav')) return;
    const active = button.dataset.accountingPage === selected;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#breadcrumb-current').textContent = `Accounting · ${labels[selected]}`;
}

document.querySelector('#view-accounting').addEventListener('click', (event) => {
  const button = event.target.closest('.accounting-page-nav [data-accounting-page]');
  if (button) setAccountingPage(button.dataset.accountingPage);
});

function setInventoryPage(page) {
  const allowed = ['overview', 'materials', 'purchases', 'purchase-records', 'formulas', 'production', 'equipment', 'expenses'];
  const selected = allowed.includes(page) ? page : 'overview';
  document.querySelectorAll('#view-inventory .inventory-section').forEach((section) => {
    section.hidden = section.id !== `inventory-${selected}`;
  });
  document.querySelectorAll('#view-inventory [data-inventory-page]').forEach((button) => {
    const active = button.dataset.inventoryPage === selected;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const current = document.querySelector(`#view-inventory [data-inventory-page="${selected}"]`);
  document.querySelector('#breadcrumb-current').textContent = `Inventory · ${current?.textContent.trim() || 'Overview'}`;
}

function setProductsPage(page) {
  const selected = page === 'add' ? 'add' : 'catalog';
  document.querySelector('#products-add-page').hidden = selected !== 'add';
  document.querySelector('#products-catalog-page').hidden = selected !== 'catalog';
  document.querySelectorAll('#view-products [data-products-page]').forEach((button) => {
    const active = button.dataset.productsPage === selected;
    button.classList.toggle('active', active);
    if (button.closest('.product-page-nav')) {
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  });
  document.querySelector('#breadcrumb-current').textContent = `Products & reviews · ${selected === 'catalog' ? 'Catalog & reviews' : 'Add product'}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelector('#view-products').addEventListener('click', (event) => {
  const button = event.target.closest('[data-products-page]');
  if (button) setProductsPage(button.dataset.productsPage);
});

document.querySelector('#view-inventory').addEventListener('click', (event) => {
  const button = event.target.closest('[data-inventory-page]');
  if (button) setInventoryPage(button.dataset.inventoryPage);
});

async function loadInventoryDashboard(successMessage = '') {
  const feedback = document.querySelector('#inventory-feedback');
  if (String(currentUser?.role || '').toLowerCase() !== 'admin') {
    setFeedback(feedback, 'Inventory management is only available to administrators.', true);
    return;
  }
  setFeedback(feedback, 'Loading material and finished stock…');
  try {
    const [inventory, catalog, equipmentData, purchaseHistory] = await Promise.all([
      apiRequest('/accounting/inventory'),
      apiRequest('/catalog/products'),
      apiRequest('/accounting/equipment'),
      apiRequest('/accounting/material-purchases'),
    ]);
    inventoryMaterials = inventory.materials || [];
    inventoryProducts = catalog.products || [];
    inventoryEquipment = Array.isArray(equipmentData.equipment)
      ? equipmentData.equipment
      : Array.isArray(equipmentData.assets) ? equipmentData.assets
        : Array.isArray(equipmentData) ? equipmentData : [];
    renderInventoryTables(inventory);
    renderInventoryPurchaseHistory(purchaseHistory.purchases || []);
    if (!document.querySelector('#formula-material-rows').children.length && inventoryMaterials.length) addFormulaMaterialRow();
    setFeedback(feedback, successMessage || `Inventory refreshed. All recorded costs are in ${inventory.currency || 'KES'}.`);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  }
}

function addFormulaMaterialRow(selectedMaterial = '', quantity = '') {
  const rows = document.querySelector('#formula-material-rows');
  const row = document.createElement('div');
  row.className = 'formula-material-row';
  const materialLabel = document.createElement('label');
  materialLabel.textContent = 'Material';
  const select = document.createElement('select');
  select.name = 'materialId';
  select.required = true;
  select.add(new Option('Choose material', ''));
  inventoryMaterials.forEach((material) => select.add(new Option(`${material.name} (${material.unit})`, material.id)));
  select.value = selectedMaterial;
  materialLabel.append(select);
  const quantityLabel = document.createElement('label');
  quantityLabel.textContent = 'Quantity';
  const quantityInput = document.createElement('input');
  quantityInput.name = 'materialQuantity';
  quantityInput.type = 'number';
  quantityInput.min = '0.001';
  quantityInput.step = 'any';
  quantityInput.required = true;
  quantityInput.value = quantity;
  quantityLabel.append(quantityInput);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-formula-material';
  remove.setAttribute('aria-label', 'Remove formula material');
  remove.textContent = '×';
  remove.addEventListener('click', () => row.remove());
  row.append(materialLabel, quantityLabel, remove);
  rows.append(row);
}

function normalizedCostBreakdown(breakdown) {
  if (Array.isArray(breakdown)) {
    return Object.fromEntries(breakdown.map((item) => [
      String(item.key || item.label || item.category || '').replace(/[^a-z0-9]/gi, '').toLowerCase(),
      item.amount ?? item.cost ?? item.value,
    ]));
  }
  return breakdown && typeof breakdown === 'object' ? breakdown : {};
}

function getCostComponent(breakdown, aliases, fallback = null) {
  const source = normalizedCostBreakdown(breakdown);
  const normalizedAliases = aliases.map((alias) => alias.replace(/[^a-z0-9]/gi, '').toLowerCase());
  const key = Object.keys(source).find((candidate) => normalizedAliases.includes(candidate.replace(/[^a-z0-9]/gi, '').toLowerCase()));
  if (!key) return fallback;
  const value = source[key];
  if (value && typeof value === 'object') return getFirstValue(value, ['amount', 'cost', 'total', 'totalCost', 'total_cost', 'value'], fallback);
  return value ?? fallback;
}

function getEquipmentDepreciationRows(details) {
  if (Array.isArray(details)) return details;
  if (!details || typeof details !== 'object') return [];
  for (const key of ['items', 'equipment', 'assets', 'details', 'allocations']) {
    if (Array.isArray(details[key])) return details[key];
  }
  return Object.values(details).filter((item) => item && typeof item === 'object' && !Array.isArray(item)
    && getFirstValue(item, ['name', 'equipmentName', 'equipment_name', 'assetName', 'asset_name', 'allocatedDepreciation', 'allocated_depreciation']) !== undefined);
}

function renderInventoryBreakdown(root, breakdown, depreciationDetails, fallbacks = {}) {
  const components = normalizedCostBreakdown(breakdown);
  const equipmentRows = getEquipmentDepreciationRows(depreciationDetails);
  const equipmentTotal = getFirstNumber(depreciationDetails, ['total', 'totalDepreciation', 'total_depreciation', 'allocatedTotal', 'allocated_total'],
    equipmentRows.reduce((total, item) => total + Number(getFirstValue(item, ['allocatedDepreciation', 'allocated_depreciation', 'allocatedAmount', 'allocated_amount', 'amount', 'cost'], 0) || 0), 0));
  const rawMaterials = getCostComponent(components, ['rawMaterials', 'rawMaterialsCost', 'rawMaterialCost', 'raw_material_cost', 'ingredientCost', 'ingredient_cost', 'materialsCost', 'materials_cost', 'materials'], fallbacks.rawMaterials);
  const packaging = getCostComponent(components, ['packagingMaterials', 'packagingMaterialsCost', 'packagingAndMaterials', 'packaging_materials', 'packagingCost', 'packaging_cost', 'packagingMaterialCost', 'packaging_material_cost'], fallbacks.packaging);
  const labour = getCostComponent(components, ['labour', 'labourCost', 'labour_cost', 'labor', 'laborCost', 'labor_cost'], fallbacks.labour);
  const overhead = getCostComponent(components, ['overhead', 'overheadCost', 'overhead_cost'], fallbacks.overhead);
  const equipment = getCostComponent(components, ['equipmentDepreciation', 'equipment_depreciation', 'allocatedEquipmentDepreciation'], equipmentTotal);
  const total = getCostComponent(components, ['totalBatchCost', 'total_batch_cost', 'totalCost', 'total_cost', 'batchCost', 'batch_cost'], fallbacks.total);
  const quantity = getCostComponent(components, ['expectedQuantity', 'expected_quantity', 'expectedYield', 'expected_yield', 'saleableQuantity', 'saleable_quantity'], fallbacks.quantity);
  const unitCost = getCostComponent(components, ['costPerUnit', 'cost_per_unit', 'unitCost', 'unit_cost'], fallbacks.unitCost);

  const section = document.createElement('section');
  section.className = 'inventory-breakdown';
  const heading = document.createElement('h3');
  heading.textContent = 'Cost breakdown';
  const list = document.createElement('dl');
  list.className = 'inventory-breakdown-list';
  [
    ['Raw materials', rawMaterials ?? '—'],
    ['Packaging / materials', packaging ?? '—'],
    ['Labour', labour],
    ['Overhead', overhead],
    ['Equipment depreciation', equipment],
    ['Total batch cost', total],
    ['Expected quantity', quantity === null || quantity === undefined ? '—' : inventoryQuantity(quantity)],
    ['Cost per unit', unitCost === null || unitCost === undefined ? '—' : inventoryKes(unitCost)],
  ].forEach(([label, value]) => {
    const term = document.createElement('dt'); term.textContent = label;
    const amount = document.createElement('dd');
    amount.textContent = typeof value === 'string' && ['—'].includes(value) ? value : (label === 'Expected quantity' || label === 'Cost per unit' ? String(value) : inventoryKes(value));
    list.append(term, amount);
  });
  section.append(heading, list);
  const equipmentList = document.createElement('div');
  equipmentList.className = 'inventory-depreciation-list';
  const equipmentHeading = document.createElement('h4');
  equipmentHeading.textContent = 'Allocated equipment depreciation';
  equipmentList.append(equipmentHeading);
  if (!equipmentRows.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No active equipment depreciation was allocated to this costing.';
    equipmentList.append(empty);
  } else {
    const tableRows = equipmentRows.map((item) => () => {
      const row = document.createElement('tr');
      inventoryCell(row, getFirstValue(item, ['name', 'equipmentName', 'equipment_name', 'assetName', 'asset_name'], 'Equipment'));
      inventoryCell(row, inventoryKes(getFirstValue(item, ['allocatedDepreciation', 'allocated_depreciation', 'allocatedAmount', 'allocated_amount', 'allocatedCost', 'allocated_cost', 'depreciationAmount', 'depreciation_amount', 'amount', 'cost'], 0)));
      const basis = getFirstValue(item, ['allocationBasis', 'allocation_basis'], '');
      const allocationQuantity = getFirstValue(item, ['allocationQuantity', 'allocation_quantity'], null);
      inventoryCell(row, basis ? `${basis === 'per_batch' ? 'Per batch' : 'Per unit'}${allocationQuantity !== null ? ` · ${inventoryQuantity(allocationQuantity)}` : ''}` : '—');
      inventoryCell(row, inventoryKes(getFirstValue(item, ['monthlyDepreciation', 'monthly_depreciation'], null)));
      return row;
    });
    equipmentList.append(inventoryTable(['Equipment item', 'Allocated to batch', 'Allocation basis', 'Monthly depreciation'], tableRows, 'No equipment assets were allocated.'));
  }
  section.append(equipmentList);
  root.append(section);
}

function renderInventoryCosting(data) {
  const root = document.querySelector('#inventory-costing-result');
  root.replaceChildren();
  const formula = data.formula || {};
  const summary = document.createElement('div');
  summary.className = 'inventory-cost-summary';
  [
    ['Batch estimate', inventoryKes(data.batchCost)],
    ['Unit cost / break-even', inventoryKes(data.breakEvenPrice ?? data.unitCost)],
    ['Finished stock', inventoryQuantity(data.finishedStock)],
  ].forEach(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'inventory-cost-metric';
    const caption = document.createElement('span'); caption.textContent = label;
    const amount = document.createElement('strong'); amount.textContent = value;
    card.append(caption, amount); summary.append(card);
  });
  const title = document.createElement('p');
  title.className = 'inventory-costing-title';
  title.textContent = `${data.product?.name || 'Product'} · formula version ${formula.version ?? 'latest'} · expected yield ${inventoryQuantity(formula.expected_yield ?? formula.expectedYield)}`;
  const ingredientRows = (data.ingredients || []).map((ingredient) => () => {
    const row = document.createElement('tr');
    inventoryCell(row, ingredient.name || 'Material');
    inventoryCell(row, inventoryQuantity(ingredient.quantity, ingredient.unit));
    inventoryCell(row, inventoryKes(ingredient.unitCost));
    inventoryCell(row, inventoryKes(ingredient.extendedCost));
    return row;
  });
  const ingredientTable = inventoryTable(['Material', 'Formula amount', 'Latest unit cost', 'Estimated cost'], ingredientRows, 'This formula has no listed materials.');
  const pricing = data.pricing || {};
  const scenarios = document.createElement('div');
  scenarios.className = 'inventory-price-scenarios';
  [['50% markup', pricing.markup50], ['30% margin', pricing.margin30], ['40% margin', pricing.margin40]].forEach(([label, value]) => {
    const item = document.createElement('p');
    const name = document.createElement('span'); name.textContent = label;
    const price = document.createElement('strong'); price.textContent = inventoryKes(value);
    item.append(name, price); scenarios.append(item);
  });
  const breakdown = document.createElement('div');
  renderInventoryBreakdown(breakdown, data.costBreakdown, data.equipmentDepreciationDetails, {
    total: data.batchCost,
    quantity: formula.expected_yield ?? formula.expectedYield,
    unitCost: data.unitCost,
    rawMaterials: (data.ingredients || []).filter((item) => !/packag|other/i.test(item.category || '')).reduce((sum, item) => sum + Number(item.extendedCost || 0), 0),
    packaging: (data.ingredients || []).filter((item) => /packag/i.test(item.category || '')).reduce((sum, item) => sum + Number(item.extendedCost || 0), 0),
    labour: formula.labour_cost ?? formula.labourCost,
    overhead: formula.overhead_cost ?? formula.overheadCost,
  });
  root.append(title, summary, ingredientTable, breakdown, scenarios);
}

async function getProductCosting(productId, feedbackElement = null) {
  if (!productId) throw new Error('Choose a product first.');
  try {
    const data = await apiRequest(`/accounting/products/${encodeURIComponent(productId)}/costing`);
    if (feedbackElement) setFeedback(feedbackElement, 'Latest formula costing loaded. Values are estimates.');
    return data;
  } catch (error) {
    if (feedbackElement) setFeedback(feedbackElement, error.message, true);
    throw error;
  }
}

async function refreshSelectedInventoryCosting() {
  const productId = document.querySelector('#inventory-costing-product').value;
  if (!productId) return;
  try {
    const data = await getProductCosting(productId);
    renderInventoryCosting(data);
    setFeedback(document.querySelector('#inventory-costing-feedback'), 'Costing refreshed from the latest material purchase prices.');
  } catch {
    // Products without a formula have no costing to refresh yet.
  }
}

async function loadProductionFormula(productId) {
  const select = document.querySelector('#inventory-production-formula');
  const feedback = document.querySelector('#inventory-production-feedback');
  select.replaceChildren(new Option('Loading latest formula…', ''));
  if (!productId) { select.replaceChildren(new Option('Choose a product first', '')); return; }
  try {
    const data = await getProductCosting(productId);
    select.replaceChildren(new Option(`Latest formula · version ${data.formula.version}`, data.formula.id));
    setFeedback(feedback, `Latest formula ready. Estimated unit cost: ${inventoryKes(data.unitCost)}.`);
  } catch (error) {
    select.replaceChildren(new Option('No formula available', ''));
    setFeedback(feedback, error.message, true);
  }
}

function appendMessage(container, message, own = false) {
  const item = document.createElement('article');
  item.className = `message-bubble${own ? ' own' : ''}`;
  const text = document.createElement('p');
  text.textContent = message.text || message.message || '';
  const time = document.createElement('small');
  const timestamp = message.createdAt || message.created_at;
  time.textContent = timestamp ? formatEATDateTime(timestamp, { hour: '2-digit', minute: '2-digit' }) : '';
  item.append(text, time);
  container.append(item);
  container.scrollTop = container.scrollHeight;
}

async function postCallSignal(session, type, payload) {
  await apiRequest(`/calls/${encodeURIComponent(session.id)}/signals`, {
    method: 'POST', body: JSON.stringify({ type, payload }),
  });
}

function makePeerConnection(session, remoteVideoSelector, remoteAudioSelector) {
  const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  session.peer = peer;
  session.pendingCandidates = [];
  session.lastSignalId = 0;
  peer.ontrack = (event) => {
    const stream = event.streams[0] || (session.remoteStream ||= new MediaStream());
    if (!event.streams[0] && !stream.getTracks().includes(event.track)) stream.addTrack(event.track);
    session.remoteStream = stream;
    const video = document.querySelector(remoteVideoSelector);
    const audio = document.querySelector(remoteAudioSelector);
    if (video) { video.srcObject = stream; video.hidden = session.mediaType !== 'video'; }
    if (audio) audio.srcObject = stream;
  };
  peer.onicecandidate = async (event) => {
    if (!event.candidate || !session.signalReady) {
      if (event.candidate) session.pendingCandidates.push(event.candidate);
      return;
    }
    try { await postCallSignal(session, 'ice-candidate', { candidate: event.candidate }); }
    catch (error) { setCallStatus(session, error.message, true); }
  };
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === 'connected') setCallStatus(session, 'Call connected.');
    if (['failed', 'disconnected'].includes(peer.connectionState)) setCallStatus(session, 'Connection interrupted. Check your network and try again.', true);
  };
  session.pollBusy = false;
  return peer;
}

function setCallStatus(session, message, isError = false) {
  const selector = session.role === 'customer' ? '#customer-call-feedback' : '#agent-call-type';
  const target = document.querySelector(selector);
  if (target) setFeedback(target, message, isError);
}

async function pollCallSignals(session) {
  if (!session || session.pollBusy) return;
  session.pollBusy = true;
  try {
    const data = await apiRequest(`/calls/${encodeURIComponent(session.id)}/signals?afterId=${session.lastSignalId}`);
    if (data.call?.status === 'ended') {
      setCallStatus(session, 'Call ended.');
      if (session.role === 'customer') cleanupCustomerCall(); else cleanupAgentCall();
      return;
    }
    if (session.role === 'customer' && data.call?.status === 'active' && !session.offerSent) {
      session.signalReady = true;
      session.offerSent = true;
      await postCallSignal(session, 'offer', { sdp: session.peer.localDescription });
      for (const candidate of session.pendingCandidates.splice(0)) await postCallSignal(session, 'ice-candidate', { candidate });
      setCallStatus(session, `Connecting your ${session.mediaType} call…`);
    }
    for (const signal of data.signals || []) {
      session.lastSignalId = Math.max(session.lastSignalId, Number(signal.id) || 0);
      const payload = signal.payload || {};
      if (signal.signal_type === 'offer' && session.role === 'agent') {
        await session.peer.setRemoteDescription(payload.sdp);
        const answer = await session.peer.createAnswer();
        await session.peer.setLocalDescription(answer);
        session.signalReady = true;
        await postCallSignal(session, 'answer', { sdp: session.peer.localDescription });
        for (const candidate of session.pendingCandidates.splice(0)) await postCallSignal(session, 'ice-candidate', { candidate });
        setCallStatus(session, 'Call connected.');
      } else if (signal.signal_type === 'answer' && session.role === 'customer' && !session.peer.remoteDescription) {
        await session.peer.setRemoteDescription(payload.sdp);
        setCallStatus(session, 'Call connected.');
      } else if (signal.signal_type === 'ice-candidate' && payload.candidate) {
        if (session.peer.remoteDescription) await session.peer.addIceCandidate(payload.candidate);
        else (session.remoteCandidates ||= []).push(payload.candidate);
      }
    }
    if (session.peer.remoteDescription && session.remoteCandidates?.length) {
      for (const candidate of session.remoteCandidates.splice(0)) await session.peer.addIceCandidate(candidate);
    }
  } catch (error) {
    if (error.call?.status === 'ended') {
      setCallStatus(session, 'Call ended.');
      if (session.role === 'customer') cleanupCustomerCall(); else cleanupAgentCall();
      return;
    }
    setCallStatus(session, error.message, true);
  } finally { session.pollBusy = false; }
}

async function startCustomerCall(mediaType) {
  if (customerCallSession) return;
  const feedback = document.querySelector('#customer-call-feedback');
  if (!navigator.mediaDevices?.getUserMedia) { setFeedback(feedback, 'Audio and video calls require a secure browser connection.', true); return; }
  let stream;
  try {
    setFeedback(feedback, `Preparing ${mediaType} call…`);
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mediaType === 'video' });
    const localVideo = document.querySelector('#customer-local-video');
    if (localVideo) { localVideo.srcObject = stream; localVideo.hidden = mediaType !== 'video'; }
    const data = await apiRequest('/calls', { method: 'POST', body: JSON.stringify({ mediaType }) });
    const session = customerCallSession = { ...data.call, role: 'customer', mediaType, stream, signalReady: false, offerSent: false };
    const peer = makePeerConnection(session, '#customer-remote-video', '#customer-remote-audio');
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const endButton = document.querySelector('#customer-end-call');
    if (endButton) endButton.hidden = false;
    setFeedback(feedback, `Waiting for the ClariCare team to answer your ${mediaType} call…`);
    session.pollTimer = setInterval(() => pollCallSignals(session), 900);
    await pollCallSignals(session);
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    if (customerCallSession) cleanupCustomerCall();
    setFeedback(feedback, error.name === 'NotAllowedError' ? 'Allow microphone or camera access to make a call.' : error.message, true);
    if (error.call?.id && feedback) {
      const resolve = document.createElement('button'); resolve.className = 'button button-outline button-small'; resolve.type = 'button'; resolve.textContent = 'End earlier call and try again';
      resolve.addEventListener('click', async () => { resolve.disabled = true; try { await apiRequest(`/calls/${encodeURIComponent(error.call.id)}/end`, { method: 'POST', body: '{}' }); await startCustomerCall(mediaType); } catch (retryError) { setFeedback(feedback, retryError.message, true); } });
      feedback.append(resolve);
    }
  }
}

function cleanupCustomerCall() {
  if (!customerCallSession) return;
  releaseCallMedia(customerCallSession);
  customerCallSession = null;
  const video = document.querySelector('#customer-remote-video');
  const localVideo = document.querySelector('#customer-local-video');
  const audio = document.querySelector('#customer-remote-audio');
  if (video) { video.srcObject = null; video.hidden = true; }
  if (localVideo) { localVideo.srcObject = null; localVideo.hidden = true; }
  if (audio) audio.srcObject = null;
  const endButton = document.querySelector('#customer-end-call');
  if (endButton) endButton.hidden = true;
}

async function endCustomerCall(notify = true) {
  if (!customerCallSession) return;
  const session = customerCallSession;
  cleanupCustomerCall();
  try { if (notify) await apiRequest(`/calls/${encodeURIComponent(session.id)}/end`, { method: 'POST', body: '{}' }); }
  catch (error) { setCallStatus(session, error.message, true); }
}

async function selectAgentConversation(conversation) {
  agentConversation = conversation;
  const panel = document.querySelector('#agent-live-chat');
  panel.hidden = false;
  document.querySelector('#agent-conversation-title').textContent = `${conversation.name || 'Customer'} · ${conversation.subject || 'Support chat'}`;
  const replyForm = document.querySelector('#agent-message-form');
  const reply = replyForm.elements.message;
  const adminCanManage = currentUser?.role === 'admin';
  const deleted = Boolean(conversation.deleted_at);
  replyForm.hidden = deleted;
  reply.disabled = deleted;
  replyForm.querySelector('button').disabled = deleted;
  try {
    const data = await apiRequest(`/admin/contact/conversations/${encodeURIComponent(conversation.id)}`);
    const messages = document.querySelector('#agent-messages');
    messages.replaceChildren();
    const thread = data.conversation?.messages || [];
    thread.forEach((message) => {
      const row = document.createElement('div');
      row.className = `agent-message-row${message.sender_type === 'admin' ? ' own' : ''}${message.deleted_at ? ' deleted-message' : ''}`;
      appendMessage(row, message, message.sender_type === 'admin');
      if (adminCanManage) {
        const action = document.createElement('button');
        action.className = 'text-button';
        action.type = 'button';
        action.dataset.messageId = message.id;
        action.dataset.messageAction = message.deleted_at ? 'restore' : 'delete';
        action.textContent = message.deleted_at ? 'Restore message' : 'Delete message';
        row.append(action);
      }
      messages.append(row);
    });
    panel.dataset.deleted = String(deleted);
    const heading = panel.querySelector('.chat-header');
    let management = heading.querySelector('.admin-chat-management');
    if (adminCanManage) {
      if (!management) { management = document.createElement('button'); management.className = 'button button-outline button-small admin-chat-management'; heading.append(management); }
      management.type = 'button';
      management.dataset.conversationAction = deleted ? 'restore' : 'delete';
      management.dataset.conversationId = conversation.id;
      management.textContent = deleted ? 'Restore chat' : 'Delete chat';
    } else management?.remove();
    clearInterval(agentConversationPoll);
    agentConversationPoll = setInterval(async () => {
      if (agentConversation?.id === conversation.id && !agentConversation.deleted_at) selectAgentConversation(agentConversation);
    }, 4500);
  } catch (error) {
    setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
  }
}

async function sendAgentMessage(event) {
  event.preventDefault();
  if (!agentConversation || agentConversation.deleted_at) return;
  const input = document.querySelector('#agent-message');
  const text = input.value.trim();
  if (!text) return;
  try {
    await apiRequest(`/admin/contact/conversations/${encodeURIComponent(agentConversation.id)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
    input.value = '';
  } catch (error) {
    setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
    // The current backend saves a reply before attempting email delivery; reload so the live chat still shows it.
  }
  await selectAgentConversation(agentConversation);
}

async function startAgentCall(call) {
  stopCallRingtone();
  if (agentCallSession) return;
  const mediaType = call.mediaType || call.media_type || 'audio';
  setContactCenterPage(mediaType);
  document.querySelector('#agent-call-customer').textContent = `${call.customer_name || 'Customer'} · incoming ${mediaType} call`;
  document.querySelector('#agent-call-eyebrow').textContent = mediaType === 'video' ? 'LIVE VIDEO CALL' : 'LIVE AUDIO CALL';
  if (!navigator.mediaDevices?.getUserMedia) { setFeedback(document.querySelector('#inbox-feedback'), 'Audio and video calls require a secure browser connection.', true); return; }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mediaType === 'video' });
    const localVideo = document.querySelector('#agent-local-video');
    if (localVideo) { localVideo.srcObject = stream; localVideo.hidden = mediaType !== 'video'; }
    await apiRequest(`/calls/${encodeURIComponent(call.id)}/accept`, { method: 'POST', body: JSON.stringify({}) });
    answeredCallIds.add(String(call.id));
    waitingCallIds.delete(String(call.id));
    if (!waitingCallIds.size) stopCallRingtone();
    const session = agentCallSession = { id: call.id, role: 'agent', mediaType, stream, signalReady: true };
    const pc = makePeerConnection(session, '#agent-remote-video', '#agent-remote-audio');
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    document.querySelector('#agent-call-controls').hidden = false;
    document.querySelector('#agent-remote-video').hidden = mediaType !== 'video';
    setCallStatus(session, `Answering ${mediaType} call…`);
    session.pollTimer = setInterval(() => pollCallSignals(session), 900);
    await pollCallSignals(session);
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    if (agentCallSession) cleanupAgentCall();
    setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
  }
}

function cleanupAgentCall() {
  if (!agentCallSession) return;
  releaseCallMedia(agentCallSession);
  agentCallSession = null;
  const video = document.querySelector('#agent-remote-video');
  const localVideo = document.querySelector('#agent-local-video');
  const audio = document.querySelector('#agent-remote-audio');
  if (video) { video.srcObject = null; video.hidden = true; }
  if (localVideo) { localVideo.srcObject = null; localVideo.hidden = true; }
  if (audio) audio.srcObject = null;
  const controls = document.querySelector('#agent-call-controls');
  if (controls) controls.hidden = true;
}

async function endAgentCall(notify = true) {
  if (!agentCallSession) return;
  const session = agentCallSession;
  cleanupAgentCall();
  try { if (notify) await apiRequest(`/calls/${encodeURIComponent(session.id)}/end`, { method: 'POST', body: '{}' }); }
  catch (error) { setCallStatus(session, error.message, true); }
}

function releaseCallMedia(session) {
  clearInterval(session.pollTimer);
  const peer = session.peer;
  if (peer) {
    peer.ontrack = null;
    peer.onicecandidate = null;
    peer.onconnectionstatechange = null;
    peer.getSenders().forEach((sender) => sender.track?.stop());
    peer.close();
  }
  session.stream?.getTracks().forEach((track) => track.stop());
  session.remoteStream?.getTracks().forEach((track) => track.stop());
}

async function calculateCosting(event) {
  event.preventDefault();
  const values = formData(event.currentTarget);
  const batchCost = Number(values.ingredientCost) + Number(values.otherCost || 0);
  const yieldCount = Number(values.yield);
  const markup = Number(values.markupPercent);
  const feedback = document.querySelector('#costing-feedback');
  const result = document.querySelector('#costing-result');
  result.replaceChildren();
  if (!(yieldCount > 0) || batchCost < 0 || markup < 0) {
    setFeedback(feedback, 'Enter a positive batch yield and non-negative costs and markup.', true);
    return;
  }
  const unitCost = batchCost / yieldCount;
  const suggestedPrice = unitCost * (1 + markup / 100);
  const title = document.createElement('strong');
  title.textContent = `Estimated selling price per unit: ${money(suggestedPrice)}`;
  const detail = document.createElement('span');
  detail.textContent = `Estimated unit cost ${money(unitCost)} · total batch cost ${money(batchCost)}. Amounts use the same currency as your inputs.`;
  result.append(title, detail);
  setFeedback(feedback, 'Calculated locally only; this estimate is not saved to the backend.');
}

async function loadAccounting() {
  await Promise.all([loadProducts(), loadSales()]);
}

async function recordCustomerMessage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const channel = values.channel;
  const message = channel === 'callback'
    ? `[Callback requested] ${values.message.trim()}\nPhone: ${values.phone.trim()}`
    : values.message.trim();
  await submitForm(
    form,
    '/contact',
    document.querySelector('#contact-feedback'),
    () => channel === 'callback' ? 'Callback request recorded for the ClariCare team.' : 'Message recorded for the ClariCare team.',
    () => form.reset(),
    () => ({ name: values.name.trim(), email: values.email?.trim() || currentUser?.email || '', subject: channel === 'callback' ? 'Callback request' : 'Website message', message }),
  );
}

async function refreshInbox() {
  const feedback = document.querySelector('#inbox-feedback');
  if (!currentUser || !['employee', 'admin'].includes(String(currentUser.role).toLowerCase())) return;
  try {
    const chatData = await apiRequest('/admin/contact/conversations');
    renderAgentConversationList(chatData.conversations || []);
    if (agentConversation) {
      const selected = (chatData.conversations || []).find((item) => item.id === agentConversation.id);
      if (selected && !agentConversationPoll) await selectAgentConversation(selected);
    }
    setFeedback(feedback, 'Live conversations are up to date.');
  } catch (error) {
    setFeedback(feedback, error.message, true);
  }
}

async function refreshCallHistory() {
  if (String(currentUser?.role || '').toLowerCase() !== 'admin') return;
  try {
    const data = await apiRequest('/admin/calls');
    syncCallRingtone(data.calls || []);
  } catch (error) {
    setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
  }
}

function renderAgentConversationList(conversations) {
  inboxConversations = conversations;
  document.querySelector('#message-bin-tab').hidden = currentUser?.role !== 'admin';
  const categories = { quotation: 0, contact: 0, chat: 0 };
  conversations.filter((conversation) => !conversation.deleted_at).forEach((conversation) => { categories[getMessageCategory(conversation)] += 1; });
  Object.entries(categories).forEach(([category, count]) => {
    const badge = document.querySelector(`#message-category-count-${category}`);
    if (badge) badge.textContent = count;
  });
  const binCount = document.querySelector('#message-category-count-bin');
  if (binCount) binCount.textContent = String(messageBinEntries.length);
  const list = document.querySelector('#conversation-list');
  list.replaceChildren();
  if (activeMessageCategory === 'bin') {
    renderMessageBinEntries(list);
    return;
  }
  const visible = conversations.filter((conversation) => !conversation.deleted_at && getMessageCategory(conversation) === activeMessageCategory);
  if (agentConversation) document.querySelector('#agent-live-chat').hidden = getMessageCategory(agentConversation) !== activeMessageCategory;
  if (!visible.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    empty.textContent = activeMessageCategory === 'quotation' ? 'No quotation requests yet.' : activeMessageCategory === 'contact' ? 'No Contact us messages yet.' : 'No live customer chats yet.';
    list.append(empty);
    return;
  }
  visible.forEach((conversation) => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `inbox-item${agentConversation?.id === conversation.id ? ' selected' : ''}`;
    button.innerHTML = '';
    const title = document.createElement('strong'); title.textContent = conversation.name || 'Customer';
    const preview = document.createElement('small'); preview.textContent = conversation.last_message || conversation.subject || 'New conversation';
    const category = document.createElement('span'); category.className = 'message-category-tag'; category.textContent = conversation.deleted_at ? 'Deleted' : getMessageCategoryLabel(conversation);
    button.append(title, preview, category); button.addEventListener('click', () => selectAgentConversation(conversation)); list.append(button);
  });
}

function getMessageCategory(conversation) {
  const subject = String(conversation.subject || '').toLowerCase();
  if (/quotation|quote/.test(subject)) return 'quotation';
  if (/website message|contact request|callback/.test(subject)) return 'contact';
  return 'chat';
}

function getMessageCategoryLabel(conversation) {
  const category = getMessageCategory(conversation);
  return category === 'quotation' ? 'Quotation' : category === 'contact' ? 'Contact us' : 'Live chat';
}

function setMessageCategory(category) {
  if (!['quotation', 'contact', 'chat', 'bin'].includes(category) || (category === 'bin' && currentUser?.role !== 'admin')) return;
  activeMessageCategory = category;
  document.querySelector('#agent-live-chat').hidden = true;
  document.querySelectorAll('[data-message-category]').forEach((button) => {
    if (button.dataset.messageCategory === category) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (category === 'bin') loadMessageBin();
  else renderAgentConversationList(inboxConversations);
}

async function loadMessageBin() {
  const list = document.querySelector('#conversation-list');
  const feedback = document.querySelector('#inbox-feedback');
  list.replaceChildren();
  const loading = document.createElement('div'); loading.className = 'empty-state'; loading.textContent = 'Loading deleted messages…'; list.append(loading);
  try {
    const { conversations = [] } = await apiRequest('/admin/contact/conversations');
    const details = await Promise.all(conversations.map(async (conversation) => {
      try {
        const data = await apiRequest(`/admin/contact/conversations/${encodeURIComponent(conversation.id)}`);
        return { conversation, messages: data.conversation?.messages || [] };
      } catch { return { conversation, messages: [] }; }
    }));
    messageBinEntries = [];
    details.forEach(({ conversation, messages }) => {
      if (conversation.deleted_at) messageBinEntries.push({ type: 'conversation', conversation, message: null });
      messages.filter((message) => message.deleted_at).forEach((message) => messageBinEntries.push({ type: 'message', conversation, message }));
    });
    messageBinEntries.sort((a, b) => String(b.message?.created_at || b.conversation.deleted_at || '').localeCompare(String(a.message?.created_at || a.conversation.deleted_at || '')));
    renderAgentConversationList(inboxConversations);
    setFeedback(feedback, `${messageBinEntries.length} deleted ${messageBinEntries.length === 1 ? 'item' : 'items'} in the message bin.`);
  } catch (error) {
    messageBinEntries = [];
    renderAgentConversationList(inboxConversations);
    setFeedback(feedback, error.message, true);
  }
}

function renderMessageBinEntries(list = document.querySelector('#conversation-list')) {
  list.replaceChildren();
  const count = document.querySelector('#message-category-count-bin');
  if (count) count.textContent = String(messageBinEntries.length);
  if (!messageBinEntries.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'The message bin is empty. Deleted chats and deleted messages will appear here.'; list.append(empty); return;
  }
  messageBinEntries.forEach((entry) => {
    const conversation = entry.conversation;
    const card = document.createElement('article'); card.className = 'message-bin-entry';
    const button = document.createElement('button'); button.type = 'button'; button.className = `inbox-item message-bin-item${agentConversation?.id === conversation.id ? ' selected' : ''}`;
    const title = document.createElement('strong'); title.textContent = conversation.name || 'Customer';
    const preview = document.createElement('small'); preview.textContent = entry.type === 'conversation'
      ? `Deleted chat · ${conversation.subject || 'Customer message'}`
      : `Deleted message · ${entry.message.message || ''}`;
    const tag = document.createElement('span'); tag.className = 'message-category-tag'; tag.textContent = entry.type === 'conversation' ? 'Deleted chat' : 'Deleted message';
    button.append(title, preview, tag);
    button.addEventListener('click', () => selectAgentConversation(conversation));
    const permanentlyDelete = document.createElement('button');
    permanentlyDelete.type = 'button';
    permanentlyDelete.className = 'button button-danger button-small message-bin-permanent-delete';
    permanentlyDelete.textContent = 'Permanently delete';
    permanentlyDelete.setAttribute('aria-label', `Permanently delete ${entry.type === 'conversation' ? 'chat' : 'message'} from ${conversation.name || 'customer'}`);
    permanentlyDelete.addEventListener('click', async () => {
      const thing = entry.type === 'conversation' ? 'this entire conversation and all its messages' : 'this message';
      if (!window.confirm(`Permanently delete ${thing}? This cannot be undone.`)) return;
      permanentlyDelete.disabled = true;
      permanentlyDelete.textContent = 'Deleting…';
      const path = entry.type === 'conversation'
        ? `/admin/contact/conversations/${encodeURIComponent(conversation.id)}/permanent`
        : `/admin/contact/messages/${encodeURIComponent(entry.message.id)}/permanent`;
      try {
        await apiRequest(path, { method: 'DELETE' });
        if (agentConversation?.id === conversation.id) {
          clearInterval(agentConversationPoll);
          agentConversationPoll = null;
          agentConversation = null;
          document.querySelector('#agent-live-chat').hidden = true;
        }
        await refreshInbox();
        await loadMessageBin();
        setFeedback(document.querySelector('#inbox-feedback'), 'Permanently deleted.');
      } catch (error) {
        setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
        permanentlyDelete.disabled = false;
        permanentlyDelete.textContent = 'Permanently delete';
      }
    });
    card.append(button, permanentlyDelete);
    list.append(card);
  });
}

function renderCallQueue(calls) {
  const waitingCalls = calls.filter((call) => (call.status || 'waiting') === 'waiting');
  const historyCalls = calls.filter((call) => call.status && call.status !== 'waiting');
  renderCallQueueForType(waitingCalls, 'audio', '#call-queue-list');
  renderCallQueueForType(waitingCalls, 'video', '#video-call-queue-list');
  renderCallHistoryForType(historyCalls, 'audio', '#audio-call-history-list');
  renderCallHistoryForType(historyCalls, 'video', '#video-call-history-list');
}

function stopCallRingtone() {
  clearInterval(callRingtoneTimer);
  callRingtoneTimer = null;
}

function playCallRingtoneBurst() {
  if (!callRingtoneContext || callRingtoneContext.state !== 'running' || waitingCallIds.size === 0) return;
  const now = callRingtoneContext.currentTime;
  [0, 0.24].forEach((offset) => {
    const oscillator = callRingtoneContext.createOscillator();
    const gain = callRingtoneContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = offset ? 880 : 660;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.19);
    oscillator.connect(gain);
    gain.connect(callRingtoneContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.2);
  });
}

function syncCallRingtone(calls) {
  const waitingCalls = calls.filter((call) => !call.status || call.status === 'waiting');
  const nextIds = new Set(waitingCalls.map((call) => String(call.id)));
  for (const id of answeredCallIds) if (!nextIds.has(id)) answeredCallIds.delete(id);
  waitingCallIds = new Set([...nextIds].filter((id) => !answeredCallIds.has(id)));
  renderCallQueue(calls);
  if (waitingCallIds.size) {
    if (!callRingtoneTimer) {
      playCallRingtoneBurst();
      callRingtoneTimer = setInterval(playCallRingtoneBurst, 1800);
    }
  } else stopCallRingtone();
}

function unlockCallAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!callRingtoneContext) callRingtoneContext = new AudioContextClass();
  if (callRingtoneContext.state === 'suspended') callRingtoneContext.resume().then(() => {
    if (waitingCallIds.size && !callRingtoneTimer) {
      playCallRingtoneBurst();
      callRingtoneTimer = setInterval(playCallRingtoneBurst, 1800);
    }
  }).catch(() => {});
}

document.addEventListener('pointerdown', unlockCallAudio, { passive: true });
document.addEventListener('keydown', unlockCallAudio);

function stopCallEvents() {
  callEventsController?.abort();
  callEventsController = null;
  waitingCallIds.clear();
  answeredCallIds.clear();
  stopCallRingtone();
}

async function startCallEvents() {
  stopCallEvents();
  const controller = callEventsController = new AbortController();
  while (!controller.signal.aborted && String(currentUser?.role || '').toLowerCase() === 'employee') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    try {
      const response = await fetch(`${apiBase()}/calls/events`, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' } : { Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Call feed unavailable (${response.status})`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const lines = block.split('\n');
          if (!lines.some((line) => line === 'event: waiting-calls')) continue;
          const payload = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
          try {
            const data = JSON.parse(payload);
            syncCallRingtone(Array.isArray(data) ? data : (data.calls || data.waitingCalls || data.waiting_calls || []));
          } catch { /* Ignore malformed events and keep the feed open. */ }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) break;
    }
    if (!controller.signal.aborted) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

function renderCallQueueForType(calls, mediaType, selector) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.replaceChildren();
  const visible = calls.filter((call) => (call.mediaType || call.media_type || 'audio') === mediaType);
  const count = document.querySelector(mediaType === 'video' ? '#video-incoming-count' : '#audio-incoming-count');
  if (count) count.textContent = `${visible.length} waiting`;
  if (!visible.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = `No incoming ${mediaType} calls.`; list.append(empty); return; }
  visible.forEach((call) => {
    const callMediaType = call.mediaType || call.media_type || 'audio';
    const card = document.createElement('article'); card.className = `call-queue-card incoming-call-card ringing ${callMediaType === 'video' ? 'video-call-card' : ''}`;
    const title = document.createElement('strong'); title.textContent = call.customer_name || 'Customer';
    const customerId = document.createElement('small'); customerId.textContent = `Customer ID: ${call.customer_id || 'Unavailable'}`;
    const detail = document.createElement('small'); detail.textContent = `${callMediaType === 'video' ? 'Video' : 'Audio'} call · ${formatEATDateTime(call.requested_at) || 'Calling now'}`;
    const identity = document.createElement('div'); identity.className = 'incoming-call-identity'; identity.append(title, customerId, detail); card.append(identity);
    const actions = document.createElement('div'); actions.className = 'incoming-call-actions';
    const answer = document.createElement('button'); answer.className = 'button button-primary button-small'; answer.type = 'button'; answer.textContent = `Accept ${callMediaType}`; answer.addEventListener('click', () => startAgentCall(call)); actions.append(answer);
    if (String(currentUser?.role || '').toLowerCase() === 'admin') {
      const decline = document.createElement('button'); decline.className = 'button button-outline button-small'; decline.type = 'button'; decline.textContent = 'Decline';
      decline.addEventListener('click', () => declineIncomingCall(call, decline));
      actions.append(decline);
    }
    card.append(actions);
    list.append(card);
  });
}

function renderCallHistoryForType(calls, mediaType, selector) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.replaceChildren();
  const visible = calls.filter((call) => (call.mediaType || call.media_type || 'audio') === mediaType);
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = String(currentUser?.role || '').toLowerCase() === 'admin'
      ? `No ${mediaType} call history.`
      : 'Call history is available to admins only.';
    list.append(empty);
    return;
  }
  visible.forEach((call) => {
    const row = document.createElement('article');
    row.className = 'call-history-row';
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = call.customer_name || 'Customer';
    const customerId = document.createElement('small');
    customerId.textContent = `Customer ID: ${call.customer_id || 'Unavailable'}`;
    identity.append(name, customerId);
    const meta = document.createElement('div');
    meta.className = 'call-history-meta';
    const status = document.createElement('span');
    status.className = `call-history-status status-${String(call.status || 'unknown').toLowerCase()}`;
    status.textContent = call.status || 'Unknown';
    const date = document.createElement('small');
    const timestamp = call.ended_at || call.accepted_at || call.requested_at;
    date.textContent = timestamp && Number.isFinite(Date.parse(timestamp)) ? formatEATDateTime(timestamp) : '';
    meta.append(status, date);
    row.append(identity, meta);
    list.append(row);
  });
}

async function declineIncomingCall(call, button) {
  button.disabled = true;
  try {
    await apiRequest(`/calls/${encodeURIComponent(call.id)}/end`, { method: 'POST', body: '{}' });
    answeredCallIds.add(String(call.id));
    setFeedback(document.querySelector('#inbox-feedback'), 'Incoming call declined.');
    await refreshCallHistory();
  } catch (error) {
    setFeedback(document.querySelector('#inbox-feedback'), error.message, true);
    button.disabled = false;
  }
}

function setContactCenterPage(page) {
  const selected = ['messages', 'audio', 'video'].includes(page) ? page : 'messages';
  document.querySelectorAll('[data-contact-page]').forEach((button) => {
    const active = button.dataset.contactPage === selected;
    button.toggleAttribute('aria-current', active);
    if (active) button.setAttribute('aria-current', 'page');
  });
  document.querySelector('#contact-messages-page').hidden = selected !== 'messages';
  document.querySelector('#contact-audio-page').hidden = selected !== 'audio';
  document.querySelector('#contact-video-page').hidden = selected !== 'video';
}

async function loadInbox() {
  clearInterval(inboxPoll);
  clearInterval(callQueuePoll);
  stopCallEvents();
  await refreshInbox();
  if (String(currentUser?.role || '').toLowerCase() === 'admin') {
    await refreshCallHistory();
    callQueuePoll = setInterval(refreshCallHistory, 2500);
  }
  inboxPoll = setInterval(refreshInbox, 7000);
  if (String(currentUser?.role || '').toLowerCase() === 'employee') startCallEvents();
}

document.querySelector('#agent-message-form').addEventListener('submit', sendAgentMessage);
document.querySelector('#agent-end-call').addEventListener('click', () => endAgentCall(true));
document.querySelector('#view-contact-center').addEventListener('click', async (event) => {
  const categoryButton = event.target.closest('[data-message-category]');
  if (categoryButton) { setMessageCategory(categoryButton.dataset.messageCategory); return; }
  const pageButton = event.target.closest('[data-contact-page]');
  if (pageButton) { setContactCenterPage(pageButton.dataset.contactPage); return; }
  const messageAction = event.target.closest('[data-message-action]');
  const conversationAction = event.target.closest('[data-conversation-action]');
  try {
    if (messageAction) {
      const verb = messageAction.dataset.messageAction;
      await apiRequest(`/admin/contact/messages/${encodeURIComponent(messageAction.dataset.messageId)}${verb === 'restore' ? '/restore' : ''}`, { method: verb === 'restore' ? 'POST' : 'DELETE', body: verb === 'restore' ? '{}' : undefined });
      if (agentConversation) await selectAgentConversation(agentConversation);
      await refreshInbox();
      if (activeMessageCategory === 'bin') await loadMessageBin();
      return;
    }
    if (conversationAction) {
      const verb = conversationAction.dataset.conversationAction;
      const id = conversationAction.dataset.conversationId;
      await apiRequest(`/admin/contact/conversations/${encodeURIComponent(id)}${verb === 'restore' ? '/restore' : ''}`, { method: verb === 'restore' ? 'POST' : 'DELETE', body: verb === 'restore' ? '{}' : undefined });
      if (verb === 'delete') { clearInterval(agentConversationPoll); agentConversationPoll = null; agentConversation = { ...agentConversation, deleted_at: new Date().toISOString() }; }
      else agentConversation = { ...agentConversation, deleted_at: null };
      await refreshInbox();
      if (agentConversation) await selectAgentConversation(agentConversation);
      if (activeMessageCategory === 'bin') await loadMessageBin();
    }
  } catch (error) { setFeedback(document.querySelector('#inbox-feedback'), error.message, true); }
});

async function recordReferral(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#referral-feedback');
  const result = document.querySelector('#referral-result');
  result.replaceChildren();
  await submitForm(
    form,
    '/referrals',
    feedback,
    (data) => {
      const referral = data.referral;
      const title = document.createElement('strong');
      title.textContent = `Commission: ${money(referral.commissionAmount)}`;
      const detail = document.createElement('span');
      detail.textContent = `${referral.commissionRate}% of ${money(referral.sale_amount || values.saleAmount)} · status: ${referral.status}`;
      result.append(title, detail);
      return 'Referral sale recorded. The backend does not validate referral timing or payment.';
    },
    () => form.reset(),
    () => {
      const referredAt = values.referredAt
        ? parseEATDateTimeLocal(values.referredAt)
        : undefined;
      return {
        referrerId: values.referrerId.trim() || undefined,
        customerId: values.customerId.trim() || undefined,
        customerName: values.customerName.trim(),
        saleAmount: Number(values.saleAmount),
        referredAt,
        note: values.note.trim(),
      };
    },
  );
}

async function recordIngredientPurchase(event) {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(
    form,
    '/accounting/ingredients/purchases',
    document.querySelector('#ingredient-feedback'),
    (data) => `Ingredient purchase saved. Total: ${money(data.purchase.totalCost)} (recorded currency unspecified).`,
    () => form.reset(),
    (values) => ({
      name: values.name.trim(),
      unit: values.unit,
      quantity: Number(values.quantity),
      unitCost: Number(values.totalCost) / Number(values.quantity),
      supplier: values.supplier.trim(),
    }),
  );
}

async function recordSale(event) {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(
    form,
    '/accounting/sales',
    document.querySelector('#manual-sale-feedback'),
    (data) => `Sale recorded. Total: ${money(data.sale.totalAmount)} · cost: ${money(data.sale.totalCost)} (currency unspecified).`,
    async () => {
      form.reset();
      form.elements.quantity.value = '1';
      await loadSales();
    },
    (values) => ({
      customerId: values.customerId.trim() || undefined,
      customerName: values.customerName.trim(),
      paymentMethod: values.paymentMethod.trim(),
      items: [{
        productId: values.productId,
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice),
        costPrice: Number(values.costPrice),
      }],
    }),
  );
}

document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
  item.addEventListener('click', () => setView(item.dataset.view));
});
document.querySelectorAll('.people-page-link[data-people-page]').forEach((item) => {
  item.addEventListener('click', () => setPeoplePage(item.dataset.peoplePage));
});
document.querySelector('#refresh-dashboard').addEventListener('click', loadRoleDashboard);
document.querySelector('#refresh-account-users').addEventListener('click', loadAdminUsers);
document.querySelectorAll('[data-go]').forEach((item) => {
  item.addEventListener('click', () => openWorkspace(item.dataset.go));
});
document.querySelectorAll('[data-open-workspace]').forEach((item) => {
  item.addEventListener('click', () => openWorkspace(item.dataset.openWorkspace));
});
document.querySelectorAll('[data-return-site]').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#workspace').hidden = true;
    document.querySelector('#site-header').hidden = false;
    document.querySelector('#public-site').hidden = false;
    setPublicPage(activePublicPage, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

function openWorkspace(view = 'dashboard') {
  moveCustomerAuthToWorkspace();
  document.querySelector('#site-header').hidden = true;
  document.querySelector('#public-site').hidden = true;
  document.querySelector('#workspace').hidden = false;
  setView(view);
  checkHealth();
}

document.querySelector('#department-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector('#people-feedback');
  const result = document.querySelector('#department-result');
  result.textContent = '';
  await submitForm(form, '/company/departments', feedback, (data) => {
    const department = data.department;
    result.textContent = `Created ${department.name}. Department ID: ${department.id}`;
    form.reset();
    return `Department “${department.name}” created and added to the company structure.`;
  }, async () => {
    await Promise.all([loadCompanyStructure(), loadAdminUsers()]);
  });
});

document.querySelector('#position-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  submitForm(form, '/recruitment/positions', document.querySelector('#people-feedback'),
    (data) => `Position “${data.position.title}” created successfully${data.position.is_hiring ? ' and published as an open job' : ' as an internal role'}.`,
    async () => {
      form.reset();
      await Promise.all([loadCompanyStructure(), loadAdminUsers()]);
    },
    (values) => ({ ...values, isHiring: form.elements.isHiring.checked }));
});
document.querySelector('#refresh-applications').addEventListener('click', loadRecruitmentApplications);

document.querySelector('#agreement-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  submitForm(form, '/agreements', document.querySelector('#agreement-feedback'),
    (data) => `Agreement created. ID: ${data.agreement.id}`,
    (data) => {
      document.querySelector('#agreement-lookup-id').value = data.agreement.id;
      showAgreement(data.agreement);
      form.reset();
      syncAgreementTemplateFields();
      if (currentUser) document.querySelector('#agreement-employee-id').value = currentUser.id;
    },
    (values) => ({
      employeeId: values.employeeId.trim(),
      type: values.type.trim(),
      title: values.title.trim(),
      ...(values.templateKey ? { templateKey: values.templateKey } : { content: values.content.trim() }),
    }));
});

const agreementTemplateSelect = document.querySelector('#agreement-template');
function syncAgreementTemplateFields() {
  const template = agreementTemplateSelect.value;
  const type = document.querySelector('#agreement-form [name="type"]');
  const title = document.querySelector('#agreement-form [name="title"]');
  const content = document.querySelector('#agreement-form [name="content"]');
  const employeeTemplate = template === 'employee-team-participation';
  type.value = employeeTemplate ? 'employee-team-participation' : '';
  type.readOnly = employeeTemplate;
  title.value = employeeTemplate ? 'Team Participation, Conditional Equity and Contribution Agreement' : '';
  title.readOnly = employeeTemplate;
  content.disabled = employeeTemplate;
  content.required = !employeeTemplate;
  content.placeholder = employeeTemplate ? 'The employee agreement template will be assigned by the backend.' : 'Enter the agreement text';
}
agreementTemplateSelect.addEventListener('change', syncAgreementTemplateFields);
syncAgreementTemplateFields();

document.querySelector('#agreement-lookup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.querySelector('#agreement-feedback');
  const id = encodeURIComponent(document.querySelector('#agreement-lookup-id').value.trim());
  setFeedback(feedback, '');
  try {
    const data = await apiRequest(`/agreements/${id}`);
    showAgreement(data.agreement);
    setFeedback(feedback, 'Agreement found.');
  } catch (error) {
    document.querySelector('#agreement-result').replaceChildren();
    setFeedback(feedback, error.message, true);
  }
});

let productPreviewObjectUrl = '';
function showProductImagePreview(source) {
  const wrapper = document.querySelector('#product-image-preview-wrap');
  const image = document.querySelector('#product-image-preview');
  if (productPreviewObjectUrl) URL.revokeObjectURL(productPreviewObjectUrl);
  productPreviewObjectUrl = '';
  if (!source) {
    image.removeAttribute('src');
    wrapper.hidden = true;
    return;
  }
  image.src = source;
  wrapper.hidden = false;
}

function selectedProductFile() {
  return document.querySelector('#product-image-file').files?.[0] || null;
}

function refreshProductImagePreview() {
  const file = selectedProductFile();
  if (file) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showProductImagePreview('');
      setFeedback(document.querySelector('#products-feedback'), 'Choose a PNG, JPEG, or WebP image.', true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showProductImagePreview('');
      setFeedback(document.querySelector('#products-feedback'), 'Product images must be 5 MB or smaller.', true);
      return;
    }
    if (productPreviewObjectUrl) URL.revokeObjectURL(productPreviewObjectUrl);
    productPreviewObjectUrl = URL.createObjectURL(file);
    document.querySelector('#product-image-preview').src = productPreviewObjectUrl;
    document.querySelector('#product-image-preview-wrap').hidden = false;
    return;
  }
  showProductImagePreview(safeExternalUrl(document.querySelector('#product-image-url').value.trim()));
}

function readImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The selected product image could not be read.'));
    reader.readAsDataURL(file);
  });
}

document.querySelector('#product-image-file').addEventListener('change', refreshProductImagePreview);
document.querySelector('#product-image-url').addEventListener('input', () => {
  if (!selectedProductFile()) refreshProductImagePreview();
});
document.querySelector('#product-image-clear').addEventListener('click', () => {
  document.querySelector('#product-image-file').value = '';
  document.querySelector('#product-image-url').value = '';
  showProductImagePreview('');
  setFeedback(document.querySelector('#products-feedback'), '');
});

document.querySelector('#product-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  submitForm(form, '/catalog/products', document.querySelector('#products-feedback'),
    (data) => `Product “${data.product.name}” added to the catalog.`,
    async () => {
      form.reset();
      showProductImagePreview('');
      await loadProducts();
      setProductsPage('catalog');
    },
    async (values) => {
      const file = values.productImageFile;
      let imageUrl = String(values.imageUrl || '').trim();
      if (file instanceof File && file.size) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
        if (file.size > 5 * 1024 * 1024) throw new Error('Product images must be 5 MB or smaller.');
        imageUrl = await readImageDataUrl(file);
      }
      return {
        name: values.name.trim(),
        category: values.category.trim(),
        brand: values.brand.trim(),
        price: Number(values.price),
        description: values.description.trim(),
        howToUse: values.howToUse.trim(),
        ingredients: values.ingredients.trim(),
        benefits: values.benefits.trim(),
        sizeOptions: values.sizeOptions.trim()
          ? values.sizeOptions.trim().split(/\r?\n/).map((line, index) => {
            const [label, optionPrice, ...extra] = line.split('|');
            if (extra.length || !label?.trim() || !optionPrice?.trim()) {
              throw new Error(`Size option line ${index + 1} must use “measurement | price”.`);
            }
            const parsedPrice = Number(optionPrice.trim());
            if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
              throw new Error(`Enter a positive price for size option line ${index + 1}.`);
            }
            return { label: label.trim(), price: parsedPrice };
          })
          : [],
        ...(imageUrl ? { imageUrl } : {}),
      };
    },
  );
});

document.querySelector('#refresh-products').addEventListener('click', () => loadProducts(document.querySelector('#products-feedback')));
document.querySelector('#sales-period').addEventListener('change', loadSales);
document.querySelector('#costing-form').addEventListener('submit', calculateCosting);
document.querySelector('#ingredient-form').addEventListener('submit', recordIngredientPurchase);
document.querySelector('#inventory-refresh').addEventListener('click', () => loadInventoryDashboard());
document.querySelector('#add-formula-material').addEventListener('click', () => addFormulaMaterialRow());
document.querySelector('#equipment-allocation-basis').addEventListener('change', (event) => {
  const perUnit = event.currentTarget.value === 'per_unit';
  document.querySelector('#equipment-allocation-quantity-label').textContent = perUnit
    ? 'Expected units produced per month'
    : 'Expected batches produced per month';
  document.querySelector('#equipment-allocation-hint').textContent = perUnit
    ? 'Enter the expected number of units this equipment supports per month.'
    : 'Enter the expected number of batches this equipment supports per month.';
});
document.querySelector('#inventory-equipment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#inventory-equipment-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    await apiRequest('/accounting/equipment', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name.trim(),
        purchasePrice: Number(values.purchasePrice),
        purchaseDate: values.purchaseDate,
        usefulLifeMonths: Number(values.usefulLifeMonths),
        residualValue: Number(values.residualValue),
        category: values.category.trim(),
        notes: values.notes.trim() || undefined,
        allocationBasis: values.allocationBasis,
        allocationQuantity: Number(values.allocationQuantity),
      }),
    });
    form.reset();
    document.querySelector('#equipment-allocation-basis').dispatchEvent(new Event('change'));
    await loadInventoryDashboard('Equipment added and depreciation refreshed.');
    setFeedback(feedback, 'Equipment added. Its depreciation is now included in formula costing.');
    await refreshSelectedInventoryCosting();
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#inventory-equipment-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-equipment-id]');
  if (!button) return;
  button.disabled = true;
  const feedback = document.querySelector('#inventory-equipment-feedback');
  setFeedback(feedback, 'Archiving equipment…');
  try {
    await apiRequest(`/accounting/equipment/${encodeURIComponent(button.dataset.equipmentId)}`, { method: 'DELETE' });
    await loadInventoryDashboard('Equipment archived and depreciation refreshed.');
    setFeedback(feedback, 'Equipment archived. Future costing will use active equipment only.');
    await refreshSelectedInventoryCosting();
  } catch (error) {
    setFeedback(feedback, error.message, true);
    button.disabled = false;
  }
});
document.querySelector('#inventory-material-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector('#inventory-material-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    await apiRequest('/accounting/materials', {
      method: 'POST',
      body: JSON.stringify({ ...formData(form), reorderLevel: Number(formData(form).reorderLevel) }),
    });
    form.reset();
    await loadInventoryDashboard('Material added.');
    setFeedback(feedback, 'Material added to inventory.');
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#inventory-purchase-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#inventory-purchase-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    const data = await apiRequest(`/accounting/materials/${encodeURIComponent(values.materialId)}/purchases`, {
      method: 'POST',
      body: JSON.stringify({ quantity: Number(values.quantity), totalCost: Number(values.totalCost), supplier: values.supplier.trim() || undefined, reference: values.reference.trim() || undefined, receiptUrl: values.receiptUrl.trim() || undefined }),
    });
    form.reset();
    await loadInventoryDashboard('Purchase recorded and stock refreshed.');
    await refreshSelectedInventoryCosting();
    setFeedback(feedback, `Purchase saved. New stock: ${inventoryQuantity(data.stock)}.`);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#inventory-formula-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const items = [...document.querySelectorAll('.formula-material-row')].map((row) => ({
    materialId: row.querySelector('[name="materialId"]').value,
    quantity: Number(row.querySelector('[name="materialQuantity"]').value),
  }));
  const feedback = document.querySelector('#inventory-formula-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    const data = await apiRequest(`/accounting/products/${encodeURIComponent(values.productId)}/formulas`, {
      method: 'POST',
      body: JSON.stringify({
        expectedYield: Number(values.expectedYield),
        labourCost: Number(values.labourCost),
        overheadCost: Number(values.overheadCost),
        items,
      }),
    });
    setFeedback(feedback, `Formula version ${data.formula.version} saved. Costing uses the latest recorded purchase price for each material.`);
    const formulaSelect = document.querySelector('#inventory-production-product');
    formulaSelect.value = values.productId;
    await loadProductionFormula(values.productId);
    document.querySelector('#inventory-costing-product').value = values.productId;
    const costing = await getProductCosting(values.productId, document.querySelector('#inventory-costing-feedback'));
    renderInventoryCosting(costing);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#inventory-costing-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const productId = document.querySelector('#inventory-costing-product').value;
  const feedback = document.querySelector('#inventory-costing-feedback');
  setFeedback(feedback, 'Loading latest formula costing…');
  document.querySelector('#inventory-costing-result').replaceChildren();
  try {
    renderInventoryCosting(await getProductCosting(productId, feedback));
  } catch {
    const hint = document.createElement('p');
    hint.className = 'muted';
    hint.textContent = 'Save a formula for this product to see its costing estimate.';
    document.querySelector('#inventory-costing-result').replaceChildren(hint);
  }
});
document.querySelector('#inventory-production-product').addEventListener('change', (event) => loadProductionFormula(event.currentTarget.value));
document.querySelector('#inventory-production-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#inventory-production-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    const data = await apiRequest('/accounting/production', {
      method: 'POST',
      body: JSON.stringify({
        productId: values.productId,
        formulaId: values.formulaId,
        producedQuantity: Number(values.producedQuantity),
        saleableQuantity: Number(values.saleableQuantity),
        notes: values.notes.trim() || undefined,
      }),
    });
    setFeedback(feedback, `Production recorded. Batch cost: ${inventoryKes(data.batch.total_cost)} · unit cost: ${inventoryKes(data.batch.unit_cost)} · finished stock: ${inventoryQuantity(data.finishedStock)}.`);
    const breakdownResult = document.querySelector('#inventory-production-result');
    breakdownResult.replaceChildren();
    renderInventoryBreakdown(
      breakdownResult,
      data.batch.cost_breakdown,
      data.batch.equipment_depreciation_details,
      {
        total: data.batch.total_cost,
        quantity: data.batch.saleable_quantity ?? values.saleableQuantity,
        unitCost: data.batch.unit_cost,
      },
    );
    form.elements.producedQuantity.value = '';
    form.elements.saleableQuantity.value = '';
    form.elements.notes.value = '';
    await loadInventoryDashboard('Production recorded and stock refreshed.');
    setFeedback(feedback, `Production recorded. Batch cost: ${inventoryKes(data.batch.total_cost)} · unit cost: ${inventoryKes(data.batch.unit_cost)} · finished stock: ${inventoryQuantity(data.finishedStock)}.`);
    const productId = values.productId;
    if (document.querySelector('#inventory-costing-product').value === productId) {
      renderInventoryCosting(await getProductCosting(productId));
    }
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#inventory-expense-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#inventory-expense-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, '');
  try {
    const data = await apiRequest('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify({ category: values.category.trim(), description: values.description.trim(), amount: Number(values.amount) }),
    });
    form.reset();
    setFeedback(feedback, `Expense saved: ${inventoryKes(data.expense.amount)} for ${data.expense.category}.`);
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally { button.disabled = false; }
});
document.querySelector('#manual-sale-form').addEventListener('submit', recordSale);
document.querySelector('#referral-form').addEventListener('submit', recordReferral);
document.querySelector('#contact-start-form').addEventListener('submit', recordCustomerMessage);
document.querySelector('#contact-quote-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#quote-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, 'Sending your quotation request…');
  try {
    await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: 'Quotation request',
        message: values.message.trim(),
      }),
    });
    form.reset();
    setFeedback(feedback, 'Your quotation request has been sent. The ClariCare team will follow up.');
  } catch (error) {
    setFeedback(feedback, error.message, true);
  } finally {
    button.disabled = false;
  }
});
document.querySelector('#instant-call-button').addEventListener('click', () => {
  const feedback = document.querySelector('#instant-call-feedback');
  const role = String(currentUser?.role || '').toLowerCase();
  if (!currentUser) {
    showCustomerAuthPage('login');
    document.querySelector('#auth-feedback').textContent = 'Create a customer account or sign in to continue to your dashboard.';
    document.querySelector('#register-form [name="name"]').focus();
    return;
  }
  if (role !== 'customer') {
    setFeedback(feedback, 'Instant calls are available from customer accounts. Sign in with a customer account to continue.', true);
    return;
  }
  openWorkspace('customer-call');
  setFeedback(document.querySelector('#customer-call-feedback'), 'Choose Audio call or Video call to connect with the ClariCare team.');
});
document.querySelector('#refresh-inbox').addEventListener('click', async () => {
  await refreshInbox();
  if (activeMessageCategory === 'bin') await loadMessageBin();
});

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(form, '/auth/login', document.querySelector('#auth-feedback'),
    (data) => {
      const role = String(data.user?.role || '').toLowerCase();
      if (role !== 'customer') {
        const destination = role === 'admin' ? 'Admin' : role === 'employee' || role === 'referrer' ? `${role[0].toUpperCase()}${role.slice(1)}` : 'Staff';
        throw new Error(`${destination} accounts must use their dedicated sign-in page. This form is for customers only.`);
      }
      return `Welcome back, ${data.user.name}.`;
    },
    async (data) => {
      saveSession(data);
      form.reset();
      history.replaceState(null, '', '/#home');
      openWorkspace('dashboard');
      await addPendingProductToCart();
    });
});

document.querySelector('#forgot-password-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(form, '/auth/forgot-password', document.querySelector('#auth-feedback'),
    () => 'If a customer account uses that email, password reset instructions will be sent.',
    () => form.reset(),
    (values) => ({ email: values.email.trim().toLowerCase() }));
});

document.querySelector('#staff-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(form, '/auth/login', document.querySelector('#staff-login-feedback'),
    (data) => {
      const actualRole = String(data.user?.role || '').toLowerCase();
      if (actualRole !== staffLoginRole) {
        const rightPage = actualRole ? `${actualRole[0].toUpperCase()}${actualRole.slice(1)}` : 'staff';
        throw new Error(`This page is for ${staffLoginRole} accounts. Use the ${rightPage} sign-in page for this account.`);
      }
      return `Welcome, ${data.user.name}.`;
    },
    (data) => {
      saveSession(data);
      form.reset();
      document.querySelector('#staff-login-page').hidden = true;
      document.querySelector('#site-header').hidden = true;
      document.querySelector('#public-site').hidden = true;
      document.querySelector('#workspace').hidden = false;
      const actualRole = String(data.user?.role || '').toLowerCase();
      const positionId = pendingApplicantPositionId || new URLSearchParams(location.search).get('positionId');
      history.replaceState(null, '', '/#home');
      setView(actualRole === 'applicant' && positionId ? 'applicant-application' : 'dashboard');
      checkHealth();
    });
});

document.querySelector('#show-applicant-register').addEventListener('click', () => {
  const form = document.querySelector('#applicant-register-form');
  const showRegistration = form.hidden;
  form.hidden = !showRegistration;
  document.querySelector('#staff-login-form').hidden = showRegistration;
  document.querySelector('#show-applicant-register').textContent = showRegistration ? 'Back to applicant sign in' : 'Create an applicant account';
  document.querySelector('#staff-login-feedback').textContent = '';
});

document.querySelector('#applicant-register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(form, '/auth/register', document.querySelector('#staff-login-feedback'),
    (data) => {
      if (data.user?.role !== 'applicant') throw new Error('Applicant account creation failed. Please contact ClariCare.');
      return `Applicant portal ready. Welcome, ${data.user.name}.`;
    },
    (data) => {
      saveSession(data);
      form.reset();
      document.querySelector('#staff-login-page').hidden = true;
      document.querySelector('#workspace').hidden = false;
      document.querySelector('#site-header').hidden = true;
      document.querySelector('#public-site').hidden = true;
      const positionId = pendingApplicantPositionId || new URLSearchParams(location.search).get('positionId');
      history.replaceState(null, '', '/#home');
      setView(positionId ? 'applicant-application' : 'dashboard');
      checkHealth();
    },
    (values) => ({ ...values, role: 'applicant' }));
});

document.querySelector('#applicant-application-type').addEventListener('change', (event) => {
  document.querySelector('#foundational-application-questions').hidden = event.currentTarget.value !== 'foundational';
});
document.querySelector('#cancel-applicant-application').addEventListener('click', () => {
  pendingApplicantPositionId = null;
  setView('dashboard');
});
document.querySelector('#applicant-application-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (currentUser?.role !== 'applicant') return;
  const form = event.currentTarget;
  const values = formData(form);
  const feedback = document.querySelector('#applicant-application-feedback');
  const button = form.querySelector('button[type="submit"]');
  const answers = {
    country: values.country,
    city: values.city,
    profileUrl: values.profileUrl,
    workArrangement: values.workArrangement,
    education: values.education,
    experienceYears: values.experienceYears,
    previousExperience: values.previousExperience,
    skills: values.skills,
    achievement: values.achievement,
    motivation: values.motivation,
    contribution: values.contribution,
    problemSolving: values.problemSolving,
    teamwork: values.teamwork,
    responsibility: values.responsibility,
    commitment: values.commitment,
    foundationalCommitment: values.foundationalCommitment,
    equityCommitment: values.equityCommitment,
  };
  const cvFile = form.elements.cvFile.files[0];
  if (!cvFile) {
    setFeedback(feedback, 'Upload your CV or résumé before submitting.', true);
    return;
  }
  if (cvFile.size > 15 * 1024 * 1024) {
    setFeedback(feedback, 'Your CV or résumé must be 15 MB or smaller.', true);
    return;
  }
  if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'].includes(cvFile.type)) {
    setFeedback(feedback, 'Upload a PDF, DOC, DOCX, JPG, or PNG file.', true);
    return;
  }
  button.disabled = true;
  try {
    const draft = await apiRequest('/recruitment/applications', {
      method: 'POST',
      body: JSON.stringify({
        positionId: values.positionId,
        applicantPhone: values.applicantPhone,
        applicationType: values.applicationType,
        cvUrl: values.cvUrl,
        coverLetter: values.coverLetter,
        answers,
      }),
    });
    const applicationId = draft.application?.id;
    if (!applicationId) throw new Error('The application draft was saved without an application ID. Please contact ClariCare before trying again.');
    await apiRequest(`/recruitment/applications/${encodeURIComponent(applicationId)}/documents`, {
      method: 'POST',
      body: cvFile,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Document-Type': 'cv',
        'X-File-Type': cvFile.type,
        'X-File-Name': encodeURIComponent(cvFile.name),
      },
    });
    const result = await apiRequest(`/recruitment/applications/${encodeURIComponent(applicationId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    form.reset();
    pendingApplicantPositionId = null;
    setView('dashboard');
    await loadRoleDashboard();
    setFeedback(document.querySelector('#dashboard-feedback'), result.notification?.sent
      ? 'Application submitted. We sent a confirmation email and will email you when its status changes.'
      : `Application submitted. Email confirmation could not be sent: ${result.notification?.reason || 'Please check your inbox later or contact ClariCare.'}`,
      !result.notification?.sent);
  } catch (error) {
    setFeedback(feedback, error.message, true);
    button.disabled = false;
  }
});

document.querySelector('#referrer-invitation-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.querySelector('#referrer-invitation-feedback');
  const password = form.elements.password.value;
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { setFeedback(feedback, 'This invitation link is missing its token. Ask the administrator to resend it.', true); return; }
  if (!invitationDetailsLoaded) { setFeedback(feedback, 'Invitation details are still loading. Please wait and try again.', true); return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setFeedback(feedback, 'Activating your account…');
  try {
    const body = { token, password };
    if (pendingInvitationRole === 'referrer') {
      const canvas = document.querySelector('#invitation-signature-pad');
      if (canvas.dataset.hasSignature !== 'true') throw new Error('Draw your signature before accepting the agreement.');
      body.signatureName = form.elements.signatureName.value.trim();
      body.signatureData = canvas.toDataURL('image/png');
      body.agreementConsent = form.elements.agreementConsent.checked;
    }
    const data = await apiRequest('/auth/accept-invitation', { method: 'POST', body: JSON.stringify(body) });
    if (!['employee', 'referrer'].includes(String(data.user?.role || '').toLowerCase())) throw new Error('This invitation is not for an employee or referrer account. Contact the administrator.');
    saveSession(data);
    form.reset();
    document.querySelector('#referrer-invitation-page').hidden = true;
    document.querySelector('#site-header').hidden = true;
    document.querySelector('#public-site').hidden = true;
    document.querySelector('#workspace').hidden = false;
    history.replaceState(null, '', '/#home');
    setView('dashboard');
    checkHealth();
  } catch (error) {
    setFeedback(feedback, error.message, true);
    button.disabled = false;
  }
});

function prepareSignaturePad(canvas, clearButton = document.querySelector('#invitation-signature-clear')) {
  const context = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  context.scale(ratio, ratio);
  context.lineWidth = 2.2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#203c31';
  let drawing = false;
  canvas.dataset.hasSignature = 'false';
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    event.preventDefault();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
    canvas.dataset.hasSignature = 'true';
    event.preventDefault();
  });
  const stopDrawing = () => { drawing = false; };
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);
  clearButton.addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    canvas.dataset.hasSignature = 'false';
  });
}

async function loadInvitationDetails() {
  const feedback = document.querySelector('#referrer-invitation-feedback');
  const token = new URLSearchParams(location.search).get('token');
  if (!token) {
    setFeedback(feedback, 'This invitation link is missing its token. Ask the administrator to resend it.', true);
    return;
  }
  try {
    const data = await apiRequest(`/auth/invitation?token=${encodeURIComponent(token)}`);
    pendingInvitationRole = String(data.invitation?.role || '');
    const signatureSection = document.querySelector('#invitation-agreement');
    const submit = document.querySelector('#referrer-invitation-form button[type="submit"]');
    const assignment = document.querySelector('#invitation-assignment');
    if (pendingInvitationRole === 'referrer') {
      if (!data.agreement || data.agreement.status !== 'pending_signature') throw new Error('The referral agreement is unavailable. Ask the administrator to resend your invitation.');
      document.querySelector('#invitation-agreement-title').textContent = data.agreement.title;
      document.querySelector('#invitation-agreement-content').textContent = data.agreement.content;
      signatureSection.hidden = false;
      prepareSignaturePad(document.querySelector('#invitation-signature-pad'));
      submit.textContent = 'Sign agreement & activate account';
    } else if (pendingInvitationRole === 'employee') {
      assignment.textContent = `Your assignment: ${data.invitation.departmentName || 'Department unavailable'} · ${data.invitation.position || 'Position unavailable'}`;
      assignment.hidden = false;
      submit.textContent = 'Accept invitation';
    } else {
      throw new Error('This invitation is not for an employee or referrer account.');
    }
    invitationDetailsLoaded = true;
  } catch (error) {
    setFeedback(feedback, error.message, true);
  }
}

document.querySelector('#admin-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(
    form,
    '/auth/login',
    document.querySelector('#admin-login-feedback'),
    (data) => {
      if (String(data.user?.role || '').toLowerCase() !== 'admin') {
        throw new Error('This page is for administrator accounts. Use the dedicated sign-in page for your account.');
      }
      return `Welcome, ${data.user.name}.`;
    },
    (data) => {
      saveSession(data);
      form.reset();
      document.querySelector('#admin-login-page').hidden = true;
      document.querySelector('#site-header').hidden = true;
      document.querySelector('#public-site').hidden = true;
      document.querySelector('#workspace').hidden = false;
      history.replaceState(null, '', '/#home');
      setView('dashboard');
      checkHealth();
    },
  );
});

document.querySelector('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitForm(form, '/auth/register', document.querySelector('#auth-feedback'),
    (data) => {
      if (String(data.user?.role || '').toLowerCase() !== 'customer') {
        throw new Error('Customer registration did not create a customer account. Please contact support.');
      }
      return `Your customer account is ready, ${data.user.name}.`;
    },
    async (data) => {
      saveSession(data);
      form.reset();
      history.replaceState(null, '', '/#home');
      openWorkspace('dashboard');
      await addPendingProductToCart();
    },
    (values) => ({ ...values, role: 'customer' }));
});

function logoutCurrentUser() {
  clearSession();
  showPublicSite();
  setFeedback(document.querySelector('#auth-feedback'), 'You have signed out.');
}

document.querySelector('#logout-button').addEventListener('click', logoutCurrentUser);
document.querySelector('#customer-dashboard-logout').addEventListener('click', logoutCurrentUser);

document.querySelector('#account-profile-file').addEventListener('change', (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  const image = document.querySelector('#account-profile-image');
  image.src = URL.createObjectURL(file); image.hidden = false;
  document.querySelector('#account-avatar-initials').hidden = true;
});
document.querySelector('#account-profile-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const file = document.querySelector('#account-profile-file').files?.[0];
  const feedback = document.querySelector('#account-profile-feedback');
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
    setFeedback(feedback, 'Choose a PNG, JPEG, or WebP image smaller than 1 MB.', true); return;
  }
  const reader = new FileReader();
  reader.onerror = () => setFeedback(feedback, 'The selected image could not be read.', true);
  reader.onload = async () => {
    const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const data = await apiRequest('/account/profile', { method: 'PATCH', body: JSON.stringify({ profileImage: reader.result }) });
      currentUser = data.user; localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser)); updateProfile();
      form.reset(); setFeedback(feedback, 'Profile photo updated.');
    } catch (error) { setFeedback(feedback, error.message, true); }
    finally { button.disabled = false; }
  };
  reader.readAsDataURL(file);
});

document.querySelector('#current-year').textContent = new Intl.DateTimeFormat('en-KE', { year: 'numeric', timeZone: EAST_AFRICA_TIME_ZONE }).format(new Date());
updateProfile();
const initialPath = location.pathname.replace(/\/$/, '');
if (initialPath === '/admin') showAdminLogin(false);
else if (initialPath === '/employee-login' || initialPath === '/employee') showStaffLogin('employee', false);
else if (initialPath === '/referrer-login' || initialPath === '/referrer') showStaffLogin('referrer', false);
else if (initialPath === '/applicant-login' || initialPath === '/applicant') {
  if (currentUser?.role === 'applicant') openWorkspace('dashboard');
  else showStaffLogin('applicant', false);
}
else if (initialPath === '/accept-invitation') showReferrerInvitationPage();
else if (location.hash === '#customer-login') showCustomerAuthPage('login', false);
else {
const initialPublicRoute = location.hash.slice(1);
if (initialPublicRoute.startsWith('article/')) showArticleFromRoute(decodeURIComponent(initialPublicRoute.slice(8)));
else setPublicPage(['home', 'about', 'products', 'contact', 'quotation', 'updates', 'membership', 'team'].includes(initialPublicRoute) ? initialPublicRoute : 'home', false);
  if (String(currentUser?.role || '').toLowerCase() === 'admin') openWorkspace('dashboard');
}
if (initialPath === '/accept-invitation') loadInvitationDetails();
checkHealth();
loadProducts();
