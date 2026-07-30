export default function DynamicFormField({ field, value, onChange }) {
    const baseClass = "w-full h-12 px-4 border border-border focus:border-amber focus:ring-1 focus:ring-amber outline-none transition-all rounded-lg text-sm";
    const labelClass = "block text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide";

    switch (field.type) {
        case 'select':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={baseClass}
                        required={field.required}
                    >
                        <option value="">Pilih {field.label}</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        case 'number':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(field.key, Number(e.target.value))}
                        className={baseClass}
                        required={field.required}
                    />
                </div>
            );
        case 'date':
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={baseClass}
                        required={field.required}
                    />
                </div>
            );
        default:
            return (
                <div>
                    <label className={labelClass}>{field.label}</label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={baseClass}
                        required={field.required}
                    />
                </div>
            );
    }
}