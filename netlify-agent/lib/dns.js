const BASE = "https://api.cloudflare.com/client/v4";

function headers() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const ZONE = () => process.env.CLOUDFLARE_ZONE_ID;

async function listRecords(name, type) {
  const res = await fetch(
    `${BASE}/zones/${ZONE()}/dns_records?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: headers() }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`CF list: ${JSON.stringify(data.errors)}`);
  return data.result;
}

export async function upsertCNAME(subdomain, rootDomain, target) {
  const fqdn = `${subdomain}.${rootDomain}`;
  const existing = await listRecords(fqdn, "CNAME");

  for (const rec of existing) {
    await fetch(`${BASE}/zones/${ZONE()}/dns_records/${rec.id}`, {
      method: "DELETE",
      headers: headers(),
    });
    console.log(`  CF: removed old CNAME for ${fqdn}`);
  }

  const res = await fetch(`${BASE}/zones/${ZONE()}/dns_records`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type:    "CNAME",
      name:    fqdn,
      content: target,
      proxied: false,   // must be false — Netlify handles TLS
      ttl:     1,       // auto
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`CF create CNAME: ${JSON.stringify(data.errors)}`);
  console.log(`  CF: CNAME ${fqdn} → ${target}`);
}
