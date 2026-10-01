(() => {
  const BRIDGE_VERSION = "0.1.0";
  const state = {
    lastConversationKey: null,
    lastTitle: null,
    lastTags: [],
    lastHeartbeatAt: 0,
    scheduled: false,
  };

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

  async function settings() {
    return chrome.storage.sync.get({
      endpoint: "",
      deviceId: "",
      secret: "",
      deviceName: "",
      knownLabels: [],
      enabled: true,
    });
  }

  function visible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function conversationTitle() {
    const header = document.querySelector("header");
    if (!header) return null;

    const titled = [...header.querySelectorAll("[title]")]
      .filter(visible)
      .map((node) => normalize(node.getAttribute("title")))
      .filter(Boolean);

    if (titled.length) return titled[0];

    const text = normalize(header.innerText);
    return text ? text.split("\n")[0] : null;
  }

  function conversationKeyFromTitle(title) {
    if (!title) return null;
    const phone = title.match(/\+?\d[\d\s()\-]{7,}/)?.[0];
    return phone ? phone.replace(/\D/g, "") : null;
  }

  function detectKnownLabels(knownLabels) {
    if (!Array.isArray(knownLabels) || !knownLabels.length) return [];

    const wanted = new Map(
      knownLabels
        .map((label) => normalize(label))
        .filter(Boolean)
        .map((label) => [label.toLocaleLowerCase("es"), label]),
    );

    const found = new Set();

    for (const node of document.querySelectorAll(
      '[role="button"], [role="menuitem"], [role="listitem"], span[title], div[title]'
    )) {
      if (!visible(node)) continue;
      const candidates = [
        normalize(node.textContent),
        normalize(node.getAttribute?.("title")),
        normalize(node.getAttribute?.("aria-label")),
      ].filter(Boolean);

      for (const candidate of candidates) {
        const original = wanted.get(candidate.toLocaleLowerCase("es"));
        if (original) found.add(original);
      }
    }

    return [...found].sort((a, b) => a.localeCompare(b, "es"));
  }

  async function sendEvent(eventType, payload = {}) {
    const config = await settings();
    if (!config.enabled || !config.endpoint || !config.deviceId || !config.secret) return;

    const title = conversationTitle();
    const conversationKey = conversationKeyFromTitle(title);
    const tags = detectKnownLabels(config.knownLabels);

    try {
      await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-bridge-device-id": config.deviceId,
          "x-bridge-secret": config.secret,
        },
        body: JSON.stringify({
          event_type: eventType,
          conversation_key: conversationKey,
          conversation_title: title,
          tags,
          occurred_at: new Date().toISOString(),
          payload: {
            ...payload,
            device_name_local: config.deviceName || null,
            url: location.origin + location.pathname,
            bridge_version: BRIDGE_VERSION,
          },
        }),
      });
    } catch (error) {
      console.debug("[Nexo Bridge] event failed", error);
    }
  }

  function diffTags(previous, next) {
    const before = new Set(previous);
    const after = new Set(next);
    return {
      added: next.filter((tag) => !before.has(tag)),
      removed: previous.filter((tag) => !after.has(tag)),
    };
  }

  async function sample() {
    state.scheduled = false;
    const config = await settings();
    if (!config.enabled) return;

    const title = conversationTitle();
    const key = conversationKeyFromTitle(title) || title;
    const tags = detectKnownLabels(config.knownLabels);

    if (key && key !== state.lastConversationKey) {
      state.lastConversationKey = key;
      state.lastTitle = title;
      state.lastTags = tags;
      await sendEvent("chat_seen", { reason: "conversation_changed" });
      if (tags.length) await sendEvent("tag_snapshot");
    } else if (key) {
      const { added, removed } = diffTags(state.lastTags, tags);

      for (const tag of added) {
        await sendEvent("tag_added", { tag });
      }
      for (const tag of removed) {
        await sendEvent("tag_removed", { tag });
      }

      if (added.length || removed.length) {
        state.lastTags = tags;
        await sendEvent("tag_snapshot");
      }
    }

    const now = Date.now();
    if (now - state.lastHeartbeatAt > 60_000) {
      state.lastHeartbeatAt = now;
      await sendEvent("heartbeat", { active_chat: Boolean(key) });
    }
  }

  function scheduleSample() {
    if (state.scheduled) return;
    state.scheduled = true;
    setTimeout(sample, 450);
  }

  const observer = new MutationObserver(scheduleSample);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["title", "aria-label", "data-testid"],
  });

  window.addEventListener("focus", scheduleSample);
  document.addEventListener("click", scheduleSample, true);
  setInterval(scheduleSample, 15_000);

  console.info("[Nexo Bridge] loaded", BRIDGE_VERSION);
  scheduleSample();
})();
