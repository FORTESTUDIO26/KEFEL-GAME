# Profiles and expanded design — 2026-10-14

User-approved scope: independent player profiles on the same device and larger studio/dressing design areas. Publish to the existing KEFEL-GAME site after verification.

## Implementation

1. Add a versioned player registry and scoped StorageLike adapter. Each player owns a complete existing SaveData. Preserve the original single-save key and back it up before migration. Never infer ownership of existing progress: show an unassigned saved studio until its owner names it. New installations start with Liori and Noa; migration starts with the existing studio plus an empty additional-player choice. Explicit corruption errors retain original data. Storage failure allows temporary play and backup.
2. Put player selection before App. Remount App when switching, and write the departing save synchronously before showing selection. Import/reset/backups operate only on the selected player. Add a switch-player control and player-specific parent headings. Keep current single-profile export format compatible.
3. Add in-app full-screen design modes to studio and DressingRoom with large scene, expandable item drawer, zoom controls, Escape exit, body scroll lock, and accessible click controls. Use transformed SVG viewBox for studio zoom so drag coordinates stay accurate. Keep item choices and undo state while changing view.
4. Tests first for registry migration, player data isolation, independent reset/import/backup, corrupt registry protection, storage failure, profile reload, and zoom bounds. Run full tests/build. Verify real browser behavior at desktop and phone sizes on a separate test origin. Review changes, then publish and verify live.

## Review focus

- No migration writes over existing progress or guesses its owner.
- Broken registry/profile saves do not become empty profiles silently.
- Switching cannot write one player's state to another player's key.
- Full-screen portals must remain in place across drawer/zoom changes.
- Repeated browser reloads must retain both players, including learning sessions.
