import {expect,it} from 'vitest';
import {beginItemDrag,advanceItemDrag,finishItemDrag} from './itemDrag';
it('preserves the grab offset and commits the last pointer even within one frame',()=>{let d=beginItemDrag('chair',7,{x:610,y:320},{x:600,y:420});d=advanceItemDrag(d,7,{x:430,y:350});const r=finishItemDrag(d,7);expect(r).toEqual({uid:'chair',x:420,y:450,moved:true});});
it('ignores another finger and does not report an unmoved tap as a drag',()=>{const d=beginItemDrag('chair',1,{x:20,y:30},{x:10,y:10});expect(advanceItemDrag(d,2,{x:80,y:90})).toBe(d);expect(finishItemDrag(d,2)).toBeNull();expect(finishItemDrag(d,1)?.moved).toBe(false);});
it('uses the release position when the browser coalesces the last move',()=>{const d=beginItemDrag('chair',3,{x:110,y:220},{x:100,y:200});expect(finishItemDrag(d,3,{x:260,y:280})).toEqual({uid:'chair',x:250,y:260,moved:true});});
