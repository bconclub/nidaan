export async function GET() {
  // 1. Create a simple test audio — use a public MP3 URL, download it, then upload to Meta
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Download a small test audio
  const audioRes = await fetch("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer()).slice(0, 50000); // just first 50KB

  // Upload to Meta
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "test.mp3");
  formData.append("type", "audio/mpeg");

  const uploadRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();

  // Send audio message using uploaded media ID
  const sendRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: "919353253817",
      type: "audio",
      audio: { id: uploadData.id }
    })
  });
  const sendData = await sendRes.json();

  return Response.json({ upload: uploadData, send: sendData });
}
