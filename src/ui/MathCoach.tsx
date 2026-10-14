import { RichText } from './common';
import { Icon } from './icons';
export function MathCoach({text}:{text:string}) {
 return <aside className="math-coach" role="note" aria-label="נחשוב יחד"><span className="coach-avatar" aria-hidden="true"><Icon name="bulb" size={28}/></span><div><strong>נחשוב יחד?</strong><p><RichText text={`בואי ננסה דרך שתעזור לנו. ${text}`}/></p><span className="muted small">אפשר לחשב בעזרתה עכשיו; בהמשך נחזור וננסה לזכור לבד.</span></div></aside>;
}
