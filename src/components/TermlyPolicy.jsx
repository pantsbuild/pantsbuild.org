import React, { useEffect } from "react";
import Layout from "@theme/Layout";

const SCRIPT_ID = "termly-jssdk";

export default function TermlyPolicy({ title, policyId }) {
  useEffect(() => {
    // Termly's script scans the page for embeds when it loads, so it is re-inserted on each
    // mount to pick up the embed after client-side navigation.
    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://app.termly.io/embed-policy.min.js";
    document.body.appendChild(script);
  }, [policyId]);

  return (
    <Layout title={title}>
      <main className="container margin-vert--lg">
        <div name="termly-embed" data-id={policyId} />
      </main>
    </Layout>
  );
}
