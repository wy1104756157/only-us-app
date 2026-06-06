const typeMap = {
  moment: { label: "Moments", title: "记录心动瞬间", tag: "心动", color: "#ffe1dc", icon: "✨", desc: "心动或感动的瞬间" },
  wish: { label: "心语心愿", title: "写下一个心愿", tag: "心愿", color: "#cde8dc", icon: "🎁", desc: "想要、期待与暗示" },
  date: { label: "重要时间", title: "添加重要时间", tag: "时间", color: "#f4d48b", icon: "⏳", desc: "生日、纪念日、倒计时" },
  note: { label: "随记随想", title: "存进碎片抽屉", tag: "随记", color: "#cfe2ef", icon: "💭", desc: "聊天、灵感、日常碎片" },
  whisper: { label: "蛐蛐", title: "留一条悄悄话", tag: "蛐蛐", color: "#e1d4e9", icon: "🤫", desc: "准备好再拆开的悄悄话" },
  chat: { label: "聊天存档", title: "粘贴微信聊天记录", tag: "聊天", color: "#ddf3ee", icon: "💬", desc: "粘贴微信聊天记录" },
};

const recordTypes = ["moment", "wish", "date", "note", "whisper", "chat"];
const reactionTypes = [
  { key: "like", emoji: "👍", label: "点赞" },
  { key: "cry", emoji: "🥹", label: "哭哭" },
  { key: "laugh", emoji: "😆", label: "大笑" },
];

let currentType = "moment";
let selectedImageUrl = "";
let selectedImageName = "";
let recordedAudioUrl = "";
let recordedAudioBlob = null;
let mediaRecorder = null;
let recordingStartedAt = 0;
let recordingTimer = null;
let isRecording = false;
let selectedKeyword = "";
let selectedRecordType = "moment";
let recordMode = "overview";
let editingEntryId = null;
let composerReturnView = "home";
let isJoined = true;
let quickExpanded = true;
let homeDateEntryId = null;
const inviteCode = "LOVE-0626";
const inviteUrl = "https://wy1104756157.github.io/only-us-app/?invite=LOVE-0626";
const removedKeywords = new Set();
const keptKeywords = new Set();
const keywordRenames = new Map();
const coupleProfile = {
  meName: "你",
  partnerName: "TA",
  days: 238,
};

const savedProfile = localStorage.getItem("onlyUsProfile");
if (savedProfile) {
  try {
    Object.assign(coupleProfile, JSON.parse(savedProfile));
  } catch (error) {
    localStorage.removeItem("onlyUsProfile");
  }
}

const keywordSeeds = [
  "晚霞",
  "旅行",
  "第一次旅行",
  "周末",
  "日料",
  "生日",
  "委屈",
  "抱一下",
  "想你",
  "火锅",
  "花店",
  "海边",
  "礼物",
  "约会",
  "下班",
  "聊天",
  "心愿",
  "纪念日",
  "和好",
  "撒娇",
  "拥抱",
  "照片",
  "晚安",
  "见面",
];

const entries = [
  {
    id: 1,
    type: "moment",
    author: "你",
    title: "今天下班路上的晚霞",
    body: "本来只是普通的一天，但你说这片云像我们第一次旅行时看到的那一朵。",
    time: "今天 19:42",
    image: true,
    imageUrl: "",
    voice: false,
    state: "TA 已看 · 20:16",
    unreadForMe: false,
    comments: [
      { author: "TA", text: "这张晚霞我也还记得。", time: "20:18" },
    ],
  },
  {
    id: 2,
    type: "wish",
    author: "TA",
    title: "周末想去吃那家日料",
    body: "不是一定要去啦，只是突然很想和你坐在吧台边慢慢吃一顿。",
    time: "今天 15:08",
    image: false,
    voice: true,
    audioUrl: "",
    state: "你已认领 · 等待完成",
    wishCompleted: false,
    unreadForMe: true,
    comments: [],
  },
  {
    id: 3,
    type: "whisper",
    author: "你",
    title: "有一条悄悄话",
    body: "昨天那件事我其实还有一点点委屈，但我不是想吵架，只是想被你好好抱一下。",
    time: "昨天 23:18",
    image: false,
    voice: true,
    audioUrl: "",
    state: "等待 TA 拆开",
    locked: true,
    unreadForMe: false,
    comments: [],
  },
  {
    id: 4,
    type: "date",
    author: "你",
    title: "TA 的生日",
    body: "每年都想认真准备的小日子。",
    time: "6月26日",
    image: false,
    voice: false,
    state: "首页倒计时中",
    eventDate: "2026-06-26",
    showOnHome: true,
    unreadForMe: false,
    comments: [],
  },
  {
    id: 5,
    type: "whisper",
    author: "TA",
    title: "有一条给你的蛐蛐",
    body: "今天想说一句认真话：我很喜欢你把小事也放在心上的样子。",
    time: "今天 21:06",
    image: false,
    voice: false,
    state: "等待你拆开",
    locked: true,
    unreadForMe: true,
    comments: [],
  },
];
homeDateEntryId = entries.find((entry) => entry.type === "date" && entry.showOnHome)?.id || null;

const views = {
  join: document.querySelector("#joinView"),
  home: document.querySelector("#homeView"),
  record: document.querySelector("#recordView"),
  graph: document.querySelector("#graphView"),
  base: document.querySelector("#baseView"),
};

const tabs = [...document.querySelectorAll(".tab")];
const feedList = document.querySelector("#feedList");
const recordModuleGrid = document.querySelector("#recordModuleGrid");
const recordDetail = document.querySelector("#recordDetail");
const modal = document.querySelector("#composeModal");
const typePicker = document.querySelector("#typePicker");
const modalType = document.querySelector("#modalType");
const modalTitle = document.querySelector("#modalTitle");
const entryTitle = document.querySelector("#entryTitle");
const entryBody = document.querySelector("#entryBody");
const dateOptions = document.querySelector("#dateOptions");
const eventDateInput = document.querySelector("#eventDateInput");
const showOnHomeInput = document.querySelector("#showOnHomeInput");
const imageInput = document.querySelector("#imageInput");
const imageToggle = document.querySelector("#imageToggle");
const voiceToggle = document.querySelector("#voiceToggle");
const voicePreview = document.querySelector("#voicePreview");
const imagePreview = document.querySelector("#imagePreview");
const voiceDuration = document.querySelector("#voiceDuration");
const voiceStatus = document.querySelector("#voiceStatus");
const voicePlayer = document.querySelector("#voicePlayer");
const toast = document.querySelector("#toast");
const unreadBadges = [...document.querySelectorAll("[data-unread-type]")];
const graphStage = document.querySelector("#graphStage");
const keywordList = document.querySelector("#keywordList");
const relatedEntries = document.querySelector("#relatedEntries");
const relatedTitle = document.querySelector("#relatedTitle");
const graphSummary = document.querySelector("#graphSummary");
const inviteModal = document.querySelector("#inviteModal");
const inviteImage = document.querySelector("#inviteImage");
const shareInviteButton = document.querySelector("#shareInviteButton");
const downloadInviteButton = document.querySelector("#downloadInviteButton");
const joinCodeInput = document.querySelector("#joinCodeInput");
const profileModal = document.querySelector("#profileModal");
const meNameInput = document.querySelector("#meNameInput");
const partnerNameInput = document.querySelector("#partnerNameInput");
const daysInput = document.querySelector("#daysInput");
const toggleQuickButton = document.querySelector("#toggleQuickButton");
const quickStrip = document.querySelector(".quick-strip");
const posterModal = document.querySelector("#posterModal");
const entryPosterImage = document.querySelector("#entryPosterImage");
const subjectEditor = document.querySelector("#subjectEditor");
const subjectBox = document.querySelector("#subjectBox");
const entryPosterAdjustButton = document.querySelector("#entryPosterAdjustButton");
const entryPosterApplyButton = document.querySelector("#entryPosterApplyButton");
const entryPosterDownloadButton = document.querySelector("#entryPosterDownloadButton");
const entryPosterShareButton = document.querySelector("#entryPosterShareButton");
let inviteImageBlob = null;
let inviteImageUrl = "";
let posterBlob = null;
let posterUrl = "";
let posterEntryTitle = "两人即宇宙";
let currentPosterEntryId = null;
let currentSubjectBox = null;
let manualSubjectBox = null;
const manualSubjectBoxes = new Map();
let subjectDrag = null;
const posterSize = { width: 900, height: 1280 };

