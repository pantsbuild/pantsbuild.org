/*
A remark plugin to allow codeblocks to have a caption="..." meta which translates to `<figcaption>`
after the codeblock.

E.g.

  ```py caption="A code snippet"
  import everything
  ```

is equivalent to

  ```py
  import everything
  ```

  <figcaption>A code snippet</figcaption>
*/
import { visit } from "unist-util-visit";

const plugin = () => {
  return (tree, file) => {
    visit(tree, "code", (node, index, parent) => {
      const metaString = `${node.lang ?? ""} ${node.meta ?? ""}`.trim();
      if (!metaString) return;
      const [caption] = metaString.match(
        /(?<=caption=("|'))(.*?)(?=("|'))/
      ) ?? [""];
      if (!caption && metaString.includes("caption=")) {
        file.message("Invalid caption", node, "remark-code-caption");
        return;
      }
      if (!caption) return;

      const captionNode = {
        type: "paragraph",
        data: {
          hName: "figcaption",
          hProperties: {
            "data-remark-code-caption": true,
          },
        },
        children: [{ type: "mdxText", value: caption }],
      };
      parent.children.splice(index + 1, 0, captionNode);
      /* Skips this and the code nodes */
      return index + 2;
    });
  };
};

export default plugin;
