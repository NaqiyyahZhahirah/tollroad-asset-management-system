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
                        className={`w-full h-12 pl-4 pr-10 border border-border focus:border-amber outline-none rounded-lg text-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.75rem_center] bg-no-repeat transition-colors ${!value ? 'text-text-muted' : 'text-navy'}`}
                        required={field.required}
                    >
                        <option value="" disabled hidden>Pilih {field.label}</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt} className="text-navy">{opt}</option>
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
                        onWheel={(e) => e.target.blur()}
                        value={value !== undefined && value !== null ? value : ''}
                        onChange={(e) => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
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
                        value={value ? String(value).substring(0, 10) : ''}
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
                        value={value !== undefined && value !== null ? value : ''}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={baseClass}
                        required={field.required}
                    />
                </div>
            );
    }
}