function getShortName(name, fallback) {
  return (name || fallback).trim().slice(0, 2) || fallback;
}

function getPartnerName() {
  return coupleProfile.partnerName.trim() || "TA";
}

function getAuthorName(author) {
  if (author === "你") return coupleProfile.meName.trim() || "你";
  if (author === "TA") return getPartnerName();
  return author;
}

function getDateEntryForHome() {
  return entries.find((entry) => entry.type === "date" && entry.id === homeDateEntryId)
    || entries.find((entry) => entry.type === "date" && entry.showOnHome)
    || null;
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((target - start) / 86400000);
}

function getDateReminderText(entry) {
  if (!entry) return `距离 ${getPartnerName()} 的生日还有 12 天`;
  const days = getDaysUntil(entry.eventDate);
  if (days === null) return entry.title;
  if (days === 0) return `今天是 ${entry.title}`;
  if (days > 0) return `距离 ${entry.title} 还有 ${days} 天`;
  return `${entry.title} 已过去 ${Math.abs(days)} 天`;
}

function syncHomeDateSelection(selectedId) {
  homeDateEntryId = selectedId || null;
  entries.forEach((entry) => {
    if (entry.type === "date") {
      entry.showOnHome = Boolean(selectedId && entry.id === selectedId);
      if (entry.showOnHome) entry.state = "首页倒计时中";
    }
  });
}

function renderProfile() {
  const meName = coupleProfile.meName.trim() || "你";
  const partnerName = getPartnerName();
  document.querySelector("#meAvatar").textContent = getShortName(meName, "你");
  document.querySelector("#partnerAvatar").textContent = getShortName(partnerName, "TA");
  document.querySelector("#togetherDays").textContent = String(Math.max(0, Number(coupleProfile.days) || 0));
  document.querySelector("#heroReminder").textContent = getDateReminderText(getDateEntryForHome());
}

function openProfileEditor() {
  meNameInput.value = coupleProfile.meName;
  partnerNameInput.value = coupleProfile.partnerName;
  daysInput.value = String(coupleProfile.days);
  profileModal.classList.add("active");
  profileModal.setAttribute("aria-hidden", "false");
  setTimeout(() => meNameInput.focus(), 60);
}

function closeProfileEditor() {
  profileModal.classList.remove("active");
  profileModal.setAttribute("aria-hidden", "true");
}

function saveProfile() {
  coupleProfile.meName = meNameInput.value.trim() || "你";
  coupleProfile.partnerName = partnerNameInput.value.trim() || "TA";
  coupleProfile.days = Math.max(0, Math.min(99999, Number(daysInput.value) || 0));
  localStorage.setItem("onlyUsProfile", JSON.stringify(coupleProfile));
  renderProfile();
  closeProfileEditor();
  showToast("首页资料已更新");
}

function renderQuickActions() {
  quickStrip.classList.toggle("collapsed", !quickExpanded);
  toggleQuickButton.textContent = quickExpanded ? "只看常用" : "展开全部";
}

