/**
 * Validasi atribut_spesifik terhadap skema_formulir kategori.
 * @param {Object} atributSpesifik - data yang dikirim user
 * @param {Object} skemaFormulir - { fields: [...] } dari kategori_aset
 * @returns {Array} array of error message, kosong kalau valid
 */
function validateAtributSpesifik(atributSpesifik, skemaFormulir) {
    const errors = [];
    const fields = skemaFormulir?.fields || [];

    for (const field of fields) {
        const value = atributSpesifik?.[field.key];

        // Cek field wajib
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push(`Field "${field.label}" wajib diisi`);
            continue;
        }

        // Kalau kosong dan gak wajib, skip validasi tipe
        if (value === undefined || value === null || value === '') continue;

        // Validasi tipe data sesuai definisi field
        switch (field.type) {
            case 'number':
                if (typeof value !== 'number') {
                    errors.push(`Field "${field.label}" harus berupa angka`);
                }
                break;
            case 'select':
                if (field.options && !field.options.includes(value)) {
                    errors.push(`Field "${field.label}" harus salah satu dari: ${field.options.join(', ')}`);
                }
                break;
            case 'date':
                if (isNaN(Date.parse(value))) {
                    errors.push(`Field "${field.label}" harus tanggal yang valid`);
                }
                break;
            // 'text' dan tipe lain: gak perlu validasi ketat, cukup pastikan string
        }
    }

    return errors;
}

module.exports = validateAtributSpesifik;