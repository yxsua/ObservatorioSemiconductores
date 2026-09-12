import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {SignalFilters} from './SignalFilters';
import {parseSignalFilters} from './signal-filters';
afterEach(cleanup);
it('limita categorías por FCV y limpia la selección al cambiar de factor',()=>{
 const apply=vi.fn();
 render(<SignalFilters filters={parseSignalFilters(new URLSearchParams('fcv=TEC&categoryId=1'))} catalogs={{fcv:[{code:'TEC',name:'Tecnología'},{code:'MER',name:'Mercado'}],categories:[{id:1,name:'Nodos',fcvCode:'TEC'},{id:2,name:'Ciclos',fcvCode:'MER'}]}} onApply={apply} onClear={()=>{}}/>);
 const category=screen.getByLabelText('Categoría');
 expect(category).toHaveValue('1');expect(within(category).queryByText('Ciclos')).toBeNull();
 fireEvent.change(screen.getByLabelText('Factor crítico de vigilancia'),{target:{value:'MER'}});
 expect(category).toHaveValue('');expect(within(category).queryByText('Nodos')).toBeNull();expect(within(category).getByText('Ciclos')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Aplicar filtros'));
 expect(apply.mock.calls[0][0].get('fcv')).toBe('MER');expect(apply.mock.calls[0][0].has('categoryId')).toBe(false);
 expect(screen.queryByLabelText('Alcance')).toBeNull();
});