function renderReactions(entry) {
  const reactions = entry.reactions || {};
  return `
    <div class="reaction-row" aria-label="表情互动">
      ${reactionTypes.map((reaction) => {
        const count = reactions[reaction.key] || 0;
        const active = entry.myReaction === reaction.key;
        return `
          <button class="${active ? "active" : ""}" data-react-entry="${entry.id}" data-reaction="${reaction.key}" aria-label="${reaction.label}">
            <span>${reaction.emoji}</span>
            <em>${count || reaction.label}</em>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderEntryCard(entry, options = {}) {
  const type = typeMap[entry.type];
  const isCoveredWhisper = entry.type === "whisper" && entry.locked;
  const body = entry.body;
  const readLabel = entry.state.includes("等待") || entry.state.includes("未")
    ? `<span>${entry.state}</span>`
    : `<strong>${entry.state}</strong>`;
  const dateInfo = entry.type === "date" && entry.eventDate
    ? `<div class="date-pill">${getDateReminderText(entry)}</div>`
    : "";
  const wishStamp = entry.type === "wish" && entry.wishCompleted
    ? `<div class="wish-stamp">👍 太棒啦！</div>`
    : "";
  const canComment = options.showComments && entry.author !== "你" && !isCoveredWhisper;
  const comments = entry.comments || [];

  return `
    <article class="feed-card ${options.compact ? "compact-card" : ""}" style="--card-color:${type.color}">
      <div class="feed-top">
        <div class="feed-meta">
          <span class="tag">${type.tag}</span>
          <span>${getAuthorName(entry.author)} · ${entry.time}</span>
        </div>
        ${entry.author === "你" || entry.type === "date" || entry.type === "wish" ? `
          <div class="entry-actions">
            <button class="poster-action" data-entry-poster="${entry.id}">生成海报</button>
            ${entry.type === "date" ? `<button data-home-date="${entry.id}">${entry.showOnHome ? "首页中" : "放首页"}</button>` : ""}
            ${entry.type === "wish" && !entry.wishCompleted ? `<button class="stamp-action" data-complete-wish="${entry.id}">👍 太棒啦</button>` : ""}
            ${entry.type === "wish" && entry.wishCompleted ? `<button class="undo-stamp-action" data-reset-wish="${entry.id}">恢复未完成</button>` : ""}
            ${entry.author === "你" ? `
              <button data-edit-entry="${entry.id}">编辑</button>
              <button data-delete-entry="${entry.id}">删除</button>
            ` : ""}
          </div>
        ` : `<div class="entry-actions"><button class="poster-action" data-entry-poster="${entry.id}">生成海报</button></div>`}
      </div>
      <h3>${entry.title}</h3>
      ${wishStamp}
      ${dateInfo}
      ${isCoveredWhisper ? `
        <div class="whisper-cover">
          <strong>这条蛐蛐还盖着</strong>
          <span>${entry.author === "你" ? `等待 ${getPartnerName()} 确认拆开` : "确认之后再看，不会突然把内容摊开"}</span>
          ${entry.author !== "你" ? `<button data-open-whisper="${entry.id}">确认拆开</button>` : ""}
        </div>
      ` : `
        <p>${body}</p>
        ${entry.image ? renderImageBlock(entry) : ""}
        ${entry.voice ? renderVoiceBlock(entry) : ""}
      `}
      <div class="read-state">
        ${readLabel}
        <span>${entry.type === "whisper" ? "拆信记录" : "浏览记录"}</span>
      </div>
      ${renderReactions(entry)}
      ${options.showComments && !isCoveredWhisper ? `
        <div class="comment-thread">
          ${comments.length ? comments.map((comment) => `
            <div class="comment-item">
              <strong>${getAuthorName(comment.author)}</strong>
              <span>${comment.text}</span>
            </div>
          `).join("") : `<div class="comment-empty">还没有评论</div>`}
          ${canComment ? `
            <div class="comment-box">
              <input data-comment-input="${entry.id}" maxlength="60" placeholder="回复一句话" />
              <button data-add-comment="${entry.id}">发送</button>
            </div>
          ` : ""}
        </div>
      ` : ""}
    </article>
  `;
}

function renderFeed() {
  renderUnreadBadges();
  renderGraph();
  renderProfile();
  renderRecordView();
  feedList.innerHTML = entries.map((entry) => renderEntryCard(entry)).join("");
}

function renderImageBlock(entry) {
  if (entry.imageUrl) {
    return `<img class="entry-image" src="${entry.imageUrl}" alt="${entry.title}的图片" />`;
  }
  return `<div class="photo-strip">图片记录</div>`;
}

function renderVoiceBlock(entry) {
  if (entry.audioUrl) {
    return `<audio class="entry-audio" src="${entry.audioUrl}" controls></audio>`;
  }
  return `<div class="voice-pill">语音 0:${entry.type === "wish" ? "12" : "18"}</div>`;
}

function getTypeEntries(type) {
  return entries.filter((entry) => entry.type === type);
}

function renderRecordView() {
  if (!recordModuleGrid || !recordDetail) return;
  const totalEntries = entries.length || 1;
  recordModuleGrid.hidden = recordMode === "detail";
  recordModuleGrid.innerHTML = recordTypes
    .map((type) => {
      const meta = typeMap[type];
      const list = getTypeEntries(type);
      const latest = list[0];
      const mineCount = list.filter((entry) => entry.author === "你").length;
      const partnerCount = list.length - mineCount;
      const unreadCount = list.filter((entry) => entry.unreadForMe).length;
      const commentCount = list.reduce((sum, entry) => sum + (entry.comments?.length || 0), 0);
      const percent = Math.max(8, Math.round((list.length / totalEntries) * 100));

      return `
        <button class="record-folder" data-record-type="${type}" style="--folder-color:${meta.color}; --folder-size:${percent}%;">
          <span class="folder-icon">${meta.icon}</span>
          <span class="folder-main">
            <strong>${meta.label}</strong>
            <em>${list.length ? latest.title : meta.desc}</em>
          </span>
          <span class="folder-stats">
            <b>${list.length}</b>
            <small>${mineCount}/${partnerCount}</small>
          </span>
          ${unreadCount ? `<i class="folder-badge">${unreadCount}</i>` : ""}
          ${commentCount ? `<span class="folder-comments">${commentCount} 条评论</span>` : ""}
        </button>
      `;
    })
    .join("");

  if (recordMode !== "detail") {
  recordDetail.innerHTML = `
    <div class="record-empty-state">
      <strong>选择一个板块查看历史</strong>
      <span>这里只是抽屉总览；点开某个板块后，才会进入它的历史记录页。</span>
    </div>
  `;
    return;
  }

  const meta = typeMap[selectedRecordType];
  const selectedEntries = getTypeEntries(selectedRecordType);
  const latestText = selectedEntries[0]
    ? `${getAuthorName(selectedEntries[0].author)} · ${selectedEntries[0].time}`
    : "还没有记录";

  recordDetail.innerHTML = `
    <div class="record-detail-head">
      <button class="record-back" data-record-back aria-label="返回板块列表">‹</button>
      <div>
        <p class="eyebrow">${meta.desc}</p>
        <h3>${meta.icon} ${meta.label}</h3>
        <span>板块历史 · ${selectedEntries.length} 条记录 · 最近 ${latestText}</span>
      </div>
    </div>
    <div class="record-history">
      ${selectedEntries.length
        ? selectedEntries.map((entry) => renderEntryCard(entry, { showComments: true, compact: true })).join("")
        : `<div class="empty-folder">这个板块还空着，先存下第一条吧。</div>`}
    </div>
  `;
}

function getVisibleText(entry) {
  return `${entry.title} ${entry.locked ? "" : entry.body}`;
}

function extractKeywords(text) {
  const normalized = text.replace(/[，。！？、：；,.!?;:()[\]【】"“”'']/g, " ");
  const isValidKeyword = (word) => word.length >= 2 && word.length <= 5;
  const matched = keywordSeeds.filter((word) => normalized.includes(word) && isValidKeyword(word));
  const chunks = normalized
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(isValidKeyword);
  return [...new Set([...matched, ...chunks])]
    .filter((word) => !["今天", "昨天", "刚刚", "可以", "不是", "一定", "其实", "这里", "内容"].includes(word))
    .slice(0, 10);
}

function buildKeywordGraph() {
  const keywordMap = new Map();

  entries.forEach((entry) => {
    const keywords = extractKeywords(getVisibleText(entry)).filter((word) => !removedKeywords.has(word));
    keywords.forEach((word) => {
      if (!keywordMap.has(word)) {
        keywordMap.set(word, { word, displayWord: keywordRenames.get(word) || word, count: 0, entries: [], related: new Map(), kept: false });
      }
      const node = keywordMap.get(word);
      node.count += 1;
      node.entries.push(entry);
      node.kept = keptKeywords.has(word);
      keywords
        .filter((other) => other !== word)
        .forEach((other) => node.related.set(other, (node.related.get(other) || 0) + 1));
    });
  });

  return [...keywordMap.values()].sort((a, b) => {
    if (b.kept !== a.kept) return Number(b.kept) - Number(a.kept);
    return b.count - a.count || a.word.localeCompare(b.word, "zh-CN");
  });
}

function renderGraph() {
  if (!graphStage || !keywordList) return;
  const nodes = buildKeywordGraph();
  const topNodes = nodes.slice(0, 8);
  if (!selectedKeyword && nodes.length) selectedKeyword = nodes[0].word;

  graphSummary.textContent = `${nodes.length} 个词条 · ${topNodes.length} 个高频节点`;
  graphStage.innerHTML = topNodes
    .map((node, index) => {
      const size = Math.min(34 + node.count * 8, 76);
      const x = 50 + Math.cos((index / Math.max(topNodes.length, 1)) * Math.PI * 2) * 32;
      const y = 50 + Math.sin((index / Math.max(topNodes.length, 1)) * Math.PI * 2) * 30;
      return `<button class="graph-node ${node.word === selectedKeyword ? "active" : ""}" data-keyword="${node.word}" style="--size:${size}px; left:${x}%; top:${y}%;">${node.displayWord}</button>`;
    })
    .join("");

  keywordList.innerHTML = nodes
    .slice(0, 12)
    .map((node) => {
      const related = [...node.related.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word)
        .join("、") || "暂无共现词";
      return `
        <article class="keyword-card ${node.word === selectedKeyword ? "active" : ""}">
          <button class="keyword-main" data-keyword="${node.word}">
            <strong>${node.displayWord}</strong>
            <span>出现 ${node.count} 次 · 相关：${related}</span>
          </button>
          <div class="keyword-actions">
            <button data-keep="${node.word}">${node.kept ? "已保留" : "保留"}</button>
            <button data-edit-keyword="${node.word}">编辑</button>
            <button data-remove="${node.word}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");

  renderRelatedEntries();
}

function renderRelatedEntries() {
  const nodes = buildKeywordGraph();
  const node = nodes.find((item) => item.word === selectedKeyword) || nodes[0];
  if (!node) {
    relatedTitle.textContent = "词条内容";
    relatedEntries.innerHTML = "<p class=\"empty-text\">发布更多记录后，这里会自动长出关键词。</p>";
    return;
  }
  relatedTitle.textContent = `词条：${node.displayWord || node.word}`;
  relatedEntries.innerHTML = node.entries
    .slice(0, 4)
    .map((entry) => `<div class="related-item"><strong>${entry.title}</strong><span>${typeMap[entry.type].label} · ${entry.time}</span></div>`)
    .join("");
}

function renderUnreadBadges() {
  unreadBadges.forEach((button) => {
    const type = button.dataset.unreadType;
    const count = entries.filter((entry) => entry.type === type && entry.unreadForMe).length;
    const badge = button.querySelector(".unread-badge");
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.toggle("show", count > 0);
  });
}

function switchTab(name) {
  Object.entries(views).forEach(([key, view]) => view.classList.toggle("active", key === name));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
}

function showJoinedApp() {
  isJoined = true;
  document.querySelector(".tabbar").hidden = false;
  document.querySelector("#composeFab").hidden = false;
  switchTab("home");
}

function showJoinEntry(code = "") {
  isJoined = false;
  document.querySelector(".tabbar").hidden = true;
  document.querySelector("#composeFab").hidden = true;
  joinCodeInput.value = code;
  switchTab("join");
}

function joinBase() {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (code !== inviteCode) {
    showToast("口令不对，再检查一下邀请卡片");
    return;
  }
  showJoinedApp();
  showToast("加入成功，欢迎来到你们的秘密基地");
}

function openComposer(type = "moment", returnView = "home") {
  editingEntryId = null;
  currentType = type;
  composerReturnView = returnView;
  const meta = typeMap[type];
  modalType.textContent = meta.label;
  modalTitle.textContent = meta.title;
  entryTitle.value = "";
  entryBody.value = "";
  entryBody.placeholder = type === "date" ? "写下这个日子为什么重要" : `写下只给 ${getPartnerName()} 看的话`;
  eventDateInput.value = "";
  showOnHomeInput.checked = type === "date" && !getDateEntryForHome();
  selectedImageUrl = "";
  selectedImageName = "";
  recordedAudioUrl = "";
  recordedAudioBlob = null;
  stopRecordingTimer();
  if (isRecording && mediaRecorder?.state === "recording") mediaRecorder.stop();
  isRecording = false;
  imageToggle.classList.remove("active");
  voiceToggle.classList.remove("active");
  voiceToggle.textContent = "开始录音";
  imagePreview.classList.remove("active");
  imagePreview.innerHTML = "";
  voicePreview.classList.remove("active");
  voiceDuration.textContent = "0:00";
  voiceStatus.textContent = "录音会随记录一起发送";
  voicePlayer.removeAttribute("src");
  renderDateOptions();
  [...typePicker.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => entryTitle.focus(), 60);
}

function setComposerType(type) {
  currentType = type;
  const meta = typeMap[type];
  modalType.textContent = editingEntryId ? `编辑 ${meta.label}` : meta.label;
  modalTitle.textContent = editingEntryId ? "修改这条记录" : meta.title;
  entryBody.placeholder = type === "date" ? "写下这个日子为什么重要" : `写下只给 ${getPartnerName()} 看的话`;
  if (type === "date" && !eventDateInput.value) {
    showOnHomeInput.checked = !getDateEntryForHome();
  }
  renderDateOptions();
  [...typePicker.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
}

function closeComposer() {
  editingEntryId = null;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function renderDateOptions() {
  dateOptions.classList.toggle("active", currentType === "date");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function formatSeconds(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopRecordingTimer() {
  if (recordingTimer) clearInterval(recordingTimer);
  recordingTimer = null;
}

function updateImagePreview() {
  if (!selectedImageUrl) {
    imagePreview.classList.remove("active");
    imagePreview.innerHTML = "";
    imageToggle.textContent = "添加图片";
    imageToggle.classList.remove("active");
    return;
  }
  imagePreview.classList.add("active");
  imagePreview.innerHTML = `
    <img src="${selectedImageUrl}" alt="已选择图片" />
    <button type="button" id="removeImageButton">移除图片</button>
  `;
  imageToggle.textContent = selectedImageName || "更换图片";
  imageToggle.classList.add("active");
  document.querySelector("#removeImageButton").addEventListener("click", () => {
    selectedImageUrl = "";
    selectedImageName = "";
    imageInput.value = "";
    updateImagePreview();
  });
}

function hydrateMediaControls() {
  updateImagePreview();
  if (recordedAudioUrl) {
    voicePreview.classList.add("active");
    voicePlayer.src = recordedAudioUrl;
    voiceStatus.textContent = "已保留原录音，可重新录音";
    voiceDuration.textContent = "已录音";
    voiceToggle.textContent = "重新录音";
    voiceToggle.classList.add("active");
  }
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast("当前浏览器不支持录音，请在手机浏览器或 HTTPS 页面中尝试");
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  mediaRecorder.addEventListener("stop", () => {
    stream.getTracks().forEach((track) => track.stop());
    recordedAudioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
    voicePlayer.src = recordedAudioUrl;
    voiceStatus.textContent = "录音完成，可以播放预览";
    voiceToggle.textContent = "重新录音";
    voiceToggle.classList.add("active");
    isRecording = false;
    stopRecordingTimer();
  });

  recordingStartedAt = Date.now();
  voicePreview.classList.add("active");
  voicePlayer.removeAttribute("src");
  voiceStatus.textContent = "正在录音，点击停止";
  voiceToggle.textContent = "停止录音";
  voiceToggle.classList.add("active");
  isRecording = true;
  recordingTimer = setInterval(() => {
    voiceDuration.textContent = formatSeconds(Date.now() - recordingStartedAt);
  }, 250);
  mediaRecorder.start();
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawMiniCode(ctx, x, y, size) {
  ctx.fillStyle = "#f7fbf8";
  roundedRect(ctx, x, y, size, size, 18);
  ctx.fill();
  ctx.strokeStyle = "#dceee6";
  ctx.lineWidth = 2;
  ctx.stroke();

  const cells = [
    [1, 1], [2, 1], [4, 1], [6, 1],
    [1, 2], [3, 2], [5, 2],
    [2, 3], [4, 3], [6, 3],
    [1, 4], [3, 4], [5, 4],
    [2, 5], [4, 5], [6, 5],
    [1, 6], [3, 6], [5, 6], [6, 6],
  ];
  const gap = size / 9;
  ctx.fillStyle = "#4f806f";
  cells.forEach(([cx, cy]) => {
    roundedRect(ctx, x + cx * gap, y + cy * gap, gap * 0.68, gap * 0.68, 3);
    ctx.fill();
  });
  ctx.fillStyle = "#6eae99";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("只", x + size / 2, y + size / 2 + 6);
}

function generateInviteCard() {
  const canvas = document.createElement("canvas");
  const width = 900;
  const height = 1280;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f7fbf8";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#eef8f4");
  gradient.addColorStop(0.58, "#fffaf0");
  gradient.addColorStop(1, "#eef8fb");
  ctx.fillStyle = gradient;
  roundedRect(ctx, 70, 70, width - 140, height - 140, 42);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.76)";
  roundedRect(ctx, 120, 150, width - 240, 900, 34);
  ctx.fill();

  ctx.fillStyle = "#6eae99";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("双人秘密基地", width / 2, 235);

  ctx.fillStyle = "#31433d";
  ctx.font = "bold 74px sans-serif";
  ctx.fillText("两人即宇宙", width / 2, 330);

  ctx.fillStyle = "#63736e";
  ctx.font = "30px sans-serif";
  ctx.fillText("邀请你一起记录心动、心愿和悄悄话", width / 2, 392);

  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, 255, 470, 230, 88, 44);
  ctx.fill();
  roundedRect(ctx, 415, 470, 230, 88, 44);
  ctx.fill();
  ctx.fillStyle = "#6eae99";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(getShortName(coupleProfile.meName, "你"), 370, 526);
  ctx.fillStyle = "#f0b79e";
  ctx.fillText(getShortName(coupleProfile.partnerName, "TA"), 530, 526);

  ctx.fillStyle = "#405950";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(`邀请码 ${inviteCode}`, width / 2, 655);

  drawMiniCode(ctx, width / 2 - 130, 710, 260);

  ctx.fillStyle = "#63736e";
  ctx.font = "26px sans-serif";
  ctx.fillText("扫码或打开链接加入我们的空间", width / 2, 1045);
  ctx.fillStyle = "#4f806f";
  ctx.font = "24px sans-serif";
  ctx.fillText("链接已带入口令，可直接打开加入", width / 2, 1092);

  ctx.fillStyle = "#9aaaa3";
  ctx.font = "22px sans-serif";
  ctx.fillText("把小事存下来，等以后一起回头看", width / 2, 1180);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      inviteImageBlob = blob;
      if (inviteImageUrl) URL.revokeObjectURL(inviteImageUrl);
      inviteImageUrl = URL.createObjectURL(blob);
      inviteImage.src = inviteImageUrl;
      resolve(blob);
    }, "image/png");
  });
}

async function openInviteCard() {
  inviteModal.classList.add("active");
  inviteModal.setAttribute("aria-hidden", "false");
  await generateInviteCard();
}

function closeInviteCard() {
  inviteModal.classList.remove("active");
  inviteModal.setAttribute("aria-hidden", "true");
}

function downloadInviteCard() {
  if (!inviteImageUrl) return;
  const link = document.createElement("a");
  link.href = inviteImageUrl;
  link.download = "两人即宇宙-邀请卡片.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareInviteCard() {
  if (!inviteImageBlob) await generateInviteCard();
  const file = new File([inviteImageBlob], "两人即宇宙-邀请卡片.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "两人即宇宙",
      text: `邀请你加入我们的双人秘密基地：${inviteUrl}`,
      files: [file],
    });
    return;
  }
  downloadInviteCard();
  showToast("当前浏览器不支持直接分享，已下载图片");
}

function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = src;
  });
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function wrapCanvasText(ctx, text, maxWidth, maxLines = 5) {
  const chars = [...text.replace(/\s+/g, " ").trim()];
  const lines = [];
  let current = "";
  chars.forEach((char) => {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, -1)}…`;
    return clipped;
  }
  return lines;
}

function drawSkyFallback(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#2c80c7");
  sky.addColorStop(0.55, "#72b7e6");
  sky.addColorStop(1, "#eef7fb");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const cloud = (x, y, scale, alpha = 0.78) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const cloudGradient = ctx.createRadialGradient(x, y, 40 * scale, x, y, 170 * scale);
    cloudGradient.addColorStop(0, "#ffffff");
    cloudGradient.addColorStop(1, "rgba(255,255,255,0.28)");
    ctx.fillStyle = cloudGradient;
    [
      [0, 20, 90],
      [78, 0, 105],
      [175, 35, 120],
      [-95, 48, 92],
      [55, 82, 118],
    ].forEach(([dx, dy, radius]) => {
      ctx.beginPath();
      ctx.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  cloud(310, 410, 1.15, 0.82);
  cloud(650, 495, 1, 0.7);
  cloud(165, 635, 0.8, 0.58);

  const land = ctx.createLinearGradient(0, height * 0.78, 0, height);
  land.addColorStop(0, "rgba(34,70,49,0.1)");
  land.addColorStop(1, "rgba(17,43,31,0.72)");
  ctx.fillStyle = land;
  ctx.fillRect(0, height * 0.78, width, height * 0.22);
}

function drawChalkLine(ctx, points, width = 10) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(255,255,255,0.32)";
  ctx.shadowBlur = 3;
  for (let offset = -1; offset <= 1; offset += 1) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x + offset, y);
      else ctx.lineTo(x + offset, y + offset);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function detectSubjectBox(canvas, width, height) {
  const sampleWidth = 90;
  const sampleHeight = 128;
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
  const { data } = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight);
  const scores = [];
  let maxScore = 0;

  const lumaAt = (x, y) => {
    const index = (y * sampleWidth + x) * 4;
    return data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
  };

  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const center = lumaAt(x, y);
      const edge = Math.abs(center - lumaAt(x + 1, y))
        + Math.abs(center - lumaAt(x - 1, y))
        + Math.abs(center - lumaAt(x, y + 1))
        + Math.abs(center - lumaAt(x, y - 1));
      const index = (y * sampleWidth + x) * 4;
      const saturation = Math.max(data[index], data[index + 1], data[index + 2])
        - Math.min(data[index], data[index + 1], data[index + 2]);
      const centerBias = 1 - Math.min(0.75, Math.hypot((x / sampleWidth) - 0.5, (y / sampleHeight) - 0.5));
      const score = (edge * 0.72 + saturation * 0.28) * centerBias;
      scores.push({ x, y, score });
      maxScore = Math.max(maxScore, score);
    }
  }

  const threshold = Math.max(26, maxScore * 0.45);
  const hot = scores.filter((item) => item.score >= threshold);
  if (hot.length < 24) {
    return { x: width * 0.18, y: height * 0.2, width: width * 0.64, height: height * 0.46 };
  }

  let minX = sampleWidth;
  let minY = sampleHeight;
  let maxX = 0;
  let maxY = 0;
  hot.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const padX = sampleWidth * 0.07;
  const padY = sampleHeight * 0.07;
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(sampleWidth, maxX + padX);
  maxY = Math.min(sampleHeight, maxY + padY);

  const box = {
    x: (minX / sampleWidth) * width,
    y: (minY / sampleHeight) * height,
    width: ((maxX - minX) / sampleWidth) * width,
    height: ((maxY - minY) / sampleHeight) * height,
  };

  if (box.width < width * 0.22 || box.height < height * 0.18) {
    return { x: width * 0.2, y: height * 0.22, width: width * 0.6, height: height * 0.42 };
  }
  return box;
}

function intersects(a, b) {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
}

function chooseTextLayout(subjectBox, width, height, titleLineCount, bodyLineCount) {
  const textHeight = titleLineCount * 70 + bodyLineCount * 46 + 86;
  const candidates = [
    { x: 68, y: 90, width: width - 136, height: textHeight, name: "top" },
    { x: 68, y: height - textHeight - 72, width: width - 136, height: textHeight, name: "bottom" },
    { x: 68, y: Math.max(110, subjectBox.y - textHeight - 44), width: width - 136, height: textHeight, name: "above" },
    { x: 68, y: Math.min(height - textHeight - 72, subjectBox.y + subjectBox.height + 44), width: width - 136, height: textHeight, name: "below" },
  ];

  const scoreCandidate = (candidate) => {
    const overlapPenalty = intersects(candidate, subjectBox) ? 10000 : 0;
    const edgePenalty = candidate.y < 70 || candidate.y + candidate.height > height - 42 ? 900 : 0;
    const bottomBonus = candidate.name === "bottom" ? -120 : 0;
    return overlapPenalty + edgePenalty + bottomBonus + Math.abs(candidate.y - height * 0.68) * 0.15;
  };

  return candidates.sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0];
}

function drawSubjectOutline(ctx, box) {
  const x = Math.max(42, box.x - 28);
  const y = Math.max(54, box.y - 30);
  const right = Math.min(858, box.x + box.width + 28);
  const bottom = Math.min(1218, box.y + box.height + 28);
  if (right - x > 780 || bottom - y > 1040) {
    drawChalkLine(ctx, [[52, 62], [220, 48], [450, 64], [700, 50], [850, 74]], 8);
    drawChalkLine(ctx, [[64, 90], [48, 360], [64, 680], [50, 1060], [68, 1210]], 8);
    return;
  }
  const midY = y + (bottom - y) * 0.45;
  drawChalkLine(ctx, [
    [x, midY],
    [x + (right - x) * 0.12, y + 18],
    [x + (right - x) * 0.38, y],
    [x + (right - x) * 0.64, y + 14],
    [right - 10, y + (bottom - y) * 0.28],
    [right, y + (bottom - y) * 0.62],
    [right - 72, bottom - 12],
    [x + (right - x) * 0.46, bottom],
    [x + 28, bottom - 44],
    [x, midY],
  ], 10);
}

function clampSubjectBox(box, width = posterSize.width, height = posterSize.height) {
  const minWidth = width * 0.14;
  const minHeight = height * 0.12;
  const nextWidth = Math.min(width * 0.9, Math.max(minWidth, box.width));
  const nextHeight = Math.min(height * 0.82, Math.max(minHeight, box.height));
  return {
    x: Math.min(width - nextWidth, Math.max(0, box.x)),
    y: Math.min(height - nextHeight, Math.max(0, box.y)),
    width: nextWidth,
    height: nextHeight,
  };
}

function setSubjectEditorActive(isActive) {
  subjectEditor.classList.toggle("active", isActive);
  subjectEditor.setAttribute("aria-hidden", String(!isActive));
}

function syncSubjectBoxToEditor(box = currentSubjectBox) {
  if (!box || !subjectEditor || !subjectBox) return;
  const editorRect = subjectEditor.getBoundingClientRect();
  if (!editorRect.width || !editorRect.height) return;
  subjectBox.style.left = `${(box.x / posterSize.width) * editorRect.width}px`;
  subjectBox.style.top = `${(box.y / posterSize.height) * editorRect.height}px`;
  subjectBox.style.width = `${(box.width / posterSize.width) * editorRect.width}px`;
  subjectBox.style.height = `${(box.height / posterSize.height) * editorRect.height}px`;
}

function getSubjectBoxFromEditor() {
  const editorRect = subjectEditor.getBoundingClientRect();
  const boxRect = subjectBox.getBoundingClientRect();
  if (!editorRect.width || !editorRect.height) return currentSubjectBox;
  return clampSubjectBox({
    x: ((boxRect.left - editorRect.left) / editorRect.width) * posterSize.width,
    y: ((boxRect.top - editorRect.top) / editorRect.height) * posterSize.height,
    width: (boxRect.width / editorRect.width) * posterSize.width,
    height: (boxRect.height / editorRect.height) * posterSize.height,
  });
}

function startSubjectDrag(event, mode) {
  if (!currentSubjectBox) return;
  event.preventDefault();
  event.stopPropagation();
  const editorRect = subjectEditor.getBoundingClientRect();
  const boxRect = subjectBox.getBoundingClientRect();
  subjectDrag = {
    mode,
    startX: event.clientX,
    startY: event.clientY,
    editorWidth: editorRect.width,
    editorHeight: editorRect.height,
    left: boxRect.left - editorRect.left,
    top: boxRect.top - editorRect.top,
    width: boxRect.width,
    height: boxRect.height,
  };
  subjectBox.setPointerCapture?.(event.pointerId);
}

function updateSubjectDrag(event) {
  if (!subjectDrag) return;
  const minWidth = subjectDrag.editorWidth * 0.14;
  const minHeight = subjectDrag.editorHeight * 0.12;
  const deltaX = event.clientX - subjectDrag.startX;
  const deltaY = event.clientY - subjectDrag.startY;
  let left = subjectDrag.left;
  let top = subjectDrag.top;
  let width = subjectDrag.width;
  let height = subjectDrag.height;

  if (subjectDrag.mode === "resize") {
    width = Math.min(subjectDrag.editorWidth - left, Math.max(minWidth, subjectDrag.width + deltaX));
    height = Math.min(subjectDrag.editorHeight - top, Math.max(minHeight, subjectDrag.height + deltaY));
  } else {
    left = Math.min(subjectDrag.editorWidth - width, Math.max(0, subjectDrag.left + deltaX));
    top = Math.min(subjectDrag.editorHeight - height, Math.max(0, subjectDrag.top + deltaY));
  }

  subjectBox.style.left = `${left}px`;
  subjectBox.style.top = `${top}px`;
  subjectBox.style.width = `${width}px`;
  subjectBox.style.height = `${height}px`;
}

function finishSubjectDrag() {
  if (!subjectDrag) return;
  manualSubjectBox = getSubjectBoxFromEditor();
  currentSubjectBox = manualSubjectBox;
  subjectDrag = null;
}

function drawChalkDoodles(ctx, width, height, subjectBox) {
  ctx.save();
  ctx.globalAlpha = 0.95;

  drawChalkLine(ctx, [[34, 38], [190, 30], [392, 42], [620, 32], [862, 44]], 9);
  drawChalkLine(ctx, [[28, 40], [38, 260], [30, 520], [42, 830], [34, 1240]], 9);
  drawChalkLine(ctx, [[866, 48], [852, 282], [872, 548], [858, 846], [870, 1238]], 9);
  drawChalkLine(ctx, [[38, 1242], [250, 1256], [520, 1240], [866, 1250]], 9);

  drawSubjectOutline(ctx, subjectBox);
  drawChalkLine(ctx, [[180, 680], [115, 746], [250, 708], [215, 815]], 14);
  drawChalkLine(ctx, [[112, 920], [335, 912]], 12);

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.setLineDash([52, 32]);
  ctx.beginPath();
  ctx.arc(662, 310, 130, -0.35, Math.PI * 1.25);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.ellipse(600, 150, 88, 36, 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(520, 168);
  ctx.lineTo(705, 182);
  ctx.lineTo(785, 132);
  ctx.lineTo(724, 222);
  ctx.lineTo(620, 200);
  ctx.stroke();

  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.ellipse(342, 455, 20, 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(420, 452, 20, 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(382, 515, 15, 0.2, Math.PI - 0.2);
  ctx.stroke();

  drawChalkLine(ctx, [[72, 965], [46, 1005], [74, 1040]], 8);
  drawChalkLine(ctx, [[800, 1030], [848, 1060], [810, 1098]], 8);
  ctx.restore();
}

function drawOutlinedText(ctx, text, x, y, options = {}) {
  const {
    font = "bold 54px sans-serif",
    fill = "#ffffff",
    stroke = "rgba(255,255,255,0.96)",
    shadow = "rgba(20,32,28,0.38)",
    lineWidth = 10,
    align = "left",
  } = options;
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWrappedOutlinedText(ctx, lines, x, y, lineHeight, options = {}) {
  lines.forEach((line, index) => {
    drawOutlinedText(ctx, line, x, y + index * lineHeight, options);
  });
}

async function generateEntryPoster(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return;
  currentPosterEntryId = entryId;
  const canvas = document.createElement("canvas");
  const { width, height } = posterSize;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (entry.imageUrl) {
    try {
      const image = await loadImageFromUrl(entry.imageUrl);
      drawCoverImage(ctx, image, 0, 0, width, height);
    } catch (error) {
      drawSkyFallback(ctx, width, height);
    }
  } else {
    drawSkyFallback(ctx, width, height);
  }

  const savedSubjectBox = manualSubjectBoxes.get(entryId);
  const subjectBox = savedSubjectBox
    ? clampSubjectBox(savedSubjectBox, width, height)
    : detectSubjectBox(canvas, width, height);
  currentSubjectBox = subjectBox;
  manualSubjectBox = savedSubjectBox || null;

  const soft = ctx.createLinearGradient(0, 0, 0, height);
  soft.addColorStop(0, "rgba(0,0,0,0.02)");
  soft.addColorStop(0.54, "rgba(0,0,0,0)");
  soft.addColorStop(0.86, "rgba(20,32,28,0.24)");
  soft.addColorStop(1, "rgba(10,22,20,0.5)");
  ctx.fillStyle = soft;
  ctx.fillRect(0, 0, width, height);

  const type = typeMap[entry.type];
  const isCoveredWhisper = entry.type === "whisper" && entry.locked;
  const posterText = isCoveredWhisper
    ? "这条蛐蛐还盖着，等准备好再拆开。"
    : entry.body;
  posterEntryTitle = entry.title || "两人即宇宙";

  ctx.font = "bold 58px sans-serif";
  const titleLines = wrapCanvasText(ctx, entry.title, width - 140, 2);
  ctx.font = "34px sans-serif";
  const lines = wrapCanvasText(ctx, posterText, width - 140, 4);
  const textLayout = chooseTextLayout(subjectBox, width, height, titleLines.length, lines.length);

  drawChalkDoodles(ctx, width, height, subjectBox);

  drawWrappedOutlinedText(ctx, titleLines, textLayout.x, textLayout.y + 62, 70, {
    font: "bold 58px sans-serif",
    fill: "#31433d",
    stroke: "rgba(255,255,255,0.94)",
    lineWidth: 14,
  });

  drawWrappedOutlinedText(ctx, lines, textLayout.x + 4, textLayout.y + 62 + titleLines.length * 70 + 24, 46, {
    font: "34px sans-serif",
    fill: "#405950",
    stroke: "rgba(255,255,255,0.92)",
    lineWidth: 10,
    shadow: "rgba(20,32,28,0.3)",
  });

  const tagY = Math.min(height - 50, textLayout.y + textLayout.height - 12);
  drawOutlinedText(ctx, `#${type.tag}`, textLayout.x + 4, tagY, {
    font: "bold 30px sans-serif",
    fill: "#4f806f",
    stroke: "rgba(255,255,255,0.95)",
    lineWidth: 9,
  });
  drawOutlinedText(ctx, "两人即宇宙", width - 62, height - 40, {
    font: "bold 28px sans-serif",
    fill: "#31433d",
    stroke: "rgba(255,255,255,0.9)",
    lineWidth: 8,
    align: "right",
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      posterBlob = blob;
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(blob);
      entryPosterImage.src = posterUrl;
      posterModal.classList.add("active");
      posterModal.setAttribute("aria-hidden", "false");
      setSubjectEditorActive(false);
      requestAnimationFrame(() => syncSubjectBoxToEditor(subjectBox));
      resolve(blob);
    }, "image/png");
  });
}

function downloadPoster() {
  if (!posterUrl) return;
  const link = document.createElement("a");
  link.href = posterUrl;
  link.download = `${posterEntryTitle}-分享海报.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function closePosterModal() {
  posterModal.classList.remove("active");
  posterModal.setAttribute("aria-hidden", "true");
  setSubjectEditorActive(false);
  subjectDrag = null;
}

async function sharePoster() {
  if (!posterBlob) return;
  const file = new File([posterBlob], `${posterEntryTitle}-分享海报.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "两人即宇宙",
      text: "分享一张我们的小宇宙海报",
      files: [file],
    });
    return;
  }
  downloadPoster();
  showToast("当前浏览器不支持直接分享，已下载图片");
}

