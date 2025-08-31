
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

        // Remove tipoEstudio as it's only for routing
        delete updatedCita.tipoEstudio;

        const rows = await sheet.getRows();
        const rowToUpdate = rows.find(row => row.ID === updatedCita.ID);

        if (rowToUpdate) {
            // Update only the fields that are present in updatedCita
            Object.keys(updatedCita).forEach(key => {
                rowToUpdate[key] = updatedCita[key];
            });
            await rowToUpdate.save();
            return { statusCode: 200, body: JSON.stringify({ message: 'Cita actualizada con éxito!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'No se encontró la cita para actualizar.' }) };
        }
    } catch (error) {
        console.error('Error al actualizar la cita:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al actualizar la cita.' }) };
    }
};
