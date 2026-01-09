import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "shipment_label.png";

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        // Fetch the image from S3 (server-to-server, no CORS issues)
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch image" },
                { status: response.status }
            );
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Return the image with download headers
        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": blob.type || "image/png",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": arrayBuffer.byteLength.toString()
            }
        });
    } catch (error) {
        console.error("Error proxying download:", error);
        return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
        );
    }
}
