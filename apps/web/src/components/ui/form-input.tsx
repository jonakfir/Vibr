export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}: {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div className={className}>
      {label && <label className="block font-body text-xs text-muted mb-1">{label}</label>}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-card border border-border rounded text-foreground text-sm focus:border-foreground focus:outline-none transition-colors"
        {...props}
      />
    </div>
  );
}
export default FormInput;
