import CodeBlock from "@theme/CodeBlock";
export default function BuildFileSymbol({ name, signature, children }) {
  return (
    <div className="margin-bottom--lg">
      <CodeBlock language="python">
        {/* if there's no signature, the BUILD file symbol is just a constant... but we don't currently have any info about what that constant is */}
        {signature ? `def ${name}${signature}: ...` : `${name} = ...`}
      </CodeBlock>
      {children}
    </div>
  );
}
