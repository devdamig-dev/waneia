const $ = (id) => document.getElementById(id);

async function load() {
  const config = await chrome.storage.sync.get({
    endpoint: "",
    deviceId: "",
    secret: "",
    deviceName: "",
    knownLabels: [],
    enabled: true,
  });

  $("endpoint").value = config.endpoint;
  $("deviceId").value = config.deviceId;
  $("secret").value = config.secret;
  $("deviceName").value = config.deviceName;
  $("labels").value = (config.knownLabels || []).join("\n");
  $("enabled").checked = Boolean(config.enabled);
}

async function save() {
  const knownLabels = $("labels").value
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  await chrome.storage.sync.set({
    endpoint: $("endpoint").value.trim(),
    deviceId: $("deviceId").value.trim(),
    secret: $("secret").value,
    deviceName: $("deviceName").value.trim(),
    knownLabels,
    enabled: $("enabled").checked,
  });

  $("status").textContent = "Guardado";
  setTimeout(() => ($("status").textContent = ""), 1800);
}

$("save").addEventListener("click", save);
load();
