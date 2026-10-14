import { useEffect, useState } from 'react';
import { Modal } from './common';
import { canPromptInstall, isAndroid, isIOS, isStandalone, onInstallChange, promptInstall } from './device';
import { Icon } from './icons';

/** Short, device-specific steps for putting the game on the home screen. */
export function InstallHelp({ onClose }: { onClose: () => void }) {
  const [canPrompt, setCanPrompt] = useState(canPromptInstall());
  useEffect(() => onInstallChange(() => setCanPrompt(canPromptInstall())), []);
  const ios = isIOS();
  const android = isAndroid();

  return (
    <Modal title="הוספה למסך הבית" onClose={onClose}>
      <div className="stack">
        {isStandalone() ? (
          <p>המשחק כבר פתוח מהמסך הבית — הכול מוכן.</p>
        ) : (
          <>
            {canPrompt && (
              <button
                className="primary big"
                onClick={async () => {
                  await promptInstall();
                  onClose();
                }}
              >
                <Icon name="download" /> להוסיף עכשיו
              </button>
            )}
            {(ios || !android) && (
              <div className="install-steps">
                <h3>באייפון (Safari)</h3>
                <ol>
                  <li>
                    לוחצים על כפתור השיתוף <span className="share-glyph" aria-hidden="true">⬆</span> בתחתית המסך (או למעלה, באייפד).
                  </li>
                  <li>גוללים ובוחרים ״הוספה למסך הבית״.</li>
                  <li>לוחצים ״הוסף״. מעכשיו פותחים את המשחק מהאייקון.</li>
                </ol>
              </div>
            )}
            {(android || !ios) && (
              <div className="install-steps">
                <h3>באנדרואיד (Chrome)</h3>
                <ol>
                  <li>לוחצים על שלוש הנקודות ⋮ למעלה.</li>
                  <li>בוחרים ״הוספה למסך הבית״ או ״התקנת האפליקציה״.</li>
                  <li>מאשרים. מעכשיו פותחים את המשחק מהאייקון.</li>
                </ol>
              </div>
            )}
          </>
        )}
        <p className="muted small">
          חשוב: באייפון, משחק שנפתח מהמסך הבית שומר את ההתקדמות בנפרד מספארי. כדאי לבחור דרך אחת ולשחק תמיד ממנה. כדי להעביר התקדמות — ייצוא גיבוי וייבוא
          (באזור ההורים).
        </p>
      </div>
    </Modal>
  );
}
