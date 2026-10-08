import configs from "./configs";
export function getCurrentHubId() {
  const qs = new URLSearchParams(location.search);
  const defaultRoomId = configs.feature("default_room_id");

  return (
    qs.get("hub_id") ||
    (document.location.pathname === "/" && defaultRoomId
      ? defaultRoomId
      : document.location.pathname.substring(1).split("/")[0])
  );
}

export function updateVRHudPresenceCount({ presence }) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  const vrHudPresenceCount = document.querySelector("#hud-presence-count");
  vrHudPresenceCount.setAttribute("text", "value", occupantCount.toString());
}
export function updateSceneCopresentState(presence, scene) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  if (occupantCount > 1) {
    scene.addState("copresent");
  } else {
    scene.removeState("copresent");
  }
}

// When this page first joined the room. It rides in the presence context so
// every client agrees on when the current session began (the earliest joiner
// still present), and it survives reconnects so a dropout doesn't restart it.
let joinedAt = null;

export function sessionStart() {
  const state = window.APP?.hubChannel?.presence?.state;
  let start = Infinity;
  if (state) {
    for (const id in state) {
      const j = state[id]?.metas?.[0]?.context?.joined_at;
      if (typeof j === "number" && j < start) start = j;
    }
  }
  return Number.isFinite(start) ? start : (joinedAt ?? Date.now());
}

export function createHubChannelParams({
  permsToken,
  profile,
  pushSubscriptionEndpoint,
  isMobile,
  isMobileVR,
  isEmbed,
  hubInviteId,
  authToken
}) {
  if (joinedAt === null) joinedAt = Date.now();
  return {
    profile,
    push_subscription_endpoint: pushSubscriptionEndpoint,
    auth_token: authToken || null,
    perms_token: permsToken || null,
    context: {
      mobile: isMobile || isMobileVR,
      embed: isEmbed,
      hmd: isMobileVR,
      joined_at: joinedAt
    },
    hub_invite_id: hubInviteId
  };
}

export function isRoomOwner(clientId) {
  const presences = APP.hubChannel.presence.state;
  return presences && presences[clientId] && presences[clientId].metas[0].roles.owner;
}

export function isLockedDownDemoRoom() {
  if (APP.hubChannel?.canOrWillIfCreator("update_hub")) return;
  const hubId = getCurrentHubId();
  if (configs.feature("is_locked_down_demo_room")) {
    const idArr = configs.feature("is_locked_down_demo_room").replace(/\s/g, "").split(",");
    return idArr.includes(hubId);
  } else {
    return false;
  }
}
