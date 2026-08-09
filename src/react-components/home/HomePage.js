import React, { useContext, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import classNames from "classnames";
import configs from "../../utils/configs";
import { CreateRoomButton } from "./CreateRoomButton";
import { PWAButton } from "./PWAButton";
import { useFavoriteRooms } from "./useFavoriteRooms";
import { usePublicRooms } from "./usePublicRooms";
import styles from "./HomePage.scss";
import { AuthContext } from "../auth/AuthContext";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { MediaGrid } from "../room/MediaGrid";
import { MediaTile } from "../room/MediaTiles";
import { PageContainer } from "../layout/PageContainer";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";
import { Column } from "../layout/Column";
import { Container } from "../layout/Container";
import { SocialBar } from "../home/SocialBar";
import { SignInButton } from "./SignInButton";
import { AppLogo } from "../misc/AppLogo";
import { isHmc } from "../../utils/isHmc";
import maskEmail from "../../utils/mask-email";

// private-quest-lounge: PIN entry that decrypts the room URL client-side.
// The bundle holds only PBKDF2 salt + AES-GCM ciphertext of the room path.
function LoungePinGate() {
  const gate = process.env.LOUNGE_PIN_GATE;
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!pin || busy) return;
    setBusy(true);
    setError(false);
    try {
      const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(pin),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64(gate.salt), iterations: gate.iterations, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(gate.iv) }, key, b64(gate.ct));
      window.location = new TextDecoder().decode(plaintext);
    } catch (_e) {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }}
    >
      <div style={{ fontSize: "1.15em" }}>Enter the PIN to join the lounge</div>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={e => {
          setPin(e.target.value);
          setError(false);
        }}
        style={{
          fontSize: "1.6em",
          letterSpacing: "0.4em",
          textAlign: "center",
          width: "9em",
          padding: "10px",
          borderRadius: "8px",
          border: error ? "2px solid #d44" : "2px solid #888"
        }}
        aria-label="Lounge PIN"
      />
      {error && <div style={{ color: "#d44" }}>That&apos;s not it — try again.</div>}
      <button
        type="submit"
        disabled={busy}
        style={{
          fontSize: "1.1em",
          padding: "10px 28px",
          borderRadius: "22px",
          border: "none",
          background: "#1700c7",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {busy ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export function HomePage() {
  const auth = useContext(AuthContext);
  const intl = useIntl();

  const { results: favoriteRooms } = useFavoriteRooms();
  const { results: publicRooms } = usePublicRooms();

  const sortedFavoriteRooms = Array.from(favoriteRooms).sort((a, b) => b.member_count - a.member_count);
  const sortedPublicRooms = Array.from(publicRooms).sort((a, b) => b.member_count - a.member_count);
  const wrapInBold = chunk => <b>{chunk}</b>;
  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    // Support legacy sign in urls.
    if (qs.has("sign_in")) {
      const redirectUrl = new URL("/signin", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    } else if (qs.has("auth_topic")) {
      const redirectUrl = new URL("/verify", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    }

    if (qs.has("new")) {
      qs.delete("new");
      createAndRedirectToNewHub(null, null, true, qs);
    }
  }, []);

  const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;
  const email = auth.email;
  return (
    <PageContainer className={styles.homePage}>
      <Container>
        <div className={styles.hero}>
          {auth.isSignedIn ? (
            <div className={styles.signInContainer}>
              <span>
                <FormattedMessage
                  id="header.signed-in-as"
                  defaultMessage="Signed in as {email}"
                  values={{ email: maskEmail(email) }}
                />
              </span>
              <a href="#" onClick={auth.signOut} className={styles.mobileSignOut}>
                <FormattedMessage id="header.sign-out" defaultMessage="Sign Out" />
              </a>
            </div>
          ) : (
            <SignInButton mobile />
          )}
          <div className={styles.logoContainer}>
            <AppLogo />
          </div>
          <div className={styles.appInfo}>
            {process.env.LOUNGE_PIN_GATE ? (
              <LoungePinGate />
            ) : (
              <div className={styles.appDescription}>{configs.translation("app-description")}</div>
            )}
            {canCreateRooms && <CreateRoomButton />}
            {!process.env.LOUNGE_PIN_GATE && <PWAButton />}
          </div>
          <div className={styles.heroImageContainer}>
            <img
              alt={intl.formatMessage(
                {
                  id: "home-page.hero-image-alt",
                  defaultMessage: "Screenshot of {appName}"
                },
                { appName: configs.translation("app-name") }
              )}
              src={configs.image("home_background")}
            />
          </div>
        </div>
      </Container>
      {configs.feature("show_feature_panels") && (
        <Container className={classNames(styles.features, styles.colLg, styles.centerLg)}>
          <Column padding gap="xl" className={styles.card}>
            <img src={configs.image("landing_rooms_thumb")} />
            <h3>
              <FormattedMessage id="home-page.rooms-title" defaultMessage="Instantly create rooms" />
            </h3>
            <p>
              <FormattedMessage
                id="home-page.rooms-blurb"
                defaultMessage="Share virtual spaces with your friends, co-workers, and communities. When you create a room with Hubs, you’ll have a private virtual meeting space that you can instantly share <b>- no downloads or VR headset necessary.</b>"
                values={{ b: wrapInBold }}
              />
            </p>
          </Column>
          <Column padding gap="xl" className={styles.card}>
            <img src={configs.image("landing_communicate_thumb")} />
            <h3>
              <FormattedMessage id="home-page.communicate-title" defaultMessage="Communicate and Collaborate" />
            </h3>
            <p>
              <FormattedMessage
                id="home-page.communicate-blurb"
                defaultMessage="Choose an avatar to represent you, put on your headphones, and jump right in. Hubs makes it easy to stay connected with voice and text chat to other people in your private room."
              />
            </p>
          </Column>
          <Column padding gap="xl" className={styles.card}>
            <img src={configs.image("landing_media_thumb")} />
            <h3>
              <FormattedMessage id="home-page.media-title" defaultMessage="An easier way to share media" />
            </h3>
            <p>
              <FormattedMessage
                id="home-page.media-blurb"
                defaultMessage="Share content with others in your room by dragging and dropping photos, videos, PDF files, links, and 3D models into your space."
              />
            </p>
          </Column>
        </Container>
      )}
      {sortedPublicRooms.length > 0 && (
        <Container className={styles.roomsContainer}>
          <h3 className={styles.roomsHeading}>
            <FormattedMessage id="home-page.public--rooms" defaultMessage="Public Rooms" />
          </h3>
          <Column grow padding className={styles.rooms}>
            <MediaGrid center>
              {sortedPublicRooms.map(room => {
                return (
                  <MediaTile
                    key={room.id}
                    entry={room}
                    processThumbnailUrl={(entry, width, height) =>
                      scaledThumbnailUrlFor(entry.images.preview.url, width, height)
                    }
                  />
                );
              })}
            </MediaGrid>
          </Column>
        </Container>
      )}
      {sortedFavoriteRooms.length > 0 && (
        <Container className={styles.roomsContainer}>
          <h3 className={styles.roomsHeading}>
            <FormattedMessage id="home-page.favorite-rooms" defaultMessage="Favorite Rooms" />
          </h3>
          <Column grow padding className={styles.rooms}>
            <MediaGrid center>
              {sortedFavoriteRooms.map(room => {
                return (
                  <MediaTile
                    key={room.id}
                    entry={room}
                    processThumbnailUrl={(entry, width, height) =>
                      scaledThumbnailUrlFor(entry.images.preview.url, width, height)
                    }
                  />
                );
              })}
            </MediaGrid>
          </Column>
        </Container>
      )}
      {isHmc() ? (
        <Column center>
          <SocialBar />
        </Column>
      ) : null}
    </PageContainer>
  );
}