function publishEntry() {
  const meta = typeMap[currentType];
  const title = entryTitle.value.trim() || meta.title;
  const body = entryBody.value.trim() || defaultBody(currentType);
  const eventDate = currentType === "date" ? eventDateInput.value : "";
  const showOnHome = currentType === "date" && showOnHomeInput.checked;

  if (editingEntryId) {
    const entry = entries.find((item) => item.id === editingEntryId);
    if (entry) {
      entry.type = currentType;
      entry.title = title;
      entry.body = body;
      entry.image = Boolean(selectedImageUrl) || currentType === "moment";
      entry.imageUrl = selectedImageUrl;
      entry.voice = Boolean(recordedAudioUrl);
      entry.audioUrl = recordedAudioUrl;
      entry.locked = currentType === "whisper";
      entry.state = currentType === "whisper" ? "等待 TA 重新拆开" : "等待 TA 重新查看";
      entry.wishCompleted = currentType === "wish" ? entry.wishCompleted : false;
      entry.time = "刚刚编辑";
      entry.eventDate = eventDate;
      if (currentType === "date") {
        entry.time = eventDate || "刚刚编辑";
        entry.state = showOnHome ? "首页倒计时中" : "已保存";
        if (showOnHome) syncHomeDateSelection(entry.id);
        else if (homeDateEntryId === entry.id) syncHomeDateSelection(null);
      } else if (homeDateEntryId === entry.id) {
        syncHomeDateSelection(null);
        entry.eventDate = "";
        entry.showOnHome = false;
      } else {
        entry.eventDate = "";
        entry.showOnHome = false;
      }
    }
    editingEntryId = null;
    selectedRecordType = currentType;
    renderFeed();
    if (composerReturnView === "record") {
      recordMode = "detail";
      switchTab("record");
      renderRecordView();
    } else {
      switchTab("home");
    }
    closeComposer();
    showToast("记录已更新");
    return;
  }

  const newEntry = {
    id: Date.now(),
    type: currentType,
    author: "你",
    title,
    body,
    time: currentType === "date" && eventDate ? eventDate : "刚刚",
    image: Boolean(selectedImageUrl) || currentType === "moment",
    imageUrl: selectedImageUrl,
    voice: Boolean(recordedAudioUrl),
    audioUrl: recordedAudioUrl,
    state: currentType === "date" ? (showOnHome ? "首页倒计时中" : "已保存") : (currentType === "whisper" ? "等待 TA 拆开" : "等待 TA 查看"),
    locked: currentType === "whisper",
    wishCompleted: false,
    eventDate,
    showOnHome: false,
    unreadForMe: false,
  };
  entries.unshift(newEntry);
  if (showOnHome) syncHomeDateSelection(newEntry.id);
  selectedRecordType = currentType;

  renderFeed();
  if (composerReturnView === "record") {
    recordMode = "detail";
    switchTab("record");
    renderRecordView();
  } else {
    switchTab("home");
  }
  closeComposer();
  showToast("已发布到你们的秘密基地");
}

