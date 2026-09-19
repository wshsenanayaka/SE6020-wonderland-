export default function FormInput({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <label>
      {label}
      <input
        required
        disabled={disabled}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
