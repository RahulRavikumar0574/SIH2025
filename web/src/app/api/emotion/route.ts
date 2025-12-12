import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const backend = process.env.ML_API_URL || "http://localhost:8504";

    // Forward the multipart form-data to the FastAPI backend
    const outForm = new FormData();
    const fileBlob = file as Blob;
    const fileName = (file as any)?.name || "upload.csv";
    outForm.append("file", fileBlob, fileName);

    const resp = await fetch(`${backend.replace(/\/$/, "")}/predict/`, {
      method: "POST",
      body: outForm,
    });

    const contentType = resp.headers.get("content-type") || "";
    if (!resp.ok) {
      let detail = await resp.text();
      try {
        const j = JSON.parse(detail);
        detail = j?.detail || j?.error || detail;
      } catch {}
      return NextResponse.json({ error: detail || "Upstream error" }, { status: resp.status });
    }

    if (contentType.includes("application/json")) {
      const data = await resp.json();
      return NextResponse.json(data);
    }

    // Fallback: pass through as text
    const text = await resp.text();
    return new NextResponse(text, { status: 200, headers: { "content-type": contentType || "text/plain" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to proxy to ML backend" }, { status: 500 });
  }
}