function editEntry(entryId, returnView = "home") {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return;
  openComposer(entry.type, returnView);
  editingEntryId = entry.id;
  modalType.textContent = `编辑 ${typeMap[entry.type].label}`;
  modalTitle.textContent = "修改这条记录";
  entryTitle.value = entry.title;
  entryBody.value = entry.body;
  eventDateInput.value = entry.eventDate || "";
  showOnHomeInput.checked = Boolean(entry.showOnHome);
  selectedImageUrl = entry.imageUrl || "";
  selectedImageName = selectedImageUrl ? "已选图片" : "";
  recordedAudioUrl = entry.audioUrl || "";
  recordedAudioBlob = null;
  hydrateMediaControls();
}

function deleteEntry(entryId) {
  const index = entries.findIndex((item) => item.id === entryId);
  if (index === -1) return;
  const [removed] = entries.splice(index, 1);
  if (homeDateEntryId === removed.id) {
    const fallbackDate = entries.find((entry) => entry.type === "date");
    syncHomeDateSelection(fallbackDate?.id || null);
  }
  if (selectedKeyword && !buildKeywordGraph().some((node) => node.word === selectedKeyword)) {
    selectedKeyword = "";
  }
  renderFeed();
  showToast(`已删除「${removed.title}」`);
}

function addComment(entryId, text) {
  const entry = entries.find((item) => item.id === entryId);
  const content = text.trim();
  if (!entry || !content) {
    showToast("先写一句想回复的话");
    return;
  }
  if (entry.author === "你") {
    showToast("自己的内容可以直接编辑");
    return;
  }
  entry.comments = entry.comments || [];
  entry.comments.push({
    author: "你",
    text: content,
    time: "刚刚",
  });
  renderFeed();
  showToast("评论已发送");
}

