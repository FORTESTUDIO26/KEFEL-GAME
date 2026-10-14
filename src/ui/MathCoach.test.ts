import { expect,it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathCoach } from './MathCoach';
import { buildHints } from '../learning/hints';
it('shows contextual strategy as dialogue with math isolated left to right',()=>{
 const first=buildHints(7,9,()=>false)[0];
 const html=renderToStaticMarkup(createElement(MathCoach,{text:first.text}));
 expect(html).toContain('נחשוב יחד?');expect(html).toContain('בואי ננסה');
 expect(html).toContain('dir="ltr"');expect(html).toContain('10 × 7');
 expect(html).not.toContain('= 63');
});
