
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
    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const doc = await getDoc();
        const updatedCita = JSON.parse(event.body);

        let sheet;
        switch (updatedCita.tipoEstudio) {
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
        const rowToUpdate = rows.find(row => row.get('ID') === updatedCita.ID);

        if (rowToUpdate) {
            // CORRECCIÓN: Se usa row.set(key, value) para actualizar cada celda.
            Object.keys(updatedCita).forEach(key => {
                // Se asegura de que la clave exista como cabecera en la hoja.
                if (sheet.headerValues.includes(key)) {
                    rowToUpdate.set(key, updatedCita[key]);
                }
            });
            await rowToUpdate.save();
            return { statusCode: 200, body: JSON.stringify({ message: 'Cita actualizada con éxito!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'No se encontró la cita para actualizar.' }) };
        }
    } catch (error) {
        console.error('Error al actualizar la cita:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.' }) };
    }
};