function openWhisper(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry || entry.type !== "whisper") return;
  entry.locked = false;
  entry.state = "已拆开 · 刚刚";
  renderFeed();
  showToast("已拆开这条蛐蛐");
}

function completeWish(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry || entry.type !== "wish") return;
  entry.wishCompleted = true;
  entry.state = "👍 太棒啦 · 刚刚";
  renderFeed();
  showToast("太棒啦，心愿已盖章");
}

function resetWish(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry || entry.type !== "wish") return;
  entry.wishCompleted = false;
  entry.state = entry.author === "你" ? `等待 ${getPartnerName()} 查看` : "你已认领 · 等待完成";
  renderFeed();
  showToast("已恢复为未完成");
}

function toggleReaction(entryId, reactionKey) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry || !reactionTypes.some((reaction) => reaction.key === reactionKey)) return;
  entry.reactions = { ...(entry.reactions || {}) };
  const previous = entry.myReaction;

  if (previous) {
    entry.reactions[previous] = Math.max(0, (entry.reactions[previous] || 0) - 1);
  }

  if (previous === reactionKey) {
    entry.myReaction = "";
    showToast("已取消表情");
  } else {
    entry.reactions[reactionKey] = (entry.reactions[reactionKey] || 0) + 1;
    entry.myReaction = reactionKey;
    showToast("互动已记录");
  }

  renderFeed();
}

