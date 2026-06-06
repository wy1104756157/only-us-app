const typeMap = {
  moment: { label: "Moments", title: "记录心动瞬间", tag: "心动", color: "#ffe1dc" },
  wish: { label: "心语心愿", title: "写下一个心愿", tag: "心愿", color: "#cde8dc" },
  date: { label: "重要时间", title: "添加重要时间", tag: "时间", color: "#f4d48b" },
  note: { label: "随记随想", title: "存进碎片抽屉", tag: "随记", color: "#cfe2ef" },
  whisper: { label: "蛐蛐", title: "留一条悄悄话", tag: "蛐蛐", color: "#e1d4e9" },
  chat: { label: "聊天存档", title: "粘贴微信聊天记录", tag: "聊天", color: "#ddf3ee" },
};

let currentType = "moment";
let hasVoice = false;
let hasImage = false;
let selectedKeyword = "";
const removedKeywords = new Set();
const keptKeywords = new Set();

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
    voice: false,
    state: "TA 已看 · 20:16",
    unreadForMe: false,
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
    state: "你已认领 · 等待完成",
    unreadForMe: true,
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
    state: "等待 TA 拆开",
    locked: true,
    unreadForMe: false,
  },
];

const views = {
  home: document.querySelector("#homeView"),
  record: document.querySelector("#recordView"),
  graph: document.querySelector("#graphView"),
  base: document.querySelector("#baseView"),
};

const tabs = [...document.querySelectorAll(".tab")];
const feedList = document.querySelector("#feedList");
const modal = document.querySelector("#composeModal");
const typePicker = document.querySelector("#typePicker");
const modalType = document.querySelector("#modalType");
const modalTitle = document.querySelector("#modalTitle");
const entryTitle = document.querySelector("#entryTitle");
const entryBody = document.querySelector("#entryBody");
const imageToggle = document.querySelector("#imageToggle");
const voiceToggle = document.querySelector("#voiceToggle");
const voicePreview = document.querySelector("#voicePreview");
const toast = document.querySelector("#toast");
const unreadBadges = [...document.querySelectorAll("[data-unread-type]")];
const graphStage = document.querySelector("#graphStage");
const keywordList = document.querySelector("#keywordList");
const relatedEntries = document.querySelector("#relatedEntries");
const relatedTitle = document.querySelector("#relatedTitle");
const graphSummary = document.querySelector("#graphSummary");

function renderFeed() {
  renderUnreadBadges();
  renderGraph();
  feedList.innerHTML = entries
    .map((entry) => {
      const type = typeMap[entry.type];
      const body = entry.locked ? "对方还没有拆开。内容会在 TA 准备好时显示。" : entry.body;
      const readLabel = entry.state.includes("等待") || entry.state.includes("未")
        ? `<span>${entry.state}</span>`
        : `<strong>${entry.state}</strong>`;

      return `
        <article class="feed-card" style="--card-color:${type.color}">
          <div class="feed-top">
            <div class="feed-meta">
              <span class="tag">${type.tag}</span>
              <span>${entry.author} · ${entry.time}</span>
            </div>
          </div>
          <h3>${entry.title}</h3>
          <p>${body}</p>
          ${entry.image ? `<div class="photo-strip">图片记录</div>` : ""}
          ${entry.voice ? `<div class="voice-pill">语音 0:${entry.type === "wish" ? "12" : "18"}</div>` : ""}
          <div class="read-state">
            ${readLabel}
            <span>${entry.type === "whisper" ? "拆信记录" : "浏览记录"}</span>
          </div>
        </article>
      `;
    })
    .join("");
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
        keywordMap.set(word, { word, count: 0, entries: [], related: new Map(), kept: false });
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
      return `<button class="graph-node ${node.word === selectedKeyword ? "active" : ""}" data-keyword="${node.word}" style="--size:${size}px; left:${x}%; top:${y}%;">${node.word}</button>`;
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
            <strong>${node.word}</strong>
            <span>出现 ${node.count} 次 · 相关：${related}</span>
          </button>
          <div class="keyword-actions">
            <button data-keep="${node.word}">${node.kept ? "已保留" : "保留"}</button>
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
  relatedTitle.textContent = `词条：${node.word}`;
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

function openComposer(type = "moment") {
  currentType = type;
  const meta = typeMap[type];
  modalType.textContent = meta.label;
  modalTitle.textContent = meta.title;
  entryTitle.value = "";
  entryBody.value = "";
  hasVoice = false;
  hasImage = false;
  imageToggle.classList.remove("active");
  voiceToggle.classList.remove("active");
  voiceToggle.textContent = "按住说话";
  voicePreview.classList.remove("active");
  [...typePicker.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => entryTitle.focus(), 60);
}

function closeComposer() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function publishEntry() {
  const meta = typeMap[currentType];
  const title = entryTitle.value.trim() || meta.title;
  const body = entryBody.value.trim() || defaultBody(currentType);

  entries.unshift({
    id: Date.now(),
    type: currentType,
    author: "你",
    title,
    body,
    time: "刚刚",
    image: hasImage || currentType === "moment",
    voice: hasVoice,
    state: currentType === "whisper" ? "等待 TA 拆开" : "等待 TA 查看",
    locked: currentType === "whisper",
    unreadForMe: false,
  });

  renderFeed();
  switchTab("home");
  closeComposer();
  showToast("已发布到你们的秘密基地");
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
document.querySelector("#inviteButton").addEventListener("click", () => {
  switchTab("base");
  showToast("邀请卡片已准备好：LOVE-0626");
});
document.querySelector("#copyInviteButton").addEventListener("click", () => {
  showToast("已生成微信邀请卡片");
});
document.querySelector("#backButton").addEventListener("click", () => switchTab("home"));
document.querySelector("#openGraphButton").addEventListener("click", () => switchTab("graph"));
document.querySelector("#resetGraphButton").addEventListener("click", () => {
  removedKeywords.clear();
  renderGraph();
  showToast("已恢复被删除的词条");
});
document.querySelector("#markReadButton").addEventListener("click", () => {
  entries.forEach((entry) => {
    if (entry.author === "你") {
      entry.locked = false;
      entry.state = entry.voice ? "TA 已听完 · 刚刚" : "TA 已看 · 刚刚";
      if (entry.type === "whisper") entry.state = "TA 已拆开 · 刚刚";
    }
  });
  renderFeed();
  showToast("已模拟 TA 查看你的内容");
});

document.querySelectorAll("[data-compose]").forEach((button) => {
  button.addEventListener("click", () => openComposer(button.dataset.compose));
});

typePicker.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-type]");
  if (!button) return;
  openComposer(button.dataset.type);
});

document.querySelector("#graphView").addEventListener("click", (event) => {
  const keywordButton = event.target.closest("[data-keyword]");
  const keepButton = event.target.closest("[data-keep]");
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
  hasImage = !hasImage;
  imageToggle.classList.toggle("active", hasImage);
  showToast(hasImage ? "已添加一张图片占位" : "已移除图片");
});

voiceToggle.addEventListener("click", () => {
  hasVoice = !hasVoice;
  voiceToggle.classList.toggle("active", hasVoice);
  voicePreview.classList.toggle("active", hasVoice);
  voiceToggle.textContent = hasVoice ? "重新录音" : "按住说话";
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeComposer();
});

renderFeed();
