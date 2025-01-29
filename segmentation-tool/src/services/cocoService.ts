// cocoService.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateCOCOOnServer(cocoJSON: any) {
	// Chama a API Flask que você passou:
	const response = await fetch("http://localhost:5002/validate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(cocoJSON),
	});

	const data = await response.json();
	// Retorna o resultado (pode ser "Success" ou "Validation error" etc.)
	return { status: response.status, data };
}
