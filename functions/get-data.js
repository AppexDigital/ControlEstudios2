const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function getDoc() {
    const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    return doc;
}

exports.handler = async function(event, context) {
    try {
        const doc = await getDoc();

        const usuariosSheet = doc.sheetsByTitle['Usuarios'];
        const serviciosSheet = doc.sheetsByTitle['Servicios'];
        const medicosSheet = doc.sheetsByTitle['Medicos'];
        const metodosDePagoSheet = doc.sheetsByTitle['Metodo de Pago'];
        const descuentosSheet = doc.sheetsByTitle['Descuentos'];
        const rxSheet = doc.sheetsByTitle['RX'];
        const dmoSheet = doc.sheetsByTitle['DMO'];
        const mmgSheet = doc.sheetsByTitle['MMG'];

        const usuariosRows = await usuariosSheet.getRows();
        const serviciosRows = await serviciosSheet.getRows();
        const medicosRows = await medicosSheet.getRows();
        const metodosDePagoRows = await metodosDePagoSheet.getRows();
        const descuentosRows = await descuentosSheet.getRows();
        const rxRows = await rxSheet.getRows();
        const dmoRows = await dmoSheet.getRows();
        const mmgRows = await mmgSheet.getRows();

        const data = {
            usuarios: usuariosRows.map(row => row.toObject()),
            servicios: serviciosRows.map(row => row.toObject()),
            medicos: medicosRows.map(row => row.toObject()),
            metodosDePago: metodosDePagoRows.map(row => row.toObject()),
            descuentos: descuentosRows.map(row => row.toObject()),
            citas: [...rxRows.map(row => row.toObject()), ...dmoRows.map(row => row.toObject()), ...mmgRows.map(row => row.toObject())]
        };

        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al obtener los datos.' }) };
    }
};
