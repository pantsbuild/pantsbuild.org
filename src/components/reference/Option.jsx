import Link from '@docusaurus/Link';

export default function Option({
  children,
  cli_repr,
  env_repr,
  one_of,
  default_repr,
  target_field_name,
  removal_version,
  removal_hint,
}) {
  return (
    <div className="margin-bottom--lg">
      <code style={{ color: "var(--pants-reference-option-repr)" }}>
        {cli_repr}
      </code>
      <br />
      <code style={{ color: "var(--pants-reference-option-repr)" }}>
        {env_repr}
      </code>
      <br />
      <div style={{ paddingLeft: "2em" }}>
        <span>
          {one_of && (
            <span>
              one of:{" "}
              <code style={{ color: "var(--ifm-color-success)" }}>
                {one_of}
              </code>
              <br />
            </span>
          )}
          default:{" "}
          <span style={{ color: "var(--ifm-color-success)" }}>
            {(default_repr || "").includes("\n") ? (
              <pre className="padding--sm">{default_repr}</pre>
            ) : (
              <code>{default_repr}</code>
            )}
          </span>
        </span>
        <br />
        {removal_version && (
          <span style={{ color: "var(--ifm-color-danger-darkest)" }}>
            Deprecated, will be removed in version: {removal_version}.
            <br />
            {removal_hint}
            <br />
          </span>
        )}
        {children}
        {target_field_name && (
          <span>
            Can be overriden by field
            <code>{target_field_name}</code> on{" "}
            <Link to="../targets/local_environment"><code>local_environment</code></Link>,{" "}
            <Link to="../targets/docker_environment"><code>docker_environment</code></Link>,{" "}
            or <Link to="../targets/remote_environment"><code>remote_environment</code></Link>
            targets.
          </span>
        )}
      </div>
    </div>
  );
}
