import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({load:vi.fn(),pdf:vi.fn()}));
vi.mock('@/lib/valuations/store',()=>({loadValuation:m.load}));
vi.mock('@/lib/valuations/pdf',()=>({buildValuationPdf:m.pdf}));
import {GET} from './route';
describe('valuation versioned PDF',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.load.mockResolvedValue({snapshot:{input:{year:2027}},version:3});m.pdf.mockResolvedValue(new Uint8Array([37,80,68,70]));});
 it('authorizes the requested revision before generating a private noncached PDF',async()=>{const r=await GET(new Request('https://horizongest.it/valuations/id/pdf?version=3&mode=full'),{params:Promise.resolve({id:'id'})});expect(m.load).toHaveBeenCalledWith('id',3);expect(m.pdf.mock.calls[0][2]).toBe(true);expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(r.headers.get('Content-Disposition')).toContain('v3_full.pdf');});
 it('never builds a PDF for an unauthorized valuation',async()=>{m.load.mockRejectedValue(new Error('denied'));await expect(GET(new Request('https://horizongest.it/valuations/id/pdf'),{params:Promise.resolve({id:'id'})})).rejects.toThrow('denied');expect(m.pdf).not.toHaveBeenCalled();});
 it('rejects malformed revision numbers',async()=>{expect((await GET(new Request('https://horizongest.it/valuations/id/pdf?version=-1'),{params:Promise.resolve({id:'id'})})).status).toBe(400);expect(m.load).not.toHaveBeenCalled();});
});
