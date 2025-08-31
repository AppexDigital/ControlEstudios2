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
    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const doc = await getDoc();
        const updatedCita = JSON.parse(event.body);

        const sheet = doc.sheetsByTitle[updatedCita.tipoEstudio];

        if (!sheet) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Tipo de estudio no válido o hoja no encontrada.' }) };
        }
        
        // This field is for routing only and is not a column in the sheet.
        delete updatedCita.tipoEstudio;

        const rows = await sheet.getRows();
        
        // ARCHITECTURAL FIX: Compare IDs as strings to prevent type mismatches (e.g., "101" vs 101).
        // This makes the backend robust regardless of how the frontend sends the ID.
        const rowToUpdate = rows.find(row => String(row.get('ID')) === String(updatedCita.ID));

        if (rowToUpdate) {
            // Use .set() to update values, which is the correct method for v4 of the library.
            Object.keys(updatedCita).forEach(key => {
                if (sheet.headerValues.includes(key)) {
                    rowToUpdate.set(key, updatedCita[key]);
                }
            });
            await rowToUpdate.save({ raw: true }); // Save changes to the sheet.
            return { statusCode: 200, body: JSON.stringify({ message: 'Cita actualizada con éxito!' }) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'No se encontró la cita para actualizar.' }) };
        }
    } catch (error) {
        console.error('Error al actualizar la cita:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor al actualizar la cita.' }) };
    }
};

