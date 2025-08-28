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
    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const doc = await getDoc();
        const { ID, tipoEstudio } = JSON.parse(event.body);

        let sheet;
        switch (tipoEstudio) {
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

        const rows = await sheet.getRows();
        // CORRECCIÓN: Se usa row.get('ID') para encontrar la fila correctamente.
        const rowToDelete = rows.find(row => row.get('ID') === ID);

        if (rowToDelete) {
            await rowToDelete.delete();
            return { statusCode: 200, body: JSON.stringify({ message: 'Registro eliminado con éxito!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'Registro no encontrado para eliminar.' }) };
        }
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.' }) };
    }
};