function editKeyword(word) {
  const current = keywordRenames.get(word) || word;
  const next = window.prompt("编辑词条名称（5个字以内）", current);
  if (next === null) return;
  const trimmed = next.trim().slice(0, 5);
  if (!trimmed) {
    showToast("词条名称不能为空");
    return;
  }
  keywordRenames.set(word, trimmed);
  renderGraph();
  showToast("词条已更新");
}

function defaultBody(type) {
  const defaults = {
    moment: "把这个瞬间先存下来，等以后一起回头看。",
    wish: "这是一个小小心愿，希望你能看见。",
    date: "这个日子对我们很重要。",
    note: "一条突然想到、想以后再看的碎片。",
    whisper: "这是一条想被理解的话，不是审判。",
    chat: "TA：周末去吃火锅吗？\n我：可以，还想去买花。\nTA：那吃完火锅去花店。",
  };
  return defaults[type];
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

document.querySelector("#composeFab").addEventListener("click", () => openComposer("moment"));
document.querySelector("#closeModal").addEventListener("click", closeComposer);
document.querySelector("#publishButton").addEventListener("click", publishEntry);
document.querySelector("#editProfileButton").addEventListener("click", openProfileEditor);
document.querySelector("#closeProfileModal").addEventListener("click", closeProfileEditor);
document.querySelector("#saveProfileButton").addEventListener("click", saveProfile);
toggleQuickButton.addEventListener("click", () => {
  quickExpanded = !quickExpanded;
  renderQuickActions();
});
document.querySelector("#inviteButton").addEventListener("click", () => {
  switchTab("base");
  openInviteCard();
});
document.querySelector("#copyInviteButton").addEventListener("click", () => {
  openInviteCard();
});
document.querySelector("#closeInviteModal").addEventListener("click", closeInviteCard);
document.querySelector("#joinBaseButton").addEventListener("click", joinBase);
document.querySelector("#previewDemoButton").addEventListener("click", showJoinedApp);
document.querySelector("#openJoinButton").addEventListener("click", () => showJoinEntry(inviteCode));
shareInviteButton.addEventListener("click", () => {
  shareInviteCard().catch(() => showToast("分享被取消或当前浏览器不支持"));
});
downloadInviteButton.addEventListener("click", downloadInviteCard);
document.querySelector("#backButton").addEventListener("click", () => switchTab("home"));
document.querySelector("#recordAddButton").addEventListener("click", () => openComposer("moment"));
document.querySelector("#closePosterModal").addEventListener("click", closePosterModal);
entryPosterAdjustButton.addEventListener("click", () => {
  if (!currentSubjectBox) return;
  const nextActive = !subjectEditor.classList.contains("active");
  setSubjectEditorActive(nextActive);
  if (nextActive) {
    syncSubjectBoxToEditor(currentSubjectBox);
    showToast("拖动主角框，尽量把人物或重点物体圈住");
  }
});
entryPosterApplyButton.addEventListener("click", () => {
  if (!currentPosterEntryId) return;
  const nextBox = getSubjectBoxFromEditor();
  if (!nextBox) return;
  manualSubjectBox = nextBox;
  manualSubjectBoxes.set(currentPosterEntryId, nextBox);
  generateEntryPoster(currentPosterEntryId).then(() => showToast("已按新的主角位置重新生成"));
});
entryPosterDownloadButton.addEventListener("click", downloadPoster);
entryPosterShareButton.addEventListener("click", () => {
  sharePoster().catch(() => showToast("分享被取消或当前浏览器不支持"));
});
subjectBox.addEventListener("pointerdown", (event) => startSubjectDrag(event, "move"));
subjectBox.querySelector("i").addEventListener("pointerdown", (event) => startSubjectDrag(event, "resize"));
window.addEventListener("pointermove", updateSubjectDrag);
window.addEventListener("pointerup", finishSubjectDrag);
window.addEventListener("resize", () => {
  if (subjectEditor.classList.contains("active")) syncSubjectBoxToEditor(currentSubjectBox);
});
document.querySelector("#resetGraphButton").addEventListener("click", () => {
  removedKeywords.clear();
  renderGraph();
  showToast("已恢复被删除的词条");
});
document.querySelector("#markReadButton").addEventListener("click", () => {
  entries.forEach((entry) => {
    if (entry.author === "你") {
      if (entry.type === "whisper") return;
      entry.state = entry.voice ? `${getPartnerName()} 已听完 · 刚刚` : `${getPartnerName()} 已看 · 刚刚`;
    }
  });
  renderFeed();
  showToast(`已模拟 ${getPartnerName()} 查看普通内容`);
});

feedList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-entry]");
  const deleteButton = event.target.closest("[data-delete-entry]");
  const homeDateButton = event.target.closest("[data-home-date]");
  const openWhisperButton = event.target.closest("[data-open-whisper]");
  const completeWishButton = event.target.closest("[data-complete-wish]");
  const resetWishButton = event.target.closest("[data-reset-wish]");
  const reactionButton = event.target.closest("[data-react-entry]");
  const posterButton = event.target.closest("[data-entry-poster]");
  if (posterButton) {
    generateEntryPoster(Number(posterButton.dataset.entryPoster)).then(() => showToast("记录海报已生成"));
    return;
  }
  if (reactionButton) {
    toggleReaction(Number(reactionButton.dataset.reactEntry), reactionButton.dataset.reaction);
    return;
  }
  if (resetWishButton) {
    resetWish(Number(resetWishButton.dataset.resetWish));
    return;
  }
  if (completeWishButton) {
    completeWish(Number(completeWishButton.dataset.completeWish));
    return;
  }
  if (openWhisperButton) {
    openWhisper(Number(openWhisperButton.dataset.openWhisper));
    return;
  }
  if (homeDateButton) {
    const id = Number(homeDateButton.dataset.homeDate);
    syncHomeDateSelection(id);
    renderFeed();
    showToast("已显示到首页倒计时");
    return;
  }
  if (editButton) {
    editEntry(Number(editButton.dataset.editEntry), "record");
    return;
  }
  if (deleteButton) {
    deleteEntry(Number(deleteButton.dataset.deleteEntry));
  }
});

