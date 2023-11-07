export default function Input({
  defaultValue,
  name,
  label,
  placeholder,
  type,
  value,

  onChange,
}: {
  value?: string;
  onChange?: (val: string) => void;
  defaultValue?: string;
  name: string;
  label?: string;
  placeholder?: string;
  type: string;
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        required
        className="input-component form-control"
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (onChange) {
            onChange(inputValue);
          }
        }}
      />
    </div>
  );
}
