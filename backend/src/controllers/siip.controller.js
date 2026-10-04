const path = require('node:path');
const fs = require('node:fs/promises');
const {NotFoundError} = require('../errors/apiError');
const calculatorPath = path.resolve(__dirname, '../../storage/Calculadora.xlsx');
async function downloadCalculator(req, res, next) {
    try { await fs.access(calculatorPath); }
    catch (error) { if (error.code === 'ENOENT') throw new NotFoundError('La calculadora SIIP aún no está disponible.'); throw error; }
    res.set('Cache-Control', 'private, no-store');
    res.download(calculatorPath, 'Calculadora-SIIP.xlsx', error => { if (error) next(error); });
}
module.exports = {downloadCalculator};