document.querySelector("#recordView").addEventListener("click", (event) => {
  const folder = event.target.closest("[data-record-type]");
  const backButton = event.target.closest("[data-record-back]");
  const composeButton = event.target.closest("[data-compose]");
  const editButton = event.target.closest("[data-edit-entry]");
  const deleteButton = event.target.closest("[data-delete-entry]");
  const homeDateButton = event.target.closest("[data-home-date]");
  const commentButton = event.target.closest("[data-add-comment]");
  const openWhisperButton = event.target.closest("[data-open-whisper]");
  const completeWishButton = event.target.closest("[data-complete-wish]");
  const resetWishButton = event.target.closest("[data-reset-wish]");
  const reactionButton = event.target.closest("[data-react-entry]");
  const posterButton = event.target.closest("[data-entry-poster]");

  if (folder) {
    selectedRecordType = folder.dataset.recordType;
    recordMode = "detail";
    renderRecordView();
    return;
  }

  if (backButton) {
    recordMode = "overview";
    renderRecordView();
    return;
  }

  if (commentButton) {
    const id = Number(commentButton.dataset.addComment);
    const input = recordDetail.querySelector(`[data-comment-input="${id}"]`);
    addComment(id, input?.value || "");
    return;
  }

  if (posterButton) {
    generateEntryPoster(Number(posterButton.dataset.entryPoster)).then(() => showToast("记录海报已生成"));
    return;
  }

  if (reactionButton) {
    toggleReaction(Number(reactionButton.dataset.reactEntry), reactionButton.dataset.reaction);
    return;
  }

  if (resetWishButton) {
    resetWish(Number(resetWishButton.dataset.resetWish));
    return;
  }

  if (completeWishButton) {
    completeWish(Number(completeWishButton.dataset.completeWish));
    return;
  }

  if (openWhisperButton) {
    openWhisper(Number(openWhisperButton.dataset.openWhisper));
    return;
  }

  if (homeDateButton) {
    syncHomeDateSelection(Number(homeDateButton.dataset.homeDate));
    renderFeed();
    showToast("已显示到首页倒计时");
    return;
  }

  if (editButton) {
    editEntry(Number(editButton.dataset.editEntry));
    return;
  }

  if (deleteButton) {
    deleteEntry(Number(deleteButton.dataset.deleteEntry));
    return;
  }

  if (composeButton) {
    openComposer(composeButton.dataset.compose, "record");
  }
});

document.querySelectorAll(".quick-action[data-compose]").forEach((button) => {
  button.addEventListener("click", () => openComposer(button.dataset.compose));
});

typePicker.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-type]");
  if (!button) return;
  setComposerType(button.dataset.type);
});

document.querySelector("#graphView").addEventListener("click", (event) => {
  const keywordButton = event.target.closest("[data-keyword]");
  const keepButton = event.target.closest("[data-keep]");
  const editButton = event.target.closest("[data-edit-keyword]");
  const removeButton = event.target.closest("[data-remove]");

  if (keywordButton) {
    selectedKeyword = keywordButton.dataset.keyword;
    renderGraph();
    return;
  }

  if (keepButton) {
    keptKeywords.add(keepButton.dataset.keep);
    showToast("已保留这个词条");
    renderGraph();
    return;
  }

  if (editButton) {
    editKeyword(editButton.dataset.editKeyword);
    return;
  }

  if (removeButton) {
    const word = removeButton.dataset.remove;
    removedKeywords.add(word);
    keptKeywords.delete(word);
    if (selectedKeyword === word) selectedKeyword = "";
    showToast("已从图谱中删除");
    renderGraph();
  }
});

imageToggle.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  selectedImageUrl = URL.createObjectURL(file);
  selectedImageName = file.name.length > 8 ? "已选图片" : file.name;
  updateImagePreview();
  showToast("图片已添加");
});

voiceToggle.addEventListener("click", async () => {
  if (isRecording) {
    stopRecording();
    return;
  }
  try {
    await startRecording();
  } catch (error) {
    showToast("没有获得麦克风权限，或当前环境不支持录音");
  }
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeComposer();
});

inviteModal.addEventListener("click", (event) => {
  if (event.target === inviteModal) closeInviteCard();
});

profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) closeProfileEditor();
});

posterModal.addEventListener("click", (event) => {
  if (event.target === posterModal) closePosterModal();
});

const inviteParam = new URLSearchParams(window.location.search).get("invite");
if (inviteParam) {
  showJoinEntry(inviteParam.toUpperCase());
}

renderProfile();
renderQuickActions();
renderFeed();
