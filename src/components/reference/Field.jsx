export default function Field({
  children,
  type_repr,
  default_repr,
  backend
}) {
  return (
    <div className="margin-bottom--lg">
      <code style={{ color: "var(--pants-reference-option-repr)"}}>{type_repr}</code>
      <br/>
      <div style={{ paddingLeft: "2em" }}>
        {default_repr &&
          <span>
            default: <code style={{ color: "var(--ifm-color-success)" }}>{default_repr}</code>
          </span>
        }
        {
          !default_repr &&
          <span style={{ color: "var(--ifm-color-success)" }}>required</span>
        }
        {
          backend &&
          <div>
            backend: <code style={{ color: "var(--ifm-color-success)" }}>{backend}</code>
          </div>
        }

        {children}
      </div>
    </div>
  );
}
