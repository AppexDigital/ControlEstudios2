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
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const doc = await getDoc();
        const newCita = JSON.parse(event.body);
        
        let sheet;
        switch (newCita.tipoEstudio) {
            case 'RX':
                sheet = doc.sheetsByTitle['RX'];
                break;
            case 'DMO':
                sheet = doc.sheetsByTitle['DMO'];
                break;
            case 'MMG':
                sheet = doc.sheetsByTitle['MMG'];
                break;
            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Tipo de estudio no válido.' }) };
        }

        // Remove tipoEstudio as it's only for routing
        delete newCita.tipoEstudio;

        await sheet.addRow(newCita);

        return { statusCode: 200, body: JSON.stringify({ message: 'Cita agregada con éxito!' }) };
    } catch (error) {
        console.error('Error al guardar la cita:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al guardar la cita.' }) };
    }
};