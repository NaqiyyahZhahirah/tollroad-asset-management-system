const supabase = require('../config/supabase');

async function uploadFoto(req, res) {
    const { aset_id, keterangan, uploaded_by } = req.body;
    const file = req.file; // dari multer

    if (!file) {
        return res.status(400).json({ error: 'File foto wajib diupload' });
    }
    if (!aset_id || !uploaded_by) {
        return res.status(400).json({ error: 'aset_id dan uploaded_by wajib diisi' });
    }

    // Nama file unik: asetId_timestamp.ext
    const ext = file.originalname.split('.').pop();
    const fileName = `${aset_id}_${Date.now()}.${ext}`;
    const filePath = `${aset_id}/${fileName}`;

    // Upload ke Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('foto-aset')
        .upload(filePath, file.buffer, {
            contentType: file.mimetype
        });

    if (uploadError) {
        return res.status(500).json({ error: uploadError.message });
    }

    // Ambil public URL-nya
    const { data: urlData } = supabase.storage
        .from('foto-aset')
        .getPublicUrl(filePath);

    // Simpan record ke tabel foto_aset
    const { data, error } = await supabase
        .from('foto_aset')
        .insert([{
            aset_id,
            url_foto: urlData.publicUrl,
            keterangan: keterangan || null,
            uploaded_by
        }])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ data });
}

async function getFotoByAsetId(req, res) {
    const { aset_id } = req.params;

    const { data, error } = await supabase
        .from('foto_aset')
        .select('*')
        .eq('aset_id', aset_id)
        .order('uploaded_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ data });
}

module.exports = { uploadFoto, getFotoByAsetId };