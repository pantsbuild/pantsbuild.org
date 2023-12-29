import MDXImg from "@theme/MDXComponents/Img";

export default function CaptionedImg({ children, ...props }) {
  return (
    <div>
      <MDXImg {...props} />
      <figcaption>{children}</figcaption>
    </div>
  );
}
