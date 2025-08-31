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
        
        // Nombres de todas las hojas que necesitamos.
        const sheetTitles = ['Usuarios', 'Servicios', 'Medicos', 'Metodo de Pago', 'Descuentos', 'RX', 'DMO', 'MMG'];
        
        // Petición en paralelo para máxima eficiencia.
        const sheetPromises = sheetTitles.map(async (title) => {
            const sheet = doc.sheetsByTitle[title];
            if (!sheet) return []; // Si una hoja no existe, devuelve un array vacío.
            const rows = await sheet.getRows();
            return rows.map(row => row.toObject());
        });

        const [usuarios, servicios, medicos, metodosDePago, descuentos, rx, dmo, mmg] = await Promise.all(sheetPromises);

        // Combinar y ordenar los registros de citas.
        const citas = [
            ...rx,
            ...dmo,
            ...mmg
        ].sort((a, b) => parseInt(b.ID) - parseInt(a.ID)); // Ordenar por ID descendente.

        const data = { usuarios, servicios, medicos, metodosDePago, descuentos, citas };

        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor al obtener datos.' }) };
    }
};
