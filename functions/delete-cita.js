const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Helper function to connect to the Google Sheet document
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
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const doc = await getDoc();
        const { ID, tipoEstudio } = JSON.parse(event.body);

        const sheet = doc.sheetsByTitle[tipoEstudio];
        
        if (!sheet) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Tipo de estudio no válido o hoja no encontrada.' }) };
        }

        const rows = await sheet.getRows();

        // ARCHITECTURAL FIX: Compare IDs as strings to prevent type mismatches.
        // This ensures the correct row is found for deletion.
        const rowToDelete = rows.find(row => String(row.get('ID')) === String(ID));

        if (rowToDelete) {
            await rowToDelete.delete();
            return { statusCode: 200, body: JSON.stringify({ message: 'Registro eliminado con éxito!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'Registro no encontrado para eliminar.' }) };
        }
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor al eliminar registro.' }) };
    }
};
