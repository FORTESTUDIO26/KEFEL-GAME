// Development-only page (?gallery) to eyeball every dog with every clothing layer.
import { DogFigure } from '../art/Dog';
import { FurnitureThumb } from '../art/Furniture';
import { Backdrop } from '../art/Scenes';
import { BACKDROPS, FURNITURE, PALETTES, WEARABLES } from '../content/catalog';
import { DOGS } from '../content/dogs';
import type { Outfit } from '../state/types';

const LOOKS: Outfit[] = [
  {},
  { body: { itemId: 'tee_stripes', color: '#2ec4c0' }, neck: { itemId: 'bandana', color: '#ef4f5f' }, head: { itemId: 'party_hat', color: '#ff7eb6' }, feet: { itemId: 'sneakers', color: '#fbf8ff' } },
  { body: { itemId: 'tutu', color: '#ff7eb6' }, neck: { itemId: 'pearls', color: '#fbf8ff' }, head: { itemId: 'crown', color: '#f2c14e' }, back: { itemId: 'wings', color: '#b48ef0' }, eyes: { itemId: 'heart_glasses', color: '#ff7eb6' } },
  { body: { itemId: 'leotard', color: '#b48ef0' }, head: { itemId: 'stage_bun', color: '#2ec4c0' }, feet: { itemId: 'legwarmers', color: '#2ec4c0' }, prop: { itemId: 'ribbon', color: '#ff7eb6' } },
  { body: { itemId: 'raincoat', color: '#f2c14e' }, feet: { itemId: 'boots', color: '#f2c14e' }, prop: { itemId: 'umbrella', color: '#2ec4c0' }, head: { itemId: 'beanie', color: '#ffab7a' } },
  { body: { itemId: 'evening_jacket', color: '#34407a' }, neck: { itemId: 'bowtie', color: '#ef4f5f' }, head: { itemId: 'beret', color: '#ef4f5f' }, back: { itemId: 'cape', color: '#ef4f5f' }, eyes: { itemId: 'round_glasses', color: '#2c2433' } },
  { body: { itemId: 'sweater', color: '#ffab7a' }, neck: { itemId: 'scarf', color: '#b48ef0' }, head: { itemId: 'headphones', color: '#34407a' }, prop: { itemId: 'hoop', color: '#2ec4c0' }, back: { itemId: 'backpack', color: '#7fdcaa' } },
  { body: { itemId: 'denim', color: '#5b7fc7' }, neck: { itemId: 'heart_collar', color: '#ff7eb6' }, head: { itemId: 'cap', color: '#2ec4c0' }, prop: { itemId: 'clubs', color: '#ffab7a' }, eyes: { itemId: 'star_glasses', color: '#f2c14e' } },
  { body: { itemId: 'pajama', color: '#b48ef0' }, neck: { itemId: 'collar_classic', color: '#2ec4c0' }, head: { itemId: 'flower_crown', color: '#ff7eb6' }, prop: { itemId: 'gym_ball', color: '#b48ef0' }, feet: { itemId: 'socks', color: '#ff7eb6' } },
  { body: { itemId: 'sport_tank', color: '#ffab7a' }, head: { itemId: 'bow', color: '#b48ef0' }, prop: { itemId: 'rope', color: '#7fdcaa' } },
  { body: { itemId: 'hoodie', color: '#7fdcaa' }, head: { itemId: 'sun_hat', color: '#f2c14e' }, eyes: { itemId: 'sunglasses', color: '#2c2433' }, prop: { itemId: 'handbag', color: '#b48ef0' } },
  { body: { itemId: 'flowy_dress', color: '#ffab7a' }, head: { itemId: 'flower_clip', color: '#ff7eb6' }, feet: { itemId: 'ballet_shoes', color: '#ff7eb6' }, back: { itemId: 'big_bow', color: '#ff7eb6' }, prop: { itemId: 'bouquet', color: '#ff7eb6' } },
  { body: { itemId: 'knit_vest', color: '#ef4f5f' }, head: { itemId: 'headband', color: '#b48ef0' }, neck: { itemId: 'bell_ribbon', color: '#2ec4c0' } },
  { neck: { itemId: 'polka_bandana', color: '#b48ef0' } },
];

export function Gallery() {
  return (
    <div style={{ padding: 16, background: '#fff' }}>
      <p>{WEARABLES.length} wearables · {FURNITURE.length} furniture · {DOGS.length} dogs</p>
      <table>
        <tbody>
          {DOGS.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              {LOOKS.map((o, i) => (
                <td key={i}>
                  <DogFigure dog={d} outfit={o} className="g-dog" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FURNITURE.map((f) => (
          <div key={f.id} style={{ width: 120, textAlign: 'center' }}>
            <div style={{ height: 100 }}>
              <FurnitureThumb id={f.id} p={PALETTES[0]} />
            </div>
            {f.name}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {BACKDROPS.map((b) => (
          <svg key={b.id} viewBox="0 0 400 440" width={160}>
            <Backdrop id={b.id} p={PALETTES[1]} />
          </svg>
        ))}
      </div>
      <style>{'.g-dog{width:110px;height:115px} svg{max-height:100%}'}</style>
    </div>
  );
}
