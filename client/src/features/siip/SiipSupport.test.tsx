import {useState} from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {SiipSupport} from './SiipSupport';
import {readSupport} from './notes';
afterEach(cleanup);
it('selects multiple indicators, changes contribution and preserves notes',()=>{
 let saved='Notas previas';
 function Harness(){const [value,setValue]=useState(saved);return <SiipSupport value={value} onChange={next=>{saved=next;setValue(next);}}/>;}
 render(<Harness/>);fireEvent.click(screen.getByText(/Vinculación con SIIP/));
 fireEvent.change(screen.getByLabelText('Aportación a PE1'),{target:{value:'direct'}});
 fireEvent.change(screen.getByLabelText('Aportación a PN1'),{target:{value:'complementary'}});
 expect(readSupport(saved).support.direct).toEqual(['PE1']);expect(readSupport(saved).support.complementary).toEqual(['PN1']);
 fireEvent.change(screen.getByLabelText('Aportación a PE1'),{target:{value:'complementary'}});
 expect(readSupport(saved).support.direct).toEqual([]);expect(readSupport(saved).support.complementary).toEqual(['PN1','PE1']);expect(readSupport(saved).notes).toBe('Notas previas');
});
