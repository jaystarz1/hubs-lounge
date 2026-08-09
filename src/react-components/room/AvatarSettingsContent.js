import React from "react";
import PropTypes from "prop-types";
import { Button, AcceptButton } from "../input/Button";
import styles from "./AvatarSettingsContent.scss";
import { TextInputField } from "../input/TextInputField";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function AvatarSettingsContent({
  displayName,
  pronouns,
  displayNameInputRef,
  pronounsInputRef,
  disableDisplayNameInput,
  onChangeDisplayName,
  onChangePronouns,
  avatarPreview,
  displayNamePattern,
  pronounsPattern,
  onChangeAvatar,
  presetAvatars,
  onSelectPresetAvatar,
  selectedAvatarUrl,
  ...rest
}) {
  return (
    <Column as="form" className={styles.content} {...rest}>
      <TextInputField
        disabled={disableDisplayNameInput}
        label={<FormattedMessage id="avatar-settings-content.display-name-label" defaultMessage="Display Name" />}
        value={displayName}
        pattern={displayNamePattern}
        placeholder="displayed over your avatar"
        spellCheck="false"
        required
        onChange={onChangeDisplayName}
        description={
          <FormattedMessage
            id="avatar-settings-content.display-name-description"
            defaultMessage="Alphanumerics, hyphens, underscores, and tildes. At least 3 characters, no more than 32"
          />
        }
        ref={displayNameInputRef}
      />
      <TextInputField
        label={<FormattedMessage id="avatar-settings-content.pronouns-label" defaultMessage="Pronouns (optional)" />}
        value={pronouns}
        pattern={pronounsPattern}
        placeholder="slash, comma or space separated"
        spellCheck="false"
        onChange={onChangePronouns}
        ref={pronounsInputRef}
      />
      <div className={styles.avatarPreviewContainer}>
        {avatarPreview || <div />}
        {!(presetAvatars && presetAvatars.length > 0) && (
          <Button type="button" preset="basic" onClick={onChangeAvatar}>
            <FormattedMessage id="avatar-settings-content.change-avatar-button" defaultMessage="Change Avatar" />
          </Button>
        )}
      </div>
      {presetAvatars && presetAvatars.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            padding: "10px 4px",
            maxHeight: "150px",
            overflowY: "auto"
          }}
        >
          {presetAvatars.map(preset => {
            const selected = selectedAvatarUrl && selectedAvatarUrl.endsWith(preset.url);
            return (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                onClick={() => onSelectPresetAvatar(preset)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: selected ? "3px solid #ffffff" : "2px solid rgba(128,128,128,0.5)",
                  boxShadow: selected ? "0 0 0 3px #1700c7" : "0 1px 3px rgba(0,0,0,0.3)",
                  background: preset.swatch,
                  cursor: "pointer",
                  flex: "0 0 auto"
                }}
                aria-label={preset.name}
              />
            );
          })}
        </div>
      )}
      <AcceptButton preset="accept" type="submit" />
    </Column>
  );
}

AvatarSettingsContent.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  pronouns: PropTypes.string,
  displayNameInputRef: PropTypes.func,
  pronounsInputRef: PropTypes.func,
  disableDisplayNameInput: PropTypes.bool,
  displayNamePattern: PropTypes.string,
  pronounsPattern: PropTypes.string,
  onChangeDisplayName: PropTypes.func,
  onChangePronouns: PropTypes.func,
  avatarPreview: PropTypes.node,
  onChangeAvatar: PropTypes.func,
  presetAvatars: PropTypes.array,
  onSelectPresetAvatar: PropTypes.func,
  selectedAvatarUrl: PropTypes.string
};
