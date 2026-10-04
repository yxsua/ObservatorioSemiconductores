import {describe,it,expect} from 'vitest';
import {emptySupport,readSupport,writeSupport} from './notes';
describe('SIIP internal notes compatibility',()=>{
 it('preserves legacy and malformed notes',()=>{for(const notes of ['Notas previas','Texto\n[SIIP v1]\ninvalid\n[/SIIP]'])expect(readSupport(notes).notes).toBe(notes);});
 it('round trips multiple relationships without duplicating metadata',()=>{const support={direct:['PE1','PN1'],complementary:['PSO1'],source:'FM-001',reference:'Tabla 3; 2025'};const saved=writeSupport('Notas anteriores',support);expect(readSupport(saved)).toEqual({notes:'Notas anteriores',support});expect(writeSupport(saved,support)).toBe(saved);expect(writeSupport(saved,emptySupport())).toBe('Notas anteriores');});
});
